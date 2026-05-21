from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


CAMPAIGN_COST = 3
CAMPAIGN_REVENUE = 11
ROI_THRESHOLD = CAMPAIGN_COST / CAMPAIGN_REVENUE


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, sep="\t")
    if "Response" not in df.columns:
        raise ValueError("The source data must include a Response column.")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    amount_cols = [c for c in out.columns if c.startswith("Mnt")]
    purchase_cols = [
        c
        for c in out.columns
        if c.startswith("Num") and c != "NumWebVisitsMonth"
    ]
    accepted_cols = [c for c in out.columns if c.startswith("AcceptedCmp")]

    out["TotalSpend"] = out[amount_cols].sum(axis=1)
    out["TotalPurchases"] = out[purchase_cols].sum(axis=1)
    out["PriorAccepted"] = out[accepted_cols].sum(axis=1)
    out["HasChildren"] = ((out["Kidhome"] + out["Teenhome"]) > 0).astype(int)
    out["Age"] = 2014 - out["Year_Birth"]

    signup = pd.to_datetime(out["Dt_Customer"], dayfirst=True, errors="coerce")
    out["CustomerDays"] = (signup.max() - signup).dt.days
    out = out.drop(columns=["Dt_Customer"])

    return out


def build_model(numeric_cols: list[str], categorical_cols: list[str]) -> Pipeline:
    numeric_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("one_hot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        [
            ("num", numeric_pipeline, numeric_cols),
            ("cat", categorical_pipeline, categorical_cols),
        ]
    )

    return Pipeline(
        [
            ("preprocessor", preprocessor),
            (
                "model",
                LogisticRegression(
                    max_iter=3000,
                    class_weight="balanced",
                    solver="liblinear",
                    random_state=42,
                ),
            ),
        ]
    )


def evaluate(y_true: pd.Series, probabilities: np.ndarray) -> dict[str, object]:
    pred_05 = (probabilities >= 0.5).astype(int)
    pred_roi = (probabilities >= ROI_THRESHOLD).astype(int)

    return {
        "auc": roc_auc_score(y_true, probabilities),
        "accuracy_at_0_50": accuracy_score(y_true, pred_05),
        "precision_at_0_50": precision_score(y_true, pred_05, zero_division=0),
        "recall_at_0_50": recall_score(y_true, pred_05, zero_division=0),
        "recommended_rate_at_roi_threshold": pred_roi.mean(),
        "precision_at_roi_threshold": precision_score(y_true, pred_roi, zero_division=0),
        "recall_at_roi_threshold": recall_score(y_true, pred_roi, zero_division=0),
        "expected_profit_per_customer_at_roi_threshold": (
            probabilities[pred_roi == 1] * CAMPAIGN_REVENUE - CAMPAIGN_COST
        ).mean()
        if pred_roi.sum() > 0
        else 0.0,
        "confusion_matrix_at_0_50": confusion_matrix(y_true, pred_05).tolist(),
        "confusion_matrix_at_roi_threshold": confusion_matrix(y_true, pred_roi).tolist(),
    }


def feature_coefficients(model: Pipeline) -> pd.DataFrame:
    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["model"]
    names = preprocessor.get_feature_names_out()

    return (
        pd.DataFrame({"feature": names, "coefficient": classifier.coef_[0]})
        .assign(abs_coefficient=lambda d: d["coefficient"].abs())
        .sort_values("abs_coefficient", ascending=False)
        .drop(columns=["abs_coefficient"])
    )


def build_report(
    source_path: Path,
    output_dir: Path,
    df: pd.DataFrame,
    metrics: dict[str, object],
    coefficients: pd.DataFrame,
) -> str:
    top_positive = coefficients.sort_values("coefficient", ascending=False).head(8)
    top_negative = coefficients.sort_values("coefficient").head(8)

    lines = [
        "# 营销活动响应预测模型",
        "",
        "## 模型目标",
        "预测客户是否会响应营销活动，并根据预期收益决定是否建议投放。",
        "",
        "## 数学模型",
        "采用逻辑回归：",
        "",
        "```text",
        "P(Response = 1) = 1 / (1 + exp(-(b0 + b1*x1 + b2*x2 + ... + bn*xn)))",
        "```",
        "",
        f"若 `11 * P(Response = 1) - 3 > 0`，则建议投放。",
        f"因此投放阈值为 `{ROI_THRESHOLD:.1%}`。",
        "",
        "## 数据概况",
        f"- 数据来源：`{source_path}`",
        f"- 样本量：{len(df):,}",
        f"- 实际响应率：{df['Response'].mean():.1%}",
        f"- 收入缺失值：{df['Income'].isna().sum()} 条，模型使用中位数填补。",
        "",
        "## 测试集效果",
        f"- AUC：{metrics['auc']:.3f}",
        f"- 0.50 阈值准确率：{metrics['accuracy_at_0_50']:.1%}",
        f"- 0.50 阈值精确率：{metrics['precision_at_0_50']:.1%}",
        f"- 0.50 阈值召回率：{metrics['recall_at_0_50']:.1%}",
        f"- 收益阈值建议投放比例：{metrics['recommended_rate_at_roi_threshold']:.1%}",
        f"- 收益阈值精确率：{metrics['precision_at_roi_threshold']:.1%}",
        f"- 收益阈值召回率：{metrics['recall_at_roi_threshold']:.1%}",
        "",
        "## 主要正向因素",
    ]

    for _, row in top_positive.iterrows():
        lines.append(f"- {row['feature']}: {row['coefficient']:.3f}")

    lines.extend(["", "## 主要负向因素"])
    for _, row in top_negative.iterrows():
        lines.append(f"- {row['feature']}: {row['coefficient']:.3f}")

    lines.extend(
        [
            "",
            "## 输出文件",
            f"- `customer_scores.csv`：每个客户的响应概率、预期利润和投放建议。",
            f"- `feature_coefficients.csv`：模型系数，用来解释变量方向。",
            f"- `model_metrics.csv`：模型评估指标。",
            f"- `marketing_response_model.joblib`：可复用的训练后模型。",
            "",
            "## 使用建议",
            "优先投放 `RecommendContact = Yes` 且 `ResponseProbability` 最高的客户；预算有限时，直接按概率从高到低截取客户名单。",
        ]
    )

    report = "\n".join(lines) + "\n"
    (output_dir / "model_report.md").write_text(report, encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        default=Path(r"C:\Users\wangjunyi\Desktop\marketing_campaign.csv"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("outputs") / "marketing_response_model",
    )
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)

    raw = load_data(args.input)
    modeled = engineer_features(raw)

    drop_cols = ["Response", "ID", "Z_CostContact", "Z_Revenue"]
    X = modeled.drop(columns=[c for c in drop_cols if c in modeled.columns])
    y = modeled["Response"]

    categorical_cols = X.select_dtypes(include=["object", "string"]).columns.tolist()
    numeric_cols = X.columns.difference(categorical_cols).tolist()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model = build_model(numeric_cols, categorical_cols)
    model.fit(X_train, y_train)

    test_prob = model.predict_proba(X_test)[:, 1]
    metrics = evaluate(y_test, test_prob)

    final_model = build_model(numeric_cols, categorical_cols)
    final_model.fit(X, y)
    all_prob = final_model.predict_proba(X)[:, 1]

    scores = raw[["ID", "Response"]].copy()
    scores["ResponseProbability"] = all_prob
    scores["ExpectedProfit"] = all_prob * CAMPAIGN_REVENUE - CAMPAIGN_COST
    scores["RecommendContact"] = np.where(
        scores["ResponseProbability"] >= ROI_THRESHOLD, "Yes", "No"
    )
    scores = scores.sort_values("ResponseProbability", ascending=False)
    scores.to_csv(args.output_dir / "customer_scores.csv", index=False, encoding="utf-8-sig")

    coefficients = feature_coefficients(final_model)
    coefficients.to_csv(
        args.output_dir / "feature_coefficients.csv",
        index=False,
        encoding="utf-8-sig",
    )

    metrics_for_csv = {
        key: value
        for key, value in metrics.items()
        if not key.startswith("confusion_matrix")
    }
    pd.DataFrame([metrics_for_csv]).to_csv(
        args.output_dir / "model_metrics.csv",
        index=False,
        encoding="utf-8-sig",
    )

    joblib.dump(
        {
            "model": final_model,
            "numeric_cols": numeric_cols,
            "categorical_cols": categorical_cols,
            "roi_threshold": ROI_THRESHOLD,
            "campaign_cost": CAMPAIGN_COST,
            "campaign_revenue": CAMPAIGN_REVENUE,
        },
        args.output_dir / "marketing_response_model.joblib",
    )

    build_report(args.input, args.output_dir, raw, metrics, coefficients)

    print(f"Saved outputs to {args.output_dir.resolve()}")
    print(f"AUC: {metrics['auc']:.3f}")
    print(f"ROI threshold: {ROI_THRESHOLD:.3f}")
    print(
        "Recommended customers:",
        int((scores["RecommendContact"] == "Yes").sum()),
        "of",
        len(scores),
    )


if __name__ == "__main__":
    main()

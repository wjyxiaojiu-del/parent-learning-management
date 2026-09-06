# 家长学习管理台 网页版 —— OpenDeploy 部署镜像
# 根目录为 web/，backend + frontend 一起打包，单服务运行。
FROM node:20-bookworm

WORKDIR /app

# 先装后端依赖（利用层缓存）。强制清掉可能混入的本机 node_modules（含 Windows
# 原生模块），用 lockfile 干净安装，保证 better-sqlite3 等原生模块匹配 Linux。
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && rm -rf node_modules && npm ci --omit=dev

# 拷贝其余源码
COPY backend ./backend
COPY frontend ./frontend

# 持久卷挂载点：预建并交给非 root 用户，保证容器能向 /data 写 SQLite 文件。
# （平台挂载持久卷后，目录属主需可写，否则 better-sqlite3 打开库文件会失败。）
RUN mkdir -p /data && chown -R node:node /data /app

ENV NODE_ENV=production
ENV DB_PATH=/data/data.db

USER node
EXPOSE 3000
CMD ["node", "backend/server.js"]

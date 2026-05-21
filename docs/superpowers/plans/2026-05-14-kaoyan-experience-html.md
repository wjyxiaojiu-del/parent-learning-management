# Kaoyan Experience HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static HTML presentation for a 20-minute method-oriented postgraduate exam experience share.

**Architecture:** A single self-contained HTML file will contain the slide content, CSS, and JavaScript navigation. The design follows the Blue Professional template palette and typography while using custom Chinese content based on the user's daily review evidence.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Google Fonts.

---

### Task 1: Create The Static Deck

**Files:**
- Create: `C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-experience-share.html`

- [ ] **Step 1: Create the HTML deck**

Add a full HTML document with:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>后期启动，也要打清醒仗</title>
</head>
<body>
  <main class="deck">
    <section class="slide active"></section>
  </main>
</body>
</html>
```

- [ ] **Step 2: Add Blue Professional styling**

Use `#FDFAE7` as the background, `#1E2BFA` as the primary color, and Space Grotesk/Inter as fonts. Add stable full-screen slide dimensions, responsive grids, and no more than five main content blocks per slide.

- [ ] **Step 3: Add navigation**

Implement left/right arrow navigation, slide counter, progress bar, and speaker notes toggle with vanilla JavaScript.

- [ ] **Step 4: Add the 12 slides**

Add the approved 12-slide content:

1. Cover.
2. Case value.
3. Closed-loop model.
4. Stage 1.
5. Stage 2.
6. Stage 3.
7. Daily schedule.
8. Professional courses.
9. English and politics.
10. Tools and resources.
11. Avoidance checklist.
12. Action checklist.

### Task 2: Verify The Deck

**Files:**
- Verify: `C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-experience-share.html`

- [ ] **Step 1: Check file exists and has expected content**

Run:

```powershell
Test-Path -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-experience-share.html'
Select-String -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-experience-share.html' -Pattern '后期启动，也要打清醒仗','14/138','F:\小九\小九的obisidian\01-daily\2025年每日复盘'
```

Expected: `True` and matches for all three strings.

- [ ] **Step 2: Browser smoke test**

Use a local static server and a browser automation screenshot to verify the first slide renders and navigation works.

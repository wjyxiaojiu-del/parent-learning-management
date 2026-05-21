# Kaoyan Sharing Optimized Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an optimized HTML deck that combines the user's original personal deck with the method-oriented deck.

**Architecture:** Use `outputs/kaoyan-experience-share.html` as the stable technical base, then incorporate selected content from `C:\Users\wangjunyi\kaoyan-sharing.html`: body management, resource/blogger details, regret-index pitfalls, and the final quote. Output a separate static HTML file so no source deck is overwritten.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Google Fonts, Chrome/Playwright screenshot verification.

---

### Task 1: Create The Optimized Deck

**Files:**
- Create: `C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html`

- [x] **Step 1: Copy the stable method deck as the base**

Run:

```powershell
Copy-Item -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-experience-share.html' -Destination 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html' -Force
```

- [x] **Step 2: Add fusion CSS**

Add card grids for health management, resource classification, regret-index bars, and final-message quote blocks.

- [x] **Step 3: Replace and add content**

Change the cover subtitle, add the body-and-mind slide, expand the tools/resources slide, rewrite the pitfalls slide as a regret index, and enrich the final action slide with the user's quote.

### Task 2: Verify The Optimized Deck

**Files:**
- Verify: `C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html`

- [ ] **Step 1: Structural check**

Check that the optimized file exists, has 13 slides, and contains key strings:

```powershell
Test-Path -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html'
(Select-String -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html' -Pattern '<section class="slide' | Measure-Object).Count
Select-String -LiteralPath 'C:\Users\wangjunyi\Documents\New project\outputs\kaoyan-sharing-optimized.html' -Pattern '身体管理不是鸡汤','我踩过的5个坑','你不敢面对的东西' -SimpleMatch
```

- [ ] **Step 2: Browser screenshot check**

Use Chrome through Playwright CLI to render the cover, body management slide, tools slide, pitfalls slide, and final slide.

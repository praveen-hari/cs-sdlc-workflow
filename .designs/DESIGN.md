---
version: alpha
name: "Code Studio Dark"
description: "VS Code / Code Studio native dark theme design system for editor extensions, webview panels, and tool UIs."

colors:
  primary: "#CCCCCC"
  secondary: "#858585"
  accent: "#0078D4"
  background: "#1E1E1E"
  surface: "#252526"
  border: "#3C3C3C"
  success: "#4EC9B0"
  warning: "#CCA700"
  error: "#F14C4C"
  info: "#3794FF"
  focusBorder: "#007FD4"
  inputBackground: "#3C3C3C"
  sidebarBackground: "#252526"
  editorBackground: "#1E1E1E"
  activityBarBackground: "#333333"
  statusBarBackground: "#007ACC"
  badgeBackground: "#4D4D4D"
  listHoverBackground: "#2A2D2E"
  listActiveBackground: "#094771"
  buttonBackground: "#0E639C"
  buttonHoverBackground: "#1177BB"
  linkForeground: "#3794FF"
  descriptionForeground: "#858585"

colors-dark:
  primary: "#CCCCCC"
  secondary: "#858585"
  accent: "#0078D4"
  background: "#1E1E1E"
  surface: "#252526"
  border: "#3C3C3C"
  success: "#4EC9B0"
  warning: "#CCA700"
  error: "#F14C4C"

typography:
  h1:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0em"
  h2:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0em"
  h3:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  h4:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  small:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5

rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  full: "9999px"

spacing:
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  3xl: "24px"

components:
  button:
    backgroundColor: "{colors.buttonBackground}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "4px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px"
  input:
    backgroundColor: "{colors.inputBackground}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  badge:
    backgroundColor: "{colors.badgeBackground}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "3px 6px"
  list-item:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  sidebar-section:
    backgroundColor: "{colors.sidebarBackground}"
    textColor: "{colors.primary}"
    rounded: "0"
    padding: "0"
---

# Code Studio Dark

## Overview

Code Studio Dark is a design system that mirrors the native VS Code / Code Studio dark theme. It ensures extension webviews, panels, and tool UIs feel like a seamless part of the editor — not a foreign embedded page. Every color, font size, spacing value, and interaction pattern matches what developers already see in their editor.

**Mood:** Native, integrated, developer-focused, familiar.
**Best for:** VS Code/Code Studio extensions, webview panels, sidebar views, editor tool UIs.

## Colors

The palette is derived directly from VS Code's Dark+ theme. The goal is **zero visual friction** — the extension UI should be indistinguishable from native editor chrome.

- **Primary (#CCCCCC):** All body text, labels, tree view items. Matches `editor.foreground`.
- **Secondary (#858585):** Descriptions, hints, disabled text. Matches `descriptionForeground`.
- **Accent (#0078D4):** Primary buttons, active selections, focus indicators. Matches `button.background`.
- **Background (#1E1E1E):** Main editor/webview background. Matches `editor.background`.
- **Surface (#252526):** Sidebar panels, secondary areas, cards. Matches `sideBar.background`.
- **Border (#3C3C3C):** All dividers, panel borders, input borders. Matches `panel.border`.
- **Success (#4EC9B0):** Success states, green indicators. Matches VS Code's teal-green.
- **Warning (#CCA700):** Warning badges, caution states. Matches `editorWarning.foreground`.
- **Error (#F14C4C):** Error states, destructive actions. Matches `editorError.foreground`.
- **Info (#3794FF):** Links, informational highlights. Matches `textLink.foreground`.

### Extended Palette (VS Code-specific)
- **Focus Border (#007FD4):** Focus rings on all interactive elements.
- **Input Background (#3C3C3C):** Text inputs, dropdowns, search boxes.
- **List Hover (#2A2D2E):** Hover state for list/tree items.
- **List Active (#094771):** Selected/active list item background.
- **Button (#0E639C):** Primary button background.
- **Button Hover (#1177BB):** Primary button hover state.
- **Status Bar (#007ACC):** Status bar background accent.
- **Badge (#4D4D4D):** Count badges, notification indicators.

## Typography

VS Code uses the system UI font stack — **not** a custom web font. This keeps the extension feeling native. Font sizes are compact: 13px body, 11–12px for secondary text. Headings are restrained — the largest is 26px (used sparingly for page titles in webviews).

- **Body (13px):** The standard size for all UI text. Matches editor sidebar, panels, and dialogs.
- **Small (12px):** Descriptions, secondary labels, timestamps.
- **Caption (11px):** Badges, status indicators, compact metadata.
- **Code:** Monospace font stack for code snippets, file paths, and technical values.

> **Never use fonts larger than 26px.** VS Code UIs are information-dense, not marketing pages.

## Layout

VS Code uses a **compact 4px base grid** — much tighter than typical web design. Padding is minimal. Information density is high. Whitespace is used strategically, not generously.

- **Panel padding:** 8–12px internal padding.
- **Section gaps:** 12–16px between groups.
- **List item height:** 22px (matching native tree views).
- **Input height:** 24–26px.
- **Button height:** 26px.
- **Sidebar width:** 300px default, resizable.

## Elevation & Depth

VS Code uses **no box shadows** for most UI. Depth is communicated through background color layering:

- **Level 0 (#1E1E1E):** Editor background — the deepest layer.
- **Level 1 (#252526):** Sidebar, panels — slightly elevated.
- **Level 2 (#333333):** Activity bar, hover states — another step up.
- **Level 3 (#3C3C3C):** Input backgrounds, dropdown menus — topmost layer.

Shadows are only used for floating elements:
- **Dropdown/Menu:** `0 2px 8px rgba(0,0,0,0.36)` — context menus, dropdowns.
- **Modal/Dialog:** `0 0 8px 2px rgba(0,0,0,0.36)` — modal overlays.

## Shapes

VS Code uses **minimal rounding**. Most elements are nearly square. This matches the editor's utilitarian aesthetic.

- **Buttons/Inputs:** 2–4px radius.
- **Cards/Panels:** 4–6px radius.
- **Badges/Tags:** Full rounding (pill shape).
- **No rounding:** Tab bars, status bar, activity bar.

## Components

### Buttons
- **Primary:** #0E639C background, white text, 4px radius, 4px 14px padding, 26px height.
- **Secondary:** Transparent background, 1px #3C3C3C border, #CCCCCC text.
- **Icon Button:** No background, no border, icon only, hover shows #2A2D2E background.
- **Disabled:** 40% opacity, no pointer events.
- **Hover:** Primary → #1177BB, Secondary → #2A2D2E background.
- **Focus:** 1px #007FD4 outline (focus border).

### Cards / Panels
- #252526 background, 1px #3C3C3C border, 6px radius.
- 12px internal padding.
- No shadow — depth via background color only.

### Inputs
- #3C3C3C background, 1px #3C3C3C border, 4px radius, 24px height.
- Placeholder text: #858585.
- Focus state: 1px #007FD4 border (replaces default border).
- Error state: 1px #F14C4C border.

### Tree Views / Lists
- No background on items (transparent).
- Hover: #2A2D2E background.
- Selected: #094771 background.
- Active: #094771 background + #007FD4 left border (2px).
- Item height: 22px. Icon + label layout.
- Indent guides: 1px #3C3C3C lines.

### Tabs
- Inactive: #2D2D2D background, #858585 text.
- Active: #1E1E1E background (matches editor), #CCCCCC text, top border #007ACC.
- Hover: #2A2D2E background.

### Badges
- #4D4D4D background, white text, pill shape, 3px 6px padding, 11px font.
- Activity bar badges: #007ACC background.

### Dropdowns / Select
- Same styling as inputs (#3C3C3C background, #3C3C3C border).
- Dropdown menu: #252526 background, `0 2px 8px rgba(0,0,0,0.36)` shadow.
- Menu items: 22px height, hover #094771.

### Tooltips
- #252526 background, 1px #454545 border, `0 2px 8px rgba(0,0,0,0.36)` shadow.
- 13px text, 4px 8px padding.

### Progress Indicators
- Track: #3C3C3C.
- Fill: #0078D4 (accent).
- Indeterminate: animated gradient.

## Do's and Don'ts

**Do:**
- Match VS Code's native look — the extension should feel built-in, not bolted-on.
- Use the compact spacing scale (4px base grid).
- Keep font sizes small (13px body, 11–12px secondary).
- Use background color layering for depth instead of shadows.
- Follow VS Code's interaction patterns: hover → #2A2D2E, selected → #094771, focus → #007FD4 border.
- Use codicons (VS Code's icon font) for all icons.
- Test in both Dark+ and Light+ themes.

**Don't:**
- Don't use custom web fonts — stick to the system font stack.
- Don't use large headings (>26px) — this isn't a marketing page.
- Don't use heavy shadows — VS Code is flat.
- Don't use bright/saturated background colors — keep surfaces dark and muted.
- Don't add excessive padding — VS Code UIs are information-dense.
- Don't use rounded corners larger than 8px.
- Don't use gradients or decorative elements.

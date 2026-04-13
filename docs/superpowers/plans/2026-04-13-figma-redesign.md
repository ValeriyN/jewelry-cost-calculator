# Figma Make Gold/Dark Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the purple/glassmorphism visual theme with the gold/flat-dark aesthetic from the Figma Make design.

**Architecture:** Option A — swap color hex values in `tailwind.config.js` so all components inherit the new palette automatically, then apply targeted structural edits to the 7 components that need layout changes. No new files. Ukrainian i18n strings preserved throughout.

**Tech Stack:** React, TypeScript, Tailwind CSS v3, Vite

---

## File Map

| File | Change type |
|---|---|
| `client/tailwind.config.js` | New color palette + glow utilities |
| `client/src/index.css` | Body bg + text color |
| `client/src/components/ui/Button.tsx` | Primary variant: text color + hover |
| `client/src/components/layout/BottomNav.tsx` | Active indicator: pill → top bar; nav bg |
| `client/src/components/layout/AppShell.tsx` | Max-width |
| `client/src/pages/Login.tsx` | Remove glassmorphism wrapper |
| `client/src/pages/Register.tsx` | Remove glassmorphism wrapper |
| `client/src/components/features/ComponentCard.tsx` | Rename glow class |
| `client/src/components/layout/PageHeader.tsx` | Remove backdrop-blur |

---

## Task 1: Update color tokens and utilities in tailwind.config.js

**Files:**
- Modify: `client/tailwind.config.js`

- [ ] **Step 1: Replace the file content**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#fdf9e7",
          100: "#faf0c0",
          200: "#f5e088",
          300: "#e8d087",
          400: "#d4af37",
          500: "#c9a520",
          600: "#b8960a",
          700: "#a07e08",
          800: "#886a06",
          900: "#6e5605",
        },
        surface: {
          950: "#05050a",
          900: "#0a0a0f",
          800: "#141419",
          700: "#1f1f24",
          600: "#252529",
          500: "#3a3a40",
          400: "#9494a0",
          300: "#b8b8c0",
          200: "#d4d4dc",
          100: "#e8e8ee",
        },
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        ".pb-safe": { "padding-bottom": "env(safe-area-inset-bottom)" },
        ".pt-safe": { "padding-top": "env(safe-area-inset-top)" },
        ".tap-target": { "min-height": "44px", "min-width": "44px" },
        ".glow-gold":    { "box-shadow": "0 0 20px rgba(212,175,55,0.4)" },
        ".glow-gold-sm": { "box-shadow": "0 0 10px rgba(212,175,55,0.3)" },
      });
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
cd client && npx tsc --noEmit
git add client/tailwind.config.js
git commit -m "feat: swap color tokens to gold/dark palette"
```

---

## Task 2: Update global CSS body colors

**Files:**
- Modify: `client/src/index.css`

- [ ] **Step 1: Update the two hex values in the body rule**

Change:
```css
body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0d1117;
  color: #e2e9f0;
}
```

To:
```css
body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0a0a0f;
  color: #e8e8ee;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/index.css
git commit -m "feat: update body background and text to gold theme values"
```

---

## Task 3: Update Button primary variant

**Files:**
- Modify: `client/src/components/ui/Button.tsx`

- [ ] **Step 1: Update the variantClasses map**

Change the `primary` entry from:
```ts
primary:
  "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-md hover:glow-purple-sm",
```

To:
```ts
primary:
  "bg-primary-600 text-surface-950 hover:opacity-90 active:opacity-80 shadow-md",
```

The text changes from `text-white` to `text-surface-950` because gold (`#b8960a`) needs dark text for contrast. `hover:glow-purple-sm` is removed — no glow on buttons per the new design.

- [ ] **Step 2: Verify type-check passes**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/Button.tsx
git commit -m "feat: update Button primary variant for gold theme"
```

---

## Task 4: Restyle BottomNav active indicator

**Files:**
- Modify: `client/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Replace the file content**

```tsx
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function ComponentsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? "text-primary-400" : "text-surface-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ProductsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? "text-primary-400" : "text-surface-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4H5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3v4h4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6M9 15h4" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? "text-primary-400" : "text-surface-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-800 border-t border-surface-600 pb-safe z-10">
      <div className="flex items-center justify-around h-16 max-w-[375px] mx-auto">
        {(
          [
            { to: "/components", label: t("nav.components"), Icon: ComponentsIcon },
            { to: "/products", label: t("nav.products"), Icon: ProductsIcon },
            { to: "/settings", label: t("nav.settings"), Icon: SettingsIcon },
          ] as const
        ).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary-400 rounded-b-full" />
                )}
                <Icon active={isActive} />
                <span className={`text-xs font-medium ${isActive ? "text-primary-400" : "text-surface-400"}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

Key changes from original:
- `nav`: `bg-surface-900/80 backdrop-blur-xl` → `bg-surface-800` (solid, no blur)
- `div` inside nav: added `h-16 max-w-[375px] mx-auto`
- `NavLink`: `flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-all min-w-[60px]` → `flex flex-col items-center justify-center flex-1 h-full gap-1 relative`
- Removed inner pill `<div>` with `bg-primary-600/15 glow-gold-sm rounded-2xl`
- Added conditional top bar `<div>` with `absolute top-0` positioning

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/BottomNav.tsx
git commit -m "feat: replace BottomNav pill indicator with top bar"
```

---

## Task 5: Update AppShell max-width

**Files:**
- Modify: `client/src/components/layout/AppShell.tsx`

- [ ] **Step 1: Change max-width**

Change:
```tsx
<div className="flex flex-col min-h-dvh max-w-lg mx-auto bg-surface-900">
```

To:
```tsx
<div className="flex flex-col min-h-dvh max-w-[375px] mx-auto bg-surface-900">
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/AppShell.tsx
git commit -m "feat: constrain AppShell to 375px mobile width"
```

---

## Task 6: Remove glassmorphism from Login

**Files:**
- Modify: `client/src/pages/Login.tsx`

- [ ] **Step 1: Replace the JSX return**

The logic (state, handlers, hooks) stays identical. Only the JSX returned changes. Replace everything from `return (` to the end of the function:

```tsx
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-surface-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">Калькулятор вартості</h1>
          <p className="text-sm text-surface-400">Ювелірні вироби</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("auth.loginBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-surface-400">
          {t("auth.noAccount")}{" "}
          <Link to="/register" className="text-primary-400 font-medium hover:text-primary-300">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
```

Changes from original:
- Outer `div`: removed `relative`, `overflow-hidden`; changed `bg-surface-950` → `bg-surface-900`
- Removed radial gradient `<div>`
- Inner wrapper: removed `relative`; changed classes to `w-full max-w-sm space-y-8`
- Logo section: `text-center mb-8` wrapper → `flex flex-col items-center gap-3`
- Logo icon bg: `bg-primary-600/20 ring-1 ring-primary-500/30` → `bg-primary-600` (solid gold)
- Logo SVG color: `text-primary-400` → `text-surface-950` (dark on gold)
- Form: removed `bg-surface-800/60 backdrop-blur-md rounded-2xl shadow-2xl border border-surface-600 p-6`; kept `flex flex-col gap-4`
- Link paragraph: removed `mt-4`

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Login.tsx
git commit -m "feat: remove Login glassmorphism, flat gold design"
```

---

## Task 7: Remove glassmorphism from Register

**Files:**
- Modify: `client/src/pages/Register.tsx`

- [ ] **Step 1: Replace the JSX return**

Logic stays identical. Replace everything from `return (` to end:

```tsx
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-surface-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-surface-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-100">{t("auth.register")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            hint="Мінімум 6 символів"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t("auth.registerBtn")}
          </Button>
        </form>

        <p className="text-center text-sm text-surface-400">
          {t("auth.hasAccount")}{" "}
          <Link to="/login" className="text-primary-400 font-medium hover:text-primary-300">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
```

- [ ] **Step 2: Type-check**

```bash
cd client && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Register.tsx
git commit -m "feat: remove Register glassmorphism, flat gold design"
```

---

## Task 8: Rename glow utility in ComponentCard

**Files:**
- Modify: `client/src/components/features/ComponentCard.tsx`

- [ ] **Step 1: Replace both glow class names**

Change:
```tsx
selected
  ? "border-primary-500 ring-2 ring-primary-400 shadow-lg glow-purple bg-surface-800"
  : "border-surface-600 shadow-lg bg-surface-800 hover:border-surface-500 hover:bg-surface-700/60"
```

To:
```tsx
selected
  ? "border-primary-500 ring-2 ring-primary-400 shadow-lg glow-gold bg-surface-800"
  : "border-surface-600 shadow-lg bg-surface-800 hover:border-surface-500 hover:bg-surface-700/60"
```

And change the selection checkmark div:
```tsx
<div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center shadow glow-purple-sm">
```

To:
```tsx
<div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center shadow glow-gold-sm">
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/features/ComponentCard.tsx
git commit -m "feat: rename glow-purple to glow-gold in ComponentCard"
```

---

## Task 9: Remove backdrop-blur from PageHeader

**Files:**
- Modify: `client/src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Update header classes**

Change:
```tsx
<header className="sticky top-0 z-10 bg-surface-900/80 backdrop-blur border-b border-surface-700 px-4 py-3 flex items-center gap-3">
```

To:
```tsx
<header className="sticky top-0 z-10 bg-surface-900 border-b border-surface-600 px-4 py-3 flex items-center gap-3">
```

Changes: `bg-surface-900/80 backdrop-blur` → `bg-surface-900` (solid, no blur); `border-surface-700` → `border-surface-600` (matches Figma `--border: #252529` = surface-600).

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/PageHeader.tsx
git commit -m "feat: remove PageHeader backdrop-blur, solid surface"
```

---

## Task 10: Visual smoke test

- [ ] **Step 1: Start dev servers**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Check each screen**

Visit each route and verify:

| Route | What to check |
|---|---|
| `/login` | Gold icon on dark bg, no glass card, gold "Sign in" button with dark text |
| `/register` | Same as login |
| `/components` | Gold category pills, gold "+ add" button, gold price badge on cards |
| `/products` | Gold price text on product cards, gold "+ add" button |
| `/settings` | Gold "Save" button with dark text, dark red logout button |
| Any inner page | PageHeader has solid dark bg (no blur), bottom nav shows gold top-bar on active tab |

- [ ] **Step 3: Check bottom nav active state**

Navigate between tabs. Confirm:
- Active tab icon + label are gold (`#d4af37`)
- Active tab has a thin gold bar at the very top of the nav item
- Inactive tabs are muted gray
- No pill background, no glow

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: visual smoke test corrections"
```

# Figma Make Redesign — Design Spec

**Date:** 2026-04-13  
**Source:** https://www.figma.com/make/6DWcpHvaWtRNQq0q8udLsl/JewelCalc  
**Approach:** Option A — Tailwind config token swap + targeted structural edits

## Goal

Migrate the visual design from the current purple/glassmorphism aesthetic to the gold/flat-dark aesthetic defined in the Figma Make prototype. Ukrainian i18n strings are preserved throughout.

---

## 1. Color Token Mapping

Update hex values in `tailwind.config.js`. No Tailwind class names change anywhere in the codebase.

### `primary-*` (purple → gold)

| Token | Old | New |
|---|---|---|
| `primary-300` | `#c4b5fd` | `#e8d087` |
| `primary-400` | `#a78bfa` | `#d4af37` |
| `primary-500` | `#8b5cf6` | `#c9a520` |
| `primary-600` | `#7c3aed` | `#b8960a` |
| `primary-700` | `#6d28d9` | `#a07e08` |
| `primary-800` | `#5b21b6` | `#886a06` |
| `primary-900` | `#4c1d95` | `#6e5605` |

### `surface-*` (dark blue-gray → near-black)

| Token | Old | New |
|---|---|---|
| `surface-950` | `#070b14` | `#05050a` |
| `surface-900` | `#0d1117` | `#0a0a0f` |
| `surface-800` | `#161b27` | `#141419` |
| `surface-700` | `#1e2535` | `#1f1f24` |
| `surface-600` | `#2a3347` | `#252529` |
| `surface-500` | `#3d4f68` | `#3a3a40` |
| `surface-400` | `#5c7090` | `#9494a0` |
| `surface-300` | `#8a9ab5` | `#b8b8c0` |
| `surface-200` | `#b8c5d4` | `#d4d4dc` |
| `surface-100` | `#e2e9f0` | `#e8e8ee` |

### Utility classes

Replace `glow-purple` and `glow-purple-sm` with `glow-gold` and `glow-gold-sm` using gold rgba shadows:

```js
".glow-gold":    { "box-shadow": "0 0 20px rgba(212,175,55,0.4)" },
".glow-gold-sm": { "box-shadow": "0 0 10px rgba(212,175,55,0.3)" },
```

All usages of `glow-purple` / `glow-purple-sm` in component files must be renamed to `glow-gold` / `glow-gold-sm`.

---

## 2. Global CSS (`client/src/index.css`)

Two hex value changes in the `body` rule:

- `background-color: #0d1117` → `#0a0a0f`
- `color: #e2e9f0` → `#e8e8ee`

---

## 3. Structural Component Changes

### `AppShell.tsx`
- `max-w-lg` → `max-w-[375px]`

### `BottomNav.tsx`
- Remove active state: rounded pill background (`bg-primary-600/15`) and `glow-gold-sm`
- Add active indicator: a `h-0.5 w-12 bg-primary-400 rounded-b-full` bar absolutely positioned at the top of the nav item
- Update `focus:ring-offset-surface-900` references if any

### `Login.tsx`
- Remove radial gradient overlay `<div>`
- Remove glassmorphism form wrapper (`bg-surface-800/60 backdrop-blur-md rounded-2xl shadow-2xl border border-surface-600 p-6`)
- Form inputs sit directly on the page background with standard spacing
- Keep all field logic, error handling, loading state, and i18n strings unchanged

### `Register.tsx`
- Remove glassmorphism form wrapper (same `bg-surface-800/60 backdrop-blur-md rounded-2xl shadow-2xl border border-surface-600 p-6` pattern as Login)

### `Button.tsx`
- Primary variant: remove `hover:glow-purple-sm` (now `glow-gold-sm` doesn't apply to buttons per Figma), replace with `hover:opacity-90`
- Keep all other variants, sizes, loading spinner, and disabled logic unchanged

### `ComponentCard.tsx`
- Selection glow: `glow-purple` → `glow-gold`
- Selection ring: `ring-primary-400` → `ring-primary-500` (aligns with updated token)
- Price badge: already uses `bg-primary-600/20 text-primary-300` — no change needed (tokens update automatically)

---

## 4. Token-Swap-Only Files

These files use only `surface-*` / `primary-*` Tailwind tokens and require no edits beyond the token swap in step 1:

- `Input.tsx`
- `Modal.tsx`
- `Combobox.tsx`
- `PhotoUpload.tsx`
- `PageHeader.tsx`
- `ProductCard.tsx`
- `ProductDetail.tsx`
- `ProductForm.tsx`
- `ComponentForm.tsx`
- `Components.tsx`
- `Products.tsx`
- `Settings.tsx`
- `PublicProduct.tsx`

---

## 5. Out of Scope

- i18n strings: all Ukrainian text is preserved as-is
- Backend / API layer: no changes
- Fonts: system font stack unchanged
- Animations / transitions: existing patterns preserved
- Tests: no test changes required (visual only)

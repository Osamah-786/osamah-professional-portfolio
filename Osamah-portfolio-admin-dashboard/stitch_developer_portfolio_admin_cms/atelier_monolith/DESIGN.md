---
name: Atelier Monolith
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#dbc1b4'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#a38c80'
  outline-variant: '#554339'
  surface-tint: '#ffb68c'
  primary: '#ffb68c'
  on-primary: '#532200'
  primary-container: '#d97736'
  on-primary-container: '#491d00'
  inverse-primary: '#994703'
  secondary: '#ffb68d'
  on-secondary: '#532200'
  secondary-container: '#8c3e00'
  on-secondary-container: '#ffbb94'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68c'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#753400'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68d'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-hero:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: '400'
    lineHeight: '1.15'
    letterSpacing: -0.025em
  display-hero-mobile:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.25rem
    fontWeight: '400'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '400'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.45'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Newsreader
    fontSize: 1.1875rem
    fontWeight: '400'
    lineHeight: '1.75'
    letterSpacing: 0em
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.55'
    letterSpacing: 0.005em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.04em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies an uncompromising editorial-grade engineering atelier. It balances the stark precision of a terminal runtime with the typographical reverence of high-end independent publishing. Crafted specifically for technical operators, systems architects, and elite developers curating deep technical essays, case studies, and code architectures.

### Aesthetic Persona
- **Disciplined Precision:** Every border, typographic margin, and badge reflects intentional craftsmanship. There is zero decorative clutter, superficial neon bloom, or cookie-cutter SaaS marketing fluff.
- **Editorial Subtlety:** Heavy prose readability meets dense technical metadata. High-contrast textual delivery paired with warm copper punctuation signals meticulous human attention.
- **Atmospheric Gravity:** Grounded in layered near-black tones and graphite substrates, evoking dense physical paper tinted in carbon ink.

## Colors

The palette leverages pure carbon foundations, high-legibility bone-tinted typographic layers, and disciplined copper accents.

### Palette Implementation
- **Base Canvas (`#0c0e12`):** Primary canvas substrate, cold graphite black.
- **Surface Layer 1 (`#14171d`):** Raised working canvas, editor panes, card containers.
- **Surface Layer 2 (`#1c2028`):** Elevated overlays, dropdowns, code blocks, hovered nodes.
- **Primary Accent (`#d97736`):** Handcrafted amber-copper, utilized strictly for active signals, critical calls to action, and publication states.
- **Secondary Accent (`#c2672b`):** Deep burnished copper for pressed interactions, secondary markers, and structural emphasis.
- **Tertiary Tint (`#f59e0b1a`):** Soft luminous copper wash (10% alpha) for focus indicators, badges, and contextual halos.
- **Borders & Dividers:**
  - Structural Hairline: `#21262d` (subtle partition).
  - Active / Focus Line: `#30363d` (defined component perimeter).
  - Selected Perimeter: `#d97736` at 40% opacity.
- **Typography Roles:**
  - High Emphasis: `#ededed` to `#f3f3f3` (off-white linen).
  - Mid-tone Metadata: `#8b949e` (slate muted neutral).
  - Subdued / Disabled: `#6e7681` (recessed terminal gray).

## Typography

The typographic hierarchy pairs three distinct voices:
1. **Editorial Literature (`Newsreader`):** Applied to expansive article headlines, long-form publishing bodies, and thesis declarations. Provides an authentic bookish, humanistic gravity.
2. **System Interface (`Geist`):** Applied across core UI operations, control labels, navigation trees, and analytical overviews. High-legibility grotesque engineered for density.
3. **Machine Syntax (`JetBrains Mono`):** Applied to git commit SHAs, file paths, semantic tokens, timestamps, stats, and markdown source indicators. Rendered at fixed sizes with deliberate micro-tracking.

### Typographic Rules
- Never use bold weights for `Newsreader`; contrast is achieved through scale and font family change rather than synthetic weight.
- Monospace tokens must always enforce uppercase formatting when displaying system status or tags (e.g., `DRAFT`, `PUBLISHED`, `SHA-256`).

## Layout & Spacing

The layout is architected around an asymmetrical fixed-fluid hybrid structure:
- **Workspace Split:** 280px fixed metadata/navigation bar, an adjustable 760px centered editorial reading rail, and an optional 320px telemetry inspector.
- **Rhythm:** Standard 8px spatial increments. Internal card padding leverages `space-md` (16px) or `space-lg` (24px) for uninterrupted visual cadence.
- **Long-Form Text Discipline:** All prose columns are clamped strictly between `60ch` and `72ch` to maintain optimum optical ergonomics.

## Elevation & Depth

Visual hierarchy is strictly structural and tonal rather than float-based.

- **Surface Tonal Stacking:** Depth is created through surface luminance. Canvas ground sits at `#0c0e12`, secondary containers at `#14171d`, and elevated contextual popovers at `#1c2028`.
- **Low-Contrast Outlines:** Every card, cell, and floating panel relies on a 1px solid hairline (`#21262d`) to articulate borders against the void.
- **Restrained Ambient Warmth:** High elevations (modals, context menus) do not use cold blur drops. They utilize a diffused, low-opacity drop shadow tinted with amber undertones: `0 8px 32px -4px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(217, 119, 54, 0.08)`.
- **Zero Glassmorphism:** No frosted acrylic backgrounds or noisy backdrop blurs. All surfaces remain fully opaque or mathematically solid to prioritize readability.

## Shapes

The design system enforces a crisp architectural radius:
- Small controls (inputs, buttons, pill badges, and table cells) use **4px (`rounded-sm` / base)** corners.
- Structural elements (editorial cards, code panels, dialog boxes) cap strictly at **8px (`rounded-lg`)**.
- No circular pills or fully-rounded bubbles are permitted. Monospace chips remain geometric rectangles with slight edge relief to mirror high-precision mechanical apparatuses.

## Components

### Buttons
- **Primary:** Solid `#d97736` background, `#0c0e12` bold Geist typography. Zero drop shadow. On hover, background shifts to `#c2672b`. Active states trigger a 1px inner press effect.
- **Secondary / Ghost:** Substrate `#14171d`, perimeter 1px `#21262d`, text `#ededed`. On hover, border illuminates to `#30363d` with background `#1c2028`.
- **Destructive:** Subtle `#1f1315` background with `#f85149` text and `#3c1e22` outline.

### Chips & Metadata Tags
- Built using `label-mono` (`JetBrains Mono`, 11px uppercase).
- Height: 22px fixed. Padding: 0 6px.
- Background `#14171d`, border 1px `#21262d`, text `#8b949e`.
- Featured/Live tags take a background of `rgba(245, 158, 11, 0.1)` and copper foreground `#d97736`.

### Cards & Writing Panes
- Background `#14171d`, wrapped in crisp 1px `#21262d` border.
- Hover states never slide upwards; instead, the perimeter shifts to `#30363d` and the top edge receives an ultra-thin 1px highlight accent.
- Content headers deploy `Newsreader` alongside right-aligned `JetBrains Mono` word count / revision hashes.

### Inputs & Editors
- Input backgrounds: Flat `#0c0e12` (wells recessed into the `#14171d` card surface).
- Inactive border: `#21262d`.
- Focus border: `#d97736` with a uniform 2px ring at `rgba(245, 158, 11, 0.1)`.
- Typography: Body text in `Geist` 14px; metadata entry and slug edit inputs strictly in `JetBrains Mono` 13px.

### Checkboxes & Segmented Selectors
- Checkboxes: 16x16px boxes with 2px radius. Background `#0c0e12`, border `#30363d`. Checked state fill `#d97736` with `#0c0e12` checkmark.
- Segmented Control: Container `#0c0e12` with 1px `#21262d` inset border. Active tabs render in `#1c2028` with an off-white `#ededed` label and crisp hairline contour.

### Editorial Additions
- **Code Injection Block:** Background `#08090b` with an inset copper left border (`2px solid #d97736`) and top-bar file breadcrumbs rendered in `#6e7681`.
- **Diff Changeset List:** Monospace green (`#3fb950`) and red (`#f85149`) gutter ticks on solid `#0c0e12` backdrops without loud high-saturation fills.
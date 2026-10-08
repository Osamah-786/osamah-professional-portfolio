---
name: Editorial Monolith
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
  on-surface-variant: '#d6c3b6'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#9e8e81'
  outline-variant: '#51443a'
  surface-tint: '#fdb87e'
  primary: '#ffba7f'
  on-primary: '#4c2700'
  primary-container: '#e09f67'
  on-primary-container: '#623505'
  inverse-primary: '#865221'
  secondary: '#ffb68c'
  on-secondary: '#532200'
  secondary-container: '#964400'
  on-secondary-container: '#ffcaac'
  tertiary: '#8dd3e7'
  on-tertiary: '#003641'
  tertiary-container: '#71b7cb'
  on-tertiary-container: '#004755'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#fdb87e'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6a3b0b'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68c'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#753400'
  tertiary-fixed: '#aeecff'
  tertiary-fixed-dim: '#8bd1e5'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5d'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  meta-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  meta-index:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 2.5rem
  margin: 1.25rem
  margin-tablet: 2.5rem
  margin-desktop: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 3rem
---

## Brand & Style

This design system establishes an intellectual, restrained, and commanding digital presence for a senior AI/ML and software engineering specialist. It departs deliberately from ubiquitous tech clichés—omitting synthetic neon gradients, holographic meshes, and saturated cyan glows in favor of a quiet, authoritative editorial language reminiscent of archival technical journals and high-end monographs.

The aesthetic fuses Swiss modernist discipline with computational rigor:
- **Atmospheric Depth:** Layered, desaturated obsidian and graphite surfaces evoke focus and permanence.
- **Intellectual Clarity:** Typographic weight, calibrated leading, and spatial geometry prioritize reading, architectural breakdowns, and code analysis over superficial decoration.
- **Tactile Restraint:** Accents appear solely as focal instruments—micro-indicators, structural underlines, and status signals—ensuring maximum communicative signal-to-noise ratio.

## Colors

The palette is engineered around precise tonal contrast and disciplined luminance values:

- **Canvas & Surface Architecture:**
  - Base Obsidian: `#0F1115` (Deep canvas, background grounding)
  - Surface Tier 1: `#14171D` (Structural panels, elevated sections)
  - Surface Tier 2: `#1A1E26` (Interactive containers, code blocks, hovered items)
  - Hairline Rule / Border: `#262B35` (Geometric delimiters, 1px separation lines)

- **Text & Content Luminance:**
  - High Emphasis: `#F3F4F6` (Primary headlines, hero display text, active states)
  - Medium Emphasis: `#D1D5DB` (Body prose, longform narratives, descriptive copy)
  - Muted / Metadata: `#9CA3AF` (Secondary annotations, captions, inactive navigation)
  - Subtle / Tertiary: `#6B7280` (Timestamps, line numbers, terminal paths)

- **Accent Chromatics:**
  - Warm Copper: `#E09F67` (Primary signal token: active indices, focused link underlines, cursor highlights)
  - Deep Amber: `#D97736` (Hover transitions, selected badge states, interactive feedback)

Rules of engagement: Saturated color must never exceed 5% of the viewport area. Gradients are prohibited except for subtle alpha dissolves on canvas borders.

## Typography

The typographic hierarchy pairs the objective, rational geometry of **Inter** for core intellectual content with the hyper-precise, technical cadence of **JetBrains Mono** for architectural metadata, indexes, system logs, and dates.

- **Display & Headlines:** Set tight with deliberate negative letter-spacing to form cohesive visual text blocks. Headlines read like editorial titles rather than marketing slogans.
- **Body Copy:** Generous line heights ensure frictionless scanning across deep technical case studies, research notes, and architectural whitepapers.
- **Monospaced Layer:** Every date, section index (e.g., `[01/SYS]`), parameter name, code snippet, and telemetry metric is rendered in JetBrains Mono with widened tracking, anchoring the user in an engineering reality.

## Layout & Spacing

The layout is grounded in an asymmetrical, editorial grid utilizing crisp boundaries and uncompressed negative space:

- **Grid Architecture:** 12-column desktop grid with a maximum content container of `1280px`. Major essays and system overviews span an offset 8-column primary track flanked by a 4-column contextual metadata rail.
- **Vertical Rhythm:** Sections are punctuated by structural 1px dividers (`#262B35`) instead of arbitrary box containers. Spacing between major thematic blocks ranges from `4rem` to `6rem`, establishing deliberate editorial pauses.
- **Responsive Adaptations:**
  - *Mobile (< 768px):* Single-column vertical stream. The metadata rail stacks above case studies as a condensed tabular strip. Section gutters contract to `1.5rem`.
  - *Tablet (768px – 1024px):* 8-column layout with collapsed auxiliary columns. Gutters scale to `2rem`.
  - *Desktop (> 1024px):* Full 12-column asymmetric layout with expansive margins, preserving breathing room around dense architectural diagrams and technical prose.

## Elevation & Depth

This design system rejects physical drop shadows and skeuomorphic blur stacks. Elevation is conveyed strictly through **tonal stratification** and **1px hairline framing**:

- **Ground Level:** `#0F1115` provides the base backdrop for the entire viewport.
- **Layer 1 (Segmented Planes):** Key reading surfaces and code sandboxes use `#14171D` with a crisp `1px solid #262B35` border.
- **Layer 2 (Overlays & Flyouts):** Modals, dropdown selectors, and technical tooltips use `#1A1E26` anchored by `#262B35` borders.
- **Zero-Shadow Rule:** No fuzzy drop shadows or ambient glow halos around copper accents. Focus and hover states achieve depth purely through hairline shifts—such as a border transition from `#262B35` to `#E09F67`—preserving a flat, razor-sharp technical edge.

## Shapes

The geometric grammar is disciplined, restrained, and structural:

- **Border Radii:** Minimal rounding (`0.25rem` / `4px`) applied to interactive tags, buttons, and code blocks to slightly soften extreme corners without sacrificing an architectural, rectilinear feel.
- **Hairlines:** Continuous reliance on clean right angles along section dividers and list boundaries.
- **Data & Pill Elements:** Chips and status dots may use soft micro-radii, but pills (`rounded-full`) are strictly reserved for tiny, circular status pings (e.g., active server indicators).

## Components

### Buttons & Interactive Links
- **Primary Action:** Solid background `#F3F4F6` with text `#0F1115` in `JetBrains Mono` (12px, weight 500, uppercase). Hover shifts background to copper `#E09F67` with zero transition lag or a rapid 120ms ease-out.
- **Secondary / Ghost:** Transparent background, `1px solid #262B35`, text `#D1D5DB`. Hover changes border color to `#E09F67` and text to `#F3F4F6`.
- **Editorial Hyperlink:** Seamless text link with a permanent `1px solid #262B35` underline positioned 4px below the text baseline. Hover transitions the underline color to copper `#E09F67`.

### Metadata Chips & Status Badges
- **Format:** Inset padding of `2px 8px`, border `1px solid #262B35`, background `#14171D`.
- **Typography:** `JetBrains Mono` 11px, tracking `0.06em`, uppercase, text `#9CA3AF`.
- **Active / Accent Variant:** Border `#D97736`, text `#E09F67`, preceded by a 4px solid copper square indicator.

### Project & Engineering Lists (Replaces Generic Cards)
- **Structure:** Case studies avoid card-bloat grids. They are presented as dense, editorial row manifests separated by `1px solid #262B35`.
- **Row Columns:** 
  - Col 1: Numerical index (`01`, `02`) in `JetBrains Mono` `#9CA3AF`.
  - Col 2: Project title in `Inter` headline-sm `#F3F4F6` + short system architecture description in `#9CA3AF`.
  - Col 3: Tech stack / ML frameworks tag cluster.
  - Col 4: Publication year / status metric (`DEPLOYED`, `RESEARCH`).
- **Interaction:** Row background transitions to `#14171D` on hover, shifting the numerical index to copper `#E09F67`.

### Code & Terminal Blocks
- **Container:** Background `#14171D`, border `1px solid #262B35`, padding `1.25rem`.
- **Header:** Top strip containing terminal path or language label (`python`, `cuda`, `rust`) in `JetBrains Mono` 11px `#9CA3AF`, separated by a subtle bottom divider.
- **Syntax Styling:** Monochromatic grayscale code highlights with copper `#E09F67` reserved strictly for key returns, model parameters, and terminal prompts (`$`).

### Form Inputs & Terminal Inquiries
- **Field:** Background `#0F1115`, border `1px solid #262B35`, text `#F3F4F6`, typography `Inter` 14px.
- **Focus State:** Border sharply transitions to `#E09F67`, no outer halo/ring.
- **Labeling:** Floating or upper-fixed label in `JetBrains Mono` 11px `#9CA3AF` uppercase.
---
name: "Vercel Inspired Design System"
colors:
  primary: "#171717"
  primary-deep: "#000000"
  secondary: "#4d4d4d"
  background: "#ffffff"
  background-canvas: "#ffffff"
  background-bone: "#fafafa"
  surface: "#ffffff"
  surface-card: "#ffffff"
  surface-dark: "#171717"
  surface-deep: "#000000"
  foreground: "#171717"
  ink: "#171717"
  body: "#4d4d4d"
  charcoal: "#171717"
  mute: "#666666"
  ash: "#666666"
  stone: "#808080"
  on-primary: "#ffffff"
  on-secondary: "#ffffff"
  on-background: "#171717"
  on-surface: "#171717"
  on-dark: "#fcfcfc"
  on-dark-mute: "rgba(252, 252, 252, 0.72)"
  hairline: "rgba(235, 235, 235, 0.4)"
  hairline-strong: "#171717"
  divider: "#ebebeb"
  divider-dark: "#2a2a2a"
  hero-warm: "#ff5b4f"
  hero-glow: "#de1d8d"
  hero-pink: "#0a72ef"
  badge-success: "#2b9a66"
  link: "#0072f5"
  ring-focus: "hsla(212, 100%, 48%, 1)"
colors-dark:
  primary: "#171717"
  primary-deep: "#666666"
  secondary: "#a0a0a0"
  background: "#0a0a0a"
  background-canvas: "#0a0a0a"
  background-bone: "#111111"
  surface: "#0a0a0a"
  surface-card: "#0a0a0a"
  surface-dark: "#0a0a0a"
  surface-deep: "#000000"
  foreground: "#ededed"
  ink: "#ededed"
  body: "#a0a0a0"
  charcoal: "#ededed"
  mute: "#808080"
  ash: "#808080"
  stone: "#666666"
  on-primary: "#ffffff"
  on-secondary: "#171717"
  on-background: "#ededed"
  on-surface: "#ededed"
  on-dark: "#fcfcfc"
  on-dark-mute: "rgba(252, 252, 252, 0.72)"
  hairline: "rgba(42, 42, 42, 0.4)"
  hairline-strong: "#ededed"
  divider: "#2a2a2a"
  divider-dark: "#0a0a0a"
  hero-warm: "#ff5b4f"
  hero-glow: "#de1d8d"
  hero-pink: "#0a72ef"
  badge-success: "#2b9a66"
  link: "#0072f5"
  ring-focus: "hsla(212, 100%, 48%, 1)"
typography:
  display-xl:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.00
    letterSpacing: "-2.4px"
  heading-lg:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: "-2.4px"
  heading-md:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-1.28px"
  heading-sm:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.96px"
  body-lg:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.80
    letterSpacing: "normal"
  body-md:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "normal"
  subtitle:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: "normal"
  button-md:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: "normal"
  button-sm:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.00
    letterSpacing: "normal"
  caption:
    fontFamily: "'Geist', system-ui, -apple-system, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "normal"
  code-md:
    fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "normal"
  code-sm:
    fontFamily: "'Geist Mono', ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.00
    letterSpacing: "normal"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
  section: "96px"
  band: "160px"
rounded:
  none: "0px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "44px"
  button-primary-pressed:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    height: "44px"
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  text-input-focused:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  text-input-error:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  select:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "44px"
  textarea:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "88px"
  checkbox:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: "0"
    height: "20px"
  radio:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "0"
    height: "20px"
  switch:
    backgroundColor: "{colors.mute}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "2px"
    height: "24px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "24px"
    height: "auto"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    height: "24px"
  modal:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "32px"
    height: "auto"
  navbar:
    backgroundColor: "{colors.background-canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "64px"
  dropdown:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 0"
    height: "auto"
  table:
    backgroundColor: "{colors.background-canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    height: "auto"
  tabs:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "40px"
  avatar:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0"
    height: "32px"
  progress:
    backgroundColor: "{colors.background-bone}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "0"
    height: "8px"
  alert:
    backgroundColor: "{colors.background-bone}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
    height: "auto"
  accordion:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "16px"
    height: "auto"
---

## Overview

Minimalism as an engineering principle. The Vercel Inspired Design System is a monochrome-first interface built for developers, by developers. It treats whitespace as a computational resource, typography as infrastructure, and color as a deliberate interruption rather than decoration.

This is not a "clean UI" trend. It is a functional constraint: when every pixel must earn its place, the resulting interface communicates confidence, precision, and respect for the user's attention. The palette is achromatic by default — workflow accent colors (Develop Blue, Preview Pink, Ship Red) appear only to signal state changes in a deployment pipeline. The emotional response should be clarity, not warmth; trust, not delight.

The system is dual-mode by architecture: light mode (`{colors.background}` canvas with `{colors.ink}` text) and dark mode (`{colors-dark.background}` canvas with `{colors-dark.ink}` text) are first-class citizens, not afterthoughts.

---

## Colors

### Philosophy

The Vercel palette is a deliberate monochrome reduction. Color is a signaling mechanism, not a decorative layer. By removing chromatic noise from the chrome, the UI lets code, content, and data own the visual hierarchy.

### Brand & Accent

**Primary — Blue (`{colors.primary}`)**. A neutral, engineering-grade blue (HSL 212° 100% 48%). This is the single interactive accent — reserved for links, primary CTAs, focus rings, and selected states. In an achromatic world, every blue element is unmistakably actionable. The deep state (`{colors.primary-deep}`) provides pressed feedback. The accent is consistent across light and dark modes — brand recognition is mode-independent.

**Workflow Trio.** Three semantic colors borrowed from the deployment lifecycle:
- **Develop Blue** (`{colors.hero-pink}` = `#0a72ef`) — active development, editing, building
- **Preview Pink** (`{colors.hero-glow}` = `#de1d8d`) — staging, review, pre-deployment
- **Ship Red** (`{colors.hero-warm}` = `#ff5b4f`) — production, deployment, completion

These appear only in deployment-status contexts — never as chrome accents.

**Hero Gradient.** The `{colors.hero-warm}` → `{colors.hero-glow}` → `{colors.hero-pink}` spectrum powers the hero mesh gradient, creating atmospheric depth behind marketing pages.

### Surface

The surface hierarchy defines containment through luminance, not color:

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| Canvas | `{colors.background-canvas}` | `{colors-dark.background-canvas}` | Page-level background |
| Bone | `{colors.background-bone}` | `{colors-dark.background-bone}` | Inset groups, secondary sections |
| Surface | `{colors.surface}` | `{colors-dark.surface}` | Default surface |
| Card | `{colors.surface-card}` | `{colors-dark.surface-card}` | Elevated containers |
| Dark | `{colors.surface-dark}` | `{colors-dark.surface-dark}` | Footer, inverted bands |
| Deep | `{colors.surface-deep}` | `{colors-dark.surface-deep}` | Maximum contrast background |

### Text

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| ink | `{colors.ink}` | `{colors-dark.ink}` | Primary text, headings |
| body | `{colors.body}` | `{colors-dark.body}` | Long-form body copy |
| charcoal | `{colors.charcoal}` | `{colors-dark.charcoal}` | Strong captions, metadata |
| mute | `{colors.mute}` | `{colors-dark.mute}` | Supporting, secondary text |
| ash | `{colors.ash}` | `{colors-dark.ash}` | Tertiary, placeholder text |
| stone | `{colors.stone}` | `{colors-dark.stone}` | Disabled text |

### Semantic

| Token | Value | Use |
|-------|-------|-----|
| success | `{colors.badge-success}` | Positive states, success badges |
| link | `{colors.link}` | Inline links, navigation |
| ring-focus | `{colors.ring-focus}` | Focus ring for keyboard navigation |
| on-dark | `{colors.on-dark}` | Text on dark/deep surfaces |
| on-dark-mute | `{colors.on-dark-mute}` | Secondary text on dark surfaces |

### Dark Mode Comparison

| Token | Light | Dark |
|-------|-------|------|
| background | `{colors.background}` | `{colors-dark.background}` |
| surface-card | `{colors.surface-card}` | `{colors-dark.surface-card}` |
| ink | `{colors.ink}` | `{colors-dark.ink}` |
| body | `{colors.body}` | `{colors-dark.body}` |
| divider | `{colors.divider}` | `{colors-dark.divider}` |
| hairline | `{colors.hairline}` | `{colors-dark.hairline}` |

---

## Typography

### Font Family

**Geist** — Vercel's open-source typeface, purpose-built for the brand. A geometric sans-serif with precise, engineering-grade terminals and tight vertical metrics. The font conveys technical authority without coldness — it is the typeface equivalent of a well-documented API.

**Geist Mono** — Monospaced companion for code blocks, terminal output, and technical content. Provides visual distinction for code-in-context scenarios.

**Font Stack (fallback order):**
- Sans: `'Geist', system-ui, -apple-system, Arial, sans-serif`
- Mono: `'Geist Mono', ui-monospace, SFMono-Regular, 'Roboto Mono', Menlo, monospace`

### Hierarchy

| Token | Font | Size | Weight | Line Ht | Letter Spacing | Use |
|-------|------|------|--------|---------|----------------|-----|
| display-xl | `{typography.display-xl.fontFamily}` | `{typography.display-xl.fontSize}` | `{typography.display-xl.fontWeight}` | `{typography.display-xl.lineHeight}` | `{typography.display-xl.letterSpacing}` | Hero headlines, 404 pages |
| heading-lg | `{typography.heading-lg.fontFamily}` | `{typography.heading-lg.fontSize}` | `{typography.heading-lg.fontWeight}` | `{typography.heading-lg.lineHeight}` | `{typography.heading-lg.letterSpacing}` | Section titles, marketing |
| heading-md | `{typography.heading-md.fontFamily}` | `{typography.heading-md.fontSize}` | `{typography.heading-md.fontWeight}` | `{typography.heading-md.lineHeight}` | `{typography.heading-md.letterSpacing}` | Feature headings |
| heading-sm | `{typography.heading-sm.fontFamily}` | `{typography.heading-sm.fontSize}` | `{typography.heading-sm.fontWeight}` | `{typography.heading-sm.lineHeight}` | `{typography.heading-sm.letterSpacing}` | Card titles, modal titles |
| body-lg | `{typography.body-lg.fontFamily}` | `{typography.body-lg.fontSize}` | `{typography.body-lg.fontWeight}` | `{typography.body-lg.lineHeight}` | `{typography.body-lg.letterSpacing}` | Lead paragraphs |
| body-md | `{typography.body-md.fontFamily}` | `{typography.body-md.fontSize}` | `{typography.body-md.fontWeight}` | `{typography.body-md.lineHeight}` | `{typography.body-md.letterSpacing}` | Default body text |
| subtitle | `{typography.subtitle.fontFamily}` | `{typography.subtitle.fontSize}` | `{typography.subtitle.fontWeight}` | `{typography.subtitle.lineHeight}` | `{typography.subtitle.letterSpacing}` | Medium-emphasis text |
| button-md | `{typography.button-md.fontFamily}` | `{typography.button-md.fontSize}` | `{typography.button-md.fontWeight}` | `{typography.button-md.lineHeight}` | `{typography.button-md.letterSpacing}` | Primary/secondary buttons |
| button-sm | `{typography.button-sm.fontFamily}` | `{typography.button-sm.fontSize}` | `{typography.button-sm.fontWeight}` | `{typography.button-sm.lineHeight}` | `{typography.button-sm.letterSpacing}` | Small/link buttons |
| caption | `{typography.caption.fontFamily}` | `{typography.caption.fontSize}` | `{typography.caption.fontWeight}` | `{typography.caption.lineHeight}` | `{typography.caption.letterSpacing}` | Labels, timestamps, metadata |
| code-md | `{typography.code-md.fontFamily}` | `{typography.code-md.fontSize}` | `{typography.code-md.fontWeight}` | `{typography.code-md.lineHeight}` | `{typography.code-md.letterSpacing}` | Inline code, code blocks |
| code-sm | `{typography.code-sm.fontFamily}` | `{typography.code-sm.fontSize}` | `{typography.code-sm.fontWeight}` | `{typography.code-sm.lineHeight}` | `{typography.code-sm.letterSpacing}` | Mono captions, keybinds, log lines |

### Principles

**Compression as Identity.** Heading tokens (`display-xl`, `heading-lg`, `heading-md`, `heading-sm`) use aggressive negative letter-spacing (from `-2.4px` down to `-0.96px`). This vertical compression creates the signature Vercel headline density — text feels machined, not typeset.

**Ligatures Everywhere.** Geist includes rich ligature support. Never disable `font-variant-ligatures` — the `->`, `=>`, `!=` and other coding ligatures are part of the identity, especially in code contexts using `{typography.code-md}`.

**Three-Weight System.** The system operates on exactly three weights: 400 (normal), 500 (medium), 600 (semibold). No 300, no 700+ outside display contexts. This constraint prevents unintended visual hierarchy — if everything is either normal, medium, or semibold, the relative emphasis is always clear.

**Mono for Identity.** Geist Mono (`{typography.code-md.fontFamily}`) is used not only for code blocks but also for technical metadata, version numbers, file paths, and keyboard shortcuts. Mono signals "this is technical" in any context.

### Note on Font Substitutes

Geist and Geist Mono are open-source (SIL Open Font License) and self-hosted. Fallback stacks use system-ui and platform-native monospace fonts. When Geist is unavailable, `system-ui` provides acceptable geometric spacing, and `ui-monospace` preserves the monospaced intent. No font-display: swap delay exceeds `{animation.duration.fast}` (`120ms`) — flash-of-unstyled-text is minimized by design.

---

## Layout & Spacing

### Semantic Spacing Scale

Spacing is built on a 4px grid base, scaling geometrically:

| Token | Value | Use |
|-------|-------|-----|
| xxs | `2px` | Hairlines, icon gaps |
| xs | `4px` | Tight text clusters, badge inner |
| sm | `8px` | Button padding, tight component gaps |
| md | `12px` | Default inner padding |
| lg | `16px` | Card inset, section internal |
| xl | `24px` | Between related sections |
| xxl | `32px` | Section internal separation |
| xxxl | `48px` | Feature-level spacing |
| section | `96px` | Between major page sections |
| band | `160px` | Maximum separation, hero/hero separation |

### Grid

Layout centers on a `1200px` max-width container. Content columns use a 12-column grid with `{spacing.xl}` (`24px`) gutters. Full-bleed sections (hero, footer) break the grid intentionally — the container constrains content while backgrounds expand edge-to-edge.

### Whitespace Philosophy

**Gallery Emptiness.** Content blocks breathe with generous whitespace. The system favors `{spacing.section}` (`96px`) between major sections and `{spacing.xxxl}` (`48px`) between features. This creates a gallery-like atmosphere where each piece of content has room to be evaluated independently.

**Compressed Text, Expanded Space.** Text is vertically compressed (tight line heights, negative letter-spacing) while the space around text blocks is generously expanded. This contrast — dense content within generous containers — is the defining spatial signature of the system.

---

## Elevation & Depth

### Philosophy

Depth in this system is achieved through borders, not blur. Vercel's signature "shadow-as-border" technique uses `1px` hard lines at varying opacities to create elevation without atmospheric spread. This is an engineering choice: hard borders preserve sharpness at all pixel densities, never degrade on high-DPI screens, and feel more precise than soft shadows.

### Level Table

| Level | Light Treatment | Dark Treatment | Use Case |
|-------|----------------|----------------|----------|
| 0 | `none` | `none` | Page background, text blocks |
| 1 | `rgba(0,0,0,0.08) 0px 0px 0px 1px` | `rgba(255,255,255,0.1) 0px 0px 0px 1px` | Default card elevation |
| 1b | `rgb(235,235,235) 0px 0px 0px 1px` | `rgba(255,255,255,0.08) 0px 0px 0px 1px` | Interactive cards, subtle divide |
| 2 | Level1 + `rgba(0,0,0,0.04) 0px 2px 2px 0px` + white inset | Level1b dark + `rgba(0,0,0,0.2) 0px 2px 2px 0px` + dark inset | Elevated cards, dropdowns |
| 3 | Level2 + `rgba(0,0,0,0.04) 0px 8px 8px -8px` | Level2 dark + `rgba(0,0,0,0.2) 0px 8px 8px -8px` | Modals, popovers |
| focus | `0 0 0 2px hsl(212,100%,48%)` | Same | Focus ring, active states |

### Decorative Depth

The hero mesh gradient is the system's only decorative depth element — a three-stop gradient from `{colors.hero-warm}` through `{colors.hero-glow}` to `{colors.hero-pink}`, applied as a background with `100vw` width and atmospheric blur. This sits behind marketing hero content and never intersects with functional UI. The dark mode hero maintains the same gradient colors but against a `{colors-dark.background}` canvas, allowing the mesh to glow against the dark surface.

---

## Shapes

### Border Radius Scale

The system uses a conservative, tight corner language. Corners are never playful — they are precise, with the maximum functional radius (`{rounded.lg} = 12px`) used only for modals and alerts.

| Token | Value | Use |
|-------|-------|-----|
| none | `0px` | Navbars, full-bleed bands, tables |
| xs | `4px` | Checkboxes, small badges |
| sm | `6px` | Buttons, inputs, selects, textareas |
| md | `8px` | Cards, modals, tabs, tooltips |
| lg | `12px` | Alert containers, large modals |
| full | `9999px` | Pills, radios, avatars, switch handles |

Component shapes are aliased individually:
- Button (`{shape.button}`) = `{rounded.sm}` — `6px`
- Card (`{shape.card}`) = `{rounded.md}` — `8px`
- Badge (`{shape.badge}`) = `{rounded.full}` — pill
- Modal (`{shape.modal}`) = `{rounded.md}` — `8px`
- Navbar (`{shape.navbar}`) = `{rounded.none}` — sharp edge-to-edge

### Photography Geometry

- Hero images: 21:9 aspect ratio, full-bleed edge-to-edge, no border radius
- Card thumbnails: 16:10 aspect ratio, `{rounded.md}` (`8px`) corners
- Avatar: `{rounded.full}` (circular), `32px` default diameter
- OG/social images: 1200×630px (1.91:1), no border radius

---

## Components

### Buttons & Interaction

**Button Primary** — The single call-to-action.
- Background `{colors.primary}`, text `{colors.on-primary}`
- Type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding `12px 24px`, height `44px`
- Hover: background `{colors.primary}` at `--palette-primary-hover` (`#0050b3`)
- Pressed: `{colors.primary-deep}` (`#003d99`)
- Focus: `{colors.ring-focus}` ring at `2px`

**Button Primary Pressed** — Active/depressed state.
- Background `{colors.primary-deep}`, text `{colors.on-primary}`
- Type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding `12px 24px`, height `44px`

**Button Secondary** — Outlined/ghost alternative.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding `12px 24px`, height `44px`
- Border: `{colors.hairline}` (`rgba(235,235,235,0.4)`)
- Hover: background `{colors.background-bone}` (`#fafafa`)

**Button Ghost** — Minimal, borderless.
- Background `transparent`, text `{colors.ink}`
- Type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding `12px 24px`, height `44px`
- Hover: background `{colors.background-bone}`

### Inputs & Selection

**Text Input** — Default input field.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `12px 20px`, height `44px`
- Border: `{colors.hairline}`
- Placeholder: `{colors.stone}` (`#808080`)

**Text Input Focused** — Active input state.
- Same as default with `{colors.ring-focus}` outer ring at `2px`
- Border transitions to `{colors.primary}`

**Text Input Error** — Validation failure state.
- Same as default with border in `{colors.danger}` (`#ff5b4f`)
- Focus ring in error red

**Select** — Dropdown selector.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `12px 20px`, height `44px`
- Custom chevron in `{colors.mute}`

**Textarea** — Multi-line input.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `12px 20px`, height `88px` (`2` rows default)

### Chips & Controls

**Checkbox** — Binary selection.
- Background `{colors.surface-card}`, text `{colors.primary}`
- Rounded: `{rounded.xs}` (`4px`), height `20px`
- Checked: background `{colors.primary}`, checkmark `{colors.on-primary}`

**Radio** — Single-selection control.
- Background `{colors.surface-card}`, text `{colors.primary}`
- Rounded: `{rounded.full}` (circle), height `20px`
- Selected: inner dot in `{colors.primary}`

**Switch** — Toggle control.
- Background `{colors.mute}` (off) / `{colors.primary}` (on)
- Rounded: `{rounded.full}`, height `24px`, padding `2px`
- Thumb: `{colors.on-primary}`, circular, `20px`

**Badge** — Status and count indicators.
- Background `{colors.primary}`, text `{colors.on-primary}`
- Type `{typography.caption}`
- Rounded: `{rounded.full}`, padding `4px 12px`, height `24px`
- Variants: success (`{colors.badge-success}`), warning (`#d97706`)

### Data & Containers

**Card** — Content container.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.md}` (`8px`), padding `24px`
- Elevation: level1 (`rgba(0,0,0,0.08) 0px 0px 0px 1px`)
- Hover: level2 (adds `2px` offset shadow + white inset ring)

**Table** — Tabular data.
- Background `{colors.background-canvas}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `12px 16px`
- Header: `{typography.subtitle}` in `{colors.charcoal}`
- Row divider: `{colors.hairline}`

**Accordion** — Expandable sections.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `16px`
- Divider: `{colors.hairline}` between items

**Modal** — Overlay dialog.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.md}` (`8px`), padding `32px`
- Overlay: `hsla(0,0%,98%,1)` light / `hsla(0,0%,4%,0.85)` dark
- Z-index: `400`

### Feedback Components

**Alert** — Status notifications.
- Background `{colors.background-bone}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.md}` (`8px`), padding `16px`
- Variants: left border accent in semantic color (success `{colors.badge-success}`, danger `#ff5b4f`, warning `#d97706`, info `{colors.primary}`)

**Progress** — Loading/completion indicator.
- Background `{colors.background-bone}`, track fill `{colors.primary}`
- Type `{typography.caption}`
- Rounded: `{rounded.full}`, height `8px`
- Indeterminate: animated gradient using `{colors.primary}`

### Navigation

**Navbar** — Top-level application navigation.
- Background `{colors.background-canvas}`, text `{colors.ink}`
- Type `{typography.button-sm}`
- Rounded: `{rounded.none}`, height `64px`, padding `0 24px`
- Bottom border: `{colors.hairline}`
- Sticky: z-index `200`

**Dropdown** — Contextual menus.
- Background `{colors.surface-card}`, text `{colors.ink}`
- Type `{typography.body-md}`
- Rounded: `{rounded.sm}`, padding `8px 0`
- Elevation: level2
- Items: `{spacing.lg}` horizontal padding, `{spacing.sm}` vertical, hover on `{colors.background-bone}`

**Tabs** — Segmented navigation.
- Background `transparent`, text `{colors.mute}` (inactive) / `{colors.ink}` (active)
- Type `{typography.button-md}`
- Rounded: `{rounded.sm}`, padding `8px 16px`, height `40px`
- Active indicator: bottom border `2px` `{colors.primary}`
- Hover: text `{colors.charcoal}`

---

## Do's and Don'ts

### Do

- :white_check_mark: **Use shadow-as-border** — prefer `rgba(0,0,0,0.08) 0px 0px 0px 1px` over blur-based shadows for creating surface elevation
- :white_check_mark: **Enable ligatures** — never disable `font-variant-ligatures`; Geist's coding ligatures (`->`, `=>`, `!=`) are part of the developer identity
- :white_check_mark: **Stay within the three-weight system** — only 400, 500, and 600. No 300, 700, or 800 outside display contexts
- :white_check_mark: **Keep UI achromatic** — the chrome (backgrounds, surfaces, borders, text) should be grayscale. Color only for interactive accents and workflow signals
- :white_check_mark: **Use `{colors.primary}` only for interactive elements** — links, CTAs, focus rings. Never use blue for backgrounds or decorative surfaces
- :white_check_mark: **Apply compressed letter-spacing on all display/heading tokens** — `display-xl` at `{typography.display-xl.letterSpacing}`, `heading-lg` at `{typography.heading-lg.letterSpacing}`, etc.
- :white_check_mark: **Respect the `{spacing.section}` gap between major sections** — `96px` minimum separation prevents visual crowding
- :white_check_mark: **Use `{typography.code-md}` for technical metadata** — version numbers, file paths, terminal output, keyboard shortcuts

### Don't

- :x: **Don't use blur-based box-shadows for elevation** — the system uses hard 1px borders, not `box-shadow` blur. Shadow-as-border is a signature technique
- :x: **Don't add a fourth weight** — 400/500/600 covers the hierarchy. Adding 700 for "more emphasis" breaks the three-weight constraint
- :x: **Don't introduce chromatic colors into non-interactive chrome** — backgrounds must stay in the gray scale (`{colors.background}`, `{colors.surface}`, `{colors.surface-card}`)
- :x: **Don't use `{colors.primary}` for non-interactive elements** — badges, section backgrounds, and decorative elements should use neutral colors
- :x: **Don't disable font ligatures** — they are an intentional part of the developer-focused identity
- :x: **Don't use pure black (`#000`) for text** — `{colors.ink}` (`#171717`) in light mode and `{colors-dark.ink}` (`#ededed`) in dark mode provide better readability
- :x: **Don't crowd sections** — minimum `{spacing.section}` (`96px`) between major page blocks; let content breathe
- :x: **Don't override border-radius tokens** — each component shape is pre-defined. Buttons = `{rounded.sm}`, Cards = `{rounded.md}`, Badges = `{rounded.full}`
- :x: **Don't apply border-radius to the navbar** — `{rounded.none}` is explicit; navigation is edge-to-edge by design

---

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| mobile | `0—639px` | Single column, collapsed nav, reduced section spacing to `{spacing.xxl}` |
| tablet | `640—1023px` | 2-column grid, condensed hero, sticky nav collapses to hamburger |
| desktop | `1024—1199px` | Full 12-column grid, expanded nav, section spacing at `{spacing.section}` |
| wide | `1200px+` | Max-width container locks at 1200px, extra margin space |

### Touch Targets

- Minimum touch target: `44px` (buttons, inputs, select controls)
- Nav links: `44px` minimum hit area (padding increases on mobile)
- Checkboxes and radios: `44px` hit area via transparent extension padding
- Switch: `44px` extended hit area despite `24px` visual height

### Collapsing Strategy

- **Navbar**: Desktop shows full text links; tablet collapses to icon-only; mobile collapses to hamburger menu with slide-in overlay
- **Cards**: Desktop shows 3-column grid; tablet shows 2-column; mobile shows single-column with full-width cards
- **Tables**: Horizontal scroll on mobile with sticky first column; or convert to stacked card layout
- **Tabs**: Desktop shows horizontal row; mobile collapses to a dropdown select or scrollable container
- **Modals**: Desktop centered with overlay; mobile full-screen at `100vw × 100vh` with `{rounded.none}`
- **Section spacing**: Reduces from `{spacing.section}` (96px) to `{spacing.xxxl}` (48px) on mobile

### Image Behavior

- All images use `max-width: 100%` and `height: auto` for intrinsic scaling
- Hero images: `100vw` width, `21:9` aspect ratio, `object-fit: cover`, centered
- Card thumbnails: `16:10` ratio using `aspect-ratio` CSS property, `{rounded.md}` corners
- Avatars: `32px` on desktop, `28px` on mobile, always circular
- No `srcset` breakpoints defined in tokens — image DPR handling is per-implementation
- Gradient assets (hero mesh) are CSS-only, no image files — automatically resolution-independent

---

## Iteration Guide

1. **Focus on one component at a time.** Each component in this system is independently spec'd. Start with Button Primary, verify its hover/pressed/focus states, then move to the next. Do not attempt full-system changes in parallel.

2. **Reference tokens directly in code.** Never hardcode `#0072f5` — use `var(--palette-primary)`. Never hardcode `14px` — use `var(--typography-button-md-font-size)`. The CSS custom properties are the single source of truth.

3. **Validate dark mode immediately.** After any color change, toggle `data-theme="dark"` on `:root` and verify the component in both modes. Dark mode is not optional — it is a first-class dimension.

4. **Run the theme validation checklist.** Before committing, verify: all 717 lines of `theme.css` present, all 18 shape tokens aliased, all dark mode shadow levels inverted, no `$`-prefixed tokens introduced.

5. **Add new variants as separate entries.** If a new button variant is needed (e.g., `button-dangerous`), add it as a new entry in the `components:` block. Do not override existing component specs — extend, don't modify.

6. **Keep brand accent scarce.** Every new use of `{colors.primary}` must be justified. If an element is not interactive, it should not be blue. Review each PR for color creep.

7. **Regenerate `DesignSystem.md` after token changes.** After updating `design-token.json` or `theme.css`, regenerate this document using `skill({ name: "design-system-doc" })` to keep YAML front matter in sync.

8. **Test at every breakpoint.** Changes to spacing or layout must be verified at 360px, 768px, 1024px, and 1440px. The collapsing strategy depends on consistent spacing token behavior.

---

## Known Gaps

- **Tooltip component** — shape token exists (`{rounded.sm}`) but no full component spec (padding, typography, animation) is defined. Implement as an overlay with z-index 600.
- **Loading / Skeleton states** — no skeleton loading pattern specified. Recommend using `{colors.background-bone}` as shimmer base with `{colors.hairline}` as highlight.
- **Empty states** — no empty-state illustration or copy pattern. Follow existing spacing: `{spacing.xxxl}` padding, centered `{typography.body-md}` text in `{colors.mute}`.
- **Data visualization** — charts, graphs, and metric displays are outside the current token scope. Future work should define a `chart` color palette extending the gray scale with semantic alerts.
- **Icon system** — no icon library or sizing tokens defined. Icons currently use inline SVGs at `16px` × `16px` (matching `{typography.body-md}` line height). A formal icon set is a future iteration.
- **Form validation messages** — error text styling is implicit from `text-input-error` but no dedicated `form-error` component exists. Use `{typography.caption}` in `{colors.danger}` with `{spacing.xs}` top margin.
- **Keyboard shortcuts display** — `kbd` elements currently use `{typography.code-sm}` but no dedicated spec exists. Recommend `{rounded.xs}` background in `{colors.background-bone}` with `{spacing.xs}` padding.
- **Pages behind authentication** — dashboard layouts, settings panels, and logged-in surfaces have not been extracted into tokens. These may introduce additional navigation and layout components.

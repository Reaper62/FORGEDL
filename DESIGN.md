---
name: FORGERDL
description: Universal media extraction workstation — quietly capable, Nothing OS-inspired
colors:
  instrument-black: '#030712'
  panel-dark: '#0f1117'
  surface: '#111827'
  surface-raised: '#1f2937'
  border-subtle: '#1f2937'
  border-default: '#374151'
  ink-primary: '#f9fafb'
  ink-secondary: '#9ca3af'
  ink-muted: '#6b7280'
  ink-ghost: '#4b5563'
  signal-blue: '#3b82f6'
  signal-blue-hover: '#60a5fa'
  signal-blue-muted: '#1e3a5f'
  signal-red: '#ef4444'
  signal-red-muted: '#7f1d1d'
  signal-green: '#22c55e'
  signal-green-muted: '#14532d'
  signal-yellow: '#eab308'
  signal-yellow-muted: '#713f12'
  signal-purple: '#a855f7'
typography:
  display:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: '0.03em'
  mono:
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace"
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: '6px'
  md: '8px'
  lg: '12px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
  section: '48px'
components:
  button-primary:
    backgroundColor: '{colors.signal-blue}'
    textColor: '{colors.ink-primary}'
    rounded: '{rounded.md}'
    padding: '10px 24px'
  button-primary-hover:
    backgroundColor: '{colors.signal-blue-hover}'
  button-secondary:
    backgroundColor: '{colors.surface-raised}'
    textColor: '{colors.ink-secondary}'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-secondary}'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  input-default:
    backgroundColor: '{colors.instrument-black}'
    textColor: '{colors.ink-primary}'
    rounded: '{rounded.md}'
    padding: '10px 16px'
  card-surface:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink-primary}'
    rounded: '{rounded.lg}'
    padding: '24px'
  chip-status:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-secondary}'
    rounded: '{rounded.full}'
    padding: '2px 8px'
  nav-item:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-secondary}'
    rounded: '{rounded.md}'
    padding: '10px 12px'
  nav-item-active:
    backgroundColor: '{colors.signal-blue-muted}'
    textColor: '{colors.signal-blue-hover}'
    rounded: '{rounded.md}'
    padding: '10px 12px'
---

# Design System: yt-dlp GUI

## 1. Overview

**Creative North Star: "The Control Room"**

A precision instrument panel. Dark, dense, purposeful — every readout earns its place. The interface draws from Nothing OS's dot-matrix restraint: monochrome fields, typography as the primary visual element, signal colors deployed sparingly and always to convey state. The system is built for users who sit in front of it for hours — downloading, converting, managing media — and it rewards that sustained attention with clarity, not decoration.

The Control Room rejects everything that screams "template." No pastel cards, no gradient accents, no rounded-pill containers pretending to be friendly. This is a tool that respects its user enough to be quiet. Personality lives in precision: tight type hierarchy, deliberate negative space, state transitions that inform rather than entertain.

**Key Characteristics:**

- Monochrome foundation with signal-color accents reserved for state (blue = active/primary, red = error, green = success, yellow = waiting, purple = processing)
- Single font family (Inter) at a tight 1.125 scale ratio — no display/body split, no decorative typefaces
- Tonal layering for depth: surfaces differ by lightness steps, not shadows; elevation appears only on interaction (hover, focus, active)
- Dense but scannable: information-rich panels that a power user reads at a glance, never cluttered

## 2. Colors

A near-black monochrome ramp with five signal colors. The palette is intentionally narrow: the fewer colors that appear, the more each one means.

### Primary

- **Signal Blue** (#3b82f6): Active state, primary actions, selected navigation, progress indicators. The only color that appears in the default resting state of interactive elements. Used on ≤10% of any surface.
- **Signal Blue Hover** (#60a5fa): Lighter step for hover/focus on primary actions.
- **Signal Blue Muted** (#1e3a5f): Background tint for active nav items and blue-tagged status chips. Never a standalone surface.

### Semantic Signals

- **Signal Red** (#ef4444): Errors, failed states, destructive actions. Paired with **Signal Red Muted** (#7f1d1d) as background for error chips.
- **Signal Green** (#22c55e): Completed state, success confirmations. Paired with **Signal Green Muted** (#14532d).
- **Signal Yellow** (#eab308): Waiting/queued state, warnings. Paired with **Signal Yellow Muted** (#713f12).
- **Signal Purple** (#a855f7): Processing states (merging, embedding, verifying). Secondary to blue, used when the system is doing backend work.

### Neutral

- **Instrument Black** (#030712): Deepest layer — input fields, code blocks, inset surfaces. The void behind the instruments.
- **Panel Dark** (#0f1117): App shell background, sidebar. One step above void.
- **Surface** (#111827): Primary content cards, sections. The main reading surface.
- **Surface Raised** (#1f2937): Hover states, secondary buttons, elevated elements. One step above surface.
- **Border Subtle** (#1f2937): Card and section borders at rest. Nearly invisible — just enough to separate, not enough to draw a box.
- **Border Default** (#374151): Input borders, active separators. Visible but quiet.
- **Ink Primary** (#f9fafb): Headings, body text, primary labels. Near-white, not pure white.
- **Ink Secondary** (#9ca3af): Secondary text, descriptions, inactive nav items. Mid-gray, passes 4.5:1 on Panel Dark.
- **Ink Muted** (#6b7280): Tertiary text, timestamps, helper text. Use sparingly; verify contrast on every background.
- **Ink Ghost** (#4b5563): Placeholder text, version labels, the quietest text in the system. Passes 4.5:1 only on Instrument Black.

### Named Rules

**The Signal Economy Rule.** Signal colors (blue, red, green, yellow, purple) are state indicators, not decoration. If an element isn't communicating active state, it's gray. No colored icons on section headings, no tinted backgrounds on resting cards, no accent borders.

## 3. Typography

**Primary Font:** Inter (with system-ui, -apple-system, sans-serif fallback)
**Monospace Font:** SF Mono → Cascadia Code → Fira Code → JetBrains Mono

**Character:** One family, many duties. Inter carries everything from page headings to 11px status labels. The system differentiates hierarchy through weight and size, never through typeface variety. Monospace appears only for paths, format strings, and error output — places where character alignment matters.

### Hierarchy

- **Display** (700, 1.5rem / 24px, line-height 1.2, letter-spacing -0.02em): Page titles only. Dashboard, Settings, Download History. One per screen.
- **Headline** (600, 1.125rem / 18px, line-height 1.3, letter-spacing -0.01em): Section headings within a page. "Quick Download", "Queue", "Queue Metrics".
- **Title** (500, 0.875rem / 14px, line-height 1.4): Download item titles, form field labels, card sub-headings.
- **Body** (400, 0.875rem / 14px, line-height 1.5): Descriptions, helper text, table cells. Max line length 65–75ch for prose blocks.
- **Label** (500, 0.6875rem / 11px, line-height 1.3, letter-spacing 0.03em): Status badges, stat labels ("Total", "Downloading"), metadata labels. Uppercase only for status indicators.
- **Mono** (400, 0.8125rem / 13px, line-height 1.5): File paths, yt-dlp format strings, ffmpeg paths, error stack traces.

### Named Rules

**The One-Family Rule.** Inter is the only typeface in the system. No display fonts for headings, no decorative type, no font-pairing. Hierarchy through weight and scale alone. The monospace stack is a tool, not a second voice.

## 4. Elevation

This system is flat by default. Surfaces separate through tonal layering: Instrument Black → Panel Dark → Surface → Surface Raised, each a discrete lightness step. No resting shadows on any element.

Elevation appears only as a response to interaction:

### State-Driven Elevation

- **Hover:** Elements shift one tonal step lighter (Surface → Surface Raised). `transition: background-color 150ms ease-out`.
- **Focus-visible:** 2px ring in Signal Blue at 40% opacity, offset 2px from the element. `box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4)`.
- **Active/pressed:** Element drops back to its resting tone. No downward shadow; the removal of the hover lift IS the feedback.
- **Dropdowns, modals, toasts:** These deserve real shadows — `0 8px 24px rgba(0, 0, 0, 0.5)` — because they float above the tonal stack and need to signal that detachment.

### Named Rules

**The Earned Shadow Rule.** Shadows are prohibited at rest. They appear on hover, focus, or floating overlays — never as ambient decoration. If an element needs to stand out at rest, use a border or a tonal step, not a shadow.

## 5. Components

### Buttons

- **Shape:** Gently squared (8px radius). Not pill-shaped, not sharp-cornered.
- **Primary:** Signal Blue background, white text, 10px 24px padding. 14px Inter semibold. The loudest element on screen — used for one primary action per view ("Download", "Save Settings").
- **Hover:** Background shifts to Signal Blue Hover. 150ms ease-out. On focus-visible, 2px blue ring.
- **Secondary:** Surface Raised background, Ink Secondary text. Same padding. For "Open Downloads Folder", "Fetch Info".
- **Ghost:** Transparent background, Ink Secondary text, 1px border in Border Default. For "Reset to Defaults", "Clear Completed", "Reload Application". Border lightens on hover.
- **Disabled:** 40% opacity, cursor not-allowed. No color shift.
- **Loading:** Text changes to loading copy ("Saving...", "Loading..."), no spinner replacement.

### Cards / Containers

- **Corner style:** Comfortably rounded (12px radius on outer cards, 8px on nested elements like stat boxes).
- **Background:** Surface (#111827) for primary cards. Instrument Black (#030712) for inset/nested containers (stat boxes, error details).
- **Border:** 1px Border Subtle (#1f2937) at rest. No shadow.
- **Hover:** Border shifts to Border Default (#374151). 150ms transition.
- **Internal padding:** 24px for section cards, 14px for compact inner cards (stat boxes, download items).

### Inputs / Fields

- **Style:** Instrument Black background, 1px Border Default border, 8px radius. 14px Inter, white text. 10px 16px padding.
- **Placeholder:** Ink Ghost (#4b5563). Must pass 4.5:1 on Instrument Black.
- **Focus:** Border shifts to Signal Blue. No glow, no ring — border color is the focus signal.
- **Error:** Error text below in Signal Red, 12px. Border does NOT turn red (avoids double-signaling with the error message).
- **Disabled:** 50% opacity.

### Navigation (Sidebar)

- **Container:** Panel Dark background, 240px wide, full height. Border-right 1px Border Subtle.
- **Items:** 14px Inter medium, Ink Secondary text. 10px 12px padding, 8px radius.
- **Active:** Signal Blue Muted background, Signal Blue Hover text. 1px border in signal-blue at 30% opacity.
- **Hover (inactive):** Background shifts to Surface Raised. Text shifts to Ink Primary.
- **Footer:** Version label in Ink Ghost, centered, 12px.

### Status Badges

- **Shape:** Full-pill radius (9999px). Compact: 2px 8px padding.
- **Pattern:** Tinted background at 10% signal color + signal color text. Example: `bg-green-500/10 text-green-400`.
- **Icons:** 12px Lucide icon inline-start. Icon inherits text color.
- **States:** completed (green), error (red), waiting (yellow), downloading (blue), paused/cancelled (gray), processing states (purple).

### Progress Bars

- **Track:** Surface Raised, 6px height, full-radius.
- **Fill:** Signal Blue for downloading, Signal Purple for processing. `transition: width 300ms ease-out`.
- **Text:** Below the bar, 11px Label weight, Ink Muted. Left-aligned percentage, right-aligned speed + ETA.

### Empty States

- **Pattern:** Centered vertically. 48px circle in Surface Raised containing a 24px Lucide icon in Ink Ghost. Heading in Ink Muted (medium weight), subtext in Ink Ghost (12px).
- **Voice:** Instructive, not cute. "Queue is empty" + "Add a URL above to get started" — not "Nothing to see here! 🎉".

## 6. Do's and Don'ts

### Do

- **Do** use Signal Blue exclusively for the single primary action on each screen. Everything else is gray.
- **Do** differentiate surfaces by tonal layering (Instrument Black → Panel Dark → Surface → Surface Raised). The four-step ramp is the depth vocabulary.
- **Do** keep Inter as the only typeface. Differentiate with weight (400, 500, 600, 700) and size (11px–24px).
- **Do** use monospace only for paths, format strings, CLI output, and error traces — never for labels or headings.
- **Do** verify 4.5:1 contrast ratio for every text/background pairing. Gray-on-dark is the most common failure.
- **Do** use 150ms ease-out for background and border color transitions. State changes are fast; the user is in flow.
- **Do** respect `prefers-reduced-motion`: all transitions degrade to instant.
- **Do** build empty states that teach the interface. "Add a URL above to get started" — not "Nothing here."

### Don't

- **Don't** use colored icons on section headings. The current code puts blue, purple, green, and yellow Lucide icons on every `h3`. These violate the Signal Economy Rule — color is for state, not decoration.
- **Don't** use generic SaaS dashboard patterns: rounded pastel cards, soft shadows, cookie-cutter stat grids with identical card shapes (PRODUCT.md anti-reference).
- **Don't** use neon glows, RGB gradients, or aggressive dark-mode accents (PRODUCT.md anti-reference: gamer/neon aesthetic).
- **Don't** use border-left or border-right > 1px as a colored accent stripe (absolute ban).
- **Don't** use gradient text or background-clip: text (absolute ban).
- **Don't** use glassmorphism as a default surface treatment (absolute ban). Blur is permitted on modals/overlays only when it serves a functional purpose (dimming background content).
- **Don't** build identical card grids with the same icon + heading + text repeated in a 2×2/3×3 pattern (absolute ban). The stat boxes in Dashboard and History currently repeat this pattern — vary the layout.
- **Don't** add decorative motion. No orchestrated page-load sequences, no bounce, no elastic easing. Users are mid-task; don't make them watch.
- **Don't** use display fonts, serif fonts, or font pairings. One family. One voice.
- **Don't** ship components with half their states missing. Every interactive element needs: default, hover, focus-visible, active, disabled, loading, error.

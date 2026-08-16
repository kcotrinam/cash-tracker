---
name: Quiet Capital
colors:
  surface: '#0e141a'
  surface-dim: '#0e141a'
  surface-bright: '#343a41'
  surface-container-lowest: '#090f15'
  surface-container-low: '#161c23'
  surface-container: '#1a2027'
  surface-container-high: '#252b31'
  surface-container-highest: '#2f353c'
  on-surface: '#dde3ec'
  on-surface-variant: '#c5c6ca'
  inverse-surface: '#dde3ec'
  inverse-on-surface: '#2b3138'
  outline: '#8f9194'
  outline-variant: '#44474a'
  surface-tint: '#c6c6c9'
  primary: '#c6c6c9'
  on-primary: '#2f3133'
  primary-container: '#1a1c1e'
  on-primary-container: '#838486'
  inverse-primary: '#5d5e61'
  secondary: '#c5c7c6'
  on-secondary: '#2e3131'
  secondary-container: '#474a49'
  on-secondary-container: '#b7b9b8'
  tertiary: '#cfc5be'
  on-tertiary: '#352f2b'
  tertiary-container: '#201b17'
  on-tertiary-container: '#8b837d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e5'
  primary-fixed-dim: '#c6c6c9'
  on-primary-fixed: '#1a1c1e'
  on-primary-fixed-variant: '#454749'
  secondary-fixed: '#e1e3e2'
  secondary-fixed-dim: '#c5c7c6'
  on-secondary-fixed: '#191c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ebe0da'
  tertiary-fixed-dim: '#cfc5be'
  on-tertiary-fixed: '#201b17'
  on-tertiary-fixed-variant: '#4c4641'
  background: '#0e141a'
  on-background: '#dde3ec'
  surface-variant: '#2f353c'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  mono-value:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  touch-target-min: 48px
---

## Brand & Style

The design system focuses on "Quiet Confidence." It is tailored for independent professionals who require financial clarity without the anxiety-inducing clutter of traditional banking or the over-stimulation of gamified fintech. The style is **High-End Minimalism** mixed with **Modern Utility**.

The interface prioritizes cognitive ease through generous whitespace, high-contrast legibility, and a calm, human-centric aesthetic. It avoids aggressive gradients and loud marketing patterns in favor of a stable, architectural structure. The emotional response should be one of "controlled focus"—where the user feels in command of their data rather than overwhelmed by it.

## Colors

The palette is rooted in a deep "Ink" primary color, now utilizing a **dark mode configuration** to provide an immersive, focused environment for financial analysis. This shift reduces eye strain during extended deep-work sessions while maintaining a sophisticated, premium feel.

- **Primary (Ink):** The foundational anchor of the system. In dark mode, it defines the deepest structural layers and high-emphasis interactive states.
- **Surface:** A calibrated series of dark greys and "Inky" tones that create depth and hierarchy without relying on pure black, maintaining a soft, professional look.
- **Secondary (Snow):** A brilliant near-white used sparingly for high-contrast accents, typography, and critical actions to ensure they pop against the dark backdrop.
- **Income (Sage):** A restrained green that signifies growth, balanced for visibility on dark surfaces without excessive vibrance.
- **Expense (Terracotta):** A muted coral used to highlight outflows, providing clear signal strength within the dark UI.
- **Dark Mode:** This system is optimized for dark mode to ensure maximum focus and a premium, high-end digital experience for professional financial workflows.

## Typography

This design system utilizes a systematic grotesque sans-serif (Geist) to bridge the gap between technical precision and approachable design. In the dark mode environment, typography is rendered in high-contrast "Snow" or muted greys to ensure effortless legibility.

**Financial Values:** Large currency amounts should use `display-lg` or `mono-value`. Numbers are the most important data points and must be unobstructed. 
**Hierarchy:** Use `label-sm` in a muted grey to provide context without competing with the primary data. 
**Readability:** Body text is set with a generous line height (1.6) to ensure financial notes and descriptions are easily scannable against the dark background.

## Layout & Spacing

The layout follows a **Fixed Grid** on desktop and a **Fluid Content Model** on mobile.

- **Desktop:** A slim, 80px fixed sidebar provides primary navigation, maximizing the horizontal space for data tables and charts. Content is centered in a 1200px container to prevent eye fatigue on wide displays.
- **Mobile:** Transition to a 64px height bottom navigation bar. Margins are reduced to 16px to give the data more room.
- **Rhythm:** Every spacing value must be a multiple of 8px. Use 32px or 48px gaps between major sections to emphasize the "Minimalist" breathing room.
- **Targets:** All interactive elements (buttons, list items, checkboxes) must maintain a minimum height of 48px for accessibility and ease of use on touch devices.

## Elevation & Depth

This design system avoids heavy drop shadows. Instead, it uses **Tonal Layers** and **Ghost Outlines** optimized for a dark environment.

- **Surface Levels:** The background uses the deepest "Ink" variant. Cards and main containers use slightly lighter grey surfaces (Surface Container) to create natural distinction and signify elevation.
- **Outlines:** Use subtle, low-opacity borders (Outline Variant) for cards rather than heavy shadows. In dark mode, these borders are essential for defining edges where shadows might be invisible.
- **Active State:** Only the primary "Action" elements may use a soft tonal shift or a very slight, high-diffused inner glow when hovered to provide tactile feedback.

## Shapes

The shape language is "Soft-Neutral." We use a conservative border-radius to maintain a professional, structured feel while avoiding the harshness of 90-degree corners.

- **Standard Components:** 4px (0.25rem) radius for buttons, inputs, and small widgets.
- **Large Containers:** 8px (0.5rem) radius for cards and main content areas.
- **Iconography:** Use a "Medium" stroke weight (2px) with slightly rounded ends to match the typographic terminals of the font.

## Components

- **Buttons:** Primary buttons are solid "Snow" (Secondary) with "Ink" text for maximum visibility in the dark UI. Secondary buttons are ghost-style with a subtle outline. No gradients.
- **Cards:** Defined by subtle surface color steps (Surface Container) or light tonal fill changes to differentiate from the main background.
- **Inputs:** Large, 48px height fields with a dark surface and a 1px border that thickens or brightens on focus. Labels are persistent and placed above the field.
- **Financial Lists:** Each row has a 56px minimum height. Inflows (Sage) and Outflows (Terracotta) are indicated by color-coded amounts, optimized for contrast against dark surfaces.
- **Chips:** Used for categorization. These are low-contrast (Surface variant background, light text) and use the `label-sm` typography.
- **Bottom Navigation:** Mobile-only. Icons are accompanied by text labels to ensure clarity for professional users.
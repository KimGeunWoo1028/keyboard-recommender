---
name: Cyber-Artisan
colors:
  surface: '#15121b'
  surface-dim: '#15121b'
  surface-bright: '#3b3742'
  surface-container-lowest: '#0f0d15'
  surface-container-low: '#1d1a23'
  surface-container: '#211e27'
  surface-container-high: '#2c2832'
  surface-container-highest: '#37333d'
  on-surface: '#e7e0ed'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e7e0ed'
  inverse-on-surface: '#322f39'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#15121b'
  on-background: '#e7e0ed'
  surface-variant: '#37333d'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for a demographic that demands high-precision data visualization merged with the bespoke aesthetic of custom mechanical keyboards. The brand personality is **Elite, Analytical, and Atmospheric**, evoking the feeling of a high-end workshop at midnight.

The visual style is a sophisticated blend of **Glassmorphism** and **Corporate Modernism**. It utilizes deep, ink-like surfaces paired with ultra-refined translucent panels. This creates a sense of physical layering, as if the user is interacting with an advanced hardware interface. The emotional response is one of total control and premium craftsmanship—shifting the product from a mere tool to a digital collectible.

## Colors
The palette is rooted in a deep "Cyber Slate" to provide maximum contrast for neon-inflected data points.

- **Primary (Electric Purple):** Used for primary actions, active states, and high-priority branding elements. It carries a subtle outer glow in active states.
- **Secondary (Neon Blue):** Utilized for secondary interactive elements and informational data streams.
- **Data Visualization:** Emerald (#10B981) represents positive growth and "Optimal" hardware status, while Gold (#F59E0B) is reserved for warnings, artisan highlights, and premium tiered data.
- **Background:** The base is #0D0D15, with surface layers using increasing levels of transparency and slight blue-tinted desaturation to maintain depth.

## Typography
The typography strategy focuses on "Technical Clarity." 

**Hanken Grotesk** is used for headlines to provide a sharp, contemporary edge that feels designed rather than default. **Inter** handles the heavy lifting of data-dense body text for maximum legibility. **JetBrains Mono** is strategically deployed for metadata, hardware specs, and serial numbers to lean into the "Precision" brand pillar. 

Letter spacing is tightened for large headlines to create a "locked-in" look and expanded slightly for monospaced labels to ensure readability at small scales.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The spacing rhythm is strictly based on a **4px base unit**, ensuring that every element—from the smallest icon to the largest layout container—feels mathematically aligned.

- **Desktop:** Large 40px margins allow the "Glass" containers to breathe against the dark background.
- **Tablets:** Gutters reduce to 16px to maximize data density.
- **Mobile:** Elements reflow to a single stack. Cards should lose their heavy external shadows but retain their inner borders to preserve structure.

## Elevation & Depth
Depth is not communicated through simple shadows, but through **Tonal Stacking and Backdrop Blurs**.

1.  **Level 0 (Base):** #0D0D15 (Solid).
2.  **Level 1 (Panels):** Background blur (20px) with a semi-transparent fill (rgba(255, 255, 255, 0.03)) and a 1px "ghost border" (rgba(255, 255, 255, 0.1)).
3.  **Level 2 (Popovers/Modals):** Increased blur (40px) with a subtle multi-layered shadow: one tight dark shadow for definition and one wide, low-opacity purple-tinted shadow for a "neon glow" effect.

Interactions should trigger a slight increase in the "ghost border" opacity, making the element feel as if it is lighting up from within.

## Shapes
In line with the "High-end Hardware" aesthetic, shapes are generously rounded but structured. 

- **Containers & Cards:** 16px (rounded-lg) is the standard to mimic the rounded corners of premium keyboard cases.
- **Buttons & Inputs:** 12px for a comfortable, ergonomic feel.
- **Status Chips:** Full pill-shape for immediate visual distinction from actionable buttons.

## Components
- **Buttons:** Primary buttons use a solid Electric Purple fill with a subtle "inner glow" border. Hovering triggers a soft neon drop shadow. Secondary buttons are "Ghost" style with a 1px border.
- **Glass Panels:** Used for dashboard widgets. They must include `backdrop-filter: blur(20px)` and a top-to-bottom linear gradient border to simulate light hitting the edge of a glass plate.
- **Inputs:** Darker than the panel level (rgba(0,0,0,0.2)) with a 1px border that glows Electric Purple on focus. Labels use JetBrains Mono for a "terminal" feel.
- **Data Charts:** Use thin, 2px stroke weights for line charts. Fill areas with a vertical gradient that fades from the brand color to transparent.
- **Chips:** Small, low-contrast backgrounds with bright text. Used for hardware tags (e.g., "Linear", "Tactile", "PBT").
- **Custom Scrollbars:** Minimalist, rounded, and styled in the secondary blue color with 0px background to avoid breaking the glass aesthetic.
# Design System Document: The Premium Hospitality Experience

## 1. Overview & Creative North Star: "The Digital Concierge"
This design system moves beyond the utility of a standard loyalty app to create a "Digital Concierge" experience. For a context like a 'Beer House' or high-end hospitality suite, the interface must feel as curated as a craft menu. 

The Creative North Star is **Sophisticated Fluidity**. We achieve this by breaking the rigid, boxed-in "template" look common in Telegram Mini Apps. Instead of standard grids, we use intentional asymmetry, overlapping layers, and dramatic typographic scales. This creates an editorial feel where the UI breathes, suggesting premium quality and trustworthiness through "white space" and tonal depth rather than cluttered features.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is anchored in authoritative deep blues (`primary`) and elevated by "Liquid Gold" accents (`secondary`). 

### The "No-Line" Rule
**Explicit Instruction:** Junior designers are prohibited from using 1px solid borders to define sections. High-end UI relies on "Soft Segmentation." 
*   **Method:** Use background shifts. A `surface-container-low` section sitting on a `surface` background creates a clear but sophisticated boundary.
*   **The Glass & Gradient Rule:** For main CTAs or Hero sections, do not use flat colors. Apply a subtle linear gradient from `primary` (#005f9e) to `primary_container` (#1278c3) at a 135° angle. This adds "visual soul" and mimics the sheen of high-quality glassware.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
*   **Base:** `surface` (#f9f9fc)
*   **Sectioning:** `surface_container_low` (#f3f3f6)
*   **Elevated Content:** `surface_container_highest` (#e2e2e5)
*   **Floating Elements:** Use `surface` with 80% opacity and a `backdrop-blur` of 20px to create a glassmorphism effect for sticky headers or navigation bars.

---

## 3. Typography: Editorial Authority
We use a tri-font system to balance character with readability.

*   **Display & Headlines (Plus Jakarta Sans):** These are your "Brand Voice." Use `display-lg` for points balances and `headline-md` for section titles. The generous x-height of Plus Jakarta Sans feels modern and inviting.
*   **Titles & Body (Be Vietnam Pro):** This is your "Information Layer." It is clean and highly legible. Use `title-lg` for menu items and `body-md` for descriptions.
*   **Labels (Inter):** Reserved for technical data, timestamps, or small metadata. Inter provides a "system" feel that grounds the more expressive brand fonts.

**Hierarchy Tip:** Contrast a `display-sm` (36pt) value with a `label-md` (12pt) descriptor immediately below it. This "High-Low" pairing is a hallmark of premium editorial design.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "dirty" for this brand. We use **Ambient Lighting**.

*   **The Layering Principle:** To lift a card, place a `surface_container_lowest` (#ffffff) card on a `surface_container_low` (#f3f3f6) background. The 2% contrast shift is enough for the eye to perceive depth without visual noise.
*   **Ambient Shadows:** If a floating element (like a FAB) is required, use a shadow with a 40px blur, 0px offset, and 6% opacity using a tint of `on_surface` (#1a1c1e).
*   **The Ghost Border:** If accessibility requires a stroke, use `outline_variant` at 15% opacity. Never use 100% opaque borders.

---

## 5. Components: Soft & Intentional

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Radius: `md` (1.5rem). No shadow; use a slight inner-glow (1px white at 10% opacity) on the top edge.
*   **Secondary:** `secondary_fixed` (#ffdf9e) with `on_secondary_fixed` (#261a00) text. This is your "Gold" accent for loyalty rewards.

### Cards & Lists
*   **Forbid Dividers:** Do not use lines to separate list items. Use a `12` (3rem) vertical spacing scale or alternate subtle background tints.
*   **Loyalty Card:** Use `primary` background with a `tertiary_fixed` (#69ff87) accent for "Active" status. Use `xl` (3rem) rounded corners for the main loyalty card to make it feel like a physical "pocket" item.

### Input Fields
*   **Style:** `surface_container_highest` background with `none` border. On focus, transition to a `Ghost Border` using `primary`.
*   **Corner Radius:** `sm` (0.5rem) to differentiate utility from the `md` (1.5rem) "friendly" action buttons.

### Chips
*   **Filter Chips:** Use `surface_container_high` with `body-sm` typography. When selected, switch to `primary_fixed` with `on_primary_fixed` text.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Place a large `display-lg` number on the left and a small `label-md` block of text stacked vertically on the right.
*   **Use Generous Padding:** When in doubt, use `8` (2rem) or `10` (2.5rem) from the spacing scale. White space is a luxury signal.
*   **Native Feel:** Use Telegram's haptic feedback patterns for all `Primary` button interactions.

### Don't:
*   **Don't use 100% Black:** Always use `on_background` (#1a1c1e) for text to maintain a softer, premium look.
*   **Don't use "Standard" Corners:** Avoid the default 4px or 8px. Stick to the `DEFAULT` (1rem) or `md` (1.5rem) to maintain the "friendly" brand promise.
*   **Don't Over-Color:** Keep 90% of the UI in `surface` and `surface_container` tiers. Save `primary` and `secondary` for the moments that truly matter (CTA, Rewards, Branding).
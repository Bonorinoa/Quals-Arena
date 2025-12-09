# highBeta Design System v4.0

## Overview
The highBeta design system embodies a **deep ocean / dark academic** aesthetic - creating an atmosphere of calm focus and meditative depth. The UI aims to be the "Liquid Death" of productivity apps: bold, focused, and uncompromising.

## Design Philosophy
- **Depth over Flatness**: Multi-layered glass effects with genuine depth perception
- **Calm Intensity**: Dark, focused atmosphere that promotes flow states
- **Subtle Motion**: Animations that guide without distracting
- **Academic Rigor**: Clean typography, precise spacing, structured hierarchy

## Color Palette

### Primary Colors
```css
--abyss-950: #05050a     /* Deepest background */
--abyss-900: #09090f     /* Primary background */
--abyss-850: #0d0d15     /* Elevated surfaces */
--abyss-800: #12121c     /* Interactive surfaces */
```

### Ocean Depths
```css
--ocean-950: #0a1628     /* Deep blue accent */
--ocean-900: #0f1f3a     /* Medium depth */
--ocean-800: #162d4d     /* Surface waters */
--ocean-700: #1e3c5f     /* Highlights */
```

### Accents
```css
--ember-500: #10b981      /* Success / positive actions */
--ember-600: #059669      /* Hover states */
--ember-700: #047857      /* Active states */

--frost-500: #e0f2fe      /* Light accents */
--frost-400: #bae6fd      /* Soft highlights */
--frost-300: #7dd3fc      /* Bright accents */

--crimson-900: #450a0a    /* Danger background */
--crimson-800: #7f1d1d    /* Danger surface */
--crimson-700: #991b1b    /* Danger border */
--crimson-600: #dc2626    /* Danger primary */
```

## Glass Morphism System

### Standard Glass (.glass)
- **Background**: rgba(255, 255, 255, 0.03)
- **Backdrop Blur**: 12px
- **Border**: rgba(255, 255, 255, 0.05)
- **Gradient**: Linear 135deg from rgba(255,255,255,0.05) to rgba(255,255,255,0.01)
- **Use Case**: Cards, containers, modals

### Strong Glass (.glass-strong)
- **Background**: rgba(255, 255, 255, 0.05)
- **Backdrop Blur**: 24px
- **Border**: rgba(255, 255, 255, 0.10)
- **Gradient**: Linear 135deg from rgba(255,255,255,0.08) to rgba(255,255,255,0.02)
- **Use Case**: Navigation, prominent panels, overlays

### Subtle Glass (.glass-subtle)
- **Background**: rgba(255, 255, 255, 0.02)
- **Backdrop Blur**: 4px
- **Border**: rgba(255, 255, 255, 0.03)
- **Use Case**: Nested elements, secondary containers

## Shadows & Depth

### Elevation System
```css
--shadow-glass: 0 8px 32px 0 rgba(0, 0, 0, 0.37)        /* Standard elevation */
--shadow-glass-sm: 0 4px 16px 0 rgba(0, 0, 0, 0.25)    /* Subtle elevation */
--shadow-glass-lg: 0 16px 64px 0 rgba(0, 0, 0, 0.45)   /* High elevation */
--shadow-depth: 0 10px 30px -5px rgba(0, 0, 0, 0.5),
                0 20px 60px -10px rgba(0, 0, 0, 0.4)   /* Multi-layer depth */
```

### Glow Effects
```css
--shadow-glow: 0 0 20px rgba(16, 185, 129, 0.3)        /* Soft glow */
--shadow-glow-lg: 0 0 40px rgba(16, 185, 129, 0.4)     /* Strong glow */
--shadow-inner-glow: inset 0 0 20px rgba(16, 185, 129, 0.1)  /* Inner glow */
```

## Typography

### Font Families
- **Sans-serif (UI)**: Inter, system-ui, sans-serif
- **Monospace (Data)**: JetBrains Mono, Consolas, monospace

### Hierarchy
- **H1**: 2xl-4xl, font-mono, font-bold, tracking-tighter
- **H2**: sm, font-mono, font-bold, uppercase, tracking-widest
- **H3**: xs, font-semibold, uppercase, tracking-wider
- **Body**: sm-base, text-zinc-400
- **Labels**: xs, uppercase, tracking-widest, text-zinc-500, font-mono

## Components

### Buttons

#### Primary Button (.btn-primary)
```css
Background: White
Text: Black
Hover: Frost-500 with glow
Active: Scale 95%
Animation: 200ms transition
```

#### Glass Button (.btn-glass)
```css
Background: Glass effect
Text: White
Hover: Increased opacity, stronger border
Active: Scale 95%
```

#### Danger Button (.btn-danger)
```css
Background: Crimson-900/30
Text: Red-400
Border: Crimson-700/50
Hover: Crimson-800/40, text-red-300
```

### Inputs

#### Glass Input (.input-glass)
```css
Background: Glass effect
Border: Glass border
Focus: Ember-500 border with inner glow
Font: Monospace
Transition: All properties 200ms
```

### Cards

#### Standard Card (.card-glass)
```css
Background: Glass effect
Padding: 1.5rem (24px)
Border Radius: 0.75rem (12px)
Shadow: Elevated
```

#### Strong Card (.card-glass-strong)
```css
Background: Glass-strong effect
Shadow: Elevated-strong
```

## Animations

### Keyframes
- **fadeIn**: 0% opacity 0 → 100% opacity 1
- **slideUp**: Translate Y 10px with fade
- **slideDown**: Translate Y -10px with fade
- **scaleIn**: Scale 0.95 to 1.0 with fade
- **shimmer**: Background position animation
- **float**: Subtle vertical oscillation
- **glowPulse**: Pulsing glow effect

### Timing
- **Quick**: 200ms (button interactions)
- **Standard**: 300ms (page transitions)
- **Slow**: 2-3s (ambient effects)

### Easing
- **ease-out**: Standard interactions
- **ease-in-out**: Smooth transitions
- **cubic-bezier(0.4, 0, 0.6, 1)**: Pulse effects

## Interactive States

### Hover (.interactive:hover)
- Transform: translateY(-2px)
- Shadow: Elevated-strong
- Transition: 200ms ease-out

### Active (.interactive:active)
- Transform: translateY(0)
- Shadow: Standard elevation

### Focus
- Border: Ember-500
- Shadow: Inner-glow or outer glow depending on context
- Outline: None (using border for visual feedback)

## Background System

### Body Background
```css
Base: Abyss-950
Gradient Overlay 1: Radial ellipse at top, Ocean-950 40% opacity
Gradient Overlay 2: Radial ellipse at bottom, Ember-500 5% opacity
Attachment: Fixed
```

### Ambient Gradients
- **Ocean Gradient**: 180deg from Ocean-950 to Abyss-950
- **Aurora**: 120deg with Ember, Blue, and Violet at 10% opacity
- **Glass Gradient**: 135deg for surface highlights

## Accessibility

### Contrast Ratios
- Primary text (zinc-200) on dark: AAA compliant
- Secondary text (zinc-400) on dark: AA compliant
- Interactive elements: Minimum 3:1 contrast

### Focus Management
- All interactive elements have visible focus states
- Tab navigation follows logical flow
- Modal focus trapping implemented
- ARIA labels on icon-only buttons

### Motion
- Respect prefers-reduced-motion
- All animations can be disabled
- No motion-triggered seizure risks

## Usage Guidelines

### Do's
✅ Use glass effects for depth and hierarchy
✅ Layer shadows to create genuine 3D perception
✅ Apply glow effects to interactive or important elements
✅ Use ember accent for success/progress states
✅ Apply crimson for warnings and destructive actions
✅ Use monospace fonts for data and metrics
✅ Maintain consistent spacing (4px grid system)

### Don'ts
❌ Don't overuse glow effects (visual noise)
❌ Don't stack too many glass layers (readability)
❌ Don't use pure white (too harsh)
❌ Don't animate everything (focus on meaning)
❌ Don't ignore dark mode accessibility
❌ Don't break the grid system

## Implementation Notes

### Tailwind Integration
The design system is implemented as a Tailwind CSS configuration with custom utilities. All classes are available throughout the application.

### Performance
- Backdrop blur is GPU-accelerated
- Animations use transform and opacity (performant)
- Shadow rendering is optimized with will-change hints where appropriate

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Backdrop blur fallbacks for older browsers
- Progressive enhancement approach

## Future Enhancements (v4.1+)
- [ ] Particle system for ambient depth
- [ ] Liquid transitions between views  
- [ ] Adaptive color temperature based on time of day
- [ ] Texture overlays for tactile depth
- [ ] Advanced micro-interactions
- [ ] Sound design integration
- [ ] Haptic feedback for mobile

## Version History
- **v3.0**: Basic dark theme with minimal glass effects
- **v3.1**: Proper Tailwind setup, design system foundation
- **v4.0**: Complete glass morphism system, deep ocean aesthetic, comprehensive design tokens

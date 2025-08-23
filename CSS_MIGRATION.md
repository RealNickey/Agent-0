# SCSS to Tailwind CSS Migration

This document outlines the migration of SCSS styles to Tailwind CSS in the project.

## Migration Overview

The following components were migrated from SCSS to Tailwind CSS:

1. **AudioPulse**: Converted audio visualization pulse styles
2. **ControlTray**: Converted control tray layout and button styles
3. **Logger**: Converted logging display styles
4. **SettingsDialog**: Converted settings modal styles
5. **ResponseModalitySelector**: Converted select group styles
6. **VoiceSelector**: Converted voice selector styles
7. **App**: Applied Tailwind classes to main layout

## Implementation Details

### Custom Utilities Added

The following custom utilities were added to the Tailwind configuration:

```js
// Animation utilities
keyframes: {
  pulseHover: {
    '0%': { transform: 'translateY(0)' },
    '100%': { transform: 'translateY(-3.5px)' }
  },
  opacityPulse: {
    '0%': { opacity: '0.9' },
    '50%': { opacity: '1' },
    '100%': { opacity: '0.9' }
  }
},
animation: {
  pulseHover: 'pulseHover 1.4s infinite alternate ease-in-out',
  opacityPulse: 'opacityPulse 3s ease-in infinite'
},

// Size utilities
minHeight: {
  '1': '0.25rem'
},

// Additional colors
colors: {
  'red': {
    '400': 'var(--Red-400)',
    '500': 'var(--Red-500)'
  },
  'blue': {
    '500': 'var(--Blue-500)',
    '800': 'var(--Blue-800)'
  }
}
```

### CSS Variables

CSS variables were centralized in a `variables.css` file and imported in `_app.tsx`. This file includes:

- Custom animations (`opacity-pulse`, `pulseHover`)
- CSS custom property for volume visualization

### Component-Specific Changes

#### AudioPulse

- Converted flex layout and styling
- Added custom animation for hover effect
- Maintained responsive volume visualization

#### ControlTray

- Converted absolute positioning and flex layout
- Maintained complex button state handling (active, hover, focus)
- Added volume visualization using custom CSS variables

#### Logger

- Converted rich log display styles
- Maintained syntax highlighting and message formatting

#### SettingsDialog

- Converted modal dialog styling
- Maintained form element and select styling

## Benefits of Migration

1. **Consistency**: Uniform styling approach across the application
2. **Maintainability**: Reduced CSS complexity with utility classes
3. **Scalability**: Easier to extend UI with Tailwind's utility-first approach
4. **Performance**: Reduced CSS bundle size with utility classes

## Notes

Some complex styles that weren't easily representable in Tailwind (like the `--volume` CSS variable) were kept as custom CSS in the `variables.css` file.

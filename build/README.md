# Icon Generation

This directory contains the icon generation system for Prototoy.

## How It Works

The [`generate-icons.js`](./generate-icons.js) script automatically generates app icons from the [`prototoy-logo.svg`](../prototoy-logo.svg) file.

### Process

1. **SVG to PNG Conversion**: The SVG is converted to a 1024×1024 PNG using `sharp`
2. **Resizing**: The PNG is resized to multiple dimensions needed for different platforms:
   - `icon.png` (512×512) - Main app icon
   - `icon-16x16.png` through `icon-512x512.png` - Platform-specific variants
3. **Icon Storage**: All generated icons are stored in `build/icon/`
4. **Platform Integration**: 
   - **Linux**: Uses the PNG variants directly
   - **Windows**: electron-builder converts these to `.ico` format
   - **macOS**: electron-builder converts these to `.icns` format

## Usage

### Manual Generation
```bash
npm run icons
```

### Automatic Generation
Icons are automatically generated before packaging:
```bash
npm run package
```

This runs the icon generation script, builds the app, and packages it with electron-builder.

## Adding to Development Workflow

To regenerate icons whenever you update `prototoy-logo.svg`:

```bash
npm run icons
```

The icons are ready to use immediately in the build process.

## Customizing Icon Sizes

Edit the `sizes` object in [`generate-icons.js`](./generate-icons.js) to add or remove icon sizes:

```javascript
const sizes = {
  'icon.png': 512,         // Main app icon
  'icon-256x256.png': 256, // Custom size
  // ... other sizes
};
```

## Dependencies

- **sharp**: Image processing and resizing
- **electron-builder**: Handles platform-specific icon conversion
- **icojs** and **icns**: Available for future platform-specific conversions

## Generated Files

Files in `build/icon/` are **generated artifacts** and should not be manually edited or committed to version control (though they can be kept if needed).

See [`electron-builder.yml`](../electron-builder.yml) for icon configuration.

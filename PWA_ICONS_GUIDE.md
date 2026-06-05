# PWA Icons Generation Guide

## Required Icon Sizes

The PWA manifest requires the following icon sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Quick Generation Options

### Option 1: Online Icon Generator (Recommended for quick setup)
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload `/public/icon.svg`
3. Download generated icons
4. Place PNG files in `/public/` directory with names:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Generate all sizes from SVG
cd public
convert icon.svg -resize 72x72 icon-72x72.png
convert icon.svg -resize 96x96 icon-96x96.png
convert icon.svg -resize 128x128 icon-128x128.png
convert icon.svg -resize 144x144 icon-144x144.png
convert icon.svg -resize 152x152 icon-152x152.png
convert icon.svg -resize 192x192.png icon-192x192.png
convert icon.svg -resize 384x384 icon-384x384.png
convert icon.svg -resize 512x512 icon-512x512.png
```

### Option 3: Using Node.js Script
```bash
npm install sharp --save-dev
```

Create `scripts/generate-icons.js`:
```javascript
const sharp = require('sharp')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputSvg = './public/icon.svg'

sizes.forEach(size => {
  sharp(inputSvg)
    .resize(size, size)
    .toFile(`./public/icon-${size}x${size}.png`)
    .then(() => console.log(`Generated icon-${size}x${size}.png`))
    .catch(err => console.error(`Error generating ${size}x${size}:`, err))
})
```

Run: `node scripts/generate-icons.js`

## Current Status

- ✅ Base SVG icon created at `/public/icon.svg`
- ✅ Manifest.json configured with icon references
- ⏳ PNG icons need to be generated
- ⏳ Recommended: Use Option 1 (online generator) for production-quality icons

## Testing PWA Icons

After generating icons:
1. Run `npm run build && npm run preview`
2. Open DevTools → Application → Manifest
3. Verify all icon sizes are loaded correctly
4. Test install prompt on mobile device

## Notes

- Icons should be square (1:1 ratio)
- Use PNG format for best compatibility
- Maskable icons support adaptive icons on Android
- Always test on real devices (iOS & Android)

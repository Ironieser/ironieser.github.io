# Favicon Setup Guide

## Overview
Your website is now configured to display a custom logo in browser tabs and bookmarks. You need to provide favicon files in multiple formats and sizes for optimal compatibility across different browsers and devices.

## Required Files

Please prepare the following favicon files and place them in the **root directory** of your website:

### 1. Standard Favicon Files
- `favicon.ico` - Traditional favicon format (16x16 or 32x32 pixels)
- `favicon-16x16.png` - Small PNG favicon (16x16 pixels)
- `favicon-32x32.png` - Standard PNG favicon (32x32 pixels)

### 2. Apple Touch Icon
- `apple-touch-icon.png` - Apple devices icon (180x180 pixels)

## File Specifications

| File | Size | Format | Usage |
|------|------|--------|-------|
| `favicon.ico` | 32x32px | ICO | Legacy browsers, Windows |
| `favicon-16x16.png` | 16x16px | PNG | Small browser tabs |
| `favicon-32x32.png` | 32x32px | PNG | Standard browser tabs |
| `apple-touch-icon.png` | 180x180px | PNG | iOS Safari, home screen |

## Recommended Logo Requirements

For best results, your source logo should be:
- **Square aspect ratio** (1:1)
- **High resolution** (at least 512x512 pixels)
- **Simple design** that works well at small sizes
- **Good contrast** against both light and dark backgrounds
- **Clear at small sizes** (readable at 16x16 pixels)

## Creating Favicon Files

### Option 1: Online Favicon Generators
1. **Favicon.io** (https://favicon.io/)
   - Upload your logo image
   - Download the generated favicon package
   - Extract and use the required files

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - More comprehensive favicon generation
   - Handles all device types and sizes

### Option 2: Manual Creation
If you have image editing software (Photoshop, GIMP, etc.):

1. **favicon-32x32.png**:
   - Resize your logo to 32x32 pixels
   - Save as PNG with transparency

2. **favicon-16x16.png**:
   - Resize your logo to 16x16 pixels
   - Ensure it's still recognizable at this small size
   - Save as PNG with transparency

3. **apple-touch-icon.png**:
   - Resize your logo to 180x180 pixels
   - Save as PNG

4. **favicon.ico**:
   - Use an online ICO converter or image editor
   - Convert your 32x32 PNG to ICO format

## File Placement

Place all favicon files in the **root directory** of your website:

```
your-website/
├── index.html
├── publications.html
├── blog.html
├── favicon.ico                 ← Place here
├── favicon-16x16.png          ← Place here
├── favicon-32x32.png          ← Place here
├── apple-touch-icon.png       ← Place here
├── styles.css
└── ...
```

## Testing

After adding the favicon files:

1. **Clear browser cache** (Ctrl+F5 or Cmd+Shift+R)
2. **Check browser tab** - your logo should appear next to the page title
3. **Test on mobile** - add to home screen on iOS/Android to test apple-touch-icon
4. **Validate** using online favicon checkers

## Current Status

✅ **HTML Updated**: All HTML files now include favicon links
✅ **Build Scripts Updated**: Automated builds will include favicon links
⏳ **Files Needed**: You need to add the actual favicon image files

## Next Steps

1. Choose or create your favicon logo
2. Generate the required favicon files using one of the methods above
3. Place the files in your website's root directory
4. Test the favicon display in your browser

Once you add the favicon files, your website logo will appear in:
- Browser tabs
- Bookmarks/favorites
- Browser history
- iOS/Android home screen shortcuts
- Search engine results (in some cases) 
# Changelog

## [v1.1.0] - 2026-01-13

### 🎉 Major Update - File Structure Reorganization

This is a **significant update** that reorganizes the project structure. If you've already forked this template, please read the migration guide below.

### ✨ New Features

- **Visitor Map Configuration**: Added `visitor_map` section to `config.json` for easy visitor map management
- **Improved File Organization**: CSS and JS files moved to `assets/` directory for better structure

### 🔄 Breaking Changes

#### File Structure Changes

**Before:**
```
├── styles.css
├── script.js
├── blog.css
├── blog-comments.css
├── blog-comments.js
└── blog-data.js
```

**After:**
```
├── assets/
│   ├── css/
│   │   ├── styles.css
│   │   ├── blog.css
│   │   └── blog-comments.css
│   └── js/
│       ├── script.js
│       ├── blog-comments.js
│       └── blog-data.js (auto-generated)
```

#### Scripts Directory

**Before:**
```
├── build_local.py
├── local_server.py
└── ...
```

**After:**
```
├── scripts/
│   ├── build_local.py
│   ├── local_server.py
│   └── ...
```

### 📝 Required Actions for Existing Users

If you've already forked this template, you need to:

1. **Pull the latest changes:**
   ```bash
   git pull origin main  # or master
   ```

2. **Move your CSS/JS files** (if you have custom modifications):
   ```bash
   mkdir -p assets/css assets/js
   mv styles.css assets/css/ 2>/dev/null || true
   mv script.js assets/js/ 2>/dev/null || true
   mv blog.css assets/css/ 2>/dev/null || true
   mv blog-comments.css assets/css/ 2>/dev/null || true
   mv blog-comments.js assets/js/ 2>/dev/null || true
   ```

3. **Update config.json** - Add the new `visitor_map` section:
   ```json
   "visitor_map": {
     "enabled": false,  // Set to false to disable, or get your own ClustrMaps ID
     "provider": "clustrmaps",
     "domain_id": "YOUR_CLUSTRMAPS_ID",
     "color": "ffffff",
     "width": "a"
   }
   ```

4. **Re-run GitHub Actions** or manually build:
   ```bash
   python scripts/build_local.py
   ```

5. **Verify** that your website still works after the update.

### ⚠️ Important Notes

- **GitHub Actions will automatically rebuild** your site after you pull the changes
- The old file paths in existing HTML files will break until rebuilt
- All build scripts have been updated to use the new paths
- The `config.json` structure remains the same (backward compatible)

### 🔧 Configuration Updates

#### New Required Configuration

1. **SEO Section** - Must update with your information:
   - `website_url`
   - `github_pages_url`
   - `author` information

2. **Visitor Map** - New section (can be disabled):
   - Set `enabled: false` if you don't want visitor map
   - Or get your own ClustrMaps ID from [clustrmaps.com](https://clustrmaps.com)

### 📚 Documentation

- Updated README with detailed setup instructions
- Added favicon generation guide
- Added migration instructions for existing users

---

## [v1.0.1] - Previous Version

Initial stable release with config-driven website generation.

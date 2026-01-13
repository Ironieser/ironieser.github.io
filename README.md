# Academic Website Template

A simple, config-driven academic website template that generates HTML from JSON configuration.

> **📢 Important Update (v1.1.0)**: If you've already forked this template, please check the [CHANGELOG.md](CHANGELOG.md) for migration instructions. This update reorganizes file structure and adds new configuration options.

## ⚠️ **IMPORTANT: Required Changes After Forking**

**Before using this template, you MUST update the following in `config.json`:**

### 🔴 **Critical - Must Change:**

1. **SEO Configuration** (`config.json` → `seo` section):
   ```json
   "seo": {
     "website_url": "https://yourusername.github.io",  // ← Change to your URL
     "github_pages_url": "https://yourusername.github.io",  // ← Change to your URL
     "website_name": "Your Name - Academic Homepage",  // ← Change to your name
     "website_description": "Your research description",  // ← Change to your description
     "keywords": ["your", "research", "keywords"],  // ← Update keywords
     "author": {
       "name": "Your Name",  // ← Change to your name
       "email": "your.email@university.edu",  // ← Change to your email
       "google_scholar_id": "YOUR_SCHOLAR_ID",  // ← Change to your Scholar ID
       "github": "yourusername",  // ← Change to your GitHub username
       "twitter": "yourusername"  // ← Change to your Twitter (or remove)
     },
     "organization": {
       "name": "Your University",  // ← Change to your affiliation
       "url": "https://yourusername.github.io"  // ← Change to your URL
     }
   }
   ```

2. **Visitor Map** (`config.json` → `visitor_map` section):
   ```json
   "visitor_map": {
     "enabled": true,  // Set to false if you don't want visitor map
     "provider": "clustrmaps",
     "domain_id": "YOUR_CLUSTRMAPS_ID",  // ← Get your own ID from clustrmaps.com
     "color": "ffffff",
     "width": "a"
   }
   ```
   **Note:** If you don't want a visitor map, set `"enabled": false`. To get your own ClustrMaps ID, visit [clustrmaps.com](https://clustrmaps.com) and sign up.

3. **Personal Information** (`config.json` → `personal` section):
   ```json
   "personal": {
     "name": "Your Name",  // ← Change
     "email": "your.email@university.edu",  // ← Change
     "cv_link": "files/your-cv.pdf",  // ← Change to your CV file
     "profile_image": "images/your-photo.jpg",  // ← Change to your photo
     "links": [
       // ← Update all your social links
     ]
   }
   ```

4. **Favicon Files** (in root directory):
   - Replace `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` with your own logo
   - See [Favicon Generation](#-generating-favicons) section below

### 🟡 **Recommended - Should Change:**

- Publications, news, experience, education sections
- Blog posts in `blog/` directory
- Images in `images/` and `teaser/` directories

---

## 🎯 Features

- **Single config file** controls all content (no HTML editing needed)
- **Automatic generation** via GitHub Actions
- **Clean academic design** with responsive layout
- **Blog system** with Markdown support
- **Publication management** with automatic formatting
- **Easy maintenance** - just edit JSON and push

## 🚀 Quick Start Guide

### Step 1: Fork the Repository

1. Go to [this repository](https://github.com/Ironieser/ironieser.github.io)
2. Click the **"Fork"** button in the top right
3. Choose your GitHub account as the destination

### Step 2: Rename Your Repository

1. In your forked repository, go to **Settings**
2. Scroll down to **"Repository name"**
3. Change it to `yourusername.github.io` (replace with your actual GitHub username)
4. Click **"Rename"**

### Step 3: Enable GitHub Pages

1. Still in **Settings**, scroll down to **"Pages"**
2. Under **"Source"**, select **"Deploy from a branch"**
3. Choose **"master"** branch and **"/ (root)"** folder
4. Click **"Save"**

Your website will be available at `https://yourusername.github.io`

### Step 4: Clone to Your Computer

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

### Step 5: Update Required Configuration

**⚠️ IMPORTANT:** Open `config.json` and update the sections mentioned in the [Required Changes](#-important-required-changes-after-forking) section above.

#### Personal Information

```json
{
  "personal": {
    "name": "Your Name",
    "title": "PhD Student in Computer Science",
    "affiliation": "Your University",
    "email": "your.email@university.edu",
    "profile_image": "images/your-photo.jpg",
    "cv_link": "files/your-cv.pdf",
    "bio": [
      "First paragraph about yourself...",
      "Second paragraph with research focus..."
    ],
    "links": [
      {"name": "Email", "url": "mailto:your.email@university.edu", "icon": "fas fa-envelope"},
      {"name": "Scholar", "url": "https://scholar.google.com/citations?user=YOUR_ID", "icon": "fas fa-graduation-cap"},
      {"name": "GitHub", "url": "https://github.com/yourusername", "icon": "fab fa-github"}
    ]
  }
}
```

#### SEO Configuration (REQUIRED)

```json
{
  "seo": {
    "website_url": "https://yourusername.github.io",
    "github_pages_url": "https://yourusername.github.io",
    "website_name": "Your Name - Academic Homepage",
    "website_description": "Your research description",
    "keywords": ["your", "research", "keywords"],
    "author": {
      "name": "Your Name",
      "email": "your.email@university.edu",
      "google_scholar_id": "YOUR_SCHOLAR_ID",
      "github": "yourusername"
    }
  }
}
```

#### Visitor Map (REQUIRED)

```json
{
  "visitor_map": {
    "enabled": false,  // Set to false to disable, or get your own ClustrMaps ID
    "provider": "clustrmaps",
    "domain_id": "YOUR_CLUSTRMAPS_ID",  // Get from clustrmaps.com
    "color": "ffffff",
    "width": "a"
  }
}
```

**To get your ClustrMaps ID:**
1. Visit [clustrmaps.com](https://clustrmaps.com)
2. Sign up for a free account
3. Create a new map for your website
4. Copy the `domain_id` from the embed code
5. Replace the `domain_id` in `config.json`

**To disable visitor map:**
- Set `"enabled": false` in the `visitor_map` section

### Step 6: Generate Favicons

You need to replace the favicon files with your own logo. Here are two methods:

#### Method 1: Using the Built-in Script (Recommended)

If you have a logo image at `images/pagelogo_round.png`:

```bash
python scripts/generate_favicons.py
```

This will automatically generate all required favicon files:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`

#### Method 2: Using Online Generators

1. **Favicon.io** (https://favicon.io/)
   - Upload your logo image
   - Download the generated favicon package
   - Extract and place files in the root directory

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - More comprehensive favicon generation
   - Handles all device types and sizes

#### Method 3: Manual Creation

If you have image editing software:

1. **favicon-32x32.png**: Resize your logo to 32x32 pixels, save as PNG
2. **favicon-16x16.png**: Resize your logo to 16x16 pixels, save as PNG
3. **apple-touch-icon.png**: Resize your logo to 180x180 pixels, save as PNG
4. **favicon.ico**: Convert your 32x32 PNG to ICO format using an online converter

**Required Files:**
- `favicon.ico` (32x32px, ICO format)
- `favicon-16x16.png` (16x16px, PNG)
- `favicon-32x32.png` (32x32px, PNG)
- `apple-touch-icon.png` (180x180px, PNG)

All files should be placed in the **root directory** of your website.

### Step 7: Add Your Content

#### Publications
Add your papers in the `publications` section:

```json
"publications": {
  "2024": [
    {
      "title": "Your Paper Title",
      "authors": ["Your Name", "Collaborator 1", "Collaborator 2"],
      "venue": "CVPR 2024",
      "venue_type": "conference",
      "image": "teaser/your-paper.jpg",
      "featured": true,
      "links": [
        {"name": "Paper", "url": "https://arxiv.org/abs/...", "icon": "ai ai-arxiv"},
        {"name": "Code", "url": "https://github.com/...", "icon": "fab fa-github"}
      ]
    }
  ]
}
```

#### News Updates
Add recent news:

```json
"news": [
  {
    "date": "Dec 2024",
    "content": "Paper accepted to <strong>CVPR 2024</strong>!",
    "category": "papers"
  }
]
```

#### Experience and Education
Update your background:

```json
"experience": [
  {
    "position": "Research Intern",
    "company": "Company Name",
    "period": "Summer 2024",
    "description": "Brief description...",
    "logo": "images/company-logo.jpg"
  }
],
"education": [
  {
    "degree": "PhD in Computer Science",
    "institution": "Your University",
    "period": "2024 - Present",
    "details": "Focus: Computer Vision and AI"
  }
]
```

### Step 8: Add Your Images

1. **Profile photo**: Add your photo as `images/your-photo.jpg`
2. **Paper teasers**: Add teaser images to `teaser/` directory
3. **Company logos**: Add logos to `images/` directory
4. **CV**: Add your CV to `files/` directory

### Step 9: Push Your Changes

```bash
git add config.json
git add images/  # if you added new images
git add favicon* apple-touch-icon.png  # if you added favicons
git commit -m "Update personal information and configuration"
git push
```

**That's it!** GitHub Actions will automatically:
- Generate HTML files from your config
- Deploy your website
- Your site will be live in 1-2 minutes

## 📝 Adding Blog Posts

1. Create a new `.md` file in the `blog/` directory:

```markdown
---
title: "Your Blog Post Title"
date: "2024-01-01"
description: "Brief description"
tags: ["Research", "AI"]
image: "teaser/preprint.jpg"
---

# Your Blog Post

Write your content here in Markdown...
```

2. Push the file to GitHub - the blog will update automatically

## 🔧 Local Development (Optional)

To preview changes locally before pushing:

```bash
# Build website
python scripts/build_local.py

# Start local server
python scripts/local_server.py

# Visit http://localhost:8000
```

## 📋 Configuration Reference

### Publication Types
- `"conference"`: Blue badge for published papers
- `"under-review"`: Gray badge for papers under review
- `"preprint"`: Orange badge for preprints

### Link Icons
- Paper: `"ai ai-arxiv"`
- Code: `"fab fa-github"`
- Dataset: `"fas fa-database"`
- Video: `"fab fa-youtube"`
- Website: `"fas fa-globe"`

### News Categories
- `"papers"`: For publication news
- `"career"`: For job/position updates
- `"projects"`: For project announcements

## ❓ Troubleshooting

### Website showing README instead of homepage
- Make sure you pushed changes to `config.json`
- Check GitHub Actions tab for build errors
- Wait 1-2 minutes for deployment

### Images not showing
- Ensure image files are committed and pushed
- Check file paths in `config.json`
- Use relative paths from website root

### Build errors
- Validate JSON syntax in `config.json`
- Check GitHub Actions logs for specific errors
- Ensure all required fields are present

### Visitor map not showing
- Check that `visitor_map.enabled` is set to `true`
- Verify your ClustrMaps `domain_id` is correct
- Make sure you've signed up at clustrmaps.com and created a map

## 🎨 Customization

- **Colors**: Edit CSS variables in `assets/css/styles.css`
- **Fonts**: Change Google Fonts link and CSS
- **Layout**: Modify the build scripts in `.github/scripts/`

## 📞 Getting Help

- Check the [Issues page](https://github.com/Ironieser/ironieser.github.io/issues)
- Look at the example `config.json` for reference
- Review GitHub Actions logs if builds fail

## 📄 License

MIT License - free to use and modify!

---

**Created by [Sixun Dong](https://github.com/Ironieser)** - PhD student at Arizona State University

*This template is designed to be simple and practical. Start with the basics and customize as needed.*

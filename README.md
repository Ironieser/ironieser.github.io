# Academic Website Template

A simple, config-driven academic website template that generates HTML from JSON configuration.

> **📢 Important Update (v1.1.0)**: If you've already forked this template, please check the [CHANGELOG.md](CHANGELOG.md) for migration instructions. This update reorganizes file structure and adds new configuration options.

## 🎯 Features

- **Single config file** controls all content (no HTML editing needed)
- **Automatic generation** via GitHub Actions
- **Clean academic design** with responsive layout
- **Blog system** with Markdown support
- **Publication management** with automatic formatting
- **Easy maintenance** - just edit JSON and push

## 🚀 Quick Start

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

You need to clone the repository to your local computer so you can edit the `config.json` file and add your content. If you prefer, you can also edit files directly on GitHub, but using a local editor is more convenient.

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

### Step 5: Update Required Configuration

**⚠️ IMPORTANT:** Open `config.json` and update the following sections:

#### 5.1 SEO Configuration (REQUIRED)

Update the `seo` section with your information:

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

#### 5.2 Visitor Map (REQUIRED)

Update the `visitor_map` section:

```json
"visitor_map": {
  "enabled": true,  // Set to false if you don't want visitor map
  "provider": "clustrmaps",
  "domain_id": "YOUR_CLUSTRMAPS_ID",  // ← Get your own ID from clustrmaps.com
  "color": "ffffff",
  "width": "a"
}
```

**Note:** 
- If you don't want a visitor map, set `"enabled": false`
- To get your own ClustrMaps ID: visit [clustrmaps.com](https://clustrmaps.com), sign up, create a map, and copy the `domain_id` from the embed code

#### 5.3 Personal Information (REQUIRED)

Update the `personal` section:

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

### Step 6: Generate Favicons

You need to replace the favicon files with your own logo. Here are the methods:

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

### Step 9: Deploy

```bash
git add config.json
git add images/  # if you added new images
git add favicon* apple-touch-icon.png  # if you added favicons
git commit -m "Update personal information and configuration"
git push
```

**That's it!** GitHub Actions will automatically build and deploy your site in 1-2 minutes.

## 📝 Adding Blog Posts

Create `.md` files in `blog/` directory:

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

Push the file to GitHub - the blog will update automatically.

## 🔧 Local Development (Optional)

To preview changes locally before pushing:

```bash
# Build website locally
python scripts/build_local.py

# Start local server
python scripts/local_server.py

# Visit http://localhost:8000
```

## 📋 Configuration Reference

### News Categories
- `"papers"`: For publication news
- `"career"`: For job/position updates
- `"projects"`: For project announcements

### Publication Types
- `"conference"`: Blue badge (published papers)
- `"under-review"`: Gray badge (under review)
- `"preprint"`: Orange badge (preprints)

### Link Icons

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css">

**For Publications:**

| 图标预览 | 用途 | 图标代码 | 颜色代码 |
|---------|------|---------|---------|
| <i class="ai ai-arxiv" style="font-size: 20px; color: #b91c1c;"></i> | Paper (arXiv) | `"ai ai-arxiv"` | `#b91c1c` |
| <i class="fab fa-github" style="font-size: 20px; color: #333;"></i> | Code | `"fab fa-github"` | `#333` |
| <i class="fas fa-database" style="font-size: 20px; color: #28a745;"></i> | Dataset | `"fas fa-database"` | `#28a745` |
| <i class="fab fa-youtube" style="font-size: 20px; color: #ff0000;"></i> | Video (YouTube) | `"fab fa-youtube"` | `#ff0000` |
| <i class="fas fa-tv" style="font-size: 20px; color: #fb7299;"></i> | Video (Bilibili) | `"fas fa-tv"` | `#fb7299` |
| <i class="fas fa-home" style="font-size: 20px; color: #2563eb;"></i> | Homepage | `"fas fa-home"` | `#2563eb` |
| <i class="fas fa-blog" style="font-size: 20px; color: #2563eb;"></i> | Blog | `"fas fa-blog"` | `#2563eb` |
| <i class="fas fa-book-open" style="font-size: 20px; color: #007bff;"></i> | 知乎 (Documentation) | `"fas fa-book-open"` | `#007bff` |

**For Social Links:**

| 图标预览 | 用途 | 图标代码 | 颜色代码 |
|---------|------|---------|---------|
| <i class="fas fa-envelope" style="font-size: 20px; color: #dc3545;"></i> | Email | `"fas fa-envelope"` | `#dc3545` |
| <i class="fas fa-graduation-cap" style="font-size: 20px; color: #4285f4;"></i> | Google Scholar | `"fas fa-graduation-cap"` | `#4285f4` |
| <i class="fab fa-github" style="font-size: 20px; color: #333;"></i> | GitHub | `"fab fa-github"` | `#333` |
| <i class="fab fa-twitter" style="font-size: 20px; color: #1da1f2;"></i> | Twitter | `"fab fa-twitter"` | `#1da1f2` |
| <i class="fab fa-linkedin" style="font-size: 20px; color: #1666C5;"></i> | LinkedIn | `"fab fa-linkedin"` | `#1666C5` |
| <i class="fas fa-book" style="font-size: 20px; color: #0084ff;"></i> | 知乎 | `"fas fa-book"` | `#0084ff` |

**Example:**

```json
"links": [
  {
    "name": "Paper",
    "url": "https://arxiv.org/abs/2204.01018",
    "icon": "ai ai-arxiv"
  },
  {
    "name": "Scholar",
    "url": "https://scholar.google.com/citations?user=YOUR_ID",
    "icon": "fas fa-graduation-cap",
    "color": "#4285f4"
  },
]
```


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
- **Fonts**: Change Google Fonts link in build scripts
- **Layout**: Modify scripts in `.github/scripts/`

## 📞 Getting Help

- Check [Issues](https://github.com/Ironieser/ironieser.github.io/issues)
- Review example `config.json` for reference
- Check GitHub Actions logs for build errors

## 📄 License

MIT License - free to use and modify!

---

**Created by [Sixun Dong](https://cv.ironieser.cc)** - Independent Researcher

*This template is designed to be simple and practical. Start with the basics and customize as needed.*

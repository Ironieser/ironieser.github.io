---
title: "My Config-Driven Academic Website Template"
date: "2025-06-27"
description: "How I built a simple system to manage my academic website using JSON configuration and GitHub Actions."
tags: ["Academic Website", "GitHub Actions", "Template", "Web Development"]
image: "favicon-32x32.png"
---

# My Config-Driven Academic Website Template

I got tired of manually editing HTML files every time I wanted to update my academic website, so I built a simple system that lets me manage everything through a JSON configuration file.

## The Problem I Had

Like many academics, I struggled with:
- Editing HTML files for every publication update
- Keeping formatting consistent across pages
- Worrying about breaking the layout
- Spending time on code instead of content

## My Solution

I created a system where all my content lives in a single `config.json` file, and GitHub Actions automatically generates the HTML pages.

### Before and After

**Before**: Editing HTML directly
```html
<div class="publication-item">
  <img src="teaser/my-paper.jpg" alt="My Paper">
  <div class="publication-content">
    <p class="publication-title">My Research Paper</p>
    <!-- lots more HTML... -->
  </div>
</div>
```

**After**: Simple JSON structure
```json
{
  "title": "My Research Paper",
  "authors": ["Sixun Dong", "Collaborators"],
  "venue": "CVPR 2025",
  "image": "teaser/my-paper.jpg",
  "links": [{"name": "Paper", "url": "https://..."}]
}
```

## How It Works

1. **Edit config.json** with your content
2. **Push to GitHub** 
3. **GitHub Actions** runs and generates HTML
4. **Website updates** automatically

The build process uses Node.js scripts that read the JSON and generate HTML using templates.

## Key Features

### Single Configuration File
Everything lives in `config.json`:
- Personal info and bio
- Publications by year
- News updates
- Experience and education

### Automatic HTML Generation
GitHub Actions detects changes to the config and rebuilds the site automatically.

### Blog System
Blog posts are written in Markdown with frontmatter:
```markdown
---
title: "Post Title"
date: "2025-01-01"
description: "Brief description"
tags: ["Tag1", "Tag2"]
---

# Your content here...
```

### Publication Management
Publications are organized by year with support for:
- Different venue types (conference, journal, under review)
- Featured publications that appear on homepage
- Multiple links (paper, code, dataset, etc.)
- Automatic author name highlighting

## Technical Implementation

The system consists of:
- **Build scripts** (Node.js) that process the JSON config
- **HTML templates** for different page types
- **GitHub Actions workflow** for automation
- **Simple CSS/JS** for styling and interactions

### Local Development
You can build and preview locally:
```bash
python build_local.py  # Generate HTML
python local_server.py # Start local server
```

## What I Learned

Building this taught me:
- GitHub Actions is quite powerful for automation
- JSON is a good format for structured academic content
- Simple solutions often work better than complex ones
- Documentation matters (I should write more)

## Current Status

The template works well for my needs, and it has grown over time. Currently it supports:
- ✅ Basic publication management
- ✅ Blog system with Markdown
- ✅ Automated deployment
- ✅ Comment system (Waline)
- ✅ Favicon support
- ✅ Better mobile experience
- ✅ More customization options

## Using This Template

If you want to use this for your own site:

1. **Fork** the repository
2. **Edit** `config.json` with your information
3. **Enable** GitHub Pages in repository settings
4. **Push** changes to trigger the build

The source code is available on GitHub. It's not the most polished system, but it works for my needs and might be useful for others.

## Detailed Usage Guide

This section provides a practical guide for using the template, covering all features and customization options.

### Getting Started

#### 1. Fork the Repository
Fork [this repository](https://github.com/Ironieser/ironieser.github.io) to your GitHub account.

#### 2. Rename Your Repository
1. In your forked repository, go to **Settings**
2. Scroll down to **"Repository name"**
3. Change it to `yourusername.github.io` (replace with your actual GitHub username)
4. Click **"Rename"**

#### 3. Enable GitHub Pages
1. Still in **Settings**, scroll down to **"Pages"**
2. Under **"Source"**, select **"Deploy from a branch"**
3. Choose **"master"** branch and **"/ (root)"** folder
4. Click **"Save"**

Your website will be available at `https://yourusername.github.io`

#### 4. Clone to Your Computer
You need to clone the repository to your local computer so you can edit the `config.json` file and add your content. If you prefer, you can also edit files directly on GitHub, but using a local editor is more convenient.

```bash
git clone https://github.com/yourusername/yourusername.github.io.git
cd yourusername.github.io
```

#### 5. Edit the Configuration
The main configuration is in `config.json`. This file controls everything on your website.

### Configuration Structure

The config file has several main sections:

```json
{
  "seo": { /* SEO and metadata */ },
  "visitor_map": { /* Visitor tracking map */ },
  "personal": { /* Your basic info */ },
  "research": { /* Research description and stats */ },
  "news": [ /* Recent news items */ ],
  "publications": { /* Papers by year */ },
  "experience": [ /* Work experience */ ],
  "education": [ /* Academic background */ ],
  "service": { /* Academic service */ }
}
```

### Required Configuration Updates

**⚠️ IMPORTANT:** Before deploying, you must update these sections:

#### SEO Configuration (REQUIRED)

Update the `seo` section with your information:

```json
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
    "github": "yourusername",
    "twitter": "yourusername"
  },
  "organization": {
    "name": "Your University",
    "url": "https://yourusername.github.io"
  }
}
```

#### Visitor Map Configuration (REQUIRED)

Update the `visitor_map` section:

```json
"visitor_map": {
  "enabled": true,
  "provider": "clustrmaps",
  "domain_id": "YOUR_CLUSTRMAPS_ID",
  "color": "ffffff",
  "width": "a"
}
```

**Note:** 
- If you don't want a visitor map, set `"enabled": false`
- To get your own ClustrMaps ID: visit [clustrmaps.com](https://clustrmaps.com), sign up, create a map, and copy the `domain_id` from the embed code

### Personal Information

Update the `personal` section with your details:

```json
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
    {
      "name": "Email",
      "url": "mailto:your.email@university.edu",
      "icon": "fas fa-envelope"
    }
  ]
}
```

#### Adding Social Links
The template supports various social platforms:

```json
"links": [
  {"name": "Email", "url": "mailto:...", "icon": "fas fa-envelope"},
  {"name": "Scholar", "url": "https://scholar.google.com/...", "icon": "fas fa-graduation-cap"},
  {"name": "GitHub", "url": "https://github.com/...", "icon": "fab fa-github"},
  {"name": "Twitter", "url": "https://twitter.com/...", "icon": "fab fa-twitter"},
  {"name": "LinkedIn", "url": "https://linkedin.com/in/...", "icon": "fab fa-linkedin"}
]
```

### Publications Management

Publications are organized by year in the `publications` section:

```json
"publications": {
  "2025": [
    {
      "title": "Your Paper Title",
      "authors": ["Your Name", "Collaborator 1", "Collaborator 2"],
      "venue": "CVPR 2025",
      "venue_type": "conference",
      "image": "teaser/your-paper.jpg",
      "featured": true,
      "is_oral": false,
      "links": [
        {"name": "Paper", "url": "https://arxiv.org/...", "icon": "ai ai-arxiv"},
        {"name": "Code", "url": "https://github.com/...", "icon": "fab fa-github"}
      ]
    }
  ]
}
```

#### Publication Fields

- `title`: Paper title
- `authors`: List of authors (your name will be highlighted automatically)
- `venue`: Conference/journal name
- `venue_type`: `"conference"`, `"under-review"`, `"preprint"`, or `"working"`
- `image`: Path to teaser image
- `featured`: `true` to show on homepage (optional)
- `is_oral`: `true` for oral presentations (optional)
- `links`: Array of links (paper, code, dataset, etc.)

#### Venue Types

Different venue types get different styling:
- `"conference"`: Blue badge for published papers
- `"under-review"`: Gray badge for papers under review
- `"preprint"`: Orange badge for preprints
- `"working"`: Light blue badge for work in progress

#### Link Icons

**For Publications:**

| Usage | Icon Code | Color Code |
|-------|----------|------------|
| Paper (arXiv) | `"ai ai-arxiv"` | `#b91c1c` |
| Code | `"fab fa-github"` | `#333` |
| Dataset | `"fas fa-database"` | `#28a745` |
| Video (YouTube) | `"fab fa-youtube"` | `#ff0000` |
| Video (Bilibili) | `"fas fa-tv"` | `#fb7299` |
| Homepage | `"fas fa-home"` | `#2563eb` |
| Blog | `"fas fa-blog"` | `#2563eb` |
| Zhihu (Documentation) | `"fas fa-book-open"` | `#007bff` |

**For Social Links:**

| Usage | Icon Code | Color Code |
|-------|----------|------------|
| Email | `"fas fa-envelope"` | `#dc3545` |
| Google Scholar | `"fas fa-graduation-cap"` | `#4285f4` |
| GitHub | `"fab fa-github"` | `#333` |
| Twitter | `"fab fa-twitter"` | `#1da1f2` |
| LinkedIn | `"fab fa-linkedin"` | `#1666C5` |
| Zhihu | `"fas fa-book"` | `#0084ff` |

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
  }
]
```

### News Updates

Add recent news to the `news` array:

```json
"news": [
  {
    "date": "Dec 2024",
    "content": "Paper accepted to <strong>CVPR 2025</strong>!",
    "category": "papers"
  },
  {
    "date": "Aug 2024",
    "content": "Started PhD at Your University",
    "category": "career"
  }
]
```

Categories include: `"papers"`, `"career"`, `"projects"`, or custom categories.

### Experience and Education

#### Experience Section
```json
"experience": [
  {
    "position": "Research Intern",
    "company": "Company Name",
    "period": "Summer 2024",
    "description": "Brief description of your work...",
    "logo": "images/company-logo.jpg"
  }
]
```

#### Education Section
```json
"education": [
  {
    "degree": "PhD in Computer Science",
    "institution": "Your University",
    "period": "2024 - Present",
    "details": "Focus: Computer Vision and AI"
  }
]
```

### Research Description

Update the research section with your focus areas:

```json
"research": {
  "description": "Your research description...",
  "stats": [
    "X+ publications",
    "Y top-tier venues",
    "Z oral presentations"
  ]
}
```

### Images and Files

#### Profile Image
- Add your photo to `images/` directory
- Update `profile_image` path in config
- Recommended: Square image, at least 400x400px

#### Publication Teasers
- Store teaser images in `teaser/` directory
- Use descriptive names: `teaser/your-paper-name.jpg`
- Recommended: 16:9 aspect ratio, around 800x450px

#### CV and Documents
- Store PDFs in `files/` directory
- Update `cv_link` path in config

### Generate Favicons

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

### Blog Posts

Create blog posts in the `blog/` directory:

1. Create a new `.md` file
2. Add frontmatter metadata
3. Write content in Markdown

Example:
```markdown
---
title: "My Research Experience"
date: "2025-01-01"
description: "Reflections on my PhD journey"
tags: ["Research", "PhD"]
image: "teaser/preprint.jpg"
---

# My Research Experience

Your blog content here...
```

### Customization

#### Colors and Styling
- Main styles are in `styles.css`
- Blog styles in `blog.css`
- Modify CSS variables for color themes

#### Adding New Sections
- Edit the build scripts in `.github/scripts/`
- Add new sections to `config.json`
- Update HTML templates as needed

### Local Development

#### Build Locally
```bash
python scripts/build_local.py
```

#### Preview Locally
```bash
python scripts/local_server.py
```
Then visit `http://localhost:8000`

### Deployment

The site deploys automatically when you push changes to GitHub. The process:

1. GitHub Actions detects changes to `config.json` or blog files
2. Runs build scripts to generate HTML
3. Commits generated files back to repository
4. GitHub Pages serves the updated site

**To deploy your changes:**

```bash
git add config.json
git add images/  # if you added new images
git add favicon* apple-touch-icon.png  # if you added favicons
git commit -m "Update personal information and configuration"
git push
```

**That's it!** GitHub Actions will automatically build and deploy your site in 1-2 minutes.

### Tips and Best Practices

#### Publication Management
- Keep publication images consistent in size and style
- Use descriptive filenames for easy organization
- Update featured publications to highlight your best work

#### Content Updates
- Update news regularly to keep the site fresh
- Write blog posts about your research journey
- Keep your CV and contact information current

#### Performance
- Optimize images before uploading
- Keep the config file organized and well-formatted
- Use meaningful commit messages for changes

### Troubleshooting

#### Common Issues

**Site not updating after changes:**
- Check GitHub Actions tab for build errors
- Ensure `config.json` has valid JSON syntax
- Wait a few minutes for deployment

**Images not showing:**
- Check file paths in config
- Ensure images are committed to repository
- Use relative paths from website root

**Build errors:**
- Check GitHub Actions logs
- Validate JSON syntax
- Ensure all required fields are present

**Visitor map not showing:**
- Check that `visitor_map.enabled` is set to `true`
- Verify your ClustrMaps `domain_id` is correct
- Make sure you've signed up at clustrmaps.com and created a map

### Getting Help

If you run into issues:
- 💬 **Have questions?** Open an [Issue](https://github.com/Ironieser/ironieser.github.io/issues) - we're happy to help!
- Check the repository's Issues tab
- Look at the build logs in GitHub Actions
- Make sure your config follows the examples
- Review example `config.json` for reference

This template is designed to be simple and practical. Start with the basics and gradually add more features as you need them.

> **Note:** This guide is continuously updated with new features and best practices. If you find something missing or have suggestions, feel free to open an issue!

## Limitations

This approach has some downsides:
- Requires basic Git/GitHub knowledge
- Limited customization without editing code
- Build process can be slow for large sites
- No real-time preview (need to push to see changes)

## Future Ideas

Things I might add:
- Better theme customization
- More publication types
- Integration with citation managers
- Mobile app for quick updates
- Better documentation

## Conclusion

This system solved my specific problem of maintaining an academic website without dealing with HTML. It's not perfect, but it's much easier than manually editing files.

If you're interested in trying it out or have suggestions for improvements, feel free to check out the code or reach out.

---

*This is just my personal solution to a common problem. Your mileage may vary.* 
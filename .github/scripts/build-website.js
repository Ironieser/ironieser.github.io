/**
 * Config-Driven Academic Website Template
 * Build Script for GitHub Actions
 * 
 * @author Sixun Dong (ironieser)
 * @version 1.0.0
 * @license MIT
 * @repository https://github.com/Ironieser/ironieser.github.io
 * @description Generates HTML files from content.json + meta.json for academic websites
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration and output files
const CONFIG_DIR = path.join(__dirname, '../../config');
const CONTENT_CONFIG_FILE = path.join(CONFIG_DIR, 'content.json');
const META_CONFIG_FILE = path.join(CONFIG_DIR, 'meta.json');
const SITE_CONFIG_FILE = path.join(CONFIG_DIR, 'site.yaml');
const LEGACY_CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const INDEX_OUTPUT = path.join(__dirname, '../../index.html');
const PUBLICATIONS_OUTPUT = path.join(__dirname, '../../publications.html');
const REDIRECTS_OUTPUT = path.join(__dirname, '../../_redirects');

/**
 * Generate Cloudflare Pages style _redirects file from config.json
 * 
 * In site.yaml or config.json, add for example:
 * "redirects": [
 *   { "alias": "mmtok", "target": "/projects/mmtok.html" },
 *   { "alias": "timesclip", "target": "/projects/timesclip.html" }
 * ]
 */
function generateRedirects(config) {
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];

  if (redirects.length === 0) {
    console.log('ℹ️ No redirects defined (redirects in site.yaml or config.json), skipping _redirects generation.');
    return false;
  }

  console.log('🚀 Generating _redirects file...');

  const lines = [
    '# Automatic Project Redirects',
    '# Generated during build process'
  ];

  redirects.forEach(entry => {
    const alias = entry.alias;
    const target = entry.target;

    if (!alias || !target) {
      return;
    }

    // /alias  → target
    lines.push(`/${alias}  ${target}  301`);
    // /alias/* → target (so /alias/anything also lands on the main page)
    lines.push(`/${alias}/* ${target}  301`);
  });

  fs.writeFileSync(REDIRECTS_OUTPUT, lines.join('\n'));
  console.log(`✅ Generated ${redirects.length} redirect rules in _redirects.`);
  return true;
}

function expandVisitorMap(siteVisitorMap) {
  if (!siteVisitorMap || !siteVisitorMap.domain_id) return siteVisitorMap;
  return {
    enabled: siteVisitorMap.enabled !== false,
    provider: siteVisitorMap.provider || 'clustrmaps',
    domain_id: siteVisitorMap.domain_id,
    color: siteVisitorMap.color || 'ffffff',
    width: siteVisitorMap.width || 'a'
  };
}

function loadConfig() {
  console.log('Loading configuration...');

  const hasContent = fs.existsSync(CONTENT_CONFIG_FILE);
  const hasMeta = fs.existsSync(META_CONFIG_FILE);
  const hasSite = fs.existsSync(SITE_CONFIG_FILE);

  try {
    if (hasContent) {
      const contentRaw = fs.readFileSync(CONTENT_CONFIG_FILE, 'utf-8');
      const contentConfig = JSON.parse(contentRaw);

      let metaConfig = {};
      if (hasMeta) {
        const metaRaw = fs.readFileSync(META_CONFIG_FILE, 'utf-8');
        metaConfig = JSON.parse(metaRaw);
      }

      let siteConfig = {};
      if (hasSite) {
        const siteRaw = fs.readFileSync(SITE_CONFIG_FILE, 'utf-8');
        siteConfig = yaml.load(siteRaw) || {};
        if (siteConfig.visitor_map) {
          siteConfig.visitor_map = expandVisitorMap(siteConfig.visitor_map);
        }
      }

      const merged = { ...metaConfig, ...contentConfig, ...siteConfig };
      const parts = ['config/content.json'];
      if (hasMeta) parts.push('config/meta.json');
      if (hasSite) parts.push('config/site.yaml');
      console.log('✓ Loaded config from ' + parts.join(' + '));
      return merged;
    }

    if (fs.existsSync(LEGACY_CONFIG_FILE)) {
      console.log('ℹ️ config/content.json not found, falling back to config/config.json');
      const legacyRaw = fs.readFileSync(LEGACY_CONFIG_FILE, 'utf-8');
      return JSON.parse(legacyRaw);
    }
  } catch (error) {
    throw new Error(`Error parsing configuration files: ${error.message}`);
  }

  throw new Error('No configuration file found (expected config/content.json or config/config.json).');
}

function highlightAuthorName(authors, targetName) {
  return authors.map(author => {
    if (author.includes(targetName)) {
      return `<span class="author-highlight">${author}</span>`;
    }
    return author;
  }).join(', ');
}

function formatPublicationVenue(venueType, venue, isOral = false) {
  let badge;
  if (venueType === 'under-review') {
    badge = `<span class="publication-venue-under-review">${venue}</span>`;
  } else if (venueType === 'preprint') {
    badge = `<span class="publication-venue-preprint">${venue}</span>`;
  } else if (venueType === 'working') {
    badge = `<span class="publication-venue-working">${venue}</span>`;
  } else {
    badge = `<span class="publication-venue">${venue}</span>`;
  }
  
  if (isOral) {
    badge += '<span class="publication-venue-oral">🏆 Oral</span>';
  }
  
  return badge;
}

function formatPublicationLinks(links) {
  if (!links || links.length === 0) return '';
  
  const linkItems = links.map(link => {
    if (link.coming_soon) {
      return `<i class="${link.icon}"></i> <span class="coming-soon">${link.name}</span>`;
    } else {
      return `<i class="${link.icon}"></i> <a href="${link.url}" target="_blank">${link.name}</a>`;
    }
  });
  
  return linkItems.join(' / ');
}

function generateNavigation(personal, activePage) {
  const navLinks = {
    'Bio': 'index.html',
    'Publications': 'publications.html', 
    'Blog': 'blog.html',
    'CV(PDF)': personal.cv_link
  };
  
  const navItems = Object.entries(navLinks).map(([name, url]) => {
    const isActive = activePage === name ? 'active' : '';
    const target = name === 'CV(PDF)' ? 'target="_blank"' : '';
    return `<a href="${url}" class="nav-link ${isActive}" ${target}>${name}</a>`;
  });
  
  const themeToggle = `<button id="theme-toggle" class="theme-toggle" title="Toggle theme" aria-label="Toggle theme"><span class="theme-icon">🌓</span></button>`;
  
  return navItems.join('\n                ') + '\n                ' + themeToggle;
}

function generateJsonLd(config) {
  const { personal, seo, publications } = config;
  
  if (!seo || !seo.enable_json_ld) {
    return '';
  }

  const legacyUrls = Array.isArray(seo.legacy_urls) ? seo.legacy_urls : [];
  
  // Person schema
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": seo.author.name,
    "alternateName": seo.author.alternate_name,
    "email": seo.author.email,
    "jobTitle": seo.author.job_title,
    "affiliation": {
      "@type": "Organization",
      "name": seo.organization.name,
      "url": seo.organization.url,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": seo.organization.address.addressCountry,
        "addressLocality": seo.organization.address.addressLocality,
        "addressRegion": seo.organization.address.addressRegion
      }
    },
    "url": seo.website_url,
    "sameAs": [
      `https://scholar.google.com/citations?user=${seo.author.google_scholar_id}`,
      `https://github.com/${seo.author.github}`,
      `https://twitter.com/${seo.author.twitter}`,
      seo.website_url,
      seo.github_pages_url,
      ...legacyUrls
    ].filter(Boolean),
    "knowsAbout": seo.author.research_areas,
    "image": `${seo.website_url}/${personal.profile_image}`
  };
  
  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": seo.website_name,
    "description": seo.website_description,
    "url": seo.website_url,
    "author": {
      "@type": "Person",
      "name": seo.author.name
    },
    "publisher": {
      "@type": "Organization",
      "name": seo.organization.name,
      "url": seo.organization.url
    }
  };
  
  // Collect all publications for Article schema
  const allPublications = [];
  Object.keys(publications).forEach(year => {
    if (year !== 'survey') {
      publications[year].forEach(pub => {
        if (pub.venue_type !== 'preprint' && pub.venue_type !== 'under-review') {
          allPublications.push({
            "@type": "ScholarlyArticle",
            "name": pub.title,
            "author": pub.authors.map(author => ({
              "@type": "Person",
              "name": author
            })),
            "datePublished": `${year}-01-01`,
            "publisher": {
              "@type": "Organization",
              "name": pub.venue
            },
            "url": pub.links?.find(link => link.name === "Paper")?.url || null
          });
        }
      });
    }
  });
  
  // Combine all schemas
  const schemas = [personSchema, websiteSchema, ...allPublications.slice(0, 10)]; // Limit to 10 most recent publications
  
  return `<script type="application/ld+json">
${JSON.stringify(schemas, null, 2)}
</script>`;
}

function generateFooter(personal, templateInfo = null, visitorMap = null, copyrightStartYear = null) {
  const startYear = copyrightStartYear != null ? Number(copyrightStartYear) : 2025;
  const currentYear = new Date().getFullYear();
  const copyrightYears = currentYear === startYear ? `${startYear}` : `${startYear} - ${currentYear}`;
  
  // Template credit: full block if enabled; otherwise a single "Template by" line (so attribution stays when others use the template)
  const templateCredit = templateInfo && templateInfo.show_template_credit ? `
            <div class="template-credit">
                <p>Built with <a href="${templateInfo.repository}" target="_blank" rel="noopener">${templateInfo.name}</a> by <a href="${templateInfo.repository}" target="_blank" rel="noopener">${templateInfo.author}</a></p>
                ${templateInfo.acknowledgments ? `<p class="template-acknowledgments">${templateInfo.acknowledgments}</p>` : ''}
            </div>` : '';
  const templateAttribution = templateInfo && templateInfo.author && templateInfo.repository && !templateInfo.show_template_credit
    ? `<p class="template-attribution">Template by <a href="${templateInfo.repository}" target="_blank" rel="noopener">${templateInfo.author}</a></p>`
    : '';
  
  // Generate visitor map section if enabled
  let visitorMapHtml = '';
  if (visitorMap && visitorMap.enabled) {
    const domainId = visitorMap.domain_id || '';
    const color = visitorMap.color || 'ffffff';
    const width = visitorMap.width || 'a';
    visitorMapHtml = `
            <!-- Visitor Map Section -->
            <div class="visitor-map-section">
                <div class="visitor-map-container">
                    <!-- Visitor Map Widget -->
                    <div class="visitor-map">
                        <!-- ClustrMaps Widget -->
                        <script type="text/javascript" id="clustrmaps" src="//clustrmaps.com/map_v2.js?d=${domainId}&cl=${color}&w=${width}"></script>
                    </div>
                </div>
            </div>`;
  }
  
  return `
    <footer class="footer">
        <div class="container">
            ${visitorMapHtml}
            <div class="footer-stats">
                <div class="stats-item">
                    <i class="fas fa-map-marker-alt"></i>
                    Last updated from: <span id="owner-location">Loading...</span>
                </div>
                <div class="stats-item">
                    <i class="fas fa-clock"></i>
                    Content last updated: <span id="last-updated"></span>
                </div>
            </div>
            ${templateCredit}
            ${templateAttribution}
            <p>&copy; ${copyrightYears} ${personal.name}. All rights reserved.</p>
        </div>
    </footer>`;
}

function generateCommonScripts() {
  // Get current build time (when GitHub Actions runs)
  // Use local date to avoid timezone issues
  const now = new Date();
  const buildTime = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
  
  return `
    <script>
        // Get website owner's location during build (not visitor's location)
        async function getOwnerLocation() {
            try {
                // Try primary API first
                let response = await fetch('https://ipapi.co/json/');
                let data = await response.json();
                
                if (data.city && data.country_name) {
                    const location = \`\${data.city}, \${data.country_name}\`;
                    document.getElementById('owner-location').textContent = location;
                    return;
                }
                
                // If primary API fails, try backup API
                response = await fetch('https://api.ipify.org?format=json');
                const ipData = await response.json();
                
                if (ipData.ip) {
                    // Use a different geolocation service
                    response = await fetch(\`https://ip-api.com/json/\${ipData.ip}\`);
                    data = await response.json();
                    
                    if (data.city && data.country) {
                        const location = \`\${data.city}, \${data.country}\`
                        document.getElementById('owner-location').textContent = location;
                        return;
                    }
                }
                
                // If all APIs fail, show a default message
                document.getElementById('owner-location').textContent = 'Remote Server';
                
            } catch (error) {
                console.log('Location detection failed:', error);
                // For GitHub Actions builds, show a more appropriate message
                document.getElementById('owner-location').textContent = 'GitHub Actions';
            }
        }
        
        // Set last updated time (when GitHub Actions built the site)
        function setLastUpdated() {
            const buildDate = '${buildTime}';
            const date = new Date(buildDate + 'T12:00:00'); // Add noon time to avoid timezone issues
            const formatted = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            document.getElementById('last-updated').textContent = formatted;
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            getOwnerLocation();
            setLastUpdated();
        });
    </script>`;
}

function generateIndexPage(config) {
  console.log('Generating index.html...');
  
  const { personal, research, news, experience, education, service, publications, _template_info, visitor_map } = config;
  
  // Get selected publications (featured first, then recent)
  const selectedPubs = [];
  const sortedYears = Object.keys(publications).filter(year => year !== 'survey').sort().reverse();
  
  // Collect all publications
  const allPubs = [];
  for (const year of sortedYears) {
    allPubs.push(...publications[year]);
  }
  
  // Get max featured publications from config (default to 5 if not specified)
  const maxFeatured = research.max_featured_publications || 5;
  
  // First, add featured publications
  const featuredPubs = allPubs.filter(pub => pub.featured === true);
  selectedPubs.push(...featuredPubs.slice(0, maxFeatured));
  
  // Generate bio HTML
  const bioHtml = personal.bio.map(para => `<p>${para}</p>`).join('\n                            ');
  
  // Generate social links
  const linksHtml = personal.links.map(link => `
            <a href="${link.url}" class="hero-link" title="${link.name}">
                <i class="${link.icon}"></i> ${link.name}
            </a>`).join('');
  
  // Generate news items (date + optional emoji + content)
  // [[venue name]] → <span class="venue-highlight">venue name</span>
  // {{link}} / {{link1}} / {{link2}} → <a href="..."><arxiv or external icon></a>
  const expandVenueHighlight = (s) => (s || '').replace(/\[\[([^\]]+)\]\]/g, '<span class="venue-highlight">$1</span>');
  const makeLinkHtml = (link) => {
    if (!link) return '';
    const isArxiv = link.indexOf('arxiv.org') !== -1;
    const iconClass = isArxiv ? 'ai ai-arxiv' : 'fas fa-external-link-alt';
    const title = isArxiv ? 'arXiv' : 'Link';
    return `<a href="${link}" target="_blank" rel="noopener" class="news-paper-link" title="${title}"><i class="${iconClass}"></i></a>`;
  };
  const expandNewsLink = (content, item) => {
    if (!content) return content;
    let out = content;
    out = out.replace(/\{\{link\}\}/g, () => makeLinkHtml(item.link) || '{{link}}');
    out = out.replace(/\{\{link(\d+)\}\}/g, (_, n) => makeLinkHtml(item['link' + n]) || '{{link' + n + '}}');
    return out;
  };
  const newsHtml = news.map(item => {
    let content = expandVenueHighlight(item.content);
    content = expandNewsLink(content, item);
    return `
            <div class="news-item" data-category="${item.category}">
                <span class="news-date">${item.date}</span>
                <span class="news-icon">${item.icon || ''}</span>
                <span class="news-content">${content}</span>
            </div>`;
  }).join('');
  
  // Generate selected publications
  const targetName = personal.name.split(' ')[0]; // Use first name for highlighting
  const pubsHtml = selectedPubs.map(pub => {
    const venueBadge = formatPublicationVenue(pub.venue_type, pub.venue, pub.is_oral);
    const authorsFormatted = highlightAuthorName(pub.authors, targetName);
    const linksFormatted = formatPublicationLinks(pub.links);
    const shortDesc = pub.short_description ? `<p class="publication-description">${pub.short_description}</p>` : '';
    
    const hasTldrClass = pub.tldr ? "has-tldr" : "";
    const tldrHtml = pub.tldr ? `
        <div class="tldr-wrapper">
            <span class="tldr-badge">TL;DR</span>
            <p class="tldr-text">${pub.tldr}</p>
        </div>` : "";
    
    return `
            <div class="publication-item reveal ${hasTldrClass}">
                <img src="${pub.image}" alt="${pub.title}" class="publication-image teaser" onerror="this.src='images/default-paper.png'">
                <div class="publication-content">
                    <p class="publication-title">${venueBadge} ${pub.title}</p>
                    <p class="publication-authors">${authorsFormatted}</p>
                    ${shortDesc}
                    <p class="publication-links">${linksFormatted}</p>
                </div>
                ${tldrHtml}
            </div>`;
  }).join('');
  
  // Generate experience items
  const expHtml = experience.map(exp => `
            <div class="experience-item reveal">
                <img src="${exp.logo}" alt="${exp.company}" class="experience-logo">
                <div class="experience-content">
                    <p class="experience-position">${exp.position}</p>
                    <p class="experience-company">${exp.company}</p>
                    <p class="experience-period">${exp.period}</p>
                    <p class="experience-description">${exp.description}</p>
                </div>
            </div>`).join('');
  
  // Generate education items
  const eduHtml = education.map(edu => {
    const details = edu.details ? `<p class="education-details">${edu.details}</p>` : '';
    return `
            <div class="education-item reveal">
                <span class="education-period">${edu.period}</span>
                <div class="education-content">
                    <p class="education-degree">${edu.degree}</p>
                    <p class="education-institution">${edu.institution}</p>
                    ${details}
                </div>
            </div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<!-- 
  Generated by Config-Driven Academic Website Template
  Author: Sixun Dong (ironieser)
  Repository: https://github.com/Ironieser/ironieser.github.io
  License: MIT
-->
<html lang="en">
<script>/* Inline theme init — prevent flash of wrong theme */
(function(){var m=localStorage.getItem('theme-mode')||'auto';var d=m==='night'||(m==='auto'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');})();</script>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personal.name}${personal.aka ? ` (${personal.aka})` : ''} - Academic Homepage</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="${config.seo?.website_description || `${personal.name} - ${personal.title} at ${personal.affiliation}`}">
    <meta name="keywords" content="${config.seo?.keywords?.join(', ') || 'academic, research, computer science'}">
    <meta name="author" content="${personal.name}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${personal.name} - Academic Homepage">
    <meta property="og:description" content="${config.seo?.website_description || `${personal.name} - ${personal.title} at ${personal.affiliation}`}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${config.seo?.website_url || 'https://ironieser.github.io'}">
    <meta property="og:image" content="${config.seo?.website_url || 'https://ironieser.github.io'}/${personal.profile_image}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${personal.name} - Academic Homepage">
    <meta name="twitter:description" content="${config.seo?.website_description || `${personal.name} - ${personal.title} at ${personal.affiliation}`}">
    <meta name="twitter:image" content="${config.seo?.website_url || 'https://ironieser.github.io'}/${personal.profile_image}">
    
    <!-- JSON-LD Structured Data -->
    ${generateJsonLd(config)}
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    <link rel="shortcut icon" href="favicon.ico">
    
    <link rel="stylesheet" href="assets/css/styles.css?v=3">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css">
    <script src="assets/js/script.js" defer></script>
</head>
<body>
    <!-- Navigation -->
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                ${generateNavigation(personal, 'Bio')}
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main">
        <!-- Hero Section -->
        <section class="hero">
            <div class="container">
                <div class="hero-content">
                    <!-- Left: Photo -->
                    <div class="hero-photo">
                        <img src="${personal.profile_image}" alt="${personal.name}" class="profile-image">
                    </div>
                    
                    <!-- Right: Introduction -->
                    <div class="hero-info">
                        <h1 class="hero-title">${personal.name}${personal.aka ? `<span class="aka"> (${personal.aka})</span>` : ''}</h1>
                        <p class="hero-subtitle">${personal.title}</p>
                        <p class="hero-affiliation">${personal.affiliation}</p>
                        
                        <div class="hero-description">
                            ${bioHtml}
                        </div>
                        
                        <div class="hero-links">
                            ${linksHtml}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Recent News Section -->
        <section class="section-alt">
            <div class="container">
                <h2 class="section-title">Recent News</h2>
                
                <div class="news-container">
                    <div class="news-sidebar">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="papers">📄 Papers</button>
                        <button class="filter-btn" data-filter="career">💼 Career</button>
                        <button class="filter-btn" data-filter="projects">🚀 Projects</button>
                    </div>
                    
                    <div class="news-list">
                        ${newsHtml}
                    </div>
                </div>
            </div>
        </section>

        <!-- Selected Publications -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="section-title">Selected Publications</h2>
                <div class="publications-list">
                    ${pubsHtml}
                </div>
                
                <div class="section-footer">
                    <a href="publications.html" class="btn btn-more">View All Publications</a>
                </div>
            </div>
        </section>

        <!-- Experience -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="section-title">Experience</h2>
                <div class="experience-list">
                    ${expHtml}
                </div>
            </div>
        </section>

        <!-- Academic Service -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="section-title">Academic Service</h2>
                <div class="service-content">
                    <div class="service-summary">
                        <h3 class="service-title">Reviewer</h3>
                        <p class="service-description">
                            <strong>Conferences:</strong> ${service.reviewer.conferences}
                        </p>
                        <p class="service-description">
                            <strong>Journals:</strong> ${service.reviewer.journals}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Education -->
        <section class="section section-alt">
            <div class="container">
                <h2 class="section-title">Education</h2>
                <div class="education-list">
                    ${eduHtml}
                </div>
            </div>
        </section>
    </main>

    ${generateFooter(personal, _template_info, visitor_map, config.copyright_start_year)}
    
    <script>
        // News filter functionality
        function initNewsFilter() {
            const filterBtns = document.querySelectorAll('.filter-btn');
            const newsItems = document.querySelectorAll('.news-item');
            const categoryIndicators = document.querySelectorAll('.category-indicator');
            
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    // Update active button
                    filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update active category indicator
                    categoryIndicators.forEach(indicator => {
                        indicator.classList.remove('active');
                        if (indicator.getAttribute('data-category') === filter) {
                            indicator.classList.add('active');
                        }
                    });
                    
                    // Filter news items
                    newsItems.forEach(item => {
                        if (filter === 'all' || item.getAttribute('data-category') === filter) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        }
        
        // Initialize news filter on page load
        document.addEventListener('DOMContentLoaded', function() {
            initNewsFilter();
        });
    </script>
    
    ${generateCommonScripts()}
</body>
</html>`;
}

function generatePublicationsPage(config) {
  console.log('Generating publications.html...');
  
  const { personal, research, publications, _template_info, _scholar_sync, visitor_map } = config;
  const targetName = personal.name.split(' ')[0];
  
  // Separate auto-synced and manual publications
  const manualPubs = {};
  const autoSyncedPubs = [];
  
  // Process publications by year, separating auto-synced ones
  const sortedYears = Object.keys(publications).filter(year => year !== 'survey').sort().reverse();
  
  for (const year of sortedYears) {
    const yearPubs = publications[year];
    const manualYearPubs = [];
    
    yearPubs.forEach(pub => {
      if (pub.auto_sync === true) {
        autoSyncedPubs.push(pub);
      } else {
        manualYearPubs.push(pub);
      }
    });
    
    if (manualYearPubs.length > 0) {
      manualPubs[year] = manualYearPubs;
    }
  }
  
  // Generate manual publications by year
  const yearSections = [];
  const manualYears = Object.keys(manualPubs).sort().reverse();
  
  for (const year of manualYears) {
    const yearPubs = manualPubs[year];
    const pubItems = yearPubs.map(pub => {
      const venueBadge = formatPublicationVenue(pub.venue_type, pub.venue, pub.is_oral);
      const authorsFormatted = highlightAuthorName(pub.authors, targetName);
      const linksFormatted = formatPublicationLinks(pub.links);
      
      const hasTldrClass = pub.tldr ? "has-tldr" : "";
      const tldrHtml = pub.tldr ? `
          <div class="tldr-wrapper">
              <span class="tldr-badge">TL;DR</span>
              <p class="tldr-text">${pub.tldr}</p>
          </div>` : "";
      
      return `
                <div class="publication-item reveal ${hasTldrClass}">
                    <img src="${pub.image}" alt="${pub.title}" class="publication-image teaser" onerror="this.src='images/default-paper.png'">
                    <div class="publication-content">
                        <p class="publication-title">${venueBadge} ${pub.title}</p>
                        <p class="publication-authors">${authorsFormatted}</p>
                        <p class="publication-links">${linksFormatted}</p>
                    </div>
                    ${tldrHtml}
                </div>`;
    }).join('');
    
    yearSections.push(`
            <div class="year-group">
                <h3 class="year-title">${year}</h3>
                <div class="publications-list">
                    ${pubItems}
                </div>
            </div>`);
  }
  
  // Generate survey papers section
  if (publications.survey) {
    const surveyItems = publications.survey.map(pub => {
      const venueBadge = formatPublicationVenue(pub.venue_type, pub.venue);
      const authorsFormatted = highlightAuthorName(pub.authors, targetName);
      const linksFormatted = formatPublicationLinks(pub.links);
      
      const hasTldrClass = pub.tldr ? "has-tldr" : "";
      const tldrHtml = pub.tldr ? `
          <div class="tldr-wrapper">
              <span class="tldr-badge">TL;DR</span>
              <p class="tldr-text">${pub.tldr}</p>
          </div>` : "";
      
      return `
                <div class="publication-item reveal ${hasTldrClass}">
                    <img src="${pub.image}" alt="${pub.title}" class="publication-image teaser" onerror="this.src='images/default-paper.png'">
                    <div class="publication-content">
                        <p class="publication-title">${venueBadge} ${pub.title}</p>
                        <p class="publication-authors">${authorsFormatted}</p>
                        <p class="publication-links">${linksFormatted}</p>
                    </div>
                    ${tldrHtml}
                </div>`;
    }).join('');
    
    yearSections.push(`
            <div class="year-group">
                <h3 class="year-title">Survey Papers</h3>
                <div class="publications-list">
                    ${surveyItems}
                </div>
            </div>`);
  }
  
  // Generate stats
  const statsHtml = research.stats.map(stat => `<span class="stat-item">${stat}</span>`).join(' <span class="stat-divider">•</span> ');
  
  return `<!DOCTYPE html>
<!-- 
  Generated by Config-Driven Academic Website Template
  Author: Sixun Dong (ironieser)
  Repository: https://github.com/Ironieser/ironieser.github.io
  License: MIT
-->
<html lang="en">
<script>/* Inline theme init — prevent flash of wrong theme */
(function(){var m=localStorage.getItem('theme-mode')||'auto';var d=m==='night'||(m==='auto'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');})();</script>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Publications - ${personal.name}${personal.aka ? ` (${personal.aka})` : ''}</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Publications by ${personal.name} - ${personal.title} at ${personal.affiliation}. Research in ${config.seo?.author?.research_areas?.join(', ') || 'computer vision, multimodal AI, machine learning'}">
    <meta name="keywords" content="${config.seo?.keywords?.join(', ') || 'academic, research, computer science'}, publications, papers, research papers">
    <meta name="author" content="${personal.name}">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Publications - ${personal.name}">
    <meta property="og:description" content="Publications by ${personal.name} - ${personal.title} at ${personal.affiliation}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${config.seo?.website_url || 'https://sixundong.com'}/publications.html">
    <meta property="og:image" content="${config.seo?.website_url || 'https://sixundong.com'}/${personal.profile_image}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Publications - ${personal.name}">
    <meta name="twitter:description" content="Publications by ${personal.name} - ${personal.title} at ${personal.affiliation}">
    <meta name="twitter:image" content="${config.seo?.website_url || 'https://sixundong.com'}/${personal.profile_image}">
    
    <!-- JSON-LD Structured Data -->
    ${generateJsonLd(config)}
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    <link rel="shortcut icon" href="favicon.ico">
    
    <link rel="stylesheet" href="assets/css/styles.css?v=3">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css">
    <script src="assets/js/script.js" defer></script>
</head>
<body>
    <!-- Navigation -->
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                ${generateNavigation(personal, 'Publications')}
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main">
        <!-- Page Header -->
        <section class="page-header">
            <div class="container">
                <div class="page-header-content">
                    <h1 class="page-title-left">Publications</h1>
                    <div class="research-intro">
                        <p>${research.description}</p>
                    </div>
                    
                    <!-- Summary Stats Bar -->
                    <div class="publication-stats-bar">
                        ${statsHtml}
                    </div>
                </div>
            </div>
        </section>

        <!-- Publications -->
        <section class="section">
            <div class="container">
                ${yearSections.join('')}
            </div>
        </section>
    </main>

    ${generateFooter(personal, _template_info, visitor_map, config.copyright_start_year)}
    
    ${generateCommonScripts()}
</body>
</html>`;
}

function buildWebsite() {
  console.log('🚀 Building website from content.json + meta.json...');
  
  try {
    // Load configuration
    const config = loadConfig();
    console.log('✓ Configuration loaded successfully');
    
    // Generate HTML files
    const indexHtml = generateIndexPage(config);
    fs.writeFileSync(INDEX_OUTPUT, indexHtml);
    console.log('✓ index.html generated successfully');
    
    const publicationsHtml = generatePublicationsPage(config);
    fs.writeFileSync(PUBLICATIONS_OUTPUT, publicationsHtml);
    console.log('✓ publications.html generated successfully');

    // Generate Cloudflare Pages _redirects file for project short links (if configured)
    const redirectsGenerated = generateRedirects(config);
    
    console.log('\n🎉 Website generation completed!');
    console.log('\n💡 Files updated:');
    console.log('   - index.html');
    console.log('   - publications.html');
    if (redirectsGenerated) {
      console.log('   - _redirects');
    }
    console.log('   - _redirects');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the build
buildWebsite(); 
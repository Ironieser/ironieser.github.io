/**
 * Blog Page Generator for Config-Driven Academic Website Template
 * Generates blog.html from content.json + meta.json and blog-data.js
 * 
 * @author Sixun Dong (ironieser)
 * @version 1.0.0
 * @license MIT
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
const BLOG_OUTPUT = path.join(__dirname, '../../blog.html');

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
  console.log('Loading configuration for blog page...');

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

      const parts = ['config/content.json'];
      if (hasMeta) parts.push('config/meta.json');
      if (hasSite) parts.push('config/site.yaml');
      console.log('✓ Loaded config from ' + parts.join(' + '));
      return { ...metaConfig, ...contentConfig, ...siteConfig };
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
  
  return navItems.join('\n                ');
}

function generateFooter(personal, templateInfo = null, visitorMap = null, copyrightStartYear = null) {
  const startYear = copyrightStartYear != null ? Number(copyrightStartYear) : 2025;
  const currentYear = new Date().getFullYear();
  const copyrightYears = currentYear === startYear ? `${startYear}` : `${startYear} - ${currentYear}`;
  
  // Template credit: full block if enabled; otherwise single "Template by" line
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
                        const location = \`\${data.city}, \${data.country}\`;
                        document.getElementById('owner-location').textContent = location;
                        return;
                    }
                }
                
                // If all APIs fail, show a default message
                document.getElementById('owner-location').textContent = 'GitHub Actions';
                
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

function generateBlogPage(config) {
  console.log('Generating blog.html...');
  
  const { personal, _template_info, visitor_map } = config;
  
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
    <title>Blog - ${personal.name}</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
    <link rel="shortcut icon" href="favicon.ico">
    
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/blog.css">
    <link rel="stylesheet" href="assets/css/blog-comments.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jpswalsh/academicons@1/css/academicons.min.css">
    <link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css">
    <script src="assets/js/blog-data.js"></script>
</head>
<body>
    <!-- Navigation -->
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                ${generateNavigation(personal, 'Blog')}
            </div>
        </nav>
    </header>

    <!-- Main Content -->
    <main class="main">
        <!-- Blog List View -->
        <div id="blog-list-view" class="blog-view">
            <!-- Page Header -->
            <section class="page-header">
                <div class="container">
                    <div class="page-header-content">
                        <h1 class="page-title-left">Blog</h1>
                        <div class="blog-intro">
                            <p>Welcome to my blog! Here I share insights about my research, thoughts on the latest developments in computer vision and AI, tutorials, and reflections on my academic journey.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Blog Posts List -->
            <section class="section">
                <div class="container">
                    <div id="blog-posts-container" class="blog-list">
                        <!-- Blog posts will be loaded here by JavaScript -->
                    </div>
                    
                    <!-- Loading indicator -->
                    <div id="blog-loading" class="blog-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading blog posts...</p>
                    </div>
                    
                    <!-- No posts message -->
                    <div id="no-posts-message" class="no-posts-message" style="display: none;">
                        <i class="fas fa-pen-nib"></i>
                        <h3>No Blog Posts Yet</h3>
                        <p>Check back soon for new content!</p>
                    </div>
                </div>
            </section>
        </div>

        <!-- Blog Post View -->
        <div id="blog-post-view" class="blog-view" style="display: none;">
            <section class="section">
                <div class="container">
                    <div class="blog-post-container">
                        <!-- Back button -->
                        <div class="blog-navigation">
                            <button id="back-to-list" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Back to Blog
                            </button>
                        </div>
                        
                        <!-- Post content will be loaded here -->
                        <article id="blog-post-content" class="blog-post-content">
                            <!-- Content loaded by JavaScript -->
                        </article>
                    </div>
                </div>
            </section>
        </div>
    </main>

    ${generateFooter(personal, _template_info, visitor_map, config.copyright_start_year)}
    
    <script>
        // Blog functionality
        let currentView = 'list';
        let currentPost = null;
        
        function showBlogList() {
            document.getElementById('blog-list-view').style.display = 'block';
            document.getElementById('blog-post-view').style.display = 'none';
            currentView = 'list';
            
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.delete('post');
            window.history.replaceState({}, '', url);
        }
        
        function showBlogPost(postId) {
            const post = window.getBlogPost(postId);
            if (!post) {
                console.error('Post not found:', postId);
                return;
            }
            
            currentPost = post;
            
            // Hide list view, show post view
            document.getElementById('blog-list-view').style.display = 'none';
            document.getElementById('blog-post-view').style.display = 'block';
            currentView = 'post';
            
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('post', postId);
            window.history.replaceState({}, '', url);
            
            // Load post content
            loadPostContent(post);
            
            // Initialize comments after content is loaded
            setTimeout(() => {
                initWalineComments(post.title);
            }, 500);
        }
        
        function loadPostContent(post) {
            const container = document.getElementById('blog-post-content');
            
            const tagsHtml = post.tags.map(tag => 
                \`<span class="blog-tag">\${tag}</span>\`
            ).join('');
            
            let externalLinkSection = '';
            if (post.isExternal) {
                externalLinkSection = \`
                    <div class="external-link-section">
                        <div class="external-link-notice">
                            <i class="fas fa-external-link-alt"></i>
                            <span>This article was originally published on \${post.platform}</span>
                        </div>
                        <a href="\${post.externalUrl}" target="_blank" class="external-link-button">
                            <i class="fab fa-\${post.platform.toLowerCase()}"></i>
                            Read Full Article on \${post.platform}
                        </a>
                    </div>
                \`;
            }
            
            container.innerHTML = \`
                <header class="blog-post-header">
                    <h1 class="blog-post-title">\${post.title}</h1>
                    <div class="blog-post-meta">
                        <span class="blog-post-date">
                            <i class="fas fa-calendar"></i> \${post.formattedDate}
                        </span>
                        \${post.isExternal ? \`<span class="blog-post-platform"><i class="fas fa-external-link-alt"></i> \${post.platform}</span>\` : ''}
                    </div>
                    <div class="blog-post-tags">
                        \${tagsHtml}
                    </div>
                    \${externalLinkSection}
                </header>
                
                <div class="blog-post-body">
                    \${post.content}
                </div>
                
                <!-- Comments Section -->
                <section class="blog-comments-section">
                    <div class="comments-header">
                        <h3 class="comments-title">
                            <i class="fas fa-comments"></i>
                            Comments & Discussions
                        </h3>
                        <p class="comments-subtitle">
                            Join the discussion! Comments are powered by 
                            <a href="https://waline.js.org" target="_blank" rel="noopener">Waline</a>.
                            You can comment anonymously or sign in with email.
                        </p>
                        <div class="comments-info">
                            <h4>How to comment:</h4>
                            <ul>
                                <li>💬 Comment anonymously or sign in with email</li>
                                <li>📝 Support Markdown formatting</li>
                                <li>👍 Like and reply to comments</li>
                                <li>🔔 Get email notifications for replies (optional)</li>
                            </ul>
                        </div>
                    </div>
                    <div id="waline" class="waline-container">
                        <!-- Waline comments will be loaded here -->
                    </div>
                </section>
            \`;
        }
        
        function loadBlogPosts() {
            const container = document.getElementById('blog-posts-container');
            const loading = document.getElementById('blog-loading');
            const noPostsMsg = document.getElementById('no-posts-message');
            
            try {
                const posts = window.getAllBlogPosts();
                
                loading.style.display = 'none';
                
                if (posts.length === 0) {
                    noPostsMsg.style.display = 'block';
                    return;
                }
                
                const postsHtml = posts.map(post => {
                    const tagsHtml = post.tags.slice(0, 3).map(tag => 
                        \`<span class="blog-tag">\${tag}</span>\`
                    ).join('');
                    
                    if (post.isExternal) {
                        // External blog post (e.g., Zhihu)
                        return \`
                            <div class="blog-item external-post" data-post-id="\${post.id}">
                                <img src="\${post.image}" alt="\${post.title}" class="blog-image" onerror="this.src='images/default-paper.png'">
                                <div class="blog-content">
                                    <div class="blog-type-badge external">External</div>
                                    <h3 class="blog-title">
                                        <a href="#" class="blog-link external-link" data-post-id="\${post.id}">\${post.title}</a>
                                    </h3>
                                    <p class="blog-description">\${post.description}</p>
                                    <div class="blog-meta">
                                        <span class="blog-date">\${post.formattedDate}</span>
                                        <div class="blog-links">
                                            <i class="fab fa-zhihu"></i> 
                                            <a href="\${post.externalUrl}" target="_blank">Read on \${post.platform}</a>
                                        </div>
                                        <span class="blog-tags">
                                            \${tagsHtml}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        \`;
                    } else {
                        // Internal blog post
                        return \`
                            <div class="blog-item internal-post" data-post-id="\${post.id}">
                                <img src="\${post.image}" alt="\${post.title}" class="blog-image" onerror="this.src='images/default-paper.png'">
                                <div class="blog-content">
                                    <div class="blog-type-badge internal">Blog</div>
                                    <h3 class="blog-title">
                                        <a href="#" class="blog-link internal-link" data-post-id="\${post.id}">\${post.title}</a>
                                    </h3>
                                    <p class="blog-description">\${post.description}</p>
                                    <div class="blog-meta">
                                        <span class="blog-date">\${post.formattedDate}</span>
                                        <span class="blog-tags">
                                            \${tagsHtml}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }
                }).join('');
                
                container.innerHTML = postsHtml;
                
                // Add click handlers
                document.querySelectorAll('.internal-link').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const postId = this.getAttribute('data-post-id');
                        showBlogPost(postId);
                    });
                });

                document.querySelectorAll('.external-link').forEach(link => {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        const postId = this.getAttribute('data-post-id');
                        showBlogPost(postId);
                    });
                });

                document.querySelectorAll('.blog-item.internal-post').forEach(item => {
                    item.addEventListener('click', function() {
                        const postId = this.getAttribute('data-post-id');
                        showBlogPost(postId);
                    });
                });

                document.querySelectorAll('.blog-item.external-post').forEach(item => {
                    item.addEventListener('click', function() {
                        const postId = this.getAttribute('data-post-id');
                        showBlogPost(postId);
                    });
                });
                
            } catch (error) {
                loading.style.display = 'none';
                console.error('Error loading blog posts:', error);
                container.innerHTML = \`
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Error Loading Posts</h3>
                        <p>There was an error loading the blog posts. Please try again later.</p>
                    </div>
                \`;
            }
        }
        
        function initializeBlog() {
            // Check for post parameter in URL
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('post');
            
            if (postId) {
                // Show specific post
                showBlogPost(postId);
            } else {
                // Show blog list
                showBlogList();
                loadBlogPosts();
            }
            
            // Back button handler
            document.getElementById('back-to-list').addEventListener('click', function() {
                showBlogList();
                loadBlogPosts();
            });
            
            // Handle browser back/forward
            window.addEventListener('popstate', function() {
                const urlParams = new URLSearchParams(window.location.search);
                const postId = urlParams.get('post');
                
                if (postId) {
                    showBlogPost(postId);
                } else {
                    showBlogList();
                    loadBlogPosts();
                }
            });
        }
        
        // Initialize Waline comments
        function initWalineComments(postTitle) {
            // Clear any existing Waline instance
            const walineContainer = document.getElementById('waline');
            if (walineContainer) {
                walineContainer.innerHTML = '';
            }
            
            // Import and initialize Waline
            import('https://unpkg.com/@waline/client@v3/dist/waline.js')
                .then(({ init }) => {
                    init({
                        el: '#waline',
                        serverURL: 'https://comments.sixundong.com',
                        path: window.location.pathname + window.location.search,
                        lang: 'en-US',
                        locale: {
                            placeholder: 'Hi, looking forward to your comments! Feel free to leave any suggestions!',
                            sofa: 'No comments yet.',
                            submit: 'Submit',
                            reply: 'Reply',
                            cancelReply: 'Cancel Reply',
                            comment: 'Comments',
                            refresh: 'Refresh',
                            more: 'Load More...',
                            preview: 'Preview',
                            emoji: 'Emoji',
                            uploadImage: 'Upload Image',
                            seconds: 'seconds ago',
                            minutes: 'minutes ago',
                            hours: 'hours ago',
                            days: 'days ago',
                            now: 'just now',
                            uploading: 'Uploading',
                            login: 'Login',
                            logout: 'Logout',
                            admin: 'Admin',
                            sticky: 'Sticky',
                            word: 'Words',
                            wordHint: 'Please input $0 to $1 words\\n Current word number: $2',
                            anonymous: 'Anonymous',
                            level0: 'Dwarves',
                            level1: 'Hobbits', 
                            level2: 'Ents',
                            level3: 'Wizards',
                            level4: 'Elves',
                            level5: 'Maiar',
                            gif: 'GIF',
                            gifSearchPlaceholder: 'Search GIF',
                            profile: 'Profile',
                            approved: 'Approved',
                            waiting: 'Waiting',
                            spam: 'Spam',
                            unsticky: 'Unsticky',
                            oldest: 'Oldest',
                            latest: 'Latest',
                            hottest: 'Hottest',
                            reactionTitle: 'What do you think?'
                        },
                        emoji: [
                            '//unpkg.com/@waline/client@v3/dist/emoji/weibo',
                            '//unpkg.com/@waline/client@v3/dist/emoji/alus',
                            '//unpkg.com/@waline/client@v3/dist/emoji/bilibili',
                        ],
                        dark: false,
                        meta: ['nick', 'mail', 'link'],
                        requiredMeta: [],
                        login: 'enable',
                        wordLimit: [0, 1000],
                        pageSize: 10,
                        region: 'us',
                    });
                })
                .catch(error => {
                    console.error('Failed to load Waline:', error);
                    const walineContainer = document.getElementById('waline');
                    if (walineContainer) {
                        walineContainer.innerHTML = \`
                            <div class="waline-error">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>Failed to load comment system. Please try refreshing the page.</p>
                            </div>
                        \`;
                    }
                });
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Check if blog data is already loaded
            if (typeof window.BLOG_DATA !== 'undefined') {
                console.log('Blog data already loaded, initializing...');
                initializeBlog();
                return;
            }
            
            // Wait for assets/js/blog-data.js to load with progressive timeout
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds total
            
            function checkBlogData() {
                attempts++;
                
                if (typeof window.BLOG_DATA !== 'undefined') {
                    console.log('Blog data loaded after', attempts * 100, 'ms');
                    initializeBlog();
                } else if (attempts < maxAttempts) {
                    setTimeout(checkBlogData, 100);
                } else {
                    console.error('Blog data failed to load after 5 seconds');
                    document.getElementById('blog-loading').style.display = 'none';
                    document.getElementById('no-posts-message').innerHTML = \`
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to Load Blog Data</h3>
                        <p>The blog data could not be loaded. Please try refreshing the page.</p>
                        <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
                    \`;
                    document.getElementById('no-posts-message').style.display = 'block';
                }
            }
            
            checkBlogData();
        });
    </script>
    
    ${generateCommonScripts()}
</body>
</html>`;
}

function buildBlogPage() {
  console.log('Building blog page...');
  
  try {
    // Load configuration
    const config = loadConfig();
    console.log('✓ Configuration loaded successfully');
    
    // Generate blog HTML
    const blogHtml = generateBlogPage(config);
    
    // Write to file
    fs.writeFileSync(BLOG_OUTPUT, blogHtml);
    console.log('✓ blog.html generated successfully');
    
    return true;
  } catch (error) {
    console.error('Error building blog page:', error);
    return false;
  }
}

// Run the build
if (require.main === module) {
  try {
    buildBlogPage();
    console.log('Blog page build completed successfully!');
  } catch (error) {
    console.error('Blog page build failed:', error);
    process.exit(1);
  }
}

module.exports = { buildBlogPage }; 
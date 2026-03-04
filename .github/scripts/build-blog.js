const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function getMarked() {
  const mod = await import('marked');
  const marked = mod.marked || mod.default || mod;

  // Configure marked for better security and formatting
  marked.setOptions({
    headerIds: false,
    mangle: false
  });

  return marked;
}

// Blog directory
const BLOG_DIR = path.join(__dirname, '../../blog');
const OUTPUT_FILE = path.join(__dirname, '../../assets/js/blog-data.js');

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, content: content };
  }
  
  try {
    const metadata = yaml.load(match[1]);
    const markdownContent = match[2];
    return { metadata: metadata || {}, content: markdownContent };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return { metadata: {}, content: content };
  }
}

function formatDate(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function generatePostId(filename) {
  return filename.replace('.md', '').toLowerCase().replace(/[^a-z0-9]/g, '-');
}

async function buildBlogData() {
  console.log('Building blog data...');
  
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('Blog directory does not exist, creating empty blog data.');
    const emptyData = 'window.BLOG_DATA = [];';
    fs.writeFileSync(OUTPUT_FILE, emptyData);
    return;
  }

  const marked = await getMarked();
  
  const blogPosts = [];
  const files = fs.readdirSync(BLOG_DIR).filter(file => 
    file.endsWith('.md') && file !== 'README.md'
  );
  
  console.log(`Found ${files.length} markdown files`);
  
  files.forEach(filename => {
    console.log(`Processing: ${filename}`);
    
    try {
      const filePath = path.join(BLOG_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { metadata, content: markdownContent } = parseFrontmatter(content);
      
      // Generate post ID
      const postId = generatePostId(filename);
      
      // Check if this is an external post
      const isExternal = metadata.external || false;
      
      let blogPost;
      
      if (isExternal) {
        // External blog post (e.g., Zhihu)
        // Parse markdown to HTML for the description page
        const htmlContent = marked.parse(markdownContent);
        
        blogPost = {
          id: postId,
          filename: filename,
          title: metadata.title || 'Untitled Post',
          date: metadata.date || '',
          formattedDate: formatDate(metadata.date),
          description: metadata.description || 'No description available.',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          image: metadata.image || 'images/default-paper.png',
          content: htmlContent,  // Include content for the blog post page
          isExternal: true,
          externalUrl: metadata.externalUrl || '#',
          platform: metadata.platform || 'External',
          metadata: metadata
        };
      } else {
        // Internal blog post
        // Parse markdown to HTML
        const htmlContent = marked.parse(markdownContent);
        
        blogPost = {
          id: postId,
          filename: filename,
          title: metadata.title || 'Untitled Post',
          date: metadata.date || '',
          formattedDate: formatDate(metadata.date),
          description: metadata.description || 'No description available.',
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          image: metadata.image || 'images/default-paper.png',
          content: htmlContent,
          metadata: metadata
        };
      }
      
      blogPosts.push(blogPost);
      
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  });
  
  // Sort by date (newest first)
  blogPosts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  // Generate JavaScript file
  const jsContent = `// Auto-generated blog data
// This file is automatically updated by GitHub Actions
// Do not edit manually

window.BLOG_DATA = ${JSON.stringify(blogPosts, null, 2)};

// Helper function to get blog post by ID
window.getBlogPost = function(id) {
  return window.BLOG_DATA.find(post => post.id === id);
};

// Helper function to get all blog posts
window.getAllBlogPosts = function() {
  return window.BLOG_DATA;
};

console.log('Blog data loaded: ' + window.BLOG_DATA.length + ' posts');
`;
  
  fs.writeFileSync(OUTPUT_FILE, jsContent);
  console.log(`Generated blog data with ${blogPosts.length} posts`);
  console.log(`Output written to: ${OUTPUT_FILE}`);
  
  // Log post titles for verification
  blogPosts.forEach(post => {
    const postType = post.isExternal ? "External" : "Internal";
    console.log(`- [${postType}] ${post.title} (${post.formattedDate})`);
  });
}

// Run the build
(async () => {
  try {
    await buildBlogData();
    console.log('Blog build completed successfully!');
  } catch (error) {
    console.error('Blog build failed:', error);
    process.exit(1);
  }
})();
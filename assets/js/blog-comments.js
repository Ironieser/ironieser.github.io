/**
 * Waline Comments Component for Blog Posts
 * User-friendly comment system with anonymous support
 */

// Waline configuration
const WALINE_CONFIG = {
    serverURL: 'https://comments.ironieser.cc',
    path: location.pathname,
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
        wordHint: 'Please input $0 to $1 words\n Current word number: $2',
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
    avatar: 'mp',
    meta: ['nick', 'mail', 'link'],
    requiredMeta: [],
    pageSize: 10,
    dark: false,
    imageUploader: false,
    highlighter: false,
    texRenderer: false,
    search: false,
    wordLimit: [0, 1000],
    login: 'enable'
};

/**
 * Initialize Waline comments for a blog post
 * @param {string} postTitle - The title of the blog post
 * @param {string} containerId - The ID of the container element
 */
function initWalineComments(postTitle, containerId = 'waline-comments') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Waline container not found:', containerId);
        return;
    }

    // Check if server URL is configured
    if (!WALINE_CONFIG.serverURL || WALINE_CONFIG.serverURL === 'https://your-waline-server.vercel.app') {
        showCommentsSetupMessage();
        return;
    }

    // Check if Waline script is loaded
    if (typeof Waline === 'undefined') {
        console.error('Waline script not loaded');
        showCommentsError('Failed to load comment system');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    try {
        // Initialize Waline
        const waline = Waline.init({
            ...WALINE_CONFIG,
            el: container,
            path: postTitle, // Use post title as path for unique comments
        });
        
        console.log('Waline comments initialized for:', postTitle);
        return waline;
    } catch (error) {
        console.error('Error initializing Waline:', error);
        showCommentsError('Failed to initialize comment system');
    }
}

/**
 * Show error message in comments section
 * @param {string} message - Error message to display
 */
function showCommentsError(message) {
    const container = document.getElementById('waline-comments');
    if (container) {
        container.innerHTML = `
            <div class="waline-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }
}

/**
 * Show setup message when server is not configured
 */
function showCommentsSetupMessage() {
    const container = document.getElementById('waline-comments');
    if (container) {
        container.innerHTML = `
            <div class="comments-setup-message">
                <div class="setup-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h4>评论系统准备中</h4>
                <p>Waline评论服务器正在部署中，很快就能使用啦！</p>
                <div class="setup-steps">
                    <div class="setup-step">
                        <i class="fas fa-check-circle"></i>
                        <span>LeanCloud数据库已配置</span>
                    </div>
                    <div class="setup-step pending">
                        <i class="fas fa-clock"></i>
                        <span>Vercel服务器部署中...</span>
                    </div>
                    <div class="setup-step pending">
                        <i class="fas fa-comments"></i>
                        <span>评论功能即将上线</span>
                    </div>
                </div>
                <p class="setup-note">
                    <i class="fas fa-info-circle"></i>
                    部署完成后，访客将可以匿名评论或使用邮箱登录
                </p>
            </div>
        `;
    }
}

/**
 * Load Waline script dynamically
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadWalineScript() {
    return new Promise((resolve, reject) => {
        if (typeof Waline !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@waline/client@v3/dist/waline.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            console.log('Waline script loaded successfully');
            resolve();
        };
        script.onerror = (error) => {
            console.error('Failed to load Waline script:', error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

/**
 * Create comments section HTML
 * @param {string} postTitle - The title of the blog post
 * @returns {string} HTML string for comments section
 */
function createCommentsSection(postTitle) {
    return `
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
            <div id="waline-comments" class="waline-container">
                <div class="waline-loading">
                    <i class="fas fa-spinner"></i>
                    Loading comments...
                </div>
            </div>
        </section>
    `;
}

// Export functions for use in other scripts
window.initWalineComments = initWalineComments;
window.loadWalineScript = loadWalineScript;
window.createCommentsSection = createCommentsSection; 
// ─── Theme Toggle (Day / Night / Auto) ───────────────────────────────────────
(function () {
    const STORAGE_KEY = 'theme-mode'; // 'day' | 'night' | 'auto'
    const ICONS = { day: '☀️', night: '🌙', auto: '🌓' };
    const CYCLE  = { day: 'night', night: 'auto', auto: 'day' };

    function applyTheme(mode) {
        const root = document.documentElement;
        if (mode === 'day') {
            root.setAttribute('data-theme', 'light');
        } else if (mode === 'night') {
            root.setAttribute('data-theme', 'dark');
        } else {
            // auto: follow system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    function updateButton(mode) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.querySelector('.theme-icon').textContent = ICONS[mode];
            btn.title = `Theme: ${mode}`;
        }
    }

    function setMode(mode) {
        localStorage.setItem(STORAGE_KEY, mode);
        applyTheme(mode);
        updateButton(mode);
    }

    // Apply theme immediately (before DOMContentLoaded) to avoid flash
    const savedMode = localStorage.getItem(STORAGE_KEY) || 'auto';
    applyTheme(savedMode);

    document.addEventListener('DOMContentLoaded', function () {
        updateButton(savedMode);

        // Wire up button
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function () {
                const current = localStorage.getItem(STORAGE_KEY) || 'auto';
                setMode(CYCLE[current]);
            });
        }

        // Auto mode: react when system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if ((localStorage.getItem(STORAGE_KEY) || 'auto') === 'auto') {
                applyTheme('auto');
            }
        });
    });
})();
// ─────────────────────────────────────────────────────────────────────────────

// News Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const newsItems = document.querySelectorAll('.news-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter news items
            newsItems.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else {
                    const categories = item.getAttribute('data-category');
                    if (categories && categories.includes(filter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });
});


// Smooth scroll for internal links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}); 

// Scroll Reveal Animation
document.addEventListener('DOMContentLoaded', function() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    
    // Function to check and reveal elements
    function revealElements() {
        const windowHeight = window.innerHeight;
        const elementVisible = 50; // Show element when it's 50px from bottom

        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            
            // If element is in viewport
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    }

    // Run once on load to show elements immediately in viewport
    // Use setTimeout to ensure layout is fully calculated
    setTimeout(revealElements, 100);
    
    // Run on scroll
    window.addEventListener('scroll', revealElements);
    
    // Fail-safe: if elements are still invisible after 1.5 seconds, force show them
    // This prevents the page from being perpetually blank if JS height calc fails
    setTimeout(() => {
        reveals.forEach(reveal => {
            if (!reveal.classList.contains('active')) {
                // Only force-show elements that are near the top of the body
                // (assuming they should be visible but calculation failed)
                reveal.classList.add('active');
            }
        });
    }, 1500);
});

// Mobile TL;DR Tap-to-Toggle
document.addEventListener('DOMContentLoaded', function() {
    const tldrItems = document.querySelectorAll('.publication-item.has-tldr');
    
    tldrItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Only apply on touch/mobile screens where hover doesn't work well
            if (window.innerWidth <= 768) {
                // Don't trigger if the user clicked a link
                if (e.target.closest('a')) return;
                
                // Check if currently active
                const isActive = this.classList.contains('mobile-active');
                
                // Close all other tldr wrappers
                tldrItems.forEach(otherItem => {
                    otherItem.classList.remove('mobile-active');
                });
                
                // If it wasn't active, open it (otherwise it just closes)
                if (!isActive) {
                    this.classList.add('mobile-active');
                }
            }
        });
    });
});

// Mobile pub image: wrap with blurred background effect
document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth > 768) return;

    document.querySelectorAll('.publication-item .publication-image').forEach(function (img) {
        // Skip placeholder / underreview images (already hidden by CSS)
        if (img.src.includes('underreview')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'pub-img-wrapper';
        // Pass the image src as a CSS variable for the ::before blurred bg
        wrapper.style.setProperty('--pub-img-src', 'url("' + img.getAttribute('src') + '")');

        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    });
});

// Back-to-Top button
document.addEventListener('DOMContentLoaded', function () {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    function toggleBackToTop() {
        if (window.scrollY > 320) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    backToTop.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    window.addEventListener('scroll', toggleBackToTop);
    // Run once on load
    toggleBackToTop();
});
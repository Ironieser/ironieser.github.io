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

// Research roadmap flow view
document.addEventListener('DOMContentLoaded', function () {
    const graphEl = document.getElementById('research-roadmap-graph');
    const dataScript = document.getElementById('research-roadmap-data');
    if (!graphEl || !dataScript) return;

    let model;
    try {
        model = JSON.parse(dataScript.textContent || '{}');
    } catch (err) {
        console.error('Failed to parse research roadmap data:', err);
        return;
    }

    const filters = Array.isArray(model.filters) ? model.filters : [];
    const ongoingItems = Array.isArray(model.ongoing) ? model.ongoing : [];
    const visionLoop = model.vision_loop && typeof model.vision_loop === 'object' ? model.vision_loop : null;
    const papers = Array.isArray(model.nodes) ? model.nodes : [];
    if (!papers.length) return;

    let activeFilter = 'all';
    const phases = Array.isArray(model.phases) ? model.phases : [];
    if (!phases.length) return;
    const phaseOrder = new Map(phases.map((phase, idx) => [phase.id, idx]));
    const stageToPhase = new Map();
    phases.forEach(phase => {
        (Array.isArray(phase.stageIds) ? phase.stageIds : []).forEach(stageId => stageToPhase.set(stageId, phase.id));
    });

    function visiblePapers() {
        return papers;
    }

    function matchesActiveFilter(target) {
        if (activeFilter === 'all') return true;
        const tags = Array.isArray(target)
            ? target
            : (Array.isArray(target?.tags) ? target.tags : []);
        return tags.includes(activeFilter);
    }

    function tooltipLinks(paper) {
        const links = Array.isArray(paper.links) ? paper.links : [];
        const preferred = ['paper', 'code', 'github'];
        const picked = [];
        preferred.forEach(name => {
            const match = links.find(link => link && link.url && typeof link.name === 'string' && link.name.toLowerCase() === name);
            if (match && !picked.includes(match)) picked.push(match);
        });
        if (!picked.length) {
            links.forEach(link => {
                if (link && link.url && picked.length < 2) picked.push(link);
            });
        }
        return picked;
    }

    function paperPhaseIds(paper) {
        const ids = Array.from(new Set(
            (Array.isArray(paper.stages) ? paper.stages : [])
                .map(stageId => stageToPhase.get(stageId))
                .filter(Boolean)
        ));
        if (ids.length) {
            return ids.sort((a, b) => (phaseOrder.get(a) || 0) - (phaseOrder.get(b) || 0));
        }
        return ['perception'];
    }

    function primaryPhaseId(paper) {
        const ids = paperPhaseIds(paper);
        return ids[ids.length - 1] || 'perception';
    }

    function paperKeyword(paper) {
        if (paper.short_label) return paper.short_label;
        if (paper.label && !/(CVPR|ICLR|NeurIPS|WACV|ICASSP|3DV|arXiv|ECCV)/i.test(paper.label)) {
            return paper.label;
        }
        if (paper.title && paper.title.includes(':')) {
            const prefix = paper.title.split(':')[0].trim();
            if (prefix && prefix.split(' ').length <= 4) return prefix;
        }
        if (paper.label) return paper.label;
        return paper.title || 'Paper';
    }

    function paperVenueYear(paper) {
        const venueType = String(paper.venue_type || '').toLowerCase();
        const venue = paper.venue || '';
        const year = paper.year ? String(paper.year) : '';
        // Venue strings like CVPR'22 / arXiv'2506 / NeurIPS'25 already encode time → do not append calendar year.
        if (venue && /(\d{2}|\d{4})/.test(venue)) return venue;
        if (venueType.includes('under-review')) return year || venue;
        return [venue, year].filter(Boolean).join(' ');
    }

    function paperVenueMarkup(paper) {
        const text = paperVenueYear(paper);
        if (!text) return '';
        const venueType = String(paper.venue_type || '').toLowerCase();
        if (venueType.includes('conference') || venueType.includes('journal')) {
            return `<span class="roadmap-paper-venue is-accepted">${text}</span>`;
        }
        if (venueType.includes('preprint') || venueType.includes('under-review')) {
            return `<span class="roadmap-paper-venue is-preprint">${text}</span>`;
        }
        return `<span class="roadmap-paper-venue">${text}</span>`;
    }

    function papersForPhase(phase) {
        const all = visiblePapers()
            .filter(paper => primaryPhaseId(paper) === phase.id)
            .sort((a, b) => (
                Number(b.importance || 1) - Number(a.importance || 1) ||
                Number(b.year || 0) - Number(a.year || 0)
            ));
        const maxItems = phase.maxItems || 4;
        const isContext = n => n.card_kind === 'context';
        const contextItems = all.filter(isContext);
        const paperList = all.filter(n => !isContext(n));
        return {
            items: paperList.slice(0, maxItems),
            contextItems,
            hiddenCount: Math.max(0, paperList.length - maxItems)
        };
    }

    function ongoingForPhase(phase) {
        return ongoingItems.filter(item => item && item.phase === phase.id);
    }

    function renderPaperCard(paper, color) {
        const spotlightClass = matchesActiveFilter(paper) ? ' is-spotlight' : ' is-dimmed';
        const span = Number(paper.size) || 1;
        const sizeClass = span > 1 ? ` is-span-${span}` : '';
        return `
            <button class="roadmap-paper-card${spotlightClass}${sizeClass}${paper.is_oral || Number(paper.importance || 1) >= 2 ? ' is-featured' : ''}${String(paper.venue_type || '').includes('preprint') ? ' is-preprint' : ''}" data-paper-id="${paper.id}" style="--paper-color:${color || '#7c3aed'}">
                <div class="roadmap-paper-card-main">
                    <span class="roadmap-paper-card-copy">
                        <span class="roadmap-paper-card-title">${paperKeyword(paper)}</span>
                        <span class="roadmap-paper-card-meta">
                            ${paper.is_lead_author ? '<span class="roadmap-paper-role" title="First / co-first author">✦</span>' : ''}
                            ${paperVenueMarkup(paper)}
                            ${paper.is_oral ? '<span class="roadmap-paper-oral">🏆 Oral</span>' : ''}
                        </span>
                    </span>
                </div>
            </button>
        `;
    }

    function escapeHtml(str) {
        if (str == null || str === '') return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderContextPaperItem(item, color, sectionKicker, registerContextTip, tooltipRoleLine, inheritedFilterTags) {
        const filterTags = (Array.isArray(item.tags) && item.tags.length)
            ? item.tags
            : (Array.isArray(inheritedFilterTags) ? inheritedFilterTags : []);
        const spotlightClass = matchesActiveFilter({ tags: filterTags }) ? ' is-spotlight' : ' is-dimmed';
        const hasHoverDetail = Boolean(item.meta || item.detail);
        const tipRole = (tooltipRoleLine || sectionKicker || '').trim();
        let tipAttr = '';
        if (hasHoverDetail && typeof registerContextTip === 'function') {
            const idx = registerContextTip({
                title: item.title || '',
                roleLine: tipRole,
                meta: item.meta || '',
                detail: item.detail || ''
            });
            tipAttr = ` data-context-tip="${idx}"`;
        }
        const metaBits = [];
        if (sectionKicker) {
            metaBits.push(`<span class="roadmap-context-subline">${escapeHtml(sectionKicker)}</span>`);
        }
        if (!hasHoverDetail) {
            if (item.meta) metaBits.push(`<span>${escapeHtml(item.meta)}</span>`);
            if (item.detail) metaBits.push(`<span>${escapeHtml(item.detail)}</span>`);
        }
        const metaHtml = metaBits.length
            ? `<span class="roadmap-paper-card-meta">${metaBits.join('')}</span>`
            : '';
        return `
            <div class="roadmap-paper-card roadmap-paper-card-static${spotlightClass}"${tipAttr} style="--paper-color:${color || '#7c3aed'}">
                <div class="roadmap-paper-card-main">
                    <span class="roadmap-paper-card-copy">
                        <span class="roadmap-paper-card-title">${escapeHtml(item.title || '')}</span>
                        ${metaHtml}
                    </span>
                </div>
            </div>
        `;
    }

    function renderContextNodesBlock(contextItems, color, registerContextTip) {
        if (!Array.isArray(contextItems) || !contextItems.length) return '';
        const inheritedFilterTags = [];
        const reg = typeof registerContextTip === 'function' ? registerContextTip : null;
        const itemsHtml = contextItems.map(node => {
            const ctx = node.context || {};
            const item = {
                title: node.short_label || node.title || '',
                tags: Array.isArray(node.tags) ? node.tags : [],
                meta: ctx.meta || '',
                detail: ctx.detail || ''
            };
            const kicker = ctx.kicker || '';
            const tooltipRole = (ctx.tooltip_role || '').trim();
            return renderContextPaperItem(item, color, kicker, reg, tooltipRole, inheritedFilterTags);
        }).join('');
        const gridSingleClass = contextItems.length === 1 ? ' is-full-width' : '';
        return `
            <div class="roadmap-context-cards">
                <div class="roadmap-context-cards-grid${gridSingleClass}">${itemsHtml}</div>
            </div>
        `;
    }

    function renderOngoingItem(item, color, extraClass = '') {
        return `
            <div class="roadmap-paper-card roadmap-ongoing-card${extraClass ? ` ${extraClass}` : ''}" style="--paper-color:${color || '#7c3aed'}">
                <div class="roadmap-paper-card-main">
                    <span class="roadmap-paper-card-copy">
                        <span class="roadmap-paper-card-title">${item.label || 'Ongoing Direction'}</span>
                        <span class="roadmap-paper-card-meta">
                            <span class="roadmap-ongoing-status">${item.status || 'Ongoing'}</span>
                        </span>
                    </span>
                </div>
            </div>
        `;
    }

    function renderGraph() {
        const filtersHtml = `
            <div class="roadmap-toolbar roadmap-toolbar-inline">
                <button class="roadmap-filter-btn${activeFilter === 'all' ? ' active' : ''}" data-filter="all">All Themes</button>
                ${filters.map(filter => `
                    <button class="roadmap-filter-btn${activeFilter === filter.id ? ' active' : ''}" data-filter="${filter.id}">${filter.name}</button>
                `).join('')}
            </div>
        `;
        const contextTips = [];
        function registerContextTip(payload) {
            return contextTips.push(payload) - 1;
        }
        const phaseHtml = phases.map(phase => {
            const phasePapers = papersForPhase(phase);
            const phaseOngoing = ongoingForPhase(phase);
            const color = phase.color || '#7c3aed';
            const groups = Array.isArray(phase.groups) ? phase.groups : [];
            let cardsHtml, ongoingHtml = '';

            if (groups.length) {
                const grouped = new Map();
                phasePapers.items.forEach(paper => {
                    if (paper.card_kind === 'context') return;
                    const gid = paper.group || groups[groups.length - 1].id;
                    if (!grouped.has(gid)) grouped.set(gid, []);
                    grouped.get(gid).push(paper);
                });

                const renderGroup = group => {
                    const items = (grouped.get(group.id) || [])
                        .sort((a, b) => (Number(b.size) || 1) - (Number(a.size) || 1));
                    const cols = group.gridColumns;
                    const gridStyle = cols ? ` style="grid-template-columns:${typeof cols === 'number' ? `repeat(${cols},1fr)` : cols}"` : '';
                    return `
                        <div class="roadmap-paper-group roadmap-paper-group-${group.id}" style="--paper-color:${color}">
                            <div class="roadmap-paper-group-label">
                                ${group.icon ? `<span class="roadmap-group-icon" aria-hidden="true">${group.icon}</span>` : ''}
                                <span>${group.label || group.id}</span>
                            </div>
                            <div class="roadmap-paper-group-grid"${gridStyle}>
                                ${items.map(paper => renderPaperCard(paper, color)).join('')}
                            </div>
                        </div>
                    `;
                };

                const topGroups = groups.filter(g => g.row === 'top');
                const bottomGroups = groups.filter(g => g.row !== 'top');

                const topParts = topGroups.map(g => renderGroup(g));
                if (phase.ongoingGroup && phaseOngoing.length) {
                    const og = phase.ongoingGroup;
                    topParts.push(`
                        <div class="roadmap-paper-group roadmap-paper-group-ongoing" style="--paper-color:${color}">
                            <div class="roadmap-paper-group-label">
                                ${og.icon ? `<span class="roadmap-group-icon" aria-hidden="true">${og.icon}</span>` : ''}
                                <span>${og.label || 'Ongoing'}</span>
                            </div>
                            <div class="roadmap-paper-group-grid" style="grid-template-columns:1fr">
                                ${phaseOngoing.map(item => renderOngoingItem(item, color, 'is-panel')).join('')}
                            </div>
                        </div>
                    `);
                }

                cardsHtml = [
                    topParts.length ? `<div class="roadmap-agentic-top-row">${topParts.join('')}</div>` : '',
                    ...bottomGroups.map(g => renderGroup(g))
                ].join('');
            } else {
                cardsHtml = phasePapers.items.map(paper => renderPaperCard(paper, color)).join('');
                ongoingHtml = phaseOngoing.map(item => renderOngoingItem(item, color)).join('');
            }

            const colStyle = phase.columns === 1 ? ' style="grid-template-columns:1fr"' : '';
            return `
                <section class="roadmap-phase-card phase-${phase.id}" style="--phase-color:${color}">
                    <div class="roadmap-phase-kicker">${phase.kicker || ''}</div>
                    <h3 class="roadmap-phase-title">
                        ${phase.icon ? `<span class="roadmap-phase-icon" aria-hidden="true">${phase.icon}</span>` : ''}
                        <span>${phase.title}</span>
                    </h3>
                    <p class="roadmap-phase-summary">${phase.summary || ''}</p>
                    <div class="roadmap-phase-papers"${colStyle}>${cardsHtml || '<p class="roadmap-phase-empty">No representative papers in this view.</p>'}</div>
                    ${renderContextNodesBlock(phasePapers.contextItems, color, registerContextTip)}
                    ${ongoingHtml ? `<div class="roadmap-phase-ongoing">${ongoingHtml}</div>` : ''}
                    ${phasePapers.hiddenCount ? `<div class="roadmap-phase-more">+${phasePapers.hiddenCount} more papers in this line</div>` : ''}
                </section>
            `;
        }).join('');

        const futureLoopHtml = visionLoop?.text ? `
                    <div class="roadmap-future-loop">
                        <div class="roadmap-future-loop-copy">
                            <span class="roadmap-future-loop-label">${visionLoop.label || 'Future Loop'}</span>
                            <span class="roadmap-future-loop-text">${visionLoop.text}</span>
                        </div>
                    </div>
                ` : '';

        graphEl.innerHTML = `
            <div class="roadmap-flow">
                <div class="roadmap-flow-header">
                    <div class="roadmap-flow-heading">
                        ${model.subtitle ? `<div class="roadmap-flow-title">${model.subtitle}</div>` : ''}
                        ${model.description ? `<div class="roadmap-flow-description">${model.description}</div>` : ''}
                    </div>
                    ${filtersHtml}
                </div>
                <div class="roadmap-phase-grid">${phaseHtml}</div>
                <div class="roadmap-flow-footer">
                    <p class="roadmap-lead-legend" role="note" aria-label="Legend: star indicates first or co-first author">
                        <span class="roadmap-lead-legend-mark" aria-hidden="true">✦</span>
                        <span>First / co-first author</span>
                    </p>
                    ${futureLoopHtml}
                </div>
            </div>
            <div class="roadmap-hover-tooltip" id="roadmap-hover-tooltip" hidden></div>
        `;

        const tooltip = graphEl.querySelector('#roadmap-hover-tooltip');
        let hideTooltipTimer = null;

        function cancelHideTooltip() {
            if (hideTooltipTimer) {
                window.clearTimeout(hideTooltipTimer);
                hideTooltipTimer = null;
            }
        }

        function scheduleHideTooltip() {
            if (!tooltip) return;
            cancelHideTooltip();
            hideTooltipTimer = window.setTimeout(() => {
                tooltip.hidden = true;
                hideTooltipTimer = null;
            }, 160);
        }

        function layoutRoadmapTooltip(target) {
            if (!tooltip) return;
            const graphRect = graphEl.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            tooltip.hidden = false;
            const tooltipRect = tooltip.getBoundingClientRect();
            let left = targetRect.left - graphRect.left + targetRect.width / 2 - tooltipRect.width / 2;
            let top = targetRect.top - graphRect.top - tooltipRect.height - 10;

            if (left < 8) left = 8;
            if (left + tooltipRect.width > graphRect.width - 8) left = graphRect.width - tooltipRect.width - 8;
            if (top < 8) top = targetRect.bottom - graphRect.top + 10;

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        }

        function showTooltip(target, paper) {
            if (!tooltip) return;
            cancelHideTooltip();
            const authors = Array.isArray(paper.authors) && paper.authors.length
                ? paper.authors.slice(0, 4).join(', ') + (paper.authors.length > 4 ? ', ...' : '')
                : '';
            const links = tooltipLinks(paper).map(link => (
                `<a href="${link.url}" target="_blank" rel="noopener">${link.name}</a>`
            )).join('');

            const venueYear = paperVenueYear(paper);
            tooltip.innerHTML = `
                <div class="roadmap-tooltip-title">${escapeHtml(paper.title)}</div>
                <div class="roadmap-tooltip-meta">${escapeHtml([authors, venueYear].filter(Boolean).join(' · '))}</div>
                ${links ? `<div class="roadmap-tooltip-links">${links}</div>` : ''}
            `;

            layoutRoadmapTooltip(target);
        }

        function showContextTooltip(target, tip) {
            if (!tooltip) return;
            cancelHideTooltip();
            const parts = [];
            if (tip.title) parts.push(`<div class="roadmap-tooltip-title">${escapeHtml(tip.title)}</div>`);
            if (tip.roleLine) parts.push(`<div class="roadmap-tooltip-meta">${escapeHtml(tip.roleLine)}</div>`);
            if (tip.meta) parts.push(`<div class="roadmap-tooltip-meta">${escapeHtml(tip.meta)}</div>`);
            if (tip.detail) parts.push(`<div class="roadmap-tooltip-meta">${escapeHtml(tip.detail)}</div>`);
            tooltip.innerHTML = parts.join('');
            layoutRoadmapTooltip(target);
        }

        function hideTooltip() {
            if (!tooltip) return;
            scheduleHideTooltip();
        }

        if (tooltip) {
            tooltip.addEventListener('mouseenter', cancelHideTooltip);
            tooltip.addEventListener('mouseleave', scheduleHideTooltip);
        }

        graphEl.querySelectorAll('[data-paper-id]').forEach(el => {
            el.addEventListener('mouseenter', function () {
                const paper = papers.find(item => item.id === this.getAttribute('data-paper-id'));
                if (paper) showTooltip(this, paper);
            });
            el.addEventListener('mouseleave', hideTooltip);
        });
        graphEl.querySelectorAll('[data-context-tip]').forEach(el => {
            const idx = Number(el.getAttribute('data-context-tip'));
            const tip = contextTips[idx];
            if (!tip) return;
            el.addEventListener('mouseenter', function () {
                showContextTooltip(this, tip);
            });
            el.addEventListener('mouseleave', hideTooltip);
        });
        graphEl.querySelectorAll('.roadmap-filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                activeFilter = this.getAttribute('data-filter') || 'all';
                renderGraph();
            });
        });
    }

    renderGraph();
});

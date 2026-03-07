/**
 * enhancements.js — Toast Notifications, Scroll Progress,
 * Navbar Glassmorphism, Skeleton Loaders, Quick-View Modal,
 * Page Transitions, Quantity Selector, Coupon Codes,
 * Order Tracking, Pagination, Live Chat
 * Include after animations.js on every page
 */

/* ═══════════════════════════════════════════════════════
   1. TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════ */
(function () {
    // Create toast container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const ICON_MAP = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error: '<i class="fa-solid fa-circle-xmark"></i>',
        info: '<i class="fa-solid fa-circle-info"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
        cart: '<i class="fa-solid fa-cart-plus"></i>'
    };

    const TITLE_MAP = {
        success: 'Success',
        error: 'Error',
        info: 'Info',
        warning: 'Warning',
        cart: 'Added to Cart'
    };

    /**
     * showToast({ type, title, message, duration })
     * type: 'success' | 'error' | 'info' | 'warning' | 'cart'
     * duration: ms (default 2000)
     */
    window.showToast = function ({ type = 'info', title, message = '', duration = 2000 } = {}) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const resolvedTitle = title || TITLE_MAP[type] || 'Notice';

        toast.innerHTML = `
            <div class="toast-icon">${ICON_MAP[type] || ICON_MAP.info}</div>
            <div class="toast-body">
                <div class="toast-title">${resolvedTitle}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Dismiss">×</button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        container.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

        // Auto-dismiss
        const timer = setTimeout(() => dismissToast(toast), duration);
        toast._timer = timer;

        // Limit to 4 visible toasts
        const toasts = container.querySelectorAll('.toast:not(.toast-exit)');
        if (toasts.length > 4) {
            dismissToast(toasts[0]);
        }

        return toast;
    };

    function dismissToast(toast) {
        if (toast._dismissed) return;
        toast._dismissed = true;
        clearTimeout(toast._timer);
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }
})();


/* ═══════════════════════════════════════════════════════
   2. NAVBAR (STATIC - NO SCROLL EFFECTS)
   ═══════════════════════════════════════════════════════ */
// Navbar scroll effects removed - navbar stays static


/* ═══════════════════════════════════════════════════════
   3. BACK-TO-TOP WITH SVG CIRCULAR PROGRESS
   ═══════════════════════════════════════════════════════ */
(function () {
    // Find or create the button
    let btn = document.getElementById('scrollTopBtn');

    // Remove old text content and rebuild with SVG
    if (btn) {
        btn.innerHTML = '';
    } else {
        btn = document.createElement('button');
        btn.id = 'scrollTopBtn';
        btn.title = 'Back to top';
        document.body.appendChild(btn);
    }

    // Build SVG ring
    btn.innerHTML = `
        <svg class="scroll-progress-ring" viewBox="0 0 52 52">
            <defs>
                <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#f97316" />
                    <stop offset="100%" stop-color="#ef4444" />
                </linearGradient>
            </defs>
            <circle class="scroll-progress-bg" cx="26" cy="26" r="23" />
            <circle class="scroll-progress-fill" cx="26" cy="26" r="23" />
        </svg>
        <span class="scroll-arrow">↑</span>
    `;

    const progressCircle = btn.querySelector('.scroll-progress-fill');
    const circumference = 2 * Math.PI * 23; // ~144.51
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;

    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

        // Update ring fill
        const offset = circumference - (scrollPercent * circumference);
        progressCircle.style.strokeDashoffset = offset;

        // Show/hide button
        btn.classList.toggle('visible', scrollTop > 320);
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();


/* ═══════════════════════════════════════════════════════
   4. SKELETON LOADING FOR BOOK CARDS (BUY PAGE)
   ═══════════════════════════════════════════════════════ */
window.BookSkeleton = {
    /**
     * Show skeleton cards in a container
     * @param {string} containerId - ID of the grid container
     * @param {number} count - Number of skeleton cards to show
     */
    show(containerId, count = 8) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card" data-skeleton>
                    <div class="skeleton-image"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line btn-placeholder"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    /**
     * Remove all skeleton cards from a container
     * @param {string} containerId
     */
    hide(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('[data-skeleton]').forEach(el => el.remove());
    }
};


/* ═══════════════════════════════════════════════════════
   5. BOOK QUICK-VIEW MODAL
   ═══════════════════════════════════════════════════════ */
(function () {
    // Create the overlay once
    const overlay = document.createElement('div');
    overlay.className = 'quickview-overlay';
    overlay.id = 'quickViewOverlay';
    overlay.innerHTML = `
        <div class="quickview-modal">
            <button class="quickview-close" aria-label="Close quick view">✕</button>
            <div class="quickview-image">
                <img id="qvImage" src="" alt="" />
            </div>
            <div class="quickview-details">
                <h2 class="quickview-title" id="qvTitle"></h2>
                <p class="quickview-author" id="qvAuthor"></p>
                <div class="quickview-price" id="qvPrice"></div>
                <div class="quickview-meta" id="qvMeta"></div>
                <div class="quickview-desc" id="qvDesc"></div>
                <div class="quickview-actions">
                    <button class="btn-add-cart" id="qvAddCart">
                        <i class="fa-solid fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn-wishlist-qv" id="qvWishlist" aria-label="Toggle wishlist">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('.quickview-close').addEventListener('click', closeQuickView);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeQuickView();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeQuickView();
    });

    function closeQuickView() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * openQuickView(bookData)
     * bookData: { id, title, author, price, original, image, condition, language, description }
     */
    window.openQuickView = function (book) {
        document.getElementById('qvImage').src = book.image || '';
        document.getElementById('qvImage').alt = book.title || 'Book cover';
        document.getElementById('qvTitle').textContent = book.title || 'Untitled';
        document.getElementById('qvAuthor').textContent = book.author ? `by ${book.author}` : '';

        // Price section
        const priceEl = document.getElementById('qvPrice');
        let priceHtml = `<span class="current">₹${book.price || 0}</span>`;
        if (book.original && book.original > book.price) {
            const discount = Math.round(((book.original - book.price) / book.original) * 100);
            priceHtml += `<span class="original">₹${book.original}</span>`;
            priceHtml += `<span class="discount-tag">${discount}% OFF</span>`;
        }
        priceEl.innerHTML = priceHtml;

        // Meta tags
        const metaEl = document.getElementById('qvMeta');
        let metaHtml = '';
        if (book.condition) metaHtml += `<span class="meta-tag">${book.condition}</span>`;
        if (book.language) metaHtml += `<span class="meta-tag">${book.language}</span>`;
        if (book.edition) metaHtml += `<span class="meta-tag">${book.edition}</span>`;
        metaEl.innerHTML = metaHtml;

        // Description
        document.getElementById('qvDesc').textContent = book.description || 'No description available.';

        // Wishlist button state
        const wishBtn = document.getElementById('qvWishlist');
        if (typeof window.isInWishlist === 'function' && window.isInWishlist(book.id || book.title)) {
            wishBtn.classList.add('wishlisted');
            wishBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        } else {
            wishBtn.classList.remove('wishlisted');
            wishBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        }

        // Wire "Add to Cart" button
        const addCartBtn = document.getElementById('qvAddCart');
        addCartBtn.onclick = function () {
            if (typeof window.addToCartFromQuickView === 'function') {
                window.addToCartFromQuickView(book);
            } else if (typeof window.addToCart === 'function') {
                window.addToCart(book);
            }
            showToast({
                type: 'cart',
                title: 'Added to Cart',
                message: `"${book.title}" has been added to your cart.`
            });
        };

        // Wire wishlist toggle
        wishBtn.onclick = function () {
            if (typeof window.toggleWishlist === 'function') {
                window.toggleWishlist(book);
                const isNowWished = typeof window.isInWishlist === 'function' && window.isInWishlist(book.id || book.title);
                if (isNowWished) {
                    wishBtn.classList.add('wishlisted');
                    wishBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                    showToast({ type: 'success', title: 'Wishlisted', message: `"${book.title}" added to your wishlist.` });
                } else {
                    wishBtn.classList.remove('wishlisted');
                    wishBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    showToast({ type: 'info', title: 'Removed', message: `"${book.title}" removed from wishlist.` });
                }
            }
        };

        // Show modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
})();


/* ═══════════════════════════════════════════════════════
   6. ANIMATED PAGE TRANSITIONS
   ═══════════════════════════════════════════════════════ */
(function () {
    // Add entrance animation
    document.body.classList.add('page-enter');
    
    // Intercept internal link clicks for exit animation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Skip external links, anchors, javascript:, mailto:, tel:
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            link.target === '_blank') {
            return;
        }
        
        // Skip if modifier keys are pressed
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        
        e.preventDefault();
        
        document.body.classList.remove('page-enter');
        document.body.classList.add('page-exit');
        
        setTimeout(() => {
            window.location.href = href;
        }, 280);
    });
})();


/* ═══════════════════════════════════════════════════════
   7. QUANTITY SELECTOR FOR CART
   ═══════════════════════════════════════════════════════ */
window.QuantitySelector = {
    /**
     * Create quantity selector HTML
     * @param {number} qty - Current quantity
     * @param {number|string} itemId - Item ID
     * @returns {string} HTML string
     */
    create(qty, itemId) {
        return `
            <div class="qty-selector" data-item-id="${itemId}">
                <button type="button" class="qty-minus" aria-label="Decrease quantity" ${qty <= 1 ? 'disabled' : ''}>−</button>
                <span class="qty-value">${qty}</span>
                <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
            </div>
        `;
    },

    /**
     * Initialize quantity selector events on a container
     * @param {HTMLElement} container - Container element
     * @param {Function} onUpdate - Callback (itemId, newQty) => void
     */
    init(container, onUpdate) {
        container.addEventListener('click', (e) => {
            const minusBtn = e.target.closest('.qty-minus');
            const plusBtn = e.target.closest('.qty-plus');
            
            if (!minusBtn && !plusBtn) return;
            
            const selector = e.target.closest('.qty-selector');
            if (!selector) return;
            
            const itemId = selector.dataset.itemId;
            const valueEl = selector.querySelector('.qty-value');
            let qty = parseInt(valueEl.textContent, 10);
            
            if (minusBtn && qty > 1) {
                qty--;
            } else if (plusBtn) {
                qty++;
            }
            
            valueEl.textContent = qty;
            selector.querySelector('.qty-minus').disabled = qty <= 1;
            
            if (typeof onUpdate === 'function') {
                onUpdate(itemId, qty);
            }
        });
    }
};


/* ═══════════════════════════════════════════════════════
   8. COUPON / DISCOUNT CODE SYSTEM
   ═══════════════════════════════════════════════════════ */
window.CouponSystem = {
    // Available coupons (can be fetched from API in production)
    coupons: {
        'SAVE10': { type: 'percent', value: 10, minOrder: 300, description: '10% off' },
        'SAVE20': { type: 'percent', value: 20, minOrder: 500, description: '20% off' },
        'FLAT50': { type: 'fixed', value: 50, minOrder: 200, description: '₹50 off' },
        'FLAT100': { type: 'fixed', value: 100, minOrder: 400, description: '₹100 off' },
        'FIRSTBUY': { type: 'percent', value: 15, minOrder: 0, description: '15% off for first order' },
        'BOOKWORM': { type: 'percent', value: 25, minOrder: 1000, description: '25% off on orders above ₹1000' }
    },
    
    appliedCoupon: null,
    
    /**
     * Validate and apply a coupon code
     * @param {string} code - Coupon code
     * @param {number} orderTotal - Current order total
     * @returns {Object} { valid, discount, message, coupon }
     */
    apply(code, orderTotal) {
        code = (code || '').toUpperCase().trim();
        
        if (!code) {
            return { valid: false, discount: 0, message: 'Please enter a coupon code' };
        }
        
        const coupon = this.coupons[code];
        
        if (!coupon) {
            return { valid: false, discount: 0, message: 'Invalid coupon code' };
        }
        
        if (orderTotal < coupon.minOrder) {
            return { 
                valid: false, 
                discount: 0, 
                message: `Minimum order of ₹${coupon.minOrder} required for this coupon` 
            };
        }
        
        let discount = 0;
        if (coupon.type === 'percent') {
            discount = Math.round(orderTotal * coupon.value / 100);
        } else {
            discount = coupon.value;
        }
        
        this.appliedCoupon = { code, ...coupon, discount };
        
        return { 
            valid: true, 
            discount, 
            message: `Coupon applied! You save ₹${discount}`,
            coupon: this.appliedCoupon
        };
    },
    
    /**
     * Remove applied coupon
     */
    remove() {
        this.appliedCoupon = null;
    },
    
    /**
     * Get currently applied coupon
     */
    getApplied() {
        return this.appliedCoupon;
    },
    
    /**
     * Create coupon input HTML
     */
    createHTML() {
        return `
            <div class="coupon-section" id="couponSection">
                <h4>🎁 Have a Coupon?</h4>
                <div class="coupon-input-wrap">
                    <input type="text" id="couponInput" placeholder="Enter code" maxlength="12">
                    <button type="button" id="applyCouponBtn">Apply</button>
                </div>
                <div id="couponStatus"></div>
            </div>
        `;
    },
    
    /**
     * Initialize coupon system on checkout page
     * @param {Function} onApply - Callback when coupon is applied/removed
     */
    init(onApply) {
        const couponSection = document.getElementById('couponSection');
        if (!couponSection) return;
        
        const input = document.getElementById('couponInput');
        const applyBtn = document.getElementById('applyCouponBtn');
        const statusEl = document.getElementById('couponStatus');
        
        const updateStatus = (result) => {
            if (result.valid) {
                statusEl.innerHTML = `
                    <div class="coupon-applied">
                        <i class="fa-solid fa-check-circle"></i>
                        ${result.message} (${result.coupon.description})
                        <button class="remove-coupon" aria-label="Remove coupon">×</button>
                    </div>
                `;
                input.disabled = true;
                applyBtn.disabled = true;
                
                statusEl.querySelector('.remove-coupon').onclick = () => {
                    this.remove();
                    statusEl.innerHTML = '';
                    input.disabled = false;
                    input.value = '';
                    applyBtn.disabled = false;
                    if (typeof onApply === 'function') onApply(null);
                };
            } else {
                showToast({ type: 'error', title: 'Invalid Code', message: result.message });
            }
            
            if (typeof onApply === 'function' && result.valid) {
                onApply(result);
            }
        };
        
        applyBtn.onclick = () => {
            const total = window.checkoutTotal || 0;
            const result = this.apply(input.value, total);
            updateStatus(result);
        };
        
        input.onkeypress = (e) => {
            if (e.key === 'Enter') applyBtn.click();
        };
        
        // Initialize available coupons display
        this.renderAvailableCoupons(input);
    },
    
    /**
     * Render the list of available coupons
     */
    renderAvailableCoupons(inputEl) {
        const toggleBtn = document.getElementById('toggleCouponsBtn');
        const couponsList = document.getElementById('couponsList');
        
        if (!toggleBtn || !couponsList) return;
        
        // Build coupons HTML
        const couponsHTML = Object.entries(this.coupons).map(([code, coupon]) => {
            const minText = coupon.minOrder > 0 ? `Min. order ₹${coupon.minOrder}` : 'No minimum order';
            const valueText = coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`;
            
            return `
                <div class="coupon-card" data-code="${code}">
                    <div class="coupon-left">
                        <span class="coupon-value">${valueText}</span>
                        <span class="coupon-desc">${coupon.description}</span>
                    </div>
                    <div class="coupon-right">
                        <span class="coupon-code">${code}</span>
                        <span class="coupon-min">${minText}</span>
                        <button type="button" class="use-coupon-btn" data-code="${code}">Use</button>
                    </div>
                </div>
            `;
        }).join('');
        
        couponsList.innerHTML = couponsHTML;
        
        // Toggle visibility
        toggleBtn.onclick = () => {
            couponsList.classList.toggle('hidden');
            toggleBtn.querySelector('.toggle-icon').classList.toggle('rotated');
        };
        
        // Click to use coupon
        couponsList.addEventListener('click', (e) => {
            const useBtn = e.target.closest('.use-coupon-btn');
            if (useBtn) {
                const code = useBtn.dataset.code;
                if (inputEl) {
                    inputEl.value = code;
                    inputEl.focus();
                    // Auto-apply
                    document.getElementById('applyCouponBtn')?.click();
                    // Collapse the list
                    couponsList.classList.add('hidden');
                    toggleBtn.querySelector('.toggle-icon').classList.remove('rotated');
                }
            }
        });
    }
};


/* ═══════════════════════════════════════════════════════
   9. ORDER TRACKING TIMELINE
   ═══════════════════════════════════════════════════════ */
window.OrderTracking = {
    statuses: ['pending', 'confirmed', 'shipped', 'delivered'],
    statusLabels: {
        pending: 'Order Placed',
        confirmed: 'Confirmed',
        shipped: 'Shipped',
        delivered: 'Delivered'
    },
    statusIcons: {
        pending: '<i class="fa-solid fa-receipt"></i>',
        confirmed: '<i class="fa-solid fa-check"></i>',
        shipped: '<i class="fa-solid fa-truck"></i>',
        delivered: '<i class="fa-solid fa-box-open"></i>'
    },
    
    /**
     * Create tracking timeline HTML
     * @param {string} currentStatus - Current order status
     * @returns {string} HTML string
     */
    create(currentStatus) {
        const currentIdx = this.statuses.indexOf(currentStatus.toLowerCase());
        const progressWidth = currentIdx >= 0 ? (currentIdx / (this.statuses.length - 1)) * 100 : 0;
        
        const stepsHTML = this.statuses.map((status, idx) => {
            let stepClass = '';
            if (idx < currentIdx) stepClass = 'completed';
            else if (idx === currentIdx) stepClass = 'current';
            
            return `
                <div class="tracking-step ${stepClass}">
                    <div class="step-icon">${this.statusIcons[status]}</div>
                    <span class="step-label">${this.statusLabels[status]}</span>
                </div>
            `;
        }).join('');
        
        return `
            <div class="order-tracking">
                <h4>📦 Order Status</h4>
                <div class="tracking-timeline">
                    <div class="progress-fill" style="width: ${progressWidth}%"></div>
                    ${stepsHTML}
                </div>
            </div>
        `;
    }
};


/* ═══════════════════════════════════════════════════════
   10. PAGINATION SYSTEM
   ═══════════════════════════════════════════════════════ */
window.Pagination = {
    /**
     * Create pagination HTML
     * @param {number} currentPage - Current page (1-indexed)
     * @param {number} totalPages - Total number of pages
     * @param {number} totalItems - Total number of items
     * @returns {string} HTML string
     */
    create(currentPage, totalPages, totalItems) {
        if (totalPages <= 1) return '';
        
        let pagesHTML = '';
        
        // Previous button
        pagesHTML += `
            <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>
        `;
        
        // Page numbers with ellipsis logic
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            pagesHTML += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                pagesHTML += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="pagination-info">...</span>`;
            }
            pagesHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        pagesHTML += `
            <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
        
        return `
            <div class="pagination-container" data-current="${currentPage}" data-total="${totalPages}">
                ${pagesHTML}
            </div>
        `;
    },
    
    /**
     * Initialize pagination events
     * @param {HTMLElement|string} container - Container element or selector
     * @param {Function} onPageChange - Callback (pageNumber) => void
     */
    init(container, onPageChange) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) return;
        
        el.addEventListener('click', (e) => {
            const btn = e.target.closest('.pagination-btn');
            if (!btn || btn.disabled || btn.classList.contains('active')) return;
            
            const page = parseInt(btn.dataset.page, 10);
            if (typeof onPageChange === 'function') {
                onPageChange(page);
            }
        });
    }
};


/* ═══════════════════════════════════════════════════════
   11. LIVE CHAT WIDGET
   ═══════════════════════════════════════════════════════ */
(function () {
    // Create chat widget
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
        <button class="chat-toggle" aria-label="Open chat">
            <i class="fa-solid fa-comments"></i>
        </button>
        <div class="chat-panel">
            <div class="chat-header">
                <div class="chat-header-avatar"><i class="fa-solid fa-headset"></i></div>
                <div class="chat-header-info">
                    <h4>BookSwap Support</h4>
                    <span><span class="chat-online-dot"></span> Online now</span>
                </div>
                <button class="chat-header-close" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="chat-quick-actions">
                <button class="chat-quick-btn" data-msg="Track my order">Track Order</button>
                <button class="chat-quick-btn" data-msg="I need help with returns">Returns Help</button>
                <button class="chat-quick-btn" data-msg="Payment issues">Payment Help</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="chat-message bot">
                    Hi there! Welcome to BookSwap Hub. How can I help you today?
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Type your message..." maxlength="500">
                <button id="chatSendBtn" aria-label="Send message">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(widget);
    
    const toggle = widget.querySelector('.chat-toggle');
    const panel = widget.querySelector('.chat-panel');
    const closeBtn = widget.querySelector('.chat-header-close');
    const messagesEl = document.getElementById('chatMessages');
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    
    // Bot responses
    const botResponses = {
        'track': 'To track your order, please go to your Profile → Orders section. You can see the status of all your orders there.',
        'order': 'You can view your orders by clicking on the user icon and selecting "My Orders". Each order shows a tracking timeline!',
        'return': 'For returns, please contact us within 7 days of delivery. Go to Orders → Select Order → Request Return.',
        'refund': 'Refunds are processed within 5-7 business days after we receive the returned item. Contact support if delayed.',
        'payment': 'We accept COD, UPI, and Credit/Debit cards. If you faced a payment issue, please check your bank statement and contact us.',
        'sell': 'Want to sell books? Click on "Sell Book" in the navigation. Fill out the form with book details and we\'ll list it for you!',
        'buy': 'Browse our collection on the "Buy Book" page. Use filters to find exactly what you need!',
        'discount': 'Try these coupon codes: SAVE10 (10% off), SAVE20 (20% off), FLAT50 (₹50 off), FLAT100 (₹100 off), FIRSTBUY (15% for first order), BOOKWORM (25% on ₹1000+)!',
        'coupon': 'Try these coupon codes: SAVE10 (10% off), SAVE20 (20% off), FLAT50 (₹50 off), FLAT100 (₹100 off), FIRSTBUY (15% for first order), BOOKWORM (25% on ₹1000+)!',
        'code': 'Try these coupon codes: SAVE10 (10% off), SAVE20 (20% off), FLAT50 (₹50 off), FLAT100 (₹100 off), FIRSTBUY (15% for first order), BOOKWORM (25% on ₹1000+)!',
        'hello': 'Hello! Nice to meet you. How can I assist you with your book shopping today?',
        'hi': 'Hi there! What can I help you with?',
        'hey': 'Hey! Welcome to BookSwap Hub. What can I help you with today?',
        'thanks': 'You\'re welcome! Feel free to ask if you need anything else. Happy reading! 📚',
        'thank': 'You\'re welcome! Feel free to ask if you need anything else. Happy reading! 📚',
        'help': 'I can help you with: tracking orders, returns, payments, buying/selling books, coupon codes, delivery info, and account questions. Just ask!',
        'delivery': 'Free delivery on orders above ₹999! Otherwise, delivery charges are ₹49 (under ₹499) or ₹29 (₹499-₹999). Delivery takes 3-7 business days.',
        'shipping': 'Free shipping on orders above ₹999! Standard delivery takes 3-7 business days depending on your location.',
        'price': 'Book prices vary based on condition and rarity. You can sort by price on the Buy page to find books in your budget!',
        'account': 'To manage your account, click on the profile icon and select "Profile Settings". You can update your info, change password, and more.',
        'password': 'To change your password, go to Profile Settings → Security section. Enter your current password and set a new one.',
        'login': 'Having trouble logging in? Try resetting your password using the "Forgot Password" link on the login page.',
        'register': 'To create an account, click "Login/Register" and fill out the registration form. It only takes a minute!',
        'contact': 'You can reach us at bookswaphub@gmail.com or use the Contact page. We typically respond within 24 hours.',
        'email': 'Reach us at bookswaphub@gmail.com for any queries. We respond within 24 hours!',
        'cart': 'Your cart items are saved! Go to the cart icon in the navbar to view, update quantities, or checkout.',
        'wishlist': 'Click the heart icon on any book to add it to your wishlist. Access your wishlist from the navbar.',
        'quiz': 'Try our Book Matchmaker quiz to discover books tailored to your preferences! Find it in the navigation.',
        'recommend': 'Try our Book Matchmaker quiz for personalized book recommendations based on your reading preferences!',
        'cancel': 'To cancel an order, go to My Orders and click "Cancel Order" if it hasn\'t shipped yet. Already shipped orders cannot be cancelled.',
        'status': 'Check your order status in Profile → My Orders. You\'ll see: Pending, Processing, Shipped, or Delivered.',
        'time': 'Typical delivery time is 3-7 business days. You can track your order in the Orders section.',
        'book': 'Looking for a specific book? Use the search bar on the Buy page, or filter by genre, author, or condition.',
        'genre': 'We have fiction, non-fiction, academic, romance, thriller, sci-fi, biography, and more! Use filters on the Buy page.',
        'condition': 'Books come in various conditions: New, Like New, Good, Acceptable. Descriptions include details about any wear.',
        'good': 'Glad I could help! Is there anything else you\'d like to know?',
        'great': 'Awesome! Let me know if you need anything else!',
        'bye': 'Goodbye! Happy reading and come back soon! 📖',
        'ok': 'Great! Let me know if you have any other questions.',
        'okay': 'Perfect! Feel free to ask if you need more help.'
    };
    
    function addMessage(text, isUser = false) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        msg.textContent = text;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    function showTyping() {
        const typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.id = 'chatTyping';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messagesEl.appendChild(typing);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    
    function hideTyping() {
        const typing = document.getElementById('chatTyping');
        if (typing) typing.remove();
    }
    
    function getBotResponse(userMsg) {
        const lower = userMsg.toLowerCase();
        
        for (const [key, response] of Object.entries(botResponses)) {
            if (lower.includes(key)) {
                return response;
            }
        }
        
        return "Thanks for your message! For specific queries, please email us at bookswaphub@gmail.com or check our FAQ section. Is there anything else I can help with?";
    }
    
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        
        addMessage(text, true);
        input.value = '';
        
        showTyping();
        
        setTimeout(() => {
            hideTyping();
            addMessage(getBotResponse(text));
        }, 800 + Math.random() * 700);
    }
    
    toggle.onclick = () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            input.focus();
        }
    };
    
    closeBtn.onclick = () => panel.classList.remove('open');
    
    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
    
    // Quick action buttons
    widget.querySelectorAll('.chat-quick-btn').forEach(btn => {
        btn.onclick = () => {
            const msg = btn.dataset.msg;
            input.value = msg;
            sendMessage();
        };
    });
})();

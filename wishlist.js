/**
 * wishlist.js — Shared wishlist functionality using localStorage
 * Include on every page that shows book cards or the navbar wishlist icon.
 */
(function () {
    const STORAGE_KEY = 'wishlist';
    const BOOKS_STORAGE_KEY = 'wishlist_books'; // Store book details

    /* ── Helpers ─────────────────────────────────────────── */

    /** Get current wishlist array of book IDs from localStorage */
    const getWishlist = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (_e) {
            return [];
        }
    };

    /** Get stored book details */
    const getWishlistBooks = () => {
        try {
            return JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY) || '{}');
        } catch (_e) {
            return {};
        }
    };

    /** Save wishlist array to localStorage */
    const saveWishlist = (list) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    };

    /** Save book details to localStorage */
    const saveWishlistBooks = (books) => {
        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
    };

    /** Check if a book ID is in the wishlist */
    const isInWishlist = (bookId) => getWishlist().includes(Number(bookId));

    /** Add a book to the wishlist (with details) */
    const addToWishlist = (bookId, bookData = null) => {
        const list = getWishlist();
        const id = Number(bookId);
        if (!list.includes(id)) {
            list.push(id);
            saveWishlist(list);
            
            // Store book details if provided
            if (bookData) {
                const books = getWishlistBooks();
                const currentPrice = Number(bookData.price) || 0;
                books[id] = {
                    id: id,
                    title: bookData.title || 'Untitled',
                    author: bookData.author || 'Unknown',
                    price: currentPrice,
                    priceWhenAdded: currentPrice, // Store price at time of adding
                    original: bookData.original || bookData.price || 0,
                    image: bookData.image || '',
                    addedAt: Date.now()
                };
                saveWishlistBooks(books);
            }
        }
    };

    /** Remove a book ID from the wishlist */
    const removeFromWishlist = (bookId) => {
        const list = getWishlist().filter(id => id !== Number(bookId));
        saveWishlist(list);
        
        // Also remove from books storage
        const books = getWishlistBooks();
        delete books[Number(bookId)];
        saveWishlistBooks(books);
    };

    /** Toggle a book's wishlist state and return new state */
    const toggleWishlist = (bookId, bookData = null) => {
        const id = Number(bookId);
        if (isInWishlist(id)) {
            removeFromWishlist(id);
            return false;
        } else {
            addToWishlist(id, bookData);
            return true;
        }
    };

    /** Clear entire wishlist */
    const clearWishlist = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BOOKS_STORAGE_KEY);
    };

    /** Check for price drops and update stored prices */
    const checkPriceDrops = async () => {
        const books = getWishlistBooks();
        const ids = Object.keys(books);
        if (ids.length === 0) return [];
        
        const drops = [];
        
        try {
            // Fetch current prices from API
            const res = await fetch('/api/books');
            if (!res.ok) return drops;
            const allBooks = await res.json();
            
            ids.forEach(id => {
                const stored = books[id];
                const current = allBooks.find(b => b.id === Number(id));
                
                if (current && stored.priceWhenAdded) {
                    const currentPrice = Number(current.price) || 0;
                    const addedPrice = Number(stored.priceWhenAdded) || 0;
                    
                    if (currentPrice < addedPrice) {
                        const savings = addedPrice - currentPrice;
                        drops.push({
                            id: Number(id),
                            title: stored.title,
                            oldPrice: addedPrice,
                            newPrice: currentPrice,
                            savings: savings,
                            percentOff: Math.round((savings / addedPrice) * 100)
                        });
                        // Update stored price
                        books[id].price = currentPrice;
                    }
                }
            });
            
            saveWishlistBooks(books);
        } catch (e) {
            console.log('Price check skipped:', e);
        }
        
        return drops;
    };

    /** Get price drop count */
    const getPriceDropCount = () => {
        const books = getWishlistBooks();
        let count = 0;
        Object.values(books).forEach(book => {
            if (book.priceWhenAdded && book.price < book.priceWhenAdded) {
                count++;
            }
        });
        return count;
    };

    /* ── Badge Count Update ──────────────────────────────── */

    /** Update wishlist count badge(s) in the navbar */
    const updateWishlistCount = () => {
        const count = getWishlist().length;
        document.querySelectorAll('.wishlist-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    };

    /* ═══════════════════════════════════════════════════════
       WISHLIST SIDEBAR PANEL
       ═══════════════════════════════════════════════════════ */

    // Create wishlist sidebar HTML
    const createWishlistSidebar = () => {
        if (document.getElementById('wishlistModal')) return;

        const modal = document.createElement('div');
        modal.id = 'wishlistModal';
        modal.className = 'wishlist-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Wishlist');
        modal.innerHTML = `
            <div class="wishlist-overlay"></div>
            <div class="wishlist-panel">
                <header class="wishlist-header">
                    <h3><i class="fa-solid fa-heart"></i> My Wishlist</h3>
                    <button class="close-wishlist" aria-label="Close wishlist">✕</button>
                </header>
                <div class="wishlist-items" id="wishlistItems">
                    <!-- Items rendered here -->
                </div>
                <footer class="wishlist-footer">
                    <button class="clear-wishlist" id="clearWishlistBtn">Clear Wishlist</button>
                </footer>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-wishlist').addEventListener('click', closeWishlistSidebar);
        modal.querySelector('.wishlist-overlay').addEventListener('click', closeWishlistSidebar);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeWishlistSidebar(); });
        modal.querySelector('#clearWishlistBtn').addEventListener('click', () => {
            clearWishlist();
            renderWishlistItems();
            updateWishlistCount();
            syncHearts();
            if (typeof showToast === 'function') {
                showToast({ type: 'info', title: 'Wishlist Cleared', message: 'All items removed from your wishlist.' });
            }
        });

        // Handle item actions (delegated)
        modal.querySelector('#wishlistItems').addEventListener('click', async (e) => {
            const addBtn = e.target.closest('.add-to-cart-btn');
            const removeBtn = e.target.closest('.remove-wishlist-btn');
            
            if (addBtn) {
                const bookId = Number(addBtn.dataset.bookId);
                const books = getWishlistBooks();
                const book = books[bookId];
                
                if (book && typeof window.addToCartFromQuickView === 'function') {
                    await window.addToCartFromQuickView(book);
                } else if (book) {
                    // Fallback: try adding via cart API
                    try {
                        await fetch('/api/cart', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                bookId: book.id,
                                quantity: 1,
                                title: book.title,
                                price: book.price,
                                original: book.original || book.price,
                                image: book.image || ''
                            })
                        });
                        // Update cart count
                        const cartCount = document.getElementById('cartCount');
                        if (cartCount) {
                            cartCount.textContent = Number(cartCount.textContent || 0) + 1;
                        }
                    } catch (_e) {
                        // Store in localStorage as fallback
                        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        const existing = cart.find(x => x.id === book.id);
                        if (existing) {
                            existing.qty = (existing.qty || 1) + 1;
                        } else {
                            cart.push({ ...book, qty: 1 });
                        }
                        localStorage.setItem('cart', JSON.stringify(cart));
                    }
                    if (typeof showToast === 'function') {
                        showToast({ type: 'cart', title: 'Added to Cart', message: `"${book.title}" added to your cart.` });
                    }
                }
            }
            
            if (removeBtn) {
                const bookId = Number(removeBtn.dataset.bookId);
                const books = getWishlistBooks();
                const book = books[bookId];
                removeFromWishlist(bookId);
                renderWishlistItems();
                updateWishlistCount();
                syncHearts();
                if (typeof showToast === 'function' && book) {
                    showToast({ type: 'info', title: 'Removed', message: `"${book.title}" removed from wishlist.` });
                }
            }
        });
    };

    /** Render wishlist items in the sidebar */
    const renderWishlistItems = () => {
        const container = document.getElementById('wishlistItems');
        if (!container) return;

        const wishlistIds = getWishlist();
        const books = getWishlistBooks();

        if (wishlistIds.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <i class="fa-regular fa-heart"></i>
                    <p>Your wishlist is empty</p>
                    <p style="font-size: 13px; margin-top: 8px;">Browse books and click the heart icon to add them here!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = wishlistIds.map(id => {
            const book = books[id] || { id, title: `Book #${id}`, author: 'Unknown', price: 0, image: '' };
            const hasPriceDrop = book.priceWhenAdded && book.price < book.priceWhenAdded;
            const savings = hasPriceDrop ? (book.priceWhenAdded - book.price) : 0;
            
            return `
                <div class="wishlist-row${hasPriceDrop ? ' price-dropped' : ''}" data-id="${id}">
                    ${hasPriceDrop ? '<span class="price-drop-badge"><i class="fa-solid fa-arrow-trend-down"></i> Price Drop!</span>' : ''}
                    <div class="wi-left">
                        <img src="${book.image || 'https://via.placeholder.com/70x95?text=No+Cover'}" alt="${book.title}">
                    </div>
                    <div class="wi-body">
                        <div class="wi-title">${book.title}</div>
                        <div class="wi-author">by ${book.author}</div>
                        <div class="wi-price">
                            ${hasPriceDrop ? 
                                `<span class="old-price">₹${book.priceWhenAdded.toLocaleString('en-IN')}</span> ₹${(book.price || 0).toLocaleString('en-IN')} <span class="savings">Save ₹${savings.toLocaleString('en-IN')}</span>` :
                                `₹${(book.price || 0).toLocaleString('en-IN')}`
                            }
                        </div>
                    </div>
                    <div class="wi-actions">
                        <button class="add-to-cart-btn" data-book-id="${id}">
                            <i class="fa-solid fa-cart-plus"></i> Add
                        </button>
                        <button class="remove-wishlist-btn" data-book-id="${id}">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    /** Open the wishlist sidebar */
    const openWishlistSidebar = () => {
        createWishlistSidebar();
        const modal = document.getElementById('wishlistModal');
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            renderWishlistItems();
        }
    };

    /** Close the wishlist sidebar */
    const closeWishlistSidebar = () => {
        const modal = document.getElementById('wishlistModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    /* ── Heart Toggle on Book Cards ──────────────────────── */

    /**
     * Sync all wishlist heart buttons on the page with current state.
     * Call after rendering book cards.
     */
    const syncHearts = () => {
        document.querySelectorAll('.wishlist-heart').forEach(btn => {
            const id = Number(btn.dataset.bookId);
            if (isInWishlist(id)) {
                btn.classList.add('wishlisted');
                btn.querySelector('i').className = 'fa-solid fa-heart';
            } else {
                btn.classList.remove('wishlisted');
                btn.querySelector('i').className = 'fa-regular fa-heart';
            }
        });
    };

    /** Delegate click handler for wishlist hearts */
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.wishlist-heart');
        if (!heartBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const bookId = heartBtn.dataset.bookId;
        
        // Try to get book data from the card
        const card = heartBtn.closest('.book-card');
        let bookData = null;
        if (card) {
            const title = card.querySelector('h4, h3')?.textContent || '';
            const author = card.querySelector('.author, p.author')?.textContent?.replace(/^By\s*/i, '') || '';
            const priceText = card.querySelector('.price')?.textContent || '0';
            const priceMatch = priceText.match(/₹([\d,]+)/);
            const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 0;
            const img = card.querySelector('img')?.src || '';
            bookData = { id: bookId, title, author, price, image: img };
        }

        const added = toggleWishlist(bookId, bookData);

        // Update this button immediately
        const icon = heartBtn.querySelector('i');
        if (added) {
            heartBtn.classList.add('wishlisted');
            icon.className = 'fa-solid fa-heart';
            // Pulse animation
            heartBtn.classList.remove('wishlist-pulse');
            void heartBtn.offsetWidth; // trigger reflow
            heartBtn.classList.add('wishlist-pulse');
            
            if (typeof showToast === 'function' && bookData?.title) {
                showToast({ type: 'success', title: 'Added to Wishlist', message: `"${bookData.title}" saved to your wishlist.` });
            }
        } else {
            heartBtn.classList.remove('wishlisted');
            icon.className = 'fa-regular fa-heart';
        }

        updateWishlistCount();
    });

    /* ── Wishlist Button Click Handler ───────────────────── */
    document.addEventListener('click', (e) => {
        const wishlistBtn = e.target.closest('.wishlist-icon-btn');
        if (!wishlistBtn) return;

        e.preventDefault();
        openWishlistSidebar();
    });

    /* ── Init ────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        updateWishlistCount();
        syncHearts();
    });

    /* ── Expose globally ─────────────────────────────────── */
    window.wishlistAPI = {
        getWishlist,
        getWishlistBooks,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        updateWishlistCount,
        syncHearts,
        openWishlistSidebar,
        closeWishlistSidebar,
        checkPriceDrops,
        getPriceDropCount
    };
})();

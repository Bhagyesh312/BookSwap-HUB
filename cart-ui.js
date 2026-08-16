/**
 * cart-ui.js
 * Standalone cart UI logic for pages without the full buy script.
 * Handles cart persistence, rendering, and sidebar panel operations.
 * 
 * Cart sidebar now uses CSS transitions (.open class) instead of display toggle.
 */
(function () {
  const API_BASE = '';

  // --- Utility Helpers ---
  const el = id => document.getElementById(id);

  const normalizeCartItems = items => (items || []).map(item => ({
    id: Number(item.id ?? item.bookId),
    qty: Number(item.qty ?? item.quantity ?? 1),
    title: item.title || 'Untitled',
    price: Number(item.price || 0),
    original: Number(item.original ?? item.price ?? 0),
    image: item.image || ''
  }));

  /**
   * Get JWT authentication header if user is logged in
   */
  const getAuthHeader = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const getCartFromApi = async () => {
    const headers = { ...getAuthHeader() };
    const res = await fetch(`${API_BASE}/api/cart`, { headers });
    if (!res.ok) throw new Error('Failed to fetch cart');
    const data = await res.json();
    return normalizeCartItems(data.items);
  };

  const getCartFromStorage = () => {
    try {
      return normalizeCartItems(JSON.parse(localStorage.getItem('cart') || '[]'));
    } catch (e) {
      console.error('Cart retrieval failed:', e);
      return [];
    }
  };

  const getCart = async () => {
    try {
      return await getCartFromApi();
    } catch (_e) {
      return getCartFromStorage();
    }
  };

  /**
   * Updates the cart bubble count displayed in the navbar
   */
  const updateCount = async () => {
    const c = await getCart();
    const count = c.reduce((s, i) => s + i.qty, 0);
    const cc = el('cartCount');
    if (cc) cc.textContent = count;
  };

  /**
   * Formats numbers to Indian currency format (e.g. 1,00,000)
   */
  const formatIN = n => (Number(n) || 0).toLocaleString('en-IN');

  // --- Core UI Functions ---

  /**
   * Calculate delivery charges based on subtotal
   */
  const getDeliveryCharge = (subtotal) => {
    if (subtotal >= 999) return 0; // Free delivery above ₹999
    if (subtotal >= 499) return 29;
    return 49;
  };

  /**
   * Renders items into the cart sidebar panel and calculates totals
   */
  const renderCart = async () => {
    const cart = await getCart();
    const itemsEl = el('cartItems');
    const chargesEl = el('cartCharges');
    const totalEl = el('cartTotal');
    const savedEl = el('cartSavedAmount');

    if (!itemsEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = `
        <div class="empty-cart">
          <i class="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty</p>
          <span>Add some books to get started!</span>
        </div>`;
      if (chargesEl) chargesEl.innerHTML = '';
      if (totalEl) totalEl.textContent = '0';
      if (savedEl) savedEl.parentElement.style.display = 'none';
      return;
    }

    let subtotal = 0;
    let origTotal = 0;
    const itemCount = cart.reduce((s, i) => s + i.qty, 0);

    itemsEl.innerHTML = cart.map(item => {
      const linePrice = item.price * item.qty;
      const lineOrig = (item.original || item.price) * item.qty;
      subtotal += linePrice;
      origTotal += lineOrig;
      const hasDiscount = lineOrig > linePrice;

      return `
        <div class="cart-row" data-id="${item.id}">
          <div class="ci-image">
            <img src="${item.image || 'https://via.placeholder.com/80x100?text=No+Cover'}" alt="${item.title}" loading="lazy">
          </div>
          <div class="ci-details">
            <div class="ci-title">${item.title}</div>
            <div class="ci-controls">
              <div class="qty-selector" data-item-id="${item.id}">
                <button class="qty-btn qty-minus" ${item.qty <= 1 ? 'disabled' : ''} aria-label="Decrease quantity">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn qty-plus" aria-label="Increase quantity">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
              <button class="remove-btn" data-id="${item.id}" aria-label="Remove item">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="ci-pricing">
            <span class="ci-current-price">₹${formatIN(linePrice)}</span>
            ${hasDiscount ? `<span class="ci-original-price">₹${formatIN(lineOrig)}</span>` : ''}
          </div>
        </div>`;
    }).join('');

    // Calculate charges
    const delivery = getDeliveryCharge(subtotal);
    const gstRate = 0; // No GST on books in India
    const gst = Math.round(subtotal * gstRate);
    const platformFee = 0; // Could add platform fee
    const discount = Math.max(0, origTotal - subtotal);
    const grandTotal = subtotal + delivery + gst + platformFee;

    // Render charges breakdown
    if (chargesEl) {
      chargesEl.innerHTML = `
        <div class="charges-section">
          <div class="charge-row">
            <span>Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span>
            <span>₹${formatIN(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div class="charge-row discount">
            <span><i class="fa-solid fa-tag"></i> Discount</span>
            <span>-₹${formatIN(discount)}</span>
          </div>` : ''}
          <div class="charge-row ${delivery === 0 ? 'free' : ''}">
            <span><i class="fa-solid fa-truck"></i> Delivery</span>
            <span>${delivery === 0 ? '<span class="free-badge">FREE</span>' : '₹' + formatIN(delivery)}</span>
          </div>
          ${delivery > 0 && subtotal < 999 ? `
          <div class="free-delivery-hint">
            <i class="fa-solid fa-info-circle"></i> Add ₹${formatIN(999 - subtotal)} more for FREE delivery!
          </div>` : ''}
        </div>
      `;
    }

    if (totalEl) totalEl.textContent = formatIN(grandTotal);
    if (savedEl) {
      savedEl.textContent = formatIN(discount + (delivery === 0 ? 49 : 0));
      savedEl.parentElement.style.display = discount > 0 || delivery === 0 ? 'flex' : 'none';
    }
  };

  /**
   * Opens the cart sidebar with slide-in animation
   */
  const openCart = async () => {
    const modal = el('cartModal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden'; // prevent scroll
      await renderCart();
    }
  };

  /**
   * Closes the cart sidebar with slide-out animation
   */
  const closeCart = () => {
    const modal = el('cartModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = ''; // restore scroll
    }
  };

  /**
   * Removes a specific item from the cart
   * @param {number|string} id - Book ID
   */
  const removeFromCart = async id => {
    try {
      const headers = { ...getAuthHeader() };
      const res = await fetch(`${API_BASE}/api/cart/${Number(id)}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('API remove failed');
    } catch (_e) {
      const c = getCartFromStorage().filter(x => x.id !== Number(id));
      localStorage.setItem('cart', JSON.stringify(c));
    }
    await updateCount();
    await renderCart();
  };

  /**
   * Clears all items from the cart
   */
  const clearCart = async () => {
    try {
      const headers = { ...getAuthHeader() };
      const res = await fetch(`${API_BASE}/api/cart`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('API clear failed');
    } catch (_e) {
      localStorage.removeItem('cart');
    }
    await updateCount();
    await renderCart();
  };

  /**
   * Updates quantity for a cart item
   * @param {number|string} id - Book ID
   * @param {number} newQty - New quantity
   */
  const updateQuantity = async (id, newQty) => {
    try {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeader() };
      const res = await fetch(`${API_BASE}/api/cart/${Number(id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ qty: newQty })
      });
      if (!res.ok) throw new Error('API update failed');
    } catch (_e) {
      // Fallback to localStorage
      const cart = getCartFromStorage();
      const item = cart.find(x => x.id === Number(id));
      if (item) {
        item.qty = newQty;
        localStorage.setItem('cart', JSON.stringify(cart));
      }
    }
    await updateCount();
    await renderCart();
  };

  // --- Initialization ---

  /**
   * Binds event listeners and performs initial UI sync
   */
  const init = () => {
    const cartBtn = el('cartBtn');
    const closeBtn = el('closeCart');
    const clearBtn = el('clearCart');
    const checkout = el('checkoutBtn');
    const itemsEl = el('cartItems');
    const modal = el('cartModal');

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    if (checkout) {
      checkout.addEventListener('click', async () => {
        const c = await getCart();
        if (!c.length) {
          if (typeof showToast === 'function') {
            showToast({ type: 'warning', title: 'Empty Cart', message: 'Add some books to your cart first!' });
          }
          return;
        }
        // Redirect to checkout page
        window.location.href = 'checkout.html';
      });
    }

    if (itemsEl) {
      itemsEl.addEventListener('click', async e => {
        // Handle remove button (both old and new)
        const rem = e.target.closest('button.remove-item') || e.target.closest('button.remove-btn');
        if (rem) {
          // Add remove animation
          const row = rem.closest('.cart-row');
          if (row) {
            row.style.transform = 'translateX(100%)';
            row.style.opacity = '0';
            await new Promise(r => setTimeout(r, 200));
          }
          await removeFromCart(rem.dataset.id);
          return;
        }
        
        // Handle quantity buttons
        const minusBtn = e.target.closest('.qty-minus');
        const plusBtn = e.target.closest('.qty-plus');
        if (minusBtn || plusBtn) {
          const selector = e.target.closest('.qty-selector');
          if (!selector) return;
          
          const itemId = selector.dataset.itemId;
          const valueEl = selector.querySelector('.qty-value');
          let qty = parseInt(valueEl.textContent, 10);
          
          if (minusBtn && qty > 1) {
            qty--;
            // Animate
            valueEl.classList.add('qty-change');
          } else if (plusBtn) {
            qty++;
            valueEl.classList.add('qty-change');
          }
          
          valueEl.textContent = qty;
          selector.querySelector('.qty-minus').disabled = qty <= 1;
          
          // Remove animation class
          setTimeout(() => valueEl.classList.remove('qty-change'), 150);
          
          await updateQuantity(itemId, qty);
        }
      });
    }

    /* Close on overlay click */
    if (modal) {
      const overlay = modal.querySelector('.cart-overlay');
      if (overlay) {
        overlay.addEventListener('click', closeCart);
      }
      /* Also close if clicking the modal area outside the panel */
      modal.addEventListener('click', e => {
        if (e.target === modal) closeCart();
      });
    }

    updateCount();
  };

  // Expose globally
  window.initCartUI = init;
  window.openCartSidebar = openCart;
  window.closeCartSidebar = closeCart;

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();

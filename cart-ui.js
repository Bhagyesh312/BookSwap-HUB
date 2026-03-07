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

  const getCartFromApi = async () => {
    const res = await fetch(`${API_BASE}/api/cart`);
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
   * Renders items into the cart sidebar panel and calculates totals
   */
  const renderCart = async () => {
    const cart = await getCart();
    const itemsEl = el('cartItems');
    const totalEl = el('cartTotal');
    const savedEl = el('cartSavedAmount');

    if (!itemsEl) return;

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="empty">Your cart is empty.</div>';
      if (totalEl) totalEl.textContent = '0';
      if (savedEl) savedEl.textContent = '0';
      return;
    }

    let total = 0;
    let origTotal = 0;

    itemsEl.innerHTML = cart.map(item => {
      const linePrice = item.price * item.qty;
      const lineOrig = (item.original || item.price) * item.qty;
      total += linePrice;
      origTotal += lineOrig;

      // Use QuantitySelector if available, fallback to simple display
      const qtyHTML = typeof window.QuantitySelector !== 'undefined' 
        ? window.QuantitySelector.create(item.qty, item.id)
        : `<div class="ci-qty">Qty: ${item.qty}</div>`;

      return `
                <div class="cart-row" data-id="${item.id}">
                    <div class="ci-left">
                        <img src="${item.image || 'https://via.placeholder.com/80x100?text=No+Cover'}" alt="${item.title}">
                    </div>
                    <div class="ci-body">
                        <div class="ci-title">${item.title}</div>
                        ${qtyHTML}
                        <div class="ci-price">₹${formatIN(linePrice)} <span class="cancelled">₹${formatIN(lineOrig)}</span></div>
                    </div>
                    <div class="ci-actions">
                        <button class="remove-item" data-id="${item.id}">Remove</button>
                    </div>
                </div>`;
    }).join('');

    if (totalEl) totalEl.textContent = formatIN(total);
    if (savedEl) savedEl.textContent = formatIN(Math.max(0, origTotal - total));
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
      const res = await fetch(`${API_BASE}/api/cart/${Number(id)}`, { method: 'DELETE' });
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
      const res = await fetch(`${API_BASE}/api/cart`, { method: 'DELETE' });
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
      const res = await fetch(`${API_BASE}/api/cart/${Number(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
        // Handle remove button
        const rem = e.target.closest('button.remove-item');
        if (rem) {
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
          } else if (plusBtn) {
            qty++;
          }
          
          valueEl.textContent = qty;
          if (selector.querySelector('.qty-minus')) {
            selector.querySelector('.qty-minus').disabled = qty <= 1;
          }
          
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

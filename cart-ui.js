/**
 * cart-ui.js
 * Standalone cart UI logic for pages without the full buy script.
 * Handles cart persistence, rendering, and basic modal operations.
 */
(function () {
  const API_BASE = 'http://localhost:5000';

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
   * Renders items into the cart modal and calculates totals
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

      return `
                <div class="cart-row" data-id="${item.id}">
                    <div class="ci-left">
                        <img src="${item.image || 'https://via.placeholder.com/80x100?text=No+Cover'}" alt="${item.title}">
                    </div>
                    <div class="ci-body">
                        <div class="ci-title">${item.title}</div>
                        <div class="ci-qty">Qty: ${item.qty}</div>
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
   * Opens the cart modal and triggers a re-render
   */
  const openCart = async () => {
    const modal = el('cartModal');
    if (modal) {
      modal.classList.remove('hidden');
      await renderCart();
    }
  };

  /**
   * Closes the cart modal
   */
  const closeCart = () => {
    const modal = el('cartModal');
    if (modal) modal.classList.add('hidden');
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
        if (!c.length) return alert('Cart is empty');
        alert('Proceeding to checkout — items: ' + c.length);
      });
    }

    if (itemsEl) {
      itemsEl.addEventListener('click', async e => {
        const rem = e.target.closest('button.remove-item');
        if (!rem) return;
        await removeFromCart(rem.dataset.id);
      });
    }

    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeCart();
      });
    }

    updateCount();
  };

  // Expose init globally for manual triggers if needed
  window.initCartUI = init;

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', init);
})();

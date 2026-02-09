// cart-ui.js - standalone cart UI for pages without buy script
(function(){
  function el(id){return document.getElementById(id)}
  function getCart(){try{return JSON.parse(localStorage.getItem('cart')||'[]')}catch(e){return []}}
  function saveCart(c){localStorage.setItem('cart',JSON.stringify(c))}
  function updateCount(){const c=getCart(); const count=c.reduce((s,i)=>s+i.qty,0); const cc=el('cartCount'); if(cc) cc.textContent=count}
  function formatIN(n){ return (Number(n)||0).toLocaleString('en-IN') }
  function renderCart(){const cart= getCart(); const itemsEl=el('cartItems'); const totalEl=el('cartTotal'); const savedEl=el('cartSavedAmount'); if(!itemsEl) return; if(!cart.length){itemsEl.innerHTML='<div class="empty">Your cart is empty.</div>'; if(totalEl) totalEl.textContent='0'; if(savedEl) savedEl.textContent='0'; return;} let total=0; let origTotal=0; itemsEl.innerHTML=cart.map(item=>{ const linePrice = item.price*item.qty; const lineOrig = (item.original||item.price)*item.qty; total+= linePrice; origTotal += lineOrig; return `<div class="cart-row" data-id="${item.id}"><div class="ci-left"><img src="${item.image||'https://via.placeholder.com/80x100?text=No+Cover'}" alt="${item.title}"></div><div class="ci-body"><div class="ci-title">${item.title}</div><div class="ci-qty">Qty: ${item.qty}</div><div class="ci-price">₹${formatIN(linePrice)} <span class="cancelled">₹${formatIN(lineOrig)}</span></div></div><div class="ci-actions"><button class="remove-item" data-id="${item.id}">Remove</button></div></div>`}).join(''); if(totalEl) totalEl.textContent = formatIN(total); if(savedEl) savedEl.textContent = formatIN(Math.max(0, origTotal - total)); }
  function openCart(){ const modal=el('cartModal'); if(modal) { modal.classList.remove('hidden'); renderCart(); }}
  function closeCart(){const modal=el('cartModal'); if(modal) modal.classList.add('hidden')}
  function removeFromCart(id){ const c = getCart().filter(x=>x.id!==Number(id)); saveCart(c); updateCount(); renderCart(); }
  function clearCart(){ localStorage.removeItem('cart'); updateCount(); renderCart(); }
  function init(){ const cartBtn=el('cartBtn'); const closeBtn=el('closeCart'); const clearBtn=el('clearCart'); const checkout=el('checkoutBtn'); const itemsEl=el('cartItems'); if(cartBtn) cartBtn.addEventListener('click', openCart); if(closeBtn) closeBtn.addEventListener('click', closeCart); if(clearBtn) clearBtn.addEventListener('click', ()=>{ clearCart() }); if(checkout) checkout.addEventListener('click', ()=>{ const c=getCart(); if(!c.length) return alert('Cart is empty'); alert('Proceeding to checkout — items: '+c.length); }); if(itemsEl) itemsEl.addEventListener('click', e=>{ const rem = e.target.closest('button.remove-item'); if(!rem) return; removeFromCart(rem.dataset.id); }); const modal=el('cartModal'); if(modal) modal.addEventListener('click', e=>{ if(e.target===modal) closeCart(); }); updateCount(); }
  // expose init globally
  window.initCartUI = init;
  // auto-init on DOMContentLoaded on pages that include this script
  document.addEventListener('DOMContentLoaded', init);
})();

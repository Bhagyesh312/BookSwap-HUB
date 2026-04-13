import os

filepath = r'd:\Projects\BookSwap Hub\enhancements.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

index = content.find('/* ═══════════════════════════════════════════════════════\n   12. CUSTOM CURSOR')
if index != -1:
    content = content[:index]

fly_to_cart_code = """/* ═══════════════════════════════════════════════════════
   12. FLY-TO-CART ANIMATION
   ═══════════════════════════════════════════════════════ */
window.animateFlyToCart = function(imgElement) {
    if (!imgElement) return;
    
    let cartIcon = document.querySelector('.cart-icon-btn, .navbar .nav-links a[href="cart.html"], .navbar .nav-links a[title="Cart"], .cart-toggle-btn');
    if (!cartIcon) {
        // Fallback or multiple options
        cartIcon = document.getElementById('cartToggleBtn');
    }
    if (!cartIcon) return;
    
    const imgRect = imgElement.getBoundingClientRect();
    const targetRect = cartIcon.getBoundingClientRect();
    
    const clone = imgElement.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '999999';
    clone.style.top = `${imgRect.top}px`;
    clone.style.left = `${imgRect.left}px`;
    clone.style.width = `${imgRect.width}px`;
    clone.style.height = `${imgRect.height}px`;
    clone.style.objectFit = 'cover';
    clone.style.borderRadius = '10px';
    clone.style.transition = 'all 0.6s cubic-bezier(0.2, 1, 0.3, 1)';
    clone.style.pointerEvents = 'none';
    
    document.body.appendChild(clone);
    
    // Trigger animation frame
    requestAnimationFrame(() => {
        setTimeout(() => {
            clone.style.top = `${targetRect.top + targetRect.height/2 - 10}px`;
            clone.style.left = `${targetRect.left + targetRect.width/2 - 10}px`;
            clone.style.width = '20px';
            clone.style.height = '20px';
            clone.style.opacity = '0.3';
            clone.style.transform = 'scale(0.1) rotate(15deg)';
            
            setTimeout(() => {
                cartIcon.style.transition = 'transform 0.2s';
                cartIcon.style.transform = 'scale(1.2) rotate(-5deg)';
                setTimeout(() => cartIcon.style.transform = '', 200);
            }, 550);
        }, 10);
    });
    
    setTimeout(() => clone.remove(), 700);
};

document.addEventListener('click', function(e) {
    // Look for any add to cart button
    const btn = e.target.closest('.btn-add-cart, .add-to-cart-btn, .add-to-cart, .buy, .details-add-btn');
    if (btn) {
        const card = btn.closest('.book-card, .quickview-modal, .book-detail-main, .wi-body, .book-detail-container');
        if (card) {
            let img = card.querySelector('img');
            // Support wishlist row layout
            if (!img && card.classList.contains('wi-body') && card.previousElementSibling) {
                img = card.previousElementSibling.querySelector('img');
            }
            if (img) window.animateFlyToCart(img);
        }
    }
});
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content + fly_to_cart_code)

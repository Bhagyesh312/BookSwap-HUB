import os

filepath = r'd:\Projects\BookSwap Hub\enhancements.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

index = content.find('/* ═══════════════════════════════════════════════════════\n   12. FLY-TO-CART ANIMATION')
if index != -1:
    content = content[:index]

fly_to_cart_code = """/* ═══════════════════════════════════════════════════════
   12. FLY-TO-CART ANIMATION
   ═══════════════════════════════════════════════════════ */
window.animateFlyToCart = function(visualElement) {
    if (!visualElement) return;
    
    const cartIcon = document.querySelector('.cart-icon-btn, .navbar .nav-links a[href="cart.html"], .navbar .nav-links a[title="Cart"], .cart-toggle-btn, #cartBtn');
    if (!cartIcon) return;
    
    const rect = visualElement.getBoundingClientRect();
    const targetRect = cartIcon.getBoundingClientRect();
    
    const clone = visualElement.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '999999';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.objectFit = 'cover';
    clone.style.borderRadius = '10px';
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    
    document.body.appendChild(clone);
    
    // Force a browser reflow or the transition won't happen
    clone.offsetHeight;
    
    clone.style.transition = 'all 0.6s cubic-bezier(0.2, 1, 0.4, 1)';
    clone.style.top = `${targetRect.top + targetRect.height/2 - 10}px`;
    clone.style.left = `${targetRect.left + targetRect.width/2 - 10}px`;
    clone.style.width = '20px';
    clone.style.height = '20px';
    clone.style.opacity = '0.3';
    clone.style.transform = 'scale(0.1) rotate(15deg)';
    
    setTimeout(() => {
        cartIcon.style.transition = 'transform 0.2s cubic-bezier(0.3, 2, 0.4, 1)';
        cartIcon.style.transform = 'scale(1.25) rotate(-5deg)';
        setTimeout(() => cartIcon.style.transform = '', 200);
    }, 550);
    
    setTimeout(() => clone.remove(), 700);
};

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-add-cart, .add-to-cart-btn, .add-to-cart, .buy, .details-add-btn');
    if (btn) {
        const card = btn.closest('.book-card, .quickview-modal, .book-detail-main, .wi-body, .book-detail-container, .book-details-wrapper');
        if (card) {
            // Find either the book image, or the no-cover placeholder if missing
            let visual = card.querySelector('img.book-cover, .card-image img, .book-image img, #qvImage, img');
            if (!visual) {
                visual = card.querySelector('.no-cover-placeholder');
            }
            if (!visual && card.classList.contains('wi-body') && card.previousElementSibling) {
                visual = card.previousElementSibling.querySelector('img, .no-cover-placeholder');
            }
            if (visual) {
                window.animateFlyToCart(visual);
            }
        }
    }
});
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content + fly_to_cart_code)

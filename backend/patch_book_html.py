import os

filepath = r'd:\Projects\BookSwap Hub\book.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Propose Trade Button below the Cart/BuyNow row
btn_html = """
            <!-- Add to Cart -->
            <div class="book-cart-row">
                <div class="qty-control">
                    <button onclick="changeQty(-1)" class="qty-btn">−</button>
                    <span id="qtyDisplay">1</span>
                    <button onclick="changeQty(1)" class="qty-btn">+</button>
                </div>
                <button id="addToCartBtn" class="btn-add-cart" onclick="addToCartDetail()">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn-buy-now" id="buyNowBtn" onclick="buyNow()">
                    <i class="fa-solid fa-bolt"></i> Buy Now
                </button>
            </div>
            
            <!-- Propose Trade -->
            <div style="margin-top: 15px;">
                <button id="proposeTradeBtn" class="propose-trade-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #ffffff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; padding: 12px; font-family: 'Poppins', sans-serif; font-size: 16px; transition: transform 0.2s, box-shadow 0.2s;">
                    🤝 Propose Trade
                </button>
            </div>
"""
if '<!-- Propose Trade -->' not in content:
    content = content.replace('''            <!-- Add to Cart -->
            <div class="book-cart-row">
                <div class="qty-control">
                    <button onclick="changeQty(-1)" class="qty-btn">−</button>
                    <span id="qtyDisplay">1</span>
                    <button onclick="changeQty(1)" class="qty-btn">+</button>
                </div>
                <button id="addToCartBtn" class="btn-add-cart" onclick="addToCartDetail()">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn-buy-now" id="buyNowBtn" onclick="buyNow()">
                    <i class="fa-solid fa-bolt"></i> Buy Now
                </button>
            </div>''', btn_html)

# 2. Add Trade Modal
trade_modal = """
    <!-- TRADE PROPOSAL MODAL -->
    <div id="tradeModal" class="details-modal hidden" role="dialog" aria-modal="true" aria-label="Propose Trade">
        <div class="details-panel" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
            <button id="closeTradeModalBtn" class="close-details-btn" aria-label="Close trade modal">✕</button>
            <div class="details-content" style="flex-direction: column;">
                <h2 style="font-size: 22px; color: #1e293b; margin-bottom: 5px;">Propose a Trade</h2>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Select one of your listed books to offer in exchange for <strong id="tradeTargetBookName">this book</strong>.</p>
                
                <div id="userListingsContainer" style="display:flex; flex-direction:column; gap:10px; max-height: 300px; overflow-y: auto; padding-right: 10px;">
                    <!-- user listings will be injected here -->
                </div>
                
                <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="cancelTradeBtn" style="padding: 10px 20px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-family:'Poppins', sans-serif;">Cancel</button>
                    <button id="submitTradeBtn" style="padding: 10px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; font-weight: bold; cursor: pointer; font-family:'Poppins', sans-serif;" disabled>Send Proposal</button>
                </div>
            </div>
        </div>
    </div>
"""
if '<!-- TRADE PROPOSAL MODAL -->' not in content:
    content = content.replace('<!-- FOOTER -->', trade_modal + '\n<!-- FOOTER -->')

# 3. Add trade.js script reference
if '<script src="trade.js"></script>' not in content:
    content = content.replace('<script src="chat-support.js"></script>', '<script src="chat-support.js"></script>\n<script src="trade.js"></script>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

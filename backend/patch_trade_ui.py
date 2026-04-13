import os

filepath = r'd:\Projects\BookSwap Hub\buy.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

trade_modal = """
    <!-- TRADE PROPOSAL MODAL -->
    <div id="tradeModal" class="details-modal hidden" role="dialog" aria-modal="true" aria-label="Propose Trade">
        <div class="details-panel" style="max-width: 600px;">
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

# Insert modal before JAVASCRIPT LOGIC
if '<!-- ================= JAVASCRIPT LOGIC' in content:
    content = content.replace('<!-- ================= JAVASCRIPT LOGIC', trade_modal + '\n    <!-- ================= JAVASCRIPT LOGIC')

# Add script tag
if '<script src="chat-support.js"></script>' in content:
    content = content.replace('<script src="chat-support.js"></script>', '<script src="chat-support.js"></script>\n    <script src="trade.js"></script>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

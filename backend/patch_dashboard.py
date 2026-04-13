import os

filepath = r'd:\Projects\BookSwap Hub\seller-dashboard.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert Tabs under seller-header
if '<section class="seller-stats">' in content and 'dashboard-tabs' not in content:
    tabs_html = """
<div class="dashboard-tabs" style="max-width: 1200px; margin: -20px auto 30px; display: flex; gap: 15px; padding: 0 5%; justify-content: center;">
    <button id="tabListings" class="tab-btn active" style="padding: 12px 30px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; box-shadow: 0 4px 15px rgba(249,115,22,0.3);">My Listings</button>
    <button id="tabTrades" class="tab-btn" style="padding: 12px 30px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; background: #fff; color: #475569; box-shadow: 0 4px 15px rgba(15,23,42,0.05); transition: background 0.3s;">Trade Requests</button>
</div>
"""
    content = content.replace('<!-- STATS ROW -->', tabs_html + '\n<!-- STATS ROW -->')

# 2. Insert Trade Requests Section HTML
if '<footer class="footer">' in content and 'trade-section' not in content:
    trade_section_html = """
<!-- TRADE REQUESTS TABLE -->
<section id="tradeSection" class="seller-listings-section hidden" style="display:none; max-width:1200px; margin:0 auto 40px; padding: 0 5%;">
    <div class="seller-listings-header">
        <h2>Trade Requests</h2>
        <div class="seller-filter-row">
            <select id="tradeFilter" class="seller-filter-select" aria-label="Filter trades">
                <option value="received">Requests Received</option>
                <option value="sent">Requests Sent</option>
            </select>
        </div>
    </div>
    <div id="tradesContainer" class="trades-list" style="display:flex; flex-direction:column; gap:15px;">
        <div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>
    </div>
</section>
"""
    content = content.replace('<footer class="footer">', trade_section_html + '\n<footer class="footer">')

# 3. Insert Javascript for Trade Requests
js_code = """
document.getElementById('tabListings').addEventListener('click', () => {
    document.getElementById('tabListings').style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
    document.getElementById('tabListings').style.color = '#fff';
    document.getElementById('tabTrades').style.background = '#fff';
    document.getElementById('tabTrades').style.color = '#475569';
    
    document.querySelector('.seller-stats').style.display = 'grid';
    document.querySelector('.seller-listings-section').style.display = 'block';
    document.getElementById('tradeSection').style.display = 'none';
});

document.getElementById('tabTrades').addEventListener('click', () => {
    document.getElementById('tabTrades').style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
    document.getElementById('tabTrades').style.color = '#fff';
    document.getElementById('tabListings').style.background = '#fff';
    document.getElementById('tabListings').style.color = '#475569';
    
    document.querySelector('.seller-stats').style.display = 'none';
    document.querySelector('.seller-listings-section').style.display = 'none';
    document.getElementById('tradeSection').style.display = 'block';
    
    loadTrades();
});

document.getElementById('tradeFilter').addEventListener('change', loadTrades);

async function loadTrades() {
    const container = document.getElementById('tradesContainer');
    const filter = document.getElementById('tradeFilter').value;
    container.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading trades...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/api/trades`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error();
        const data = await res.json();
        
        const trades = filter === 'received' ? data.received : data.sent;
        
        if (!trades || trades.length === 0) {
            container.innerHTML = `<div style="padding:40px; text-align:center; background:#fff; border-radius:15px; color:#64748b;"><i class="fa-solid fa-handshake" style="font-size:36px; margin-bottom:15px; color:#cbd5e1;"></i><br>No ${filter} trade requests.</div>`;
            return;
        }

        container.innerHTML = trades.map(t => {
            const isReceived = filter === 'received';
            const statusColor = t.status === 'accepted' ? '#10b981' : (t.status === 'declined' ? '#ef4444' : '#f97316');
            let actions = '';
            
            if (isReceived && t.status === 'pending') {
                actions = `
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button onclick="respondToTrade(${t.id}, 'accept')" style="flex:1; padding:10px; border:none; border-radius:8px; background:#10b981; color:#fff; font-weight:bold; cursor:pointer;">Accept</button>
                        <button onclick="respondToTrade(${t.id}, 'decline')" style="flex:1; padding:10px; border:none; border-radius:8px; background:#ef4444; color:#fff; font-weight:bold; cursor:pointer;">Decline</button>
                    </div>
                `;
            }

            return `
                <div style="background:#fff; border-radius:15px; padding:20px; display:flex; align-items:center; gap:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid ${statusColor};">
                    <div style="flex:1;">
                        <p style="font-size:12px; color:#64748b; margin-bottom:5px;">You are offering:</p>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${isReceived ? t.targetBookImage : t.offeredBookImage}" onerror="this.src='media/books.png'" style="width:40px; height:60px; object-fit:cover; border-radius:5px;">
                            <strong style="color:#1e293b;">${isReceived ? t.targetBookTitle : t.offeredBookTitle}</strong>
                        </div>
                    </div>
                    <div style="color:#cbd5e1; font-size:24px;"><i class="fa-solid fa-right-left"></i></div>
                    <div style="flex:1;">
                        <p style="font-size:12px; color:#64748b; margin-bottom:5px;">In exchange for:</p>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${isReceived ? t.offeredBookImage : t.targetBookImage}" onerror="this.src='media/books.png'" style="width:40px; height:60px; object-fit:cover; border-radius:5px;">
                            <strong style="color:#1e293b;">${isReceived ? t.offeredBookTitle : t.targetBookTitle}</strong>
                        </div>
                    </div>
                    <div style="min-width: 150px; text-align:right;">
                        <span style="display:inline-block; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold; color:${statusColor}; background:${statusColor}15; text-transform:uppercase;">${t.status}</span>
                        <div style="font-size:11px; color:#94a3b8; margin-top:8px;">${new Date(t.createdAt).toLocaleDateString()}</div>
                        ${actions}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        container.innerHTML = '<div style="color:red; padding:20px;">Failed to load trade requests.</div>';
    }
}

async function respondToTrade(tradeId, action) {
    if (!confirm(`Are you sure you want to ${action} this trade?`)) return;
    try {
        const res = await fetch(`${API_BASE}/api/trades/${tradeId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error();
        showNotification(`Trade ${action}ed successfully`, 'success');
        loadTrades();
    } catch(e) {
        showNotification(`Failed to ${action} trade`, 'error');
    }
}
"""

if 'loadTrades();' not in content:
    content = content.replace('</script>\n</body>', js_code + '\n</script>\n</body>')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

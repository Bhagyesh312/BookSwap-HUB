/**
 * chat-support.js
 * Smart chat support widget with real-time book data awareness.
 * Answers questions about orders, books, account, and general help.
 * BookSwap Hub
 */
(function () {
    const API_BASE = '';
    let chatOpen = false;
    let chatHistory = [];
    let userOrders = [];
    let allBooks = [];
    let dataLoaded = false;

    /* ── KNOWLEDGE BASE ── */
    const KB = {
        greetings: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste'],
        orderKeywords: ['order', 'orders', 'my order', 'track', 'tracking', 'shipped', 'delivered', 'status', 'purchase'],
        bookKeywords: ['book', 'books', 'find', 'search', 'available', 'stock', 'price', 'buy', 'cost'],
        accountKeywords: ['account', 'profile', 'password', 'login', 'register', 'sign up', 'email'],
        sellKeywords: ['sell', 'selling', 'list', 'listing', 'seller', 'upload'],
        returnKeywords: ['return', 'refund', 'cancel', 'cancellation', 'exchange'],
        paymentKeywords: ['payment', 'pay', 'upi', 'cash', 'cod', 'online', 'razorpay'],
        deliveryKeywords: ['delivery', 'shipping', 'deliver', 'courier', 'dispatch', 'days'],
        contactKeywords: ['contact', 'support', 'help', 'human', 'agent', 'email', 'phone', 'call'],
    };

    function matchesAny(text, keywords) {
        return keywords.some(k => text.includes(k));
    }

    /* ── SMART RESPONSE ENGINE ── */
    async function getResponse(userMsg) {
        const msg = userMsg.toLowerCase().trim();

        // Greetings
        if (matchesAny(msg, KB.greetings)) {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('authUser') || localStorage.getItem('user') || '{}');
            const name = user.name ? `, ${user.name.split(' ')[0]}` : '';
            return `Hey${name}! 👋 I'm your BookSwap Hub assistant. I can help you with:\n\n• 📦 Order tracking & status\n• 📚 Finding books\n• 💰 Pricing & delivery info\n• 🏪 Selling your books\n• 🔐 Account help\n\nWhat can I help you with today?`;
        }

        // Order queries
        if (matchesAny(msg, KB.orderKeywords)) {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return `To check your orders, please <a href="login.html">log in</a> first. Once logged in, you can view all your orders on the <a href="orders.html">Orders page</a>.`;

            await loadUserData();
            if (!userOrders.length) return `You don't have any orders yet. Browse our <a href="buy.html">book collection</a> to place your first order! 📚`;

            const recent = userOrders.slice(0, 3);
            const orderList = recent.map(o => {
                const status = (o.status || 'pending').toLowerCase();
                const emoji = { pending: '⏳', confirmed: '✅', shipped: '🚚', delivered: '📬', cancelled: '❌' }[status] || '📦';
                return `${emoji} Order #${o.id} — ${status.charAt(0).toUpperCase() + status.slice(1)} (₹${parseFloat(o.totalAmount || 0).toLocaleString('en-IN')})`;
            }).join('\n');

            return `Here are your recent orders:\n\n${orderList}\n\nView all orders on your <a href="orders.html">Orders page</a>.`;
        }

        // Book search
        if (matchesAny(msg, KB.bookKeywords)) {
            // Try to extract a book name from the message
            const searchTerms = msg.replace(/book|books|find|search|available|stock|price|buy|cost|do you have|is there/g, '').trim();
            if (searchTerms.length > 2) {
                await loadUserData();
                const matches = allBooks.filter(b =>
                    b.title.toLowerCase().includes(searchTerms) ||
                    b.author.toLowerCase().includes(searchTerms) ||
                    (b.category || '').toLowerCase().includes(searchTerms)
                ).slice(0, 3);

                if (matches.length) {
                    const bookList = matches.map(b =>
                        `📖 <a href="book.html?id=${b.id}">${b.title}</a> by ${b.author} — ₹${parseFloat(b.price).toLocaleString('en-IN')}`
                    ).join('\n');
                    return `I found these books for you:\n\n${bookList}\n\nSee all results on the <a href="buy.html">Buy page</a>.`;
                }
                return `I couldn't find "${searchTerms}" in our catalog right now. Try searching on the <a href="buy.html">Buy page</a> — we update our collection regularly!`;
            }
            return `We have a great collection of new and used books! Browse by category on our <a href="buy.html">Buy page</a>. You can filter by price, genre, and condition.`;
        }

        // Selling
        if (matchesAny(msg, KB.sellKeywords)) {
            return `Selling on BookSwap Hub is easy! 🏪\n\n1. Go to the <a href="sell.html">Sell page</a>\n2. Fill in your book details\n3. Upload photos\n4. Submit for review\n\nOur team reviews listings within 24 hours. Once approved, your book goes live for buyers to see!\n\nYou can track your listings on your <a href="seller-dashboard.html">Seller Dashboard</a>.`;
        }

        // Delivery
        if (matchesAny(msg, KB.deliveryKeywords)) {
            return `📦 Delivery Information:\n\n• Free delivery on orders above ₹999\n• ₹29 delivery for orders ₹499–₹999\n• ₹49 delivery for orders below ₹499\n• Estimated delivery: 3–7 business days\n• We deliver across India\n\nYou can track your order status on the <a href="orders.html">Orders page</a>.`;
        }

        // Payment
        if (matchesAny(msg, KB.paymentKeywords)) {
            return `💳 We accept multiple payment methods:\n\n• UPI (Google Pay, PhonePe, Paytm)\n• Cash on Delivery (COD)\n• Online Banking\n• Debit/Credit Cards\n\nAll payments are secure and encrypted. COD is available for most pin codes.`;
        }

        // Returns
        if (matchesAny(msg, KB.returnKeywords)) {
            return `↩️ Return & Refund Policy:\n\n• 7-day return window from delivery date\n• Books must be in original condition\n• Refund processed within 5–7 business days\n• To initiate a return, contact us at bookswaphubsupport@gmail.com with your order ID\n\nFor cancellations, contact us before the order is shipped.`;
        }

        // Account
        if (matchesAny(msg, KB.accountKeywords)) {
            return `🔐 Account Help:\n\n• <a href="login.html">Login / Register</a>\n• Forgot password? Use the "Forgot Password" link on the login page\n• Update your profile on the <a href="profile.html">Profile page</a>\n• For account issues, email us at bookswaphubsupport@gmail.com`;
        }

        // Contact / Human agent
        if (matchesAny(msg, KB.contactKeywords)) {
            return `📞 Contact Us:\n\n• Email: bookswaphubsupport@gmail.com\n• Phone: +91 9409715902\n• Hours: Mon–Sat, 9 AM – 6 PM IST\n\nFor faster help, email us with your order ID and we'll respond within 24 hours.`;
        }

        // Fallback
        return `I'm not sure about that, but I'm here to help! 😊\n\nYou can ask me about:\n• Your orders\n• Finding books\n• Delivery & payment\n• Selling books\n• Returns & refunds\n\nOr contact us directly at bookswaphubsupport@gmail.com`;
    }

    async function loadUserData() {
        if (dataLoaded) return;
        dataLoaded = true;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (token) {
                const res = await fetch(`${API_BASE}/api/orders/`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) { const d = await res.json(); userOrders = d.orders || []; }
            }
            const bRes = await fetch(`${API_BASE}/api/books/?per_page=100`);
            if (bRes.ok) { const d = await bRes.json(); allBooks = d.items || []; }
        } catch (_) {}
    }

    /* ── RENDER CHAT ── */
    function addMessage(text, sender = 'bot') {
        chatHistory.push({ text, sender, time: new Date() });
        renderMessages();
    }

    function renderMessages() {
        const list = document.getElementById('chatMessages');
        if (!list) return;
        list.innerHTML = chatHistory.map(m => {
            const timeStr = m.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const lines = m.text.replace(/\n/g, '<br>');
            return `<div class="chat-msg ${m.sender}">
                <div class="chat-bubble">${lines}</div>
                <span class="chat-time">${timeStr}</span>
            </div>`;
        }).join('');
        list.scrollTop = list.scrollHeight;
    }

    async function handleSend() {
        const input = document.getElementById('chatInput');
        const text = (input.value || '').trim();
        if (!text) return;
        input.value = '';
        addMessage(text, 'user');

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        const list = document.getElementById('chatMessages');
        list.insertAdjacentHTML('beforeend', `<div id="${typingId}" class="chat-msg bot"><div class="chat-bubble typing"><span></span><span></span><span></span></div></div>`);
        list.scrollTop = list.scrollHeight;

        const response = await getResponse(text);
        document.getElementById(typingId)?.remove();
        addMessage(response, 'bot');
    }

    /* ── QUICK REPLIES ── */
    const quickReplies = ['Track my order', 'Find a book', 'Delivery info', 'Sell a book', 'Return policy', 'Contact support'];

    function renderQuickReplies() {
        const container = document.getElementById('quickReplies');
        if (!container) return;
        container.innerHTML = quickReplies.map(r =>
            `<button class="quick-reply-btn" data-reply="${r}">${r}</button>`
        ).join('');
        container.querySelectorAll('.quick-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                if (input) input.value = btn.dataset.reply;
                handleSend();
            });
        });
    }

    /* ── TOGGLE ── */
    function toggleChat() {
        chatOpen = !chatOpen;
        const widget = document.getElementById('chatWidget');
        const btn = document.getElementById('chatToggleBtn');
        if (!widget) return;
        widget.classList.toggle('open', chatOpen);
        btn.innerHTML = chatOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-comment-dots"></i>';

        if (chatOpen && chatHistory.length === 0) {
            setTimeout(() => addMessage("Hi there! 👋 I'm your BookSwap Hub assistant. How can I help you today?", 'bot'), 300);
            setTimeout(renderQuickReplies, 600);
        }
    }

    /* ── INJECT HTML ── */
    function injectChatWidget() {
        const html = `
        <div id="chatWidget" class="chat-widget">
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-avatar"><i class="fa-solid fa-headset"></i></div>
                    <div>
                        <strong>BookSwap Support</strong>
                        <span class="chat-status"><span class="status-dot"></span> Online</span>
                    </div>
                </div>
                <button class="chat-header-close" id="chatCloseBtn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="chatMessages" class="chat-messages"></div>
            <div id="quickReplies" class="quick-replies"></div>
            <div class="chat-input-row">
                <input id="chatInput" type="text" placeholder="Type your message..." autocomplete="off">
                <button class="chat-send-btn" id="chatSendBtn" aria-label="Send message">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
        <button id="chatToggleBtn" class="chat-toggle-btn" aria-label="Open chat support">
            <i class="fa-solid fa-comment-dots"></i>
            <span class="chat-unread-badge" id="chatUnreadBadge" style="display:none">1</span>
        </button>`;
        document.body.insertAdjacentHTML('beforeend', html);

        // Wire events after injection
        document.getElementById('chatToggleBtn').addEventListener('click', toggleChat);
        document.getElementById('chatCloseBtn').addEventListener('click', toggleChat);
        document.getElementById('chatSendBtn').addEventListener('click', () => handleSend());
        document.getElementById('chatInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectChatWidget);
    } else {
        injectChatWidget();
    }

    window.ChatSupport = {
        toggle: toggleChat,
        send: (preset) => {
            if (preset) {
                const input = document.getElementById('chatInput');
                if (input) input.value = preset;
            }
            handleSend();
        }
    };
})();

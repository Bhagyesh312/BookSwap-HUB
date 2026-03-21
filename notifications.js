/**
 * notifications.js
 * Real-time SSE notifications + Chat Support widget
 * BookSwap Hub
 */
(function () {
    const API_BASE = '';
    let evtSource = null;
    let unreadCount = 0;
    const notifQueue = [];

    /* ── SSE CONNECTION ── */
    function connectSSE() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return;

        if (evtSource) evtSource.close();

        // SSE doesn't support custom headers — pass token as query param
        evtSource = new EventSource(`${API_BASE}/api/notifications/stream?token=${token}`);

        evtSource.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.type === 'connected') return;
                showToastNotif(data);
                addToNotifPanel(data);
                bumpBell();
            } catch (_) {}
        };

        evtSource.onerror = () => {
            evtSource.close();
            // Reconnect after 10s
            setTimeout(connectSSE, 10000);
        };
    }

    /* ── BELL BADGE ── */
    function bumpBell() {
        unreadCount++;
        const badge = document.getElementById('notifBadge');
        if (badge) { badge.textContent = unreadCount; badge.style.display = 'flex'; }
        // Wiggle the bell
        const bell = document.getElementById('notifBell');
        if (bell) {
            bell.classList.remove('has-notif');
            void bell.offsetWidth; // reflow to restart animation
            bell.classList.add('has-notif');
        }
    }

    function clearBell() {
        unreadCount = 0;
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
    }

    /* ── TOAST NOTIFICATION ── */
    function showToastNotif(data) {
        const icons = { order_update: '📦', price_drop: '💰', wishlist: '❤️', system: 'ℹ️' };
        const icon = icons[data.type] || 'ℹ️';

        const toast = document.createElement('div');
        toast.className = 'notif-toast';
        toast.innerHTML = `
            <span class="notif-toast-icon">${icon}</span>
            <div class="notif-toast-body">
                <strong>${data.title || 'BookSwap Hub'}</strong>
                <p>${data.message || ''}</p>
            </div>
            <button class="notif-toast-close" onclick="this.parentElement.remove()">✕</button>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
    }

    /* ── NOTIF PANEL ── */
    function addToNotifPanel(data) {
        notifQueue.unshift(data);
        renderNotifPanel();
    }

    function renderNotifPanel() {
        const list = document.getElementById('notifList');
        if (!list) return;
        if (!notifQueue.length) {
            list.innerHTML = '<p class="notif-empty">No notifications yet</p>';
            return;
        }
        list.innerHTML = notifQueue.slice(0, 20).map(n => `
            <div class="notif-item ${n.type}">
                <span class="notif-item-icon">${n.type === 'order_update' ? '📦' : n.type === 'price_drop' ? '💰' : 'ℹ️'}</span>
                <div class="notif-item-body">
                    <p>${n.message || ''}</p>
                    <span class="notif-time">Just now</span>
                </div>
            </div>`).join('');
    }

    /* ── INIT BELL BUTTON ── */
    function initBell() {
        const bell = document.getElementById('notifBell');
        const panel = document.getElementById('notifPanel');
        if (!bell || !panel) return;

        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('open');
            if (panel.classList.contains('open')) { clearBell(); renderNotifPanel(); }
        });
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== bell) panel.classList.remove('open');
        });
    }

    /* ── INIT ── */
    document.addEventListener('DOMContentLoaded', () => {
        connectSSE();
        initBell();
    });

    window.BookSwapNotif = { show: showToastNotif };
})();

/**
 * Trade System Logic
 * Handles Propose Trade operations on buy.html and book.html
 */
document.addEventListener('DOMContentLoaded', () => {
    const proposeTradeBtn = document.getElementById('proposeTradeBtn');
    const tradeModal = document.getElementById('tradeModal');
    if (!tradeModal) return;

    const closeTradeModalBtn = document.getElementById('closeTradeModalBtn');
    const cancelTradeBtn = document.getElementById('cancelTradeBtn');
    const submitTradeBtn = document.getElementById('submitTradeBtn');
    const userListingsContainer = document.getElementById('userListingsContainer');
    const tradeTargetBookName = document.getElementById('tradeTargetBookName');
    
    let currentTargetBookId = null;
    let selectedOfferedBookId = null;

    // Helper: Auth Header
    const getAuthHeader = () => {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    // Close Modal Logic
    const closeTradeModal = () => {
        tradeModal.classList.add('hidden');
        document.body.style.overflow = '';
        selectedOfferedBookId = null;
        submitTradeBtn.disabled = true;
    };

    if (closeTradeModalBtn) closeTradeModalBtn.addEventListener('click', closeTradeModal);
    if (cancelTradeBtn) cancelTradeBtn.addEventListener('click', closeTradeModal);
    tradeModal.addEventListener('click', (e) => {
        if (e.target === tradeModal) closeTradeModal();
    });

    // Propose Trade Button Click
    if (proposeTradeBtn) {
        proposeTradeBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                if (window.showToast) window.showToast({ type: 'error', title: 'Auth Required', message: 'Please login to propose trades.' });
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            // Get target book ID from the main scope of buy.html (currentDetailBookId)
            // or from book.html (currentBook.id)
            currentTargetBookId = window.currentDetailBookId || (window.currentBook && window.currentBook.id);
            
            // Fallback for book.html URL parameter
            if (!currentTargetBookId) {
                const params = new URLSearchParams(window.location.search);
                currentTargetBookId = params.get('id');
            }

            if (!currentTargetBookId) {
                if (window.showToast) window.showToast({ type: 'error', message: 'No book selected for trade.'});
                return;
            }

            tradeTargetBookName.textContent = document.getElementById('detailsTitle')?.textContent || document.getElementById('bookTitle')?.textContent || 'this book';
            
            // Fetch User Listings
            userListingsContainer.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading your books...</div>';
            
            tradeModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            try {
                // Fetch books listed by current user. We use /api/books with listedBy parameter if API supports it,
                // otherwise we use a specialized endpoint. Actually, /api/user/listings is standard, but if not,
                // we fetch all books and filter locally (fallback).
                const res = await fetch('/api/books/my', { headers: getAuthHeader() });
                let books = [];
                if (res.ok) {
                    const data = await res.json();
                    books = data.books || data.items || [];
                } else if (res.status === 404) {
                    // Fallback filtering if endpoint doesn't exist
                    const allRes = await fetch('/api/books');
                    const allData = await allRes.json();
                    const meRes = await fetch('/api/auth/me', { headers: getAuthHeader() });
                    if(meRes.ok) {
                        const me = await meRes.json();
                        if(me.user) {
                            books = (allData.books || []).filter(b => b.listedBy === me.user.id);
                        }
                    }
                } else {
                    throw new Error('Failed to load listings');
                }

                if (books.length === 0) {
                    userListingsContainer.innerHTML = '<div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; color: #64748b;">You haven\'t listed any books for sell or trade yet.<br><br><a href="sell.html" style="color:#8b5cf6; font-weight:bold;">List a book now</a></div>';
                    return;
                }

                userListingsContainer.innerHTML = books.map(b => `
                    <div class="trade-listing-item" data-id="${b.id}" style="display:flex; align-items:center; gap:15px; padding:12px; border:2px solid #e2e8f0; border-radius:10px; cursor:pointer; transition: all 0.2s;">
                        <img src="${b.image || 'https://via.placeholder.com/50x75.png?text=No+Cover'}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                        <div style="flex:1;">
                            <strong style="display:block; font-size:14px; color:#1e293b;">${b.title}</strong>
                            <span style="font-size:12px; color:#64748b;">${b.author} | ₹${b.price || b.original}</span>
                        </div>
                        <div class="trade-radio" style="width:20px; height:20px; border-radius:50%; border:2px solid #cbd5e1; display:flex; align-items:center; justify-content:center;">
                            <div class="trade-radio-inner" style="width:10px; height:10px; border-radius:50%; background:transparent;"></div>
                        </div>
                    </div>
                `).join('');

                // Selection Logic
                document.querySelectorAll('.trade-listing-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.querySelectorAll('.trade-listing-item').forEach(i => {
                            i.style.borderColor = '#e2e8f0';
                            i.style.background = 'transparent';
                            i.querySelector('.trade-radio-inner').style.background = 'transparent';
                            i.querySelector('.trade-radio').style.borderColor = '#cbd5e1';
                        });

                        item.style.borderColor = '#8b5cf6';
                        item.style.background = 'rgba(139, 92, 246, 0.05)';
                        item.querySelector('.trade-radio-inner').style.background = '#8b5cf6';
                        item.querySelector('.trade-radio').style.borderColor = '#8b5cf6';

                        selectedOfferedBookId = item.dataset.id;
                        submitTradeBtn.disabled = false;
                    });
                });

            } catch (err) {
                console.error('Error fetching user listings:', err);
                userListingsContainer.innerHTML = '<div style="color:red; padding: 20px;">Failed to load your listings.</div>';
            }
        });
    }

    // Submit Trade
    if (submitTradeBtn) {
        submitTradeBtn.addEventListener('click', async () => {
            if (!currentTargetBookId || !selectedOfferedBookId) return;

            submitTradeBtn.disabled = true;
            submitTradeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            try {
                const res = await fetch('/api/trades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader()
                    },
                    body: JSON.stringify({
                        targetBookId: Number(currentTargetBookId),
                        offeredBookId: Number(selectedOfferedBookId)
                    })
                });

                const data = await res.json();
                
                if (res.ok) {
                    if (window.showToast) window.showToast({ type: 'success', title: 'Trade Proposed!', message: data.message });
                    closeTradeModal();
                } else {
                    if (window.showToast) window.showToast({ type: 'error', title: 'Trade Failed', message: data.error });
                    submitTradeBtn.disabled = false;
                    submitTradeBtn.innerHTML = 'Send Proposal';
                }
            } catch (err) {
                console.error('Trade Submission Error:', err);
                if (window.showToast) window.showToast({ type: 'error', title: 'Network Error', message: 'Could not send trade proposal.' });
                submitTradeBtn.disabled = false;
                submitTradeBtn.innerHTML = 'Send Proposal';
            }
        });
    }
});

/**
 * Initialize authentication UI - shows/hides login button or user profile based on auth state
 * This function checks localStorage for token and displays appropriate UI elements
 */
function initAuthUI() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    
    console.log('[AuthUI] Init - token:', !!token, 'userName:', userName);
    
    if (!loginBtn || !userProfile) {
        console.log('[AuthUI] Nav elements not found on this page');
        return;
    }

    const profileName = document.querySelector('.profile-name');
    const profileToggle = document.getElementById('profileToggle');
    const profileMenu = document.getElementById('profileMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token && userName) {
        // User is logged in
        console.log('[AuthUI] ✓ User logged in:', userName);
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        
        if (profileName) {
            const firstName = userName.split(' ')[0];
            profileName.textContent = firstName;
            console.log('[AuthUI] Display name:', firstName);
        }

        // Toggle profile menu with click handler
        if (profileToggle && profileMenu) {
            profileToggle.onclick = function(e) {
                e.stopPropagation();
                const isHidden = profileMenu.classList.toggle('hidden');
                console.log('[AuthUI] Menu toggle - hidden:', isHidden);
            };
            console.log('[AuthUI] Click handler attached to profile button');
        }

        // Close menu when clicking outside
        document.addEventListener('click', function closeMenuOnOutside(e) {
            if (profileMenu && !profileMenu.classList.contains('hidden')) {
                if (!userProfile.contains(e.target)) {
                    profileMenu.classList.add('hidden');
                    console.log('[AuthUI] Menu closed by outside click');
                }
            }
        });

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                console.log('[AuthUI] Logging out...');
                localStorage.removeItem('token');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                console.log('[AuthUI] localStorage cleared, redirecting to home...');
                window.location.href = 'home.html';
            };
            console.log('[AuthUI] Logout handler attached');
        }
    } else {
        // User is not logged in
        console.log('[AuthUI] No user token found');
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[AuthUI] DOM loaded, initializing...');
        initAuthUI();
    });
} else {
    // DOM already loaded
    console.log('[AuthUI] DOM already loaded, initializing immediately...');
    initAuthUI();
}

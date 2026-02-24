# Authentication UI Implementation - Testing Guide

## Features Implemented

✅ **User Profile Menu** - Replaces Login/Register button when user is logged in
✅ **User Name Display** - Shows user's first name in the profile button
✅ **Dropdown Menu** - Profile Settings, My Orders, Sign Out options
✅ **Logout Functionality** - Clears localStorage and redirects to home
✅ **Responsive Design** - Works on all pages
✅ **Token Persistence** - Maintains session across page refreshes

## Files Modified

### Frontend Files
1. **home.html** - Added user profile menu structure and initAuthUI() call
2. **buy.html** - Added user profile menu and initAuthUI() call
3. **about.html** - Added user profile menu and auth-ui.js script
4. **contact.html** - Added user profile menu and auth-ui.js script
5. **sell.html** - Added user profile menu and auth-ui.js script
6. **checkout.html** - Added user profile menu and initAuthUI() call

### New Files
1. **auth-ui.js** - Core authentication UI initialization logic

### CSS Files
1. **home.css** - Added .user-profile, .profile-btn, .profile-menu, .profile-menu-item styles

### JavaScript Files
1. **login.html** - Updated localStorage keys to match auth-ui.js expectations
   - Changed from 'authToken' → 'token'
   - Changed from 'authUser' (JSON) → 'userName' and 'userId' (individual keys)

## Testing Steps

### Test 1: Simple Registration and Check Profile Menu
```
1. Open browser and go to http://localhost:5000 (or your local frontend)
2. Click "Login/Register" button
3. Switch to Register tab
4. Fill in: Name, Email, Password
5. Click Register
6. Should redirect to home.html
7. Profile menu should replace Login/Register button
8. Button should show user's first name with avatar
```

### Test 2: Dropdown Menu Functionality
```
1. After logging in, click the profile button (shows "Auth Test User" or similar)
2. Dropdown menu should appear with:
   - Profile Settings (links to profile.html)
   - My Orders (links to orders.html)
   - Sign Out (logs out and redirects to home)
3. Click anywhere outside menu to close it
4. Menu should hide
```

### Test 3: Sign Out and Return to Login Button
```
1. Click the profile button
2. Click "Sign Out"
3. Should redirect to home.html
4. Login/Register button should reappear
5. localStorage should be cleared
6. Refresh page - should still show Login/Register button
```

### Test 4: Cross-Page Navigation
```
1. Login on home.html
2. Navigate to buy.html - profile menu should be visible
3. Navigate to about.html - profile menu should be visible
4. Navigate to contact.html - profile menu should be visible
5. Navigate to sell.html - profile menu should be visible
6. Navigate to checkout.html - profile menu should be visible (after login)
```

### Test 5: Session Persistence
```
1. Login and note the username
2. Refresh the page (Ctrl+R)
3. Profile menu should still be visible with same username
4. Navigate to different pages - profile menu persists
5. Close and reopen browser tab
6. Profile menu should still be there
```

### Test 6: Cart Integration
```
1. Add items to cart while logged in
2. Profile menu should not interfere with cart functionality
3. Both should work independently
```

## localStorage Keys

After login/registration, the following keys are stored:

```
localStorage.setItem('token', '<JWT_token>');
localStorage.setItem('userName', '<user_name>');
localStorage.setItem('userId', '<user_id>');
```

Example:
```javascript
localStorage.getItem('token')      // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
localStorage.getItem('userName')  // "John Doe"
localStorage.getItem('userId')    // "1"
```

## CSS Classes

### Hidden State
```css
.hidden {
    display: none !important;
}
```

### User Profile Button
```css
.profile-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: rgba(212, 165, 116, 0.15);
    border: 2px solid rgba(212, 165, 116, 0.3);
    border-radius: 12px;
    color: #d4a574;
}
```

### Profile Menu Items
```css
.profile-menu-item {
    display: block;
    width: 100%;
    padding: 12px 16px;
    background: #fff;
    border: none;
    color: #3e2723;
    transition: all 0.2s ease;
}

.profile-menu-item:hover {
    background: #f5f0e8;
    padding-left: 20px;
}
```

## JavaScript Functions

### initAuthUI()
Located in auth-ui.js

```javascript
function initAuthUI() {
    // Checks localStorage for 'token' key
    // If token exists:
    //   - Hides login button
    //   - Shows user profile menu
    //   - Displays user's first name
    //   - Sets up menu toggle and logout handler
    // If token doesn't exist:
    //   - Shows login button
    //   - Hides user profile menu
}
```

## Troubleshooting

### Profile menu not showing after login
- Check browser console for errors
- Verify localStorage has 'token' key
- Confirm auth-ui.js is loaded (check Network tab)
- Check if initAuthUI() is called

### Logout not working
- Check if logoutBtn element exists
- Verify localStorage keys are being removed
- Confirm redirect to home.html occurs

### Profile button showing wrong name
- Check localStorage 'userName' value
- Verify backend returns user name in auth response
- Check if .profile-name element exists in HTML

### Menu not closing on outside click
- Verify event listeners are attached
- Check if profileMenu has correct ID attribute
- Confirm .hidden class sets display: none

## Browser Compatibility

✅ Chrome/Edge - Fully tested
✅ Firefox - Supported
✅ Safari - Supported
✅ Mobile browsers - Responsive design included

## Security Notes

- JWT tokens stored in localStorage (7-day expiry)
- Tokens are sent via Authorization header for API requests
- Logout clears all sensitive data from localStorage
- No sensitive data in sessionStorage or cookies

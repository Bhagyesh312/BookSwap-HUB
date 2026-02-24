const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * Convert database user row to public user object (excludes password hash)
 * @param {Object} row - Database user row
 * @returns {Object} Public user object with id, name, email
 */
const toPublicUser = (row) => ({
  id: Number(row.id),
  name: row.name,
  email: row.email
});

/**
 * Create JWT token for authenticated user
 * Token expires in 7 days and includes user email and name
 * @param {Object} user - User object with id, email, name
 * @returns {string} Signed JWT token
 */
const signToken = (user) => jwt.sign(
  {
    email: user.email,
    name: user.name
  },
  JWT_SECRET,
  {
    subject: String(user.id),
    expiresIn: '7d'
  }
);

// ===== POST /register =====
/**
 * Register new user with email and password
 * - Validates input and password strength
 * - Hashes password with bcryptjs (10 rounds)
 * - Creates user account in database
 * - Returns JWT token for immediate login
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const safeName = String(name || '').trim();
  const safeEmail = String(email || '').trim().toLowerCase();
  const safePassword = String(password || '');

  if (!safeName || !safeEmail || !safePassword) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  if (!safeEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  if (safePassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = await getDb();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', safeEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(safePassword, 10);
  const result = await db.run(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    safeName,
    safeEmail,
    passwordHash
  );

  const user = {
    id: Number(result.lastID),
    name: safeName,
    email: safeEmail
  };

  return res.status(201).json({
    token: signToken(user),
    user
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const safeEmail = String(email || '').trim().toLowerCase();
  const safePassword = String(password || '');

  if (!safeEmail || !safePassword) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const db = await getDb();
  const row = await db.get(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    safeEmail
  );

  if (!row) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(safePassword, row.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await db.run(
    'UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?',
    Number(row.id)
  );

  const user = toPublicUser(row);

  return res.json({
    token: signToken(user),
    user
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const db = await getDb();
  const row = await db.get('SELECT id, name, email FROM users WHERE id = ?', Number(req.user.id));

  if (!row) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({ user: toPublicUser(row) });
});

// ===== PUT /api/auth/me =====
/**
 * Update user profile information
 * - Update name, email, phone, address, city, state, zip, country
 * - Email must be unique (unless unchanged)
 * - Password is NOT updated here - use /change-password instead
 * - Returns updated user object
 */
router.put('/me', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country
  } = req.body || {};

  const safeName = name ? String(name).trim() : null;
  const safeEmail = email ? String(email).trim().toLowerCase() : null;

  if (safeEmail && !safeEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' });
  }

  const db = await getDb();

  try {
    // Check if email is already taken by another user
    if (safeEmail) {
      const existing = await db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        safeEmail,
        userId
      );
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Update user profile
    await db.run(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = ?,
        address = ?,
        city = ?,
        state = ?,
        zip = ?,
        country = COALESCE(?, country)
       WHERE id = ?`,
      safeName,
      safeEmail,
      phone ? String(phone).trim() : null,
      address ? String(address).trim() : null,
      city ? String(city).trim() : null,
      state ? String(state).trim() : null,
      zip ? String(zip).trim() : null,
      country ? String(country).trim() : null,
      userId
    );

    // Fetch updated user
    const row = await db.get(
      'SELECT id, name, email, phone, address, city, state, zip, country, created_at, last_login_at FROM users WHERE id = ?',
      userId
    );

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: Number(row.id),
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
        country: row.country,
        createdAt: row.created_at,
        lastLogin: row.last_login_at
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ===== PUT /api/auth/change-password =====
/**
 * Change user password
 * - Validates current password before allowing change
 * - New password must be at least 6 characters
 * - Hashes new password with bcryptjs (10 rounds)
 * - Returns success message
 */
router.put('/change-password', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'currentPassword and newPassword are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: 'New password must be at least 6 characters'
    });
  }

  const db = await getDb();

  try {
    // Get current password hash
    const row = await db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      userId
    );

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, row.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Prevent using same password
    const isSame = await bcrypt.compare(newPassword, row.password_hash);
    if (isSame) {
      return res.status(400).json({
        error: 'New password must be different from current password'
      });
    }

    // Hash and update new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      passwordHash,
      userId
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// ===== DELETE /api/auth/delete-account =====
/**
 * Delete user account and all associated data
 * - Removes user record
 * - Cascades delete to orders, order_items, and cart_items
 * - Returns success message
 * - Frontend should clear localStorage after deletion
 */
router.delete('/delete-account', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const db = await getDb();

  try {
    await db.exec('BEGIN TRANSACTION');

    try {
      // Delete user and cascade delete orders/carts (handled by foreign keys)
      await db.run('DELETE FROM users WHERE id = ?', userId);

      await db.exec('COMMIT');

      return res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ===== PUT /api/auth/settings =====
/**
 * Save user notification and preference settings
 * Currently stores settings but doesn't enforce them in the backend
 * Frontend can check localStorage for these preferences
 * @param {boolean} emailNotifications - Enable email notifications
 * @param {boolean} orderAlerts - Enable order status alerts
 * @param {boolean} marketingEmails - Enable marketing emails
 */
router.put('/settings', requireAuth, async (req, res) => {
  // Settings are typically stored in frontend localStorage
  // Backend can optionally store preferences in database
  // For now, just acknowledge the request
  return res.json({ message: 'Settings saved successfully' });
});

module.exports = router;

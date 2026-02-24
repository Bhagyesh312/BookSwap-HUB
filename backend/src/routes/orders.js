const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Convert database order row to public order object
 * @param {Object} row - Database order row
 * @returns {Object} Public order object
 */
const toPublicOrder = (row) => ({
  id: Number(row.id),
  userId: Number(row.user_id),
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  city: row.city,
  state: row.state,
  zip: row.zip,
  country: row.country,
  totalAmount: Number(row.total_amount),
  status: row.status,
  paymentMethod: row.payment_method,
  notes: row.notes,
  createdAt: row.created_at
});

/**
 * Convert order items row to public format
 * @param {Object} row - Database order item row
 * @returns {Object} Public order item
 */
const toPublicOrderItem = (row) => ({
  id: Number(row.id),
  bookId: Number(row.book_id),
  title: row.title,
  price: Number(row.price),
  quantity: Number(row.quantity),
  image: row.image
});

// ===== POST /api/orders =====
/**
 * Create new order from cart items
 * - Validates shipping and payment info
 * - Creates order record in database
 * - Copies cart items to order_items table
 * - Clears user's cart after order creation
 * - Returns created order with items
 */
router.post('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const {
    fullName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country,
    paymentMethod,
    notes
  } = req.body || {};

  // Validation
  if (!fullName || !email || !address || !country || !paymentMethod) {
    return res.status(400).json({
      error: 'fullName, email, address, country, and paymentMethod are required'
    });
  }

  const db = await getDb();

  try {
    // Get user's cart items
    const cartItems = await db.all(
      'SELECT book_id, title, price, quantity, image FROM cart_items WHERE user_id = ?',
      userId
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Start transaction
    await db.exec('BEGIN TRANSACTION');

    try {
      // Create order
      const orderResult = await db.run(
        `INSERT INTO orders (user_id, full_name, email, phone, address, city, state, zip, country, total_amount, status, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`,
        userId,
        String(fullName).trim(),
        String(email).trim().toLowerCase(),
        phone ? String(phone).trim() : null,
        String(address).trim(),
        city ? String(city).trim() : null,
        state ? String(state).trim() : null,
        zip ? String(zip).trim() : null,
        String(country).trim() || 'India',
        totalAmount,
        String(paymentMethod).trim(),
        notes ? String(notes).trim() : null
      );

      const orderId = Number(orderResult.lastID);

      // Insert order items from cart
      const insertItemStmt = await db.prepare(
        `INSERT INTO order_items (order_id, book_id, title, price, quantity, image)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const item of cartItems) {
        await insertItemStmt.run(
          orderId,
          Number(item.book_id),
          item.title,
          Number(item.price),
          Number(item.quantity),
          item.image
        );
      }

      await insertItemStmt.finalize();

      // Clear user's cart
      await db.run('DELETE FROM cart_items WHERE user_id = ?', userId);

      // Commit transaction
      await db.exec('COMMIT');

      // Fetch created order with items
      const order = await db.get('SELECT * FROM orders WHERE id = ?', orderId);
      const items = await db.all(
        'SELECT * FROM order_items WHERE order_id = ?',
        orderId
      );

      return res.status(201).json({
        orderId,
        order: toPublicOrder(order),
        items: items.map(toPublicOrderItem)
      });
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// ===== GET /api/orders =====
/**
 * Get user's orders with items
 * - Returns all orders for authenticated user
 * - Includes order items for each order
 * - Sorted by creation date (newest first)
 */
router.get('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);

  try {
    const db = await getDb();

    // Get orders for user
    const orders = await db.all(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      userId
    );

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.all(
          'SELECT * FROM order_items WHERE order_id = ?',
          Number(order.id)
        );

        return {
          ...toPublicOrder(order),
          items: items.map(toPublicOrderItem)
        };
      })
    );

    return res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ===== GET /api/orders/:orderId =====
/**
 * Get specific order with items
 * - Returns single order owned by authenticated user
 * - Includes all order items
 * - Returns 404 if order not found or belongs to different user
 */
router.get('/:orderId', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const orderId = Number(req.params.orderId);

  try {
    const db = await getDb();

    const order = await db.get(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      orderId,
      userId
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db.all(
      'SELECT * FROM order_items WHERE order_id = ?',
      orderId
    );

    return res.json({
      order: toPublicOrder(order),
      items: items.map(toPublicOrderItem)
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;

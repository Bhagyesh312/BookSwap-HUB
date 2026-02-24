const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ===== GET / - Fetch user's cart =====
/**
 * Retrieve all items in authenticated user's shopping cart
 * Returns items scoped to user_id from cart_items table
 * Requires valid JWT token in Authorization header
 * 
 * @route GET /api/cart
 * @middleware requireAuth - Validates JWT token
 * @returns {Object} { items: Array of cart items with bookId, quantity, title, price, original, image }
 */
router.get('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const db = await getDb();
  const items = await db.all(`
    SELECT
      book_id AS bookId,
      quantity,
      title,
      price,
      original,
      image
    FROM cart_items
    WHERE user_id = ?
    ORDER BY book_id ASC
  `, userId);
  res.json({ items });
});

// ===== POST / - Add item to cart (or update quantity) =====
/**
 * Add book to cart or increment quantity if already exists
 * Uses UPSERT (INSERT ... ON CONFLICT) for atomic operation
 * Data is scoped to authenticated user
 * 
 * @route POST /api/cart
 * @middleware requireAuth
 * @param {number} bookId - Book ID to add
 * @param {number} quantity - Quantity (default 1)
 * @param {string} title - Book title (fallback)
 * @param {number} price - Book price (fallback)
 * @param {number} original - Original price (fallback)
 * @param {string} image - Book cover image URL (fallback)
 * @returns {Object} { items: Updated cart items }
 */
router.post('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const { bookId, quantity = 1, title, price, original, image } = req.body || {};
  const id = Number(bookId);
  const qty = Number(quantity);

  if (!id || qty < 1) {
    return res.status(400).json({ error: 'bookId and quantity (>=1) are required' });
  }

  const db = await getDb();
  const book = await db.get('SELECT * FROM books WHERE id = ?', id);

  const itemTitle = book?.title || title;
  const itemPrice = Number(book?.price ?? price);
  const itemOriginal = Number(book?.original ?? original ?? itemPrice);
  const itemImage = book?.image || image || '';

  if (!itemTitle || Number.isNaN(itemPrice) || itemPrice <= 0) {
    return res.status(400).json({ error: 'Valid title and price are required when book is not in catalog' });
  }

  await db.run(
    `
    INSERT INTO cart_items (user_id, book_id, quantity, title, price, original, image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, book_id) DO UPDATE SET
      quantity = cart_items.quantity + excluded.quantity,
      title = excluded.title,
      price = excluded.price,
      original = excluded.original,
      image = excluded.image
  `,
    userId,
    id,
    qty,
    itemTitle,
    itemPrice,
    Number.isNaN(itemOriginal) ? itemPrice : itemOriginal,
    itemImage
  );

  const items = await db.all(`
    SELECT
      book_id AS bookId,
      quantity,
      title,
      price,
      original,
      image
    FROM cart_items
    WHERE user_id = ?
    ORDER BY book_id ASC
  `, userId);

  return res.status(201).json({ items });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const id = Number(req.params.id);
  const db = await getDb();
  const result = await db.run('DELETE FROM cart_items WHERE user_id = ? AND book_id = ?', userId, id);

  if (!result.changes) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  const items = await db.all(`
    SELECT
      book_id AS bookId,
      quantity,
      title,
      price,
      original,
      image
    FROM cart_items
    WHERE user_id = ?
    ORDER BY book_id ASC
  `, userId);
  return res.json({ items });
});

router.delete('/', requireAuth, async (req, res) => {
  const userId = Number(req.user.id);
  const db = await getDb();
  await db.run('DELETE FROM cart_items WHERE user_id = ?', userId);
  return res.json({ items: [] });
});

module.exports = router;

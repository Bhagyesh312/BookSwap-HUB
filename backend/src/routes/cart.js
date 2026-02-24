const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (_req, res) => {
  const db = await getDb();
  const items = await db.all(`
    SELECT
      book_id AS bookId,
      quantity,
      title,
      price,
      original,
      image
    FROM cart
    ORDER BY book_id ASC
  `);
  res.json({ items });
});

router.post('/', async (req, res) => {
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
    INSERT INTO cart (book_id, quantity, title, price, original, image)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(book_id) DO UPDATE SET
      quantity = cart.quantity + excluded.quantity,
      title = excluded.title,
      price = excluded.price,
      original = excluded.original,
      image = excluded.image
  `,
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
    FROM cart
    ORDER BY book_id ASC
  `);

  return res.status(201).json({ items });
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const db = await getDb();
  const result = await db.run('DELETE FROM cart WHERE book_id = ?', id);

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
    FROM cart
    ORDER BY book_id ASC
  `);
  return res.json({ items });
});

router.delete('/', async (_req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM cart');
  return res.json({ items: [] });
});

module.exports = router;

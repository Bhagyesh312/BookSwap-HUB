const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (_req, res) => {
  const db = await getDb();
  const books = await db.all('SELECT * FROM books ORDER BY id ASC');
  res.json({ items: books });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const db = await getDb();
  const book = await db.get('SELECT * FROM books WHERE id = ?', id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  return res.json(book);
});

module.exports = router;

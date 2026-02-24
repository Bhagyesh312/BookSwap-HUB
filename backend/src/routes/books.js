const express = require('express');
const { books } = require('../data');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ items: books });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((item) => item.id === id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  return res.json(book);
});

module.exports = router;

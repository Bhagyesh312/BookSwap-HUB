const express = require('express');
const { cart, books } = require('../data');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ items: cart });
});

router.post('/', (req, res) => {
  const { bookId, quantity = 1, title, price, original, image } = req.body || {};
  const id = Number(bookId);
  const qty = Number(quantity);

  if (!id || qty < 1) {
    return res.status(400).json({ error: 'bookId and quantity (>=1) are required' });
  }

  const book = books.find((item) => item.id === id);

  const itemTitle = book?.title || title;
  const itemPrice = Number(book?.price ?? price);
  const itemOriginal = Number(book?.original ?? original ?? itemPrice);
  const itemImage = book?.image || image || '';

  if (!itemTitle || Number.isNaN(itemPrice) || itemPrice <= 0) {
    return res.status(400).json({ error: 'Valid title and price are required when book is not in catalog' });
  }

  const existing = cart.find((item) => item.bookId === id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      bookId: id,
      quantity: qty,
      title: itemTitle,
      price: itemPrice,
      original: Number.isNaN(itemOriginal) ? itemPrice : itemOriginal,
      image: itemImage
    });
  }

  return res.status(201).json({ items: cart });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = cart.findIndex((item) => item.bookId === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Cart item not found' });
  }

  cart.splice(index, 1);
  return res.json({ items: cart });
});

router.delete('/', (_req, res) => {
  cart.splice(0, cart.length);
  return res.json({ items: cart });
});

module.exports = router;

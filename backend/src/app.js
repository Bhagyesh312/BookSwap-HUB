const express = require('express');
const cors = require('cors');
const booksRouter = require('./routes/books');
const cartRouter = require('./routes/cart');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'bookswap-backend' });
});

app.use('/api/books', booksRouter);
app.use('/api/cart', cartRouter);
app.use('/api/auth', authRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

module.exports = app;

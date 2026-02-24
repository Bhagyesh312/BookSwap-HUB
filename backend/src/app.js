const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const booksRouter = require('./routes/books');
const cartRouter = require('./routes/cart');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');

const app = express();

// ===== LOGGING CONFIGURATION =====
// Custom token for request ID tracking
morgan.token('reqId', (req) => req.requestId || '-');

// ===== MIDDLEWARE STACK =====
// Enable CORS for frontend requests
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true
}));

// Security headers (XSS, CSRF, Clickjacking protection)
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Attach unique request ID to each request for logging and debugging
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// HTTP request logging with custom format including request IDs
app.use(morgan(':method :url :status :response-time ms reqId=:reqId'));

// Parse JSON request bodies (max 200KB)
app.use(express.json({ limit: '200kb' }));

// ===== ROUTES =====
// Health check endpoint for deployment verification
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'bookswap-backend',
    timestamp: new Date().toISOString()
  });
});

// API route handlers
app.use('/api/books', booksRouter);      // Book listing and search
app.use('/api/cart', cartRouter);        // Shopping cart (requires auth)
app.use('/api/auth', authRouter);        // User registration, login, profile (some require auth)
app.use('/api/orders', ordersRouter);    // Order management (requires auth)

// ===== ERROR HANDLING =====
// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId
  });
});

// Global error handler (must be last)
app.use((error, req, res, _next) => {
  const status = Number(error?.status || error?.statusCode || 500);
  const safeMessage = status >= 500 ? 'Internal server error' : (error.message || 'Request failed');

  console.error(`[${req.requestId}]`, error);

  res.status(status).json({
    error: safeMessage,
    requestId: req.requestId
  });
});

module.exports = app;

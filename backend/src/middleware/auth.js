const jwt = require('jsonwebtoken');

// JWT secret key for token signing and verification
// IMPORTANT: Change this in production to a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'bookswap-dev-secret-change-in-production';

/**
 * Authentication middleware - verifies JWT token
 * Extracts the Bearer token from Authorization header and validates it
 * Sets req.user with decoded payload on success, returns 401 on failure
 * 
 * @param {Object} req - Express request object
 * @param {Object} _res - Express response object (unused parameter)
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success or returns error to next error handler
 */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  // Check for missing or malformed Bearer token
  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Authentication required');
    error.status = 401;
    return next(error);
  }

  try {
    // Verify token and extract user data from JWT payload
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: Number(payload.sub),      // User ID from 'sub' claim
      email: payload.email,          // User email from payload
      name: payload.name             // User name from payload
    };
    return next();
  } catch (_err) {
    // Token is invalid or expired
    const error = new Error('Invalid or expired token');
    error.status = 401;
    return next(error);
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET
};

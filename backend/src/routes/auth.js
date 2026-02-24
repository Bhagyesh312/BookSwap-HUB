const express = require('express');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  return res.json({
    token: 'dev-token-bookswap',
    user: {
      id: 1,
      name: 'BookSwap User',
      email
    }
  });
});

module.exports = router;

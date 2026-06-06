const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes — no token needed
router.post('/register', register);
router.post('/login', login);

// Protected route — authenticate runs first, then me
router.get('/me', authenticate, me);

module.exports = router;
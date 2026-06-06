const express = require('express');
const router = express.Router();
const { completeSection } = require('../controllers/coursesController');
const { authenticate } = require('../middleware/auth');

router.post('/:id/complete', authenticate, completeSection);

module.exports = router;
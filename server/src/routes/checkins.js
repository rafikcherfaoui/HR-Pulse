const express = require('express');
const router = express.Router();
const {
  submitCheckin,
  getMyCheckins,
  getTeamCheckins,
  flagCheckin,
  getTrends,
  getFlaggedCheckins,
} = require('../controllers/checkinsController');
const { authenticate, roleGuard } = require('../middleware/auth');

// Specific routes before param routes
router.get('/me', authenticate, getMyCheckins);
router.get('/team', authenticate, roleGuard('supervisor', 'hr_admin'), getTeamCheckins);
router.get('/trends', authenticate, roleGuard('hr_admin'), getTrends);
router.get('/flagged', authenticate, roleGuard('supervisor', 'hr_admin'), getFlaggedCheckins);

router.post('/', authenticate, submitCheckin);
router.put('/:id/flag', authenticate, roleGuard('supervisor', 'hr_admin'), flagCheckin);

module.exports = router;
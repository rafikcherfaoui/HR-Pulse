const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, getUserXP, getSupervisors } = require('../controllers/usersController');
const { authenticate, roleGuard } = require('../middleware/auth');

router.get('/supervisors', authenticate, roleGuard('hr_admin'), getSupervisors);
router.get('/', authenticate, roleGuard('hr_admin'), getAllUsers);
router.put('/:id/role', authenticate, roleGuard('hr_admin'), updateUser);
router.get('/:id/xp', authenticate, getUserXP);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  completeSection,
  getMyCourses,
  getAllProgress,
} = require('../controllers/coursesController');
const { authenticate, roleGuard } = require('../middleware/auth');

// ── All authenticated ───────────────────────────────────
// Important: specific routes like /my must come BEFORE /:id
// otherwise Express matches "my" as an id param
router.get('/my', authenticate, getMyCourses);
router.get('/progress/all', authenticate, roleGuard('hr_admin'), getAllProgress);
router.get('/', authenticate, getAllCourses);
router.get('/:id', authenticate, getCourseById);

// ── HR Admin only ───────────────────────────────────────
router.post('/', authenticate, roleGuard('hr_admin'), createCourse);
router.put('/:id', authenticate, roleGuard('hr_admin'), updateCourse);
router.delete('/:id', authenticate, roleGuard('hr_admin'), deleteCourse);

// ── Employee / Supervisor ───────────────────────────────
router.post('/:id/enroll', authenticate, enrollInCourse);

module.exports = router;
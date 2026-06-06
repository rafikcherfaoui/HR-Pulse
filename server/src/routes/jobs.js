const express = require('express');
const router = express.Router();
const {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getAllApplications,
  updateApplicationStatus,
} = require('../controllers/jobsController');
const { authenticate, roleGuard } = require('../middleware/auth');

// ── Public routes ──────────────────────────────────────
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/:id/apply', applyToJob);

// ── HR Admin only ──────────────────────────────────────
router.post('/', authenticate, roleGuard('hr_admin'), createJob);
router.put('/:id', authenticate, roleGuard('hr_admin'), updateJob);
router.delete('/:id', authenticate, roleGuard('hr_admin'), deleteJob);

// ── Applications ───────────────────────────────────────
router.get('/applications/all', authenticate, roleGuard('hr_admin'), getAllApplications);
router.put('/applications/:id/status', authenticate, roleGuard('hr_admin'), updateApplicationStatus);

module.exports = router;
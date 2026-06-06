const pool = require('../db/db');

// GET /api/jobs — public, anyone can see open jobs
const getAllJobs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT j.*, u.name AS posted_by
       FROM job_postings j
       JOIN users u ON j.created_by = u.id
       ORDER BY j.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/jobs/:id — public
const getJobById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT j.*, u.name AS posted_by
       FROM job_postings j
       JOIN users u ON j.created_by = u.id
       WHERE j.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/jobs — hr_admin only
const createJob = async (req, res) => {
  const { title, description, location } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO job_postings (title, description, location, created_by) VALUES (?, ?, ?, ?)',
      [title, description, location || null, req.user.id]
    );
    res.status(201).json({ message: 'Job posting created.', jobId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/jobs/:id — hr_admin only
const updateJob = async (req, res) => {
  const { title, description, location, status } = req.body;

  try {
    // Only update fields that were actually sent
    const [result] = await pool.query(
      `UPDATE job_postings
       SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         location = COALESCE(?, location),
         status = COALESCE(?, status)
       WHERE id = ?`,
      [title, description, location, status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json({ message: 'Job updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/jobs/:id — hr_admin only
const deleteJob = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM job_postings WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.json({ message: 'Job deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/jobs/:id/apply — public, no auth needed
const applyToJob = async (req, res) => {
  const { applicant_name, applicant_email, cover_letter } = req.body;

  if (!applicant_name || !applicant_email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    // Make sure the job exists and is open
    const [job] = await pool.query(
      'SELECT id, status FROM job_postings WHERE id = ?',
      [req.params.id]
    );
    if (job.length === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (job[0].status === 'closed') {
      return res.status(400).json({ message: 'This job is no longer accepting applications.' });
    }

    const [result] = await pool.query(
      'INSERT INTO applications (job_posting_id, applicant_name, applicant_email, cover_letter) VALUES (?, ?, ?, ?)',
      [req.params.id, applicant_name, applicant_email, cover_letter || null]
    );
    res.status(201).json({ message: 'Application submitted successfully.', applicationId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/applications — hr_admin only, see all applications
const getAllApplications = async (req, res) => {
  try {
    // Optional filter by job_posting_id via query param: /api/applications?jobId=2
    const jobId = req.query.jobId;
    let query = `
      SELECT a.*, j.title AS job_title
      FROM applications a
      JOIN job_postings j ON a.job_posting_id = j.id
    `;
    const params = [];

    if (jobId) {
      query += ' WHERE a.job_posting_id = ?';
      params.push(jobId);
    }

    query += ' ORDER BY a.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/applications/:id/status — hr_admin only
const updateApplicationStatus = async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['applied', 'reviewing', 'interview', 'offer', 'hired', 'rejected'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      'UPDATE applications SET status = ?, notes = COALESCE(?, notes) WHERE id = ?',
      [status, notes, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    res.json({ message: 'Application status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
  getAllApplications,
  updateApplicationStatus,
};
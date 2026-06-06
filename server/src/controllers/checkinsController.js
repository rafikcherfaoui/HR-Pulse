const pool = require('../db/db');

// POST /api/checkins — employee or supervisor submits a check-in
const submitCheckin = async (req, res) => {
  const { mood, energy, note } = req.body;

  if (!mood || !energy) {
    return res.status(400).json({ message: 'Mood and energy are required.' });
  }
  if (mood < 1 || mood > 5 || energy < 1 || energy > 5) {
    return res.status(400).json({ message: 'Mood and energy must be between 1 and 5.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO checkins (user_id, mood, energy, note) VALUES (?, ?, ?, ?)',
      [req.user.id, mood, energy, note || null]
    );

    // Award XP for submitting a check-in
    await pool.query(
      'INSERT INTO xp_events (user_id, points, reason) VALUES (?, ?, ?)',
      [req.user.id, 5, 'checkin_submitted']
    );

    res.status(201).json({ message: 'Check-in submitted.', checkinId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/checkins/me — authenticated user sees their own history
const getMyCheckins = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM checkins
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/checkins/team — supervisor sees their team, hr_admin sees everyone
const getTeamCheckins = async (req, res) => {
  try {
    let rows;

    if (req.user.role === 'hr_admin') {
      // HR admin sees all check-ins from all users
      [rows] = await pool.query(
        `SELECT c.*, u.name AS user_name, u.department
         FROM checkins c
         JOIN users u ON c.user_id = u.id
         ORDER BY c.created_at DESC`
      );
    } else {
      // Supervisor only sees check-ins from users assigned to them
      [rows] = await pool.query(
        `SELECT c.*, u.name AS user_name, u.department
         FROM checkins c
         JOIN users u ON c.user_id = u.id
         WHERE u.supervisor_id = ?
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/checkins/:id/flag — supervisor or hr_admin flags a check-in
const flagCheckin = async (req, res) => {
  try {
    // First fetch the check-in to verify access rights
    const [checkinRows] = await pool.query(
      `SELECT c.*, u.supervisor_id
       FROM checkins c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (checkinRows.length === 0) {
      return res.status(404).json({ message: 'Check-in not found.' });
    }

    const checkin = checkinRows[0];

    // Supervisor can only flag check-ins from their own team
    if (
      req.user.role === 'supervisor' &&
      checkin.supervisor_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'You can only flag your own team members.' });
    }

    // Toggle the flag — if it was flagged, unflag it and vice versa
    const newFlagState = !checkin.flagged;
    await pool.query(
      'UPDATE checkins SET flagged = ? WHERE id = ?',
      [newFlagState, req.params.id]
    );

    res.json({
      message: newFlagState ? 'Check-in flagged.' : 'Check-in unflagged.',
      flagged: newFlagState,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/checkins/trends — hr_admin sees weekly mood/energy averages
const getTrends = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         YEAR(created_at) AS year,
         WEEK(created_at, 1) AS week,
         ROUND(AVG(mood), 2) AS avg_mood,
         ROUND(AVG(energy), 2) AS avg_energy,
         COUNT(*) AS total_checkins,
         MIN(created_at) AS week_start
       FROM checkins
       GROUP BY YEAR(created_at), WEEK(created_at, 1)
       ORDER BY year DESC, week DESC
       LIMIT 12`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/checkins/flagged — hr_admin and supervisors see flagged check-ins
const getFlaggedCheckins = async (req, res) => {
  try {
    let rows;

    if (req.user.role === 'hr_admin') {
      [rows] = await pool.query(
        `SELECT c.*, u.name AS user_name, u.department
         FROM checkins c
         JOIN users u ON c.user_id = u.id
         WHERE c.flagged = TRUE
         ORDER BY c.created_at DESC`
      );
    } else {
      [rows] = await pool.query(
        `SELECT c.*, u.name AS user_name, u.department
         FROM checkins c
         JOIN users u ON c.user_id = u.id
         WHERE c.flagged = TRUE AND u.supervisor_id = ?
         ORDER BY c.created_at DESC`,
        [req.user.id]
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  submitCheckin,
  getMyCheckins,
  getTeamCheckins,
  flagCheckin,
  getTrends,
  getFlaggedCheckins,
};
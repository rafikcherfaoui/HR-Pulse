const pool = require('../db/db');

// GET /api/users — hr_admin sees all users
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.role, u.department, u.created_at,
         s.name AS supervisor_name
       FROM users u
       LEFT JOIN users s ON u.supervisor_id = s.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/users/:id/role — hr_admin updates a user's role or supervisor
const updateUser = async (req, res) => {
  const { role, supervisor_id, department } = req.body;
  const validRoles = ['employee', 'supervisor', 'hr_admin'];

  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      `UPDATE users
       SET
         role = COALESCE(?, role),
         supervisor_id = COALESCE(?, supervisor_id),
         department = COALESCE(?, department)
       WHERE id = ?`,
      [role, supervisor_id, department, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/:id/xp — get a user's total XP and event log
const getUserXP = async (req, res) => {
  // Users can only see their own XP unless they are hr_admin
  if (req.user.role !== 'hr_admin' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Forbidden.' });
  }

  try {
    const [events] = await pool.query(
      `SELECT * FROM xp_events WHERE user_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );

    const total = events.reduce((sum, e) => sum + e.points, 0);

    res.json({ total_xp: total, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/users/supervisors — hr_admin gets list of supervisors (for dropdowns)
const getSupervisors = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, department FROM users WHERE role = 'supervisor' ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getAllUsers, updateUser, getUserXP, getSupervisors };
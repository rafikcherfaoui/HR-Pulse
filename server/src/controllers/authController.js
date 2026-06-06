const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, department } = req.body;

  // Basic validation — make sure required fields exist
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    // Check if this email is already registered
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    // Hash the password — never store plain text passwords
    // The 10 is the "salt rounds" — higher = more secure but slower
    const password_hash = await bcrypt.hash(password, 10);

    // Insert the new user — role defaults to 'employee' in the schema
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, department) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, department || null]
    );

    res.status(201).json({ message: 'Account created successfully.', userId: result.insertId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user by email
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    const user = rows[0];

    // Don't reveal whether the email exists — just say "invalid credentials"
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the submitted password against the stored hash
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Build the JWT payload — only include what you need
    // This gets embedded in the token and decoded on every request
    const payload = { id: user.id, email: user.email, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Send back the token and basic user info
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/me  — requires authenticate middleware
const me = async (req, res) => {
  try {
    // req.user was attached by the authenticate middleware
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, me };
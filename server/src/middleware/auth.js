const jwt = require('jsonwebtoken');

// This function runs before any protected route handler
const authenticate = (req, res, next) => {

  // The token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // No token at all — reject immediately
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using our secret key
    // If it's valid, decoded will contain { id, role, email }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request so route handlers can use it
    req.user = decoded;

    // Move on to the actual route handler
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role guard — call this after authenticate
// Usage: roleGuard('hr_admin') or roleGuard('hr_admin', 'supervisor')
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. You do not have permission.' });
    }
    next();
  };
};

module.exports = { authenticate, roleGuard };
const crypto = require('crypto');

// Hash password with SHA512
function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

// Verify password
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Middleware to check if user is authenticated
async function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
}

// Middleware to check if user is admin
async function isAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  isAuthenticated,
  isAdmin
};

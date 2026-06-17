const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../middleware/auth');

// Register new user (FT-1)
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate username (only letters and numbers)
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ success: false, message: 'Username must contain only letters and numbers' });
    }

    // Validate password (min 8 chars, 1 uppercase, 1 special char)
    if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters, contain 1 uppercase letter and 1 special character' 
      });
    }

    const connection = await pool.getConnection();
    
    // Check if username or email already exists
    const [existingUser] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password and insert user
    const passwordHash = hashPassword(password);
    await connection.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    connection.release();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

// Login user (FT-2)
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing identifier or password' });
    }

    const connection = await pool.getConnection();

    // Find user by username or email
    const [users] = await connection.query(
      'SELECT id, username, password_hash, role, is_banned FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned' });
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login and set session
    const connection2 = await pool.getConnection();
    await connection2.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    connection2.release();

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

// Logout
async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
}

// Get current user
function getCurrentUser(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  res.json({
    success: true,
    user: {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role
    }
  });
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};

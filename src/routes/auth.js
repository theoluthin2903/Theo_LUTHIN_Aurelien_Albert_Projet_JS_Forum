const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authCtrl');
const { isAuthenticated } = require('../middleware/auth');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/logout', authCtrl.logout);
router.get('/current', isAuthenticated, authCtrl.getCurrentUser);

module.exports = router;

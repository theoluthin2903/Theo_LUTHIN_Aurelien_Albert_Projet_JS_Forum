const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userCtrl');
const { isAuthenticated } = require('../middleware/auth');

router.get('/:userId', userCtrl.getUserProfile);
router.put('/profile', isAuthenticated, userCtrl.updateUserProfile);

module.exports = router;

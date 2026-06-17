const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminCtrl');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/ban-user', isAuthenticated, isAdmin, adminCtrl.banUser);
router.put('/topic-state', isAuthenticated, isAdmin, adminCtrl.updateTopicState);
router.delete('/topic', isAuthenticated, isAdmin, adminCtrl.deleteTopic);
router.delete('/message', isAuthenticated, isAdmin, adminCtrl.deleteMessage);
router.get('/stats', isAuthenticated, isAdmin, adminCtrl.getDashboardStats);
router.get('/users', isAuthenticated, isAdmin, adminCtrl.getAllUsers);

module.exports = router;

const express = require('express');
const router = express.Router();
const friendCtrl = require('../controllers/friendCtrl');
const { isAuthenticated } = require('../middleware/auth');

router.post('/request', isAuthenticated, friendCtrl.sendFriendRequest);
router.post('/accept', isAuthenticated, friendCtrl.acceptFriendRequest);
router.post('/reject', isAuthenticated, friendCtrl.rejectFriendRequest);
router.get('/list', isAuthenticated, friendCtrl.getUserFriends);
router.get('/requests/pending', isAuthenticated, friendCtrl.getPendingRequests);

module.exports = router;

const express = require('express');
const router = express.Router();
const messageCtrl = require('../controllers/messageCtrl');
const { isAuthenticated } = require('../middleware/auth');

router.post('/', isAuthenticated, messageCtrl.createMessage);
router.get('/', messageCtrl.getMessages);
router.post('/vote', isAuthenticated, messageCtrl.voteMessage);
router.delete('/:id', isAuthenticated, messageCtrl.deleteMessage);

module.exports = router;

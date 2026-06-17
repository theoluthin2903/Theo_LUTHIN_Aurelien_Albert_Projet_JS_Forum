const express = require('express');
const router = express.Router();
const topicCtrl = require('../controllers/topicCtrl');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.post('/', isAuthenticated, topicCtrl.createTopic);
router.get('/', topicCtrl.getTopics);
router.get('/:id', topicCtrl.getTopic);
router.put('/:id', isAuthenticated, topicCtrl.updateTopic);
router.delete('/:id', isAuthenticated, topicCtrl.deleteTopic);

module.exports = router;

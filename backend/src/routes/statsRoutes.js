const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/me', statsController.getMemberStats);
router.get('/reports', authorize('admin'), statsController.getReportsStats);
router.get('/', authorize('admin'), statsController.getDashboardStats);

module.exports = router;

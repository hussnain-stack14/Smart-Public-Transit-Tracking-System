const express = require('express');
const router = express.Router();
const {
  getFleetOverview,
  getBookingsAnalytics,
  getOccupancyByRoute,
  getReportsSummary,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Every route here is admin-only — this whole file is the dashboard's data layer
router.use(protect, authorize('admin'));

router.get('/overview', getFleetOverview);
router.get('/analytics/bookings', getBookingsAnalytics);
router.get('/analytics/occupancy', getOccupancyByRoute);
router.get('/analytics/reports', getReportsSummary);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/me', protect, getMyBookings);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
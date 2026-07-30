const express = require('express');
const router = express.Router();
const {
  createBus,
  getBuses,
  getBusById,
  updateBusLocation,
  updateSeatAvailability,
  updateBus,
  deleteBus,
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBuses);
router.get('/:id', getBusById);
router.post('/', protect, authorize('admin'), createBus);
router.patch('/:id/location', protect, authorize('driver'), updateBusLocation);
router.patch('/:id/seats', protect, authorize('driver', 'admin'), updateSeatAvailability);
router.put('/:id', protect, authorize('admin'), updateBus);
router.delete('/:id', protect, authorize('admin'), deleteBus);

module.exports = router;
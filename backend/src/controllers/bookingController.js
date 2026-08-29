const Booking = require('../models/Booking');
const Bus = require('../models/Bus');

// @route   POST /api/bookings
// @desc    Create a seat booking on a bus (decrements available seats)
// @access  Private (any logged-in user)
const createBooking = async (req, res) => {
  try {
    const { bus, seatNumber, fare } = req.body;
    const userId = req.user._id; // set by the `protect` middleware

    if (!bus) {
      return res.status(400).json({ message: 'bus is required' });
    }

    const busDoc = await Bus.findById(bus);
    if (!busDoc) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    if (busDoc.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available on this bus' });
    }

    const booking = await Booking.create({
      user: userId,
      bus,
      seatNumber: seatNumber || null,
      fare: fare || 0,
    });

    // Decrement seat count since a seat was just taken
    busDoc.availableSeats -= 1;
    await busDoc.save();

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating booking', error: err.message });
  }
};

// @route   GET /api/bookings/me
// @desc    Get the logged-in user's own bookings
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('bus', 'busNumber route')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching bookings', error: err.message });
  }
};

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking (releases the seat back to the bus)
// @access  Private (only the user who owns the booking)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the user who made the booking can cancel it
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release the seat back to the bus
    await Bus.findByIdAndUpdate(booking.bus, { $inc: { availableSeats: 1 } });

    res.status(200).json({ message: 'Booking cancelled', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error cancelling booking', error: err.message });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking };
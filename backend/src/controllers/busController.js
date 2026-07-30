const Bus = require('../models/Bus');

// @route   POST /api/buses
const createBus = async (req, res) => {
  try {
    const { busNumber, route, driver, capacity } = req.body;

    if (!busNumber || !route || capacity == null) {
      return res.status(400).json({ message: 'busNumber, route, and capacity are required' });
    }

    const bus = await Bus.create({
      busNumber,
      route,
      driver: driver || null,
      capacity,
      availableSeats: capacity,
    });

    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating bus', error: err.message });
  }
};

// @route   GET /api/buses
const getBuses = async (req, res) => {
  try {
    const filter = {};
    if (req.query.route) filter.route = req.query.route;

    const buses = await Bus.find(filter)
      .populate('route', 'routeName')
      .populate('driver', 'name phone');

    res.status(200).json(buses);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching buses', error: err.message });
  }
};

// @route   GET /api/buses/:id
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('route', 'routeName')
      .populate('driver', 'name phone');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching bus', error: err.message });
  }
};

// @route   PATCH /api/buses/:id/location
const updateBusLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { latitude, longitude },
        lastLocationUpdate: new Date(),
        status: 'active',
      },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating bus location', error: err.message });
  }
};

// @route   PATCH /api/buses/:id/seats
const updateSeatAvailability = async (req, res) => {
  try {
    const { availableSeats } = req.body;

    if (availableSeats == null) {
      return res.status(400).json({ message: 'availableSeats is required' });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { availableSeats },
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating seat availability', error: err.message });
  }
};

// @route   PUT /api/buses/:id
const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.status(200).json(bus);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating bus', error: err.message });
  }
};

// @route   DELETE /api/buses/:id
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.status(200).json({ message: 'Bus deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting bus', error: err.message });
  }
};

module.exports = {
  createBus,
  getBuses,
  getBusById,
  updateBusLocation,
  updateSeatAvailability,
  updateBus,
  deleteBus,
};
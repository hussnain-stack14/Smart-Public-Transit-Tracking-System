const Bus = require('../models/Bus');
const Stop = require('../models/Stop');
const { haversineDistanceKm } = require('../utils/geo');

// How close (in km) the bus must get to a stop before we consider it
// "reached" and advance to the next one. ~50 meters.
const ARRIVAL_THRESHOLD_KM = 0.05;

// A sensible fallback speed (km/h) to use for ETA when we don't have
// any real speed readings yet (e.g. right after a bus starts its shift).
const DEFAULT_SPEED_KMH = 20;

// Works out the next stop for a bus and the ETA to it, in minutes.
// This is the core of the ETA Estimation Module from the proposal:
// - finds the next stop in sequence past currentStopIndex
// - measures straight-line distance from the bus's current location
// - divides by a 5-reading moving average of recent speeds
const calculateNextStopAndETA = async (bus) => {
  const stops = await Stop.find({ route: bus.route }).sort({ stopOrder: 1 });

  if (stops.length === 0 || bus.currentLocation.latitude == null) {
    return { nextStop: null, distanceKm: null, etaMinutes: null };
  }

  let nextStop = stops[bus.currentStopIndex] || null;

  // If the bus is already within range of its current target stop,
  // advance to the one after it (this is what "detects arrival" means).
  if (nextStop) {
    const distToCurrentTarget = haversineDistanceKm(
      bus.currentLocation.latitude,
      bus.currentLocation.longitude,
      nextStop.latitude,
      nextStop.longitude
    );

    if (distToCurrentTarget <= ARRIVAL_THRESHOLD_KM && bus.currentStopIndex < stops.length - 1) {
      bus.currentStopIndex += 1;
      nextStop = stops[bus.currentStopIndex];
    }
  }

  if (!nextStop) {
    // Bus has passed the last stop on the route
    return { nextStop: null, distanceKm: 0, etaMinutes: 0 };
  }

  const distanceKm = haversineDistanceKm(
    bus.currentLocation.latitude,
    bus.currentLocation.longitude,
    nextStop.latitude,
    nextStop.longitude
  );

  const avgSpeed =
    bus.recentSpeeds.length > 0
      ? bus.recentSpeeds.reduce((sum, s) => sum + s, 0) / bus.recentSpeeds.length
      : DEFAULT_SPEED_KMH;

  const etaMinutes = avgSpeed > 0 ? (distanceKm / avgSpeed) * 60 : null;

  return {
    nextStop: { _id: nextStop._id, stopName: nextStop.stopName, stopOrder: nextStop.stopOrder },
    distanceKm: Math.round(distanceKm * 100) / 100,
    etaMinutes: etaMinutes != null ? Math.round(etaMinutes * 10) / 10 : null,
  };
};

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

// @route   GET /api/buses/:id/eta
// @desc    Get this bus's next stop and estimated time of arrival
// @access  Public
const getBusETA = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    const result = await calculateNextStopAndETA(bus);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error calculating ETA', error: err.message });
  }
};

// @route   PATCH /api/buses/:id/location
// @desc    Update a bus's live GPS location (called by the driver app).
//          Optionally accepts `speed` in km/h, as sent by the HTML5
//          Geolocation API on the driver's device.
// @access  Private (driver)
const updateBusLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    bus.currentLocation = { latitude, longitude };
    bus.lastLocationUpdate = new Date();
    bus.status = 'active';

    // Maintain a rolling window of the last 5 speed readings
    if (speed != null && !Number.isNaN(speed)) {
      bus.recentSpeeds.push(speed);
      if (bus.recentSpeeds.length > 5) {
        bus.recentSpeeds.shift(); // drop the oldest reading
      }
    }

    // This also advances bus.currentStopIndex if the bus has arrived
    const etaInfo = await calculateNextStopAndETA(bus);

    await bus.save();

    // Broadcast this update (now including ETA) to anyone watching this bus
    const io = req.app.get('io');
    io.to(`bus:${bus._id}`).emit('locationUpdate', {
      busId: bus._id,
      latitude,
      longitude,
      lastLocationUpdate: bus.lastLocationUpdate,
      status: bus.status,
      ...etaInfo,
    });

    res.status(200).json({ ...bus.toObject(), ...etaInfo });
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
  getBusETA,
  updateBusLocation,
  updateSeatAvailability,
  updateBus,
  deleteBus,
};
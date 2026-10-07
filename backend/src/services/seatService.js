const Bus = require('../models/Bus');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { ApiError } = require('../utils/apiError');
const { assertObjectId } = require('../utils/accountValidation');
const { runInTransaction } = require('./transactionService');

function sectionForLabel(label) {
  if (/^G\d/i.test(label)) return 'gents';
  if (/^W\d/i.test(label)) return 'ladies';
  return 'general';
}

function sectionCounts(seats) {
  return seats.reduce((counts, seat) => {
    if (seat.section === 'gents' || seat.section === 'ladies') counts[seat.section] += 1;
    return counts;
  }, { gents: 0, ladies: 0 });
}

function normalizeSeatSections({ gentsSeats, ladiesSeats }, capacity) {
  const supplied = gentsSeats !== undefined || ladiesSeats !== undefined;
  if (!supplied) return null;
  if (gentsSeats === undefined || ladiesSeats === undefined) {
    throw new ApiError(400, 'Provide both gents and ladies seat counts to configure sections.');
  }
  if (!Number.isInteger(gentsSeats) || !Number.isInteger(ladiesSeats) || gentsSeats < 0 || ladiesSeats < 0 || gentsSeats + ladiesSeats !== capacity) {
    throw new ApiError(400, 'Gents and ladies seat counts must be whole numbers that add up to total capacity.');
  }
  return { gents: gentsSeats, ladies: ladiesSeats };
}

function buildSectionSeatMap(sections) {
  const seats = [];
  let row = 0;
  for (const [section, prefix, count] of [['gents', 'G', sections.gents], ['ladies', 'W', sections.ladies]]) {
    for (let index = 0; index < count; index += 1) {
      const column = [0, 1, 3, 4][index % 4];
      seats.push({ label: `${prefix}${String(index + 1).padStart(2, '0')}`, row, column, section, status: 'available', booking: null });
      if (index % 4 === 3) row += 1;
    }
    if (count % 4) row += 1;
  }
  return seats;
}

function parseSeatLayout(value, capacity, expectedSections = null) {
  if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, 'Seat layout must contain labelled rows. Use _ for an aisle or empty position.');
  const rows = value.trim().split(/\r?\n/).map((row) => row.split(',').map((cell) => cell.trim().toUpperCase()));
  if (rows.length > 40 || rows.some((row) => row.length > 6 || row.some((cell) => !cell || (cell !== '_' && !/^[A-Z0-9-]{1,12}$/.test(cell))))) {
    throw new ApiError(400, 'Seat layout must have at most 40 rows and 6 comma-separated positions per row.');
  }
  const seats = rows.flatMap((row, rowIndex) => row.flatMap((label, column) => label === '_' ? [] : [{ label, row: rowIndex, column, section: sectionForLabel(label), status: 'available', booking: null }]));
  if (!seats.length || seats.length > 100 || seats.length !== capacity || new Set(seats.map((seat) => seat.label)).size !== seats.length) {
    throw new ApiError(400, 'Seat labels must be unique and their count must match capacity (maximum 100).');
  }
  if (expectedSections) {
    const actual = sectionCounts(seats);
    if (actual.gents !== expectedSections.gents || actual.ladies !== expectedSections.ladies || seats.some((seat) => seat.section === 'general')) {
      throw new ApiError(400, 'Sectioned layouts must use G01… labels for gents and W01… labels for ladies, matching the configured counts.');
    }
  }
  return seats;
}

function publicSeatMap(bus) {
  return (bus.seatMap || []).map(({ label, row, column, section, status }) => ({ label, row, column, section: section || sectionForLabel(label), status }));
}

function seatCount(bus) {
  return bus.seatMap.filter((seat) => seat.status === 'available').length;
}

function publicBus(bus) {
  const result = bus.toObject ? bus.toObject() : { ...bus };
  result.seatMap = publicSeatMap(bus);
  return result;
}

function emitSeatUpdate(io, bus) {
  if (!io || !bus) return;
  const payload = { busId: bus._id, capacity: bus.capacity, availableSeats: bus.availableSeats, seatMap: publicSeatMap(bus) };
  io.to(`bus:${bus._id}`).emit('seatMapUpdate', payload);
  io.to(`bus:${bus._id}`).emit('occupancyUpdate', { busId: bus._id, capacity: bus.capacity, availableSeats: bus.availableSeats });
}

async function emitSeatUpdateById(io, busId) {
  if (!io || !busId) return;
  const bus = await Bus.findById(busId);
  if (bus) emitSeatUpdate(io, bus);
}

async function changeManualSeat(busId, driverId, label, action) {
  assertObjectId(busId, 'Bus ID');
  if (!['occupy', 'release'].includes(action)) throw new ApiError(400, 'Action must be occupy or release.');
  const normalized = typeof label === 'string' ? label.trim().toUpperCase() : '';
  if (!normalized) throw new ApiError(400, 'Seat label is required.');
  return runInTransaction(async (session) => {
    const driver = await User.findOne({ _id: driverId, role: 'driver', assignedBus: busId }).select('_id').session(session);
    const bus = await Bus.findOne({ _id: busId, driver: driverId, status: 'active' }).session(session);
    if (!driver || !bus) throw new ApiError(403, 'Only the assigned driver can manage this bus.');
    const shift = await Shift.exists({ driver: driverId, bus: busId, route: bus.route, status: 'active' }).session(session);
    if (!shift) throw new ApiError(409, 'Start an active shift before managing seats.');
    if (!bus.seatMap?.length) throw new ApiError(409, 'An administrator must configure this bus seat layout first.');
    const seat = bus.seatMap.find((item) => item.label === normalized);
    if (!seat) throw new ApiError(404, 'Seat not found on this bus.');
    if (action === 'occupy' && seat.status !== 'available') throw new ApiError(409, 'This seat is not available. Online bookings cannot be overwritten.');
    if (action === 'release' && seat.status !== 'occupied') throw new ApiError(409, 'Only manually occupied seats can be released here.');
    seat.status = action === 'occupy' ? 'occupied' : 'available';
    seat.booking = null;
    bus.availableSeats = seatCount(bus);
    await bus.save({ session });
    return bus;
  });
}

module.exports = { parseSeatLayout, normalizeSeatSections, buildSectionSeatMap, publicSeatMap, publicBus, seatCount, emitSeatUpdate, emitSeatUpdateById, changeManualSeat };

const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    stopName: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    location: { type: String, default: '', trim: true },
    identityKey: { type: String, trim: true },
    // Transitional fields for records written by older clients.
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', select: false },
    stopOrder: { type: Number, select: false },
  },
  { timestamps: true }
);

stopSchema.index({ identityKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Stop', stopSchema);

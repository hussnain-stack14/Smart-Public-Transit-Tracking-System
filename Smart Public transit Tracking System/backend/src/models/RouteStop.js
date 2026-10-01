const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema(
  {
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    stop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
    stopOrder: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

routeStopSchema.index({ route: 1, stop: 1 }, { unique: true });
routeStopSchema.index({ route: 1, stopOrder: 1 });

module.exports = mongoose.model('RouteStop', routeStopSchema);

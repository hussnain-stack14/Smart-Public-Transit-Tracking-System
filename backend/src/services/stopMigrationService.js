const Stop = require('../models/Stop');
const RouteStop = require('../models/RouteStop');
const { cleanText, stopIdentity } = require('./routeStopService');

async function migrateStops() {
  const documents = await Stop.find({}).select('+route +stopOrder').sort({ createdAt: 1, _id: 1 });
  const canonicalByIdentity = new Map();
  const stats = { inspected: documents.length, merged: 0, assignmentsCreated: 0, normalized: 0 };

  for (const document of documents) {
    const identityKey = stopIdentity(document);
    let canonical = canonicalByIdentity.get(identityKey);
    if (!canonical) {
      canonical = document;
      canonicalByIdentity.set(identityKey, canonical);
      await Stop.updateOne(
        { _id: canonical._id },
        { $set: { identityKey, location: cleanText(canonical.location) }, $unset: { route: 1, stopOrder: 1 } }
      );
      stats.normalized += 1;
    }

    if (document.route && document.stopOrder != null) {
      const result = await RouteStop.updateOne(
        { route: document.route, stop: canonical._id },
        { $setOnInsert: { stopOrder: document.stopOrder } },
        { upsert: true }
      );
      if (result.upsertedCount) stats.assignmentsCreated += 1;
    }

    if (!document._id.equals(canonical._id)) {
      const duplicateAssignments = await RouteStop.find({ stop: document._id });
      for (const assignment of duplicateAssignments) {
        await RouteStop.updateOne(
          { route: assignment.route, stop: canonical._id },
          { $setOnInsert: { stopOrder: assignment.stopOrder } },
          { upsert: true }
        );
      }
      await RouteStop.deleteMany({ stop: document._id });
      await Stop.deleteOne({ _id: document._id });
      stats.merged += 1;
    }
  }

  return stats;
}

module.exports = { migrateStops };

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { migrateStops } = require('../src/services/stopMigrationService');

async function main() {
  await connectDB();
  const stats = await migrateStops();
  console.log('Stop migration complete:', stats);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Stop migration failed:', error);
  await mongoose.disconnect();
  process.exitCode = 1;
});

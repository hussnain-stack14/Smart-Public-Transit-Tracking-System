require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// Make io accessible inside controllers via req.app.get('io')
app.set('io', io);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Public Transit Tracking System API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/route-alerts', require('./routes/routeAlertRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/safety', require('./routes/safetyRoutes'));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('watchBus', (busId) => {
    socket.join(`bus:${busId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) startServer();

// Tests can use the actual app and Socket.IO server with an isolated database.
module.exports = { app, server, io, startServer };

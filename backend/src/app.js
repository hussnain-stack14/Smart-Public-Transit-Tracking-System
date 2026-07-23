const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});
app.get('/about', (req, res) => {
  res.send('Server is running at about us !');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
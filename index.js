require('dotenv').config();
const express = require('express');
const { connectToDatabase, disconnectFromDatabase } = require('./db/connection');
const parkingRoutes = require('./routes/parkingRoutes');

const app = express();
app.use(express.json());

app.use('/api', parkingRoutes);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Parking-lot API listening on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectFromDatabase();
  process.exit(0);
});

module.exports = app;

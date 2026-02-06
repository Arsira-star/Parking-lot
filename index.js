const express = require('express');
const parkingRoutes = require('./routes/parkingRoutes');

const app = express();
app.use(express.json());

app.use('/api', parkingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Parking-lot API listening on port ${PORT}`);
});

module.exports = app;

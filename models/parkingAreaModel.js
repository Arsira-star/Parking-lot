// Parking Area Database Schema
// This model represents the structure of a parking slot record in the database

const ParkingAreaSchema = {
  slot_number: Number,        // Unique slot identifier (1-20)
  slot_available: Boolean,    // Whether slot is free or occupied
  active: Boolean,            // Whether slot is active (true) or deleted (false)
  update_date: String         // ISO timestamp of last update
};

// Parking slot instance
function createSlot(slotNumber) {
  return {
    slot_number: slotNumber,
    slot_available: true,
    active: true,
    update_date: new Date().toISOString()
  };
}

module.exports = {
  ParkingAreaSchema,
  createSlot
};

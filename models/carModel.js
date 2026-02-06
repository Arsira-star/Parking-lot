// Car Register Database Schema
// This model represents the structure of a car record in the database
// For cars taking multiple slots (medium, large), multiple records are created with different slot_numbers

const CarRegisterSchema = {
  plate_number: String,      // Vehicle registration plate
  car_size: String,           // small, medium, or large
  slot_number: Number,        // Allocated slot number (one record per slot)
  create_date: String,        // ISO timestamp of registration
  update_date: String,        // ISO timestamp of last update
  status: String              // null (unregistered), 'park' (parked), 'leave' (left)
};

// Create single car register record for one slot
function createCarRecord(plateNumber, carSize, slotNumber = null, status = null) {
  return {
    plate_number: plateNumber,
    car_size: carSize,
    slot_number: slotNumber,
    create_date: new Date().toISOString(),
    update_date: new Date().toISOString(),
    status: status
  };
}

module.exports = {
  CarRegisterSchema,
  createCarRecord
};

const db = require('../db/database');
const {
  validateTotalSlots,
  validatePlateAndSize,
  validatePlateNumber,
  validateSlotNumber,
  validateCarSize,
  validateSlotNumberQuery,
  validateAmount
} = require('../utils/validators');
const ERRORS = require('../constants/errors');
const MESSAGES = require('../constants/messages');
const HTTP_STATUS = require('../constants/httpStatus');

// ===== BUSINESS LOGIC: Create Parking Lot =====
exports.createParkingLot = async (req, res) => {
  try {
    const { totalSlots } = req.body;
    
    // Validate input
    const validation = validateTotalSlots(totalSlots);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Check if occupied slots exist
    const hasOccupied = await db.hasOccupiedSlots();
    if (hasOccupied) {
      return res.status(HTTP_STATUS.CONFLICT).json({ 
        error: 'Cannot create new parking lot: there are occupied slots. Please empty all slots first.' 
      });
    }

    await db.initializeParkingLot(totalSlots);
    return res.status(HTTP_STATUS.CREATED).json({
      message: MESSAGES.PARKING_LOT.CREATED,
      totalSlots,
      availableSlots: totalSlots
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Register Car =====
exports.registerCar = async (req, res) => {
  try {
    const { plateNumber, carSize } = req.body;
    
    // Validate input
    const validation = validatePlateAndSize(plateNumber, carSize);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const carRecords = await db.registerCar(plateNumber, carSize);
    if (!carRecords) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: ERRORS.CAR_REGISTRATION.ALREADY_REGISTERED });
    }

    return res.status(HTTP_STATUS.CREATED).json({ 
      message: MESSAGES.CAR_REGISTRATION.REGISTERED, 
      plateNumber,
      carSize,
      records: carRecords 
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Park Car =====
exports.parkCar = async (req, res) => {
  try {
    const { slotNumber, plateNumber } = req.body;
    
    // Validate input
    let validation = validatePlateNumber(plateNumber);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    validation = validateSlotNumber(slotNumber);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Validate car is registered
    const carRecords = await db.getCarByPlate(plateNumber);
    if (carRecords.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERRORS.CAR_REGISTRATION.NOT_REGISTERED });
    }

    // Find an unparked record for this car
    const targetRecord = carRecords.find(r => r.slot_number === null);
    if (!targetRecord) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'No unparked record for this car' });
    }

    // Validate slot exists and is available
    const slot = await db.getSlotByNumber(slotNumber);
    if (!slot) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Slot not found' });
    }
    if (!slot.slot_available) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Slot is not available' });
    }

    // Check if car is already parked at this slot
    const alreadyParked = carRecords.find(r => r.slot_number === slotNumber && r.status === 'park');
    if (alreadyParked) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Car is already parked at this slot' });
    }

    // Park the car: occupy slot and update car record
    await db.occupySlot(slotNumber);
    const updatedRecord = await db.parkCarAtSlot(plateNumber, slotNumber);

    return res.status(HTTP_STATUS.OK).json({
      message: MESSAGES.PARKING_OPERATIONS.PARKED_SUCCESSFULLY,
      plateNumber,
      slotNumber,
      record: updatedRecord
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Leave Car =====
exports.leaveCar = async (req, res) => {
  try {
    const { slotNumber, plateNumber } = req.body;
    
    // Validate input
    let validation = validatePlateNumber(plateNumber);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    validation = validateSlotNumber(slotNumber);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Validate car is registered
    const carRecords = await db.getCarByPlate(plateNumber);
    if (carRecords.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERRORS.CAR_REGISTRATION.NOT_FOUND });
    }

    // Find the record at this specific slot
    const targetRecord = carRecords.find(r => r.slot_number === slotNumber);
    if (!targetRecord) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Car record not found at this slot' });
    }

    // Check if car is currently parked at this slot
    if (targetRecord.status !== 'park') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.PARKING.NOT_CURRENTLY_PARKED });
    }

    // Leave the car: release slot and update car record
    await db.releaseSlot(slotNumber);
    const updatedRecord = await db.leaveCarAtSlot(plateNumber, slotNumber);

    return res.status(HTTP_STATUS.OK).json({
      message: MESSAGES.PARKING_OPERATIONS.LEFT_SUCCESSFULLY,
      plateNumber,
      slotNumber,
      record: updatedRecord
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Get Status =====
exports.getStatus = async (req, res) => {
  try {
    const parkingArea = await db.getParkingArea();
    const availableSlots = await db.getAvailableSlots();

    return res.status(HTTP_STATUS.OK).json({
      totalSlots: parkingArea.length,
      availableSlotCount: availableSlots.length,
      occupiedSlotCount: parkingArea.length - availableSlots.length,
      availableSlotNumbers: availableSlots.map(s => s.slot_number)
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Get Plates By Size =====
exports.getPlatesBySize = async (req, res) => {
  try {
    const { size } = req.query;
    
    // Validate input
    const validation = validateCarSize(size);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const records = await db.getCarsBySize(size);
    const plates = records.map(r => r.plate_number);

    return res.status(HTTP_STATUS.OK).json({ size, plates, count: plates.length });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Get Slots By Size =====
exports.getSlotsBySize = async (req, res) => {
  try {
    const { size } = req.query;
    
    // Validate input
    const validation = validateCarSize(size);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    const slots = await db.getSlotsByCarSize(size);
    return res.status(HTTP_STATUS.OK).json({ size, slots, count: slots.length });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Add Empty Slot =====
exports.addEmptySlot = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Validate input
    const validation = validateAmount(amount);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }
    
    const result = await db.addEmptySlot(amount);
    
    return res.status(HTTP_STATUS.CREATED).json({
      message: `${amount} empty slot(s) added successfully`,
      count: result.count,
      slots: result.slots
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

// ===== BUSINESS LOGIC: Delete Empty Slot =====
// Fixed logic: Check if slot is in use before inactivating it
exports.deleteEmptySlot = async (req, res) => {
  try {
    const { slotNumber } = req.query;
    
    // Validate input
    const validation = validateSlotNumberQuery(slotNumber);
    if (!validation.valid) {
      return res.status(validation.status).json({ error: validation.error });
    }

    // Get the slot
    const slot = await db.getSlotByNumber(parseInt(slotNumber));
    if (!slot) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Slot not found' });
    }
    
    // Check if slot is already inactive
    if (!slot.active) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Slot already deleted' });
    }
    
    // Check if slot is currently in use (occupied)
    const isInUse = await db.isSlotInUse(parseInt(slotNumber));
    if (isInUse) {
      return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Cannot delete occupied slot' });
    }

    // Inactivate the slot
    await db.inactivateSlot(parseInt(slotNumber));

    return res.status(HTTP_STATUS.OK).json({
      message: 'Empty slot deleted successfully',
      slotNumber: parseInt(slotNumber)
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

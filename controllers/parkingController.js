const db = require('../db/mockDatabase');
const ERRORS = require('../constants/errors');
const MESSAGES = require('../constants/messages');
const HTTP_STATUS = require('../constants/httpStatus');

const SLOT_SIZE_MAP = {
  small: 1,
  medium: 2,
  large: 3
};

exports.createParkingLot = (req, res) => {
  const { totalSlots } = req.body;
  if (!Number.isInteger(totalSlots) || totalSlots <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.TOTAL_SLOTS_INVALID });
  }

  db.initializeParkingLot(totalSlots);
  return res.status(HTTP_STATUS.CREATED).json({
    message: MESSAGES.PARKING_LOT.CREATED,
    totalSlots,
    availableSlots: totalSlots
  });
};

exports.registerCar = (req, res) => {
  const { plateNumber, carSize } = req.body;
  if (!plateNumber || !carSize) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.PLATE_AND_SIZE_REQUIRED });
  }
  if (!SLOT_SIZE_MAP[carSize]) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.INVALID_CAR_SIZE });
  }

  const carRecords = db.registerCar(plateNumber, carSize);
  if (!carRecords) {
    return res.status(HTTP_STATUS.CONFLICT).json({ error: ERRORS.CAR_REGISTRATION.ALREADY_REGISTERED });
  }

  return res.status(HTTP_STATUS.CREATED).json({ 
    message: MESSAGES.CAR_REGISTRATION.REGISTERED, 
    plateNumber,
    carSize,
    records: carRecords 
  });
};

exports.parkCar = (req, res) => {
  const { slotNumber, plateNumber } = req.body;
  
  if (!plateNumber) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.PLATE_NUMBER_REQUIRED });
  }
  if (!slotNumber) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'slotNumber is required' });
  }

  const carRecords = db.getCarByPlate(plateNumber);
  if (carRecords.length === 0) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: ERRORS.CAR_REGISTRATION.NOT_REGISTERED });
  }

  // Find an unparked record for this car
  const targetRecord = carRecords.find(r => r.slot_number === null);
  if (!targetRecord) {
    return res.status(HTTP_STATUS.CONFLICT).json({ error: 'No unparked record for this car' });
  }

  // Check if car is already parked at this slot before occupying
  const alreadyParked = carRecords.find(r => r.slot_number === slotNumber && r.status === 'park');
  if (alreadyParked) {
    return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Car is already parked at this slot' });
  }

  // Park the car at this slot (sensor sends data when car is parked)
  db.occupySlots(slotNumber);
  const updatedRecord = db.parkCarAtSlot(plateNumber, slotNumber);

  return res.status(HTTP_STATUS.OK).json({
    message: MESSAGES.PARKING_OPERATIONS.PARKED_SUCCESSFULLY,
    plateNumber,
    slotNumber,
    record: updatedRecord
  });
};

exports.leaveCar = (req, res) => {
  const { slotNumber, plateNumber } = req.body;
  
  if (!plateNumber) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.PLATE_NUMBER_REQUIRED });
  }
  if (!slotNumber) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'slotNumber is required' });
  }

  const carRecords = db.getCarByPlate(plateNumber);
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

  // Leave the car from this slot
  db.releaseSlots(slotNumber);
  const updatedRecord = db.leaveCarAtSlot(plateNumber, slotNumber);

  return res.status(HTTP_STATUS.OK).json({
    message: MESSAGES.PARKING_OPERATIONS.LEFT_SUCCESSFULLY,
    plateNumber,
    slotNumber,
    record: updatedRecord
  });
};

exports.getStatus = (req, res) => {
  const parkingArea = db.getParkingArea();
  const availableSlots = db.getAvailableSlots();

  return res.status(HTTP_STATUS.OK).json({
    totalSlots: parkingArea.length,
    availableSlotCount: availableSlots.length,
    occupiedSlotCount: parkingArea.length - availableSlots.length,
    availableSlotNumbers: availableSlots.map(s => s.slot_number)
  });
};

exports.getPlatesBySize = (req, res) => {
  const { size } = req.query;
  if (!size) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.SIZE_QUERY_REQUIRED });
  }
  if (!SLOT_SIZE_MAP[size]) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.INVALID_CAR_SIZE });
  }

  const records = db.getCarsBySize(size);
  const plates = records.map(r => r.plate_number);

  return res.status(HTTP_STATUS.OK).json({ size, plates, count: plates.length });
};

exports.getSlotsBySize = (req, res) => {
  const { size } = req.query;
  if (!size) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.SIZE_QUERY_REQUIRED });
  }
  if (!SLOT_SIZE_MAP[size]) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERRORS.VALIDATION.INVALID_CAR_SIZE });
  }

  const slots = db.getSlotsByCarSize(size);
  return res.status(HTTP_STATUS.OK).json({ size, slots, count: slots.length });
};

exports.addEmptySlot = (req, res) => {
  const newSlot = db.addEmptySlot();
  
  return res.status(HTTP_STATUS.CREATED).json({
    message: 'Empty slot added successfully',
    slot: newSlot
  });
};

exports.deleteEmptySlot = (req, res) => {
  const { slotNumber } = req.query;
  
  if (!slotNumber) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Query param slotNumber is required' });
  }

  const result = db.deleteEmptySlot(parseInt(slotNumber));
  
  if (result === null) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Slot not found' });
  }
  
  if (result === false) {
    return res.status(HTTP_STATUS.CONFLICT).json({ error: 'Cannot delete occupied slot' });
  }

  return res.status(HTTP_STATUS.OK).json({
    message: 'Empty slot deleted successfully',
    slotNumber: parseInt(slotNumber)
  });
};

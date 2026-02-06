// Mock Database Module
// Simulates a persistent database with two tables: parking_area and car_register

const fs = require('fs');
const path = require('path');

const PARKING_AREA_PATH = path.join(__dirname, 'parking_area.json');
const CAR_REGISTER_PATH = path.join(__dirname, 'car_register.json');

// Initialize or load database
let db = loadDatabase();

function loadDatabase() {
  try {
    let parkingArea = [];
    let carRegister = [];

    if (fs.existsSync(PARKING_AREA_PATH)) {
      const data = fs.readFileSync(PARKING_AREA_PATH, 'utf-8');
      parkingArea = JSON.parse(data);
    }

    if (fs.existsSync(CAR_REGISTER_PATH)) {
      const data = fs.readFileSync(CAR_REGISTER_PATH, 'utf-8');
      carRegister = JSON.parse(data);
    }

    return { parking_area: parkingArea, car_register: carRegister };
  } catch (err) {
    console.warn('Error loading database, starting fresh:', err.message);
    return { parking_area: [], car_register: [] };
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(PARKING_AREA_PATH, JSON.stringify(db.parking_area, null, 2));
    fs.writeFileSync(CAR_REGISTER_PATH, JSON.stringify(db.car_register, null, 2));
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}


function initializeParkingLot(totalSlots) {
  db.parking_area = Array.from({ length: totalSlots }, (_, i) => ({
    slot_number: i + 1,
    slot_available: true,
    active: true,
    update_date: new Date().toISOString()
  }));
  db.car_register = [];
  saveDatabase();
}

function getParkingArea() {
  return db.parking_area.filter(slot => slot.active);
}

function getAvailableSlots() {
  return db.parking_area.filter(slot => slot.active && slot.slot_available);
}

function findConsecutiveAvailableSlots(count) {
  // Find 'count' consecutive available slots (only active slots)
  const available = db.parking_area.filter(s => s.active);
  for (let i = 0; i <= available.length - count; i++) {
    const slots = available.slice(i, i + count);
    if (slots.every(s => s.slot_available)) {
      return slots.map(s => s.slot_number);
    }
  }
  return null;
}

function occupySlots(slotNumber) {
  const slot = db.parking_area.find(s => s.slot_number === slotNumber);
  if (slot) {
    slot.slot_available = false;
    slot.update_date = new Date().toISOString();
  }
  saveDatabase();
}

function releaseSlots(slotNumber) {
  const slot = db.parking_area.find(s => s.slot_number === slotNumber);
  if (slot) {
    slot.slot_available = true;
    slot.update_date = new Date().toISOString();
  }
  saveDatabase();
}

function addEmptySlot() {
  // Get the highest slot number and add 1
  const maxSlotNumber = db.parking_area.length > 0 
    ? Math.max(...db.parking_area.map(s => s.slot_number))
    : 0;
  
  const newSlot = {
    slot_number: maxSlotNumber + 1,
    slot_available: true,
    active: true,
    update_date: new Date().toISOString()
  };
  
  db.parking_area.push(newSlot);
  saveDatabase();
  return newSlot;
}

function deleteEmptySlot(slotNumber) {
  // Check if slot exists and is empty (available)
  const slot = db.parking_area.find(s => s.slot_number === slotNumber);
  if (!slot) {
    return null; // Slot not found
  }
  
  if (!slot.active) {
    return null; // Slot already deleted
  }
  
  if (!slot.slot_available) {
    return false; // Slot is occupied, cannot delete
  }
  
  // Flag slot as inactive instead of removing
  slot.active = false;
  slot.update_date = new Date().toISOString();
  saveDatabase();
  return true; // Successfully deleted (flagged as inactive)
}

const { createCarRecord } = require('../models/carModel');

// Map car size to number of records needed
const SLOT_SIZE_MAP = {
  small: 1,
  medium: 2,
  large: 3
};

function registerCar(plateNumber, carSize) {
  const existing = db.car_register.find(c => c.plate_number === plateNumber);
  if (existing) {
    return null; // Already registered
  }

  const recordsNeeded = SLOT_SIZE_MAP[carSize];
  const newRecords = [];

  for (let i = 0; i < recordsNeeded; i++) {
    const carRecord = createCarRecord(plateNumber, carSize, null, null);
    db.car_register.push(carRecord);
    newRecords.push(carRecord);
  }

  saveDatabase();
  return newRecords; // Return array of created records
}

function getCarByPlate(plateNumber) {
  return db.car_register.filter(c => c.plate_number === plateNumber);
}


function getCarsBySize(size) {
  // Get all records with specific size and 'park' status, group by plate
  const records = db.car_register.filter(c => c.car_size === size && c.status === 'park');
  const uniquePlates = [...new Set(records.map(r => r.plate_number))];
  return uniquePlates.map(plate => {
    const firstRecord = records.find(r => r.plate_number === plate);
    return firstRecord;
  });
}

function getSlotsByCarSize(size) {
  // Get all slot_numbers for parked cars of given size
  const records = db.car_register.filter(c => c.car_size === size && c.status === 'park');
  return records.map(r => r.slot_number).filter(s => s !== null);
}

function getAllCars() {
  return db.car_register;
}

function getSlotByNumber(slotNumber) {
  // Get a parking slot by its number
  return db.parking_area.find(s => s.slot_number === slotNumber);
}

function parkCarAtSlot(plateNumber, slotNumber) {
  // Park a specific car record at a specific slot
  const carRecords = db.car_register.filter(c => c.plate_number === plateNumber);
  
  // Check if this car already has a record at this slot with 'park' status
  const alreadyParkedAtSlot = carRecords.find(r => r.slot_number === slotNumber && r.status === 'park');
  if (alreadyParkedAtSlot) {
    return null; // Already parked at this slot
  }

  // Find an unparked record for this car
  const targetRecord = carRecords.find(r => r.slot_number === null || r.slot_number === undefined);
  if (!targetRecord) {
    return null;
  }

  // Update the record with slot and status
  targetRecord.slot_number = slotNumber;
  targetRecord.status = 'park';
  targetRecord.update_date = new Date().toISOString();

  saveDatabase();
  return targetRecord;
}

function leaveCarAtSlot(plateNumber, slotNumber) {
  // Leave a parked car at a specific slot
  const carRecords = db.car_register.filter(c => c.plate_number === plateNumber);
  const targetRecord = carRecords.find(r => r.slot_number === slotNumber && r.status === 'park');
  
  if (!targetRecord) {
    return null;
  }

  // Update status to 'leave'
  targetRecord.status = 'leave';
  targetRecord.update_date = new Date().toISOString();

  saveDatabase();
  return targetRecord;
}

// Export database API
module.exports = {
  // Parking Area Operations
  initializeParkingLot,
  getParkingArea,
  getAvailableSlots,
  findConsecutiveAvailableSlots,
  occupySlots,
  releaseSlots,
  getSlotByNumber,
  addEmptySlot,
  deleteEmptySlot,

  // Car Register Operations
  registerCar,
  getCarByPlate,
  parkCarAtSlot,
  leaveCarAtSlot,
  getCarsBySize,
  getSlotsByCarSize,
  getAllCars,

  // Database persistence
  saveDatabase,
  loadDatabase
};

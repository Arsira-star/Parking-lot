// MongoDB Database Module
// This module provides low-level database operations only
// All business logic should be in the controller

const { getParkingAreaCollection, createSlot } = require('../models/parkingAreaModel');
const { getCarRegisterCollection, createCarRecord } = require('../models/carModel');

// ===== PARKING AREA OPERATIONS (Database only) =====

async function initializeParkingLot(totalSlots) {
  try {
    const collection = getParkingAreaCollection();
    
    // Remove all existing records
    await collection.deleteMany({});
    
    // Create new slots
    const slots = Array.from({ length: totalSlots }, (_, i) => ({
      slot_number: i + 1,
      slot_available: true,
      active: true,
      update_date: new Date()
    }));
    
    await collection.insertMany(slots);
    return slots;
  } catch (error) {
    throw new Error(`Error initializing parking lot: ${error.message}`);
  }
}

async function hasOccupiedSlots() {
  try {
    const collection = getParkingAreaCollection();
    const occupiedSlot = await collection.findOne({ slot_available: false });
    return occupiedSlot !== null;
  } catch (error) {
    throw new Error(`Error checking occupied slots: ${error.message}`);
  }
}

async function getParkingArea() {
  try {
    const collection = getParkingAreaCollection();
    return await collection.find({ active: true }).toArray();
  } catch (error) {
    throw new Error(`Error getting parking area: ${error.message}`);
  }
}

async function getAvailableSlots() {
  try {
    const collection = getParkingAreaCollection();
    return await collection.find({ active: true, slot_available: true }).toArray();
  } catch (error) {
    throw new Error(`Error getting available slots: ${error.message}`);
  }
}

async function getSlotByNumber(slotNumber) {
  try {
    const collection = getParkingAreaCollection();
    return await collection.findOne({ slot_number: slotNumber });
  } catch (error) {
    throw new Error(`Error getting slot: ${error.message}`);
  }
}

async function findConsecutiveAvailableSlots(count) {
  try {
    const collection = getParkingAreaCollection();
    const slots = await collection.find({ active: true, slot_available: true })
      .sort({ slot_number: 1 })
      .toArray();
    
    if (slots.length < count) return null;
    
    for (let i = 0; i <= slots.length - count; i++) {
      const consecutiveSlots = slots.slice(i, i + count);
      if (consecutiveSlots.length === count && 
          consecutiveSlots[consecutiveSlots.length - 1].slot_number - 
          consecutiveSlots[0].slot_number === count - 1) {
        return consecutiveSlots.map(s => s.slot_number);
      }
    }
    return null;
  } catch (error) {
    throw new Error(`Error finding consecutive slots: ${error.message}`);
  }
}

async function occupySlot(slotNumber) {
  try {
    const collection = getParkingAreaCollection();
    const result = await collection.findOneAndUpdate(
      { slot_number: slotNumber },
      { $set: { slot_available: false, update_date: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (error) {
    throw new Error(`Error occupying slot: ${error.message}`);
  }
}

async function releaseSlot(slotNumber) {
  try {
    const collection = getParkingAreaCollection();
    const result = await collection.findOneAndUpdate(
      { slot_number: slotNumber },
      { $set: { slot_available: true, update_date: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (error) {
    throw new Error(`Error releasing slot: ${error.message}`);
  }
}

async function addEmptySlot(amount = 1) {
  try {
    const collection = getParkingAreaCollection();
    if (amount < 1 || !Number.isInteger(amount)) {
      throw new Error('Amount must be a positive integer');
    }
    
    const maxSlot = await collection.findOne(
      {},
      { sort: { slot_number: -1 } }
    );
    
    const startNumber = maxSlot ? maxSlot.slot_number + 1 : 1;
    const newSlots = Array.from({ length: amount }, (_, i) => 
      createSlot(startNumber + i)
    );
    
    const result = await collection.insertMany(newSlots);
    return { count: result.insertedIds.length, slots: newSlots };
  } catch (error) {
    throw new Error(`Error adding empty slots: ${error.message}`);
  }
}

async function inactivateSlot(slotNumber) {
  try {
    const collection = getParkingAreaCollection();
    const result = await collection.findOneAndUpdate(
      { slot_number: slotNumber },
      { $set: { active: false, update_date: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  } catch (error) {
    throw new Error(`Error inactivating slot: ${error.message}`);
  }
}

async function isSlotInUse(slotNumber) {
  try {
    const collection = getParkingAreaCollection();
    const slot = await collection.findOne({ slot_number: slotNumber });
    return slot ? !slot.slot_available : false;
  } catch (error) {
    throw new Error(`Error checking slot usage: ${error.message}`);
  }
}

// ===== CAR REGISTER OPERATIONS (Database only) =====

async function registerCar(plateNumber, carSize) {
  try {
    const collection = getCarRegisterCollection();
    const existing = await collection.findOne({ plate_number: plateNumber });
    if (existing) {
      return null; // Car already registered
    }
    
    const SLOT_SIZE_MAP = { small: 1, medium: 2, large: 3 };
    const recordsNeeded = SLOT_SIZE_MAP[carSize];
    
    const newRecords = [];
    for (let i = 0; i < recordsNeeded; i++) {
      const record = createCarRecord(plateNumber, carSize, null, null);
      const result = await collection.insertOne(record);
      newRecords.push({ ...record, _id: result.insertedId });
    }
    
    return newRecords;
  } catch (error) {
    throw new Error(`Error registering car: ${error.message}`);
  }
}

async function getCarByPlate(plateNumber) {
  try {
    const collection = getCarRegisterCollection();
    return await collection.find({ plate_number: plateNumber }).toArray();
  } catch (error) {
    throw new Error(`Error getting car by plate: ${error.message}`);
  }
}

async function parkCarAtSlot(plateNumber, slotNumber) {
  try {
    const collection = getCarRegisterCollection();
    const carRecords = await collection.find({ plate_number: plateNumber }).toArray();
    const targetRecord = carRecords.find(r => !r.slot_number);
    
    if (!targetRecord) {
      return null;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: targetRecord._id },
      { $set: { slot_number: slotNumber, status: 'park', update_date: new Date() } },
      { returnDocument: 'after' }
    );
    
    return result.value;
  } catch (error) {
    throw new Error(`Error parking car: ${error.message}`);
  }
}

async function leaveCarAtSlot(plateNumber, slotNumber) {
  try {
    const collection = getCarRegisterCollection();
    const result = await collection.findOneAndUpdate(
      { plate_number: plateNumber, slot_number: slotNumber, status: 'park' },
      { $set: { status: 'leave', update_date: new Date() } },
      { returnDocument: 'after' }
    );
    
    return result.value;
  } catch (error) {
    throw new Error(`Error leaving car: ${error.message}`);
  }
}

async function getCarsBySize(size) {
  try {
    const collection = getCarRegisterCollection();
    const records = await collection.find({ car_size: size, status: 'park' }).toArray();
    const uniquePlates = [...new Set(records.map(r => r.plate_number))];
    return uniquePlates.map(plate => {
      return records.find(r => r.plate_number === plate);
    });
  } catch (error) {
    throw new Error(`Error getting cars by size: ${error.message}`);
  }
}

async function getSlotsByCarSize(size) {
  try {
    const collection = getCarRegisterCollection();
    const records = await collection.find({ car_size: size, status: 'park' }).toArray();
    return records.map(r => r.slot_number).filter(s => s !== null);
  } catch (error) {
    throw new Error(`Error getting slots by car size: ${error.message}`);
  }
}

async function getAllCars() {
  try {
    const collection = getCarRegisterCollection();
    return await collection.find({}).toArray();
  } catch (error) {
    throw new Error(`Error getting all cars: ${error.message}`);
  }
}

// Export database API
module.exports = {
  // Parking Area Operations
  initializeParkingLot,
  hasOccupiedSlots,
  getParkingArea,
  getAvailableSlots,
  findConsecutiveAvailableSlots,
  occupySlot,
  releaseSlot,
  getSlotByNumber,
  addEmptySlot,
  inactivateSlot,
  isSlotInUse,

  // Car Register Operations
  registerCar,
  getCarByPlate,
  parkCarAtSlot,
  leaveCarAtSlot,
  getCarsBySize,
  getSlotsByCarSize,
  getAllCars
};

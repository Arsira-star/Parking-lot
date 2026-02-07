const { getDb } = require('../db/connection');

const COLLECTION_NAME = 'parking_area';

// Helper function to get the parking area collection
function getParkingAreaCollection() {
  const db = getDb();
  return db.collection(COLLECTION_NAME);
}

// Helper function to create a parking slot document
function createSlot(slotNumber) {
  return {
    slot_number: slotNumber,
    slot_available: true,
    active: true,
    update_date: new Date()
  };
}

// Helper function to insert a parking slot
async function insertSlot(slotNumber) {
  const collection = getParkingAreaCollection();
  const slot = createSlot(slotNumber);
  const result = await collection.insertOne(slot);
  return result;
}

module.exports = {
  getParkingAreaCollection,
  createSlot,
  insertSlot,
  COLLECTION_NAME
};

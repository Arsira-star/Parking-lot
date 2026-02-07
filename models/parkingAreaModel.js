const { getDb } = require('../db/connection');

const COLLECTION_NAME = 'parking_area';

function getParkingAreaCollection() {
  const db = getDb();
  return db.collection(COLLECTION_NAME);
}

function createSlot(slotNumber) {
  return {
    slot_number: slotNumber,
    slot_available: true,
    active: true,
    update_date: new Date()
  };
}

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

const { getDb } = require('../db/connection');

const COLLECTION_NAME = 'car_register';
const VALID_CAR_SIZES = ['small', 'medium', 'large'];
const VALID_STATUSES = ['park', 'leave', null];

function getCarRegisterCollection() {
  const db = getDb();
  return db.collection(COLLECTION_NAME);
}

function createCarRecord(plateNumber, carSize, slotNumber = null, status = null) {
  if (!VALID_CAR_SIZES.includes(carSize)) {
    throw new Error(`Invalid car_size: ${carSize}. Must be one of ${VALID_CAR_SIZES.join(', ')}`);
  }
  if (status !== null && !VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of ${VALID_STATUSES.join(', ')}`);
  }
  return {
    plate_number: plateNumber,
    car_size: carSize,
    slot_number: slotNumber,
    status: status,
    create_date: new Date(),
    update_date: new Date()
  };
}

async function insertCarRecord(plateNumber, carSize, slotNumber = null, status = null) {
  const collection = getCarRegisterCollection();
  const record = createCarRecord(plateNumber, carSize, slotNumber, status);
  const result = await collection.insertOne(record);
  return result;
}

module.exports = {
  getCarRegisterCollection,
  createCarRecord,
  insertCarRecord,
  COLLECTION_NAME,
  VALID_CAR_SIZES,
  VALID_STATUSES
};

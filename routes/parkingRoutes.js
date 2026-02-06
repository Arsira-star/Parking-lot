const express = require('express');
const router = express.Router();
const controller = require('../controllers/parkingController');

// Add new slots to parking lot
router.post('/parking-lots', controller.createParkingLot);
router.post('/slots/create', controller.addEmptySlot);
router.delete('/slots/delete', controller.deleteEmptySlot);

// Car registration and parking operations
router.post('/cars/register', controller.registerCar);
router.post('/cars/park', controller.parkCar);
router.post('/cars/leave', controller.leaveCar);

// Status and queries
router.get('/parking-lot/status', controller.getStatus);
router.get('/cars/parked', controller.getPlatesBySize);
router.get('/spaces/parked', controller.getSlotsBySize);

module.exports = router;

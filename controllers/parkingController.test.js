const parkingController = require('./parkingController');
const db = require('../db/database');
const HTTP_STATUS = require('../constants/httpStatus');
const MESSAGES = require('../constants/messages');
const ERRORS = require('../constants/errors');

// Mock the database module
jest.mock('../db/database');

describe('Parking Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== CREATE PARKING LOT TESTS =====
  describe('createParkingLot', () => {
    it('should create a new parking lot with valid total slots', async () => {
      const mockSlots = Array.from({ length: 10 }, (_, i) => ({
        slot_number: i + 1,
        slot_available: true,
        active: true
      }));

      db.hasOccupiedSlots.mockResolvedValue(false);
      db.initializeParkingLot.mockResolvedValue(mockSlots);

      const req = { body: { totalSlots: 10 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.createParkingLot(req, res);

      expect(db.hasOccupiedSlots).toHaveBeenCalled();
      expect(db.initializeParkingLot).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: MESSAGES.PARKING_LOT.CREATED,
          totalSlots: 10,
          availableSlots: 10
        })
      );
    });

    it('should fail if occupied slots exist', async () => {
      db.hasOccupiedSlots.mockResolvedValue(true);

      const req = { body: { totalSlots: 10 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.createParkingLot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('occupied slots')
        })
      );
      expect(db.initializeParkingLot).not.toHaveBeenCalled();
    });

    it('should fail with invalid total slots', async () => {
      const req = { body: { totalSlots: -5 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.createParkingLot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      db.hasOccupiedSlots.mockResolvedValue(false);
      db.initializeParkingLot.mockRejectedValue(new Error('Database error'));

      const req = { body: { totalSlots: 10 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.createParkingLot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  // ===== REGISTER CAR TESTS =====
  describe('registerCar', () => {
    it('should register a car with valid plate and size', async () => {
      const mockRecords = [
        {
          _id: '1',
          plate_number: 'ABC-123',
          car_size: 'small',
          slot_number: null,
          status: null
        }
      ];

      db.registerCar.mockResolvedValue(mockRecords);

      const req = { body: { plateNumber: 'ABC-123', carSize: 'small' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.registerCar(req, res);

      expect(db.registerCar).toHaveBeenCalledWith('ABC-123', 'small');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: MESSAGES.CAR_REGISTRATION.REGISTERED,
          plateNumber: 'ABC-123',
          carSize: 'small',
          records: mockRecords
        })
      );
    });

    it('should fail if car already registered', async () => {
      db.registerCar.mockResolvedValue(null);

      const req = { body: { plateNumber: 'ABC-123', carSize: 'small' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.registerCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERRORS.CAR_REGISTRATION.ALREADY_REGISTERED
        })
      );
    });

    it('should fail with invalid car size', async () => {
      const req = { body: { plateNumber: 'ABC-123', carSize: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.registerCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(db.registerCar).not.toHaveBeenCalled();
    });

    it('should fail if plate or size is missing', async () => {
      const req = { body: { plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.registerCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  // ===== PARK CAR TESTS =====
  describe('parkCar', () => {
    it('should park a car at an available slot', async () => {
      const mockCarRecords = [
        { _id: '1', plate_number: 'ABC-123', slot_number: null, status: null }
      ];
      const mockSlot = { slot_number: 5, slot_available: true };
      const mockUpdatedRecord = {
        _id: '1',
        plate_number: 'ABC-123',
        slot_number: 5,
        status: 'park'
      };

      db.getCarByPlate.mockResolvedValue(mockCarRecords);
      db.getSlotByNumber.mockResolvedValue(mockSlot);
      db.occupySlot.mockResolvedValue({ slot_number: 5, slot_available: false });
      db.parkCarAtSlot.mockResolvedValue(mockUpdatedRecord);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.parkCar(req, res);

      expect(db.getCarByPlate).toHaveBeenCalledWith('ABC-123');
      expect(db.getSlotByNumber).toHaveBeenCalledWith(5);
      expect(db.occupySlot).toHaveBeenCalledWith(5);
      expect(db.parkCarAtSlot).toHaveBeenCalledWith('ABC-123', 5);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: MESSAGES.PARKING_OPERATIONS.PARKED_SUCCESSFULLY,
          plateNumber: 'ABC-123',
          slotNumber: 5
        })
      );
    });

    it('should fail if car is not registered', async () => {
      db.getCarByPlate.mockResolvedValue([]);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.parkCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERRORS.CAR_REGISTRATION.NOT_REGISTERED
        })
      );
    });

    it('should fail if slot is not available', async () => {
      const mockCarRecords = [
        { _id: '1', plate_number: 'ABC-123', slot_number: null, status: null }
      ];
      const mockSlot = { slot_number: 5, slot_available: false };

      db.getCarByPlate.mockResolvedValue(mockCarRecords);
      db.getSlotByNumber.mockResolvedValue(mockSlot);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.parkCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('not available')
        })
      );
    });

    it('should fail if slot does not exist', async () => {
      const mockCarRecords = [
        { _id: '1', plate_number: 'ABC-123', slot_number: null, status: null }
      ];

      db.getCarByPlate.mockResolvedValue(mockCarRecords);
      db.getSlotByNumber.mockResolvedValue(null);

      const req = { body: { slotNumber: 999, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.parkCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Slot not found'
        })
      );
    });
  });

  // ===== LEAVE CAR TESTS =====
  describe('leaveCar', () => {
    it('should remove car from parking slot', async () => {
      const mockCarRecords = [
        { _id: '1', plate_number: 'ABC-123', slot_number: 5, status: 'park' }
      ];
      const mockUpdatedRecord = {
        _id: '1',
        plate_number: 'ABC-123',
        slot_number: 5,
        status: 'leave'
      };

      db.getCarByPlate.mockResolvedValue(mockCarRecords);
      db.releaseSlot.mockResolvedValue({ slot_number: 5, slot_available: true });
      db.leaveCarAtSlot.mockResolvedValue(mockUpdatedRecord);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.leaveCar(req, res);

      expect(db.getCarByPlate).toHaveBeenCalledWith('ABC-123');
      expect(db.releaseSlot).toHaveBeenCalledWith(5);
      expect(db.leaveCarAtSlot).toHaveBeenCalledWith('ABC-123', 5);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: MESSAGES.PARKING_OPERATIONS.LEFT_SUCCESSFULLY,
          plateNumber: 'ABC-123',
          slotNumber: 5
        })
      );
    });

    it('should fail if car is not registered', async () => {
      db.getCarByPlate.mockResolvedValue([]);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.leaveCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it('should fail if car is not parked at slot', async () => {
      const mockCarRecords = [
        { _id: '1', plate_number: 'ABC-123', slot_number: 5, status: 'leave' }
      ];

      db.getCarByPlate.mockResolvedValue(mockCarRecords);

      const req = { body: { slotNumber: 5, plateNumber: 'ABC-123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.leaveCar(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERRORS.PARKING.NOT_CURRENTLY_PARKED
        })
      );
    });
  });

  // ===== GET STATUS TESTS =====
  describe('getStatus', () => {
    it('should return parking lot status', async () => {
      const mockParkingArea = [
        { slot_number: 1, slot_available: true },
        { slot_number: 2, slot_available: false },
        { slot_number: 3, slot_available: true }
      ];
      const mockAvailableSlots = [
        { slot_number: 1, slot_available: true },
        { slot_number: 3, slot_available: true }
      ];

      db.getParkingArea.mockResolvedValue(mockParkingArea);
      db.getAvailableSlots.mockResolvedValue(mockAvailableSlots);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSlots: 3,
          availableSlotCount: 2,
          occupiedSlotCount: 1,
          availableSlotNumbers: [1, 3]
        })
      );
    });

    it('should handle empty parking lot', async () => {
      db.getParkingArea.mockResolvedValue([]);
      db.getAvailableSlots.mockResolvedValue([]);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSlots: 0,
          availableSlotCount: 0,
          occupiedSlotCount: 0
        })
      );
    });
  });

  // ===== GET PLATES BY SIZE TESTS =====
  describe('getPlatesBySize', () => {
    it('should return plates for cars of specified size', async () => {
      const mockRecords = [
        { _id: '1', plate_number: 'ABC-123', car_size: 'small' },
        { _id: '2', plate_number: 'XYZ-789', car_size: 'small' }
      ];

      db.getCarsBySize.mockResolvedValue(mockRecords);

      const req = { query: { size: 'small' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getPlatesBySize(req, res);

      expect(db.getCarsBySize).toHaveBeenCalledWith('small');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 'small',
          plates: ['ABC-123', 'XYZ-789'],
          count: 2
        })
      );
    });

    it('should fail with invalid car size', async () => {
      const req = { query: { size: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getPlatesBySize(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(db.getCarsBySize).not.toHaveBeenCalled();
    });

    it('should return empty array if no cars of size', async () => {
      db.getCarsBySize.mockResolvedValue([]);

      const req = { query: { size: 'large' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getPlatesBySize(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 'large',
          plates: [],
          count: 0
        })
      );
    });
  });

  // ===== GET SLOTS BY SIZE TESTS =====
  describe('getSlotsBySize', () => {
    it('should return slots for cars of specified size', async () => {
      db.getSlotsByCarSize.mockResolvedValue([1, 2, 5]);

      const req = { query: { size: 'small' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getSlotsBySize(req, res);

      expect(db.getSlotsByCarSize).toHaveBeenCalledWith('small');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 'small',
          slots: [1, 2, 5],
          count: 3
        })
      );
    });

    it('should fail with invalid car size', async () => {
      const req = { query: { size: 'invalid' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.getSlotsBySize(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  // ===== ADD EMPTY SLOT TESTS =====
  describe('addEmptySlot', () => {
    it('should add specified number of empty slots', async () => {
      const mockSlots = [
        { slot_number: 11, slot_available: true, active: true },
        { slot_number: 12, slot_available: true, active: true }
      ];

      db.addEmptySlot.mockResolvedValue({
        count: 2,
        slots: mockSlots
      });

      const req = { body: { amount: 2 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.addEmptySlot(req, res);

      expect(db.addEmptySlot).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '2 empty slot(s) added successfully',
          count: 2,
          slots: mockSlots
        })
      );
    });

    it('should fail if amount is missing', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.addEmptySlot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Amount is required'
        })
      );
      expect(db.addEmptySlot).not.toHaveBeenCalled();
    });

    it('should fail if amount is not a positive integer', async () => {
      const req = { body: { amount: -1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.addEmptySlot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(db.addEmptySlot).not.toHaveBeenCalled();
    });

    it('should add single slot if amount is 1', async () => {
      const mockSlot = [{ slot_number: 11, slot_available: true, active: true }];

      db.addEmptySlot.mockResolvedValue({
        count: 1,
        slots: mockSlot
      });

      const req = { body: { amount: 1 } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.addEmptySlot(req, res);

      expect(db.addEmptySlot).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
    });
  });

  // ===== DELETE EMPTY SLOT TESTS =====
  describe('deleteEmptySlot', () => {
    it('should delete an available empty slot', async () => {
      const mockSlot = {
        slot_number: 1,
        slot_available: true,
        active: true
      };

      db.getSlotByNumber.mockResolvedValue(mockSlot);
      db.isSlotInUse.mockResolvedValue(false);
      db.inactivateSlot.mockResolvedValue({
        ...mockSlot,
        active: false
      });

      const req = { query: { slotNumber: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.deleteEmptySlot(req, res);

      expect(db.getSlotByNumber).toHaveBeenCalledWith(1);
      expect(db.isSlotInUse).toHaveBeenCalledWith(1);
      expect(db.inactivateSlot).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Empty slot deleted successfully',
          slotNumber: 1
        })
      );
    });

    it('should fail if slot does not exist', async () => {
      db.getSlotByNumber.mockResolvedValue(null);

      const req = { query: { slotNumber: '999' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.deleteEmptySlot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    it('should fail if slot is in use', async () => {
      const mockSlot = {
        slot_number: 1,
        slot_available: false,
        active: true
      };

      db.getSlotByNumber.mockResolvedValue(mockSlot);
      db.isSlotInUse.mockResolvedValue(true);

      const req = { query: { slotNumber: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.deleteEmptySlot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cannot delete occupied slot'
        })
      );
      expect(db.inactivateSlot).not.toHaveBeenCalled();
    });

    it('should fail if slot already deleted', async () => {
      const mockSlot = {
        slot_number: 1,
        slot_available: true,
        active: false
      };

      db.getSlotByNumber.mockResolvedValue(mockSlot);

      const req = { query: { slotNumber: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await parkingController.deleteEmptySlot(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Slot already deleted'
        })
      );
    });
  });
});

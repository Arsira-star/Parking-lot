const ERRORS = {
  VALIDATION: {
    TOTAL_SLOTS_INVALID: 'totalSlots must be a positive integer',
    PLATE_NUMBER_REQUIRED: 'plateNumber is required',
    CAR_SIZE_REQUIRED: 'carSize is required',
    PLATE_AND_SIZE_REQUIRED: 'plateNumber and carSize are required',
    INVALID_CAR_SIZE: 'carSize must be small, medium, or large',
    SIZE_QUERY_REQUIRED: 'Query param size is required'
  },
  CAR_REGISTRATION: {
    ALREADY_REGISTERED: 'Car already registered',
    NOT_REGISTERED: 'Car not registered',
    NOT_FOUND: 'Car not found'
  },
  PARKING: {
    ALREADY_PARKED: 'Car already parked',
    NOT_CURRENTLY_PARKED: 'Car is not currently parked',
    NO_CONSECUTIVE_SLOTS: (slotsNeeded, size) => `No ${slotsNeeded} consecutive slots available for ${size} car`,
    PARKING_LOT_NOT_CREATED: 'Parking lot is not created yet',
    LOT_FULL: 'Parking lot full'
  }
};

module.exports = ERRORS;

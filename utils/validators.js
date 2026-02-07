const ERRORS = require('../constants/errors');
const HTTP_STATUS = require('../constants/httpStatus');

const SLOT_SIZE_MAP = {
  small: 1,
  medium: 2,
  large: 3
};

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate total slots for parking lot initialization
 * @param {*} totalSlots - Total number of slots to create
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validateTotalSlots(totalSlots) {
  if (!Number.isInteger(totalSlots) || totalSlots <= 0) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.TOTAL_SLOTS_INVALID,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }
  return { valid: true };
}

/**
 * Validate plate number and car size for car registration
 * @param {string} plateNumber - Vehicle plate number
 * @param {string} carSize - Vehicle size (small, medium, large)
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validatePlateAndSize(plateNumber, carSize) {
  if (!plateNumber || !carSize) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.PLATE_AND_SIZE_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  if (!SLOT_SIZE_MAP[carSize]) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.INVALID_CAR_SIZE,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  return { valid: true };
}

/**
 * Validate plate number
 * @param {string} plateNumber - Vehicle plate number
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validatePlateNumber(plateNumber) {
  if (!plateNumber) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.PLATE_NUMBER_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }
  return { valid: true };
}

/**
 * Validate slot number
 * @param {*} slotNumber - Parking slot number
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validateSlotNumber(slotNumber) {
  if (!slotNumber) {
    return {
      valid: false,
      error: 'slotNumber is required',
      status: HTTP_STATUS.BAD_REQUEST
    };
  }
  return { valid: true };
}

/**
 * Validate car size from query parameter
 * @param {string} size - Car size query parameter
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validateCarSize(size) {
  if (!size) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.SIZE_QUERY_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  if (!SLOT_SIZE_MAP[size]) {
    return {
      valid: false,
      error: ERRORS.VALIDATION.INVALID_CAR_SIZE,
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  return { valid: true };
}

/**
 * Validate slot number from query parameter
 * @param {*} slotNumber - Slot number from query
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validateSlotNumberQuery(slotNumber) {
  if (!slotNumber) {
    return {
      valid: false,
      error: 'Query param slotNumber is required',
      status: HTTP_STATUS.BAD_REQUEST
    };
  }
  return { valid: true };
}

/**
 * Validate amount for adding slots
 * @param {*} amount - Number of slots to add
 * @returns {Object} { valid: boolean, error: string|null, status: number|null }
 */
function validateAmount(amount) {
  if (amount === undefined || amount === null) {
    return {
      valid: false,
      error: 'Amount is required',
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  if (!Number.isInteger(amount) || amount < 1) {
    return {
      valid: false,
      error: 'Amount must be a positive integer',
      status: HTTP_STATUS.BAD_REQUEST
    };
  }

  return { valid: true };
}

module.exports = {
  validateTotalSlots,
  validatePlateAndSize,
  validatePlateNumber,
  validateSlotNumber,
  validateCarSize,
  validateSlotNumberQuery,
  validateAmount,
  SLOT_SIZE_MAP
};

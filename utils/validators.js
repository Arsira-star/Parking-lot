const ERRORS = require('../constants/errors');
const HTTP_STATUS = require('../constants/httpStatus');

const SLOT_SIZE_MAP = {
  small: 1,
  medium: 2,
  large: 3
};

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

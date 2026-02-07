# Unit Tests Documentation

## Overview
This project includes comprehensive unit tests for all API endpoints using Jest with mocked database responses. The tests do **not** connect to MongoDB and instead use Jest mocks to simulate database responses.

## Features
- ✅ Full coverage of all API endpoints
- ✅ Mocked database layer (no real database connection)
- ✅ Tests for success and error scenarios
- ✅ Input validation tests
- ✅ Edge case handling

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Structure

### Test Files
- `controllers/parkingController.test.js` - Tests for all parking lot API endpoints

### Test Coverage

#### 1. **Create Parking Lot Tests**
- ✅ Create parking lot with valid slots
- ✅ Prevent creation if occupied slots exist
- ✅ Validate total slots input
- ✅ Handle database errors

#### 2. **Register Car Tests**
- ✅ Register car with valid plate and size
- ✅ Prevent duplicate registration
- ✅ Validate car size
- ✅ Validate required fields

#### 3. **Park Car Tests**
- ✅ Park car at available slot
- ✅ Fail if car not registered
- ✅ Fail if slot unavailable
- ✅ Fail if slot doesn't exist

#### 4. **Leave Car Tests**
- ✅ Remove car from parking slot
- ✅ Fail if car not registered
- ✅ Fail if car not currently parked

#### 5. **Get Status Tests**
- ✅ Return parking lot status
- ✅ Handle empty parking lots

#### 6. **Get Plates by Size Tests**
- ✅ Return plates for cars of size
- ✅ Validate car size
- ✅ Handle empty results

#### 7. **Get Slots by Size Tests**
- ✅ Return occupied slots by car size
- ✅ Validate car size

#### 8. **Add Empty Slot Tests**
- ✅ Add specified number of slots
- ✅ Require amount field
- ✅ Validate positive integers

#### 9. **Delete Empty Slot Tests**
- ✅ Delete available empty slots
- ✅ Fail if slot in use
- ✅ Fail if slot already deleted
- ✅ Fail if slot doesn't exist

## Mocking Strategy

All database calls are mocked using Jest's mock functionality:

```javascript
jest.mock('../db/database');

// In tests:
db.registerCar.mockResolvedValue(mockRecords);
db.parkCar.mockResolvedValue(mockResult);
```

This ensures tests:
- Run without database connection
- Execute instantly
- Are deterministic and repeatable
- Can test error scenarios easily

## Example Test

```javascript
describe('registerCar', () => {
  it('should register a car with valid plate and size', async () => {
    const mockRecords = [{
      _id: '1',
      plate_number: 'ABC-123',
      car_size: 'small',
      slot_number: null,
      status: null
    }];

    db.registerCar.mockResolvedValue(mockRecords);

    const req = { body: { plateNumber: 'ABC-123', carSize: 'small' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await parkingController.registerCar(req, res);

    expect(db.registerCar).toHaveBeenCalledWith('ABC-123', 'small');
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
  });
});
```

## What Gets Tested

### Positive Cases (Happy Path)
- Valid inputs produce expected responses
- Database calls are made with correct parameters
- Proper HTTP status codes and response formats

### Negative Cases
- Invalid inputs generate appropriate errors
- Missing required fields trigger validation errors
- Database errors are handled gracefully
- Business logic constraints are enforced

### Edge Cases
- Empty results (e.g., no cars registered)
- Boundary values (e.g., slot number 0 or negative)
- Already deleted/completed operations
- Concurrent state conflicts

## Coverage Report

Run `npm run test:coverage` to generate a detailed coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Current targets: 70% across all metrics

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
npm test -- --ci --coverage --maxWorkers=2
```

## Dependencies

- **jest** - Testing framework
- **supertest** - HTTP assertion library (optional for integration tests)

## Troubleshooting

### Tests Fail with "Cannot find module"
Ensure all relative paths in test imports match your project structure.

### Timeout Errors
- Check `jest.config.js` testTimeout setting
- Increase timeout if needed: `jest.setTimeout(15000)`

### Mock Not Working
- Verify mock path matches exact module path
- Clear mocks between tests: `jest.clearAllMocks()`

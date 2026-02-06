# Parking Lot API

Node.js + Express API for smart parking lot management with persistent mock database. Designed for sensor-based parking system where each sensor sends events as cars park/leave individual slots.

## Quick Start

```bash
cd "D:\Test Thaivivat\Parking-lot-api"
npm install
npm start
```

Server runs on `http://localhost:3000`

---

## Database Schema

### `parking_area` Table
Tracks parking slots and their status.

```json
{
---

## API Endpoints

### 1. Setup Parking Lot

**POST** `/api/parking-lots`

Initialize parking lot with total slots (typically called once at startup).

```bash
curl -X POST http://localhost:3000/api/parking-lots \
  -H "Content-Type: application/json" \
  -d '{"totalSlots": 20}'
```

**Response (201 Created):**
```json
{
  "message": "Parking lot created successfully",
  "totalSlots": 20,
  "availableSlots": 20
}
```

---

### 2. Register Car

**POST** `/api/cars/register`

Register car at checkpoint before parking. Does NOT allocate slots yet.

For **small** car: creates 1 record (unparked)
For **medium** car: creates 2 records (unparked)
For **large** car: creates 3 records (unparked)

```bash
curl -X POST http://localhost:3000/api/cars/register \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "ABC-123", "carSize": "small"}'
```

**Response (201 Created):**
```json
{
  "message": "Car registered",
  "plateNumber": "ABC-123",
  "carSize": "small",
  "records": [
    {
      "plate_number": "ABC-123",
      "car_size": "small",
      "slot_number": null,
      "status": null,
      "create_date": "2026-02-06T10:00:00.000Z",
      "update_date": "2026-02-06T10:00:00.000Z"
    }
  ]
}
```

**Error (409 Conflict):**
```json
{
  "error": "Car already registered"
}
```

---

### 3. Park Car

**POST** `/api/cars/park`

Sensor detects car entering slot. Each sensor sends one request per slot occupied.

**For small car (1 slot):** Send 1 request
**For medium car (2 slots):** Send 2 requests (one per sensor at each slot)
**For large car (3 slots):** Send 3 requests (one per sensor at each slot)

```bash
# Small car parking at slot 5
curl -X POST http://localhost:3000/api/cars/park \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "ABC-123", "slotNumber": 5}'

# Medium car - sensor 1 at slot 5
curl -X POST http://localhost:3000/api/cars/park \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 5}'

# Medium car - sensor 2 at slot 6
curl -X POST http://localhost:3000/api/cars/park \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 6}'
```

**Response (200 OK):**
```json
{
  "message": "Car parked successfully",
  "plateNumber": "ABC-123",
  "slotNumber": 5,
  "record": {
    "plate_number": "ABC-123",
    "car_size": "small",
    "slot_number": 5,
    "status": "park",
    "create_date": "2026-02-06T10:00:00.000Z",
    "update_date": "2026-02-06T10:01:00.000Z"
  }
}
```

**Errors:**
- 404 Not Found: Car not registered
- 409 Conflict: No unparked record for car / Car already at this slot

---

### 4. Leave Car

**POST** `/api/cars/leave`

Sensor detects car leaving slot. Each sensor sends one request per slot being freed.

```bash
# Small car leaving slot 5
curl -X POST http://localhost:3000/api/cars/leave \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "ABC-123", "slotNumber": 5}'

# Medium car leaving slot 5
curl -X POST http://localhost:3000/api/cars/leave \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 5}'

# Medium car leaving slot 6
curl -X POST http://localhost:3000/api/cars/leave \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 6}'
```

**Response (200 OK):**
```json
{
  "message": "Car left successfully",
  "plateNumber": "ABC-123",
  "slotNumber": 5,
  "record": {
    "plate_number": "ABC-123",
    "car_size": "small",
    "slot_number": 5,
    "status": "leave",
    "create_date": "2026-02-06T10:00:00.000Z",
    "update_date": "2026-02-06T10:02:00.000Z"
  }
}
```

**Errors:**
- 404 Not Found: Car not found / Record not at this slot
- 400 Bad Request: Car not currently parked at this slot

---

### 5. Get Parking Lot Status

**GET** `/api/parking-lot/status`

Get real-time status of all parking slots and parked cars.

```bash
curl http://localhost:3000/api/parking-lot/status
```

**Response (200 OK):**
```json
{
  "totalSlots": 20,
  "availableSlotCount": 18,
  "occupiedSlotCount": 2,
  "availableSlotNumbers": [3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  "parkingArea": [...],
  "parkedCars": [...]
}
```

---

### 6. Get Parked Car Plates by Size

**GET** `/api/cars/parked?size=small`

Get all registration plate numbers for parked cars of specific size.

```bash
curl "http://localhost:3000/api/cars/parked?size=small"
curl "http://localhost:3000/api/cars/parked?size=medium"
curl "http://localhost:3000/api/cars/parked?size=large"
```

**Response (200 OK):**
```json
{
  "size": "small",
  "plates": ["ABC-123", "DEF-456"],
  "count": 2
}
```

---

### 7. Get Parked Slots by Car Size

**GET** `/api/spaces/parked?size=medium`

Get all slot numbers occupied by parked cars of specific size.

```bash
curl "http://localhost:3000/api/spaces/parked?size=small"
curl "http://localhost:3000/api/spaces/parked?size=medium"
curl "http://localhost:3000/api/spaces/parked?size=large"
```

**Response (200 OK):**
```json
{
  "size": "medium",
  "slots": [5, 6, 10, 11],
  "count": 4
}
```

---

### 8. Add Empty Slot

**POST** `/api/slots/create`

Add new empty slot to parking lot dynamically.

```bash
curl -X POST http://localhost:3000/api/slots/create \
  -H "Content-Type: application/json"
```

**Response (201 Created):**
```json
{
  "message": "Empty slot added successfully",
  "slot": {
    "slot_number": 21,
    "slot_available": true,
    "active": true,
    "update_date": "2026-02-06T10:00:00.000Z"
}
```

---

### 9. Delete Empty Slot

**DELETE** `/api/slots/delete?slotNumber=21`

Delete empty slot (flags as inactive, keeps record for audit).

```bash
curl -X DELETE "http://localhost:3000/api/slots/delete?slotNumber=21"
```

**Response (200 OK):**
```json
{
  "message": "Empty slot deleted successfully",
  "slotNumber": 21
}
```

**Errors:**
- 404 Not Found: Slot not found / Slot already deleted
- 409 Conflict: Cannot delete occupied slot

---

## Complete Workflow Example

### Scenario: Medium car parking (occupies 2 slots)

```bash
# 1. Initialize parking lot (startup)
curl -X POST http://localhost:3000/api/parking-lots \
  -H "Content-Type: application/json" \
  -d '{"totalSlots": 20}'

# 2. Car enters checkpoint - register
curl -X POST http://localhost:3000/api/cars/register \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "carSize": "medium"}'

# 3. Car enters parking - sensor 1 detects
curl -X POST http://localhost:3000/api/cars/park \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 5}'

# 4. Car continues - sensor 2 detects
curl -X POST http://localhost:3000/api/cars/park \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 6}'

# 5. Check status
curl http://localhost:3000/api/parking-lot/status

# 6. Car leaves - sensor 1 detects
curl -X POST http://localhost:3000/api/cars/leave \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 5}'

# 7. Car continues - sensor 2 detects
curl -X POST http://localhost:3000/api/cars/leave \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "slotNumber": 6}'
```

---

## Project Structure

```
Parking-lot-api/
├── index.js                  # Main server entry point
├── package.json              # Dependencies
├── README.md                 # This file
├── controllers/
│   └── parkingController.js  # Request handlers
├── routes/
│   └── parkingRoutes.js      # API route definitions
├── db/
│   ├── mockDatabase.js       # Database layer
│   ├── parking_area.json     # Parking slots data
│   └── car_register.json     # Car registration data
├── models/
│   ├── parkingAreaModel.js   # Parking area schema
│   ├── carModel.js           # Car register schema
│   ├── requestModels.js      # Request body schemas
│   └── responseModels.js     # Response schemas
└── constants/
    ├── errors.js             # Error messages
    ├── messages.js           # Success messages
    └── httpStatus.js         # HTTP status codes
```

---

## Notes

- Mock database persists to JSON files: `parking_area.json` and `car_register.json`
- For multi-slot cars (medium/large), each record occupies exactly one slot
- Deleted slots are flagged as inactive (`active: false`) for audit trail
- All timestamps are ISO 8601 format
- Sensor-based system: no pre-validation before parking, sensors provide authoritative data
  "active": true,
  "update_date": "2026-02-06T10:00:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `slot_number` | Int | Unique slot identifier |
| `slot_available` | Bool | Whether slot is free (true) or occupied (false) |
| `active` | Bool | Whether slot is active (true) or deleted (false) |
| `update_date` | String | ISO timestamp of last update |

### `car_register` Table
Tracks car registration and parking records.

```json
{
  "plate_number": "ABC-123",
  "car_size": "small",
  "slot_number": 5,
  "create_date": "2026-02-06T10:00:00.000Z",
  "update_date": "2026-02-06T10:01:00.000Z",
  "status": "park"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `plate_number` | String | Vehicle registration plate |
| `car_size` | String | "small" (1 slot), "medium" (2 slots), "large" (3 slots) |
| `slot_number` | Int or Null | Allocated slot number (null when unparked) |
| `status` | String | null (unregistered), "park" (parked), "leave" (left) |
| `create_date` | String | ISO timestamp of registration |
| `update_date` | String | ISO timestamp of last update |

### Car Size & Slot Requirements
- **small**: occupies 1 slot (creates 1 car_register record)
- **medium**: occupies 2 slots (creates 2 car_register records)
- **large**: occupies 3 slots (creates 3 car_register records)

Node.js + Express API for parking lot management with persistent mock database.

## Database Tables

### `parking_area`
- `slot_number` (int): Unique slot identifier
- `slot_available` (boolean): Whether slot is free
- `update_date` (datetime): Last update timestamp

### `car_register`
- `plate_number` (string): Vehicle registration plate
- `car_size` (string): small, medium, or large
- `slot_numbers` (array): Allocated slot numbers (1 slot for small, 2 for medium, 3 for large)
- `status` (string): null (unparked), "park" (parked), "leave" (left)
- `create_date` (datetime): Registration timestamp
- `update_date` (datetime): Last update timestamp

## Car Size & Slot Requirements

- **small**: occupies 1 consecutive slot
- **medium**: occupies 2 consecutive slots
- **large**: occupies 3 consecutive slots

## API Endpoints

### 1. Create Parking Lot (Setup)
```
POST /api/parking-lots
Body: { "totalSlots": 10 }
Response: { "message": "...", "totalSlots": 10, "availableSlots": 10 }
```

### 2. Register Car (Without Parking)
```
POST /api/cars
Body: { "plateNumber": "ABC-123", "carSize": "small" }
Response: { "message": "...", "car": {...} }
```

### 3. Park Car (Allocate Slots)
```
POST /api/cars/:plateNumber/park
Body: {}
Response: { "message": "...", "car": {...} }
```
- Finds consecutive available slots based on car size
- Returns error if insufficient consecutive slots

### 4. Leave Car (Free Slots)
```
POST /api/cars/:plateNumber/leave
Body: {}
Response: { "message": "...", "car": {...}, "freedSlots": [...] }
```

### 5. Get Parking Lot Status
```
GET /api/parking-lot/status
Response:
{
  "totalSlots": 10,
  "availableSlotCount": 7,
  "occupiedSlotCount": 3,
  "availableSlotNumbers": [4, 5, 6, 8, 9, 10],
  "parkingArea": [...],
  "parkedCars": [...]
}
```

### 6. Get Parked Car Plates by Size
```
GET /api/cars/parked?size=small
Response: { "size": "small", "plates": ["ABC-123", "XYZ-999"], "count": 2 }
```

### 7. Get Parked Slots by Car Size
```
GET /api/spaces/parked?size=medium
Response: { "size": "medium", "slots": [2, 3, 7, 8], "count": 4 }
```

## Quick Start

```bash
cd "D:\Test Thaivivat\Parking-lot-api"
npm install
npm start
```

Server runs on `http://localhost:3000`

## Example Usage

```bash
# 1. Create parking lot with 10 slots
curl -X POST http://localhost:3000/api/parking-lots \
  -H "Content-Type: application/json" \
  -d '{"totalSlots": 10}'

# 2. Register cars
curl -X POST http://localhost:3000/api/cars \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "ABC-123", "carSize": "small"}'

curl -X POST http://localhost:3000/api/cars \
  -H "Content-Type: application/json" \
  -d '{"plateNumber": "XYZ-999", "carSize": "medium"}'

# 3. Park cars
curl -X POST http://localhost:3000/api/cars/ABC-123/park \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3000/api/cars/XYZ-999/park \
  -H "Content-Type: application/json"

# 4. Get status
curl http://localhost:3000/api/parking-lot/status

# 5. Get parked small car plates
curl http://localhost:3000/api/cars/parked?size=small

# 6. Get parked medium car slots
curl http://localhost:3000/api/spaces/parked?size=medium

# 7. Leave
curl -X POST http://localhost:3000/api/cars/ABC-123/leave \
  -H "Content-Type: application/json"
```

## Database File

Mock database is persisted to `db/mock-db.json`

# Parking Lot API

Node.js + Express API for parking lot management with MongoDB.

## Setup

```bash
npm install
npm start
npm run dev      # with auto-reload
```

Environment variables (.env):
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=parking_db
PORT=3000
```

Server runs on `http://localhost:3000`

## API Endpoints

### Parking Lot Setup
- **POST** `/api/parking-lots` - Create parking lot
- **POST** `/api/slots/create` - Add empty slot
- **DELETE** `/api/slots/delete?slotNumber=1` - Delete empty slot

### Car Operations
- **POST** `/api/cars/register` - Register car
- **POST** `/api/cars/park` - Park car at slot
- **POST** `/api/cars/leave` - Leave car from slot

### Status & Queries
- **GET** `/api/parking-lot/status` - Get parking lot status
- **GET** `/api/cars/parked?size=small` - Get parked car plates by size
- **GET** `/api/spaces/parked?size=small` - Get parked slots by size

## Database Schema

### parking_area
| Field | Type |
|-------|------|
| slot_number | Int |
| slot_available | Boolean |
| active | Boolean |
| update_date | ISO String |

### car_register
| Field | Type |
|-------|------|
| plate_number | String |
| car_size | String (small/medium/large) |
| slot_number | Int or Null |
| status | String (null/park/leave) |
| create_date | ISO String |
| update_date | ISO String |

Car sizes:
- small: 1 slot
- medium: 2 slots
- large: 3 slots

## Project Structure

```
├── index.js
├── package.json
├── controllers/
│   └── parkingController.js
├── routes/
│   └── parkingRoutes.js
├── db/
│   ├── connection.js
│   ├── database.js
│   ├── carModel.js
│   └── parkingAreaModel.js
├── models/
│   ├── carModel.js
│   └── parkingAreaModel.js
├── utils/
│   └── validators.js
└── constants/
    ├── errors.js
    ├── messages.js
    └── httpStatus.js
```

## Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

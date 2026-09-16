# Charging Stations Feature: End-to-End Typed Integration Specification

This document defines the strict API contracts, data types, field constraints, query parameters, request/response schemas, and real-time WebSocket protocols for the **Charging Stations** feature across all lifecycle phases.

---

## 1. Data Types & Entity Schema Definitions

### 1.1 `ChargingStation` Entity

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (ID/UUID)` | **Yes** | Unique primary identifier for the Charging Station. |
| `name` | `string` | **Yes** | Human-readable name of the station. |
| `code` | `string` | **Yes** | Unique alphanumeric station code (e.g., uppercase/dashes). |
| `brand` | `string \| null` | No | OEM brand or operating brand name. |
| `mobilityType` | `string \| null` | No | Vehicle segment (e.g., `2-Wheeler`, `3-Wheeler`, `4-Wheeler`, `Commercial Fleet`). |
| `stationType` | `string \| null` | No | Access tier (e.g., `Public`, `Private`, `Semi-Public`). |
| `category` | `string \| null` | No | Location category (e.g., `Highway`, `Urban`, `Depot`, `Commercial Hub`). |
| `address` | `string \| null` | No | Full street address. |
| `city` | `string \| null` | No | City of installation. |
| `state` | `string \| null` | No | State or province. |
| `country` | `string \| null` | No | Country name (e.g., `India`). |
| `timeZone` | `string \| null` | No | IANA Time Zone string (e.g., `Asia/Kolkata`, `UTC`). |
| `latitude` | `number (float) \| null` | No | GPS Latitude coordinate (`-90.0` to `90.0`). |
| `longitude` | `number (float) \| null` | No | GPS Longitude coordinate (`-180.0` to `180.0`). |
| `elevation` | `number (float \| integer) \| null` | No | Elevation above sea level in meters. |
| `gridPowerCapacity` | `number (float) \| null` | No | Total connected grid power capacity in kW. |
| `gridCurrentCapacity` | `number (float) \| null` | No | Total grid current capacity in Amperes (A). |
| `gridPhases` | `string \| null` | No | Phase configuration (e.g., `Single Phase`, `Three Phase`). |
| `energyMeters` | `string \| null` | No | Energy meter specification / model. |
| `stage` | `enum ("Operational" \| "Testing" \| "Commissioning" \| "Inactive")` | **Yes** | Operational lifecycle stage. |
| `open247` | `boolean` | **Yes** | Flag indicating if station is accessible 24/7. |
| `opensAt` | `string (HH:mm) \| null` | No | Daily opening time if `open247` is `false`. |
| `closesAt` | `string (HH:mm) \| null` | No | Daily closing time if `open247` is `false`. |
| `contactNumbers` | `Array<string>` | No | List of customer/support phone numbers. |
| `amenities` | `string \| null` | No | Comma-separated or string list of available amenities. |
| `chargePoints` | `number (integer >= 0)` | **Yes** | Count of associated Charge Points. |
| `chargePointName` | `string \| null` | No | Name of primary/first charge point. |
| `chargePointId` | `string (ID) \| null` | No | ID of primary/first charge point. |
| `chargePointsList` | `Array<ChargePointSummary>` | No | Sub-array of summary objects for associated charge points. |
| `totalSessions` | `number (integer >= 0)` | No | Cumulative count of charging sessions completed. |
| `energyDelivered` | `number (float >= 0.0)` | No | Cumulative energy delivered in kWh. |
| `revenueGenerated` | `number (float >= 0.0)` | No | Cumulative revenue generated in base currency. |
| `createdOn` | `string` | No | UI-formatted creation timestamp string. |
| `createdAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC creation timestamp. |
| `updatedAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC last update timestamp. |

---

### 1.2 `ChargePoint` Entity

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (ID/UUID)` | **Yes** | Unique primary identifier for the Charge Point. |
| `name` | `string` | **Yes** | Name of the charge point charger. |
| `code` | `string` | **Yes** | Charge Point Identifier (CPID / OCPP Identity). |
| `chargingStationId` | `string (ID)` | **Yes** | Foreign key linking to parent `ChargingStation.id`. |
| `chargingStation` | `Object \| null` | No | Nested object containing `{ id: string, name: string }`. |
| `status` | `enum ("Available" \| "Preparing" \| "Charging" \| "SuspendedEVSE" \| "SuspendedEV" \| "Finishing" \| "Reserved" \| "Unavailable" \| "Faulted" \| "Offline")` | **Yes** | Live OCPP operational status. |
| `stage` | `enum ("Active" \| "Inactive" \| "Under Maintenance")` | **Yes** | Administrative stage. |
| `type` | `enum ("AC" \| "DC")` | **Yes** | Power conversion type. |
| `mode` | `string \| null` | No | Charging mode (e.g., `Mode 3`, `Mode 4`). |
| `totalCapacity` | `number (float > 0)` | **Yes** | Maximum rated power capacity in kW. |
| `oem` / `manufacturer` | `string \| null` | No | Manufacturer hardware vendor name. |
| `firmwareVersion` | `string \| null` | No | Current installed firmware version string. |
| `thirdPartyCpId` | `string \| null` | No | External roaming / OCPI network identifier. |
| `qrCodeId` | `string \| null` | No | Scannable QR code identifier mapped to charger. |
| `mobilityType` | `string \| null` | No | Supported vehicle class. |
| `lastActive` | `string \| null` | No | Timestamp string of last received heartbeat or meter value. |
| `connectors` | `Array<ConnectorEntity>` | **Yes** | Array of physical connectors attached to this charge point. |
| `tariff` | `Object \| null` | No | Attached tariff profile `{ id: string, name: string, baseRate: number }`. |
| `createdAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC creation timestamp. |
| `updatedAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC last update timestamp. |

---

### 1.3 `LiveSession` / `Transaction` Telemetry Entity

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` / `sessionId` | `string (ID)` | **Yes** | Unique session database primary key. |
| `chargeTxCode` | `string` | **Yes** | OCPP transaction identifier. |
| `billCode` | `string \| null` | No | Generated invoice / billing reference code. |
| `billId` | `string (ID) \| null` | No | Foreign key to generated `Bill.id` upon completion. |
| `userName` | `string` | **Yes** | Full name of the authenticated EV driver. |
| `userInitials` | `string` | **Yes** | Two-character driver initials badge. |
| `userColor` | `string` | **Yes** | CSS color class token for avatar badge. |
| `chargingStationId` | `string (ID)` | **Yes** | Foreign key to `ChargingStation.id`. |
| `chargingStationName` | `string` | **Yes** | Name of the parent charging station. |
| `chargePointId` | `string (ID)` | **Yes** | Foreign key to `ChargePoint.id`. |
| `chargePointName` | `string` | **Yes** | Name of the active charge point. |
| `chargePointCode` | `string` | **Yes** | Hardware CPID code. |
| `connector` | `string` | **Yes** | Formatted connector label (e.g., `CCS2 (1)`). |
| `status` | `enum ("Ongoing" \| "Completed" \| "Failed" \| "Stopped")` | **Yes** | Current lifecycle state of the session. |
| `initialSoc` | `number (float: 0.0 - 100.0)` | **Yes** | Battery State of Charge at session start (%). |
| `currentSoc` | `number (float: 0.0 - 100.0)` | **Yes** | Latest reported battery State of Charge (%). |
| `kwhDelivered` | `number (float >= 0.0)` | **Yes** | Cumulative energy delivered during session (kWh). |
| `totalCost` | `number (float >= 0.0)` | **Yes** | Cumulative calculated cost in base currency. |
| `powerKw` | `number (float >= 0.0)` | **Yes** | Instantaneous active power reading (kW). |
| `voltage` | `number (float >= 0.0)` | **Yes** | Instantaneous line voltage reading (V). |
| `current` / `currentA` | `number (float >= 0.0)` | **Yes** | Instantaneous current draw reading (A). |
| `duration` | `string (HH:mm:ss)` | **Yes** | Elapsed session charging duration. |
| `createdAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC timestamp when session commenced. |
| `updatedAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC timestamp of latest telemetry frame. |

---

## 2. API Endpoints by Phase

### Phase 1: List View (`/charging-stations`)

#### 1.1 Dynamic Filter Options
* **HTTP Method**: `GET`
* **Route**: `/api/charging-stations/filters`
* **Request Headers**:
  - `Authorization`: `Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "mobilityType": "Array<string>",
  "stationType": "Array<string>",
  "stage": "Array<string>"
}
```

#### 1.2 Paginated Stations Query
* **HTTP Method**: `GET`
* **Route**: `/api/charging-stations`
* **Query Parameters**:
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
  - `search`: `string (optional)`
  - `filters`: `string (optional, JSON stringified { mobilityType?: Array<string>, stationType?: Array<string>, stage?: Array<string> })`
* **Request Headers**:
  - `Authorization`: `Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "name": "string",
      "code": "string",
      "brand": "string | null",
      "mobilityType": "string | null",
      "stationType": "string | null",
      "address": "string | null",
      "city": "string | null",
      "state": "string | null",
      "country": "string | null",
      "latitude": "number (float) | null",
      "longitude": "number (float) | null",
      "elevation": "number (float | integer) | null",
      "gridPowerCapacity": "number (float) | null",
      "gridCurrentCapacity": "number (float) | null",
      "gridPhases": "string | null",
      "energyMeters": "string | null",
      "stage": "string (enum: Operational | Testing | Commissioning | Inactive)",
      "open247": "boolean",
      "opensAt": "string (HH:mm) | null",
      "closesAt": "string (HH:mm) | null",
      "contactNumbers": "Array<string>",
      "amenities": "string | null",
      "chargePoints": "number (integer >= 0)",
      "chargePointName": "string | null",
      "chargePointId": "string (ID) | null",
      "chargePointsList": [
        {
          "id": "string (ID)",
          "name": "string",
          "code": "string",
          "status": "string"
        }
      ],
      "createdOn": "string",
      "createdAt": "string (ISO-8601 DateTime)",
      "updatedAt": "string (ISO-8601 DateTime)"
    }
  ],
  "total": "number (integer >= 0)",
  "page": "number (integer >= 1)",
  "limit": "number (integer >= 1)",
  "totalPages": "number (integer >= 1)"
}
```

---

### Phase 2: Create Station (`POST /api/charging-stations`)

* **HTTP Method**: `POST`
* **Route**: `/api/charging-stations`
* **Request Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <string (JWT)>`
* **Request Body Typed Schema**:
```json
{
  "name": "string (required, minLength: 2)",
  "code": "string (required, unique)",
  "brand": "string | null",
  "mobilityType": "string | null",
  "category": "string | null",
  "address": "string | null",
  "city": "string | null",
  "state": "string | null",
  "country": "string | null",
  "timeZone": "string | null",
  "latitude": "number (float: -90.0 to 90.0) | null",
  "longitude": "number (float: -180.0 to 180.0) | null",
  "elevation": "number (float | integer) | null",
  "gridPowerCapacity": "number (float >= 0.0) | null",
  "gridCurrentCapacity": "number (float >= 0.0) | null",
  "gridPhases": "string | null",
  "energyMeters": "string | null",
  "stage": "string (enum: Operational | Testing | Commissioning | Inactive)",
  "open247": "boolean",
  "opensAt": "string (HH:mm) | null",
  "closesAt": "string (HH:mm) | null",
  "contactNumbers": "Array<string>",
  "amenities": "string | null"
}
```
* **Response Status**: `201 Created`
* **Response Body Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "brand": "string | null",
  "createdAt": "string (ISO-8601 DateTime)"
}
```

---

### Phase 3: Edit Station (`PUT /api/charging-stations/:id`)

* **HTTP Method**: `PUT`
* **Route**: `/api/charging-stations/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <string (JWT)>`
* **Request Body Typed Schema**: Same schema as Phase 2 Create Station.
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "brand": "string | null",
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

---

### Phase 4: Delete Station (`DELETE /api/charging-stations/:id`)

* **HTTP Method**: `DELETE`
* **Route**: `/api/charging-stations/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**:
  - `Authorization`: `Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "success": "boolean (true)",
  "message": "string"
}
```

---

### Phase 5: View Station Details (`GET /api/charging-stations/:id`)

* **HTTP Method**: `GET`
* **Route**: `/api/charging-stations/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**:
  - `Authorization`: `Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "brand": "string | null",
  "mobilityType": "string | null",
  "stationType": "string | null",
  "address": "string | null",
  "city": "string | null",
  "state": "string | null",
  "country": "string | null",
  "latitude": "number (float) | null",
  "longitude": "number (float) | null",
  "elevation": "number (float | integer) | null",
  "gridPowerCapacity": "number (float) | null",
  "gridCurrentCapacity": "number (float) | null",
  "gridPhases": "string | null",
  "energyMeters": "string | null",
  "stage": "string",
  "open247": "boolean",
  "opensAt": "string (HH:mm) | null",
  "closesAt": "string (HH:mm) | null",
  "contactNumbers": "Array<string>",
  "amenities": "string | null",
  "chargePoints": [
    {
      "id": "string (ID)",
      "name": "string",
      "code": "string",
      "status": "string (enum: Available | Preparing | Charging | SuspendedEVSE | SuspendedEV | Finishing | Reserved | Unavailable | Faulted | Offline)",
      "type": "string (enum: AC | DC)",
      "totalCapacity": "number (float)"
    }
  ],
  "createdAt": "string (ISO-8601 DateTime)",
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

---

### Phase 6: Sub-Tabs Inside Station View

#### 6.1 Sub-Tab 1: Charge Points List Scoped to Station
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points`
* **Query Parameters**:
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
  - `chargingStationId`: `string (ID)`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "name": "string",
      "code": "string",
      "chargingStationId": "string (ID)",
      "chargingStation": {
        "id": "string (ID)",
        "name": "string"
      },
      "status": "string (enum: Available | Preparing | Charging | SuspendedEVSE | SuspendedEV | Finishing | Reserved | Unavailable | Faulted | Offline)",
      "stage": "string (enum: Active | Inactive | Under Maintenance)",
      "type": "string (enum: AC | DC)",
      "mode": "string | null",
      "totalCapacity": "number (float > 0.0)",
      "manufacturer": "string | null",
      "firmwareVersion": "string | null",
      "lastActive": "string | null",
      "connectors": [
        {
          "id": "string (ID)",
          "connectorId": "number (integer >= 1)",
          "type": "string",
          "status": "string (enum: Available | Charging | Faulted | Unavailable)",
          "maxPower": "number (float > 0.0)"
        }
      ],
      "tariff": {
        "id": "string (ID) | null",
        "name": "string | null"
      },
      "createdAt": "string (ISO-8601 DateTime)"
    }
  ],
  "total": "number (integer >= 0)",
  "page": "number (integer >= 1)",
  "limit": "number (integer >= 1)",
  "totalPages": "number (integer >= 1)"
}
```

#### 6.2 Sub-Tab 2: Transactions / Sessions Scoped to Station
* **HTTP Method**: `GET`
* **Route**: `/api/live-sessions/history`
* **Query Parameters**:
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
  - `chargingStationId`: `string (ID)`
  - `search`: `string (optional)`
  - `status`: `string (optional: "All" | "Ongoing" | "Completed" | "Failed")`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "sessionId": "string (ID)",
      "chargeTxCode": "string",
      "billCode": "string | null",
      "billId": "string (ID) | null",
      "userName": "string",
      "userInitials": "string",
      "userColor": "string",
      "chargingStationId": "string (ID)",
      "chargingStationName": "string",
      "chargePointId": "string (ID)",
      "chargePointName": "string",
      "chargePointCode": "string",
      "connector": "string",
      "status": "string (enum: Ongoing | Completed | Failed | Stopped)",
      "initialSoc": "number (float: 0.0 - 100.0)",
      "currentSoc": "number (float: 0.0 - 100.0)",
      "kwhDelivered": "number (float >= 0.0)",
      "totalCost": "number (float >= 0.0)",
      "powerKw": "number (float >= 0.0)",
      "voltage": "number (float >= 0.0)",
      "current": "number (float >= 0.0)",
      "duration": "string (HH:mm:ss)",
      "createdAt": "string (ISO-8601 DateTime)",
      "updatedAt": "string (ISO-8601 DateTime)"
    }
  ],
  "total": "number (integer >= 0)",
  "page": "number (integer >= 1)",
  "limit": "number (integer >= 1)",
  "totalPages": "number (integer >= 1)"
}
```

---

### Phase 7: CSV Export (`GET /api/charging-stations/export`)

* **HTTP Method**: `GET`
* **Route**: `/api/charging-stations/export`
* **Query Parameters**:
  - `search`: `string (optional)`
* **Response Headers**:
  - `Content-Type`: `text/csv; charset=utf-8`
  - `Content-Disposition`: `attachment; filename="charging_stations_export_<YYYY-MM-DD>.csv"`
* **Streamed CSV Column Specification**:

| Column Name | Data Type Format |
| :--- | :--- |
| `Station ID` | `string (ID)` |
| `Station Name` | `string` |
| `Station Code` | `string` |
| `Brand` | `string` |
| `Mobility Type` | `string` |
| `Station Type` | `string` |
| `City` | `string` |
| `State` | `string` |
| `Charge Points Count` | `number (integer)` |
| `Created Date` | `string (ISO-8601 DateTime)` |

---

## 3. Real-Time WebSocket Contract Specification

### 3.1 Room Management Protocol

| Client Event | Direction | Payload Type | Behavior |
| :--- | :--- | :--- | :--- |
| `join:room` | Client -> Server | `string` (e.g., `chargingstation:<stationId>`) | Subscribes socket connection to the station room channel. |
| `leave:room` | Client -> Server | `string` (e.g., `chargingstation:<stationId>`) | Unsubscribes socket connection when all components unmount. |

### 3.2 Real-Time Event Payloads

| Event Name | Direction | Payload Type | Target Room | Handling Component |
| :--- | :--- | :--- | :--- | :--- |
| `chargingStationAdded` | Server -> Client | `ChargingStation Entity` | Global Broadcast | `ChargingStationsList.jsx` |
| `chargingStationUpdated` | Server -> Client | `ChargingStation Entity` | `chargingstation:<id>` + Global | `ChargingStationsList.jsx`, `ViewChargingStation.jsx` |
| `chargingStationDeleted` | Server -> Client | `string (ID)` | Global Broadcast | `ChargingStationsList.jsx` |
| `chargePointUpdated` | Server -> Client | `ChargePoint Entity` | `chargingstation:<csId>` | `StationChargePointsTab.jsx`, `ChargePointsList.jsx` |
| `chargePointAdded` | Server -> Client | `ChargePoint Entity` | `chargingstation:<csId>` | `StationChargePointsTab.jsx`, `ChargePointsList.jsx` |
| `chargePointDeleted` | Server -> Client | `string (ID)` | `chargingstation:<csId>` | `StationChargePointsTab.jsx`, `ChargePointsList.jsx` |
| `session:created` | Server -> Client | `LiveSession Telemetry Entity` | `chargingstation:<csId>` | `StationTransactionsTab.jsx`, `useStationTransactions.js` |
| `session:updated` | Server -> Client | `LiveSession Telemetry Entity` | `chargingstation:<csId>` | `StationTransactionsTab.jsx`, `useStationTransactions.js` |
| `session:stopped` | Server -> Client | `LiveSession Telemetry Entity` | `chargingstation:<csId>` | `StationTransactionsTab.jsx`, `useStationTransactions.js` |
| `session:completed` | Server -> Client | `{ sessionId: string (ID), billId: string (ID) }` | `chargingstation:<csId>` | `StationTransactionsTab.jsx` |

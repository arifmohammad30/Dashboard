# Complete Charging Stations Integration Specification
### List View, Details View, Add/Edit Forms & Socket.IO Protocol

---

## Executive Summary & Architecture Overview

This document provides the complete integration specification for the **Charging Stations Module** (`/charging-stations`, `/charging-stations/:id`, `/charging-stations/new`, and `/charging-stations/edit/:id`).

The integration architecture utilizes a **hybrid REST API + Socket.IO real-time engine**:

- **HTTP REST APIs**: Serves initial list synchronization, station creation, details fetch, updates, deletion, tab data fetching, and CSV exports.
- **Socket.IO Real-Time Engine**: On mounting `/charging-stations/:id`, the frontend auto-joins room `chargingstation:<id>` to receive live transaction broadcasts (`session:created`, `session:updated`, `session:stopped`).

```text
  ┌─────────────────────────┐
  │ EV Charger [OCPP 1.6J]  │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │      CSMS Backend       │
  └─────┬─────────────┬─────┘
        │             │
  HTTP REST APIs  Socket.IO Real-Time Engine
  (CRUD & Tabs)   (Room: chargingstation:<id>)
        │             │
        ▼             ▼
  ┌─────────────────────────┐
  │   Frontend Dashboard    │
  │  (/charging-stations |  │
  │ /charging-stations/:id) │
  └─────────────────────────┘
```

---

## Flow 1: Charging Stations List View (`/charging-stations`)

### A. Page Overview
- **Route**: `/charging-stations` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `ChargingStationsList.jsx`
- **Displays**: Search input toolbar, multi-criteria filter dropdowns (`mobilityType`, `stationType`, `stage`), Charging Stations datatable (Name, Code, Linked Charge Points Popover, Total Capacity, Station Type, Mobility Type, Created Date, Latitude, Longitude, Actions), Add Station button, and server-side pagination controls.

### B. HTTP REST API: List Charging Stations
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charging-stations`
- **When Called**: On page load, search query change, filter selection, or pagination page click.

#### Query Parameters:
| Parameter | Type | Default | Evidence | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `Number` | `1` | **CONFIRMED FROM FRONTEND** | 1-based page index |
| `limit` | `Number` | `10` | **CONFIRMED FROM FRONTEND** | Records per page |
| `search` | `String` | `""` | **CONFIRMED FROM FRONTEND** | Search text query string. *(Exact searchable backend fields are a **BACKEND DECISION**)* |
| `filters` | `String (JSON)` | `"{}"` | **CONFIRMED FROM FRONTEND** | Serialized JSON filter object: `{"mobilityType":[],"stationType":[],"stage":[]}` |

#### Response Schema (JSON - `200 OK`):
```json
{
  "data": [
    {
      "id": "st_101",
      "name": "Lonavala Wax Museum Hub",
      "code": "HUB-101",
      "chargePointsList": [
        {
          "id": "cp_101",
          "name": "Lonavala-CP-01",
          "code": "CP-101"
        }
      ],
      "totalCapacity": "120 kW",
      "stationType": "Public Fast Hub",
      "mobilityType": "Stationary",
      "createdOn": "2026-08-15",
      "latitude": 18.7557,
      "longitude": 73.4091
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

### C. HTTP REST API: Filter Options
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charging-stations/filters`
- **When Called**: On list component mount to populate filter dropdown options.
- **Contract Rule**: The response returns an object with dynamic array values for the 3 frontend filter categories. *(Individual option values are dynamic strings determined by **BACKEND DECISION**)*.

#### Response Schema (JSON - `200 OK`):
```json
{
  "mobilityType": ["Stationary", "Portable"],
  "stationType": ["Public Fast Hub", "Commercial Depot"],
  "stage": ["Active", "Under Construction"]
}
```

### D. HTTP REST API: Delete Charging Station
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/charging-stations/:id`
- **Path Parameter**: `id` (`string`) — Authoritative Charging Station ID. **[CONFIRMED FROM FRONTEND]**
- **When Called**: User clicks Delete icon on a list row and confirms in DeleteModal.

#### Response Schema (JSON - `200 OK`):
```json
{
  "success": true,
  "message": "Charging station deleted successfully"
}
```
- **Frontend Reaction**: Refreshes data list via `await reloadData()`, updates total count, and displays success toast notification. *(Cascade / dependency rules are a **BACKEND DECISION**)*.

### E. HTTP REST API: Export CSV Report
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charging-stations/export`
- **Query Parameter**: `search` (`string`, optional) — Active search filter. *(Note: List multi-filters are not sent to export; exact CSV columns are a **BACKEND DECISION**)*.
- **Response**: Binary CSV file stream downloaded as `charging_stations_export_YYYY-MM-DD.csv`.

---

## Flow 2: Add New Charging Station (`/charging-stations/new`)

### A. Page Overview
- **Route**: `/charging-stations/new` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `AddChargingStation.jsx`
- **Validation Engine**: Zod Schema + React Hook Form.

### B. Client-Side Form Validation Rules (Zod Schema)
- **`name`**: Required, min 2 characters. **[CONFIRMED FROM FRONTEND]**
- **`brand`**: Required selection, min 1 character. **[CONFIRMED FROM FRONTEND]**
- **`mobilityType`**: Required selection, min 1 character. **[CONFIRMED FROM FRONTEND]**
- **`code`**: Optional, alphanumeric regex `/^[A-Za-z0-9_-]+$/`. **[CONFIRMED FROM FRONTEND]**
- **`category`**: Optional string. **[CONFIRMED FROM FRONTEND]**
- **`latitude`**: Required float coordinate within `[-90, 90]`. **[CONFIRMED FROM FRONTEND]**
- **`longitude`**: Required float coordinate within `[-180, 180]`. **[CONFIRMED FROM FRONTEND]**
- **`address`**: Required, min 4 characters. **[CONFIRMED FROM FRONTEND]**
- **`country`**, **`state`**, **`city`**, **`timeZone`**: Optional strings. **[CONFIRMED FROM FRONTEND]**
- **`elevation`**: Optional non-negative number $\ge 0$. **[CONFIRMED FROM FRONTEND]**
- **`gridPowerCapacity`**: Optional positive number $> 0$ in kW. **[CONFIRMED FROM FRONTEND]**
- **`gridCurrentCapacity`**: Optional positive number $> 0$ in A. **[CONFIRMED FROM FRONTEND]**
- **`gridPhases`**, **`energyMeters`**, **`stage`**: Optional strings. **[CONFIRMED FROM FRONTEND]**
- **`open247`**: Optional boolean, default `false`. **[CONFIRMED FROM FRONTEND]**
- **`opensAt`** & **`closesAt`**: Required time strings matching 12h or 24h format (e.g. `08:00 am` or `08:00`) when `open247 === false`. **[CONFIRMED FROM FRONTEND]**
- **`contactNumbers`**: Optional array of phone strings matching `/^\+?[0-9\s-]{7,15}$/`. **[CONFIRMED FROM FRONTEND]**
- **`amenities`**: Optional string. **[CONFIRMED FROM FRONTEND]**

### C. HTTP REST API: Create Charging Station
- **HTTP Method**: `POST`
- **Endpoint**: `/api/charging-stations`

#### Request Body (JSON):
```json
{
  "name": "Lonavala Wax Museum Hub",
  "brand": "Pulse Energy",
  "mobilityType": "Stationary",
  "code": "HUB-101",
  "category": "Public Hub",
  "latitude": 18.7557,
  "longitude": 73.4091,
  "address": "Wax Museum Complex, Lonavala",
  "country": "India",
  "state": "Maharashtra",
  "city": "Lonavala",
  "timeZone": "Asia/Kolkata",
  "elevation": 620,
  "gridPowerCapacity": 120,
  "gridCurrentCapacity": 180,
  "gridPhases": "3-Phase",
  "energyMeters": "MTR-9081",
  "stage": "Active",
  "open247": true,
  "opensAt": "00:00",
  "closesAt": "23:59",
  "contactNumbers": ["+91 9876543210"],
  "amenities": "Cafe, Restroom, Free Wi-Fi"
}
```

#### Response Schema (JSON - `201 Created`):
```json
{
  "id": "st_101",
  "name": "Lonavala Wax Museum Hub",
  "code": "HUB-101"
}
```

---

## Flow 3: Edit Charging Station (`/charging-stations/edit/:id`)

### A. Page Overview
- **Route**: `/charging-stations/edit/:id` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `AddChargingStation.jsx` (in edit mode)
- **Identity Rule**: The URL parameter `:id` is the authoritative station identity.

### B. HTTP REST APIs

#### 1. Fetch Existing Data
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charging-stations/:id`
- **Response**: Fills form inputs with existing station values.

#### 2. Submit Station Edits
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/charging-stations/:id`
- **Request Body (JSON)**: Full or updated station fields payload matching Create format.

#### Response Schema (JSON - `200 OK`):
```json
{
  "id": "st_101",
  "name": "Lonavala Wax Museum Hub",
  "code": "HUB-101"
}
```

---

## Flow 4: View Charging Station Details (`/charging-stations/:id`)

### A. Page Overview
- **Route**: `/charging-stations/:id` (e.g. `/charging-stations/st_101`) **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `ViewChargingStation.jsx`
- **Socket Room Subscription**: Auto-joins `chargingstation:<id>` on mount. **[CONFIRMED FROM FRONTEND]**
- **Header Elements**: Station Name, Code badge, Back button, "Show Details" modal button, "Edit Details" button.
- **Inner Tab Navigation**: Synchronized with URL query parameter `?tab=charge-points` and `?tab=transactions`.

### B. Main Station Details HTTP API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charging-stations/:id`
- **Purpose**: Fetch complete specifications for station details view and full prefill for Edit mode (`/charging-stations/edit/:id`).

#### Response Schema (JSON - `200 OK`):
```json
{
  "id": "st_101",
  "name": "Lonavala Wax Museum Hub",
  "brand": "Pulse Energy",
  "mobilityType": "Stationary",
  "code": "HUB-101",
  "category": "Public Hub",
  "latitude": 18.7557,
  "longitude": 73.4091,
  "address": "Wax Museum Complex, Lonavala",
  "country": "India",
  "state": "Maharashtra",
  "city": "Lonavala",
  "timeZone": "Asia/Kolkata",
  "elevation": 620,
  "gridPowerCapacity": 120,
  "gridCurrentCapacity": 180,
  "gridPhases": "3-Phase",
  "energyMeters": "MTR-9081",
  "stage": "Active",
  "open247": true,
  "opensAt": "00:00",
  "closesAt": "23:59",
  "contactNumbers": ["+91 9876543210"],
  "amenities": "Cafe, Restroom, Free Wi-Fi",
  "createdAt": "2026-08-15T10:00:00.000Z",
  "updatedAt": "2026-09-06T10:00:00.000Z"
}
```

---

### C. Inner Tab Specifications (`?tab=`)

#### Tab 1: Charge Points (`?tab=charge-points`)
Displays chargers installed at this station.

- **Component**: `StationChargePointsTab.jsx` $\rightarrow$ delegates to `ChargePointsList.jsx`
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points?chargingStationId=st_101&page=1&limit=10`
- **Frontend Field Consumption**:
  - `id` (`string`): Target for row navigation `/charge-points/:id` **[CONFIRMED]**
  - `name` (`string`): Charger name **[CONFIRMED]**
  - `code` (`string`): Charger code **[CONFIRMED]**
  - `status` (`string`): Status badge (e.g. `'Available'`, `'Charging'`, `'Preparing'`, `'Faulted'`) **[CONFIRMED]**
  - `stage` (`string`): Deployment stage (e.g. `'Active'`, `'Inactive'`) **[CONFIRMED]**
  - `type` (`string`): AC / DC type badge **[CONFIRMED]**
  - `connectors` (`Array` of connectors or strings): Connector badges cell **[CONFIRMED]**
  - `totalCapacity` (`string`): Capacity display text (e.g. `"60 kW"`) **[CONFIRMED]**
  - `mode` (`string`): Operation mode (e.g. `'Public'`) **[CONFIRMED]**
  - `oem` / `manufacturer` (`string`): OEM label **[CONFIRMED]**
  - `firmwareVersion` (`string`): Firmware version **[CONFIRMED]**

#### Response Schema (JSON - `200 OK`):
```json
{
  "data": [
    {
      "id": "cp_101",
      "name": "Lonavala-CP-01",
      "code": "CP-101",
      "status": "Available",
      "stage": "Active",
      "type": "DC",
      "connectors": ["CCS2", "Type 2"],
      "totalCapacity": "60 kW",
      "mode": "Public",
      "oem": "Pulse Energy",
      "firmwareVersion": "2.0.2"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Tab 2: Charge Transactions (`?tab=transactions`)
Displays historical and active charging sessions conducted at this station.

- **Component**: `StationTransactionsTab.jsx` $\rightarrow$ `SessionHistoryTable.jsx` / `SessionHistoryRow.jsx`
- **Hook**: `useStationTransactions.js`
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/history?chargingStationId=st_101&page=1&limit=10&search=`
- **Canonical Response Contract**: The backend must implement **only the single canonical response shape** below. Client-side fallback accessors (e.g., `cost || totalCost`, `chargingStation?.name || chargingStationName`) are existing frontend read-resilience logic and do **not** require redundant aliases from the backend.

#### Canonical Response Schema (JSON - `200 OK`):
```json
{
  "data": [
    {
      "id": "sess_9001",
      "chargingStationId": "st_101",
      "chargingStation": {
        "id": "st_101",
        "name": "Lonavala Wax Museum Hub"
      },
      "chargePointId": "cp_101",
      "chargePoint": {
        "id": "cp_101",
        "name": "Lonavala-CP-01",
        "code": "CP-101"
      },
      "userName": "Rahul Sharma",
      "userInitials": "RS",
      "userPhone": "+91 9876543210",
      "connector": "Type2 (1)",
      "status": "Completed",
      "kwhDelivered": 24.5,
      "cost": 490.0,
      "createdAt": "2026-08-25T10:00:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

---

### D. Socket.IO Room Events (`chargingstation:<id>`)

The frontend registers listeners via `useSocketEvents` inside `useStationTransactions.js`:

1. **`session:created`**:
   - **Payload**: Session object containing at minimum `{ id: string, chargingStationId?: string }`
   - **Reaction**: If `session.chargingStationId === stationId`, adds new session to transactions table in real time.
2. **`session:updated`**:
   - **Payload**: Session object containing at minimum `{ id: string, chargingStationId?: string }`
   - **Reaction**: If `session.chargingStationId === stationId`, updates matching session metrics in transactions table.
3. **`session:stopped`**:
   - **Payload**: Session object containing at minimum `{ id: string, chargingStationId?: string, status?: string }`
   - **Reaction**: If `session.chargingStationId === stationId`, marks session status as `'Completed'` in transactions table.

---

## Master Integration Summary Table

| Flow / Feature | HTTP Endpoint / Event | Method / Type | Purpose |
| :--- | :--- | :--- | :--- |
| **List Stations** | `/api/charging-stations` | `GET` | Load paginated & filtered station list |
| **Filter Options** | `/api/charging-stations/filters` | `GET` | Load dynamic filter options (`mobilityType`, `stationType`, `stage`) |
| **Delete Station** | `/api/charging-stations/:id` | `DELETE` | Delete station by authoritative ID |
| **Export CSV** | `/api/charging-stations/export` | `GET` | Stream CSV report (supports `search` parameter) |
| **Create Station** | `/api/charging-stations` | `POST` | Submit new station form payload |
| **Get Station Details** | `/api/charging-stations/:id` | `GET` | Fetch specifications for header & form prefill |
| **Update Station** | `/api/charging-stations/:id` | `PUT` | Save station edits by authoritative ID |
| **Tab 1: Chargers** | `/api/charge-points?chargingStationId=` | `GET` | List chargers installed at station |
| **Tab 2: Sessions** | `/api/live-sessions/history?chargingStationId=` | `GET` | List historical & active sessions at station |
| **Real-Time Stream** | `chargingstation:<id>` room | `Socket.IO` | Real-time session broadcasts (`created`, `updated`, `stopped`) |

---

## Classification of Requirements

- **CONFIRMED FROM FRONTEND**:
  - Route paths (`/charging-stations`, `/charging-stations/:id`, `/charging-stations/new`, `/charging-stations/edit/:id`).
  - Authoritative ID parameters and foreign-key filter keys (`chargingStationId`).
  - Client-side 23-field form validation constraints (Zod schema) and payload transformations. *(Note: Zod rules govern client-side input validation and do not alone dictate backend storage/business validation policy)*.
  - Server-side pagination parameters (`page`, `limit`, `search`, `filters`) and pagination response envelope (`data`, `total`, `page`, `limit`, `totalPages`).
  - Socket.IO room pattern `chargingstation:<id>` and event names (`session:created`, `session:updated`, `session:stopped`).

- **FRONTEND-DERIVED**:
  - Client-side defensive accessors (e.g., `cost || totalCost`, `chargingStation?.name || chargingStationName`, `chargePoint?.name || chargePointName`). *(Note: These represent existing frontend compatibility/read-resilience logic and do NOT require the backend to return redundant duplicate alias fields; the backend provides the authoritative canonical shape)*.
  - Dynamic filter options keys (`mobilityType`, `stationType`, `stage`).

- **BACKEND DECISION**:
  - Exact database schema, relational indexing, and ORM models.
  - Search text indexing strategy (e.g., which columns are matched by the `search` query).
  - Specific dynamic filter option values populated from active database records.
  - CSV export column layout and formatting.
  - Deletion constraint handling (e.g., cascade vs soft-delete vs blocking when active charge points exist).
  - Server-side validation, error status codes, and error payload structures.


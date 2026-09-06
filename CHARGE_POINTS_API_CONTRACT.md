# Charge Points Module - Technical Integration Specification & API Contract
**List View, Add/Edit Forms, Details View, Connectors Sub-resource, Remote Controls & Socket.IO Protocol**

---

## Executive Summary & Architecture Overview

This document provides the complete, authoritative API contract and integration specification for the **Charge Points Module** (`/charge-points`, `/charge-points/new`, `/charge-points/edit/:id`, `/charge-points/:id`, and `/charge-points/:id/connectors/new`).

The integration architecture utilizes a hybrid **REST API + Socket.IO real-time engine**:
- **HTTP REST APIs**: Handles server-side paginated list queries, charge point creation, detail queries, full updates, deletion, connector CRUD and remote commands, telemetry metrics, tariff assignments, configurations, remote control commands, and CSV exports.
- **Socket.IO Real-Time Engine**: On mounting `/charge-points/:id` or any of its sub-tabs, the frontend auto-joins room `chargepoint:<id>` to receive live connector updates, transaction streaming (`session:created`, `session:updated`, `session:stopped`), and hardware status broadcasts.

```
┌─────────────────────────┐          ┌─────────────────────────┐
│     EV Charger / CP     │          │      CSMS Backend       │
│       [OCPP 1.6J]       │          │   (REST API + Socket)   │
└───────────┬─────────────┘          └────────────┬────────────┘
            │                                     │
            │ OCPP Messages (Boot, Status, etc.)  │
            └────────────────────────────────────►│
                                                  │
                                   ┌──────────────┴──────────────┐
                                   │                             │
                     HTTP REST APIs│               Socket.IO     │ (Room:
                     (CRUD, Tabs,  │               Real-Time     │  chargepoint:<id>)
                     Commands)     │               Broadcasts    │
                                   ▼                             ▼
                            ┌───────────────────────────────────────────┐
                            │             Frontend Client               │
                            │         (Charge Points Feature)           │
                            └───────────────────────────────────────────┘
```

---

## Classification of Requirements

To ensure clear boundaries between frontend requirements and backend implementation decisions, all contract items are classified as follows:

1. **CONFIRMED FROM FRONTEND**
   - Directly established by the frontend React components, hooks, and client-side Zod validation schemas.
   - Represents the mandatory contract the backend must fulfill.

2. **BACKEND DECISION**
   - Left to the backend implementation (e.g. database schema, search indexing strategy, OCPP bridge architecture, specific filter value lists).

---

## Flow 1: Charge Points List (`/charge-points`)

### A. Page Overview
- **Route**: `/charge-points` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `ChargePointsList.jsx`
- **Data Hook**: `useTableData.js` calling `getChargePoints(page, limit, search, filters)`
- **Pagination & Search**: **100% Server-Side** **[CONFIRMED FROM FRONTEND]**

---

### B. Fetch Paginated Charge Points API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**:

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No (Default: `1`) | 1-based page index **[CONFIRMED FROM FRONTEND]** | `1` |
| `limit` | `number` | No (Default: `10`) | Records per page **[CONFIRMED FROM FRONTEND]** | `10` |
| `search` | `string` | No | Generic search string (exact backend search fields are a backend decision) **[CONFIRMED FROM FRONTEND]** | `"DLF"` |
| `filters` | `string` | No | JSON stringified object of active filter categories **[CONFIRMED FROM FRONTEND]** | `{"status":["Available"],"type":["DC"]}` |
| `chargingStationId` | `string` | No | Parent station filter when embedded in station detail views **[CONFIRMED FROM FRONTEND]** | `"cs_101"` |

#### Consumed Response Schema (`200 OK`):
```json
{
  "data": [
    {
      "id": "cp_001",
      "name": "DLF Phase 2 Fast Charger 01",
      "code": "CP-DLF-01",
      "chargingStationId": "cs_101",
      "chargingStation": {
        "id": "cs_101",
        "name": "DLF Cybercity Hub"
      },
      "status": "Available",
      "lastActive": "10 mins ago",
      "stage": "Active",
      "type": "DC",
      "connectors": [
        {
          "id": "conn_1",
          "connectorId": 1,
          "type": "CCS2",
          "status": "Available",
          "maxPower": 60.0
        }
      ],
      "totalCapacity": "60 kW",
      "mode": "Public",
      "manufacturer": "Delta Electronics",
      "firmwareVersion": "v2.4.1",
      "thirdPartyCpId": "TP-8842",
      "qrCodeId": "QR-DLF-01",
      "tariffId": "tar_101",
      "tariff": {
        "id": "tar_101",
        "name": "DLF Commercial DC Fast Tariff"
      },
      "mobilityType": "4W",
      "createdAt": "2026-08-20T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Fields Consumed by `ChargePointsList.jsx`:

| Field | Type | Consumed By UI | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Row key, Navigation, Delete target | Authoritative unique charge point ID **[CONFIRMED FROM FRONTEND]** |
| `name` | `string` | Name column | Display name of the charger **[CONFIRMED FROM FRONTEND]** |
| `code` | `string` | Code column | Hardware station identifier code **[CONFIRMED FROM FRONTEND]** |
| `chargingStationId` | `string` | Navigation link | Station ID to open `/charging-stations/:id` **[CONFIRMED FROM FRONTEND]** |
| `chargingStation` | `object` (`{ id, name }`) | Charge Station column | Canonical station relation object **[CONFIRMED FROM FRONTEND]** |
| `status` | `string` | Status badge | `'Available'`, `'Charging'`, `'Preparing'`, `'Faulted'` **[CONFIRMED FROM FRONTEND]** |
| `lastActive` | `string` | Last Active column | Formatted timestamp or relative elapsed string **[CONFIRMED FROM FRONTEND]** |
| `stage` | `string` | Stage badge | Operational stage (e.g. `'Active'`, `'Inactive'`) **[CONFIRMED FROM FRONTEND]** |
| `type` | `string` | Type badge | Charger current type (e.g. `'AC'`, `'DC'`, `'NA'`) **[CONFIRMED FROM FRONTEND]** |
| `connectors` | `array` | Connector column | Array of connector objects passed to `ConnectorBadgesCell` **[CONFIRMED FROM FRONTEND]** |
| `totalCapacity` | `string \| number` | Total Capacity column | Power rating label (e.g. `'60 kW'`) **[CONFIRMED FROM FRONTEND]** |
| `mode` | `string` | Mode column | Operational mode (e.g. `'Public'`, `'Private'`) **[CONFIRMED FROM FRONTEND]** |
| `manufacturer` | `string` | OEM column | Hardware manufacturer name **[CONFIRMED FROM FRONTEND]** |
| `firmwareVersion` | `string` | Firmware Version column | Installed firmware version string **[CONFIRMED FROM FRONTEND]** |
| `thirdPartyCpId` | `string` | Third Party CP ID column | External operator identifier **[CONFIRMED FROM FRONTEND]** |
| `qrCodeId` | `string` | QR Code ID column | QR code identifier string **[CONFIRMED FROM FRONTEND]** |
| `tariffId` | `string` | Tariff Profile link | Tariff ID to open `/tariffs?id=...` **[CONFIRMED FROM FRONTEND]** |
| `tariff` | `object` (`{ id, name }`) | Tariff Profile column | Canonical tariff relation object **[CONFIRMED FROM FRONTEND]** |
| `mobilityType` | `string` | Mobility Type column | Supported vehicle mobility category (e.g. `'4W'`, `'2W'`) **[CONFIRMED FROM FRONTEND]** |
| `createdAt` | `string (ISO)` | Created On column | Date string parsed by `formatCreatedOn` **[CONFIRMED FROM FRONTEND]** |

---

### C. Filter Options Catalog API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points/filters` **[CONFIRMED FROM FRONTEND]**
- **Purpose**: Populates the multi-category filter drawer.
- **Consumed Response Schema (`200 OK`):**
```json
{
  "statuses": ["Available", "Charging", "Preparing", "Faulted"],
  "types": ["AC", "DC", "NA"],
  "manufacturers": ["Delta Electronics", "ABB", "Schneider Electric", "Exicom"],
  "locations": ["Gurugram", "Bengaluru", "Delhi", "Mumbai"]
}
```
*(Note: Filter keys `statuses`, `types`, `manufacturers`, `locations` are confirmed from frontend. Exact values within arrays are backend decisions.)*

---

### D. Delete Charge Point API
- **HTTP Method**: `DELETE`
- **Endpoint**: `/api/charge-points/:id` **[CONFIRMED FROM FRONTEND]**
- **Consumed Response Schema (`200 OK`):**
```json
{
  "message": "Charge point deleted successfully",
  "id": "cp_001"
}
```

---

### E. Export Charge Points CSV API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points/export` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**: Same `search` and `filters` as list API **[CONFIRMED FROM FRONTEND]**
- **Response**: CSV file stream (`text/csv`).

---

## Flow 2: Add Charge Point (`/charge-points/new`)

### A. Page Overview
- **Route**: `/charge-points/new` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `AddChargePoint.jsx`
- **Validation**: Client-side Zod schema (`chargePointSchema`).

---

### B. Form Dropdown Pre-requisite APIs
1. **Charging Stations Catalog**: `GET /api/charging-stations?page=1&limit=100` (populates Charging Station selector) **[CONFIRMED FROM FRONTEND]**
2. **Tariffs Catalog**: `GET /api/tariffs?page=1&limit=100` (populates Tariff Profiles selector) **[CONFIRMED FROM FRONTEND]**

---

### C. Create Charge Point API
- **HTTP Method**: `POST`
- **Endpoint**: `/api/charge-points` **[CONFIRMED FROM FRONTEND]**
- **Payload Schema (`POST` Body):**
```json
{
  "name": "DLF Phase 2 Fast Charger 01",
  "chargingStation": "DLF Cybercity Hub",
  "manufacturer": "Delta Electronics",
  "mode": "Public",
  "code": "CP-DLF-01",
  "accessibility": "Public",
  "stage": "Active",
  "type": "DC",
  "exclusive": "Shared",
  "gracePeriod": 10,
  "tariffProfiles": "DLF Commercial DC Fast Tariff (TAR-001)",
  "settlementProfile": "Profile A",
  "supportedChargingMethods": [
    { "id": "soc", "value": 100, "isFirst": true },
    { "id": "units", "value": 30, "isFirst": false },
    { "id": "amount", "value": 500, "isFirst": false },
    { "id": "time", "value": 45, "isFirst": false }
  ]
}
```

#### Field Specifications:

| Field | Type | Required | Client Validation / Allowed Values | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | `min(1)` | Display name of the charge point **[CONFIRMED FROM FRONTEND]** |
| `chargingStation` | `string` | **Yes** | `min(1)` | Name of the parent charging station **[CONFIRMED FROM FRONTEND]** |
| `manufacturer` | `string` | **Yes** | `min(1)` | Hardware manufacturer / OEM **[CONFIRMED FROM FRONTEND]** |
| `mode` | `string` | **Yes** | `'Public'` \| `'Private'` **[MANDATORY FRONTEND ENUM]** | Operational mode |
| `code` | `string` | No | Optional string | Hardware station identifier code **[CONFIRMED FROM FRONTEND]** |
| `accessibility` | `string` | **Yes** | `'Public'` \| `'Restricted'` **[MANDATORY FRONTEND ENUM]** | Accessibility policy |
| `stage` | `string` | No | `'Active'` \| `'Inactive'` **[MANDATORY FRONTEND ENUM]** | Deployment stage |
| `type` | `string` | **Yes** | `'AC'` \| `'DC'` \| `'NA'` **[MANDATORY FRONTEND ENUM]** | Charging current type |
| `exclusive` | `string` | **Yes** | `'Exclusive'` \| `'Shared'` **[MANDATORY FRONTEND ENUM]** | Charger exclusivity setting |
| `gracePeriod` | `number \| null` | No | Non-negative integer (in minutes) | Grace period before idle penalties **[CONFIRMED FROM FRONTEND]** |
| `tariffProfiles` | `string` | **Yes** | `min(1)` | Selected tariff label string **[CONFIRMED FROM FRONTEND]** |
| `settlementProfile` | `string` | No | Optional string (e.g. `'Profile A'`, `'Profile B'`) **[CONFIRMED FROM FRONTEND]** | Settlement policy profile |
| `supportedChargingMethods` | `array` | **Yes** | Array of `{ id: 'soc'\|'units'\|'amount'\|'time', value: number, isFirst: boolean }` **[CONFIRMED FROM FRONTEND]** | Selected charging termination conditions |

- **Response (`201 Created`):** `{ "id": "cp_001", "name": "DLF Phase 2 Fast Charger 01" }`

---

## Flow 3: Edit Charge Point (`/charge-points/edit/:id`)

### A. Page Overview
- **Route**: `/charge-points/edit/:id` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `AddChargePoint.jsx` (`isEditMode=true`)
- **Prefill Flow**: Uses URL `id` to query `GET /api/charge-points/:id` and prefill all form fields and `supportedChargingMethods`.

---

### B. Update Charge Point API
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/charge-points/:id` **[CONFIRMED FROM FRONTEND]**
- **Contract Rule**: **`PUT /api/charge-points/:id` receives the complete editable Charge Point payload** representing the complete form state. **[CONFIRMED FROM FRONTEND]**
- **Payload Schema (`PUT` Body):** Same schema as Create (`POST /api/charge-points`).
- **Response (`200 OK`):** `{ "id": "cp_001", "name": "DLF Phase 2 Fast Charger 01" }`

---

## Flow 4: View Charge Point Details (`/charge-points/:id`)

### A. Page Overview
- **Route**: `/charge-points/:id` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `ViewChargePoint.jsx`
- **Socket Room Subscription**: Auto-joins room `chargepoint:<id>` on mount. **[CONFIRMED FROM FRONTEND]**
- **Header Elements**: Charger Name, Live Status Badge (`'Available'`, `'Charging'`, `'Preparing'`, `'Faulted'`), Download QR Code action, Edit Details navigation.
- **Inner Tab Navigation**: Managed via URL search parameter `?tab=` (`stats`, `connectors`, `transactions`, `config`, `control`, `tariffs`).

---

### B. Fetch Charge Point Details API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points/:id` **[CONFIRMED FROM FRONTEND]**
- **Purpose**: Supplies header specifications, complete prefill for Edit mode, initial connector list, tariff binding, and fallback metrics.

#### Consumed Response Schema (`200 OK`):
```json
{
  "id": "cp_001",
  "name": "DLF Phase 2 Fast Charger 01",
  "code": "CP-DLF-01",
  "chargingStation": "DLF Cybercity Hub",
  "chargingStationId": "cs_101",
  "manufacturer": "Delta Electronics",
  "mode": "Public",
  "accessibility": "Public",
  "stage": "Active",
  "status": "Available",
  "type": "DC",
  "exclusive": "Shared",
  "gracePeriod": 10,
  "tariffProfiles": "DLF Commercial DC Fast Tariff (TAR-001)",
  "tariffId": "tar_101",
  "tariff": {
    "id": "tar_101",
    "name": "DLF Commercial DC Fast Tariff",
    "code": "TAR-001",
    "baseRate": 18.50,
    "gstPercentage": 18
  },
  "settlementProfile": "Profile A",
  "supportedChargingMethods": [
    { "id": "soc", "value": 100, "isFirst": true },
    { "id": "units", "value": 30, "isFirst": false },
    { "id": "amount", "value": 500, "isFirst": false },
    { "id": "time", "value": 45, "isFirst": false }
  ],
  "connectors": [
    {
      "id": "conn_1",
      "connectorId": 1,
      "type": "CCS2",
      "maxPower": 60.0,
      "maxCurrent": 150.0,
      "maxVoltage": 400.0,
      "powerType": "DC",
      "connectorFormat": "CABLE",
      "status": "Available"
    }
  ],
  "totalSessions": 43,
  "totalRevenue": 645.00,
  "totalEnergyKwh": 430.25,
  "firmwareVersion": "v2.4.1",
  "createdAt": "2026-08-20T10:00:00.000Z"
}
```

---

## Flow 5: Stats Tab (`/charge-points/:id?tab=stats`)

### A. Component Overview
- **Component**: `ChargePointStatsTab.jsx`
- **Data Hook**: `useChargePointStats.js`
- **Socket Reactivity**: Listens on room `chargepoint:<id>` for `session:created`, `session:updated`, `session:stopped`, and `chargePointUpdated` to trigger live re-fetching. **[CONFIRMED FROM FRONTEND]**

---

### B. Fetch Charge Point Stats API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points/:id/stats` **[CONFIRMED FROM FRONTEND]**
- **Query Parameter**: `timeRange` (`'Today'`, `'Yesterday'`, `'Last 7 Days'`, `'Last 30 Days'`, `'This Year'`, `'Last Year'`) **[MANDATORY FRONTEND ENUM]**

#### Consumed Response Schema (`200 OK`):
```json
{
  "totalRevenue": 645.00,
  "totalEnergyKwh": 430.25,
  "totalSessions": 43
}
```

---

## Flow 6: Connectors Tab & Sub-Resources (`/charge-points/:id?tab=connectors`)

### A. Component & Hook Overview
- **Component**: `ChargePointConnectorsTab.jsx`
- **Data Hook**: `useChargePointConnectors.js`
- **Sub-pages**:
  - Add Connector: `/charge-points/:id/connectors/new` (`AddNewConnector.jsx`)
  - Edit Connector: `/charge-points/:id/connectors/:connectorId/edit` (`UpdateConnector.jsx`)
  - Shared Form: `ConnectorForm.jsx`

---

### B. Add Connector API
- **HTTP Method**: `POST`
- **Endpoint**: `/api/charge-points/:id/connectors` **[CONFIRMED FROM FRONTEND]**
- **Request Transformation Rule**: The form input `powerRating` is mapped directly to `maxPower` (float) in the API request body. **[CONFIRMED FROM FRONTEND]**

#### Request Payload (`POST` Body):
```json
{
  "connectorId": 2,
  "type": "CCS2",
  "maxPower": 60.0,
  "maxCurrent": 150.0,
  "maxVoltage": 400.0,
  "powerType": "DC",
  "connectorFormat": "CABLE",
  "status": "Available"
}
```

- **Consumed Response Schema (`201 Created`):**
```json
{
  "message": "Connector added successfully",
  "connector": {
    "id": "conn_2",
    "connectorId": 2,
    "type": "CCS2",
    "maxPower": 60.0,
    "status": "Available"
  },
  "chargePoint": {
    "id": "cp_001",
    "connectors": [...]
  }
}
```

---

### C. Update Connector API
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/charge-points/:id/connectors/:connectorId` **[CONFIRMED FROM FRONTEND]**
- **Request Payload (`PUT` Body):**
```json
{
  "connectorId": 2,
  "type": "CCS2",
  "maxPower": 60.0,
  "maxCurrent": 150.0,
  "maxVoltage": 400.0,
  "powerType": "DC",
  "connectorFormat": "CABLE",
  "status": "Inoperative"
}
```
- **Consumed Response Schema (`200 OK`):** `{ "id": "cp_001", "connectors": [...] }`

---

### D. Remote Start Charging API
- **HTTP Method**: `POST`
- **Endpoint**: `/api/charge-points/:id/connectors/:connectorId/start` **[CONFIRMED FROM FRONTEND]**
- **Description**: Triggers OCPP `RemoteStartTransaction` on the specific connector.
- **Request Body**: `{}` (empty)
- **Response (`200 OK`):** `{ "status": "Accepted", "message": "Remote start command sent" }`

---

### E. Remote Stop Charging API
- **HTTP Method**: `POST`
- **Endpoint**: `/api/charge-points/:id/connectors/:connectorId/stop` **[CONFIRMED FROM FRONTEND]**
- **Description**: Triggers OCPP `RemoteStopTransaction` on the active transaction.
- **Request Body**: `{}` (empty)
- **Response (`200 OK`):** `{ "status": "Accepted", "message": "Remote stop command sent" }`

---

### F. Get Connector Hardware Status API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/charge-points/:id/connectors/:connectorId/status` **[CONFIRMED FROM FRONTEND]**
- **Consumed Response Schema (`200 OK`):**
```json
{
  "connectorId": 1,
  "status": "Available",
  "errorCode": "NoError",
  "info": "Operational"
}
```

---

## Flow 7: Charge Transactions Tab (`/charge-points/:id?tab=transactions`)

### A. Component Overview
- **Component**: `ChargePointTransactionsTab.jsx`
- **Data Hook**: `useChargePointTransactions.js`
- **Table Component**: `SessionHistoryTable.jsx`

---

### B. Fetch Charge Point Transactions API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/history` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `chargePointId` | `string` | **Yes** | Authoritative charge point database ID **[CONFIRMED FROM FRONTEND]** |
| `page` | `number` | No (Default: `1`) | 1-based page index **[CONFIRMED FROM FRONTEND]** |
| `limit` | `number` | No (Default: `10`) | Items per page **[CONFIRMED FROM FRONTEND]** |
| `search` | `string` | No | Generic search query string **[CONFIRMED FROM FRONTEND]** |

#### Consumed Response Schema (`200 OK`):
```json
{
  "data": [
    {
      "id": "sess_101",
      "userName": "Vikram Malhotra",
      "userPhone": "+91 98765 43210",
      "userInitials": "VM",
      "chargingStation": {
        "id": "cs_101",
        "name": "DLF Cybercity Hub"
      },
      "chargePoint": {
        "id": "cp_001",
        "name": "DLF Phase 2 Fast Charger 01"
      },
      "connector": {
        "id": "conn_1",
        "connectorId": 1,
        "type": "CCS2"
      },
      "status": "Completed",
      "kwhDelivered": "28.40",
      "cost": "525.40",
      "billCode": "BILL-2026-8841",
      "createdAt": "2026-08-20T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## Flow 8: Tariffs Tab (`/charge-points/:id?tab=tariffs`)

### A. Component Overview
- **Component**: `ChargePointTariffsTab.jsx`
- **Data Hook**: `useChargePointTariff.js`
- **Modal Catalog**: Fetches `GET /api/tariffs` to display assignable tariff plans.

---

### B. Assign Tariff Profile API
- **HTTP Method**: `PUT`
- **Endpoint**: `/api/charge-points/:id/tariff` **[CONFIRMED FROM FRONTEND]**
- **Request Payload (`PUT` Body):**
```json
{
  "tariffId": "tar_102"
}
```
- **Consumed Response Schema (`200 OK`):**
```json
{
  "id": "cp_001",
  "tariffId": "tar_102",
  "tariff": {
    "id": "tar_102",
    "name": "Commercial Peak EV Tariff",
    "code": "TAR-002",
    "baseRate": 21.00,
    "gstPercentage": 18
  }
}
```

---

## Flow 9: Configuration Tab (`/charge-points/:id?tab=config`)

### A. Component Overview
- **Component**: `ChargePointConfigTab.jsx`

---

### B. Configuration APIs
1. **Fetch Configurations**: `GET /api/charge-points/:id/configurations` **[CONFIRMED FROM FRONTEND]**
   - **Response**: Arbitrary OCPP key-value object (response structure is a backend decision).
2. **Update Configuration**: `PUT /api/charge-points/:id/configurations` **[CONFIRMED FROM FRONTEND]**
   - **Request Body**: `{"key": "HeartbeatInterval", "value": "180"}`
   - **Response**: Generic status response (backend decision).
3. **Reset Configurations**: `POST /api/charge-points/:id/configurations/reset` **[CONFIRMED FROM FRONTEND]**
   - **Request Body**: `{}` (empty)
   - **Response**: Generic status response (backend decision).

---

## Flow 10: Remote Control Tab (`/charge-points/:id?tab=control`)

### A. Component Overview
- **Component**: `ChargePointControlTab.jsx`
- **Permission Guard**: `PERMISSIONS.CHARGE_POINT_CONTROL`

---

### B. Remote OCPP Command APIs

| Command | HTTP Method | Endpoint | Request Payload | Mandatory Enum Values |
| :--- | :--- | :--- | :--- | :--- |
| **Reset Charge Point** | `POST` | `/api/charge-points/:id/control/reset` | `{"resetType": "Soft" \| "Hard"}` | `'Soft'`, `'Hard'` **[MANDATORY FRONTEND ENUM]** |
| **Firmware Update** | `POST` | `/api/charge-points/:id/control/firmware-update` | `{"firmwareUrl": "...", "firmwareDate": "2026-09-01"}` | String URL, Date string |
| **Local ID Tag Management** | `POST` | `/api/charge-points/:id/control/local-id-tags` | `{"updateType": "Differential" \| "Full", "idTags": "TAG-001"}` | `'Differential'`, `'Full'` **[MANDATORY FRONTEND ENUM]** |
| **Send Trigger Message** | `POST` | `/api/charge-points/:id/control/trigger-message` | `{"triggerMessage": "BootNotification", "connectorId": "1" \| "All"}` | Form trigger options (`'BootNotification'`, `'Heartbeat'`, etc.) |
| **Get Diagnostics** | `POST` | `/api/charge-points/:id/control/get-diagnostics` | `{"locationUrl": "...", "retries": "3", "retryInterval": "60", "scheduledDate": "...", "startTime": "...", "stopTime": "..."}` | URL, Retry parameters |
| **Data Transfer** | `POST` | `/api/charge-points/:id/control/data-transfer` | `{"vendorId": "Com.EVRE", "messageId": "...", "payload": "..."}` | Vendor ID, Message ID, Payload |
| **Clear Cache** | `POST` | `/api/charge-points/:id/control/clear-cache` | `{}` | Empty object |

*(Note: Command response bodies are handled generically by toasts; exact response structure is a backend decision.)*

---

## Flow 11: Real-Time Socket.IO Protocol Specifications

### A. Room Subscription Protocol (`useSocketRoom.js`)
- **Room Name Format**: `chargepoint:<id>` (e.g. `chargepoint:cp_001`) **[CONFIRMED FROM FRONTEND]**
- **Mount Behavior**: Emits `socket.emit('join:room', 'chargepoint:' + id)`
- **Unmount Behavior**: Emits `socket.emit('leave:room', 'chargepoint:' + id)`

---

### B. Events Broadcasted to Room `chargepoint:<id>`

#### 1. `chargePointUpdated`
- **Listening Hooks**: `useChargePointConnectors.js`, `useChargePointStats.js` **[CONFIRMED FROM FRONTEND]**
- **Payload Schema**:
```json
{
  "id": "cp_001",
  "status": "Available",
  "connectors": [
    { "connectorId": 1, "status": "Available" },
    { "connectorId": 2, "status": "Charging" }
  ]
}
```
- **UI Behavior**: Updates connector status badges in table and triggers `fetchStats()`.

#### 2. `session:created`
- **Listening Hooks**: `useChargePointConnectors.js`, `useChargePointTransactions.js`, `useChargePointStats.js` **[CONFIRMED FROM FRONTEND]**
- **Payload Schema**: Full session object with `chargePointId` and `connectorId`.
- **UI Behavior**: Sets connector status to `'Charging'`, prepends session to transactions table, and triggers `fetchStats()`.

#### 3. `session:updated`
- **Listening Hooks**: `useChargePointTransactions.js`, `useChargePointStats.js` **[CONFIRMED FROM FRONTEND]**
- **Payload Schema**: Updated session object matching active session ID.
- **UI Behavior**: Live updates active transaction row in the table and triggers `fetchStats()`.

#### 4. `session:stopped`
- **Listening Hooks**: `useChargePointConnectors.js`, `useChargePointTransactions.js`, `useChargePointStats.js` **[CONFIRMED FROM FRONTEND]**
- **Payload Schema**: Completed session object with `chargePointId`, `connectorId`, `status: 'Completed'`.
- **UI Behavior**: Sets connector status to `'Available'`, updates transaction status to `'Completed'`, and triggers `fetchStats()`.

---

## Summary of Complete Endpoint Matrix

| # | Flow / Feature | Method | Endpoint | Primary Parameters / Payload |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Charge Points List | `GET` | `/api/charge-points` | `page`, `limit`, `search`, `filters`, `chargingStationId` |
| 2 | Filter Options | `GET` | `/api/charge-points/filters` | Populates drawer (`statuses`, `types`, `manufacturers`, `locations`) |
| 3 | Export CSV | `GET` | `/api/charge-points/export` | `search`, `filters` |
| 4 | Fetch Details | `GET` | `/api/charge-points/:id` | Full 13-field DTO + `supportedChargingMethods` + `connectors` |
| 5 | Create Charge Point | `POST` | `/api/charge-points` | Complete form payload |
| 6 | Update Charge Point | `PUT` | `/api/charge-points/:id` | Complete editable Charge Point payload |
| 7 | Delete Charge Point | `DELETE` | `/api/charge-points/:id` | Target charge point `id` |
| 8 | Telemetry Stats | `GET` | `/api/charge-points/:id/stats` | `timeRange` (`'Today'`, `'Yesterday'`, etc.) |
| 9 | Add Connector | `POST` | `/api/charge-points/:id/connectors` | `connectorId`, `type`, `maxPower` (from `powerRating`), etc. |
| 10 | Update Connector | `PUT` | `/api/charge-points/:id/connectors/:connectorId` | Updated connector specifications & availability |
| 11 | Remote Start | `POST` | `/api/charge-points/:id/connectors/:connectorId/start` | Remote start trigger |
| 12 | Remote Stop | `POST` | `/api/charge-points/:id/connectors/:connectorId/stop` | Remote stop trigger |
| 13 | Connector Status | `GET` | `/api/charge-points/:id/connectors/:connectorId/status` | Hardware query status |
| 14 | Transactions List | `GET` | `/api/live-sessions/history` | `chargePointId`, `page`, `limit`, `search` |
| 15 | Assign Tariff | `PUT` | `/api/charge-points/:id/tariff` | `tariffId` |
| 16 | Configurations | `GET`/`PUT` | `/api/charge-points/:id/configurations` | OCPP Key-Value configuration parameters |
| 17 | Reset Command | `POST` | `/api/charge-points/:id/control/reset` | `resetType: 'Soft' \| 'Hard'` |
| 18 | Firmware Update | `POST` | `/api/charge-points/:id/control/firmware-update` | `firmwareUrl`, `firmwareDate` |
| 19 | Local ID Tags | `POST` | `/api/charge-points/:id/control/local-id-tags` | `updateType`, `idTags` |
| 20 | Trigger Message | `POST` | `/api/charge-points/:id/control/trigger-message` | `triggerMessage`, `connectorId` |
| 21 | Get Diagnostics | `POST` | `/api/charge-points/:id/control/get-diagnostics` | `locationUrl`, `retries`, `retryInterval`, `scheduledDate`, etc. |
| 22 | Data Transfer | `POST` | `/api/charge-points/:id/control/data-transfer` | `vendorId`, `messageId`, `payload` |
| 23 | Clear Cache | `POST` | `/api/charge-points/:id/control/clear-cache` | Clear authorization cache command |

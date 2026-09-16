# Charge Points Feature: End-to-End Typed Integration Specification

This document defines the strict API contracts, data types, field constraints, request/response schemas, sub-tab operations, and detailed real-time WebSocket event payloads for the **Charge Points** feature across all lifecycle phases.

---

## 1. Architecture & Lifecycle Overview

```
                        ┌─────────────────────────────────────────────────────────────┐
                        │                     Charge Points Feature                   │
                        └──────────────────────────────┬──────────────────────────────┘
                                                       │
          ┌───────────────────┬────────────────────────┼────────────────────────┬───────────────────┐
          ▼                   ▼                        ▼                        ▼                   ▼
    [ Phase 1: List ]  [ Phase 2: Add ]       [ Phase 3: Edit ]       [ Phase 4: Delete ]  [ Phase 5 & 6: View & Tabs ]
    GET /charge-points POST /charge-points    GET & PUT /charge-      DELETE /charge-      GET /charge-points/:id
    (Pagination,       (201 Created)          points/:id              points/:id           WebSocket Room:
    Filters, Search)                          (200 OK)                (200 OK)             `chargepoint:<id>`
                                                                                           ├─ Tab 1: Stats
                                                                                           ├─ Tab 2: Connectors
                                                                                           ├─ Tab 3: Transactions
                                                                                           ├─ Tab 4: Configuration
                                                                                           ├─ Tab 5: Remote Control
                                                                                           ├─ Tab 6: Tariffs
                                                                                           └─ Tab 7: OCPP Logs
```

---

## 2. Data Types & Entity Schema Definitions

### 2.1 `ChargePoint` Entity

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (ID/UUID)` | **Yes** | Unique primary identifier for the Charge Point. |
| `name` | `string` | **Yes** | Human-readable name of the charge point charger. |
| `code` | `string` | **Yes** | OCPP Identity / CPID (unique hardware identifier). |
| `chargingStationId` | `string (ID)` | **Yes** | Foreign key referencing `ChargingStation.id`. |
| `chargingStation` | `Object \| null` | No | Nested object `{ id: string (ID), name: string, code?: string }`. |
| `status` | `enum ("Available" \| "Preparing" \| "Charging" \| "SuspendedEVSE" \| "SuspendedEV" \| "Finishing" \| "Reserved" \| "Unavailable" \| "Faulted" \| "Offline")` | **Yes** | Live OCPP operational status. |
| `stage` | `enum ("Active" \| "Inactive" \| "Under Maintenance")` | **Yes** | Administrative stage. |
| `type` | `enum ("AC" \| "DC")` | **Yes** | Electric current architecture. |
| `mode` | `string \| null` | No | Charging mode (e.g., `Mode 3`, `Mode 4`). |
| `totalCapacity` | `number (float > 0.0)` | **Yes** | Maximum rated power capacity in kW. |
| `manufacturer` / `oem` | `string \| null` | No | Hardware manufacturer / vendor. |
| `firmwareVersion` | `string \| null` | No | Currently installed firmware version string. |
| `thirdPartyCpId` | `string \| null` | No | Roaming / OCPI network identifier. |
| `qrCodeId` | `string \| null` | No | Scannable QR code string identifier. |
| `mobilityType` | `string \| null` | No | Supported vehicle class (e.g., `4-Wheeler`, `2-Wheeler`). |
| `accessibility` | `string \| null` | No | Public / Private accessibility indicator. |
| `exclusive` | `string \| null` | No | Exclusivity rule (e.g., `Public`, `Fleet Only`). |
| `gracePeriod` | `number (integer >= 0)` | No | Overstay grace period duration in minutes. |
| `lastActive` | `string \| null` | No | Relative or ISO timestamp of last received heartbeat/telemetry. |
| `totalSessions` | `number (integer >= 0)` | No | Lifetime sessions executed on this charge point. |
| `energyDelivered` | `number (float >= 0.0)` | No | Lifetime energy delivered in kWh. |
| `revenueGenerated` | `number (float >= 0.0)` | No | Lifetime revenue generated in base currency. |
| `connectors` | `Array<ConnectorEntity>` | **Yes** | List of physical connectors attached to this charge point. |
| `tariffId` | `string (ID) \| null` | No | Foreign key referencing active `Tariff.id`. |
| `tariff` | `Object \| null` | No | Attached tariff profile `{ id: string, name: string, code: string, baseRate: number, gstPercentage: number }`. |
| `settlementProfile` | `string \| null` | No | Financial settlement rule profile name. |
| `createdAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC creation timestamp. |
| `updatedAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC last update timestamp. |

---

### 2.2 `ConnectorEntity` Schema

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (ID/UUID)` | **Yes** | Unique primary key of the connector record. |
| `chargePointId` | `string (ID)` | **Yes** | Parent charge point identifier. |
| `connectorId` | `number (integer >= 1)` | **Yes** | Physical OCPP connector outlet number (`1`, `2`, etc.). |
| `type` | `enum ("Type2" \| "CCS2" \| "GB/T" \| "CHAdeMO" \| "15A Socket" \| "Type 1 (SAE J1772)" \| "Tesla")` | **Yes** | Physical socket/gun standard. |
| `powerRating` | `number (float >= 0.0) \| null` | No | Maximum rated power capacity in kW. |
| `maxCurrent` | `number (float >= 0.0) \| null` | No | Maximum rated continuous current in Amperes (A). |
| `maxVoltage` | `number (float >= 0.0) \| null` | No | Maximum rated voltage in Volts (V). |
| `powerType` | `enum ("AC_1_PHASE" \| "AC_2_PHASE" \| "AC_2_PHASE_SPLIT" \| "AC_3_PHASE" \| "DC" \| "AC" \| "DC_1_PHASE") \| null` | No | Power line electrical phase configuration. |
| `connectorFormat` | `enum ("SOCKET" \| "CABLE") \| null` | No | Physical connection form factor. |
| `status` | `enum ("Available" \| "Preparing" \| "Charging" \| "SuspendedEVSE" \| "SuspendedEV" \| "Finishing" \| "Reserved" \| "Unavailable" \| "Faulted")` | **Yes** | Real-time connector status. |
| `errorCode` | `string \| null` | No | OCPP 1.6J error code (e.g., `NoError`, `OtherError`). |
| `vendorErrorCode` | `string \| null` | No | Vendor-specific hardware fault code. |
| `createdAt` | `string (ISO-8601 DateTime)` | No | UTC creation timestamp. |
| `updatedAt` | `string (ISO-8601 DateTime)` | No | UTC last update timestamp. |

---

## 3. Phase-Wise REST API Contracts

### Phase 1: List View (`/charge-points`)

#### 1.1 Dynamic Filter Options
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/filters`
* **Request Headers**: `Authorization: Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "locations": "Array<string>",
  "manufacturers": "Array<string>",
  "statuses": "Array<string>",
  "types": "Array<string>",
  "tariffNames": "Array<string>"
}
```

#### 1.2 Paginated Charge Points Query
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points`
* **Query Parameters**:
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
  - `search`: `string (optional)`
  - `chargingStationId`: `string (ID, optional)`
  - `filters`: `string (optional, JSON stringified { location?: Array<string>, manufacturer?: Array<string>, status?: Array<string>, type?: Array<string>, chargingStationId?: string })`
* **Request Headers**: `Authorization: Bearer <string (JWT)>`
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
      "totalCapacity": "number (float)",
      "manufacturer": "string | null",
      "firmwareVersion": "string | null",
      "thirdPartyCpId": "string | null",
      "qrCodeId": "string | null",
      "mobilityType": "string | null",
      "lastActive": "string | null",
      "connectors": [
        {
          "id": "string (ID)",
          "connectorId": "number (integer >= 1)",
          "type": "string",
          "status": "string (enum: Available | Charging | Faulted | Unavailable)",
          "maxPower": "number (float)"
        }
      ],
      "tariff": {
        "id": "string (ID) | null",
        "name": "string | null"
      },
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

### Phase 2: Create Charge Point (`POST /api/charge-points`)

* **HTTP Method**: `POST`
* **Route**: `/api/charge-points`
* **Request Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <string (JWT)>`
* **Request Body Typed Schema**:
```json
{
  "name": "string (required, minLength: 1)",
  "chargingStation": "string (required, station ID or name)",
  "manufacturer": "string (required, vendor name)",
  "mode": "string (required)",
  "code": "string | null (optional unique CPID)",
  "accessibility": "string (required)",
  "stage": "string (enum: Active | Inactive | Under Maintenance)",
  "type": "string (enum: AC | DC)",
  "exclusive": "string (required)",
  "gracePeriod": "number (integer >= 0)",
  "tariff": "string (required, tariff ID or profile name)",
  "settlementProfile": "string | null"
}
```
* **Response Status**: `201 Created`
* **Response Body Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "chargingStationId": "string (ID)",
  "createdAt": "string (ISO-8601 DateTime)"
}
```

---

### Phase 3: Edit Charge Point (`PUT /api/charge-points/:id`)

* **HTTP Method**: `PUT`
* **Route**: `/api/charge-points/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <string (JWT)>`
* **Request Body Typed Schema**: Same schema as Phase 2 Create Charge Point.
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

---

### Phase 4: Delete Charge Point (`DELETE /api/charge-points/:id`)

* **HTTP Method**: `DELETE`
* **Route**: `/api/charge-points/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**: `Authorization: Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "success": "boolean (true)",
  "message": "string"
}
```

---

### Phase 5: View Charge Point Monitoring (`GET /api/charge-points/:id`)

* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Request Headers**: `Authorization: Bearer <string (JWT)>`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**: Full typed `ChargePoint` entity containing nested `chargingStation`, `connectors` array, and `tariff`.

---

## 4. Tab-Wise Sub-Tab Contracts (`ViewChargePoint.jsx`)

### Tab 1: Stats Tab (`/charge-points/:id?tab=stats`)

#### 1. Fetch Performance Statistics
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/:id/stats`
* **Query Parameters**:
  - `timeRange`: `enum ("Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "This Year" | "Last Year")`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "totalRevenue": "number (float >= 0.0)",
  "totalEnergyKwh": "number (float >= 0.0)",
  "totalSessions": "number (integer >= 0)",
  "activeConnectors": "number (integer >= 0)",
  "totalConnectors": "number (integer >= 1)",
  "timeRange": "string"
}
```

---

### Tab 2: Connectors Tab (`/charge-points/:id?tab=connectors`)

#### 2.1 Add Connector
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/connectors`
* **Request Body Typed Schema**:
```json
{
  "connectorId": "number (integer >= 1)",
  "type": "string (enum: Type2 | CCS2 | GB/T | CHAdeMO | 15A Socket | Type 1 (SAE J1772) | Tesla)",
  "powerRating": "number (float >= 0.0) | null",
  "maxCurrent": "number (float >= 0.0) | null",
  "maxVoltage": "number (float >= 0.0) | null",
  "powerType": "string (enum: AC_1_PHASE | AC_2_PHASE | AC_3_PHASE | DC | AC) | null",
  "connectorFormat": "string (enum: SOCKET | CABLE) | null"
}
```
* **Response Status**: `201 Created`

#### 2.2 Update Connector
* **HTTP Method**: `PUT`
* **Route**: `/api/charge-points/:id/connectors/:connectorId`
* **Request Body Typed Schema**:
```json
{
  "status": "string (enum: Available | Charging | Faulted | Unavailable)",
  "powerRating": "number (float) | null",
  "maxCurrent": "number (float) | null",
  "maxVoltage": "number (float) | null"
}
```
* **Response Status**: `200 OK`

#### 2.3 Check Connector Status
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/:id/connectors/:connectorId/status`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "connectorId": "number (integer >= 1)",
  "status": "string (enum: Available | Preparing | Charging | Faulted | Unavailable)"
}
```

#### 2.4 Remote Start Charging
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/connectors/:connectorId/start`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "success": "boolean",
  "message": "string",
  "transactionId": "number (integer >= 1) | null"
}
```

#### 2.5 Remote Stop Charging
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/connectors/:connectorId/stop`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "success": "boolean",
  "message": "string"
}
```

---

### Tab 3: Charge Transactions Tab (`/charge-points/:id?tab=transactions`)

* **HTTP Method**: `GET`
* **Route**: `/api/live-sessions/history`
* **Query Parameters**:
  - `chargePointId`: `string (ID)`
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
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

### Tab 4: Configuration Tab (`/charge-points/:id?tab=config`)

#### 4.1 Get Configurations
* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/:id/configurations`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "configurationKey": [
    {
      "key": "string",
      "readonly": "boolean",
      "value": "string"
    }
  ],
  "unknownKey": "Array<string>"
}
```

#### 4.2 Update Configuration Key
* **HTTP Method**: `PUT`
* **Route**: `/api/charge-points/:id/configurations`
* **Request Body Typed Schema**:
```json
{
  "key": "string (required)",
  "value": "string (required)"
}
```
* **Response Status**: `200 OK`

#### 4.3 Reset Configurations to Defaults
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/configurations/reset`
* **Response Status**: `200 OK`

---

### Tab 5: Remote Control Tab (`/charge-points/:id?tab=control`)

#### 5.1 Remote Reset (Reboot)
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/reset`
* **Request Body Typed Schema**:
```json
{
  "resetType": "string (enum: Soft | Hard)"
}
```
* **Response Status**: `200 OK`

#### 5.2 Remote Firmware Update
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/firmware-update`
* **Request Body Typed Schema**:
```json
{
  "firmwareUrl": "string (URL or version tag)",
  "firmwareDate": "string (ISO-8601 DateTime) | null"
}
```
* **Response Status**: `200 OK`

#### 5.3 Update Local ID Tags List
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/local-id-tags`
* **Request Body Typed Schema**:
```json
{
  "updateType": "string (enum: Differential | Full)",
  "idTags": "string (comma-separated tags)"
}
```
* **Response Status**: `200 OK`

#### 5.4 Send Trigger Message
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/trigger-message`
* **Request Body Typed Schema**:
```json
{
  "triggerMessage": "string (enum: BootNotification | Heartbeat | MeterValues | StatusNotification | DiagnosticsStatusNotification)",
  "connectorId": "string (integer string or All)"
}
```
* **Response Status**: `200 OK`

#### 5.5 Request Diagnostics Log Upload
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/get-diagnostics`
* **Request Body Typed Schema**:
```json
{
  "locationUrl": "string (upload destination URL)",
  "retries": "string (integer string) | null",
  "retryInterval": "string (seconds string) | null",
  "scheduledDate": "string (Date) | null",
  "startTime": "string (HH:mm) | null",
  "stopTime": "string (HH:mm) | null"
}
```
* **Response Status**: `200 OK`

#### 5.6 Send Data Transfer Frame
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/data-transfer`
* **Request Body Typed Schema**:
```json
{
  "vendorId": "string (required)",
  "messageId": "string | null",
  "payload": "string | null"
}
```
* **Response Status**: `200 OK`

#### 5.7 Clear Local Authorization Cache
* **HTTP Method**: `POST`
* **Route**: `/api/charge-points/:id/control/clear-cache`
* **Response Status**: `200 OK`

---

### Tab 6: Tariffs Assignment Tab (`/charge-points/:id?tab=tariffs`)

#### 6.1 Fetch Tariffs Catalog
* **HTTP Method**: `GET`
* **Route**: `/api/tariffs`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "name": "string",
      "code": "string",
      "baseRate": "number (float >= 0.0)",
      "gstPercentage": "number (float >= 0.0)"
    }
  ]
}
```

#### 6.2 Assign Tariff to Charge Point
* **HTTP Method**: `PUT`
* **Route**: `/api/charge-points/:id/tariff`
* **Request Body Typed Schema**:
```json
{
  "tariffId": "string (ID, required)"
}
```
* **Response Status**: `200 OK`

---

### Tab 7: Telemetry & OCPP Logs Tab (`/charge-points/:id?tab=logs`)

* **HTTP Method**: `GET`
* **Route**: `/api/live-sessions/logs`
* **Query Parameters**:
  - `sessionId`: `string (charge point ID or code)`
  - `page`: `number (integer >= 1)`
  - `limit`: `number (integer >= 1)`
  - `search`: `string (optional)`
  - `commands`: `string (comma-separated, optional)`
  - `logTypes`: `string (comma-separated, optional)`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "sessionId": "string",
      "command": "string",
      "direction": "string (enum: INBOUND | OUTBOUND | SYSTEM)",
      "messageId": "string",
      "logType": "string (OCPP 1.6J)",
      "summary": "string",
      "body": "Object",
      "recordedOn": "string (HH:mm:ss)",
      "fullTimestamp": "string",
      "createdAt": "string (ISO-8601 DateTime)"
    }
  ],
  "total": "number (integer >= 0)",
  "page": "number (integer >= 1)",
  "limit": "number (integer >= 1)",
  "totalPages": "number (integer >= 1)"
}
```

---

## 5. Tab-by-Tab Real-Time WebSocket Mechanics

This section provides an exhaustive, step-by-step breakdown of how each monitoring sub-tab inside `ViewChargePoint.jsx` interacts with WebSockets, manages rooms, processes live events, mutates React state, and updates the user interface in real-time.

```
+───────────────────────────────────────────────────────────────────────────────────────────+
│                            WebSocket Room: `chargepoint:<id>`                             │
+───────────────────────────────────────────────────────────────────────────────────────────+
       │
       ├─► [ Page Root & Header ] ──────► Listens: `chargePointUpdated`
       │                                  Updates: Header badge (Available/Charging/Faulted) & Total Connectors
       │
       ├─► [ Tab 1: Stats ] ────────────► Listens: `session:created`, `session:updated`, `session:stopped`, `chargePointUpdated`
       │                                  Updates: Debounced KPI fetch (₹, kWh, Sessions) & SVG spline graph rescaling
       │
       ├─► [ Tab 2: Connectors ] ───────► Listens: `chargePointUpdated`, `session:created`, `session:stopped`
       │                                  Updates: Live gun outlet state (Available ↔ Charging ↔ Faulted) & remote command ACKs
       │
       ├─► [ Tab 3: Transactions ] ─────► Listens: `session:created`, `session:updated`, `session:stopped`
       │                                  Updates: Live row prepending, in-place SoC%/kWh/Cost streaming & bill attachment
       │
       ├─► [ Tab 4: Configuration ] ────► Listens: `chargePointUpdated`
       │                                  Updates: Reflects confirmed hardware parameter keys and active profiles
       │
       ├─► [ Tab 5: Remote Control ] ───► Listens: `chargePointUpdated`, `session:log`
       │                                  Updates: Live execution verification for Reboot, Firmware Update & Clear Cache
       │
       ├─► [ Tab 6: Tariffs ] ──────────► Listens: `chargePointUpdated`
       │                                  Updates: Live tariff binding, base rates (₹/kWh), and GST percentage recalculation
       │
       └─► [ Tab 7: Telemetry / Logs ] ─► Listens: `session:log`
                                          Updates: Real-time high-throughput OCPP 1.6J JSON-RPC frame streamer & JSON inspector
```

---

### 5.1 Architecture: Room Management & Tab Switching Ref-Counting

To prevent redundant socket reconnections and avoid dropping room subscriptions during sub-tab switches, the application uses **Reference Counting** in `socketRoomManager.js`:

1. **Root Mounting**: When the user enters `/charge-points/:id`, [`ViewChargePoint.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/pages/ViewChargePoint.jsx) invokes `useSocketRoom('chargepoint:' + id)`.
   * Reference count for `chargepoint:<id>` increments from `0 -> 1`.
   * Socket client emits `socket.emit('join:room', 'chargepoint:<id>')`.
2. **Sub-Tab Activation**: When a sub-tab (e.g., Stats, Connectors, Transactions) mounts, its respective hook also calls `useSocketRoom('chargepoint:' + id)`.
   * Reference count increments from `1 -> 2`.
3. **Sub-Tab Switching**: When navigating between `?tab=stats` and `?tab=connectors`, the unmounting tab decrements the count (`2 -> 1`), while the newly mounting tab increments it back (`1 -> 2`).
   * Because the count never hits `0`, **no `leave:room` event is sent to the server**, ensuring continuous, uninterrupted real-time event streaming.
4. **Page Exit**: When navigating away from `/charge-points/:id`, the root component unmounts.
   * Reference count reaches `0`.
   * Socket client emits `socket.emit('leave:room', 'chargepoint:<id>')`, freeing server resources.
5. **Auto-Reconnection**: If the network disconnects, `socket.on('connect')` automatically iterates all active room keys in the local `Map` and re-emits `join:room`.

---

### 5.2 Page Root & Header Component

* **Component Path**: [`Frontend/src/features/chargePoints/pages/ViewChargePoint.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/pages/ViewChargePoint.jsx)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**: `chargePointUpdated`

#### Step-by-Step Socket Workflow:
1. **Trigger**: An OCPP `StatusNotification` arrives from physical hardware (e.g., connector changes to `Faulted` or `Available`), or an admin edits charger metadata via REST API.
2. **Backend Action**: The CSMS backend executes `safeIoEmit(io, 'chargePointUpdated', updatedCpPayload)`.
3. **Hook Processing**: The `useSocketEvents` listener in `ViewChargePoint.jsx` receives the payload:
   ```javascript
   useSocketEvents({
     chargePointUpdated: (updatedCp) => {
       if (!updatedCp || !updatedCp.id) return;
       if (updatedCp.id === id || updatedCp.code === id) {
         setChargePoint(prev => ({ ...prev, ...updatedCp }));
       }
     }
   });
   ```
4. **UI State Mutation**:
   * The top-right header status pill (e.g., `Available`, `Charging`, `Faulted`, `Offline`) updates immediately with appropriate badge colors (green, blue, red, zinc).
   * The total connector count badge in the tab bar updates dynamically if connectors were added or modified.

---

### 5.3 Tab 1: Stats Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointStatsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointStatsTab.jsx)
* **Custom Hook**: [`Frontend/src/features/chargePoints/hooks/useChargePointStats.js`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/hooks/useChargePointStats.js)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**:
  - `session:created` (OCPP `StartTransaction`)
  - `session:updated` (OCPP `MeterValues`)
  - `session:stopped` (OCPP `StopTransaction`)
  - `chargePointUpdated` (OCPP `StatusNotification` or Admin edit)

#### Step-by-Step Socket Workflow:
1. **Trigger**:
   - A vehicle begins charging (`session:created`), sending meter pulses (`session:updated`), or finishes charging (`session:stopped`).
   - Hardware sends heartbeat or status notifications (`chargePointUpdated`).
2. **Hook Processing**:
   * Whenever any of these 4 events are captured by `useSocketEvents`, the hook triggers an asynchronous `fetchStats()` query scoped to the active `timeRange` (e.g. `Today`, `This Month`, `This Year`):
   ```javascript
   useSocketEvents({
     'session:created': () => fetchStats(),
     'session:updated': () => fetchStats(),
     'session:stopped': () => fetchStats(),
     'chargePointUpdated': () => fetchStats()
   });
   ```
3. **UI State Mutation**:
   * **KPI Cards**: `totalRevenue` ($\text{₹}$), `totalEnergyKwh` ($\text{kWh}$), `totalSessions`, and `activeConnectors` recalculate instantly.
   * **Telemetry Graph**: The 24-hour / weekly cubic Bezier spline SVG curve recalculates its coordinate points $[x, y]$ and smoothly animates to reflect the newly delivered kilowatt-hours.
   * **No Full Page Reload**: Only the KPI values and chart spline re-render smoothly.

---

### 5.4 Tab 2: Connectors Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointConnectorsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointConnectorsTab.jsx)
* **Custom Hook**: [`Frontend/src/features/chargePoints/hooks/useChargePointConnectors.js`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/hooks/useChargePointConnectors.js)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**:
  - `chargePointUpdated`
  - `session:created`
  - `session:stopped`

#### Step-by-Step Socket Workflow:
1. **Trigger**:
   - Vehicle plugs into Connector #1 -> Hardware emits `StartTransaction`.
   - Vehicle unplugs from Connector #1 -> Hardware emits `StopTransaction`.
   - Ground fault or emergency stop button pressed -> Hardware emits `StatusNotification(status: Faulted, errorCode: EmergencyStop)`.
2. **Hook Processing**:
   * The hook maintains a localized `connectorStatusMap` state dictionary indexed by `connectorId`:
   ```javascript
   useSocketEvents({
     chargePointUpdated: (updatedCp) => {
       if (!updatedCp) return;
       if (onUpdate) onUpdate(updatedCp);
       if (updatedCp.connectors && Array.isArray(updatedCp.connectors)) {
         const newMap = {};
         updatedCp.connectors.forEach(c => {
           const cid = c.connectorId || c.id;
           if (cid && c.status) newMap[cid] = c.status;
         });
         setConnectorStatusMap(prev => ({ ...prev, ...newMap }));
       }
     },
     "session:created": (session) => {
       if (!session) return;
       const connId = session.connectorId || 1;
       setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Charging' }));
     },
     "session:stopped": (session) => {
       if (!session) return;
       const connId = session.connectorId || 1;
       setConnectorStatusMap(prev => ({ ...prev, [connId]: 'Available' }));
     }
   });
   ```
3. **UI State Mutation**:
   * The connector row in the table (e.g. Connector #1 - CCS2) toggles its status pill in-place:
     - `Available` (Emerald green badge) $\to$ `Charging` (Pulsing blue badge) $\to$ `Available`.
     - `Faulted` (Rose red badge) automatically flips the availability column to `Inoperative` and displays the vendor error code (e.g., `EmergencyPressed`).
   * **Remote Actions**: When the operator clicks "Remote Start" or "Remote Stop", the UI immediately applies an optimistic status and confirms it when the socket frame returns from the CSMS.

---

### 5.5 Tab 3: Charge Transactions Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointTransactionsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointTransactionsTab.jsx)
* **Custom Hook**: [`Frontend/src/features/chargePoints/hooks/useChargePointTransactions.js`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/hooks/useChargePointTransactions.js)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**:
  - `session:created`
  - `session:updated`
  - `session:stopped`

#### Step-by-Step Socket Workflow:
1. **New Session Trigger (`session:created`)**:
   - An EV begins charging. Server emits `session:created` to `chargepoint:<cpId>`.
   - **React State Update**:
     ```javascript
     'session:created': (session) => {
       if (!session || !session.id) return;
       if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
       setSessions(prev => {
         if (prev.some(s => s.id === session.id)) {
           return prev.map(s => s.id === session.id ? { ...s, ...session } : s);
         }
         return [session, ...prev]; // Prepend new active session to row 1
       });
     }
     ```
   - **UI Mutation**: A new row appears at the top of the transactions table with status `Ongoing`, Initial SoC %, and a starting cost of $\text{₹}0.00$.

2. **Periodic Telemetry Streaming (`session:updated`)**:
   - Hardware sends OCPP `MeterValues` (e.g. every 10–30 seconds). Server emits `session:updated`.
   - **React State Update**:
     ```javascript
     'session:updated': (session) => {
       if (!session || !session.id) return;
       if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
       setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...session } : s));
     }
     ```
   - **UI Mutation**: The active transaction row updates **in-place without jumping or re-sorting**:
     - `Current SoC`: Dynamically updates (e.g., $42\% \to 45\% \to 48\%$).
     - `Energy Delivered`: Increases continuously (e.g., $12.4 \text{ kWh} \to 13.1 \text{ kWh}$).
     - `Instantaneous Power`: Displays live kW draw (e.g., $29.8 \text{ kW}$).
     - `Duration`: Increments elapsed time timer (`00:18:42`).
     - `Total Cost`: Recalculates running cost based on attached tariff.

3. **Session Termination (`session:stopped`)**:
   - Driver ends charge via RFID, app, or unplugging. Server emits `session:stopped`.
   - **React State Update**:
     ```javascript
     'session:stopped': (session) => {
       if (!session || !session.id) return;
       if (session.chargePointId && cpId && session.chargePointId !== cpId) return;
       setSessions(prev => prev.map(s => s.id === session.id ? {
         ...s,
         ...session,
         status: session.status || 'Completed'
       } : s));
     }
     ```
   - **UI Mutation**:
     - Status badge flips from blue `Ongoing` to dark slate `Completed` (or red `Failed` if aborted).
     - Final energy, total duration, and billed amount lock in permanently.
     - A clickable "View Bill" button renders if `billId` is populated.

---

### 5.6 Tab 4: Configuration Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointConfigTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointConfigTab.jsx)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**: `chargePointUpdated`

#### Step-by-Step Socket Workflow:
1. **Trigger**: An operator modifies an OCPP configuration key (e.g., `MeterValueSampleInterval: "30"`, `AuthorizeRemoteTxRequests: "true"`) and clicks "Save Configuration", or the charger sends a configuration report.
2. **Backend Action**: The server executes OCPP `ChangeConfiguration.req` to the charger. When `ChangeConfiguration.conf` returns `Status: Accepted`, the backend persists the key and broadcasts `chargePointUpdated`.
3. **UI State Mutation**:
   * The configuration parameters table refreshes the active key's value and clears the loading state.
   * If a parameter is rejected by the charger (e.g. `Status: Rejected` / `NotSupported`), the UI displays a warning banner indicating that the hardware rejected the key update.

---

### 5.7 Tab 5: Remote Control Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointControlTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointControlTab.jsx)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**:
  - `chargePointUpdated`
  - `session:log`

#### Step-by-Step Socket Workflow:
1. **Trigger**:
   - Operator clicks **"Remote Reboot (Hard/Soft)"**, **"Update Firmware"**, **"Trigger Message (StatusNotification)"**, or **"Clear Local Auth Cache"**.
2. **REST API Dispatch**: UI sends `POST /api/charge-points/:id/control/<action>`.
3. **Socket Feedback & Verification**:
   - When the charger receives the OCPP command, it executes the action and sends an OCPP response frame (e.g. `Reset.conf`, `TriggerMessage.conf`).
   - The backend records the frame and emits `session:log` and `chargePointUpdated` to room `chargepoint:<id>`.
4. **UI State Mutation**:
   - If a Reset command was issued, the header badge flips to `Offline` and then returns to `Available` upon receiving `BootNotification`.
   - Toast notification alerts the operator of successful hardware acknowledgment.

---

### 5.8 Tab 6: Tariffs Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointTariffsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointTariffsTab.jsx)
* **Custom Hook**: [`Frontend/src/features/chargePoints/hooks/useChargePointTariff.js`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/hooks/useChargePointTariff.js)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**: `chargePointUpdated`

#### Step-by-Step Socket Workflow:
1. **Trigger**: An operator assigns a new tariff plan (e.g. *Commercial Peak Tariff - ₹18/kWh + 18% GST*) via modal dialog.
2. **Backend Action**: The server updates the database relationship `charge_points.tariff_id` and broadcasts `chargePointUpdated` containing the updated nested `tariff` object.
3. **UI State Mutation**:
   * The active tariff card immediately updates with the new Tariff Name, Base Rate ($\text{₹}/\text{kWh}$), and GST percentage.
   * Any subsequent charging sessions started on this charger instantly adopt the newly bound tariff rates.

---

### 5.9 Tab 7: Telemetry & OCPP Logs Tab

* **Component Path**: [`Frontend/src/features/chargePoints/components/ChargePointLogsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/components/ChargePointLogsTab.jsx) -> [`LogsTab.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/liveSessions/components/LogsTab.jsx)
* **Custom Hook**: [`Frontend/src/features/liveSessions/hooks/useSessionLogs.js`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/liveSessions/hooks/useSessionLogs.js)
* **Subscribed Room**: `chargepoint:<id>`
* **Events Listened To**: `session:log`

#### Step-by-Step Socket Workflow:
1. **Trigger**:
   - The charger or CSMS sends/receives **ANY** OCPP 1.6J JSON-RPC frame (`BootNotification`, `Heartbeat`, `StatusNotification`, `MeterValues`, `StartTransaction`, `StopTransaction`, `DataTransfer`, `DiagnosticsStatusNotification`).
2. **Backend Action**: The CSMS logs the frame into the database and immediately broadcasts `safeIoEmit(io, 'session:log', rawLogFrame)` to `chargepoint:<cpId>`.
3. **Hook Processing & Multi-Filter Evaluation**:
   ```javascript
   useSocketEvents({
     "session:log": (incomingLog) => {
       if (!incomingLog || !sessionId) return;

       // 1. Match authoritative CPID or charge point identifier
       const isMatch = matchesIdOrCode(incomingLog, sessionId);
       if (!isMatch) return;

       // 2. Evaluate Command Filters (e.g., only 'MeterValues', 'BootNotification')
       if (commands.length > 0 && !commands.some(c => incomingLog.command?.includes(c))) return;

       // 3. Evaluate Search Query (matches text in summary, body, or messageId)
       if (search && !matchesSearchTerm(incomingLog, search)) return;

       // 4. Update counter & Prepend if on Page 1
       setTotal(prev => prev + 1);
       if (page === 1) {
         setLogsList(prev => [formattedLog, ...prev.slice(0, limit - 1)]);
       }
     }
   });
   ```
4. **UI State Mutation**:
   * **Live Stream**: The new frame arrives at the top of the telemetry table with direction arrow (`INBOUND ↙` or `OUTBOUND ↗`), timestamp (`HH:mm:ss`), command pill, and summary text.
   * **JSON Inspector**: Clicking on the log row displays the raw JSON-RPC body in a syntax-highlighted code inspector with keys in cyan, strings in emerald green, numbers in amber, and booleans in purple.
   * **Copy Frame**: Instant one-click copy of the raw JSON payload to the system clipboard.

---

---

## 6. Phase 7: CSV Export (`GET /api/charge-points/export`)

* **HTTP Method**: `GET`
* **Route**: `/api/charge-points/export`
* **Query Parameters**:
  - `search`: `string (optional)`
  - `filters`: `string (optional, JSON stringified)`
* **Response Headers**:
  - `Content-Type`: `text/csv; charset=utf-8`
  - `Content-Disposition`: `attachment; filename="charge_points_export_<YYYY-MM-DD>.csv"`
* **Streamed CSV Column Specification**:

| Column Name | Data Type Format |
| :--- | :--- |
| `ID` | `string (ID)` |
| `Name` | `string` |
| `Code` | `string` |
| `Charging Station` | `string` |
| `Status` | `string` |
| `Stage` | `string` |
| `Type` | `string` |
| `Total Capacity (kW)` | `number (float)` |
| `Mode` | `string` |
| `Manufacturer` | `string` |
| `Firmware Version` | `string` |
| `Connectors Count` | `number (integer)` |
| `Tariff Profile` | `string` |
| `Last Active` | `string` |
| `Created Date` | `string (ISO-8601 DateTime)` |

---

## 7. Real-Time WebSocket Event Schemas & Payloads

### 7.1 Room Management Protocol

| Client Event | Direction | Payload Type | Behavior |
| :--- | :--- | :--- | :--- |
| `join:room` | Client -> Server | `string` (e.g., `chargepoint:<cpId>`) | Subscribes socket connection to the charge point room channel. |
| `leave:room` | Client -> Server | `string` (e.g., `chargepoint:<cpId>`) | Unsubscribes socket connection when all components unmount. |

---

### 7.2 Detailed Event Payloads in Room `chargepoint:<id>`

#### A. `session:created` (Triggered on OCPP `StartTransaction`)
* **Target Room**: `chargepoint:<cpId>`, `chargingstation:<csId>`
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string (Ongoing)",
  "chargePointId": "string (ID)",
  "chargePointCode": "string",
  "chargingStationId": "string (ID)",
  "chargingStationName": "string",
  "connectorId": "number (integer >= 1)",
  "userName": "string",
  "userInitials": "string",
  "userColor": "string",
  "initialSoc": "number (float: 0.0 - 100.0)",
  "currentSoc": "number (float: 0.0 - 100.0)",
  "kwhDelivered": "number (float: 0.0)",
  "totalCost": "number (float: 0.0)",
  "createdAt": "string (ISO-8601 DateTime)"
}
```

#### B. `session:updated` (Triggered on periodic OCPP `MeterValues`)
* **Target Room**: `chargepoint:<cpId>`, `chargingstation:<csId>`
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string (Ongoing)",
  "chargePointId": "string (ID)",
  "chargingStationId": "string (ID)",
  "powerKw": "number (float >= 0.0)",
  "voltage": "number (float >= 0.0)",
  "current": "number (float >= 0.0)",
  "kwhDelivered": "number (float >= 0.0)",
  "totalCost": "number (float >= 0.0)",
  "currentSoc": "number (float: 0.0 - 100.0)",
  "duration": "string (HH:mm:ss)",
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

#### C. `session:stopped` (Triggered on OCPP `StopTransaction` or Inactivity Timeout)
* **Target Room**: `chargepoint:<cpId>`, `chargingstation:<csId>`
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string (enum: Completed | Failed | Stopped)",
  "chargePointId": "string (ID)",
  "chargingStationId": "string (ID)",
  "kwhDelivered": "number (float >= 0.0)",
  "totalCost": "number (float >= 0.0)",
  "currentSoc": "number (float: 0.0 - 100.0)",
  "billId": "string (ID) | null",
  "duration": "string (HH:mm:ss)",
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

#### D. `chargePointUpdated` (Triggered on OCPP `StatusNotification` or Admin Edit)
* **Target Room**: `chargepoint:<cpId>`, `chargingstation:<csId>`, Global Broadcast
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "name": "string",
  "code": "string",
  "status": "string (enum: Available | Preparing | Charging | SuspendedEVSE | SuspendedEV | Finishing | Reserved | Unavailable | Faulted | Offline)",
  "stage": "string (enum: Active | Inactive | Under Maintenance)",
  "totalCapacity": "number (float)",
  "connectors": [
    {
      "id": "string (ID)",
      "connectorId": "number (integer >= 1)",
      "type": "string",
      "status": "string (enum: Available | Charging | Faulted | Unavailable)",
      "maxPower": "number (float)"
    }
  ],
  "updatedAt": "string (ISO-8601 DateTime)"
}
```

#### E. `chargePointAdded` (Triggered on New Charger Creation)
* **Target Room**: Global Broadcast
* **Payload Typed Schema**: Full `ChargePoint` entity object.

#### F. `chargePointDeleted` (Triggered on Charger Deletion)
* **Target Room**: Global Broadcast
* **Payload Typed Schema**: `string (ID)`

#### G. `session:log` (Triggered on Every OCPP Frame Inbound/Outbound)
* **Target Room**: `chargepoint:<cpId>`
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "command": "string (e.g. BootNotification | Heartbeat | MeterValues | StatusNotification | StartTransaction | StopTransaction)",
  "direction": "string (enum: INBOUND | OUTBOUND | SYSTEM)",
  "messageId": "string",
  "logType": "string (OCPP 1.6J)",
  "summary": "string",
  "body": "Object",
  "recordedOn": "string (HH:mm:ss)",
  "fullTimestamp": "string",
  "chargePointCode": "string | null"
}
```

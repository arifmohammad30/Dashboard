# Live Sessions, Session History & Session Logs - Technical Integration Specification & API Contract
**Active Live Sessions, Historical Audit Logs, Session Details, Telemetry/OCPP Logs & Socket.IO Protocols**

---

## Executive Summary & Architecture Overview

This document provides the complete, authoritative API contract and integration specification for the **Live Sessions, Session History, and Session Logs Features** (`/live-sessions`, `/session-history`, and `/session-logs/:id` or `/live-sessions/:id/logs`).

The integration architecture utilizes a hybrid **REST API + Socket.IO real-time engine**:
- **HTTP REST APIs**: Serves paginated active charging sessions, historical audit records with multi-criteria filtering, single session metadata inspection, OCPP telemetry logs with command filters, and CSV exports.
- **Socket.IO Real-Time Engine**: Broadcasts global session state transitions (`session:created`, `session:updated`, `session:stopped`) for immediate table re-synchronization, and streams real-time raw OCPP frames via `"session:log"` for active ongoing sessions.

```
┌─────────────────────────┐          ┌─────────────────────────┐
│     EV Charger / CP     │          │      CSMS Backend       │
│       [OCPP 1.6J]       │          │   (REST API + Socket)   │
└───────────┬─────────────┘          └────────────┬────────────┘
            │                                     │
            │ MeterValues, StatusNotification     │
            └────────────────────────────────────►│
                                                  │
                                   ┌──────────────┴──────────────┐
                                   │                             │
                     HTTP REST APIs│               Socket.IO     │ (Events: session:created,
                     (Sessions,    │               Real-Time     │  session:updated,
                     History, Logs)│               Broadcasts    │  session:stopped,
                                   │                             │  session:log)
                                   ▼                             ▼
                            ┌───────────────────────────────────────────┐
                            │             Frontend Client               │
                            │       (Live Sessions & Logs Hub)          │
                            └───────────────────────────────────────────┘
```

---

## Classification of Requirements

To maintain strict ownership boundaries between the frontend interface and backend engineering:

1. **CONFIRMED FROM FRONTEND**
   - Directly established by the frontend React components, custom hooks, and session formatters.
   - Represents the mandatory contract the backend must fulfill.

2. **BACKEND DECISION**
   - Decisions left strictly to the backend implementation (e.g. database schema, search indexing strategy, OCPP parser architecture, telemetry retention policies).

---

## Flow 1: Active Live Sessions (`/live-sessions`)

### A. Page Overview
- **Route**: `/live-sessions` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `LiveSessionsList.jsx`
- **Data Hook**: `useLiveSessions.js` calling `getLiveSessions(page, limit, search)`
- **Pagination & Search**: **100% Server-Side** **[CONFIRMED FROM FRONTEND]**

---

### B. Fetch Active Live Sessions API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**:

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No (Default: `1`) | 1-based page index **[CONFIRMED FROM FRONTEND]** | `1` |
| `limit` | `number` | No (Default: `10`) | Active sessions per page **[CONFIRMED FROM FRONTEND]** | `10` |
| `search` | `string` | No | Generic search query string **[CONFIRMED FROM FRONTEND]** | `"Rahul"` |

#### Consumed Response Schema (`200 OK`):
```json
{
  "data": [
    {
      "id": "sess_live_101",
      "userName": "Rahul Sharma",
      "userPhone": "+91 98765 43210",
      "userInitials": "RS",
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
      "status": "Ongoing",
      "soc": {
        "initial": 22,
        "current": 68
      },
      "meterValues": {
        "voltage": 415.2,
        "current": 120.5,
        "powerKw": 50.0,
        "temperature": 34.5
      },
      "kwhDelivered": 18.50,
      "cost": 342.25,
      "duration": "00:24:18",
      "createdAt": "2026-08-20T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Fields Consumed by `LiveSessionsRow.jsx`:

| Field | Type | Consumed By UI | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Row key, `getTxId`, Logs link | Authoritative unique session identifier **[CONFIRMED FROM FRONTEND]** |
| `userName` | `string` | EV Driver column | Driver full name **[CONFIRMED FROM FRONTEND]** |
| `userPhone` | `string` | EV Driver column | Contact phone number **[CONFIRMED FROM FRONTEND]** |
| `userInitials` | `string` | EV Driver Avatar | Driver initial badge **[CONFIRMED FROM FRONTEND]** |
| `chargingStation` | `object` (`{ id, name }`) | Charging Station column | Parent station link and display name **[CONFIRMED FROM FRONTEND]** |
| `chargePoint` | `object` (`{ id, name }`) | Charge Point column | Charger link and display name **[CONFIRMED FROM FRONTEND]** |
| `connector` | `object` (`{ id, connectorId, type }`) | Connector column | Connector badge via `getConnectorLabel` **[CONFIRMED FROM FRONTEND]** |
| `status` | `string` | Status column | Live badge: `'Charging'` (blue pulse) **[CONFIRMED FROM FRONTEND]** |
| `soc` | `object` (`{ initial, current }`) | SoC column | State of Charge popover cell **[CONFIRMED FROM FRONTEND]** |
| `meterValues` | `object` | Telemetry column | Real-time voltage, current, and power popover **[CONFIRMED FROM FRONTEND]** |
| `kwhDelivered` | `number \| string` | Energy column | Energy delivered in kWh **[CONFIRMED FROM FRONTEND]** |
| `cost` | `number \| string` | Cost column | Current running cost in ₹ **[CONFIRMED FROM FRONTEND]** |
| `duration` | `string` | Duration column | Elapsed duration string (e.g. `'00:24:18'`) **[CONFIRMED FROM FRONTEND]** |

---

## Flow 2: Session History Audit Log (`/session-history`)

### A. Page Overview
- **Route**: `/session-history` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `SessionHistoryList.jsx`
- **Data Hook**: `useSessionHistory.js` calling `getSessionHistory(page, limit, search, activeTab, filters)`
- **Pagination & Search**: **100% Server-Side** **[CONFIRMED FROM FRONTEND]**

---

### B. Pre-Requisite Option Catalogs (for Filter Drawer)
1. **Station Options**: `GET /api/charging-stations?limit=100` (populates Charging Station filter section) **[CONFIRMED FROM FRONTEND]**
2. **Charge Point Options**: `GET /api/charge-points?limit=100` (populates Charge Point filter section) **[CONFIRMED FROM FRONTEND]**

---

### C. Fetch Session History API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/history` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**:

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No (Default: `1`) | 1-based page index **[CONFIRMED FROM FRONTEND]** | `1` |
| `limit` | `number` | No (Default: `10`) | Items per page **[CONFIRMED FROM FRONTEND]** | `10` |
| `search` | `string` | No | Generic search query string **[CONFIRMED FROM FRONTEND]** | `"Vikram"` |
| `status` | `string` | No (Default: `'All'`) | Status pill tab filter (`'All'`, `'Completed'`, `'Failed'`) **[CONFIRMED FROM FRONTEND]** | `"Completed"` |
| `filters` | `string` | No | JSON stringified object of active drawer filters | `{"station":["DLF Hub"],"chargePoint":[],"timeRange":["Today"]}` |

#### Consumed Response Schema (`200 OK`):
```json
{
  "data": [
    {
      "id": "sess_hist_201",
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
      "soc": {
        "initial": 15,
        "current": 90
      },
      "meterValues": {
        "energyActiveImportRegister": 28.4
      },
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

#### Fields Consumed by `SessionHistoryRow.jsx`:

| Field | Type | Consumed By UI | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Row key, `getTxId`, Logs link | Authoritative unique session ID **[CONFIRMED FROM FRONTEND]** |
| `userName` | `string` | User column | Driver full name **[CONFIRMED FROM FRONTEND]** |
| `userPhone` | `string` | User column | Contact phone number **[CONFIRMED FROM FRONTEND]** |
| `userInitials` | `string` | User Avatar | Driver initial badge **[CONFIRMED FROM FRONTEND]** |
| `chargingStation` | `object` (`{ id, name }`) | Charging Station column | Parent station link and display name **[CONFIRMED FROM FRONTEND]** |
| `chargePoint` | `object` (`{ id, name }`) | Charge Point column | Charger link and display name **[CONFIRMED FROM FRONTEND]** |
| `connector` | `object` (`{ id, connectorId, type }`) | Connector column | Connector badge via `getConnectorLabel` **[CONFIRMED FROM FRONTEND]** |
| `status` | `string` | Status badge | `'Completed'` (cyan) or `'Failed'` (rose) **[CONFIRMED FROM FRONTEND]** |
| `soc` | `object` (`{ initial, current }`) | SoC column | State of Charge popover cell **[CONFIRMED FROM FRONTEND]** |
| `meterValues` | `object` | Telemetry column | Meter values popover cell **[CONFIRMED FROM FRONTEND]** |
| `kwhDelivered` | `number \| string` | Energy column | Total delivered energy string (kWh) **[CONFIRMED FROM FRONTEND]** |
| `cost` | `number \| string` | Cost column | Total billed amount string (₹) **[CONFIRMED FROM FRONTEND]** |
| `billCode` | `string` | Bill ID column | Clickable link navigating to `/bills?search=...` **[CONFIRMED FROM FRONTEND]** |
| `createdAt` | `string (ISO)` | Date column | Formatted session timestamp **[CONFIRMED FROM FRONTEND]** |

---

### D. Export Session History CSV API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/export` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**: Same `status`, `search`, and `filters` as history API **[CONFIRMED FROM FRONTEND]**
- **Response**: CSV file stream (`text/csv`).

---

## Flow 3: Session Details Header (`GET /api/live-sessions/:id`)

### A. Page Overview
- **Route**: `/session-logs/:id` or `/live-sessions/:id/logs` **[CONFIRMED FROM FRONTEND]**
- **Page Component**: `SessionLogsView.jsx`
- **Purpose**: Retrieves header summary cards (Station, Charge Point, Driver, Energy, Cost, and Status badge) above the telemetry logs table.

---

### B. Fetch Single Session Details API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/:id` **[CONFIRMED FROM FRONTEND]**

#### Consumed Response Schema (`200 OK`):
```json
{
  "id": "sess_live_101",
  "status": "Ongoing",
  "station": "DLF Cybercity Hub",
  "chargingStationId": "cs_101",
  "chargePointName": "DLF Phase 2 Fast Charger 01",
  "chargePointId": "cp_001",
  "userName": "Rahul Sharma",
  "kwhDelivered": 18.50,
  "cost": 342.25,
  "createdAt": "2026-08-20T12:00:00.000Z"
}
```

---

## Flow 4: Session Telemetry & OCPP Protocol Logs (`/session-logs/:id`)

### A. Component Overview
- **Component**: `LogsTab.jsx`
- **Data Hook**: `useSessionLogs.js` calling `getSessionLogs(sessionId, { page, limit, search, commands, logTypes })`
- **Pagination & Search**: **100% Server-Side** **[CONFIRMED FROM FRONTEND]**

---

### B. Fetch Session Telemetry Logs API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/:id/logs` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**:

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No (Default: `1`) | 1-based page index **[CONFIRMED FROM FRONTEND]** | `1` |
| `limit` | `number` | No (Default: `15`) | Log records per page **[CONFIRMED FROM FRONTEND]** | `15` |
| `search` | `string` | No | Search message ID, command, or ID tag **[CONFIRMED FROM FRONTEND]** | `"MeterValues"` |
| `commands` | `string` | No | Comma-separated list of selected OCPP commands | `"MeterValues,StatusNotification"` |
| `logTypes` | `string` | No | Comma-separated list of log protocol types | `"OCPP 1.6J,WebSocket"` |

#### Consumed Response Schema (`200 OK`):
```json
{
  "data": [
    {
      "id": "log_5001",
      "sessionId": "sess_live_101",
      "command": "MeterValues",
      "direction": "INBOUND",
      "messageId": "msg_90124",
      "idTag": "TAG-FLEET-001",
      "body": {
        "connectorId": 1,
        "transactionId": 101,
        "meterValue": [
          {
            "timestamp": "2026-08-20T12:15:00.000Z",
            "sampledValue": [
              { "value": "18500", "context": "Sample.Periodic", "format": "Raw", "measurand": "Energy.Active.Import.Register", "unit": "Wh" },
              { "value": "50.0", "context": "Sample.Periodic", "measurand": "Power.Active.Import", "unit": "kW" },
              { "value": "68", "context": "Sample.Periodic", "measurand": "SoC", "unit": "Percent" }
            ]
          }
        ]
      },
      "createdAt": "2026-08-20T12:15:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 15,
  "totalPages": 1
}
```

#### Fields Consumed by `LogsTab.jsx`:

| Field | Type | Consumed By UI | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Row key, Inspector trigger | Unique log entry ID **[CONFIRMED FROM FRONTEND]** |
| `command` | `string` | Command column, Badge generator | OCPP Action name (e.g. `'MeterValues'`, `'StatusNotification'`, `'BootNotification'`, `'StartTransaction'`, `'StopTransaction'`, `'Heartbeat'`) **[CONFIRMED FROM FRONTEND]** |
| `direction` | `string` | Direction arrow badge | `'INBOUND'` (from charger) or `'OUTBOUND'` (from server) **[CONFIRMED FROM FRONTEND]** |
| `messageId` | `string` | Message ID column, Inspector | Unique OCPP frame message ID **[CONFIRMED FROM FRONTEND]** |
| `idTag` | `string` | ID Tag column | RFID or authorization tag string **[CONFIRMED FROM FRONTEND]** |
| `body` | `object \| string (JSON)` | JSON & Raw Frame Inspector | Complete payload rendered in syntax highlighter and copyable as raw OCPP frame **[CONFIRMED FROM FRONTEND]** |
| `createdAt` | `string (ISO)` | Recorded On column | Timestamp formatted as `HH:mm:ss` **[CONFIRMED FROM FRONTEND]** |

---

### C. Export Telemetry Logs CSV API
- **HTTP Method**: `GET`
- **Endpoint**: `/api/live-sessions/logs/export` **[CONFIRMED FROM FRONTEND]**
- **Query Parameters**: `search` **[CONFIRMED FROM FRONTEND]**
- **Response**: CSV file stream (`text/csv`).

---

## Flow 5: Real-Time Socket.IO Protocol Specifications

### A. Global Session Life-cycle Events

| Event Name | Listening Components / Hooks | Consumed Payload Schema | UI Action |
| :--- | :--- | :--- | :--- |
| **`session:created`** | `useLiveSessions.js` | Complete live session object (`{ id, status: 'Ongoing', ... }`) | Prepends new active session to Live Sessions table if status is `'Ongoing'`. |
| **`session:updated`** | `useLiveSessions.js`<br>`useSessionHistory.js` | Updated session object (`{ id, status, kwhDelivered, cost, ... }`) | Live-updates running metrics in Live Sessions table. If status transitions out of `'Ongoing'`, removes from live sessions and triggers `reloadData()` on Session History. |
| **`session:stopped`** | `useLiveSessions.js`<br>`useSessionHistory.js` | Stopped session object (`{ id, status: 'Completed', ... }`) | Immediately removes session from Live Sessions table and triggers `reloadData()` on Session History audit log. |

---

### B. Live Session Telemetry Stream (`session:log`)
- **Event Name**: `"session:log"` **[CONFIRMED FROM FRONTEND]**
- **Listening Hook**: `useSessionLogs.js`
- **Consumed Payload Schema**:
```json
{
  "id": "log_5002",
  "sessionId": "sess_live_101",
  "command": "MeterValues",
  "direction": "INBOUND",
  "messageId": "msg_90125",
  "idTag": "TAG-FLEET-001",
  "body": { ... },
  "createdAt": "2026-08-20T12:16:00.000Z"
}
```
- **UI Behavior**: If `incomingLog.sessionId === currentSessionId` and the active session is `'Ongoing'`:
  1. Increments total telemetry log counter.
  2. If currently viewing page 1, prepends the incoming log entry to the top of the logs table.

---

## Summary of Complete Endpoint Matrix

| # | Flow / Feature | Method | Endpoint | Primary Parameters / Payload |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Active Live Sessions | `GET` | `/api/live-sessions` | `page`, `limit`, `search` |
| 2 | Session History Log | `GET` | `/api/live-sessions/history` | `page`, `limit`, `search`, `status` (`'All'\|'Completed'\|'Failed'`), `filters` |
| 3 | Export History CSV | `GET` | `/api/live-sessions/export` | `status`, `search`, `filters` |
| 4 | Session Header Details | `GET` | `/api/live-sessions/:id` | Authoritative `id` |
| 5 | Telemetry Logs | `GET` | `/api/live-sessions/:id/logs` | `page`, `limit`, `search`, `commands`, `logTypes` |
| 6 | Export Telemetry CSV | `GET` | `/api/live-sessions/logs/export` | `search` |
| 7 | Stations Filter Catalog | `GET` | `/api/charging-stations` | `limit=100` |
| 8 | Charge Points Filter Catalog | `GET` | `/api/charge-points` | `limit=100` |

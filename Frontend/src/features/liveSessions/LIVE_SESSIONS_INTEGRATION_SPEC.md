# Live Sessions Feature: End-to-End Typed Integration Specification

This document defines the strict architectural workflow, entity data types, field constraints, REST API contracts, real-time WebSocket event mechanics, popover data inspectors, and component lifecycle for the **Live Sessions** page (`/live-sessions`).

---

## 1. Architecture & Overview

The **Live Sessions** page provides real-time supervisory monitoring for all ongoing EV charging sessions across the network. It streams active telemetry (power, voltage, current, energy, state-of-charge, duration, and running costs) directly from physical charge points via OCPP 1.6J JSON-RPC gateways and WebSocket event broadcasts.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Live Sessions Architecture Overview                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                   │
                ┌──────────────────────────────────┴──────────────────────────────────┐
                ▼                                                                     ▼
    [ REST Initial Load ]                                                 [ Real-Time WebSockets ]
    GET /api/live-sessions                                                Global & Room Broadcasts
    (Pagination, Search, Initial List)                                   ├─ session:created (Prepend row)
                                                                          ├─ session:updated (In-place mutate)
                                                                          └─ session:stopped (Evict row)
                │                                                                     │
                └──────────────────────────────────┬──────────────────────────────────┘
                                                   ▼
                        ┌───────────────────────────────────────────────────┐
                        │      `LiveSessionsList.jsx` (Container Page)      │
                        ├───────────────────────────────────────────────────┤
                        │ • `LiveSessionsToolbar.jsx` (Telemetry Badge,     │
                        │    Search Input, History Navigation CTA)          │
                        │ • `LiveSessionsTable.jsx` (12-Column Table,       │
                        │    Loading, Empty State, Pagination)              │
                        │ • `LiveSessionsRow.jsx` (Single Active Row)       │
                        │   ├─ `TelemetryActionButton` (View Logs Button)   │
                        │   ├─ `SocPopoverCell` (Initial vs Current SoC)    │
                        │   └─ `MeterValuesPopoverCell` (V, A, kW, kWh)     │
                        └───────────────────────────────────────────────────┘
```

---

## 2. Entity & Data Model Specifications

### 2.1 `LiveSessionEntity` Schema

Every active live session object complies with the following strict typed schema:

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `string (ID/UUID)` | **Yes** | Unique primary key identifier of the session (e.g., `sess_1726482900_tx_9081`). |
| `chargeTxCode` | `string` | **Yes** | OCPP transaction identifier code (e.g., `TX-9081` or `60062`). |
| `userName` | `string` | **Yes** | EV Driver display name (e.g., `John Doe`). |
| `userInitials` | `string` | **Yes** | 1–2 character initials for user avatar badge (e.g., `JD`). |
| `chargingStation` | `ChargingStationDTO \| null` | No | Nested station object `{ id: string, name: string }`. |
| `chargePoint` | `ChargePointDTO \| null` | No | Nested charge point object `{ id: string, name: string, code: string }`. |
| `connector` | `string` | **Yes** | Standard formatted label: `<Type> (<ConnectorId>)` (e.g., `CCS2 (1)`, `15A (2)`). |
| `status` | `string` | **Yes** | Operational status: `'Ongoing'`, `'Completed'`, `'Failed'`, `'Stopped'`. |
| `initialSoc` | `number (float: 0.0 - 100.0)` | **Yes** | Battery State of Charge at session start percentage. |
| `currentSoc` | `number (float: 0.0 - 100.0)` | **Yes** | Latest live battery State of Charge percentage. |
| `kwhDelivered` | `number (float >= 0.0)` | **Yes** | Cumulative energy delivered during this session in kWh. |
| `totalCost` | `number (float >= 0.0)` | **Yes** | Real-time accumulated session cost in base currency ($\text{₹}$). |
| `duration` | `string (HH:mm:ss)` | **Yes** | Elapsed session duration timer string (e.g., `00:24:18`). |
| `meterValues` | `MeterValuesObject` | **Yes** | Formatted electrical telemetry package `{ energy, power, voltage, current }`. |
| `billNumber` | `string \| null` | No | Associated bill number (e.g., `BILL-60062`). |
| `createdAt` | `string (ISO-8601 DateTime)` | **Yes** | UTC timestamp when session was initiated. |

---

### 2.2 Nested Schemas

#### A. `MeterValuesObject` Schema
```json
{
  "energy": "string (e.g., '14.20 kWh')",
  "power": "string (e.g., '29.80 kW')",
  "voltage": "string (e.g., '400.5 V')",
  "current": "string (e.g., '74.2 A')"
}
```

#### B. `ChargingStationDTO` Schema
```json
{
  "id": "string (UUID)",
  "name": "string (e.g., 'Location 7 Hub')"
}
```

#### C. `ChargePointDTO` Schema
```json
{
  "id": "string (UUID)",
  "name": "string (e.g., 'Charge Point Station 34 AC')",
  "code": "string (e.g., 'CP-1034')"
}
```

---

## 3. REST API Contracts

### 3.1 Fetch Active Live Sessions (`GET /api/live-sessions`)

* **HTTP Method**: `GET`
* **Route**: `/api/live-sessions`
* **Description**: Queries all active, ongoing charging sessions across the charging infrastructure with optional server-side search and pagination.
* **Request Headers**:
  - `Authorization`: `Bearer <string (JWT)>`
* **Query Parameters**:
  - `page`: `number (integer >= 1, default: 1)` — Target page number.
  - `limit`: `number (integer >= 1, default: 10)` — Number of records per page.
  - `search`: `string (optional)` — Case-insensitive search string matching driver name, station name, charger name, or CPID.
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (ID)",
      "chargeTxCode": "string",
      "userName": "string",
      "userInitials": "string",
      "chargingStation": {
        "id": "string (UUID)",
        "name": "string"
      },
      "chargePoint": {
        "id": "string (UUID)",
        "name": "string",
        "code": "string"
      },
      "connector": "string (e.g., '15A (2)')",
      "status": "string ('Ongoing')",
      "initialSoc": "number (float: 0.0 - 100.0)",
      "currentSoc": "number (float: 0.0 - 100.0)",
      "kwhDelivered": "number (float >= 0.0)",
      "totalCost": "number (float >= 0.0)",
      "duration": "string (HH:mm:ss)",
      "meterValues": {
        "energy": "string (e.g., '14.20 kWh')",
        "power": "string (e.g., '29.80 kW')",
        "voltage": "string (e.g., '400.5 V')",
        "current": "string (e.g., '74.2 A')"
      },
      "billNumber": "string | null",
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

### 3.2 Fetch Single Live Session Details (`GET /api/live-sessions/:id`)

* **HTTP Method**: `GET`
* **Route**: `/api/live-sessions/:id`
* **URL Parameter**: `id` -> `string (ID)`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**: Single `LiveSessionEntity` object matching the schema above.

---

## 4. Real-Time WebSocket Mechanics

The Live Sessions page consumes real-time socket events delivered via the global broadcast channel and specific charge point rooms to update the table in real-time with zero full-page reloads.

```
+───────────────────────────────────────────────────────────────────────────────────────────+
│                                WebSocket Event Dispatcher                                 │
+───────────────────────────────────────────────────────────────────────────────────────────+
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
[ Event: `session:created` ]        [ Event: `session:updated` ]         [ Event: `session:stopped` ]
Trigger: OCPP `StartTransaction`     Trigger: OCPP `MeterValues` (30s)    Trigger: OCPP `StopTransaction`
Payload: New session data object     Payload: Telemetry mutation          Payload: Stopped session data
Behavior: Prepend to top of table    Behavior: In-place row mutation      Behavior: Evict row from table
```

---

### 4.1 Event: `session:created`

* **Trigger**: A vehicle plugs in, authenticates via RFID or mobile app, and the physical charger transmits an OCPP `StartTransaction.req`.
* **Direction**: Server -> Client Broadcast
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string ('Ongoing')",
  "chargePointId": "string (ID)",
  "chargePointCode": "string",
  "chargePointName": "string",
  "chargingStationId": "string (ID)",
  "chargingStationName": "string",
  "connectorId": "number (integer >= 1)",
  "connector": "string",
  "userName": "string",
  "userInitials": "string",
  "userColor": "string",
  "initialSoc": "number (float)",
  "currentSoc": "number (float)",
  "soc": {
    "initial": "number (float)",
    "current": "number (float)"
  },
  "kwhDelivered": "number (float: 0.0)",
  "totalCost": "number (float: 0.0)",
  "powerKw": "number (float)",
  "voltage": "number (float)",
  "current": "number (float)",
  "duration": "string ('00:00:00')",
  "createdAt": "string (ISO-8601 DateTime)"
}
```
* **React State Mutation Logic**:
  ```javascript
  "session:created": (newSession) => {
    if (!newSession) return;
    setSessions(prev => {
      // Ignore if session is not active/ongoing
      if (newSession.status && newSession.status !== 'Ongoing') return prev;
      // Prevent duplicate row insertion
      const exists = prev.some(s => matchSession(s, newSession));
      if (exists) return prev;
      // Prepend to index 0
      return [{ ...newSession }, ...prev];
    });
  }
  ```
* **UI Behavior**: A new row appears at the top of the table with a pulsing blue `Charging` badge, initial SoC %, $\text{₹}0.00$ cost, and a starting duration of `00:00:00`.

---

### 4.2 Event: `session:updated`

* **Trigger**: The physical charger sends periodic OCPP `MeterValues.req` (typically every 10–30 seconds) containing current energy ($\text{kWh}$), instantaneous power ($\text{kW}$), voltage ($\text{V}$), current ($\text{A}$), and vehicle battery State of Charge ($\text{SoC}\%$).
* **Direction**: Server -> Client Broadcast
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string ('Ongoing')",
  "chargePointId": "string (ID)",
  "chargingStationId": "string (ID)",
  "powerKw": "number (float >= 0.0)",
  "voltage": "number (float >= 0.0)",
  "current": "number (float >= 0.0)",
  "kwhDelivered": "number (float >= 0.0)",
  "totalCost": "number (float >= 0.0)",
  "cost": "string",
  "currentSoc": "number (float: 0.0 - 100.0)",
  "soc": {
    "initial": "number (float)",
    "current": "number (float)"
  },
  "duration": "string (HH:mm:ss)",
  "meterValues": {
    "energy": "string",
    "power": "string",
    "voltage": "string",
    "current": "string"
  },
  "updatedAt": "string (ISO-8601 DateTime)"
}
```
* **React State Mutation Logic**:
  ```javascript
  "session:updated": (updatedSession) => {
    if (!updatedSession) return;
    setSessions(prev => {
      // If the update indicates the session has ended, remove it from the active list
      if (updatedSession.status && updatedSession.status !== 'Ongoing') {
        return prev.filter(s => !matchSession(s, updatedSession));
      }
      const index = prev.findIndex(s => matchSession(s, updatedSession));
      if (index !== -1) {
        const next = [...prev];
        next[index] = { ...prev[index], ...updatedSession };
        return next;
      }
      // If previously unlisted, prepend
      return [{ ...updatedSession }, ...prev];
    });
  }
  ```
* **UI Behavior**: The matching row updates **in-place without jitter or full re-rendering**:
  - `SoC`: Updates live (e.g., $32.0\% \to 35.5\%$).
  - `Energy`: Updates live (e.g., $8.40 \text{ kWh} \to 9.15 \text{ kWh}$).
  - `Cost`: Recalculates live (e.g., $\text{₹}126.00 \to \text{₹}137.25$).
  - `Duration`: Increments time counter (`00:14:22` $\to$ `00:14:52`).
  - `MeterValues Popover`: Updates internal readings for Voltage, Current, and Power kW.

---

### 4.3 Event: `session:stopped`

* **Trigger**: Driver swipes RFID, terminates session in mobile app, or unplugs the cable. The charger transmits an OCPP `StopTransaction.req`.
* **Direction**: Server -> Client Broadcast
* **Payload Typed Schema**:
```json
{
  "id": "string (ID)",
  "sessionId": "string (ID)",
  "chargeTxCode": "string",
  "status": "string (enum: 'Completed' | 'Failed' | 'Stopped')",
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
* **React State Mutation Logic**:
  ```javascript
  "session:stopped": (stoppedSession) => {
    if (!stoppedSession) return;
    // Evict stopped session from the active live list
    setSessions(prev => prev.filter(s => !matchSession(s, stoppedSession)));
  }
  ```
* **UI Behavior**: The completed session is smoothly removed from the Live Sessions table. The total active sessions counter in the table decrements.

---

## 5. UI Component Hierarchy & Detailed Logic

```
LiveSessionsList.jsx
├── LiveSessionsToolbar.jsx
│   ├── "Streaming Live Telemetry" Live Pulsing Badge
│   ├── SearchInput (Real-time filter by driver, CPID, station, or charge point)
│   └── "Session History" CTA Button (Navigates to `/session-history`)
└── LiveSessionsTable.jsx
    ├── Loading Spinner State
    ├── Empty State (No active sessions vs. No search results found)
    ├── Table Header (12 Columns)
    ├── LiveSessionsRow.jsx (Repeated for each active session)
    │   ├── 1. TelemetryActionButton.jsx (Hover-revealed "View Logs" button -> `/session-logs/:id`)
    │   ├── 2. Driver Badge & Name / Phone
    │   ├── 3. Charge Point Name (Clickable link -> `/charge-points/:id`)
    │   ├── 4. Charging Station Name (Clickable link -> `/charging-stations/:id`)
    │   ├── 5. Txn Id (`#...` formatted)
    │   ├── 6. Connector (`Type2 (1)`, `CCS2 (2)`)
    │   ├── 7. Status Pill (`Charging` with pulsing blue dot)
    │   ├── 8. SocPopoverCell.jsx (Interactive popover with Initial vs Current SoC)
    │   ├── 9. MeterValuesPopoverCell.jsx (Interactive popover with Energy, Power, Voltage, Current)
    │   ├── 10. Energy (kWh font-mono)
    │   ├── 11. Cost (₹ font-extrabold emerald)
    │   └── 12. Duration (HH:mm:ss font-mono)
    └── Pagination.jsx (Page switching controls)
```

---

### 5.1 12-Column Table Specification

| # | Column Name | Component / Formatter | Clickable Action / Behavior |
| :--- | :--- | :--- | :--- |
| **1** | **Actions** | [`TelemetryActionButton.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/liveSessions/components/TelemetryActionButton.jsx) | Hidden by default; smoothly fades in on row hover. Clicking navigates to `/session-logs/:id`. |
| **2** | **EV Driver** | Initials avatar + Driver Name + Phone | Displays user initials with styled background, full user name, and formatted phone number. |
| **3** | **Charge Point** | Charge Point Name | **Clickable**: Navigates to [`/charge-points/:id`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargePoints/pages/ViewChargePoint.jsx) passing `{ chargePoint }` in React Router state. |
| **4** | **Charging Station** | Station Name | **Clickable**: Navigates to [`/charging-stations/:id`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/features/chargingStations/pages/ViewChargingStation.jsx) passing `{ station }` in React Router state. |
| **5** | **Txn Id** | `getTxId(session.id)` | Displays mono-spaced transaction tag (e.g. `#TX-9081`). |
| **6** | **Connector** | `getConnectorLabel(session.connector, session)` | Standardized connector label (e.g. `CCS2 (1)`). |
| **7** | **Status** | Pulsing Blue Pill | Badge rendering `Charging` with a pulsing blue SVG indicator. |
| **8** | **SoC** | [`SocPopoverCell.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/components/ui/SocPopoverCell.jsx) | **Interactive**: Displays Current SoC (e.g. `65.4%`). Clicking opens popover showing **Initial SoC** vs **Current SoC**. |
| **9** | **Telemetry** | [`MeterValuesPopoverCell.jsx`](file:///c:/Users/DELL/Desktop/Project/Frontend/src/components/ui/MeterValuesPopoverCell.jsx) | **Interactive**: Clicking "View Meter" opens floating popover with live Energy ($\text{kWh}$), Power ($\text{kW}$), Voltage ($\text{V}$), and Current ($\text{A}$). |
| **10** | **Energy** | `session.kwhDelivered` | Mono-spaced kilowatt-hours formatted to 2 decimal places (e.g., `18.42 kWh`). |
| **11** | **Cost** | `session.cost` / `session.totalCost` | Extrabold emerald green currency value (e.g., `₹276.30`). |
| **12** | **Duration** | `session.duration` | Live elapsed timer in `HH:mm:ss` (e.g., `00:32:15`). |

---

### 5.2 Interactive Telemetry Popovers

#### A. `SocPopoverCell`
* **Trigger**: Clicking the green battery badge.
* **Dismiss**: Clicking outside (`document.addEventListener('mousedown')`) or clicking the toggle button again.
* **Content**:
  ```
  +──────────────────────────────────+
  │ STATE OF CHARGE                  │
  ├──────────────────────────────────┤
  │ Initial SoC:              22.0%  │
  │ Current SoC:              68.5%  │
  +──────────────────────────────────+
  ```

#### B. `MeterValuesPopoverCell`
* **Trigger**: Clicking the "View Meter" button.
* **Dismiss**: Clicking outside (`document.addEventListener('mousedown')`) or clicking the button again.
* **Content**:
  ```
  +──────────────────────────────────+
  │ METER TELEMETRY                  │
  ├──────────────────────────────────┤
  │ Energy:               18.42 kWh  │
  │ Power:                 29.80 kW  │
  │ Voltage:                401.2 V  │
  │ Current:                 74.3 A  │
  +──────────────────────────────────+
  ```

---

## 6. Navigation Matrix

From the Live Sessions page, operators can seamlessly drill into related operational entities:

| Element Clicked | Target Route | State Passed | Purpose |
| :--- | :--- | :--- | :--- |
| **"Session History" Button** | `/session-history` | None | Access historical completed / failed session records with multi-filters and CSV export. |
| **"View Logs" Button (Actions)** | `/session-logs/:id` | `{ session }` | Open live OCPP 1.6J JSON-RPC telemetry frame streamer and raw JSON code inspector for this specific session. |
| **Charge Point Name** | `/charge-points/:id` | `{ chargePoint }` | Navigate to Charge Point view page (Stats, Connectors, Transactions, Config, Control, Tariffs, Logs). |
| **Charging Station Name** | `/charging-stations/:id` | `{ station }` | Navigate to Charging Station overview (Overview, Charge Points, Transactions, Tariffs, Bills, Fleets). |

---

## 7. Edge Cases & Reliability Strategies

1. **Empty States**:
   - **No Active Sessions**: Renders a dedicated radio icon card stating: *"No Active Live Sessions — There are currently no active charging sessions streaming telemetry."*
   - **No Search Results**: Renders a search icon card with a "Clear Search" action button to reset query parameters.
2. **Network Disconnect & Reconnect**:
   - If the WebSocket disconnects, `socket.on('connect')` automatically resumes listening.
   - The user can click the "Retry" button on the error banner to trigger `reload()`, executing a fresh `GET /api/live-sessions` query.
3. **Ghost Session Eviction**:
   - If an OCPP `StopTransaction` or session completion status is received via `session:updated` or `session:stopped`, the hook filters it out from the active sessions array immediately.
4. **Zero-Flicker In-Place Updates**:
   - By matching sessions via `matchSession(s, updatedSession)` (comparing case-insensitive `sessionId` and `id`), telemetry updates mutate existing array indices rather than clearing and replacing the array, preserving scroll position and popover open states.

---

## 8. Session Logs View (`/session-logs/:id`) Specification

### 8.1 Unified Single Endpoint Contract: `GET /api/live-sessions/:id/logs`
A single unified endpoint returns both the session header summary (`session`) and the paginated protocol telemetry logs (`data`):

```json
{
  "session": {
    "id": "sess_cp-1034_tx_60062_1789566077707",
    "chargeTxCode": "60062",
    "status": "Failed",
    "chargingStation": {
      "id": "ec0fb759-6081-427b-bf21-cfc830b9d539",
      "name": "Location 7 Hub"
    },
    "chargePoint": {
      "id": "03a84154-80bc-4c51-96da-08ec050080ba",
      "name": "Charge Point Station 34 AC",
      "code": "CP-1034"
    },
    "userName": "B108901020",
    "kwhDelivered": 0.0,
    "cost": 0.0
  },
  "data": [
    {
      "id": "c1f72a4d-08b3-4f51-86da-08ec050080bc",
      "command": "StartTransaction",
      "direction": "INBOUND",
      "messageId": "MSG-9081",
      "idTag": "TAG-8091",
      "logType": "OCPP 1.6J",
      "summary": "↘ StartTransaction Inbound",
      "body": {
        "connectorId": 1,
        "idTag": "TAG-8091",
        "meterStart": 0,
        "timestamp": "2026-09-17T13:41:17.709Z"
      },
      "createdAt": "2026-09-17T13:41:17.709Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 15,
  "totalPages": 1
}
```

### 8.2 WebSocket Stream: `session:log` & `session:log:<sessionId>`
Emits the exact same clean, parsed Log DTO for zero-discrepancy real-time protocol inspection.


# Charge Points Module - Technical Integration Specification

This document presents the complete technical specification for the Charge Points module. It is structured into four core sections:
1. **Overall Module Flow & Main HTTP Requests**
2. **Detail Page Tabs & HTTP Endpoints (including Connector Remote Commands)**
3. **Socket-Enabled Tabs & Real-Time Event Protocols**
4. **Step-by-Step UI Execution & Navigation Workflows**

---

## Section 1: Overall Charge Points Module Flow & Main HTTP Requests

### 1.1. Module Overview & Lifecycle
The Charge Points module allows fleet administrators to view, create, edit, monitor, and configure EV charging hardware.
- **List View (`/charge-points`)**: Displays paginated table of charge points with search, multi-filter drawer, and CSV export.
- **Add Form (`/charge-points/new`)**: Form to register a new charge point.
- **Edit Form (`/charge-points/edit/:id`)**: Form to update existing charge point metadata.
- **Add Connector Page (`/charge-points/:id/connectors/new`)**: Form to add a new charging connector (CCS2, Type 2, GB/T, CHAdeMO) to a specific charge point.
- **Detail View (`/charge-points/:id?tab=...`)**: Tabbed interface (`stats`, `connectors`, `transactions`, `tariffs`, `config`, `control`).

---

### 1.2. Main HTTP Request Payloads & JSON Schemas

#### 1. Fetch Paginated Charge Points List
- **Method & Endpoint:** `GET /api/charge-points`
- **Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | Page number (default: `1`) | `1` |
| `limit` | `number` | No | Records per page (default: `10`) | `10` |
| `search` | `string` | No | Search string for Name, Serial, or Station | `"DLF"` |
| `filters` | `string` | No | Stringified filter object | `{"status":["Available"]}` |

- **Frontend Request Call (`chargePointService.js`):**
  ```javascript
  GET /api/charge-points?page=1&limit=10&search=DLF&filters={"status":["Available"]}
  ```
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "cp_101",
        "cpId": "CP-DLF-01-AC",
        "name": "Charge Point Station 28 AC",
        "serialNumber": "SN-AC-2026-001",
        "vendor": "Schneider Electric",
        "model": "EVlink Pro AC",
        "firmwareVersion": "v2.4.1",
        "status": "Available",
        "chargingStationId": "station_1",
        "chargingStationName": "DLF Cybercity Fast Hub",
        "totalConnectors": 2,
        "connectors": [
          {
            "id": "conn_1",
            "connectorId": 1,
            "type": "Type 2",
            "maxPowerKw": 22.0,
            "status": "Available"
          }
        ],
        "createdAt": "2026-08-26T10:00:00.000Z",
        "updatedAt": "2026-08-26T10:00:00.000Z"
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
  ```

---

#### 2. Fetch Single Charge Point Details
- **Method & Endpoint:** `GET /api/charge-points/:id`
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "id": "cp_101",
    "cpId": "CP-DLF-01-AC",
    "name": "Charge Point Station 28 AC",
    "serialNumber": "SN-AC-2026-001",
    "vendor": "Schneider Electric",
    "model": "EVlink Pro AC",
    "firmwareVersion": "v2.4.1",
    "status": "Available",
    "chargingStationId": "station_1",
    "chargingStationName": "DLF Cybercity Fast Hub",
    "tariffId": "tariff_100",
    "connectors": [
      { "id": "conn_1", "connectorId": 1, "type": "Type 2", "maxPowerKw": 22.0, "status": "Available" }
    ],
    "createdAt": "2026-08-26T10:00:00.000Z"
  }
  ```

---

#### 3. Create New Charge Point
- **Method & Endpoint:** `POST /api/charge-points`
- **Request Body (`POST`):**
  ```json
  {
    "cpId": "CP-GUR-05-DC",
    "name": "Gurugram Fast Charger DC 05",
    "serialNumber": "SN-DC-2026-902",
    "vendor": "ABB",
    "model": "Terra 54",
    "firmwareVersion": "v3.1.0",
    "chargingStationId": "station_5",
    "status": "Available"
  }
  ```
- **Expected Response Payload (`201 Created`):**
  ```json
  {
    "id": "cp_202",
    "cpId": "CP-GUR-05-DC",
    "name": "Gurugram Fast Charger DC 05",
    "status": "Available",
    "createdAt": "2026-08-26T15:30:00.000Z"
  }
  ```

---

#### 4. Update Existing Charge Point
- **Method & Endpoint:** `PUT /api/charge-points/:id`
- **Request Body (`PUT`):**
  ```json
  {
    "name": "Gurugram Fast Charger DC 05 Updated",
    "firmwareVersion": "v3.2.1",
    "status": "Occupied"
  }
  ```
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "id": "cp_202",
    "name": "Gurugram Fast Charger DC 05 Updated",
    "status": "Occupied",
    "updatedAt": "2026-08-26T15:32:00.000Z"
  }
  ```

---

#### 5. Delete Charge Point
- **Method & Endpoint:** `DELETE /api/charge-points/:id`
- **Expected Response Payload (`200 OK`):** `{ "message": "Charge point deleted successfully", "id": "cp_202" }`

---

#### 6. Export Charge Points CSV
- **Method & Endpoint:** `GET /api/charge-points/export`
- **Query Parameters:** `search`, `filters`
- **Response:** CSV File Stream (`charge_points_export_YYYY-MM-DD.csv`).

---

## Section 2: Detail Page Tabs & HTTP Endpoints (`ViewChargePoint.jsx`)

When viewing a single Charge Point (`/charge-points/:id`), the user can navigate across 6 tabs (`?tab=...`):

### 2.1. Connectors Tab (`?tab=connectors`) & Remote Connector Commands

#### 1. Add New Connector Page (`/charge-points/:id/connectors/new`)
- **Method & Endpoint:** `POST /api/charge-points/:id/connectors`
- **Request Payload (`POST`):**
  ```json
  {
    "connectorId": 2,
    "type": "CCS2",
    "powerRating": 60.0,
    "maxCurrent": 150.0,
    "maxVoltage": 400.0,
    "powerType": "DC",
    "connectorFormat": "Cable",
    "status": "Available"
  }
  ```
- **Expected Response Payload (`201 Created`):**
  ```json
  {
    "message": "Connector added successfully",
    "connector": { "id": "conn_102", "connectorId": 2, "type": "CCS2", "maxPower": 60.0, "status": "Available" },
    "chargePoint": { "id": "cp_101", "totalConnectors": 2 }
  }
  ```

---

#### 2. Update Connector Status
- **Method & Endpoint:** `PUT /api/charge-points/:id/connectors/:connectorId`
- **Request Payload (`PUT`):** `{ "status": "Operative" }` (or `"Inoperative"`, `"Available"`, `"Faulted"`)
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "id": "cp_101",
    "connectors": [
      { "id": "conn_1", "connectorId": 1, "status": "Operative" }
    ]
  }
  ```

---

#### 3. Remote Start Charging
- **Method & Endpoint:** `POST /api/charge-points/:id/connectors/:connectorId/start`
- **Description:** Sends an outbound OCPP `RemoteStartTransaction` command to trigger EV charging on this connector ID.
- **Request Body:** `{}` (empty object)
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "status": "Accepted",
    "message": "RemoteStartTransaction command sent successfully",
    "connectorId": 1
  }
  ```
- **Frontend Action:** Sets `connectorStatusMap[connId] = 'Charging'` and fires success toast: `"Remote start charging sent for Connector #1"`.

---

#### 4. Remote Stop Charging
- **Method & Endpoint:** `POST /api/charge-points/:id/connectors/:connectorId/stop`
- **Description:** Sends an outbound OCPP `RemoteStopTransaction` command to stop ongoing charging session on this connector ID.
- **Request Body:** `{}` (empty object)
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "status": "Accepted",
    "message": "RemoteStopTransaction command sent successfully",
    "connectorId": 1
  }
  ```
- **Frontend Action:** Sets `connectorStatusMap[connId] = 'Available'` and fires success toast: `"Remote stop charging sent for Connector #1"`.

---

#### 5. Check Connector Status
- **Method & Endpoint:** `GET /api/charge-points/:id/connectors/:connectorId/status`
- **Description:** Queries real-time hardware status of the specific connector via backend query.
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "connectorId": 1,
    "status": "Available",
    "errorCode": "NoError",
    "info": "Operational and ready"
  }
  ```
- **Frontend Action:** Updates `connectorStatusMap[connId] = res.status` and fires info toast: `"Connector #1 status: Available"`.

---

### 2.2. Stats Tab (`?tab=stats`)
- **Fetch Telemetry Stats:** `GET /api/charge-points/:id/stats?timeRange=Today`
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "totalSessions": 43,
    "totalRevenue": 645.00,
    "totalEnergyKwh": 430.25,
    "peakPowerKw": 22.0,
    "activeDurationMinutes": 840,
    "hourlyBreakdown": [
      { "time": "00:00", "revenue": 0.0, "energyKwh": 0.0, "sessions": 0 },
      { "time": "12:00", "revenue": 180.0, "energyKwh": 120.0, "sessions": 12 }
    ]
  }
  ```

---

### 2.3. Charge Transactions Tab (`?tab=transactions`)
- **Fetch Charge History:** `GET /api/live-sessions/history?chargePointId=:id&page=1&limit=10&search=`
- **Expected Response Payload (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "session_9912",
        "sessionId": "SESS-74190",
        "chargePointId": "cp_101",
        "connectorId": 1,
        "driverName": "Rahul Sharma",
        "status": "Completed",
        "energyDeliveredKwh": 18.5,
        "powerKw": 22.0,
        "amount": 277.50,
        "startTime": "2026-08-26T12:00:00.000Z",
        "endTime": "2026-08-26T12:50:00.000Z"
      }
    ],
    "total": 18,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
  ```

---

### 2.4. Tariffs Tab (`?tab=tariffs`)
- **Fetch Tariffs Catalog:** `GET /api/tariffs`
- **Assign Tariff to Charge Point:** `PUT /api/charge-points/:id/tariff`
  - **Body:** `{ "tariffId": "tariff_101" }`
  - **Expected Response Payload (`200 OK`):**
    ```json
    {
      "id": "cp_101",
      "tariffId": "tariff_101",
      "tariff": { "id": "tariff_101", "name": "Standard Commercial AC Tariff", "baseRate": 15.00 }
    }
    ```

---

### 2.5. OCPP Configurations Tab (`?tab=config`)
- **Fetch Configurations:** `GET /api/charge-points/:id/configurations`
- **Update Configuration:** `PUT /api/charge-points/:id/configurations`
  - **Body:** `{ "key": "HeartbeatInterval", "value": "180" }`

---

### 2.6. Remote Controls Tab (`?tab=control`)
- **Reset Command:** `POST /api/charge-points/:id/control/reset` (`{ "resetType": "Soft" }`)
- **Trigger Message:** `POST /api/charge-points/:id/control/trigger-message` (`{ "requestedMessage": "Heartbeat" }`)
- **Clear Cache:** `POST /api/charge-points/:id/control/clear-cache`

---

## Section 3: Socket-Enabled Tabs & Real-Time Event Protocols

### 3.1. Targeted Socket Room Protocol (`useSocketRoom.js`)
When mounting any tab for a charge point (`cp.id`), the hook automatically emits room events:

1. **On Mount (Client Emits):**
   ```javascript
   socket.emit('join:room', `chargepoint:${cpId}`);
   ```
2. **Server Execution (`socket.js`):**
   ```javascript
   socket.on('join:room', (roomName) => {
     socket.join(roomName); // Server adds client socket to room 'chargepoint:<cpId>'
   });
   ```
3. **On Unmount / Tab Switch (Client Emits):**
   ```javascript
   socket.emit('leave:room', `chargepoint:${cpId}`);
   ```
4. **Server Room Emission (`safeIoEmit`):**
   ```javascript
   io.to(`chargepoint:${cpId}`).emit(eventName, payloadData);
   ```

---

### 3.2. Socket-Enabled Tabs & Expected Event Formats

#### 1. Connectors Tab (`useChargePointConnectors.js`)
Subscribes to room `chargepoint:<cpId>` and listens to 3 existing socket events:

- **`chargePointUpdated`**:
  - **Event Name:** `"chargePointUpdated"`
  - **Payload Format:**
    ```json
    {
      "id": "cp_101",
      "connectors": [
        { "connectorId": 1, "status": "Available" },
        { "connectorId": 2, "status": "Faulted" }
      ]
    }
    ```
  - **Frontend Handling:** Invokes `onUpdate(updatedCp)` and updates local `connectorStatusMap` state map.
- **`session:created`**:
  - **Payload Format:** `{ "id": "sess_100", "connectorId": 1, "status": "In Progress" }`
  - **Frontend Handling:** Sets `connectorStatusMap[connId] = 'Charging'`.
- **`session:stopped`**:
  - **Payload Format:** `{ "id": "sess_100", "connectorId": 1, "status": "Completed" }`
  - **Frontend Handling:** Sets `connectorStatusMap[connId] = 'Available'`.

---

#### 2. Charge Transactions Tab (`useChargePointTransactions.js`)
Subscribes to room `chargepoint:<cpId>` and listens to 3 events:

- **`session:created`**:
  - **Payload Format:**
    ```json
    {
      "id": "session_9915",
      "sessionId": "SESS-74195",
      "chargePointId": "cp_101",
      "connectorId": 1,
      "driverName": "Amit Kumar",
      "status": "In Progress",
      "energyDeliveredKwh": 0.5,
      "powerKw": 22.0,
      "amount": 7.50
    }
    ```
  - **Action:** Prepends newly created session to top of state array (`setSessions(prev => [session, ...prev])`).
- **`session:updated`**:
  - **Payload Format:** `{ "id": "session_9915", "energyDeliveredKwh": 4.2, "powerKw": 22.0, "amount": 63.00 }`
  - **Action:** Live updates active session row metrics.
- **`session:stopped`**:
  - **Payload Format:** `{ "id": "session_9915", "status": "Completed", "endTime": "2026-08-26T15:40:00.000Z" }`
  - **Action:** Marks session status as `Completed`.

---

#### 3. Stats Tab (`useChargePointStats.js`)
Subscribes to room `chargepoint:<cpId>` and listens to 4 events:

- **Events:** `session:created`, `session:updated`, `session:stopped`, `chargePointUpdated`
- **Action:** Triggers `fetchStats()`, refetching `GET /api/charge-points/:id/stats?timeRange=...` to update graphs and telemetry totals live.

---

## Section 4: Step-by-Step UI Execution & Navigation Workflows

### 4.1. List & Search Flow (`ChargePointsList.jsx`)
1. User opens `/charge-points`.
2. Component calls `GET /api/charge-points?page=1&limit=10`.
3. Datatable renders charge points with status badges and connector counts.

---

### 4.2. Detail Tab Navigation Flow (`ViewChargePoint.jsx`)
1. User clicks a Charge Point row.
2. Navigates to `/charge-points/:id?tab=stats`.
3. Frontend joins room `chargepoint:<cpId>`.
4. User switches tabs -> URL updates `?tab=connectors`, `?tab=transactions`, `?tab=tariffs`, etc., without full page reload.

---

### 4.3. Connector Form Navigation & Submission Flow (`AddNewConnector.jsx` & `ConnectorForm.jsx`)
1. User clicks **"Add Connector"** button on `/charge-points/:id?tab=connectors`.
2. Navigates to `/charge-points/:id/connectors/new`.
3. User fills Connector ID, Type (CCS2, Type 2, etc.), Power Rating (kW), Max Current (A), Max Voltage (V), and Format.
4. On Form Submit (`handleSubmit`):
   - Calls `POST /api/charge-points/:id/connectors`.
   - Toast fires: `"Connector #2 added successfully!"`.
   - Navigates back to `/charge-points/:id?tab=connectors`.
5. On Clicking **"Back to Connectors"** header button:
   - Navigates directly back to `/charge-points/:id?tab=connectors`.

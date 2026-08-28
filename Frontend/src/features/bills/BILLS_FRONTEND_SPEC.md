# Bills Module - Frontend Integration Spec

This document details what the frontend **requests**, what it **listens to**, the expected data payloads, and how local state is updated.

---

## 1. Requests Made by Frontend (API Endpoints)

### 1.1. Fetch Bills List

- **Method & Endpoint:** `GET /api/bills`
- **Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | Current page (default: `1`) | `1` |
| `limit` | `number` | No | Items per page (default: `10`) | `10` |
| `search` | `string` | No | Search query for Bill #, Driver Name/Email, Station, or Fleet | `"Rahul"` |
| `timeRange` | `string` | No | Date range filter (`"All"`, `"Today"`, `"This Week"`, `"This Month"`) | `"This Month"` |
| `filters` | `string` | No | JSON string of selected filters | `{"billStatus":["Paid"]}` |

#### Frontend API Request Example
```javascript
GET /api/bills?page=1&limit=10&search=Rahul&timeRange=This+Month&filters={"billStatus":["Paid"]}
```

#### Expected Response Payload (`200 OK`)
```json
{
  "data": [
    {
      "id": "bill_74190",
      "billNumber": "BILL-74190",
      "billStatus": "Unpaid",
      "chargeTransactionStatus": "Completed",
      "chargeTransaction": "TX-74190",
      "energyDelivered": "12.45 kWh",
      "appliedDiscount": "10% Welcome Discount",
      "amount": 186.75,
      "currency": "INR",
      "fleet": "Delhi Fleet Logistics",
      "method": "User Wallet",
      "customerDriver": {
        "id": "user_101",
        "name": "Rahul Sharma",
        "email": "rahul@evre.in"
      },
      "chargePoint": "CP-DLF-01-AC",
      "chargePointId": "cp-28",
      "chargingStation": "DLF Cybercity Fast Hub",
      "chargingStationId": "station-1",
      "appliedTariff": {
        "id": "tariff-1",
        "name": "Standard AC Commercial Tariff",
        "type": "Default",
        "costingType": "Charging Only",
        "baseRate": 15.00,
        "gstPercentage": 18.00
      },
      "createdAt": "2026-08-26T14:30:00.000Z",
      "generatedOn": "Aug 26, 2026 02:30 pm"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 1.2. Fetch Single Bill Detail

- **Method & Endpoint:** `GET /api/bills/:id`
- **Path Parameter:** `id` (Bill ID or Bill Number)

#### Frontend API Request Example
```javascript
GET /api/bills/bill_74190
```

#### Expected Response Payload (`200 OK`)
```json
{
  "id": "bill_74190",
  "billNumber": "BILL-74190",
  "billStatus": "Paid",
  "chargeTransactionStatus": "Completed",
  "chargeTransaction": "TX-74190",
  "energyDelivered": "24.50 kWh",
  "appliedDiscount": "₹50 Promotional Code",
  "amount": 367.50,
  "currency": "INR",
  "fleet": "EVRE Express Fleet",
  "method": "Fleet Wallet",
  "customerDriver": {
    "id": "usr_202",
    "name": "Ankit Verma",
    "email": "ankit@evre.in"
  },
  "chargePoint": "Charge Point Station 28 AC",
  "chargePointId": "cp-28",
  "chargingStation": "DLF Cybercity Fast Hub",
  "chargingStationId": "station-1",
  "appliedTariff": {
    "id": "tariff-standard-ac",
    "name": "Standard AC Tariff",
    "type": "Default",
    "costingType": "Charging Only",
    "baseRate": 15.00,
    "gstPercentage": 18.00
  },
  "createdAt": "2026-08-26T12:00:00.000Z",
  "generatedOn": "Aug 26, 2026 12:00 pm"
}
```

---

### 1.3. Export Bills CSV

- **Method & Endpoint:** `GET /api/bills/export`
- **Query Parameters:** `search`, `filters`
- **Frontend Action:** Triggers browser download of CSV file stream (`bills_export_YYYY-MM-DD.csv`).

---

## 2. Events Listened to by Frontend (WebSocket)

### Event: `session:completed`

- **Event Name:** `"session:completed"`

#### Expected Incoming Socket Payload:
```json
{
  "sessionId": "session_9921",
  "billId": "bill_74191",
  "amount": 142.50,
  "status": "Completed"
}
```

#### Frontend Handling Flow:
1. Listens for `"session:completed"`.
2. Extracts `payload.billId`.
3. Dispatches `getBillById(payload.billId)`.
4. Inserts newly fetched bill to top of local state array (`setBills(prev => [newBill, ...prev])`).

---

## 3. Frontend Data Flow & State Lifecycle

```
[Page Load / Search / Filter Change]
                │
                ▼
    [GET /api/bills?...]
                │
                ▼
      [Updates bills State]

────────────────────────────────────

[Click Bill Row]
        │
        ▼
[GET /api/bills/:id]
        │
        ▼
[Renders ViewBill Page]

────────────────────────────────────

[Socket Event: session:completed]
                │
                ▼
     [GET /api/bills/:billId]
                │
                ▼
 [Prepends New Record to Table State]
```

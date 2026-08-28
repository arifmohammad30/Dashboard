# Discounts Module - Frontend Integration Spec

This document details what the frontend **requests**, what endpoints it **calls**, the exact expected request and response data payloads (including pagination & filters), and how local state and UI components handle discount workflows.

---

## 1. Requests Made by Frontend (API Endpoints & Data Payloads)

### 1.1. Fetch Paginated Discounts List

- **Method & Endpoint:** `GET /api/discounts`
- **Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | Target page number (default: `1`) | `1` |
| `limit` | `number` | No | Number of items per page (default: `10`) | `10` |
| `search` | `string` | No | Search query for discount Name or Status | `"Summer"` |
| `filters` | `string` | No | JSON string of selected filters (e.g. `status`, `type`) | `{"status":["Active"]}` |

#### Frontend API Request Example
```javascript
GET /api/discounts?page=1&limit=10&search=Summer&filters={"status":["Active"]}
```

#### Expected Response Payload (`200 OK`)
```json
{
  "data": [
    {
      "id": "cm7xa910k0001abc",
      "name": "Summer Promotional Offer",
      "type": "Percentage Discounts",
      "status": "Active",
      "conditionType": "OR",
      "appVariants": "All",
      "userAccess": "Selected",
      "fleetsAccess": "All",
      "chargingStationsAccess": "All",
      "chargePointsAccess": "All",
      "selectedUsers": [
        { "id": "usr_101", "name": "Rahul Sharma", "subtitle": "rahul@evre.in" }
      ],
      "selectedFleets": [],
      "selectedStations": [],
      "selectedChargePoints": [],
      "createdAt": "2026-08-26T14:00:00.000Z",
      "updatedAt": "2026-08-26T14:00:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 1.2. Fetch Single Discount Details (Edit Mode)

- **Method & Endpoint:** `GET /api/discounts/:id`
- **Path Parameter:** `id` (Discount ID)

#### Frontend API Request Example
```javascript
GET /api/discounts/cm7xa910k0001abc
```

#### Expected Response Payload (`200 OK`)
```json
{
  "id": "cm7xa910k0001abc",
  "name": "Summer Promotional Offer",
  "type": "Percentage Discounts",
  "status": "Active",
  "conditionType": "OR",
  "appVariants": "All",
  "userAccess": "Selected",
  "fleetsAccess": "Selected",
  "chargingStationsAccess": "All",
  "chargePointsAccess": "All",
  "selectedUsers": [
    { "id": "usr_101", "name": "Rahul Sharma", "subtitle": "rahul@evre.in" }
  ],
  "selectedFleets": [
    { "id": "fleet_202", "name": "Delhi Logistics Fleet", "subtitle": "CODE: DL-FLEET" }
  ],
  "selectedStations": [],
  "selectedChargePoints": [],
  "createdAt": "2026-08-26T14:00:00.000Z",
  "updatedAt": "2026-08-26T14:00:00.000Z"
}
```

---

### 1.3. Create New Discount Offer

- **Method & Endpoint:** `POST /api/discounts`
- **Header:** `Content-Type: application/json`

#### Request Payload Body (`POST`)
```json
{
  "name": "Monsoon Fleet Discount",
  "type": "Percentage Discounts",
  "status": "Active",
  "conditionType": "AND",
  "appVariants": "All",
  "userAccess": "All",
  "fleetsAccess": "Selected",
  "chargingStationsAccess": "Selected",
  "chargePointsAccess": "All",
  "selectedUsers": [],
  "selectedFleets": [
    { "id": "fleet_501", "name": "EVRE Express Fleet", "subtitle": "CODE: EVRE-EXP" }
  ],
  "selectedStations": [
    { "id": "station_10", "name": "DLF Cybercity Fast Hub", "subtitle": "Gurugram" }
  ],
  "selectedChargePoints": []
}
```

#### Expected Response Payload (`201 Created`)
```json
{
  "id": "cm7xa990p0002xyz",
  "name": "Monsoon Fleet Discount",
  "type": "Percentage Discounts",
  "status": "Active",
  "conditionType": "AND",
  "appVariants": "All",
  "userAccess": "All",
  "fleetsAccess": "Selected",
  "chargingStationsAccess": "Selected",
  "chargePointsAccess": "All",
  "selectedUsers": [],
  "selectedFleets": [
    { "id": "fleet_501", "name": "EVRE Express Fleet", "subtitle": "CODE: EVRE-EXP" }
  ],
  "selectedStations": [
    { "id": "station_10", "name": "DLF Cybercity Fast Hub", "subtitle": "Gurugram" }
  ],
  "selectedChargePoints": [],
  "createdAt": "2026-08-26T15:00:00.000Z",
  "updatedAt": "2026-08-26T15:00:00.000Z"
}
```

---

### 1.4. Update Existing Discount Offer

- **Method & Endpoint:** `PUT /api/discounts/:id`
- **Path Parameter:** `id` (Discount ID)
- **Header:** `Content-Type: application/json`

#### Request Payload Body (`PUT`)
```json
{
  "name": "Monsoon Fleet Discount Updated",
  "type": "Percentage Discounts",
  "status": "Inactive",
  "conditionType": "OR",
  "appVariants": "All",
  "userAccess": "All",
  "fleetsAccess": "All",
  "chargingStationsAccess": "All",
  "chargePointsAccess": "All",
  "selectedUsers": [],
  "selectedFleets": [],
  "selectedStations": [],
  "selectedChargePoints": []
}
```

#### Expected Response Payload (`200 OK`)
```json
{
  "id": "cm7xa990p0002xyz",
  "name": "Monsoon Fleet Discount Updated",
  "type": "Percentage Discounts",
  "status": "Inactive",
  "conditionType": "OR",
  "appVariants": "All",
  "userAccess": "All",
  "fleetsAccess": "All",
  "chargingStationsAccess": "All",
  "chargePointsAccess": "All",
  "selectedUsers": [],
  "selectedFleets": [],
  "selectedStations": [],
  "selectedChargePoints": [],
  "createdAt": "2026-08-26T15:00:00.000Z",
  "updatedAt": "2026-08-26T15:20:00.000Z"
}
```

---

### 1.5. Delete Discount Offer

- **Method & Endpoint:** `DELETE /api/discounts/:id`
- **Path Parameter:** `id` (Discount ID)

#### Expected Response Payload (`200 OK`)
```json
{
  "message": "Discount deleted successfully",
  "id": "cm7xa990p0002xyz"
}
```

---

### 1.6. Search Access Control Entities (Autocomplete)

- **Method & Endpoint:** `GET /api/discounts/search-access/:category`
- **Path Parameters:** `category` (`users`, `fleets`, `chargingStations`, `chargePoints`)
- **Query Parameters:**

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `query` | `string` | No | Search string entered in autocomplete box | `"rahul"` |

#### Request URL Example
```javascript
GET /api/discounts/search-access/users?query=rahul
```

#### Expected Response Payload (`200 OK`)
```json
[
  {
    "id": "usr_101",
    "name": "Rahul Sharma",
    "subtitle": "rahul@evre.in"
  },
  {
    "id": "usr_108",
    "name": "Rahul Verma",
    "subtitle": "rahul.v@gmail.com"
  }
]
```

---

## 2. Frontend Data Flows & Component Workflows

### 2.1. Discounts List Page Workflow (`DiscountsList.jsx`)

```
[User Navigates to /discounts / Changes Page / Changes Filter]
                             │
                             ▼
        [GET /api/discounts?page=1&limit=10&search=...&filters=...]
                             │
                             ▼
         [Sets discounts State & Pagination Totals]
                             │
                             ▼
         [Paginated Slices Rendered in Shared Datatable]
```

---

### 2.2. Access Entity Autocomplete Workflow (`AccessEntitySearchBox.jsx`)

```
[User Selects 'Selected Users' Mode]
             │
             ▼
[AccessEntitySearchBox Mounts]
             │
             ▼
[User Types Query in Combobox Input]
             │
             ▼
[GET /api/discounts/search-access/users?query=...]
             │
             ▼
[Renders Autocomplete Dropdown List]
             │
             ▼
[User Clicks Item or Hits Enter -> Item Added to selectedItems Array]
```

---

### 2.3. Discount Creation & Update Workflow (`AddNewDiscount.jsx`)

```
[User Fills Name, Selects Type, Status & Access Options]
                           │
                           ▼
             [Submits Form (onSubmit)]
                           │
                           ▼
     [Is Edit Mode ? PUT /api/discounts/:id : POST /api/discounts]
                           │
                           ▼
              [Success Toast Fired]
                           │
                           ▼
            [Navigates to /discounts]
```

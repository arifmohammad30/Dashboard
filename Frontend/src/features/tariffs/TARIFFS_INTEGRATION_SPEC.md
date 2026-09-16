# Tariffs Feature: End-to-End Typed Integration Specification

This document defines the strict architectural workflow, entity data types, field constraints, REST API contracts, pricing configuration JSON schemas, real-time validation rules, and component lifecycles for the **Tariffs** feature (`/tariffs`, `/tariffs/new`, `/tariffs/edit/:id`, `/tariffs/view/:id`).

---

## 1. Architecture & Overview

The **Tariffs** module is the central billing and rate calculation engine of the EV charging management system. It defines how energy delivered, session duration, battery state-of-charge (SoC), idle parking overstay, and statutory taxes (GST) are priced and billed to EV drivers.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    Tariffs Architecture Overview                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                   │
                ┌──────────────────────────────────┴──────────────────────────────────┐
                ▼                                                                     ▼
    [ Tariffs Catalog / List ]                                            [ Tariff Builder / Editor ]
    GET /api/tariffs (Paginated)                                          GET  /api/tariffs/:id
    GET /api/tariffs/filters (Dynamic filters)                            POST /api/tariffs (Create)
    GET /api/tariffs/export (CSV Stream)                                  PUT  /api/tariffs/:id (Update)
    DELETE /api/tariffs/:id                                               DELETE /api/tariffs/:id
                │                                                                     │
                ▼                                                                     ▼
    ┌─────────────────────────────────────────┐                           ┌─────────────────────────────────────────┐
    │  `TariffsList.jsx` (Container Page)     │                           │  `AddNewTariff.jsx` (Container Page)    │
    ├─────────────────────────────────────────┤                           ├─────────────────────────────────────────┤
    │ • Header, SearchBar & Filter Popover    │                           │ • `TariffBasicInfoSection.jsx`          │
    │ • Table with 8 Typed Columns            │                           │ • `NormalPricingSection.jsx`            │
    │ • Quick View Detail Modal               │                           │ • `SpecialPeriodSection.jsx` (Peak)     │
    │ • Delete Confirmation Modal             │                           │ • `SpecialPeriodSection.jsx` (Off-Peak) │
    │ • Pagination & Backend CSV Export       │                           │ • `GstParkingSection.jsx`               │
    └─────────────────────────────────────────┘                           │ • `DailyPreviewTimeline.jsx`            │
                                                                          └─────────────────────────────────────────┘
```

---

## 2. Entity & Data Model Specifications

### 2.1 Prisma Database Model (`Tariff`)

| Column | Type | Nullable | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String (UUID)` | **No** | `uuid()` | Primary Key unique identifier. |
| `name` | `String` | **No** | — | Unique descriptive name (e.g., `Standard Commercial Tariff`). |
| `code` | `String` | **No** | Unique | Human-readable tariff code (e.g., `TAR-A1B2`). |
| `type` | `String` | **No** | `'Default'` | Tariff mode: `'Default' \| 'ToD' \| 'Special' \| 'Tiered'`. |
| `status` | `String` | **No** | `'Active'` | Operational status: `'Active' \| 'Draft' \| 'Inactive'`. |
| `baseRate` | `Float` | **No** | `15.0` | Baseline energy charging price in ₹ / kWh. |
| `gstPercentage` | `Float` | **No** | `18.0` | Statutory GST rate (0.0 to 100.0). |
| `description` | `String` | Yes | `''` | Optional descriptive context or billing notes. |
| `pricingConfig` | `String (JSON)`| Yes | `null` | Stringified JSON object holding complete complex pricing structure. |
| `createdAt` | `DateTime` | **No** | `now()` | ISO-8601 UTC creation timestamp. |
| `updatedAt` | `DateTime` | **No** | `updatedAt`| ISO-8601 UTC last update timestamp. |

#### Foreign Relations:
* `chargePoints`: `ChargePoint[]` — Collection of charge points assigned to this tariff plan.
* `liveSessions`: `LiveSession[]` — Live charging sessions billed under this tariff.

---

### 2.2 `PricingConfig` JSON Data Structure

The `pricingConfig` JSON column holds the complete multi-tier, time-of-day, and surcharge configuration:

```json
{
  "gstPercentage": "number (float: 0.0 - 100.0)",
  "normalPricing": {
    "energyPrice": "number (float >= 0.0)",
    "timePrice": "number (float >= 0.0)",
    "socRanges": [
      {
        "id": "string (UUID, optional)",
        "from": "number (integer: 0 - 100)",
        "to": "number (integer: 0 - 100)",
        "price": "number (float >= 0.0)"
      }
    ]
  },
  "peakPeriods": [
    {
      "id": "string (UUID, optional)",
      "title": "string (e.g., 'Peak Period 1')",
      "startTime": "string ('HH:mm', 24-hour format)",
      "endTime": "string ('HH:mm', 24-hour format)",
      "days": ["string ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')"],
      "energyPrice": "number (float >= 0.0)",
      "timePrice": "number (float >= 0.0)",
      "socRanges": [
        {
          "id": "string (UUID, optional)",
          "from": "number (integer: 0 - 100)",
          "to": "number (integer: 0 - 100)",
          "price": "number (float >= 0.0)"
        }
      ]
    }
  ],
  "offPeakPeriods": [
    {
      "id": "string (UUID, optional)",
      "title": "string (e.g., 'Off-Peak Period 1')",
      "startTime": "string ('HH:mm', 24-hour format)",
      "endTime": "string ('HH:mm', 24-hour format)",
      "days": ["string ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')"],
      "energyPrice": "number (float >= 0.0)",
      "timePrice": "number (float >= 0.0)",
      "socRanges": [
        {
          "id": "string (UUID, optional)",
          "from": "number (integer: 0 - 100)",
          "to": "number (integer: 0 - 100)",
          "price": "number (float >= 0.0)"
        }
      ]
    }
  ],
  "parkingConfig": {
    "enabled": "boolean",
    "feePerMin": "number (float >= 0.0)",
    "gracePeriodMins": "number (integer >= 0)",
    "startCondition": "string ('After Charging Completes' | 'Immediately on Plug-in')"
  }
}
```

---

## 3. REST API Specifications

### 3.1 Fetch Filter Options (`GET /api/tariffs/filters`)
* **Method**: `GET`
* **Route**: `/api/tariffs/filters`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "types": ["string ('Default' | 'ToD' | 'Special' | 'Tiered')"],
  "gstPercentages": ["string (e.g., '18 %', '5 %')"]
}
```

---

### 3.2 Paginated Tariffs List (`GET /api/tariffs`)
* **Method**: `GET`
* **Route**: `/api/tariffs`
* **Query Parameters**:
  - `page`: `number (integer >= 1, default: 1)`
  - `limit`: `number (integer >= 1, default: 10)`
  - `search`: `string (optional)` — Case-insensitive token search matching `id`, `name`, `code`, `type`, or `description`.
  - `filters`: `string (JSON stringified object)` — e.g., `{"type": ["ToD"], "gstPercentage": ["18 %"]}`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "data": [
    {
      "id": "string (UUID)",
      "name": "string",
      "code": "string",
      "type": "string ('Default' | 'ToD' | 'Special' | 'Tiered')",
      "status": "string ('Active' | 'Draft' | 'Inactive')",
      "costingType": "string ('Charging + Parking' | 'Charging Only')",
      "applicableTo": "string ('ToD Schedule' | 'All Chargers')",
      "chargingFee": "string (e.g., '₹15.00 / kWh')",
      "parkingFee": "string (e.g., '₹50.00 / min' | 'NA')",
      "idleFee": "string (e.g., '₹0.00 / min')",
      "soc": "string (e.g., '2 Tiers' | 'NA')",
      "startsAt": "string ('NA')",
      "endsAt": "string ('NA')",
      "weight": "number (integer: 1)",
      "createdOn": "string (Formatted date e.g., 'Sep 16, 2026')",
      "gstPercentage": "string (e.g., '18%')",
      "baseRate": "number (float)",
      "pricingConfig": "PricingConfig | null"
    }
  ],
  "total": "number (integer >= 0)",
  "page": "number (integer >= 1)",
  "limit": "number (integer >= 1)",
  "totalPages": "number (integer >= 1)"
}
```

---

### 3.3 Get Single Tariff Details (`GET /api/tariffs/:id`)
* **Method**: `GET`
* **Route**: `/api/tariffs/:id`
* **URL Params**: `id` — Tariff UUID, code, or name.
* **Response Status**: `200 OK` (or `404 Not Found`)
* **Response Body Typed Schema**:
```json
{
  "id": "string (UUID)",
  "name": "string",
  "code": "string",
  "type": "string ('Default' | 'ToD')",
  "status": "string ('Active' | 'Draft' | 'Inactive')",
  "baseRate": "number (float)",
  "gstPercentage": "string (e.g., '18%')",
  "rawGstPercentage": "number (float: 18.0)",
  "description": "string",
  "pricingConfig": "PricingConfig | null",
  "createdOn": "string (Formatted date)",
  "chargePointsCount": "number (integer >= 0)",
  "chargePoints": [
    {
      "id": "string (UUID)",
      "name": "string",
      "code": "string",
      "status": "string"
    }
  ]
}
```

---

### 3.4 Create Tariff (`POST /api/tariffs`)
* **Method**: `POST`
* **Route**: `/api/tariffs`
* **Request Body Typed Schema**:
```json
{
  "name": "string (Required)",
  "code": "string (Optional, auto-generated if omitted)",
  "type": "string ('Default' | 'ToD', Optional)",
  "status": "string ('Active' | 'Draft' | 'Inactive', Optional, default: 'Active')",
  "baseRate": "number (float, Optional, derived from normalPricing.energyPrice)",
  "gstPercentage": "number (float: 0.0 - 100.0, Optional, default: 18.0)",
  "description": "string (Optional)",
  "pricingConfig": "PricingConfig (Object or JSON String)"
}
```
* **Response Status**: `201 Created`
* **Error Status**: `400 Bad Request` (on schema/ToD overlap validation failure).

---

### 3.5 Update Tariff (`PUT /api/tariffs/:id`)
* **Method**: `PUT`
* **Route**: `/api/tariffs/:id`
* **URL Params**: `id` — Target Tariff UUID.
* **Request Body**: Same payload structure as `POST /api/tariffs`.
* **Response Status**: `200 OK`
* **Error Status**: `400 Bad Request` | `404 Not Found` | `500 Server Error`.

---

### 3.6 Delete Tariff (`DELETE /api/tariffs/:id`)
* **Method**: `DELETE`
* **Route**: `/api/tariffs/:id`
* **Response Status**: `200 OK`
* **Response Body Typed Schema**:
```json
{
  "success": true,
  "message": "Tariff deleted"
}
```

---

### 3.7 Export Tariffs CSV (`GET /api/tariffs/export`)
* **Method**: `GET`
* **Route**: `/api/tariffs/export`
* **Query Parameters**: `search`, `filters` (matching active list parameters).
* **Response Header**: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="tariffs_export_YYYY-MM-DD.csv"`
* **Columns Exported**:
  1. `Tariff ID`
  2. `Tariff Name`
  3. `Code`
  4. `Type`
  5. `Base Rate (₹/kWh)`
  6. `GST Percentage`
  7. `Description`
  8. `Created Date`

---

## 4. Comprehensive Phase Breakdown

The Tariff management lifecycle is structured into 6 distinct, cohesive phases:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Tariff Operational Phases                                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Phase 1: Catalog & List View          ───► Paginated table, search tokens, multi-select filters       │
│  Phase 2: Add New Tariff Form          ───► 6-section configuration builder with visual timeline       │
│  Phase 3: Edit Tariff Plan             ───► In-place editing, pre-fill, real-time validation checks    │
│  Phase 4: Read-Only View Mode & Modal  ───► Quick inspection popover & full view page                  │
│  Phase 5: Secure Deletion Lifecycle    ───► Dependency verification & confirmation modal               │
│  Phase 6: Backend CSV Export Engine    ───► Filter-aware sanitized CSV streaming pipeline              │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Catalog & List View (`TariffsList.jsx`)

1. **Toolbar & Controls**:
   - **Page Title**: "All Tariffs" with record counter badge (`totalRecords`).
   - **Search Input**: Real-time debounce tokenized search (`name`, `code`, `type`, `description`).
   - **Filter Dropdown Drawer**:
     - Tariff Types (`Default`, `ToD`, `Special`, `Tiered`).
     - GST Percentages (`18 %`, `5 %`, `0 %`).
     - Active filter badge count and "Clear All" action.
   - **Export Button**: Initiates CSV stream with active filters.
   - **Add New Tariff CTA**: Navigates to `/tariffs/new` (guarded by `PERMISSIONS.TARIFF_CREATE`).

2. **Table Schema (8 Columns)**:
   - **Col 1 (Actions)**: Edit icon button (`/tariffs/edit/:id`) and Delete icon button.
   - **Col 2 (Tariff)**: Primary Name display with monospace Code subtext. Click opens Quick View modal.
   - **Col 3 (Type)**: Pill badge (`ToD` in purple, `Default` in slate).
   - **Col 4 (Status)**: Emerald/Stone dot indicator (`Active`, `Draft`, `Inactive`).
   - **Col 5 (Energy Rate)**: Formatted `₹XX.XX / kWh` text.
   - **Col 6 (GST)**: Monospace percentage badge (e.g., `18%`).
   - **Col 7 (Pricing Summary)**: Pill tag indicating active structure (`Flat`, `ToD`, `SOC`, or `ToD + SOC`).
   - **Col 8 (Updated)**: Human-readable timestamp (e.g., `Sep 16, 2026`).

3. **Lifecycle States**:
   - **Loading State**: Animated SVG spinner.
   - **Empty State**: Search icon with "No tariffs found." text.
   - **Error State**: Error alert with server details and "Retry" action.
   - **Pagination**: Page size, total page count, previous/next page navigation.

---

### Phase 2: Add New Tariff Builder (`AddNewTariff.jsx` + `useTariffForm.js`)

Route: `/tariffs/new`

The tariff builder organizes complex pricing rules into 6 distinct, structured sections:

#### Section 1: Basic Information (`TariffBasicInfoSection.jsx`)
* **Tariff Name**: String input (Required, e.g., "Public High-Power Fast Charging").
* **Status**: Dropdown selector (`Active`, `Draft`, `Inactive`).

#### Section 2: Normal / Baseline Pricing (`NormalPricingSection.jsx`)
* **Energy Price**: Baseline fallback rate in ₹ / kWh (Required, `>= 0.0`).
* **Time Price**: Baseline idle/connection fee in ₹ / min (`>= 0.0`).
* **SOC Pricing Table**: Stepped pricing based on battery % (e.g., 0–80% @ ₹15/kWh, 80–100% @ ₹18/kWh).

#### Section 3: Peak Pricing Periods (`SpecialPeriodSection.jsx`)
* Used for high-demand surge pricing windows.
* Supports multiple peak intervals.
* Each period configures:
  - Period Title (e.g., "Evening Peak")
  - Start Time & End Time using `TimePicker12h` (`06:00 PM` &rarr; `18:00`)
  - Applicable Days (interactive toggle buttons for `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`)
  - Energy Price (₹ / kWh) & Time Price (₹ / min)
  - Period-specific SoC step curve table

#### Section 4: Off-Peak Pricing Periods (`SpecialPeriodSection.jsx`)
* Used for discounted night or weekend pricing windows.
* Supports overnight intervals crossing midnight (e.g., `22:00` to `06:00`).
* Configures identical fields to Peak periods (Title, Start/End time, Day selector, Energy/Time rates, SoC steps).

#### Section 5: GST & Parking Surcharges (`GstParkingSection.jsx`)
* **GST Rate (%)**: Tax percentage input (`0.0` to `100.0`, default: `18%`).
* **Enable Parking Fee**: Checkbox toggle.
  - When enabled:
    - **Parking Fee**: Surcharge in ₹ / hr.
    - **Grace Period**: Buffer minutes before fee applies (e.g., `15` mins).
    - **Trigger Condition**: `'After Charging Completes'` vs. `'Immediately on Plug-in'`.

#### Section 6: 24-Hour Daily Preview Timeline (`DailyPreviewTimeline.jsx`)
* Real-time computed 24-hour horizontal schedule bar (00:00 to 24:00).
* Color coding:
  - 🟢 **Emerald**: Normal (Fallback) rate
  - 🔴 **Rose**: Peak Period rate
  - 🔵 **Sky**: Off-Peak Period rate
* Visual hour tick markers (`00:00`, `06:00`, `12:00`, `18:00`, `24:00`).
* Fallback hierarchy: Peak / Off-Peak &rarr; Normal Baseline fallback.

---

### Phase 3: Edit Tariff Plan (`/tariffs/edit/:id`)

1. Fetches active tariff configuration via `GET /api/tariffs/:id`.
2. Pre-populates all form states (Name, Status, GST, Normal rates, Peak periods, Off-Peak periods, SoC ranges, Parking parameters).
3. Preserves server-side sub-item UUIDs for existing SoC tiers and periods.
4. Performs continuous live validation against time overlaps and SoC gaps.
5. Emits `PUT /api/tariffs/:id` with updated `pricingConfig` payload.

---

### Phase 4: Read-Only View Mode & Quick Inspection Modal

1. **Quick View Popover (`TariffsList.jsx`)**:
   - Triggered by clicking any tariff name row in the list table.
   - Displays modal summary:
     - Tariff Code & Name
     - Status badge
     - Base Energy Fee (Normal)
     - GST Percentage
     - Count of Peak & Off-Peak periods
     - Parking Fee configuration
     - Created date
   - Direct CTA: "Edit Tariff" (navigates to `/tariffs/edit/:id`).

2. **Full Page View Mode (`/tariffs/view/:id`)**:
   - Mounts `AddNewTariff` with `isViewMode={true}`.
   - All input fields, selects, checkboxes, and buttons are set to `disabled`.
   - "Add Period" and "Add SoC Range" actions are hidden.
   - Submit buttons are replaced by a "Back to Tariffs" navigation link.

---

### Phase 5: Deletion Lifecycle (`DeleteModal.jsx`)

1. User clicks the trash icon on a table row.
2. Opens `DeleteModal` with item name confirmation.
3. User confirms deletion:
   - Sets `isDeleting = true`.
   - Invokes `DELETE /api/tariffs/:id`.
   - Displays success notification via `ToastContext`.
   - Reloads table data in-place without page refresh.

---

### Phase 6: Backend CSV Export Pipeline (`exportTariffs`)

1. User triggers the "Export" button on the toolbar.
2. Frontend serializes active query parameters (`search`, `filters`) into `GET /api/tariffs/export`.
3. Backend controller sets streaming headers:
   - `Content-Type: text/csv; charset=utf-8`
   - `Content-Disposition: attachment; filename="tariffs_export_YYYY-MM-DD.csv"`
4. Backend applies CSV sanitization against formula injection attacks.
5. Streams all filtered records and triggers automatic browser download via `downloadUtils`.

---

## 5. Validation Engine & Business Rules

Both frontend (`tariffValidator.js`) and backend (`tariffs.validator.js`) enforce symmetrical, strict validation rules:

### 5.1 Time-of-Day (ToD) Interval Rules

1. **Format Constraint**: Times must be valid 24-hour strings (`HH:mm`, `00:00` to `23:59`).
2. **24-Hour Special Case**: `00:00` to `00:00` explicitly indicates a 24-hour full-day period.
3. **Zero Duration Prevention**: For any other time, `startTime === endTime` (e.g. `08:00` to `08:00`) is rejected.
4. **Day Coverage**: Every period must have at least one assigned day (`days.length >= 1`).
5. **Overnight Midnight Splitting**:
   - When `startTime > endTime` (e.g., `22:00` to `06:00` on `Mon`), the validator emits two distinct intervals:
     1. Evening segment: `Mon`, `22:00` &rarr; `24:00` (1320 &rarr; 1440 mins).
     2. Morning segment: `Tue`, `00:00` &rarr; `06:00` (0 &rarr; 360 mins).
6. **Inter-Period Overlap Check**:
   - For every day of the week (`Mon`–`Sun`), all active Peak and Off-Peak intervals are cross-evaluated.
   - If `max(A.start, B.start) < min(A.end, B.end)`, an overlap error is raised with exact period names, day, and time bounds.

### 5.2 State-of-Charge (SoC) Tier Rules

1. **Initial Boundary**: The first SoC tier in any table must start at `0%` (`from === 0`).
2. **Percentage Limits**: All boundaries must satisfy `0 <= from <= 100` and `0 <= to <= 100`.
3. **Ascending Order**: Lower bound cannot exceed upper bound (`from <= to`).
4. **Contiguity & Overlaps**:
   - No overlaps: `next.from > curr.to`.
   - Continuous coverage: `next.from === curr.to + 1` or consecutive.
5. **Non-Negativity**: Price rate in ₹ / kWh must be `>= 0.0`.

### 5.3 General Field Constraints

| Field | Rule | Error Message |
| :--- | :--- | :--- |
| `name` | Non-empty string after trim | `"Tariff Name is required"` |
| `normalEnergyPrice` | Non-empty, numeric float `>= 0.0` | `"Valid Normal Energy Price rate is required (>= 0)"` |
| `gstPercentage` | Numeric float between `0.0` and `100.0` | `"GST Percentage must be between 0% and 100%"` |
| `parkingFee` | Optional numeric float `>= 0.0` | `"Parking fee per minute cannot be negative"` |
| `gracePeriodMins` | Optional integer `>= 0` | `"Parking grace period cannot be negative"` |

---

## 6. Permissions & Role-Based Access Control (RBAC)

The Tariffs module integrates with the centralized permission system via `PermissionGuard`:

| Permission Constant | Description | Protected UI Elements |
| :--- | :--- | :--- |
| `PERMISSIONS.TARIFF_VIEW` | Access tariff catalog and detail views | `/tariffs` route, View Modal |
| `PERMISSIONS.TARIFF_CREATE` | Create new tariff plans | "Add New Tariff" button, `/tariffs/new` route |
| `PERMISSIONS.TARIFF_UPDATE` | Modify existing tariff plans | "Edit" table action, Save button in editor |
| `PERMISSIONS.TARIFF_DELETE` | Delete tariff records | "Delete" table action, `DeleteModal` |
| `PERMISSIONS.TARIFF_EXPORT` | Download CSV reports | "Export" toolbar button |

---

## 7. Automated Test Plan & Quality Assurance

### 7.1 Backend Unit & Integration Tests
* **Test Suite**: `backend/modules/tariffs/tariffs.validator.test.js`
* **Test Cases**:
  1. Valid flat normal pricing passes.
  2. SoC tiers starting > 0% rejected.
  3. Overlapping SoC tiers (e.g. 0-50% and 40-100%) rejected.
  4. Valid Peak & Off-Peak non-overlapping periods pass.
  5. Same-day Peak/Off-Peak time overlaps rejected with formatted error message.
  6. Midnight-crossing overnight period overlap detection across day boundaries.
  7. Negative GST, energy rate, or parking fees rejected.

### 7.2 Frontend Interaction Verifications
* **Timeline Rendering**: Verify `DailyPreviewTimeline` renders proportional color-coded blocks for Normal, Peak, and Off-Peak.
* **12-Hour Time Picker**: Verify AM/PM selection converts seamlessly to standard 24-hour format.
* **Dynamic Filters**: Verify selecting tariff type or GST percentage filters rows accurately and updates counter.
* **CSV Export**: Verify downloaded file contains all filtered tariff rows with sanitized headers.

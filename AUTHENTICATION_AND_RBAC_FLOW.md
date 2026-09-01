# Authentication & RBAC Flow Specification

This document provides a clear, step-by-step technical overview of the application's **Email + OTP authentication flow**—from frontend form submission to backend verification—along with the 3 pre-configured development accounts, API response payload formats, and a simplified explanation of the Role-Based Access Control (RBAC) architecture.

---

## 1. Login Form Submission Flow

```text
[User Inputs Email]
        │
        ▼
1. Frontend Format Validation (Login.jsx)
   • Validates email format (RFC standard)
        │ (Validation Passes)
        ▼
2. AuthContext.sendOtp(email)
        │
        ▼
3. HTTP Client (apiClient.js)
   • Dispatches POST request to backend API
        │
   ┌────┴────────────────────────────────────────┐
   │ HTTP Request Specification:                 │
   │ • Endpoint: POST /api/auth/send-otp         │
   │ • Headers: Content-Type: application/json   │
   │ • Body: { "email": "admin@example.com" }    │
   └────┬────────────────────────────────────────┘
        │ (200 OK Response)
        ▼
4. Frontend Advances to Step 2 (Enter 6-Digit OTP)
        │
[User Inputs 6-Digit OTP]
        │
        ▼
5. AuthContext.verifyOtp(email, otp)
        │
        ▼
6. HTTP Client (apiClient.js)
   • Dispatches POST request to backend API
        │
   ┌────┴──────────────────────────────────────────────────────┐
   │ HTTP Request Specification:                               │
   │ • Endpoint: POST /api/auth/verify-otp                     │
   │ • Headers: Content-Type: application/json                 │
   │ • Body: { "email": "admin@example.com", "otp": "123456" } │
   └────┬──────────────────────────────────────────────────────┘
        │ (200 OK Response with Token & User Permissions)
        ▼
7. Session Storage & Redirection
   • Stores token & user in localStorage
   • Updates global AuthContext state
   • Redirects user to authorized Dashboard (/)
```

---

## 2. Backend Verification & Sample Development Accounts

### Backend Verification Mechanism
The backend authentication router (`backend/modules/auth/auth.routes.js`) routes requests to `auth.controller.js` and `auth.service.js`.

For development and testing purposes, an isolated configuration file (`backend/modules/auth/auth.config.js`) defines 3 pre-configured sample credentials:

| Account | Role | Email | Dev OTP | Granted Permissions & Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `ADMIN` | `admin@example.com` | `123456` | **Full Read/Write & Control Access (All 32 permissions)** across all 8 modules (Charging Stations, Charge Points, Tariffs, Fleets, Live Sessions, Bills, Discounts, Payments, Teams, Analytics). |
| **OPERATOR** | `OPERATOR` | `operator@example.com` | `123456` | **Operational Subset (13 permissions)**: View all stations and charge points, Remote Start/Stop charging, reset hardware, view telemetry logs, view tariffs, fleets, bills, discounts, payments. Administrative management pages (Teams, User creation) are hidden. |
| **USER** | `USER` | `user@example.com` | `123456` | **Standard Charge Point & Session Access (6 permissions)**: `charge_point:view`, `charge_point:create`, `charge_point:update`, `charge_point:delete`, `charge_point:control`, `session:view`. All other sidebar modules and management actions are restricted. |

> **Future Backend Handoff Note**: When implementing production database authentication, the backend developer will replace `auth.service.js` with database queries (Prisma/PostgreSQL/MongoDB) and an email dispatch service (SMTP/Resend), while keeping the **exact same request & response body payload formats**.

---

## 3. Response Body Formats

### A. Step 1: Send OTP (`POST /api/auth/send-otp`)

#### 1. Successful Dispatch (`200 OK`)
When the entered email exists in the system:
```json
{
  "message": "OTP sent successfully"
}
```

#### 2. User Not Found (`404 Not Found`)
When the entered email is not registered:
```json
{
  "message": "User not found"
}
```

#### 3. Invalid Request (`400 Bad Request`)
When the email field is missing or empty:
```json
{
  "message": "Invalid request"
}
```

---

### B. Step 2: Verify OTP (`POST /api/auth/verify-otp`)

#### 1. Successful Authentication Response (`200 OK`)
When the OTP code matches, the backend returns HTTP status 200 with the authorization token and complete user payload:
```json
{
  "token": "temp_token_usr_admin_001_1788189397540",
  "user": {
    "id": "usr_admin_001",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "permissions": [
      "analytics:view",
      "reports:view",
      "alerts:view",
      "station:view",
      "station:create",
      "station:update",
      "station:delete",
      "station:export",
      "charge_point:view",
      "charge_point:create",
      "charge_point:update",
      "charge_point:delete",
      "charge_point:control",
      "charge_point:connectors_manage",
      "charge_point:export",
      "tariff:view",
      "tariff:create",
      "tariff:update",
      "tariff:delete",
      "tariff:export",
      "fleet:view",
      "fleet:create",
      "fleet:update",
      "fleet:delete",
      "session:view",
      "session:stop",
      "session_logs:view",
      "session:export",
      "bill:view",
      "bill:export",
      "discount:view",
      "discount:create",
      "discount:update",
      "discount:delete",
      "discount:export",
      "payment:view",
      "payment_logs:view",
      "team:view",
      "team:create",
      "team:update",
      "team:delete",
      "group:view",
      "permission_rule:view"
    ]
  }
}
```

#### 2. Invalid OTP Code (`401 Unauthorized`)
When the entered OTP code is incorrect:
```json
{
  "message": "Invalid OTP"
}
```

#### 3. Expired OTP (`401 Unauthorized`)
When the OTP has expired (after 10 minutes):
```json
{
  "message": "OTP expired"
}
```

---

## 4. How Role-Based Access Control (RBAC) Works in the Frontend

The frontend uses a **pure permission-based, role-agnostic authorization model**:

```text
               User Object in AuthContext
             { role: '...', permissions: [...] }
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  [Route Guards]     [Sidebar Navigation]  [Action Buttons]
PermissionRoute.jsx      Sidebar.jsx       PermissionGuard.jsx
  Blocks entire      Hides menu items      Hides Add / Edit /
   page access       without permission     Delete / Control
```

1. **Storage & Rehydration**: Upon login, `localStorage` saves both `token` and `user`. On page refresh, `AuthContext` restores the session instantly.
2. **API Requests**: `apiClient.js` automatically attaches `Authorization: Bearer <token>` to all subsequent backend requests.
3. **Route Protection (`PermissionRoute.jsx`)**: If a user attempts to navigate to a page they lack permission for, they are safely redirected or shown a `403 Unauthorized` screen.
4. **Dynamic Sidebar (`Sidebar.jsx`)**: Automatically filters out navigation items and sections for which the user has no permissions.
5. **UI Element Protection (`PermissionGuard.jsx`)**: Action buttons (such as "Add Tariff", "Edit Station", "Delete Fleet", "Stop Session") are wrapped in `<PermissionGuard permission="...">` and render only for authorized accounts.

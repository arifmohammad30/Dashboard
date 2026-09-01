# Email + OTP Authentication API Contract

This document specifies the exact API contract for Email + OTP authentication between the openEV.io Frontend and Backend.

---

## 1. Authentication Flow Overview

```text
+----------------+                       +---------------+                       +---------------+
|    Frontend    |                       |    Backend    |                       | Email Service |
+----------------+                       +---------------+                       +---------------+
       |                                         |                                       |
       |  1. POST /api/auth/send-otp             |                                       |
       |     { email }                           |                                       |
       |---------------------------------------->|                                       |
       |                                         |  2. Generate OTP & Send Email         |
       |                                         |-------------------------------------->|
       |  3. 200 OK                              |                                       |
       |     { message: "OTP sent successfully" }|                                       |
       |<----------------------------------------|                                       |
       |                                         |                                       |
       |  4. User enters OTP                     |                                       |
       |     POST /api/auth/verify-otp           |                                       |
       |     { email, otp }                      |                                       |
       |---------------------------------------->|                                       |
       |                                         |  5. Validate OTP & Lookup User        |
       |  6. 200 OK                              |                                       |
       |     { token, user: { ... } }            |                                       |
       |<----------------------------------------|                                       |
       |                                         |                                       |
       |  7. Store token in localStorage         |                                       |
       |     Attach to Bearer Authorization      |                                       |
```

---

## 2. API Endpoints

### 2.1 Send OTP

Initiates the authentication process by dispatching a One-Time Password (OTP) to the user's registered email address.

* **Endpoint**: `POST /api/auth/send-otp`
* **Content-Type**: `application/json`
* **Authentication**: None (Public)

#### Request Payload
```json
{
  "email": "admin@example.com"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | User's registered email address (valid email format, trimmed, case-insensitive). |

#### Success Response (`200 OK`)
```json
{
  "message": "OTP sent successfully"
}
```

#### Error Responses

* **`400 Bad Request`** — Missing or malformed email address
  ```json
  {
    "message": "Invalid request"
  }
  ```

* **`404 Not Found`** — Email address is not registered in the system
  ```json
  {
    "message": "User not found"
  }
  ```

* **`429 Too Many Requests`** — Rate limit exceeded for OTP dispatch
  ```json
  {
    "message": "Too many requests. Please try again later."
  }
  ```

* **`500 Internal Server Error`** — Server or email dispatch failure
  ```json
  {
    "message": "Failed to send OTP. Please try again."
  }
  ```

---

### 2.2 Verify OTP & Authenticate

Validates the OTP entered by the user. If valid and not expired, creates an authenticated session and returns the access token along with the user's profile and RBAC permissions.

* **Endpoint**: `POST /api/auth/verify-otp`
* **Content-Type**: `application/json`
* **Authentication**: None (Public)

#### Request Payload
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | User's registered email address. |
| `otp` | `string` | **Yes** | 6-digit numeric OTP code entered by the user. |

#### Success Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

#### User Object Structure

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier of the user (e.g. `usr_admin_001` or UUID). |
| `name` | `string` | Full display name of the user. |
| `email` | `string` | Registered email address. |
| `role` | `string` | Role name identifier (e.g. `ADMIN`, `OPERATOR`, `USER`). |
| `permissions` | `string[]` | Array of granular permission tokens assigned to the user. |

#### Error Responses

* **`400 Bad Request`** — Missing email or OTP in request
  ```json
  {
    "message": "Invalid request"
  }
  ```

* **`401 Unauthorized`** — Incorrect OTP code
  ```json
  {
    "message": "Invalid OTP"
  }
  ```

* **`401 Unauthorized`** — OTP has expired
  ```json
  {
    "message": "OTP expired"
  }
  ```

* **`404 Not Found`** — User account does not exist
  ```json
  {
    "message": "User not found"
  }
  ```

---

## 3. Resend OTP Behavior

To resend an OTP, the Frontend invokes the same `POST /api/auth/send-otp` endpoint:

```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "operator@example.com"
}
```

* The backend invalidates any previously issued unverified OTP for that email and dispatches a new code.
* The frontend enforces a client-side cooldown timer (e.g., 30–60 seconds) between requests to prevent accidental double-clicks.

---

## 4. Predefined Permission Tokens Reference

The `permissions` array returned in the `user` object must use the following standard permission tokens:

### Analytics & Dashboard
* `analytics:view`
* `reports:view`
* `alerts:view`

### Charging Stations
* `station:view`
* `station:create`
* `station:update`
* `station:delete`
* `station:export`

### Charge Points
* `charge_point:view`
* `charge_point:create`
* `charge_point:update`
* `charge_point:delete`
* `charge_point:control`
* `charge_point:connectors_manage`
* `charge_point:export`

### Tariffs
* `tariff:view`
* `tariff:create`
* `tariff:update`
* `tariff:delete`
* `tariff:export`

### Fleets
* `fleet:view`
* `fleet:create`
* `fleet:update`
* `fleet:delete`

### Operations & Sessions
* `session:view`
* `session:stop`
* `session_logs:view`
* `session:export`

### Bills & Invoicing
* `bill:view`
* `bill:export`

### Discounts
* `discount:view`
* `discount:create`
* `discount:update`
* `discount:delete`
* `discount:export`

### Payments
* `payment:view`
* `payment_logs:view`

### Teams & Access Control
* `team:view`
* `team:create`
* `team:update`
* `team:delete`
* `group:view`
* `permission_rule:view`

---

## 5. Development Test Users Reference

For development and staging environments, the following accounts are pre-configured:

| Email | Role | Expected Permissions |
| :--- | :--- | :--- |
| `admin@example.com` | `ADMIN` | All 32 permission tokens. Full administrative access to all modules and controls. |
| `operator@example.com` | `OPERATOR` | 13 operational tokens (`analytics:view`, `reports:view`, `station:view`, `charge_point:view`, `charge_point:control`, `tariff:view`, `fleet:view`, `session:view`, `session:stop`, `session_logs:view`, `bill:view`, `discount:view`, `payment:view`). |
| `user@example.com` | `USER` | 6 charge point / session management tokens (`charge_point:view`, `session:view`, `charge_point:create`, `charge_point:update`, `charge_point:delete`, `charge_point:control`). |

* In the local development backend, the default OTP code is configured as `123456`.

---

## 6. Frontend Token Consumption & Authorization

1. Upon receiving the `200 OK` response from `POST /api/auth/verify-otp`, the frontend stores:
   * `token` in `localStorage.getItem('token')`
   * `user` in `localStorage.getItem('user')`
2. Subsequent API requests attach the token in the HTTP Authorization header:
   ```http
   Authorization: Bearer <token>
   ```
3. If the backend returns `401 Unauthorized` on any subsequent protected API endpoint, the frontend clears `localStorage` and redirects the user to `/login`.

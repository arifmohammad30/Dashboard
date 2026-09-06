# AGENT.md

## EV Charging Management Dashboard — Project-Wide Agent Instructions

This document is the **primary development instruction for the coding agent working on this project**.

The agent MUST follow these rules for every task unless the user explicitly overrides them.

---

# 1. PROJECT PURPOSE

This project is an EV Charging Management Dashboard.

The application manages and displays information related to:

* Authentication and RBAC
* Charging Stations
* Charge Points
* Live Charging Sessions
* Session History and Logs
* Tariffs and Pricing
* Bills and Invoices
* Fleets
* Discounts
* Team Members
* Payment Gateways
* Future/placeholder modules such as Groups, Permission Rules, Analytics, Reports and Alerts

The frontend is primarily responsible for the user interface, client-side validation, API consumption, navigation, and real-time UI updates.

The backend is responsible for persistence, business logic, authorization, validation, OCPP processing, database operations, and server-side filtering/pagination.

The frontend and backend communicate through explicitly defined API contracts.

---

# 2. MOST IMPORTANT RULE

## DO NOT GO OUT OF SCOPE.

Before making any change, determine:

1. Which feature/module is being changed.
2. Which exact files are involved.
3. Whether the requested behavior already exists.
4. Whether the change is required for the current task.
5. Whether the change would affect an already-frozen API contract or another module.

Do NOT make unrelated improvements.

Do NOT redesign architecture unless explicitly requested.

Do NOT refactor unrelated files.

Do NOT introduce new libraries unless explicitly required.

Do NOT change working behavior merely because another implementation looks cleaner.

Prefer the smallest correct change that satisfies the requirement.

---

# 3. SOURCE OF TRUTH

When implementing or auditing a feature, use this priority order:

1. Explicit user requirement
2. Frozen API contract for that feature
3. Existing frontend source code
4. Existing backend implementation
5. Existing database/schema
6. General engineering assumptions

Never reverse this order.

If the frontend and backend disagree, do NOT silently modify one side to make the other work.

Identify the mismatch and report it.

If the API contract is frozen, treat it as authoritative unless the user explicitly asks to change it.

---

# 4. NO INVENTED DATA

The application must NOT contain fake business data.

Do NOT add:

* fake stations
* fake charge points
* fake transactions
* fake users
* fake tariffs
* fake bills
* fake statistics
* fake payment data
* fake API responses
* hardcoded business records

Do NOT add fallback business values such as:

```text
"DLF Park Place DC"
"Sample Station"
"Test Charger"
"₹500"
"10 Sessions"
```

unless the user explicitly requests mock/demo data.

If the backend does not provide required business data:

* do not invent it;
* do not silently substitute another record;
* do not search by an unrelated field;
* do not fabricate a fallback.

Instead, handle the actual absence according to the existing UI/error behavior or report the backend contract gap.

---

# 5. IDs ARE AUTHORITATIVE

When an entity is accessed through a route such as:

```text
/charging-stations/:id
/charge-points/:id
/live-sessions/:id
```

the URL ID is authoritative.

Do NOT add fallback logic such as:

```text
If ID lookup fails → search by name/code → use first result
```

Do NOT resolve an entity using an unrelated name merely because the ID request failed.

Entity relationships must use actual IDs.

Examples:

```text
chargingStationId
chargePointId
connectorId
sessionId
tariffId
billId
```

must remain authoritative identifiers.

---

# 6. API CONTRACT RULES

Every feature must be audited against the actual frontend before its API contract is created or modified.

For each endpoint establish:

* HTTP method
* URL
* path parameters
* query parameters
* request body
* response structure
* response fields actually consumed by frontend
* pagination behavior
* search behavior
* filtering behavior
* error requirements if already established
* Socket.IO events if applicable

Do NOT invent response fields simply because they seem useful.

Do NOT add aliases such as:

```text
totalRevenue / revenueGenerated
manufacturer / oem
id / cpId
```

just to make the frontend more tolerant.

Prefer one canonical contract.

If a field is not required by the frontend and has not been explicitly requested, do not make it mandatory in the contract.

---

# 7. API CONTRACT FREEZE

Once a feature contract has been verified and declared FROZEN:

## DO NOT MODIFY IT CASUALLY.

Before changing a frozen contract:

1. Identify why the change is necessary.
2. Verify the frontend requirement.
3. Determine whether the change is actually a bug.
4. Explain the impact.
5. Only then modify it with explicit approval.

A backend implementation must adapt to a frozen frontend contract rather than forcing undocumented changes into the frontend.

---

# 8. FRONTEND-BACKEND RESPONSIBILITY

Do not move responsibilities between frontend and backend without a reason.

### Frontend

The frontend may handle:

* form state
* UI state
* client-side validation
* formatting
* navigation
* pagination controls
* debounced search input
* rendering
* Socket.IO subscriptions
* displaying backend data

### Backend

The backend should handle:

* persistence
* database operations
* business rules
* authorization
* server-side validation
* server-side pagination
* server-side searching
* server-side filtering
* OCPP processing
* transaction processing
* billing/business calculations
* real-time event generation

Do not implement database/business logic in the frontend merely to compensate for a missing backend endpoint.

---

# 9. PAGINATION

For production data, pagination must remain server-side unless explicitly stated otherwise.

The frontend should request:

```text
?page=1&limit=10
```

or the exact parameters defined by the feature contract.

Do NOT:

1. fetch the entire dataset;
2. filter it in memory;
3. slice it in JavaScript;
4. pretend that is server-side pagination.

The backend should return the requested page and pagination metadata according to the frozen contract.

---

# 10. SEARCH AND FILTERING

Search/filter behavior must follow the feature contract.

Do NOT silently convert:

```text
server-side search
```

into:

```text
client-side filtering
```

Do NOT fetch unrelated large datasets merely to implement a UI filter.

If a required filter cannot be supported by the current backend contract, report the gap instead of creating an artificial frontend workaround.

---

# 11. FORMS

For every create/edit form:

1. Identify the actual fields.
2. Preserve existing validation.
3. Preserve existing transformations unless the requirement changes.
4. Send the exact API contract payload.
5. Do not drop fields merely because the temporary backend does not currently store them.

If the frontend requires a field and the backend does not support it, that is a backend contract/implementation gap.

Do NOT remove the frontend field to hide the backend limitation unless explicitly instructed.

---

# 12. CREATE AND EDIT

When the contract specifies a complete create/edit representation:

```text
POST → complete create payload
PUT  → complete editable representation
```

Do not silently convert the operation into partial updates.

Do not remove fields because they are currently unchanged.

GET detail responses must provide every field required to reliably populate the Edit form when the contract says so.

---

# 13. REAL-TIME / SOCKET.IO

Socket.IO must be treated as a real-time synchronization mechanism, not a replacement for REST APIs.

Typical architecture:

```text
Backend
   ↓
Database / OCPP
   ↓
Socket.IO event
   ↓
React listener
   ↓
UI update
```

Use the exact room and event names defined by the feature contract.

Examples currently used by the project include:

```text
chargepoint:<id>
chargingstation:<id>

session:created
session:updated
session:stopped
session:completed
session:log

chargePointUpdated
```

Do not invent new event names when an existing event already represents the required behavior.

When receiving an event for an entity-specific subscription, verify the event belongs to the currently viewed entity before updating that entity's UI.

Example:

```text
current chargePointId
        ==
event chargePointId
```

If they do not match, ignore the event.

---

# 14. REST + SOCKET RESPONSIBILITY

REST should normally establish the initial state.

Socket.IO should keep the UI synchronized afterward.

Preferred pattern:

```text
Initial page load
      ↓
GET API
      ↓
Render current state
      ↓
Join Socket room
      ↓
Receive real-time events
      ↓
Update/refetch affected UI
```

Do not remove the initial REST request merely because Socket.IO exists.

Do not depend on Socket.IO alone for initial page state.

---

# 15. NAVIGATION

Navigation between entities must use canonical IDs.

Examples:

```text
/stations/view/:id
/charge-points/view/:id
/session-logs/:id
```

Do not navigate using names when IDs are available.

Do not add name-based entity resolution as a fallback.

If a required ID is missing, handle the missing ID explicitly instead of guessing.

---

# 16. ERROR HANDLING

Do not hide real backend errors by replacing them with fake successful data.

Bad:

```text
API fails
↓
show fake/default station
```

Correct:

```text
API fails
↓
show appropriate error/empty state
```

Error handling should preserve the distinction between:

* loading
* successful empty result
* failed request
* missing entity
* invalid input
* unauthorized/forbidden state

Do not invent backend error codes or response structures unless they are already defined.

---

# 17. FALLBACKS

Fallbacks are allowed only when they are safe and do not change business meaning.

Acceptable examples:

```text
optional UI formatting
empty array for rendering when appropriate
safe display of optional text
```

Dangerous fallbacks that are NOT allowed:

```text
ID → name search
missing API data → fake business data
missing tariff → arbitrary tariff
missing station → first station
missing user → fake user
failed request → successful-looking data
```

Never use a fallback that can cause the UI to display another real entity.

---

# 18. PLACEHOLDER MODULES

Some modules may currently be placeholders.

Examples:

* Groups
* Permission Rules
* Analytics
* Reports
* Alerts

Do not invent complete backend architectures for these modules unless the user explicitly starts work on them.

Do not add unnecessary APIs simply because a placeholder page exists.

---

# 19. DATABASE CHANGES

Do not modify the database schema merely to make the frontend code easier.

Database changes must be justified by:

* the API contract,
* actual business requirements,
* or explicit backend implementation work.

If the frontend requires fields that the current temporary schema does not contain, identify them as backend implementation gaps.

Do not remove frontend requirements to fit a temporary schema.

---

# 20. CODE QUALITY

Prefer:

* existing project architecture
* existing hooks
* existing services
* existing components
* existing utilities
* existing patterns

Avoid:

* duplicate hooks
* duplicate API services
* duplicate components
* unnecessary abstractions
* premature generic frameworks
* large refactors for small requirements

Before creating a new utility/component/hook, search the project for an existing equivalent.

---

# 21. DO NOT DELETE CODE WITHOUT CHECKING REFERENCES

Before deleting:

* hooks
* services
* components
* utilities
* routes
* configuration files

search the project for references.

Only delete dead code after confirming it is genuinely unused.

---

# 22. DO NOT CHANGE WORKING CODE WITHOUT A REASON

A task such as:

> "Fix the Charge Point transaction contract"

does NOT authorize:

* redesigning the entire transactions page;
* changing unrelated styling;
* changing authentication;
* rewriting the API client;
* refactoring all hooks;
* changing database models;
* modifying other modules.

Make the smallest targeted change.

---

# 23. TESTING REQUIREMENT

After meaningful code changes:

1. Run the relevant build.
2. Run relevant tests if available.
3. Check for compile errors.
4. Check imports.
5. Check routes.
6. Check API calls.
7. Check affected UI flow.
8. Check that unrelated modules were not changed.

For integration changes, verify:

```text
UI
 ↓
API request
 ↓
Backend endpoint
 ↓
Response
 ↓
UI rendering
```

For real-time features verify:

```text
Event emitted
 ↓
Correct room
 ↓
Correct listener
 ↓
Correct entity
 ↓
Correct UI update
```

Never report a feature as working merely because the frontend compiles.

---

# 24. BUILD ≠ FUNCTIONAL VERIFICATION

A successful build proves compilation.

It does NOT prove:

* API correctness
* backend correctness
* database correctness
* Socket.IO correctness
* pagination correctness
* authorization correctness
* business logic correctness

Always distinguish:

```text
BUILD PASS
```

from:

```text
FUNCTIONAL TEST PASS
```

and:

```text
END-TO-END PASS
```

---

# 25. WHEN SOMETHING IS UNCLEAR

Do not guess.

Classify the uncertainty:

### Confirmed from frontend

Directly verified in source code.

### Defined by frozen contract

Explicitly established by the API contract.

### Backend decision

Not determined by the frontend and therefore belongs to backend design.

### Unknown

Insufficient evidence.

When something is unknown, say so.

Do not convert an assumption into a requirement.

---

# 26. AUDIT WORKFLOW

When asked to audit a feature, use this workflow:

### Step 1 — Discover

Identify:

* routes
* components
* hooks
* services
* API calls
* forms
* tables
* formatters
* Socket.IO listeners

### Step 2 — Trace

Follow:

```text
UI
 ↓
Hook/component
 ↓
Service
 ↓
API
 ↓
Response
 ↓
State
 ↓
UI
```

### Step 3 — Extract

Record only what the frontend actually requires.

### Step 4 — Identify gaps

Separate:

```text
Frontend requirement
Backend capability
Contract requirement
Implementation gap
```

### Step 5 — Fix only requested frontend issues

Do not redesign unrelated code.

### Step 6 — Verify

Run build/tests and inspect affected flows.

### Step 7 — Contract

Produce the API contract only from verified evidence.

### Step 8 — Freeze

Once verified, stop modifying it unless explicitly requested.

---

# 27. FEATURE-BY-FEATURE WORK

Work on one feature at a time.

Recommended order:

1. Authentication & RBAC
2. Charging Stations
3. Charge Points
4. Live Sessions & History
5. Tariffs
6. Bills & Invoices
7. Fleets
8. Discounts
9. Team Members
10. Payment Gateways
11. Remaining modules

Do not simultaneously redesign multiple modules.

Complete:

```text
Audit
→ Fix
→ Verify
→ Contract
→ Freeze
```

before moving to the next major feature.

---

# 28. CURRENT FROZEN FEATURES

## Charging Stations

The Charging Stations API contract has been audited against the frontend and is considered frozen.

Do not modify its contract without explicit instruction.

The contract includes:

* list
* filters
* detail
* create
* update
* delete
* export
* charge point relationship
* transaction relationship
* station Socket.IO room/events

The frontend uses the station URL ID as authoritative.

The complete station form contains the established editable fields defined by the frozen contract.

---

## Charge Points

The Charge Points API contract has been audited against the frontend and is considered frozen.

Do not modify its contract without explicit instruction.

The contract includes:

* list
* filters
* detail
* create
* update
* delete
* export
* statistics
* connectors
* transactions
* tariffs
* configurations
* remote controls
* Socket.IO room/events

The Charge Points contract has been source-of-truth verified.

The transaction response has been verified against:

* `useChargePointTransactions.js`
* `ChargePointTransactionsTab.jsx`
* `SessionHistoryTable.jsx`
* `SessionHistoryRow.jsx`

The create/edit representation contains exactly the verified 13 frontend fields.

GET detail returns all fields required for Edit prefill.

Do not re-audit or redesign these contracts unless explicitly requested.

---

# 29. CURRENT DEVELOPMENT PRIORITY

The next feature to audit is:

## Live Sessions & History

Start from the actual frontend source code.

Do NOT assume that the Charge Points contract automatically defines the Live Sessions contract.

Verify Live Sessions independently.

Pay particular attention to:

* list endpoints
* history endpoints
* session detail
* session logs
* search
* filters
* pagination
* session statuses
* station relationships
* charge point relationships
* connector relationships
* driver/user fields
* energy
* cost
* bill information
* stop-session behavior
* Socket.IO events
* room subscriptions
* real-time updates
* completed-session behavior

Only after source verification should the Live Sessions contract be frozen.

---

# 30. RESPONSE FORMAT FOR AGENT WORK

When completing a task, report:

## Scope

What files/features were changed.

## Changes

What was actually modified.

## Verification

What was tested.

## Contract Impact

Whether an API contract changed.

## Risks / Gaps

Any unresolved backend/frontend mismatch.

## Result

One of:

```text
PASS
PARTIAL
BLOCKED
```

Do not claim PASS when only compilation was checked.

---

# 31. FINAL PRINCIPLE

The goal is NOT to make the code look clever.

The goal is:

```text
Correct
Predictable
Traceable
Production-oriented
Contract-driven
Testable
Maintainable
```

When in doubt:

**STOP → INSPECT → VERIFY → CHANGE ONLY WHAT IS REQUIRED → TEST → REPORT.**

Never guess.

Never invent business data.

Never silently change contracts.

Never modify unrelated features.

Never optimize beyond the current requirement.

The user's explicit instruction always takes precedence over this document.

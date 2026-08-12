I need you to work with me on a staged implementation of the live charging-session data flow in this existing EV charging application.

IMPORTANT:
Do NOT start coding immediately.
First inspect the existing repository and understand the current architecture, Prisma schema, Live Sessions implementation, ChargePoint/ChargingStation/Connector relationships, Socket.IO setup, and existing mock/simulation code.

After inspection, give me an implementation plan for ONLY the first phase described below.
Do not make code changes until I approve the plan.

==================================================
PROJECT CONTEXT
==================================================

This is an EV charging management application.

Backend:
- Node.js
- Express
- Prisma
- SQLite
- REST APIs
- Socket.IO

Frontend:
- React
- React Router
- Socket.IO client
- Feature-driven architecture

Existing domain entities include:
- ChargingStation
- ChargePoint
- Connector
- Tariff
- LiveSession
- Session history

The backend already handles normal REST request/response communication with the React UI.

Socket.IO is also already initialized in server.js and currently has basic connection/disconnection logging.

The application already has Live Sessions and Charge Point Stats UI.

==================================================
THE EVENTUAL ARCHITECTURE
==================================================

Eventually the system should work like this:

Real Charger
    ↓
OCPP 1.6J WebSocket
    ↓
Backend OCPP processing
    ↓
Clean application-level JSON
    ↓
Socket.IO
    ↓
React UI

However, we are NOT implementing the complete OCPP system right now.

We are deliberately building this in stages.

==================================================
WHY WE NEED A CLEAN DATA CONTRACT
==================================================

A real charger communicates using OCPP 1.6J messages.

Those messages are not supposed to become the frontend's data model.

The backend will eventually receive OCPP messages, process them, map them to our database entities, extract the useful information, and produce a clean application-level object.

The frontend should consume that clean object.

Therefore:

Frontend MUST NOT depend on raw OCPP message structures.

The future OCPP layer and the current mock generator must both produce the same application-level data contract.

This gives us:

Mock generator
    ↓
Clean application JSON
    ↓
Frontend

and later:

OCPP processor
    ↓
Clean application JSON
    ↓
Frontend

The React application should not need to know whether the data came from a mock generator or a real charger.

==================================================
CURRENT PHASE — ONLY THIS PHASE
==================================================

We first need to define and implement the clean application-level Live Session data contract and a mock generator that produces it.

Do NOT implement the OCPP WebSocket flow yet.

Do NOT implement Socket.IO events yet.

Do NOT redesign the frontend.

Do NOT replace existing REST APIs.

Do NOT make unrelated architectural changes.

==================================================
DATA CONTRACT
==================================================

Inspect the existing Prisma schema and current Live Sessions API/frontend code first.

Do NOT blindly introduce new field names if equivalent fields already exist.

We need one canonical application-level Live Session object conceptually containing:

{
    sessionId,

    chargePointId,
    chargingStationId,
    connectorId,

    chargePoint: {
        id,
        code,
        name
    },

    chargingStation: {
        id,
        name
    },

    connector: {
        id,
        type
    },

    driver: {
        id,
        name
    },

    status,

    soc,

    energyDeliveredKwh,

    powerKw,

    voltage,

    current,

    cost,

    startedAt,

    updatedAt
}

Adapt this to the existing project's actual schema and naming conventions.

The objective is consistency, not adding duplicate data structures.

==================================================
STABLE VS DYNAMIC DATA
==================================================

Stable during one charging session:

- sessionId
- chargePointId
- chargingStationId
- connectorId
- chargePoint information
- chargingStation information
- connector information
- driver information
- startedAt

Dynamic:

- status
- soc
- energyDeliveredKwh
- powerKw
- voltage
- current
- cost
- updatedAt

The generator must NOT regenerate the entire session randomly on every tick.

It must represent ONE session progressing over time.

==================================================
DATABASE RELATIONSHIPS
==================================================

This is very important.

The mock generator must use REAL existing database records.

For example:

ChargingStation
    ↓
ChargePoint belonging to that station
    ↓
Connector belonging to that ChargePoint

Do not invent random IDs.

Do not create invalid combinations such as:

station A
+
charge point belonging to station B
+
connector belonging to another charge point.

Inspect the actual Prisma relations before implementing this.

==================================================
TELEMETRY GENERATION
==================================================

The generated values must behave logically.

SoC:
- Gradually increases during charging.
- Do NOT generate completely random values.

Example:

40
41
42
43
44

Power:
- Can fluctuate slightly.

Example:

7.1
7.3
7.2
7.4
7.2

Energy:
- Must be cumulative.
- Must not randomly decrease during normal charging.
- Prefer calculating it from power and elapsed time.

Conceptually:

energy += powerKw * elapsedHours

Cost:
- Should increase as energy increases.
- If existing tariff/business logic can be reused, use it.
- Otherwise use a simple consistent calculation for the mock.
- Frontend should receive the final cost rather than calculating it itself.

Timestamp:
- updatedAt must change for every telemetry update.
- Use ISO-8601 format.

==================================================
MOCK GENERATOR
==================================================

After understanding the existing repository, create the smallest appropriate mock/simulation module.

It should:

1. Read real Station/ChargePoint/Connector data from Prisma.
2. Select a valid relationship.
3. Create one simulated charging session.
4. Maintain the session state.
5. Update telemetry periodically.
6. Produce the canonical application JSON.
7. Log consecutive updates for verification.

The exact file location should follow the existing backend architecture.

Do not create unnecessary folders or abstractions.

==================================================
IMPORTANT NON-GOALS
==================================================

Do NOT implement these yet:

1. Real OCPP charger communication.
2. OCPP WebSocket server.
3. OCPP message parsing.
4. StatusNotification processing.
5. StartTransaction processing.
6. MeterValues processing.
7. StopTransaction processing.
8. Socket.IO session:created.
9. Socket.IO session:updated.
10. Socket.IO session:stopped.
11. React real-time integration.

Those will be later phases.

==================================================
FUTURE PHASES
==================================================

The overall development sequence will eventually be:

PHASE 1
Clean application JSON contract
+
Mock telemetry generator

PHASE 2
Mock charger sends actual OCPP 1.6J JSON-array messages over WebSocket.

PHASE 3
Backend OCPP WebSocket server receives those messages.

PHASE 4
Backend processes:
- StatusNotification
- StartTransaction
- MeterValues
- StopTransaction

PHASE 5
Backend maps OCPP data to:
- ChargingStation
- ChargePoint
- Connector
- LiveSession

PHASE 6
Backend emits clean Socket.IO events:
- session:created
- session:updated
- session:stopped

PHASE 7
React Live Sessions consumes those events.

PHASE 8
ChargePoint Stats and other relevant UI components consume the same live data.

We are currently ONLY doing PHASE 1.

==================================================
ARCHITECTURAL PRINCIPLE
==================================================

The most important boundary is:

OCPP / database / backend processing
                ↓
       CLEAN APPLICATION JSON
                ↓
             Socket.IO
                ↓
             React UI

The frontend should not understand OCPP.

The mock generator and future OCPP processor must produce the same clean application-level contract.

==================================================
WHAT I WANT FROM YOU NOW
==================================================

STEP 1:
Inspect the repository.

Specifically inspect:

- Prisma schema
- ChargePoint model
- ChargingStation model
- Connector model
- LiveSession model
- existing session service
- existing Live Sessions API
- existing Live Sessions React components
- existing ChargePoint Stats components
- existing Socket.IO setup
- existing mock/simulator code, if any

STEP 2:
Tell me what the existing application already has.

STEP 3:
Identify the exact files that need to be created/modified for PHASE 1.

STEP 4:
Propose the canonical JSON contract using the project's REAL existing field names.

STEP 5:
Propose how the mock telemetry state should work.

STEP 6:
Give me a small implementation plan.

DO NOT MODIFY FILES YET.

Wait for my approval before implementation.
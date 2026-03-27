# System Architecture Document — Varaus Sauna Reservation Platform

## Overview

The Varaus platform is a three-tier web application for sauna time slot reservation, built on Firebase as the shared data and identity layer. The frontend is a React SPA that communicates with Firebase Realtime Database for real-time data and with an Express.js backend API for transactional operations. A TypeScript coordination CLI orchestrates both applications for development, build, test, and deployment workflows.

Recent architectural changes:
- **Profile deletion**: A new `POST /deleteProfile` endpoint enables users to permanently delete their profile. The backend enforces an active booking guard (HTTP 409), deletes all user data from four Firebase paths, sends a deletion confirmation email, and removes the Firebase Auth account. The frontend provides a confirmation dialog with active-booking warnings.
- **Paytrail removal**: All Paytrail payment integration has been removed from both frontend and backend. The checkout flow now supports only invoice (delayed) and cash payment methods. Pending transaction cancellation uses a generic client-side Firebase removal mechanism instead of the former Paytrail-specific backend endpoint.

This document describes the top-level system architecture, cross-cutting concerns, and integration contracts between subsystems. Detailed subsystem designs are maintained in:
- Coordination: #[[file:.kiro/specs/coordination/design.md]]
- Frontend: #[[file:.kiro/specs/varaus/design.md]]
- Backend: #[[file:.kiro/specs/varausserver/design.md]]

## System Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        FE[Varaus Frontend<br/>React 18 + Redux + Firebase Client SDK]
    end

    subgraph "External Services"
        FB_AUTH[Firebase Authentication]
        FB_DB[Firebase Realtime Database]
        MG[Mailgun Email Service]
    end

    subgraph "Server"
        BE[Varausserver Backend<br/>Express.js + Firebase Admin SDK]
    end

    subgraph "Developer Workstation"
        COORD[Coordination CLI<br/>TypeScript]
        COORD -->|spawns & monitors| FE_PROC[Frontend Process]
        COORD -->|spawns & monitors| BE_PROC[Backend Process]
    end

    FE -->|signIn / signOut / onAuthStateChanged| FB_AUTH
    FE -->|ref.on / ref.once / ref.update| FB_DB
    FE -->|POST + Firebase ID Token| BE

    BE -->|admin.auth.verifyIdToken| FB_AUTH
    BE -->|admin.database.ref.*| FB_DB
    BE -->|Mailgun API| MG

```

## Subsystem Responsibilities

| Subsystem | Technology | Responsibility |
|-----------|-----------|----------------|
| varaus (Frontend) | React 18, Redux, Firebase Client SDK, Webpack | User interface, client-side routing, real-time data display, form handling, payment flow UI (invoice/cash), admin panel, profile deletion with confirmation dialog |
| varausserver (Backend) | Express.js, Firebase Admin SDK, Mailgun | Token verification, booking/cancellation with entitlement checks, payment processing (invoice/cash), transaction management, profile deletion with active booking guard, email notifications |
| coordination (CLI) | TypeScript, Node.js child_process | Unified CLI for start/build/test/deploy/status, environment config management, process lifecycle, health monitoring (including `/deleteProfile` endpoint), unified logging |

## Integration Contracts

### Frontend → Backend API Contract

All communication from frontend to backend uses HTTP POST with JSON bodies containing a Firebase ID token.

```
POST /{endpoint}
Content-Type: application/json

{
  "current_user": "<firebase_id_token>",  // or "user" for booking endpoints
  ...endpoint-specific fields
}

Response: HTTP 200 (success) or HTTP 500 (error)
Content-Type: text/plain
```

**Endpoints by domain:**

| Domain | Endpoints | Auth Level |
|--------|-----------|------------|
| Booking | `/reserveSlot`, `/cancelSlot` | Any authenticated user |
| Checkout | `/checkout` | Any authenticated user |
| Delayed Payment | `/initializedelayedtransaction`, `/notifydelayed` | Any authenticated user |
| Admin Approval | `/approveincomplete` | Admin or instructor |
| Admin Purchase | `/cashbuy` | Admin or instructor |
| Admin Transactions | `/okTransaction`, `/removeTransaction` | Admin only |
| Notifications | `/feedback`, `/notifyRegistration` | Any authenticated user |
| Profile | `/deleteProfile` | Any authenticated user (own profile only) |
| Testing | `/test` | Any authenticated user |

### Frontend ↔ Firebase Contract

The frontend uses the Firebase Client SDK to:
- **Auth**: `signInWithEmailAndPassword`, `signInWithPopup`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged`, `sendPasswordResetEmail`, `updateEmail`, `updatePassword`
- **Database reads** (real-time listeners): `/slots/`, `/cancelledSlots/`, `/bookingsbyslot/{slotKey}`, `/shopItems/`, `/users/{uid}`, `/specialUsers/{uid}`, `/transactions/{uid}`, `/bookingsbyuser/{uid}`, `/pendingtransactions/`, `/infoItems/`, `/terms/`, `/diagnostics/`
- **Database writes**: `/users/{uid}` (own profile), `/diagnostics/` (session events)

### Backend ↔ Firebase Contract

The backend uses the Firebase Admin SDK with service account `uid: "varausserver"` to:
- **Auth**: `admin.auth().verifyIdToken(token)` on every request
- **Database reads**: `/users/{uid}`, `/transactions/{uid}`, `/shopItems/{key}`, `/specialSlots/{key}`, `/specialUsers/{uid}`, `/pendingtransactions/{key}`, `/bookingsbyslot/`, `/bookingsbyuser/`
- **Database writes**: `/bookingsbyslot/`, `/bookingsbyuser/`, `/scbookingsbyslot/`, `/scbookingsbyuser/`, `/transactions/`, `/pendingtransactions/`, `/serverError/`

### Firebase Security Rules Contract

The security rules enforce a trust boundary:

```
┌─────────────────────────────────────────────────────┐
│ Firebase Realtime Database                          │
│                                                     │
│  Public read:     /infoItems/, /terms/              │
│                                                     │
│  Auth read:       /slots/, /cancelledSlots/,        │
│                   /bookingsbyslot/, /shopItems/,    │
│                   /specialSlots/                    │
│                                                     │
│  Own-user r/w:    /users/{uid}                      │
│  Own-user read:   /bookingsbyuser/{uid},            │
│                   /scbookingsbyuser/{uid},           │
│                   /transactions/{uid},               │
│                   /specialUsers/{uid}               │
│                                                     │
│  Admin r/w:       /pendingtransactions/,            │
│                   /shopItems/, /slots/,              │
│                   /specialSlots/, /infoItems/,       │
│                   /terms/                           │
│                                                     │
│  Server-only w:   /bookingsbyslot/,                 │
│                   /bookingsbyuser/,                  │
│                   /transactions/                    │
│                                                     │
│  Auth write:      /diagnostics/                     │
│  Admin+server r:  /diagnostics/                     │
│  Server write:    /serverError/                     │
└─────────────────────────────────────────────────────┘
```

## Cross-Cutting Concerns

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant FA as Firebase Auth
    participant BE as Backend
    participant FDB as Firebase DB

    U->>FE: Login (email/password or Google)
    FE->>FA: signInWithEmailAndPassword / signInWithPopup
    FA-->>FE: User credential + ID token
    FE->>FE: onAuthStateChanged → dispatch ADD_USER

    Note over FE,BE: Subsequent API calls
    FE->>FA: getIdToken()
    FA-->>FE: Fresh ID token
    FE->>BE: POST /endpoint { user: token, ...data }
    BE->>FA: admin.auth().verifyIdToken(token)
    FA-->>BE: Decoded token { uid, sub }
    BE->>FDB: Database operations as uid
    BE-->>FE: HTTP 200/500
```

### End-to-End Booking Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant FDB as Firebase DB
    participant BE as Backend
    participant MG as Mailgun

    U->>FE: Select slot, click Book
    FE->>FE: getIdToken()
    FE->>BE: POST /reserveSlot { user: token, slotInfo, weeksForward, timezoneOffset }
    BE->>BE: verifyIdToken → uid
    BE->>FDB: Read /users/{uid}
    BE->>FDB: Read /transactions/{uid} → find valid entitlement
    BE->>FDB: Decrement unusedtimes on earliest-expiring transaction
    BE->>FDB: Write /bookingsbyslot/{slotKey}/{time}/{uid}
    BE->>FDB: Write /bookingsbyuser/{uid}/{slotKey}/{time}
    BE-->>FE: HTTP 200 "Booking done"
    BE->>MG: Send confirmation email (async)
    FE->>FE: dispatch BOOK_A_SLOT, show success
    FDB-->>FE: Real-time update on /bookingsbyslot/{slotKey}
```

### End-to-End Profile Deletion Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant FDB as Firebase DB
    participant FA as Firebase Auth
    participant MG as Mailgun

    U->>FE: Click "Delete Profile"
    FE->>FE: Show Confirmation Dialog
    U->>FE: Confirm deletion
    FE->>BE: POST /deleteProfile (Firebase ID token)
    BE->>BE: Verify token → uid
    BE->>FDB: Read /bookingsbyuser/{uid}
    BE->>BE: Check for active bookings
    alt Has active bookings
        BE-->>FE: 409 Conflict
        FE->>U: Show "cancel bookings first" message
    else No active bookings
        BE->>FDB: Delete /users/{uid}
        BE->>FDB: Delete /bookingsbyuser/{uid}
        BE->>FDB: Delete /transactions/{uid}
        BE->>FDB: Delete /specialUsers/{uid}
        BE->>MG: Send deletion confirmation email
        BE->>FA: Delete Auth account
        BE-->>FE: 200 OK
        FE->>FA: Sign out locally
        FE->>U: Redirect to home
    end
```

### Environment Configuration

```mermaid
graph LR
    subgraph "Development"
        DEV_FE[Frontend :8080] -->|localhost:3000| DEV_BE[Backend :3000]
        DEV_FE --> DEV_FB[Firebase Staging Project]
        DEV_BE --> DEV_FB
    end

    subgraph "Staging"
        STG_FE[Frontend] --> STG_BE[Backend]
        STG_FE --> STG_FB[Firebase Staging Project]
        STG_BE --> STG_FB
    end

    subgraph "Production"
        PRD_FE[Frontend] --> PRD_BE[Backend]
        PRD_FE --> PRD_FB[Firebase Production Project]
        PRD_BE --> PRD_FB
    end
```

| Environment | Frontend Firebase | Backend Firebase | Backend Port | CORS Origin |
|-------------|------------------|-----------------|-------------|-------------|
| development | varaus-a0250 (staging) | varaus-a0250 (staging) | 3000 | http://localhost:8080 |
| staging | varaus-a0250 (staging) | varaus-a0250 (staging) | configured | https://staging.varaus.example.com |
| production | hakolahdentie-2 (prod) | hakolahdentie-2 (prod) | configured | https://varaus.example.com |

### Coordination Layer Integration

The coordination CLI does not modify the frontend or backend code. It operates externally by:

1. **Configuration**: Reading environment variables and validating cross-application consistency (Firebase project match, CORS alignment, API endpoint/port alignment).
2. **Process management**: Spawning `npm run dev` / `npm run build` / `npm test` as child processes in the respective application directories, with environment variable injection.
3. **Health monitoring**: Making HTTP GET requests to running application endpoints to verify liveness.
4. **Log capture**: Reading stdout/stderr from child processes and correlating entries using UUID-based correlation IDs.

## Data Flow Summary

| Data Flow | Source | Destination | Mechanism | Auth |
|-----------|--------|-------------|-----------|------|
| Slot display | Firebase `/slots/` | Frontend timetable | Firebase `on('value')` | Authenticated user |
| Booking creation | Frontend → Backend → Firebase | `/bookingsbyslot/`, `/bookingsbyuser/` | HTTP POST → Firebase Admin write | ID token verified |
| Booking display | Firebase `/bookingsbyslot/` | Frontend slot detail | Firebase `on('value')` | Authenticated user |
| Transaction creation | Backend → Firebase | `/transactions/{uid}/` | Firebase Admin write | ID token verified |
| Transaction display | Firebase `/transactions/{uid}` | Frontend user view | Firebase `once('value')` | Own user only |
| Pending transaction | Backend → Firebase | `/pendingtransactions/` | Firebase Admin push | ID token verified |
| Pending transaction cancel | Frontend → Firebase | `/pendingtransactions/{id}` | Firebase client `remove()` | Authenticated user |
| Shop items | Firebase `/shopItems/` | Frontend shop | Firebase `once('value')` | Authenticated user |
| User profile | Frontend ↔ Firebase | `/users/{uid}` | Firebase client read/write | Own user only |
| Profile deletion | Frontend → Backend → Firebase + Auth | `/users/{uid}`, `/bookingsbyuser/{uid}`, `/transactions/{uid}`, `/specialUsers/{uid}`, Auth account | HTTP POST → Firebase Admin delete + Auth delete | ID token verified, own UID only |
| Admin data | Frontend ↔ Firebase | Various admin paths | Firebase client read/write | Admin role checked |
| Email notifications | Backend → Mailgun | User email | Mailgun API | Server-side only |
| Diagnostics | Frontend → Firebase | `/diagnostics/` | Firebase client write | Authenticated user |
| Error logging | Backend → Firebase | `/serverError/` | Firebase Admin write | Server-side only |

## Deployment Architecture

```mermaid
graph TB
    subgraph "Firebase Hosting"
        FE_STATIC[Frontend Static Files<br/>index.html, app.min.js, app.min.css]
    end

    subgraph "Node.js Server"
        BE_APP[Express.js Backend<br/>+ Static file serving]
    end

    subgraph "Firebase Services"
        FB_AUTH_SVC[Firebase Authentication]
        FB_DB_SVC[Firebase Realtime Database]
    end

    subgraph "Third-Party Services"
        MAILGUN_SVC[Mailgun Email Delivery]
    end

    FE_STATIC --> FB_AUTH_SVC
    FE_STATIC --> FB_DB_SVC
    FE_STATIC --> BE_APP

    BE_APP --> FB_AUTH_SVC
    BE_APP --> FB_DB_SVC
    BE_APP --> MAILGUN_SVC
```

The frontend builds to static files (`app.min.js`, `app.min.css`) served from the `public/` directory. The backend also serves these static files as a fallback. Firebase Hosting can be used for the frontend, while the backend runs as a standalone Node.js process.

## Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18.x |
| State management | Redux + redux-thunk | 4.x |
| Routing | React Router | 6.x |
| Frontend build | Webpack + Babel | 5.x |
| Frontend testing | Mocha + Chai + JSDOM | — |
| Backend framework | Express.js | 4.x |
| Backend build | Webpack + Babel | 5.x |
| Authentication | Firebase Authentication | Client SDK + Admin SDK |
| Database | Firebase Realtime Database | Client SDK + Admin SDK |
| Email delivery | Mailgun | mailgun-js |
| Coordination CLI | TypeScript + Node.js | — |
| Runtime | Node.js | ≥ 20.x |

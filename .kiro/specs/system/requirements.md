# System Requirements Document — Varaus Sauna Reservation Platform

## Introduction

The Varaus platform is a full-stack sauna time slot reservation system consisting of three subsystems: a React frontend (varaus), an Express.js backend API (varausserver), and a TypeScript-based coordination CLI (coordination). The platform enables users to browse weekly sauna timetables, book and cancel time slots, purchase access tokens through multiple payment methods (invoice/delayed and cash), manage their profiles including profile deletion, and view booking/transaction history. Administrators can manage users, slots, shop items, content, and transactions. All data is persisted in Firebase Realtime Database, authentication uses Firebase Authentication, and the coordination layer provides unified development, build, test, deployment, and monitoring workflows.

Note: Paytrail payment integration has been fully removed. The platform now supports only invoice (delayed) and cash payment methods.

This document captures the top-level system requirements that span across subsystems or define the platform as a whole. Detailed subsystem requirements are maintained in their respective spec directories:
- Coordination: #[[file:.kiro/specs/coordination/requirements.md]]
- Frontend: #[[file:.kiro/specs/varaus/requirements.md]]
- Backend: #[[file:.kiro/specs/varausserver/requirements.md]]

## Glossary

- **Platform**: The complete Varaus system comprising the frontend, backend, and coordination subsystems.
- **Frontend (varaus)**: React 18 SPA for user-facing reservation, shop, and admin functionality.
- **Backend (varausserver)**: Express.js API handling authenticated transactional operations, payment processing, and email notifications.
- **Coordination**: TypeScript CLI tool orchestrating both applications for development, build, test, deploy, and monitoring.
- **Firebase Realtime Database**: The shared NoSQL database used by both frontend (client SDK) and backend (Admin SDK).
- **Firebase Authentication**: The shared identity provider — frontend uses client SDK for login/registration, backend verifies ID tokens via Admin SDK.
- **Mailgun**: Email delivery service used by the backend for transactional notifications.

## Requirements

### Requirement 1: Platform Subsystem Composition

**User Story:** As a developer, I want the platform organized into three independently buildable and testable subsystems, so that each can be developed and deployed with clear boundaries.

#### Acceptance Criteria

1. THE Platform SHALL consist of three subsystems: varaus (frontend), varausserver (backend), and coordination (CLI tool).
2. EACH subsystem SHALL have its own package.json, build configuration, and test suite.
3. THE coordination subsystem SHALL be able to orchestrate the other two subsystems without requiring code changes in them.
4. THE frontend and backend SHALL communicate exclusively via HTTP POST requests with Firebase ID tokens for authentication.
5. THE frontend and backend SHALL share a common Firebase Realtime Database instance determined by the deployment environment.

### Requirement 2: Shared Firebase Data Contract

**User Story:** As a developer, I want a well-defined Firebase database schema shared between frontend and backend, so that both subsystems read and write data consistently.

#### Acceptance Criteria

1. THE Platform SHALL use the following shared Firebase paths: `/users/`, `/slots/`, `/cancelledSlots/`, `/bookingsbyslot/`, `/bookingsbyuser/`, `/scbookingsbyslot/`, `/scbookingsbyuser/`, `/transactions/`, `/pendingtransactions/`, `/shopItems/`, `/specialSlots/`, `/specialUsers/`, `/infoItems/`, `/terms/`, `/diagnostics/`, `/serverError/`.
2. THE frontend SHALL read from all shared paths and write only to paths permitted by Firebase security rules (own user record, diagnostics).
3. THE backend SHALL read and write to booking, transaction, and pending transaction paths using the `varausserver` service account UID.
4. BOTH subsystems SHALL use consistent data shapes for shared entities: User, Slot, Booking, Transaction, PendingTransaction, ShopItem, and SpecialUser.
5. THE Firebase security rules SHALL enforce that only the varausserver service account can write to `/bookingsbyslot/`, `/bookingsbyuser/`, and `/transactions/`.

### Requirement 3: Shared Authentication Contract

**User Story:** As a developer, I want a consistent authentication flow between frontend and backend, so that user identity is verified end-to-end.

#### Acceptance Criteria

1. THE frontend SHALL authenticate users via Firebase Authentication (email/password or Google sign-in) and obtain Firebase ID tokens.
2. THE frontend SHALL include the Firebase ID token in every POST request body sent to the backend.
3. THE backend SHALL verify every received Firebase ID token using Firebase Admin SDK `auth().verifyIdToken()`.
4. THE backend SHALL extract the user UID from the verified token and use it for all database operations on that request.
5. IF token verification fails on the backend, THEN the request SHALL be rejected with HTTP 500.

### Requirement 4: Environment Parity

**User Story:** As a developer, I want consistent environment configuration across all subsystems, so that development, staging, and production deployments use matching settings.

#### Acceptance Criteria

1. THE Platform SHALL support three deployment environments: development, staging, and production.
2. THE frontend and backend SHALL connect to the same Firebase project for a given environment (staging or production).
3. THE coordination system SHALL validate that the frontend and backend Firebase projectId and databaseURL match for the configured environment.
4. THE backend SHALL select the Firebase service account and database URL based on the NODE_ENV environment variable.
5. THE frontend SHALL select the Firebase configuration object based on the build-time configuration.

### Requirement 5: End-to-End Booking Flow

**User Story:** As a user, I want to browse available slots, book a session, and receive confirmation, with the entire flow working reliably across frontend and backend.

#### Acceptance Criteria

1. THE frontend SHALL display the weekly timetable by reading `/slots/` from Firebase and calculating slot availability.
2. WHEN a user books a slot, THE frontend SHALL send a POST request to the backend `/reserveSlot` endpoint with the user token and slot details.
3. THE backend SHALL verify entitlement (non-expired transaction with unusedtimes > 0), decrement credits, write the booking to both Firebase paths, and return success.
4. THE frontend SHALL display a success message and update the slot's booking list in real-time via Firebase listeners.
5. THE backend SHALL send a booking confirmation email via Mailgun.
6. WHEN a user cancels a booking, THE frontend SHALL send a POST to `/cancelSlot`, and THE backend SHALL remove the booking from both paths, restore credits if count-based, and send a cancellation email.

### Requirement 6: End-to-End Payment Flow

**User Story:** As a user, I want to purchase access tokens through multiple payment methods, with the transaction recorded consistently across the system.

#### Acceptance Criteria

1. THE Platform SHALL support two payment methods: invoice (delayed) and cash (admin-initiated).
2. FOR invoice payments, THE frontend SHALL initialize a pending transaction, notify the admin, and auto-approve the transaction.
3. FOR cash payments, THE frontend (admin view) SHALL call the backend `/cashbuy` endpoint, which verifies admin/instructor privileges before recording the transaction.
4. ALL completed transactions SHALL be written to `/transactions/{userId}/{timestamp}` with consistent structure regardless of payment method.
5. THE frontend SHALL support cancelling pending transactions via direct Firebase client-side removal (generic `cancelPendingTransaction` mechanism).

### Requirement 7: Role-Based Access Control

**User Story:** As a platform operator, I want role-based access control enforced at both the database and API levels, so that users can only access data and operations appropriate to their role.

#### Acceptance Criteria

1. THE Platform SHALL support three roles: regular user, instructor, and admin.
2. THE Firebase security rules SHALL enforce read/write permissions based on the authenticated user's UID and their `/specialUsers/` record.
3. THE backend SHALL verify admin or instructor privileges by reading `/specialUsers/{uid}` before processing privileged endpoints (`/cashbuy`, `/okTransaction`, `/removeTransaction`, `/approveincomplete`).
4. THE frontend admin panel SHALL only be accessible to users with admin or instructor flags in their `/specialUsers/` record.
5. Regular users SHALL only be able to read/write their own user record, read shared data (slots, shop items, info, terms), and write diagnostics.

### Requirement 8: Coordinated Development Workflow

**User Story:** As a developer, I want a single CLI to manage the full development lifecycle of both applications, so that I can work efficiently across the full stack.

#### Acceptance Criteria

1. THE coordination CLI SHALL provide commands to start, build, test, deploy, and monitor both applications.
2. THE start command SHALL start the backend before the frontend with connectivity verification between each step.
3. THE build command SHALL build the backend before the frontend, aborting if the backend build fails.
4. THE test command SHALL run frontend and backend tests in parallel with unified reporting.
5. THE deploy command SHALL execute build, test, and health verification before deploying to staging or production.
6. THE coordination system SHALL provide unified logging with correlation IDs across both applications.

### Requirement 9: Platform Observability

**User Story:** As a developer, I want unified health monitoring, logging, and diagnostics across the platform, so that I can quickly identify and resolve issues.

#### Acceptance Criteria

1. THE coordination system SHALL provide health monitoring that checks both application HTTP endpoints and Firebase connectivity.
2. THE coordination system SHALL provide unified logging that correlates log entries across frontend and backend using UUID-based correlation IDs.
3. THE frontend SHALL collect client-side diagnostics (session events, user agent) and flush them to Firebase `/diagnostics/`.
4. THE backend SHALL log uncaught exceptions to Firebase `/serverError/{timestamp}`.
5. THE coordination system SHALL provide a status command showing environment, uptime, process status, memory/CPU usage, and integration health.

### Requirement 10: Email Notification System

**User Story:** As a user, I want to receive email confirmations for bookings, cancellations, purchases, and other actions, so that I have a record of my activity.

#### Acceptance Criteria

1. THE backend SHALL send transactional emails via Mailgun for: booking confirmations, cancellation confirmations, purchase receipts, feedback acknowledgements, registration notifications, delayed purchase notifications, and profile deletion confirmations.
2. THE email content SHALL include relevant details: slot day/time for bookings, product title/price/tax/expiry for purchases, user email and deletion date for profile deletions, and user details for admin notifications.
3. IF the Mailgun API key is not configured, THEN the backend SHALL skip email sending without throwing errors.
4. Email sending SHALL be asynchronous (fire-and-forget) and SHALL NOT block the HTTP response.

### Requirement 11: End-to-End Profile Deletion Flow

**User Story:** As a user, I want to permanently delete my profile and all associated data from the platform, with the operation coordinated across frontend and backend.

#### Acceptance Criteria

1. THE frontend SHALL display a delete profile button on the UserProfile view with a confirmation dialog to prevent accidental deletion.
2. WHEN the user confirms deletion, THE frontend SHALL send an authenticated POST request to the backend `/deleteProfile` endpoint.
3. THE backend SHALL check for active bookings (slot end time in the future) and return HTTP 409 if any exist.
4. WHEN no active bookings exist, THE backend SHALL delete all user data from Firebase Realtime Database (`/users/{uid}`, `/bookingsbyuser/{uid}`, `/transactions/{uid}`, `/specialUsers/{uid}`), send a deletion confirmation email, and delete the Firebase Authentication account.
5. THE frontend SHALL sign the user out and redirect to the home page on successful deletion.
6. THE frontend SHALL display a warning when the user has active bookings that block deletion.
7. THE coordination system SHALL include the `/deleteProfile` endpoint in its health monitoring route registry.

# Requirements Document - Varausserver Backend

## Introduction

Varausserver is an Express.js backend API for the Varaus sauna reservation application. It handles authenticated slot reservations and cancellations with entitlement verification, multiple payment flows (invoice/delayed payments, admin cash purchases), transaction management, profile deletion with active booking guards, email notifications via Mailgun, and Firebase Realtime Database operations. The server uses Firebase Admin SDK for authentication and database access.

## Glossary

- **Backend**: The Express.js server application located in the `varausserver/` directory, using Firebase Admin SDK for authentication and database access.
- **Mailer**: The backend module using Mailgun to send transactional emails including booking confirmations, cancellation confirmations, purchase receipts, feedback acknowledgements, and registration notifications.
- **Transaction**: A purchase record stored under `/transactions/{userId}/` in Firebase, representing a bought shop item with expiry and usage tracking.
- **Pending_Transaction**: A transaction that has been initialized but not yet completed, stored under `/pendingtransactions/` in Firebase.
- **Shop_Item**: A purchasable product (time-based, count-based, or special) stored under `/shopItems/` in Firebase.
- **Special_User**: A user record in `/specialUsers/` that may have `admin` or `instructor` boolean flags granting elevated privileges.
- **Deletion_Endpoint**: The `POST /deleteProfile` backend route that processes authenticated profile deletion requests.
- **Active_Booking**: A booking associated with a user where the slot end time is in the future.

## Requirements

### Requirement 1: Server Initialization

**User Story:** As a developer, I want the backend server to initialize Express with Firebase Admin SDK and configure all route handlers, so that the API is ready to serve requests.

#### Acceptance Criteria

1. THE Backend SHALL initialize an Express.js server listening on the PORT environment variable or default port 3000.
2. WHEN NODE_ENV is "production", THE Backend SHALL initialize Firebase Admin SDK with the production service account and production database URL.
3. WHEN NODE_ENV is not "production", THE Backend SHALL initialize Firebase Admin SDK with the staging service account and staging database URL.
4. THE Backend SHALL initialize the Firebase Admin SDK with databaseAuthVariableOverride set to uid "varausserver".
5. THE Backend SHALL register a process-level uncaughtException handler that logs the error to the Firebase `/serverError/` path.
6. THE Backend SHALL serve static files from the public directory.
7. THE Backend SHALL initialize the Mailgun mailer on startup.

### Requirement 2: CORS and Request Headers

**User Story:** As a developer, I want the backend to set appropriate CORS headers, so that the frontend can communicate with the API from a different origin.

#### Acceptance Criteria

1. THE Backend SHALL set the Access-Control-Allow-Origin header to allow all origins.
2. THE Backend SHALL set the Access-Control-Allow-Methods header to "GET, POST".
3. THE Backend SHALL set the Access-Control-Allow-Headers header to "content-type".
4. THE Backend SHALL set the content-type response header to "text/plain".

### Requirement 3: Authentication and Authorization

**User Story:** As a developer, I want all backend endpoints to verify Firebase ID tokens, so that only authenticated users can access the API.

#### Acceptance Criteria

1. THE Backend SHALL verify the Firebase ID token on every POST endpoint by calling Firebase Admin auth().verifyIdToken().
2. WHEN token verification succeeds, THE Backend SHALL extract the user UID from the decoded token (uid or sub field).
3. IF token verification fails, THEN THE Backend SHALL return a 500 status with an error message.
4. WHEN an endpoint requires admin or instructor privileges, THE Backend SHALL check the `/specialUsers/{uid}` record for admin or instructor flags.
5. IF a non-admin, non-instructor user requests an admin-only endpoint, THEN THE Backend SHALL return a 500 status with an authorization error.

### Requirement 4: Slot Reservation

**User Story:** As a user, I want the backend to process my slot reservation by verifying entitlement and recording the booking, so that my sauna session is confirmed.

#### Acceptance Criteria

1. WHEN the `/reserveSlot` endpoint receives a request, THE Backend SHALL verify the user token and look up the user record from `/users/{uid}`.
2. IF the user record does not exist, THEN THE Backend SHALL return a 500 status with an error message.
3. THE Backend SHALL check the user transactions under `/transactions/{uid}` for non-expired entries with unusedtimes greater than zero.
4. IF the user has no valid count-based entitlement, THEN THE Backend SHALL return a 500 status indicating the user is not entitled to book.
5. WHEN the user has valid entitlement, THE Backend SHALL decrement the unusedtimes on the earliest-expiring transaction record.
6. THE Backend SHALL write the booking to both `/bookingsbyslot/{slotKey}/{bookingTime}/{userKey}` and `/bookingsbyuser/{userKey}/{slotKey}/{bookingTime}`.
7. WHEN the booking is written successfully, THE Backend SHALL return a 200 status and send a confirmation email via the Mailer.
8. THE Backend SHALL terminate the connection if the POST body exceeds 1 MB.

### Requirement 5: Slot Cancellation

**User Story:** As a user, I want the backend to process my booking cancellation and restore my usage credits, so that I can rebook for another time.

#### Acceptance Criteria

1. WHEN the `/cancelSlot` endpoint receives a request, THE Backend SHALL verify the user token and look up the user record.
2. THE Backend SHALL verify that the booking exists in both `/bookingsbyslot/` and `/bookingsbyuser/` paths.
3. IF the booking does not exist in either path, THEN THE Backend SHALL return a 500 status with an error message.
4. THE Backend SHALL remove the booking from both `/bookingsbyslot/{slotKey}/{instance}/{userKey}` and `/bookingsbyuser/{userKey}/{slotKey}/{instance}`.
5. WHEN the transaction reference is non-zero (count-based booking), THE Backend SHALL increment the unusedtimes on the referenced transaction record.
6. WHEN cancellation succeeds with a count-based booking, THE Backend SHALL send a count cancellation confirmation email.
7. WHEN cancellation succeeds with a time-based booking, THE Backend SHALL send a time cancellation confirmation email.

### Requirement 6: Checkout (Invoice Payment)

**User Story:** As a user, I want the backend to process invoice-based checkout, so that my purchase is recorded and I receive a receipt.

#### Acceptance Criteria

1. WHEN the `/checkout` endpoint receives a request, THE Backend SHALL verify the user token and look up the user and shop item records.
2. IF the user does not exist, THEN THE Backend SHALL return a 500 status with an error message.
3. THE Backend SHALL calculate the transaction expiry by adding the shop item expiresAfterDays to the current time and shifting to end of day.
4. THE Backend SHALL set unusedtimes equal to the shop item usetimes for count-based items.
5. THE Backend SHALL write the transaction to `/transactions/{userKey}/{timestamp}` with the shop item details, payment details (paymentInstrumentType: "invoice"), and calculated expiry.
6. WHEN the transaction is saved, THE Backend SHALL return a 200 status and send a receipt email via the Mailer.

### Requirement 7: Cash Purchase Processing (Admin)

**User Story:** As an admin or instructor, I want the backend to process cash purchases on behalf of users, so that in-person payments are recorded.

#### Acceptance Criteria

1. WHEN the `/cashbuy` endpoint receives a request, THE Backend SHALL verify the requesting user has admin or instructor privileges via the `/specialUsers/` record.
2. IF the requesting user is not an admin or instructor, THEN THE Backend SHALL return a 500 status with an authorization error.
3. THE Backend SHALL look up the target user and shop item from Firebase.
4. THE Backend SHALL support count-type, time-type, and special-type shop items with appropriate expiry and booking calculations.
5. WHEN processing a special-type cash purchase, THE Backend SHALL write booking records to both `/scbookingsbyslot/` and `/scbookingsbyuser/` paths.
6. WHEN the cash purchase succeeds, THE Backend SHALL return a 200 status with the transaction data and send a receipt email to the target user.

### Requirement 8: Transaction Management (Admin)

**User Story:** As an admin, I want to confirm payment received and remove transactions, so that I can manage the financial records.

#### Acceptance Criteria

1. WHEN the `/okTransaction` endpoint receives a request, THE Backend SHALL verify the requesting user has admin privileges.
2. THE Backend SHALL set the `paymentReceived` flag to true on the specified transaction record under `/transactions/{userId}/{purchasetime}`.
3. WHEN the `/removeTransaction` endpoint receives a request, THE Backend SHALL verify the requesting user has admin privileges.
4. THE Backend SHALL remove the specified transaction record from `/transactions/{userId}/{purchasetime}`.
5. WHEN removing a special-type transaction, THE Backend SHALL also remove the corresponding records from `/scbookingsbyslot/` and `/scbookingsbyuser/`.

### Requirement 9: Email Notifications

**User Story:** As a user, I want to receive email notifications for bookings, cancellations, purchases, and registration, so that I have confirmation of my actions.

#### Acceptance Criteria

1. THE Mailer SHALL initialize with Mailgun using the MAILGUN_API_KEY, MAILGUN_DOMAIN, and MAILGUN_FROM_WHO environment variables.
2. THE Mailer SHALL send a booking confirmation email containing the day and time of the reserved slot.
3. THE Mailer SHALL send a cancellation confirmation email containing the day and time of the cancelled slot, and for count-based cancellations, confirm that the credit has been restored.
4. THE Mailer SHALL send a purchase receipt email containing the product title, description, tax breakdown (before-tax price, VAT percentage, VAT amount), total price in EUR, expiry date, and purchase identifier.
5. THE Mailer SHALL send a feedback acknowledgement email to the user who submitted feedback.
6. THE Mailer SHALL forward the feedback content to the configured feedback email address.
7. THE Mailer SHALL send a registration notification email to the configured registration notification address containing the new user email and name.
8. THE Mailer SHALL send a delayed purchase notification email to the configured notification address containing the purchase identifier and user details.
9. IF the Mailer is not initialized (missing API key), THEN THE Mailer SHALL skip email sending without throwing an error.

### Requirement 10: Feedback Processing

**User Story:** As a user, I want to submit feedback through the application, so that I can communicate with the service administrators.

#### Acceptance Criteria

1. WHEN the `/feedback` endpoint receives a request, THE Backend SHALL verify the user token.
2. THE Backend SHALL send the feedback content to the configured feedback email address via the Mailer.
3. THE Backend SHALL send a thank-you acknowledgement email to the user via the Mailer.
4. IF the feedback submission fails, THEN THE Backend SHALL return a 500 status with an error message.

### Requirement 11: Error Logging

**User Story:** As a developer, I want uncaught server errors logged to Firebase, so that production issues can be diagnosed.

#### Acceptance Criteria

1. WHEN an uncaught exception occurs, THE Backend SHALL write the error to the Firebase `/serverError/{timestamp}` path.
2. IF writing the error to Firebase fails, THEN THE Backend SHALL log the failure to the console.

### Requirement 12: Time Calculation Helpers

**User Story:** As a developer, I want consistent time calculation utilities on the backend, so that slot times, expiry dates, and date formatting are computed correctly.

#### Acceptance Criteria

1. THE Backend SHALL calculate slot times by combining the current date, day-of-week offset, weeks forward, and start time in milliseconds.
2. THE Backend SHALL calculate transaction expiry by shifting a future timestamp to the end of that day (23:59:59.999).
3. THE Backend SHALL format dates as "day.month.year" strings for use in email content.

### Requirement 13: Firebase Database Security Rules

**User Story:** As a developer, I want Firebase security rules that enforce role-based access control, so that data is protected from unauthorized access.

#### Acceptance Criteria

1. THE Firebase rules SHALL allow authenticated users to read `/slots/`, `/cancelledSlots/`, `/bookingsbyslot/`, `/shopItems/`, and `/specialSlots/` paths.
2. THE Firebase rules SHALL allow a user to read and write only their own record under `/users/{userId}`.
3. THE Firebase rules SHALL allow admin and instructor users to read all records under `/users/`.
4. THE Firebase rules SHALL restrict write access to `/bookingsbyslot/`, `/bookingsbyuser/`, and `/transactions/` to the varausserver service account only.
5. THE Firebase rules SHALL allow admin users to read and write `/pendingtransactions/`.
6. THE Firebase rules SHALL allow admin users to write to `/shopItems/`, `/slots/`, `/specialSlots/`, `/infoItems/`, and `/terms/`.
7. THE Firebase rules SHALL allow public read access to `/infoItems/` and `/terms/`.
8. THE Firebase rules SHALL restrict `/diagnostics/` read access to admin users and the varausserver account, while allowing any authenticated user to write.
9. THE Firebase rules SHALL allow a user to read their own records under `/bookingsbyuser/{userId}`, `/scbookingsbyuser/{userId}`, `/transactions/{userId}`, and `/specialUsers/{userId}`.

### Requirement 14: Profile Deletion Endpoint

**User Story:** As a user, I want the server to securely delete all my data, so that my profile is fully removed from the system.

#### Acceptance Criteria

1. THE Deletion_Endpoint SHALL require a valid Firebase ID token verified through authentication middleware before processing any request.
2. WHEN the Deletion_Endpoint receives an authenticated request, THE Backend SHALL delete the following Realtime Database records for the authenticated user's UID: `/users/{uid}`, `/bookingsbyuser/{uid}`, `/transactions/{uid}`, and `/specialUsers/{uid}`.
3. WHEN all database records have been deleted, THE Backend SHALL delete the user's Firebase Authentication account using the Firebase Admin SDK.
4. WHEN all deletion operations complete successfully, THE Deletion_Endpoint SHALL return an HTTP 200 response with a success status.
5. IF any deletion operation fails, THEN THE Deletion_Endpoint SHALL return an HTTP 500 response with a descriptive error message.
6. THE Deletion_Endpoint SHALL only delete data belonging to the authenticated user's own UID.

### Requirement 15: Active Booking Guard for Profile Deletion

**User Story:** As a user, I want to be prevented from deleting my profile while I have upcoming bookings, so that I do not lose access to reservations I have paid for.

#### Acceptance Criteria

1. WHEN the Deletion_Endpoint receives a request and the user has one or more Active_Bookings, THE Deletion_Endpoint SHALL return an HTTP 409 response indicating that the profile cannot be deleted while active bookings exist.

### Requirement 16: Deletion Confirmation Email

**User Story:** As a user, I want to receive an email confirmation when my profile is deleted, so that I have a record of the action.

#### Acceptance Criteria

1. WHEN the Backend successfully deletes all data for a user, THE Backend SHALL send a deletion confirmation email to the user's registered email address using Mailgun before deleting the Firebase Authentication account.
2. THE deletion confirmation email SHALL include the user's email address and the date of deletion.
3. IF the email sending fails, THEN THE Backend SHALL log the failure and continue with the Firebase Authentication account deletion without blocking the overall operation.

### Requirement 17: Build Configuration

**User Story:** As a developer, I want the backend to build with webpack, so that source code is bundled for deployment.

#### Acceptance Criteria

1. THE Backend SHALL build using webpack with Babel transpilation (preset-env) for Node.js 20 compatibility.
2. THE Backend SHALL copy static assets from the public directory during the build via CopyWebpackPlugin.

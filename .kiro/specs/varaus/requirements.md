# Requirements Document - Varaus Frontend

## Introduction

Varaus is a React-based single-page application for sauna time slot reservation. It provides user authentication via Firebase, a weekly timetable for browsing and booking sauna slots, a shop for purchasing access tokens with multiple payment methods (invoice, cash), an admin panel for managing users/slots/shop items/content, diagnostics tracking, user profile management including profile deletion, and pending transaction cancellation. The application uses Redux for state management and communicates with a Firebase Realtime Database and a backend Express.js API.

## Glossary

- **Frontend**: The React-based web application located in the `varaus/` directory, built with React 18, Redux, React Router 6, and webpack-dev-server.
- **Auth_Module**: The frontend module responsible for Firebase Authentication operations including login, registration, logout, and password management.
- **Timetable**: The weekly schedule of sauna time slots displayed to authenticated users, fetched from the Firebase `/slots/` path.
- **Slot**: A recurring sauna time slot defined by a day of the week, start time, and end time.
- **Booking**: A reservation made by a user for a specific instance of a Slot, stored in both `/bookingsbyslot/` and `/bookingsbyuser/` Firebase paths.
- **Transaction**: A purchase record stored under `/transactions/{userId}/` in Firebase, representing a bought shop item with expiry and usage tracking.
- **Shop_Item**: A purchasable product (time-based, count-based, or special) stored under `/shopItems/` in Firebase.
- **Admin_Panel**: The frontend administrative interface accessible to users with admin or instructor roles, providing user management, slot management, shop item management, info content management, terms management, and pending transaction approval.
- **Special_User**: A user record in `/specialUsers/` that may have `admin` or `instructor` boolean flags granting elevated privileges.
- **Diagnostics_Module**: The frontend module that collects user session events and flushes them to Firebase `/diagnostics/` for analytics.
- **Deletion_Confirmation_Dialog**: A UI component that requires the user to explicitly confirm the profile deletion action before it is submitted.
- **Active_Booking**: A booking associated with the user where the slot end time is in the future.

## Requirements

### Requirement 1: Application Shell and Routing

**User Story:** As a user, I want a single-page application with client-side routing, so that I can navigate between views without full page reloads.

#### Acceptance Criteria

1. THE Frontend SHALL render a React 18 application using HashRouter for client-side routing.
2. THE Frontend SHALL use a Redux store with redux-thunk middleware for state management.
3. THE Frontend SHALL provide routes for: home (/), admin (/admin), info (/info), shop (/shop), user (/user), register (/register), checkout (/checkout), userProfile (/userProfile), forgotPassword (/forgotPassword), diagnostics (/diagnostics), feedback (/feedback), useroverview (/useroverview), lockeduser (/lockeduser), and tests (/tests).
4. THE Frontend SHALL wrap all routes inside a Layout component that renders the AuthManager, DiagnosticsManager, LoadingScreen, and TopBar on every page.
5. WHEN an authenticated user navigates to the home page, THE Frontend SHALL redirect the user to the /user route.

### Requirement 2: Firebase Configuration

**User Story:** As a developer, I want the frontend to support multiple Firebase environments, so that development and production data remain separate.

#### Acceptance Criteria

1. THE Frontend SHALL define a stage Firebase configuration with apiKey, authDomain, databaseURL, and storageBucket for the staging project.
2. THE Frontend SHALL define a production Firebase configuration with apiKey, authDomain, databaseURL, and storageBucket for the production project.
3. THE Frontend SHALL initialize Firebase with one selected configuration at startup.
4. THE Frontend SHALL define a VARAUSSERVER variable pointing to the backend API base URL, defaulting to "http://localhost:3000" for local development.

### Requirement 3: User Authentication

**User Story:** As a user, I want to register, log in, and log out of the application, so that I can access my personal reservations and purchases.

#### Acceptance Criteria

1. THE Auth_Module SHALL support email and password login via Firebase Authentication signInWithEmailAndPassword.
2. THE Auth_Module SHALL support Google sign-in via Firebase Authentication signInWithPopup using GoogleAuthProvider.
3. WHEN a user registers, THE Auth_Module SHALL create a Firebase Authentication account using createUserWithEmailAndPassword with email, password, first name, and last name.
4. WHEN registration succeeds, THE Auth_Module SHALL create a user record in the Firebase `/users/` path with the user firstname, lastname, and email.
5. WHEN registration succeeds, THE Auth_Module SHALL send a registration notification to the backend `/notifyRegistration` endpoint.
6. THE Auth_Module SHALL listen for authentication state changes via onAuthStateChanged and dispatch ADD_USER or REMOVE_USER actions accordingly.
7. WHEN a user logs out, THE Auth_Module SHALL call Firebase Authentication signOut and dispatch a SIGN_OUT action.
8. IF login fails, THEN THE Auth_Module SHALL dispatch an AUTH_ERROR action containing the error code and message.
9. WHEN a user has not authenticated within a configurable timeout, THE Auth_Module SHALL dispatch an AUTH_TIMEOUT action.

### Requirement 4: User Registration Validation

**User Story:** As a user, I want my registration input validated before submission, so that I receive clear feedback on invalid data.

#### Acceptance Criteria

1. THE Frontend SHALL validate that the email field matches a valid email pattern before form submission.
2. THE Frontend SHALL validate that the password field is present and at least 6 characters long.
3. THE Frontend SHALL validate that the firstName and lastName fields are present.
4. THE Frontend SHALL validate that the user has accepted the terms and conditions checkbox.
5. IF any validation rule fails, THEN THE Frontend SHALL display an inline error message next to the corresponding field.

### Requirement 5: User Profile Management

**User Story:** As a user, I want to view and update my profile, change my email, change my password, and reset a forgotten password, so that I can manage my account.

#### Acceptance Criteria

1. THE Auth_Module SHALL support updating the user email address after re-authentication with the current email and password.
2. THE Auth_Module SHALL support updating the user password after re-authentication with the current email and password.
3. WHEN email update succeeds, THE Auth_Module SHALL dispatch an EMAIL_UPDATED action.
4. WHEN password update succeeds, THE Auth_Module SHALL dispatch a PASSWORD_UPDATED action.
5. IF re-authentication fails during email or password update, THEN THE Auth_Module SHALL dispatch an AUTH_ERROR action.
6. THE Auth_Module SHALL support sending a password reset email via Firebase Authentication sendPasswordResetEmail.
7. THE Frontend SHALL allow the user to update profile details (firstname, lastname, alias) by writing to the Firebase `/users/{uid}` path.
8. THE Frontend SHALL support sending an email verification via Firebase Authentication sendEmailVerification.
9. THE Frontend SHALL display a delete profile button on the UserProfile view that is visually distinct (danger-styled) from other actions.
10. WHEN the user clicks the delete profile button, THE Frontend SHALL display a Deletion_Confirmation_Dialog requesting explicit confirmation before proceeding.
11. WHEN the user cancels the Deletion_Confirmation_Dialog, THE Frontend SHALL close the dialog and take no further deletion action.
12. WHEN the user confirms the Deletion_Confirmation_Dialog, THE Frontend SHALL send an authenticated deletion request to the backend `/deleteProfile` endpoint.
13. WHILE the deletion request is in progress, THE Frontend SHALL display a loading indicator and disable the delete profile button.
14. WHEN the `/deleteProfile` endpoint returns a successful response, THE Frontend SHALL sign the user out and redirect to the home page.
15. IF the `/deleteProfile` endpoint returns an error response, THEN THE Frontend SHALL display the error message to the user and keep the user signed in.
16. WHEN the Frontend receives an HTTP 409 response from the `/deleteProfile` endpoint, THE Frontend SHALL display a message informing the user that active bookings must be cancelled before the profile can be deleted.
17. WHILE the user has one or more Active_Bookings, THE Frontend SHALL display a warning next to the delete profile button indicating that deletion is blocked by active bookings.
18. WHILE the user is not authenticated, THE Frontend SHALL not display the delete profile button.

### Requirement 6: Timetable Display and Slot Browsing

**User Story:** As an authenticated user, I want to view the weekly sauna timetable with slot availability, so that I can choose a time to book.

#### Acceptance Criteria

1. THE Frontend SHALL fetch the timetable by reading all records from the Firebase `/slots/` path.
2. THE Frontend SHALL listen for real-time changes on both `/slots/` and `/cancelledSlots/` Firebase paths and re-fetch the timetable when changes occur.
3. THE Frontend SHALL sort the fetched slots by start time in ascending order.
4. WHEN a slot has a matching entry in `/cancelledSlots/`, THE Frontend SHALL mark the slot as cancelled and attach the cancellation information.
5. THE Frontend SHALL calculate whether a slot time has passed by comparing the slot day and start time against the current local time.
6. WHEN a user selects a slot, THE Frontend SHALL dispatch a PUT_SLOT_INFO action and fetch the bookings for that slot.
7. THE Frontend SHALL stop listening for real-time booking updates when a slot is deselected by calling Firebase ref.off on the `/bookingsbyslot/` path.

### Requirement 7: Slot Booking and Cancellation

**User Story:** As an authenticated user, I want to book and cancel sauna time slots, so that I can reserve and manage my sauna sessions.

#### Acceptance Criteria

1. WHEN a user books a slot, THE Frontend SHALL obtain a Firebase ID token and POST to the backend `/reserveSlot` endpoint with the token, slot info, weeks forward, and timezone offset.
2. WHEN the booking succeeds, THE Frontend SHALL dispatch a BOOK_A_SLOT action and display a success message via the loading screen.
3. IF the booking fails, THEN THE Frontend SHALL dispatch a BOOKING_ERROR action and display an error message.
4. WHEN a user cancels a booking, THE Frontend SHALL obtain a Firebase ID token and POST to the backend `/cancelSlot` endpoint with the token, slot info, cancel item, transaction reference, and timezone offset.
5. WHEN the cancellation succeeds, THE Frontend SHALL dispatch a CANCEL_RESERVATION action and display a success message.
6. IF the cancellation fails, THEN THE Frontend SHALL dispatch a CANCEL_ERROR action and display an error message.
7. THE Frontend SHALL fetch bookings for a slot by listening to the Firebase `/bookingsbyslot/{slotKey}` path in real-time.
8. THE Frontend SHALL filter out past booking instances by comparing the booking instance timestamp plus slot duration against the current time.
9. THE Frontend SHALL separate bookings into all-user bookings and current-user bookings based on the authenticated user UID.

### Requirement 8: Shop Item Display and Cart

**User Story:** As an authenticated user, I want to browse available shop items and add them to a cart, so that I can purchase sauna access tokens.

#### Acceptance Criteria

1. THE Frontend SHALL fetch shop items from the Firebase `/shopItems/` path.
2. THE Frontend SHALL exclude locked shop items from the displayed list.
3. THE Frontend SHALL exclude one-time shop items that the user has already purchased.
4. WHEN a user selects a shop item, THE Frontend SHALL dispatch an ADD_TO_CART action with the selected item.
5. THE Frontend SHALL support resetting the shop state by dispatching a RESET_SHOP action.

### Requirement 9: Delayed Payment Flow

**User Story:** As a user, I want to purchase items with delayed (invoice) payment, so that I can acquire sauna access without immediate online payment.

#### Acceptance Criteria

1. WHEN a user initiates a delayed payment, THE Frontend SHALL POST to the backend `/initializedelayedtransaction` endpoint with the user token, shop item key, and purchase target type.
2. WHEN the delayed transaction is initialized, THE Frontend SHALL POST to the backend `/notifydelayed` endpoint to send a purchase notification to the administrator.
3. WHEN the notification succeeds, THE Frontend SHALL automatically approve the pending transaction by POSTing to the backend `/approveincomplete` endpoint.
4. IF the delayed payment flow fails, THEN THE Frontend SHALL dispatch a CHECKOUT_ERROR action with the error details.

### Requirement 10: Cash Payment Flow (Admin)

**User Story:** As an admin or instructor, I want to process cash payments on behalf of users, so that in-person purchases are recorded in the system.

#### Acceptance Criteria

1. WHEN an admin initiates a cash purchase, THE Frontend SHALL POST to the backend `/cashbuy` endpoint with the admin token, target user ID, shop item key, and purchase target type.
2. WHEN the cash purchase succeeds, THE Frontend SHALL transition to the done phase and display a success message.
3. IF the cash purchase fails, THEN THE Frontend SHALL dispatch a CHECKOUT_ERROR action with the error details.

### Requirement 12: User Transaction and Booking History

**User Story:** As a user, I want to view my purchase transactions and booking history, so that I can track my sauna usage and remaining credits.

#### Acceptance Criteria

1. THE Frontend SHALL fetch the user transaction history from the Firebase `/transactions/{uid}` path.
2. THE Frontend SHALL categorize transactions into time-based, count-based, and special types.
3. THE Frontend SHALL calculate remaining count credits by summing unusedtimes from non-expired count transactions.
4. THE Frontend SHALL calculate the time-based access expiry as the latest expires value among non-expired time transactions.
5. THE Frontend SHALL fetch the user booking history from the Firebase `/bookingsbyuser/{uid}` path.
6. THE Frontend SHALL sort transactions and bookings by their timestamps.

### Requirement 13: Admin Panel - User Management

**User Story:** As an admin, I want to manage users including locking, unlocking, and granting admin privileges, so that I can control access to the system.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fetch the user list from the Firebase `/users/` path with real-time updates.
2. THE Admin_Panel SHALL support locking a user by setting the `locked` flag to true on the `/specialUsers/{uid}` record.
3. THE Admin_Panel SHALL support unlocking a user by setting the `locked` flag to false on the `/specialUsers/{uid}` record.
4. THE Admin_Panel SHALL support granting admin privileges by setting the `admin` flag to true on the `/specialUsers/{uid}` record.
5. THE Admin_Panel SHALL support revoking admin privileges by setting the `admin` flag to false on the `/specialUsers/{uid}` record.
6. THE Admin_Panel SHALL provide a search bar to filter the user list.

### Requirement 14: Admin Panel - Slot Management

**User Story:** As an admin, I want to create, modify, and remove sauna time slots, so that I can manage the weekly timetable.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fetch the slot list from the Firebase `/slots/` path with real-time updates.
2. THE Admin_Panel SHALL support adding a new slot by writing to the Firebase `/slots/` path with day, start time, end time, and capacity data.
3. THE Admin_Panel SHALL support modifying an existing slot by updating the Firebase `/slots/{key}` record.
4. THE Admin_Panel SHALL support removing a slot by deleting the Firebase `/slots/{key}` record.
5. THE Admin_Panel SHALL provide a slot form for entering and editing slot details.

### Requirement 15: Admin Panel - Shop Item Management

**User Story:** As an admin, I want to create, modify, lock, and unlock shop items, so that I can control what products are available for purchase.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fetch the shop item list from the Firebase `/shopItems/` path with real-time updates.
2. THE Admin_Panel SHALL support adding a new shop item by writing to the Firebase `/shopItems/` path with title, description, price, type (time, count, or special), tax information, and expiry configuration.
3. THE Admin_Panel SHALL support modifying an existing shop item by updating the Firebase `/shopItems/{key}` record.
4. THE Admin_Panel SHALL support locking a shop item by setting the `locked` flag to true, hiding the item from the user-facing shop.
5. THE Admin_Panel SHALL support unlocking a shop item by setting the `locked` flag to false.

### Requirement 16: Admin Panel - Info and Terms Content Management

**User Story:** As an admin, I want to manage informational content and terms of service, so that users see up-to-date information.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fetch info items from the Firebase `/infoItems/` path.
2. THE Admin_Panel SHALL support adding, modifying, and removing info items in the Firebase `/infoItems/` path.
3. THE Admin_Panel SHALL fetch terms items from the Firebase `/terms/` path.
4. THE Admin_Panel SHALL support adding, modifying, and removing terms items in the Firebase `/terms/` path.
5. THE Frontend SHALL display terms items on the home page and during registration.
6. THE Frontend SHALL display info items on the /info route.

### Requirement 17: Admin Panel - Pending Transaction Approval

**User Story:** As an admin, I want to view and approve pending transactions, so that delayed payments and incomplete purchases can be finalized.

#### Acceptance Criteria

1. THE Admin_Panel SHALL fetch pending transactions from the Firebase `/pendingtransactions/` path with real-time updates.
2. THE Admin_Panel SHALL support approving a pending transaction by POSTing to the backend `/approveincomplete` endpoint with the admin token and pending transaction ID.
3. WHEN approval succeeds, THE Backend SHALL move the pending transaction to the `/transactions/{userId}/` path and remove the pending record.
4. THE Admin_Panel SHALL support confirming payment received on a transaction by POSTing to the backend `/okTransaction` endpoint.
5. THE Admin_Panel SHALL support removing a transaction by POSTing to the backend `/removeTransaction` endpoint.

### Requirement 18: User Overview (Admin)

**User Story:** As an admin, I want to view an overview of all users with their credit balances and transaction summaries, so that I can monitor system usage.

#### Acceptance Criteria

1. THE Frontend SHALL fetch all users from the Firebase `/users/` path and display them in the user overview.
2. THE Frontend SHALL fetch transactions for each user from the Firebase `/transactions/{uid}` path.
3. THE Frontend SHALL calculate per-user credit summaries including remaining time-based access expiry, remaining count credits, and earliest count expiry.
4. THE Frontend SHALL categorize each user transaction as valid, expired, or special.
5. THE Frontend SHALL sort valid and expired transactions by expiry date in ascending order.

### Requirement 19: Feedback Submission

**User Story:** As a user, I want to submit feedback through the application, so that I can communicate with the service administrators.

#### Acceptance Criteria

1. WHEN a user submits feedback, THE Frontend SHALL obtain a Firebase ID token and POST to the backend `/feedback` endpoint with the token and feedback message.
2. IF the feedback submission fails, THEN THE Frontend SHALL display an error message.

### Requirement 20: Diagnostics and Session Tracking

**User Story:** As an admin, I want the application to collect usage diagnostics, so that I can analyze user behavior and session patterns.

#### Acceptance Criteria

1. THE Diagnostics_Module SHALL start a diagnostics session on application load and record the session start timestamp.
2. THE Diagnostics_Module SHALL capture the user agent string from the browser.
3. THE Diagnostics_Module SHALL flush collected diagnostic events to the Firebase `/diagnostics/` path at configurable intervals.
4. THE Frontend SHALL provide a diagnostics viewer on the /diagnostics route that fetches diagnostic data for a date range from Firebase.
5. THE Frontend SHALL process raw diagnostic data into hourly and daily session counts for visualization.
6. THE Frontend SHALL aggregate diagnostic events across sessions and display event-level session breakdowns.

### Requirement 21: Loading Screen

**User Story:** As a user, I want visual feedback during asynchronous operations, so that I know the application is processing my request.

#### Acceptance Criteria

1. WHEN an asynchronous operation begins, THE Frontend SHALL display a loading screen with a descriptive message.
2. WHEN the operation completes successfully, THE Frontend SHALL hide the loading screen and display a success message.
3. WHEN the operation fails, THE Frontend SHALL hide the loading screen and display an error message.
4. THE Frontend SHALL support auto-dismissing the loading screen message after a configurable timeout.

### Requirement 22: Time Calculation Helpers

**User Story:** As a developer, I want consistent time calculation utilities on the frontend, so that slot display times, day names, and time formatting are computed correctly.

#### Acceptance Criteria

1. THE Frontend SHALL calculate local slot times by combining the current date, day-of-week offset, weeks forward, and start time in milliseconds.
2. THE Frontend SHALL determine whether a slot time has passed by comparing the calculated slot time against the current time.
3. THE Frontend SHALL format day strings as Finnish weekday names followed by "day.month.year" (e.g., "maanantai 15.1.2024").
4. THE Frontend SHALL format time strings as "HH:MM" from millisecond timestamps.
5. THE Frontend SHALL calculate days remaining until a given expiry timestamp.
6. THE Frontend SHALL convert time values between HHMM integer format and milliseconds.

### Requirement 23: Build Configuration

**User Story:** As a developer, I want the frontend to build with webpack, so that source code is bundled for deployment.

#### Acceptance Criteria

1. THE Frontend SHALL build using webpack with Babel transpilation (preset-env and preset-react), SCSS compilation, and CSS extraction.
2. THE Frontend SHALL serve the development build via webpack-dev-server with hot module replacement on the configured dev server port.
3. THE Frontend SHALL run tests using Mocha with Babel register and JSDOM for DOM simulation.

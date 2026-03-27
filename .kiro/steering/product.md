# Product Overview

Varaus is a reservation/booking system for a shared sauna facility at Hakolahdentie 2. It allows residents to browse available time slots, make reservations, and handle payments via Paytrail integration.

The system has three main components:

- **varaus** — React frontend SPA for end users and admins. Handles slot browsing, booking, checkout, user registration/login, and an admin panel for managing bookings and transactions.
- **varausserver** — Express.js backend API. Manages reservations, payment processing (Paytrail), email notifications (Mailgun), and Firebase Realtime Database operations.
- **coordination** — TypeScript CLI tool that orchestrates the full-stack development environment. Manages process lifecycle, health monitoring, build coordination, and logging across frontend and backend.

Firebase Realtime Database is the primary data store. Firebase Authentication handles user identity. The frontend is hosted via Firebase Hosting.

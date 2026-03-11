/**
 * @module routes
 * @description Application route definitions for the Varaus SPA.
 *
 * All 14 routes are nested under a Layout component that renders
 * AuthManager, DiagnosticsManager, LoadingScreen, and TopBar on every page.
 *
 * Route list (Requirement 1.3):
 *   /                - Home (redirects to /user when authenticated)
 *   /admin           - Admin panel (admin role required)
 *   /info            - Informational content
 *   /shop            - Shop item browsing
 *   /user            - Timetable and booking view
 *   /register        - User registration form
 *   /checkout        - Payment flow
 *   /userProfile     - Profile management
 *   /forgotPassword  - Password reset
 *   /diagnostics     - Diagnostics viewer (admin)
 *   /feedback        - Feedback submission
 *   /useroverview    - User overview (admin)
 *   /lockeduser      - Locked user display
 *   /tests           - Developer test utilities (admin)
 *
 * @see Requirement 1.1 - HashRouter for client-side routing
 * @see Requirement 1.3 - All 14 routes defined
 * @see Requirement 1.4 - Layout wraps all routes
 * @see Requirement 1.5 - Home redirects authenticated users to /user
 */
import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Views
import Diagnostics from './dev/views/Diagnostics.jsx'
import Admin from './dev/views/Admin.jsx'
import Checkout from './dev/views/Checkout.jsx'
import Home from './dev/views/Home.jsx'
import Info from './dev/views/Info.jsx'
import Layout from './dev/views/Layout.jsx'
import Register from './dev/views/Register.jsx'
import Shop from './dev/views/Shop.jsx'
import User from './dev/views/User.jsx'
import Tests from './dev/views/Tests.jsx'
import UserProfile from './dev/views/UserProfile.jsx'
import ForgotPassword from './dev/views/ForgotPassword.jsx'
import Feedback from './dev/views/Feedback.jsx'
import UserOverview from './dev/views/UserOverview.jsx'
import LockedUser from './dev/views/LockedUser.jsx'

/**
 * Root route component defining all application routes.
 * All routes are wrapped by Layout which provides AuthManager,
 * DiagnosticsManager, LoadingScreen, and TopBar.
 * @returns {React.ReactElement} The route tree
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="admin" element={<Admin />} />
        <Route path="info" element={<Info />} />
        <Route path="shop" element={<Shop />} />
        <Route path="user" element={<User />} />
        <Route path="tests" element={<Tests />} />
        <Route path="register" element={<Register />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="userProfile" element={<UserProfile />} />
        <Route path="forgotPassword" element={<ForgotPassword />} />
        <Route path="diagnostics" element={<Diagnostics />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="useroverview" element={<UserOverview />} />
        <Route path="lockeduser" element={<LockedUser />} />
      </Route>
    </Routes>
  )
}

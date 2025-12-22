import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Views
import Diagnostics from './dev/views/Diagnostics.jsx'
import Admin from './dev/views/Admin.jsx'
import Checkout from './dev/views/Checkout.jsx'
import PaytrailReturn from './dev/views/PaytrailReturn.jsx'
import PaytrailCancel from './dev/views/PaytrailCancel.jsx'
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
        <Route path="paytrailreturn" element={<PaytrailReturn />} />
        <Route path="paytrailcancel" element={<PaytrailCancel />} />
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


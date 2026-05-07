import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute       from './components/ProtectedRoute'
import LoginPage            from './pages/LoginPage'
import RegisterPage         from './pages/RegisterPage'
import ForgotPasswordPage   from './pages/ForgotPasswordPage'
import ResetPasswordPage    from './pages/ResetPasswordPage'
import DashboardPage        from './pages/DashboardPage'
import FeesPage             from './pages/FeesPage'
import GradesPage           from './pages/GradesPage'
import AttendancePage       from './pages/AttendancePage'
import TimetablePage        from './pages/TimetablePage'
import ProfilePage          from './pages/ProfilePage'
import LinkingRequestPage   from './pages/LinkingRequestPage'

// Client portal routes — all protected routes require authentication.
// Unauthenticated users are redirected to /login by ProtectedRoute.
export default function App() {
  return (
    <Routes>
      {/* Public routes — no authentication required */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected routes — require a verified session */}
      <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/fees"         element={<ProtectedRoute><FeesPage /></ProtectedRoute>} />
      <Route path="/grades"       element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
      <Route path="/attendance"   element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/timetable"    element={<ProtectedRoute><TimetablePage /></ProtectedRoute>} />
      <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/link-account" element={<ProtectedRoute><LinkingRequestPage /></ProtectedRoute>} />

      {/* Fallback — redirect unknown paths to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/dashboard/Dashboard'
import JobList from './pages/jobs/JobList'
import JobDetail from './pages/jobs/JobDetail'
import JobForm from './pages/jobs/JobForm'
import Applications from './pages/jobs/Applications'
import CourseList from './pages/training/CourseList'
import CourseDetail from './pages/training/CourseDetail'
import CourseForm from './pages/training/CourseForm'
import CheckinForm from './pages/pulse/CheckinForm'
import CheckinHistory from './pages/pulse/CheckinHistory'
import AdminPanel from './pages/admin/AdminPanel'

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      {/* Jobs */}
      <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />
      <Route path="/jobs/new" element={<RoleRoute roles={['hr_admin']}><JobForm /></RoleRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/jobs/:id/edit" element={<RoleRoute roles={['hr_admin']}><JobForm /></RoleRoute>} />
      <Route path="/jobs/:id/applications" element={<RoleRoute roles={['hr_admin']}><Applications /></RoleRoute>} />

      {/* Training */}
      <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
      <Route path="/courses/new" element={<RoleRoute roles={['hr_admin']}><CourseForm /></RoleRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
      <Route path="/courses/:id/edit" element={<RoleRoute roles={['hr_admin']}><CourseForm /></RoleRoute>} />

      {/* Pulse */}
      <Route path="/checkins" element={<ProtectedRoute><CheckinHistory /></ProtectedRoute>} />
      <Route path="/checkins/new" element={<ProtectedRoute><CheckinForm /></ProtectedRoute>} />
      <Route path="/team" element={
  <RoleRoute roles={['supervisor', 'hr_admin']}>
    <CheckinHistory />
  </RoleRoute>
} />

      {/* Admin */}
      <Route path="/admin" element={<RoleRoute roles={['hr_admin']}><AdminPanel /></RoleRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
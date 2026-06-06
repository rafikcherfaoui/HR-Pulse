import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Usage: <RoleRoute roles={['hr_admin']}> or <RoleRoute roles={['hr_admin','supervisor']}>
const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default RoleRoute
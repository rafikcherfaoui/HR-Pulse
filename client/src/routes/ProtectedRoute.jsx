import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// redirects to /login if no user
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
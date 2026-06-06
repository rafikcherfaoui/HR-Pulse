import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['employee', 'supervisor', 'hr_admin'] },
    { to: '/jobs', label: 'Jobs', icon: Briefcase, roles: ['employee', 'supervisor', 'hr_admin'] },
    { to: '/courses', label: 'Training', icon: BookOpen, roles: ['employee', 'supervisor', 'hr_admin'] },
    { to: '/checkins', label: 'Check-ins', icon: MessageSquare, roles: ['employee', 'supervisor', 'hr_admin'] },
    { to: '/admin', label: 'Admin Panel', icon: Settings, roles: ['hr_admin'] },
  ].filter(link => link.roles.includes(user?.role))

  return (
    <div style={styles.shell}>
      <aside style={{ ...styles.sidebar, width: collapsed ? '60px' : '220px' }}>
        <div style={styles.sidebarTop}>
          {!collapsed && <span style={styles.logo}>HR Pulse</span>}
          <button style={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav style={styles.nav}>
          {links.map(link => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                })}
              >
                <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div style={styles.sidebarBottom}>
          {!collapsed && (
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user?.name}</p>
              <p style={styles.userRole}>{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            <LogOut size={16} color="#64748b" />
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' },
  sidebar: { display: 'flex', flexDirection: 'column', background: '#0f172a', transition: 'width 0.2s', flexShrink: 0, overflow: 'hidden' },
  sidebarTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1rem', borderBottom: '1px solid #1e293b' },
  logo: { color: '#fff', fontWeight: 700, fontSize: '1.1rem', whiteSpace: 'nowrap' },
  collapseBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem 0.5rem', flex: 1 },
  navLink: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s', whiteSpace: 'nowrap' },
  sidebarBottom: { padding: '1rem', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  userInfo: { overflow: 'hidden' },
  userName: { margin: 0, color: '#fff', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { margin: 0, color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' },
  main: { flex: 1, overflowY: 'auto', padding: '2rem' },
}

export default Layout
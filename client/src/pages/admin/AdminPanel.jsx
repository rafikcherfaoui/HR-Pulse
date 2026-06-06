import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const ROLES = ['employee', 'supervisor', 'hr_admin']

const roleColor = (role) => {
  if (role === 'hr_admin') return { bg: '#fee2e2', color: '#991b1b' }
  if (role === 'supervisor') return { bg: '#fef9c3', color: '#854d0e' }
  return { bg: '#eff6ff', color: '#1d4ed8' }
}

const AdminPanel = () => {
  const [users, setUsers] = useState([])
  const [supervisors, setSupervisors] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [tab, setTab] = useState('users')

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/users/supervisors'),
      api.get('/checkins/trends'),
    ]).then(([usersRes, supRes, trendsRes]) => {
      setUsers(usersRes.data)
      setSupervisors(supRes.data)
      setTrends(trendsRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const updateUser = async (userId, field, value) => {
    setUpdating(userId)
    try {
      await api.put(`/users/${userId}/role`, { [field]: value })
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, [field]: value } : u)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  // Find max avg_mood for chart scaling
  const maxMood = Math.max(...trends.map(t => t.avg_mood), 5)

  return (
    <Layout>
      <div style={styles.page}>
        <h1 style={styles.title}>Admin Panel</h1>
        <p style={styles.subtitle}>{users.length} total users</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['users', 'trends'].map(t => (
            <button
              key={t}
              style={{ ...styles.tab, borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent', color: tab === t ? '#2563eb' : '#64748b' }}
              onClick={() => setTab(t)}
            >
              {t === 'users' ? '👥 Users' : '📊 Mood Trends'}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : tab === 'users' ? (

          /* ── Users table ── */
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Department', 'Role', 'Supervisor'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const rc = roleColor(u.role)
                  return (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>
                        <p style={styles.userName}>{u.name}</p>
                      </td>
                      <td style={styles.td}>
                        <p style={styles.email}>{u.email}</p>
                      </td>
                      <td style={styles.td}>
                        <p style={styles.dept}>{u.department || '—'}</p>
                      </td>
                      <td style={styles.td}>
                        <select
                          style={{ ...styles.select, background: rc.bg, color: rc.color }}
                          value={u.role}
                          onChange={e => updateUser(u.id, 'role', e.target.value)}
                          disabled={updating === u.id}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={u.supervisor_id || ''}
                          onChange={e => updateUser(u.id, 'supervisor_id', e.target.value || null)}
                          disabled={updating === u.id}
                        >
                          <option value="">No supervisor</option>
                          {supervisors.filter(s => s.id !== u.id).map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        ) : (

          /* ── Mood trends chart ── */
          <div style={styles.trendsWrap}>
            <h2 style={styles.sectionTitle}>Weekly mood average (last 12 weeks)</h2>

            {trends.length === 0 ? (
              <p style={styles.empty}>No check-in data yet.</p>
            ) : (
              <div style={styles.chartWrap}>
                {[...trends].reverse().map((t, i) => {
                  const heightPct = (t.avg_mood / maxMood) * 100
                  const energyPct = (t.avg_energy / maxMood) * 100
                  const weekLabel = new Date(t.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  return (
                    <div key={i} style={styles.barGroup}>
                      <div style={styles.bars}>
                        {/* Mood bar */}
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.bar, height: `${heightPct}%`, background: '#2563eb' }} title={`Mood: ${t.avg_mood}`} />
                        </div>
                        {/* Energy bar */}
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.bar, height: `${energyPct}%`, background: '#10b981' }} title={`Energy: ${t.avg_energy}`} />
                        </div>
                      </div>
                      <p style={styles.barLabel}>{weekLabel}</p>
                      <p style={styles.barCount}>{t.total_checkins} check-in{t.total_checkins !== 1 ? 's' : ''}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Legend */}
            <div style={styles.legend}>
              <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#2563eb' }} /> Avg mood</span>
              <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#10b981' }} /> Avg energy</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '960px' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 1.25rem', color: '#64748b' },
  tabs: { display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' },
  tab: { background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' },
  tableWrap: { background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.75rem 1rem', verticalAlign: 'middle' },
  userName: { margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' },
  email: { margin: 0, fontSize: '0.82rem', color: '#64748b' },
  dept: { margin: 0, fontSize: '0.85rem', color: '#475569' },
  select: { padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 },
  trendsWrap: { background: '#fff', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 600, color: '#0f172a' },
  chartWrap: { display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '200px', padding: '0 0.5rem' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' },
  bars: { display: 'flex', gap: '2px', alignItems: 'flex-end', flex: 1, width: '100%' },
  barTrack: { flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.4s', minHeight: '4px' },
  barLabel: { margin: '0.4rem 0 0', fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' },
  barCount: { margin: '0.1rem 0 0', fontSize: '0.6rem', color: '#cbd5e1', textAlign: 'center' },
  legend: { display: 'flex', gap: '1.5rem', marginTop: '1.25rem', justifyContent: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#64748b' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '3rem' },
}

export default AdminPanel
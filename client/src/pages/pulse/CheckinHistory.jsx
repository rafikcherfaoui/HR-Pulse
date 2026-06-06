import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'


const energyLabel = (v) => ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'][v] || '—'

const CheckinHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === 'supervisor' || user?.role === 'hr_admin'
  const [tab, setTab] = useState('mine')
  const [myCheckins, setMyCheckins] = useState([])
  const [teamCheckins, setTeamCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const requests = [api.get('/checkins/me')]
    if (isManager) requests.push(api.get('/checkins/team'))

    Promise.all(requests)
      .then(([myRes, teamRes]) => {
        setMyCheckins(myRes.data)
        if (teamRes) setTeamCheckins(teamRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleFlag = async (checkinId, currentFlag) => {
    try {
      await api.put(`/checkins/${checkinId}/flag`)
      setTeamCheckins(prev =>
        prev.map(c => c.id === checkinId ? { ...c, flagged: !currentFlag } : c)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const displayed = tab === 'mine' ? myCheckins : teamCheckins

  return (
    <Layout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Check-ins</h1>
            <p style={styles.subtitle}>Track mood and energy over time</p>
          </div>
          <button style={styles.primaryBtn} onClick={() => navigate('/checkins/new')}>
            + New check-in
          </button>
        </div>

        {/* Tabs */}
        {isManager && (
          <div style={styles.tabs}>
            {['mine', 'team'].map(t => (
              <button
                key={t}
                style={{ ...styles.tab, borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent', color: tab === t ? '#2563eb' : '#64748b' }}
                onClick={() => setTab(t)}
              >
                {t === 'mine' ? 'My check-ins' : 'Team check-ins'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : displayed.length === 0 ? (
          <p style={styles.empty}>No check-ins yet.</p>
        ) : (
          <div style={styles.list}>
            {displayed.map(c => (
              <div key={c.id} style={{ ...styles.card, borderLeft: c.flagged ? '4px solid #ef4444' : '4px solid #e2e8f0' }}>
                <div style={styles.cardTop}>
                  <div style={styles.cardLeft}>
                    {tab === 'team' && (
                      <p style={styles.userName}>{c.user_name}
                        {c.department && <span style={styles.dept}> · {c.department}</span>}
                      </p>
                    )}
                    <div style={styles.scores}>
                      <span style={styles.scoreItem}>
                        <span style={styles.moodBadge}>{c.mood}/5</span>
<span style={styles.scoreLabel}>Mood</span>
                      </span>
                      <span style={styles.divider}>·</span>
                      <span style={styles.scoreItem}>
                        <span style={styles.scoreValue}>⚡ {c.energy}/5</span>
                        <span style={styles.scoreLabel}>{energyLabel(c.energy)}</span>
                      </span>
                    </div>
                    {c.note && <p style={styles.note}>"{c.note}"</p>}
                  </div>

                  <div style={styles.cardRight}>
                    <p style={styles.date}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    {isManager && tab === 'team' && (
                      <button
                        style={{ ...styles.flagBtn, color: c.flagged ? '#ef4444' : '#94a3b8' }}
                        onClick={() => handleFlag(c.id, c.flagged)}
                        title={c.flagged ? 'Remove flag' : 'Flag for follow-up'}
                      >
                        {c.flagged ? '🚩 Flagged' : '⚑ Flag'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '760px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0', color: '#64748b' },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  tab: { background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: '#fff', borderRadius: '8px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  userName: { margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#0f172a' },
  dept: { color: '#94a3b8', fontWeight: 400 },
  scores: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  scoreItem: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
  scoreEmoji: { fontSize: '1.4rem' },
  scoreValue: { fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' },
  scoreLabel: { fontSize: '0.78rem', color: '#94a3b8' },
  divider: { color: '#e2e8f0', fontSize: '1.2rem' },
  note: { margin: 0, color: '#475569', fontSize: '0.875rem', fontStyle: 'italic' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 },
  date: { margin: 0, fontSize: '0.8rem', color: '#94a3b8' },
  flagBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '3rem' },
  moodBadge: { fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' },
}

export default CheckinHistory
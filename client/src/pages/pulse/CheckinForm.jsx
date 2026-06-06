import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

// replace the MOODS array at the top
const MOODS = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
]

const CheckinForm = () => {
  const navigate = useNavigate()
  const [mood, setMood] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!mood || !energy) {
      setError('Please select both mood and energy.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/checkins', { mood, energy, note })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div style={styles.page}>
          <div style={styles.successCard}>
            <span style={styles.successIcon}>✅</span>
            <h2 style={styles.successTitle}>Check-in submitted!</h2>
            <p style={styles.successSub}>You earned +5 XP. Keep it up!</p>
            <div style={styles.successActions}>
              <button style={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </button>
              <button style={styles.secondaryBtn} onClick={() => { setSubmitted(false); setMood(null); setEnergy(null); setNote('') }}>
                Submit another
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={styles.page}>
        <h1 style={styles.title}>Daily Check-in</h1>
        <p style={styles.subtitle}>How are you doing today? Takes 30 seconds.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <p style={styles.error}>{error}</p>}

          {/* Mood selector */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>How's your mood? *</h2>
            <div style={styles.moodRow}>
  {MOODS.map(m => (
    <button
      key={m.value}
      type="button"
      style={{
        ...styles.moodBtn,
        background: mood === m.value ? '#2563eb' : '#f8fafc',
        color: mood === m.value ? '#fff' : '#64748b',
        border: mood === m.value ? '2px solid #2563eb' : '2px solid #e2e8f0',
        fontWeight: mood === m.value ? 700 : 400,
      }}
      onClick={() => setMood(m.value)}
    >
      <span style={styles.moodValue}>{m.value}</span>
      <span style={styles.moodLabel}>{m.label}</span>
    </button>
  ))}
</div>
          </div>

          {/* Energy selector */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Energy level? *</h2>
            <div style={styles.energyRow}>
              {[1, 2, 3, 4, 5].map(e => (
                <button
                  key={e}
                  type="button"
                  style={{
                    ...styles.energyBtn,
                    background: energy >= e ? '#2563eb' : '#e2e8f0',
                    color: energy >= e ? '#fff' : '#94a3b8',
                  }}
                  onClick={() => setEnergy(e)}
                >
                  {e}
                </button>
              ))}
              <span style={styles.energyHint}>
                {energy ? ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'][energy] : ''}
              </span>
            </div>
          </div>

          {/* Optional note */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Anything on your mind? <span style={styles.optional}>(optional)</span></h2>
            <textarea
              style={styles.textarea}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="Share how your day is going, any blockers, or wins..."
            />
          </div>

          <button style={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit check-in ✓'}
          </button>
        </form>
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '620px' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 1.5rem', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle: { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#0f172a' },
moodRow: { display: 'flex', gap: '0.5rem' },
moodBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.75rem 0.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', flex: 1 },
moodValue: { fontSize: '1.1rem', fontWeight: 700 },
moodLabel: { fontSize: '0.7rem', fontWeight: 'inherit' },
  energyRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  energyBtn: { width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'background 0.15s' },
  energyHint: { marginLeft: '0.5rem', fontSize: '0.875rem', color: '#2563eb', fontWeight: 500 },
  optional: { color: '#94a3b8', fontWeight: 400, fontSize: '0.875rem' },
  textarea: { width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { padding: '0.85rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px' },
  successCard: { background: '#fff', borderRadius: '10px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  successIcon: { fontSize: '3rem' },
  successTitle: { margin: '1rem 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' },
  successSub: { color: '#64748b', marginBottom: '1.5rem' },
  successActions: { display: 'flex', gap: '0.75rem', justifyContent: 'center' },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  secondaryBtn: { padding: '0.6rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
}

export default CheckinForm
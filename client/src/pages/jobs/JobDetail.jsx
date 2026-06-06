import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const JobDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ applicant_name: '', applicant_email: '', cover_letter: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(() => navigate('/jobs'))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/jobs/${id}/apply`, form)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><p style={{ padding: '2rem', color: '#64748b' }}>Loading...</p></Layout>
  if (!job) return null

  return (
    <Layout>
      <div style={styles.page}>

        {/* Back button */}
        <button style={styles.backBtn} onClick={() => navigate('/jobs')}>
          ← Back to jobs
        </button>

        {/* Job header */}
        <div style={styles.card}>
          <div style={styles.jobHeader}>
            <div>
              <h1 style={styles.title}>{job.title}</h1>
              <div style={styles.meta}>
                {job.location && <span style={styles.tag}>📍 {job.location}</span>}
                <span style={styles.tag}>👤 Posted by {job.posted_by}</span>
                <span style={styles.tag}>🕒 {new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <span style={{
              ...styles.badge,
              background: job.status === 'open' ? '#dcfce7' : '#fee2e2',
              color: job.status === 'open' ? '#166534' : '#991b1b',
            }}>
              {job.status}
            </span>
          </div>

          <hr style={styles.divider} />
          <p style={styles.description}>{job.description}</p>

          {/* HR admin actions */}
          {user?.role === 'hr_admin' && (
            <div style={styles.adminActions}>
              <button style={styles.secondaryBtn} onClick={() => navigate(`/jobs/${id}/edit`)}>
                ✏️ Edit posting
              </button>
              <button style={styles.secondaryBtn} onClick={() => navigate(`/jobs/${id}/applications`)}>
                📋 View applications
              </button>
            </div>
          )}
        </div>

        {/* Apply form */}
        {job.status === 'open' && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Apply for this position</h2>

            {submitted ? (
              <div style={styles.success}>
                ✅ Your application has been submitted! We'll be in touch soon.
              </div>
            ) : (
              <form onSubmit={handleApply} style={styles.form}>
                {error && <p style={styles.error}>{error}</p>}

                <label style={styles.label}>Full name *</label>
                <input
                  style={styles.input}
                  name="applicant_name"
                  value={form.applicant_name}
                  onChange={handleChange}
                  required
                />

                <label style={styles.label}>Email address *</label>
                <input
                  style={styles.input}
                  type="email"
                  name="applicant_email"
                  value={form.applicant_email}
                  onChange={handleChange}
                  required
                />

                <label style={styles.label}>Cover letter (optional)</label>
                <textarea
                  style={styles.textarea}
                  name="cover_letter"
                  value={form.cover_letter}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us why you're a great fit..."
                />

                <button style={styles.primaryBtn} type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit application'}
                </button>
              </form>
            )}
          </div>
        )}

        {job.status === 'closed' && (
          <div style={styles.closedBanner}>
            This position is no longer accepting applications.
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '720px' },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  card: { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  jobHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' },
  meta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  tag: { fontSize: '0.82rem', color: '#64748b' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '1.25rem 0' },
  description: { color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  adminActions: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem' },
  secondaryBtn: { padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
  input: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' },
  textarea: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  primaryBtn: { marginTop: '0.5rem', padding: '0.7rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer', fontWeight: 600 },
  error: { color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px' },
  success: { background: '#f0fdf4', color: '#166534', padding: '1rem', borderRadius: '8px', fontWeight: 500 },
  closedBanner: { background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 500 },
}

export default JobDetail
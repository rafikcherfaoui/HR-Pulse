import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const STATUSES = ['applied', 'reviewing', 'interview', 'offer', 'hired', 'rejected']

const statusColor = (status) => {
  const map = {
    applied: { bg: '#eff6ff', color: '#1d4ed8' },
    reviewing: { bg: '#fefce8', color: '#854d0e' },
    interview: { bg: '#f0fdf4', color: '#166534' },
    offer: { bg: '#f5f3ff', color: '#6d28d9' },
    hired: { bg: '#dcfce7', color: '#14532d' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
  }
  return map[status] || { bg: '#f1f5f9', color: '#334155' }
}

const Applications = () => {
  const { id } = useParams() // job id
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${id}`),
      api.get(`/jobs/applications/all?jobId=${id}`)
    ]).then(([jobRes, appRes]) => {
      setJobTitle(jobRes.data.title)
      setApplications(appRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (appId, status) => {
    setUpdating(appId)
    try {
      await api.put(`/jobs/applications/${appId}/status`, { status })
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status } : a)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <Layout>
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/jobs')}>← Back to jobs</button>

        <div style={styles.header}>
          <h1 style={styles.title}>Applications</h1>
          <p style={styles.subtitle}>{jobTitle} · {applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : applications.length === 0 ? (
          <p style={styles.empty}>No applications yet.</p>
        ) : (
          <div style={styles.list}>
            {applications.map(app => {
              const sc = statusColor(app.status)
              return (
                <div key={app.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <p style={styles.name}>{app.applicant_name}</p>
                      <p style={styles.email}>{app.applicant_email}</p>
                      <p style={styles.date}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ ...styles.badge, background: sc.bg, color: sc.color }}>
                      {app.status}
                    </span>
                  </div>

                  {app.cover_letter && (
                    <p style={styles.coverLetter}>{app.cover_letter}</p>
                  )}

                  {/* Pipeline status buttons */}
                  <div style={styles.pipeline}>
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        style={{
                          ...styles.pipelineBtn,
                          background: app.status === s ? sc.bg : '#f8fafc',
                          color: app.status === s ? sc.color : '#64748b',
                          fontWeight: app.status === s ? 700 : 400,
                          border: app.status === s ? `1px solid ${sc.color}` : '1px solid #e2e8f0',
                        }}
                        onClick={() => updateStatus(app.id, s)}
                        disabled={updating === app.id}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '800px' },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  header: { marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0', color: '#64748b' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  name: { margin: 0, fontWeight: 600, fontSize: '1rem', color: '#0f172a' },
  email: { margin: '0.2rem 0 0', color: '#2563eb', fontSize: '0.875rem' },
  date: { margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.8rem' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  coverLetter: { color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.75rem' },
  pipeline: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  pipelineBtn: { padding: '0.3rem 0.65rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.78rem', textTransform: 'capitalize' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '3rem' },
}

export default Applications
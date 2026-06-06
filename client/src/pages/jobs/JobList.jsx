import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const JobList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/jobs')
      .then(res => setJobs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div style={styles.page}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Job Openings</h1>
            <p style={styles.subtitle}>{jobs.filter(j => j.status === 'open').length} open positions</p>
          </div>
          {user?.role === 'hr_admin' && (
            <button style={styles.primaryBtn} onClick={() => navigate('/jobs/new')}>
              + Post a job
            </button>
          )}
        </div>

        <input
          style={styles.search}
          placeholder="Search by title or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.empty}>No jobs found.</p>
        ) : (
          <div style={styles.list}>
            {filtered.map(job => (
              <div
                key={job.id}
                style={styles.card}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div style={styles.cardLeft}>
                  <span style={styles.jobTitle}>{job.title}</span>
                  <div style={styles.meta}>
                    {job.location && <span style={styles.tag}>📍 {job.location}</span>}
                    <span style={styles.tag}>👤 {job.posted_by}</span>
                    <span style={styles.tag}>
                      🕒 {new Date(job.created_at).toLocaleDateString()}
                    </span>
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
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '800px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0', color: '#64748b' },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  search: { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '1.25rem', outline: 'none' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { background: '#fff', padding: '1.25rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s' },
  cardLeft: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  jobTitle: { fontWeight: 600, fontSize: '1rem', color: '#0f172a' },
  meta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  tag: { fontSize: '0.8rem', color: '#64748b' },
  badge: { padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '3rem' },
}

export default JobList
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const JobForm = () => {
  const { id } = useParams() // if id exists = edit mode
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ title: '', description: '', location: '', status: 'open' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If editing, pre-fill the form
  useEffect(() => {
    if (isEdit) {
      api.get(`/jobs/${id}`)
        .then(res => setForm({
          title: res.data.title,
          description: res.data.description,
          location: res.data.location || '',
          status: res.data.status,
        }))
        .catch(() => navigate('/jobs'))
    }
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, form)
      } else {
        await api.post('/jobs', form)
      }
      navigate('/jobs')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/jobs')}>← Back</button>

        <div style={styles.card}>
          <h1 style={styles.title}>{isEdit ? 'Edit job posting' : 'Post a new job'}</h1>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <p style={styles.error}>{error}</p>}

            <label style={styles.label}>Job title *</label>
            <input style={styles.input} name="title" value={form.title} onChange={handleChange} required />

            <label style={styles.label}>Location</label>
            <input style={styles.input} name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote, Algiers" />

            <label style={styles.label}>Description *</label>
            <textarea style={styles.textarea} name="description" value={form.description} onChange={handleChange} rows={8} required />

            {isEdit && (
              <>
                <label style={styles.label}>Status</label>
                <select style={styles.input} name="status" value={form.status} onChange={handleChange}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </>
            )}

            <div style={styles.actions}>
              <button style={styles.cancelBtn} type="button" onClick={() => navigate('/jobs')}>
                Cancel
              </button>
              <button style={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Post job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '680px' },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  card: { background: '#fff', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  title: { margin: '0 0 1.5rem', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginTop: '0.5rem' },
  input: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' },
  textarea: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' },
  cancelBtn: { padding: '0.6rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  error: { color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px' },
}

export default JobForm
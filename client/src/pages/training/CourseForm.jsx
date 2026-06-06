import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'

const emptySectionn = (index) => ({ title: '', content: '', order_index: index })

const CourseForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState({ title: '', description: '' })
  const [sections, setSections] = useState([emptySectionn(0)])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      api.get(`/courses/${id}`).then(res => {
        setForm({ title: res.data.title, description: res.data.description || '' })
        if (res.data.sections.length > 0) {
          setSections(res.data.sections.map(s => ({
            title: s.title,
            content: s.content || '',
            order_index: s.order_index,
          })))
        }
      }).catch(() => navigate('/courses'))
    }
  }, [id])

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSectionChange = (index, field, value) => {
    setSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const addSection = () => {
    setSections(prev => [...prev, emptySectionn(prev.length)])
  }

  const removeSection = (index) => {
    setSections(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/courses/${id}`, form)
      } else {
        await api.post('/courses', { ...form, sections })
      }
      navigate('/courses')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/courses')}>← Back</button>

        <form onSubmit={handleSubmit}>
          {/* Course info */}
          <div style={styles.card}>
            <h1 style={styles.title}>{isEdit ? 'Edit course' : 'Create new course'}</h1>
            {error && <p style={styles.error}>{error}</p>}

            <label style={styles.label}>Course title *</label>
            <input style={styles.input} name="title" value={form.title} onChange={handleFormChange} required />

            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} name="description" value={form.description} onChange={handleFormChange} rows={3} />
          </div>

          {/* Sections — only on create */}
          {!isEdit && (
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Sections</h2>
                <button type="button" style={styles.addBtn} onClick={addSection}>+ Add section</button>
              </div>

              {sections.map((section, index) => (
                <div key={index} style={styles.sectionBlock}>
                  <div style={styles.sectionBlockHeader}>
                    <span style={styles.sectionNum}>Section {index + 1}</span>
                    {sections.length > 1 && (
                      <button type="button" style={styles.removeBtn} onClick={() => removeSection(index)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <label style={styles.label}>Title *</label>
                  <input
                    style={styles.input}
                    value={section.title}
                    onChange={e => handleSectionChange(index, 'title', e.target.value)}
                    required
                  />

                  <label style={styles.label}>Content</label>
                  <textarea
                    style={styles.textarea}
                    value={section.content}
                    onChange={e => handleSectionChange(index, 'content', e.target.value)}
                    rows={3}
                    placeholder="Lesson content, instructions, links..."
                  />
                </div>
              ))}
            </div>
          )}

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={() => navigate('/courses')}>Cancel</button>
            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create course'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '700px' },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  card: { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  title: { margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginTop: '0.5rem' },
  input: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', outline: 'none' },
  textarea: { padding: '0.6rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', outline: 'none' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' },
  addBtn: { padding: '0.4rem 0.875rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  sectionBlock: { borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  sectionBlockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionNum: { fontSize: '0.85rem', fontWeight: 600, color: '#64748b' },
  removeBtn: { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.6rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  error: { color: '#dc2626', background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px' },
}

export default CourseForm
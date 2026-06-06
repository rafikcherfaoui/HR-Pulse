import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const CourseDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [completing, setCompleting] = useState(null)
  const [certified, setCertified] = useState(false)

  const fetchCourse = () => {
    return api.get(`/courses/${id}`)
      .then(res => setCourse(res.data))
      .catch(() => navigate('/courses'))
  }

  useEffect(() => {
    fetchCourse().finally(() => setLoading(false))
  }, [id])

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      await api.post(`/courses/${id}/enroll`)
      await fetchCourse()
    } catch (err) {
      console.error(err)
    } finally {
      setEnrolling(false)
    }
  }

  const handleComplete = async (sectionId) => {
    setCompleting(sectionId)
    try {
      const res = await api.post(`/sections/${sectionId}/complete`)
      if (res.data.certified) setCertified(true)
      // Refresh course to update progress and completed flags
      await fetchCourse()
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(null)
    }
  }

  if (loading) return <Layout><p style={{ padding: '2rem', color: '#64748b' }}>Loading...</p></Layout>
  if (!course) return null

  const progressColor = course.progress === 100 ? '#10b981' : '#2563eb'

  return (
    <Layout>
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/courses')}>← Back to courses</button>

        {/* Certified banner */}
        {(certified || (course.progress === 100 && course.enrolled)) && (
          <div style={styles.certBanner}>
            🎓 Congratulations! You completed this course and earned a certification. +50 XP
          </div>
        )}

        {/* Course header */}
        <div style={styles.card}>
          <div style={styles.courseHeader}>
            <div style={{ flex: 1 }}>
              <h1 style={styles.title}>{course.title}</h1>
              <p style={styles.meta}>Created by {course.created_by_name}</p>
              {course.description && (
                <p style={styles.description}>{course.description}</p>
              )}
            </div>

            {/* Enroll button */}
            {!course.enrolled && (
              <button style={styles.enrollBtn} onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? 'Enrolling...' : 'Enroll in course'}
              </button>
            )}
          </div>

          {/* Progress bar — only if enrolled */}
          {course.enrolled && (
            <div style={styles.progressWrap}>
              <div style={styles.progressRow}>
                <span style={styles.progressLabel}>
                  {course.progress === 100 ? '✅ Completed' : `Progress — ${course.progress}%`}
                </span>
                <span style={{ ...styles.progressPct, color: progressColor }}>
                  {course.sections.filter(s => s.completed).length} / {course.sections.length} sections
                </span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${course.progress}%`, background: progressColor }} />
              </div>
            </div>
          )}

          {/* HR Admin actions */}
          {user?.role === 'hr_admin' && (
            <div style={styles.adminActions}>
              <button style={styles.secondaryBtn} onClick={() => navigate(`/courses/${id}/edit`)}>
                ✏️ Edit course
              </button>
            </div>
          )}
        </div>

        {/* Sections */}
        <h2 style={styles.sectionHeading}>
          Course content · {course.sections.length} section{course.sections.length !== 1 ? 's' : ''}
        </h2>

        {course.sections.length === 0 ? (
          <p style={styles.empty}>No sections added yet.</p>
        ) : (
          <div style={styles.sectionList}>
            {course.sections.map((section, index) => (
              <div
                key={section.id}
                style={{
                  ...styles.sectionCard,
                  borderLeft: `4px solid ${section.completed ? '#10b981' : '#e2e8f0'}`,
                  opacity: !course.enrolled ? 0.6 : 1,
                }}
              >
                <div style={styles.sectionTop}>
                  <div style={styles.sectionLeft}>
                    <span style={styles.sectionNumber}>{index + 1}</span>
                    <div>
                      <p style={styles.sectionTitle}>{section.title}</p>
                      {section.content && (
                        <p style={styles.sectionContent}>{section.content}</p>
                      )}
                    </div>
                  </div>

                  {course.enrolled && (
                    section.completed ? (
                      <span style={styles.completedTag}>✅ Done</span>
                    ) : (
                      <button
                        style={styles.completeBtn}
                        onClick={() => handleComplete(section.id)}
                        disabled={completing === section.id}
                      >
                        {completing === section.id ? '...' : 'Mark complete'}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!course.enrolled && (
          <p style={styles.enrollHint}>Enroll in this course to track your progress and earn XP.</p>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  page: { maxWidth: '720px' },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem', padding: 0 },
  certBanner: { background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 500 },
  card: { background: '#fff', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  courseHeader: { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' },
  meta: { margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.875rem' },
  description: { margin: '0.75rem 0 0', color: '#475569', lineHeight: 1.6 },
  enrollBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 },
  progressWrap: { marginTop: '0.75rem' },
  progressRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' },
  progressLabel: { fontSize: '0.875rem', fontWeight: 500, color: '#374151' },
  progressPct: { fontSize: '0.875rem', fontWeight: 600 },
  progressBar: { height: '8px', background: '#e2e8f0', borderRadius: '999px' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s' },
  adminActions: { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' },
  secondaryBtn: { padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 },
  sectionHeading: { fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' },
  sectionList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  sectionCard: { background: '#fff', borderRadius: '8px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'border-color 0.2s' },
  sectionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  sectionLeft: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  sectionNumber: { background: '#f1f5f9', color: '#64748b', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 },
  sectionTitle: { margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' },
  sectionContent: { margin: '0.4rem 0 0', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 },
  completeBtn: { padding: '0.4rem 0.875rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 },
  completedTag: { color: '#10b981', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 },
  enrollHint: { textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', marginTop: '1rem' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '2rem' },
}

export default CourseDetail
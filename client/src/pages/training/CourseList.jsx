import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

const CourseList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all') // 'all' | 'enrolled'

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/courses/my'),
    ]).then(([allRes, myRes]) => {
      setCourses(allRes.data)
      setMyCourses(myRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const enrolledIds = new Set(myCourses.map(c => c.id))

  const getProgress = (id) => {
    const found = myCourses.find(c => c.id === id)
    return found ? found.progress : null
  }

  const displayed = (tab === 'enrolled' ? myCourses : courses)
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout>
      <div style={styles.page}>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Training</h1>
            <p style={styles.subtitle}>{courses.length} courses available</p>
          </div>
          {user?.role === 'hr_admin' && (
            <button style={styles.primaryBtn} onClick={() => navigate('/courses/new')}>
              + New course
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {['all', 'enrolled'].map(t => (
            <button
              key={t}
              style={{ ...styles.tab, borderBottom: tab === t ? '2px solid #2563eb' : '2px solid transparent', color: tab === t ? '#2563eb' : '#64748b' }}
              onClick={() => setTab(t)}
            >
              {t === 'all' ? 'All courses' : 'My courses'}
            </button>
          ))}
        </div>

        <input
          style={styles.search}
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : displayed.length === 0 ? (
          <p style={styles.empty}>{tab === 'enrolled' ? "You haven't enrolled in any courses yet." : 'No courses found.'}</p>
        ) : (
          <div style={styles.grid}>
            {displayed.map(course => {
              const progress = getProgress(course.id)
              const isEnrolled = enrolledIds.has(course.id)
              const isCertified = myCourses.find(c => c.id === course.id)?.certified_at

              return (
                <div
                  key={course.id}
                  style={styles.card}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  {/* Certified badge */}
                  {isCertified && (
                    <span style={styles.certBadge}>🎓 Certified</span>
                  )}

                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <p style={styles.courseDesc}>
                    {course.description?.slice(0, 100)}{course.description?.length > 100 ? '...' : ''}
                  </p>

                  <div style={styles.cardMeta}>
                    <span style={styles.tag}>👤 {course.created_by_name}</span>
                    <span style={styles.tag}>👥 {course.enrolled_count} enrolled</span>
                  </div>

                  {/* Progress bar if enrolled */}
                  {isEnrolled && progress !== null && (
                    <div style={styles.progressWrap}>
                      <div style={styles.progressRow}>
                        <span style={styles.progressLabel}>Progress</span>
                        <span style={styles.progressPct}>{progress}%</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${progress}%`, background: progress === 100 ? '#10b981' : '#2563eb' }} />
                      </div>
                    </div>
                  )}

                  {!isEnrolled && (
                    <span style={styles.enrollTag}>+ Enroll</span>
                  )}
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
  page: { maxWidth: '900px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0', color: '#64748b' },
  primaryBtn: { padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' },
  tabs: { display: 'flex', gap: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  tab: { background: 'none', border: 'none', borderBottom: '2px solid transparent', padding: '0.5rem 0', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' },
  search: { width: '100%', padding: '0.7rem 1rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '1.25rem', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  card: { background: '#fff', borderRadius: '10px', padding: '1.25rem', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', transition: 'box-shadow 0.15s' },
  certBadge: { position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#fef9c3', color: '#854d0e', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '999px' },
  courseTitle: { margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a', paddingRight: '4rem' },
  courseDesc: { margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, flex: 1 },
  cardMeta: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  tag: { fontSize: '0.78rem', color: '#94a3b8' },
  progressWrap: { marginTop: '0.5rem' },
  progressRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' },
  progressLabel: { fontSize: '0.78rem', color: '#64748b' },
  progressPct: { fontSize: '0.78rem', fontWeight: 600, color: '#2563eb' },
  progressBar: { height: '6px', background: '#e2e8f0', borderRadius: '999px' },
  progressFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  enrollTag: { fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, marginTop: '0.25rem' },
  empty: { color: '#64748b', textAlign: 'center', marginTop: '3rem' },
}

export default CourseList
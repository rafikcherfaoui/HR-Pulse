import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import api from '../../api/axios'
import { Star, BookOpen, GraduationCap, MessageSquare } from 'lucide-react'

const StatCard = ({ label, value, Icon, color }) => (
  <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
    <div style={{ color, display: 'flex' }}>
      <Icon size={28} strokeWidth={1.5} />
    </div>
    <div>
      <p style={styles.cardValue}>{value ?? '—'}</p>
      <p style={styles.cardLabel}>{label}</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [xp, setXp] = useState(null)
  const [myCourses, setMyCourses] = useState([])
  const [recentCheckin, setRecentCheckin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Everyone gets their XP
        const xpRes = await api.get(`/users/${user.id}/xp`)
        setXp(xpRes.data.total_xp)

        // Everyone gets their courses
        const coursesRes = await api.get('/courses/my')
        setMyCourses(coursesRes.data)

        // Everyone gets their latest check-in
        const checkinRes = await api.get('/checkins/me')
        if (checkinRes.data.length > 0) {
          setRecentCheckin(checkinRes.data[0])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.id])

  const inProgressCourses = myCourses.filter(c => c.progress > 0 && c.progress < 100)
  const completedCourses = myCourses.filter(c => c.progress === 100)


  return (
    <Layout>
      <div style={styles.page}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Welcome back, {user?.name?.split(' ')[0]} </h1>
            <p style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span style={{ ...styles.roleBadge, background: roleColor(user.role) }}>
            {user?.role?.replace('_', ' ')}
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading...</p>
        ) : (
          <>
            {/* Stat cards */}
            <div style={styles.grid}>
              <StatCard label="Total XP" value={xp} Icon={Star} color="#f59e0b" />
<StatCard label="Enrolled Courses" value={myCourses.length} Icon={BookOpen} color="#2563eb" />
<StatCard label="Completed" value={completedCourses.length} Icon={GraduationCap} color="#10b981" />
<StatCard label="Last Mood" value={recentCheckin ? `${recentCheckin.mood}/5` : '—'} Icon={MessageSquare} color="#8b5cf6" />
            </div>

            {/* In-progress courses */}
            {inProgressCourses.length > 0 && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Continue learning</h2>
                <div style={styles.courseList}>
                  {inProgressCourses.map(course => (
                    <div
                      key={course.id}
                      style={styles.courseCard}
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <div style={styles.courseHeader}>
                        <span style={styles.courseTitle}>{course.title}</span>
                        <span style={styles.progressLabel}>{course.progress}%</span>
                      </div>
                      <div style={styles.progressBar}>
                        <div style={{ ...styles.progressFill, width: `${course.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Quick actions</h2>
              <div style={styles.actions}>
                <button style={styles.actionBtn} onClick={() => navigate('/checkins/new')}>Submit check-in</button>
<button style={styles.actionBtn} onClick={() => navigate('/courses')}>Browse courses</button>
<button style={styles.actionBtn} onClick={() => navigate('/jobs')}>View open jobs</button>
               
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

const roleColor = (role) => {
  if (role === 'hr_admin') return '#dc2626'
  if (role === 'supervisor') return '#d97706'
  return '#2563eb'
}

const styles = {
  page: { maxWidth: '900px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' },
  subtitle: { margin: '0.25rem 0 0', color: '#64748b' },
  roleBadge: { color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: { background: '#fff', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardIcon: { fontSize: '1.75rem' },
  cardValue: { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' },
  cardLabel: { margin: 0, color: '#64748b', fontSize: '0.8rem' },
  section: { marginBottom: '2rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.75rem' },
  courseList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  courseCard: { background: '#fff', padding: '1rem', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  courseHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' },
  courseTitle: { fontWeight: 500, color: '#0f172a' },
  progressLabel: { fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 },
  progressBar: { height: '6px', background: '#e2e8f0', borderRadius: '999px' },
  progressFill: { height: '100%', background: '#2563eb', borderRadius: '999px', transition: 'width 0.3s' },
  actions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  actionBtn: { padding: '0.6rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#0f172a' },
}

export default Dashboard
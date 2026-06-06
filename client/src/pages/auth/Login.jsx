import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      // Redirect based on role
      if (user.role === 'hr_admin') navigate('/admin')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>HR Pulse</h2>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={styles.link}>
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f5f5f5' },
  card: { background:'#fff', padding:'2rem', borderRadius:'8px', width:'100%', maxWidth:'400px', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' },
  title: { margin:0, fontSize:'1.5rem', fontWeight:700 },
  subtitle: { color:'#666', marginBottom:'1.5rem' },
  form: { display:'flex', flexDirection:'column', gap:'0.5rem' },
  label: { fontSize:'0.875rem', fontWeight:500 },
  input: { padding:'0.6rem 0.75rem', border:'1px solid #ddd', borderRadius:'6px', fontSize:'1rem' },
  button: { marginTop:'0.75rem', padding:'0.7rem', background:'#2563eb', color:'#fff', border:'none', borderRadius:'6px', fontSize:'1rem', cursor:'pointer' },
  error: { color:'#dc2626', background:'#fef2f2', padding:'0.5rem 0.75rem', borderRadius:'6px', marginBottom:'1rem' },
  link: { textAlign:'center', marginTop:'1rem', fontSize:'0.875rem' },
}

export default Login
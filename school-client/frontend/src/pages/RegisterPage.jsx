import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, AlertCircle, CheckCircle } from 'lucide-react'
import { register } from '../services/authService'
import PasswordInput from '../components/PasswordInput'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'parent',
  })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await register(form)
      setSuccess(res.message || 'Registration successful! Please wait for device verification by an admin.')
      setTimeout(() => navigate('/login'), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Brand info above the card */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--primary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <GraduationCap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.375rem' }}>
            Join School Portal
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', lineHeight: 1.6 }}>
            Register as a parent or student to manage fees<br />and access academic records.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>
            Create account
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
            Fill in your details to get started
          </p>

          {error   && <div className="alert alert-danger"><AlertCircle size={16} className="alert-icon" />{error}</div>}
          {success && <div className="alert alert-success"><CheckCircle size={16} className="alert-icon" />{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input className="form-input" value={form.firstName}
                  onChange={(e) => setForm(p => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last name *</label>
                <input className="form-input" value={form.lastName}
                  onChange={(e) => setForm(p => ({ ...p, lastName: e.target.value }))} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email address *</label>
              <input type="email" className="form-input" value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Phone number</label>
              <input type="tel" className="form-input" value={form.phone}
                onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+250 7XX XXX XXX" />
            </div>

            <div className="form-group">
              <label className="form-label">I am a</label>
              <select className="form-input" value={form.role}
                onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="parent">Parent / Guardian</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  required minLength={8}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password *</label>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.25rem', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowRight, GraduationCap, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { getClasses } from '../services/adminService'
import Layout from '../components/Layout'

const promoteStudents = (data) => api.post('/students/promote', data).then(r => r.data)

export default function PromotePage() {
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass]     = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [confirmed, setConfirmed] = useState(false)

  const promoteMut = useMutation({
    mutationFn: promoteStudents,
    onSuccess: (r) => { setMsg({ type: 'success', text: r.message }); setFromClass(''); setToClass(''); setConfirmed(false) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Promotion failed.' }),
  })

  const fromName = classes.find(c => c.id === fromClass)?.name
  const toName   = classes.find(c => c.id === toClass)?.name

  return (
    <Layout title="Student Promotion">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Promotion</h1>
          <p className="page-sub">Move all students from one class to another at the end of the academic year.</p>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header"><span className="card-title"><GraduationCap size={16} /> Promote Students</span></div>
        <div className="card-body">
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={15} className="alert-icon" />
            This will move <strong>all active students</strong> from the selected class to the new class. This action cannot be undone automatically.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">From Class *</label>
              <select className="form-input" value={fromClass} onChange={(e) => { setFromClass(e.target.value); setConfirmed(false) }}>
                <option value="">Select current class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginTop: '1.5rem', color: 'var(--primary)' }}><ArrowRight size={24} /></div>
            <div style={{ flex: 1 }}>
              <label className="form-label">To Class *</label>
              <select className="form-input" value={toClass} onChange={(e) => { setToClass(e.target.value); setConfirmed(false) }}>
                <option value="">Select destination class…</option>
                {classes.filter(c => c.id !== fromClass).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {fromClass && toClass && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <strong>Preview:</strong> All students in <strong>{fromName}</strong> will be moved to <strong>{toName}</strong>.
            </div>
          )}

          {fromClass && toClass && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
              I confirm I want to promote all students from <strong style={{ margin: '0 0.25rem' }}>{fromName}</strong> to <strong style={{ margin: '0 0.25rem' }}>{toName}</strong>.
            </label>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            disabled={!fromClass || !toClass || !confirmed || promoteMut.isPending}
            onClick={() => promoteMut.mutate({ fromClassId: fromClass, toClassId: toClass })}>
            {promoteMut.isPending ? 'Promoting…' : 'Promote Students'}
          </button>
        </div>
      </div>
    </Layout>
  )
}

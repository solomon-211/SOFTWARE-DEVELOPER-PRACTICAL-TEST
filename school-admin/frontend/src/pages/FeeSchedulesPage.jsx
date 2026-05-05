import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, CheckCircle, AlertCircle, Trash2, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import Layout from '../components/Layout'

const getSchedules  = () => api.get('/fee-schedules').then(r => r.data.data)
const createSchedule = (d) => api.post('/fee-schedules', d).then(r => r.data.data)
const deleteSchedule = (id) => api.delete(`/fee-schedules/${id}`).then(r => r.data)

export default function FeeSchedulesPage() {
  const qc = useQueryClient()
  const { data: schedules = [], isLoading } = useQuery({ queryKey: ['feeSchedules'], queryFn: getSchedules })
  const [showCreate, setShowCreate] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [form, setForm] = useState({ name: '', amount: '', dueDate: '', academicYear: '', term: '', description: '' })

  const createMut = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => { qc.invalidateQueries(['feeSchedules']); setShowCreate(false); setMsg({ type: 'success', text: 'Fee schedule created.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => { qc.invalidateQueries(['feeSchedules']); setMsg({ type: 'success', text: 'Schedule removed.' }) },
  })

  const today = new Date()

  return (
    <Layout title="Fee Schedules">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Schedules</h1>
          <p className="page-sub">Define what fees are due and when. Students see these on their portal.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Schedule</button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}

      {isLoading ? <div className="spinner" /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Amount</th><th>Due Date</th><th>Term</th><th>Academic Year</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {schedules.map((s) => {
                  const overdue = new Date(s.dueDate) < today
                  return (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.amount.toLocaleString()} RWF</td>
                      <td style={{ color: overdue ? 'var(--danger)' : undefined }}>
                        {new Date(s.dueDate).toLocaleDateString()}
                        {overdue && <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Overdue</span>}
                      </td>
                      <td>{s.term || '—'}</td>
                      <td>{s.academicYear}</td>
                      <td><span className={`badge badge-${s.isActive ? 'success' : 'gray'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                          onClick={() => { if (window.confirm('Remove this schedule?')) deleteMut.mutate(s._id) }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {!schedules.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No fee schedules yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Fee Schedule</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate({ ...form, amount: Number(form.amount) }) }}>
              <div className="form-group">
                <label className="form-label">Fee Name *</label>
                <input className="form-input" placeholder="e.g. Term 1 Tuition" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (RWF) *</label>
                  <input type="number" className="form-input" placeholder="e.g. 150000" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <input className="form-input" placeholder="e.g. 2024-2025" value={form.academicYear} onChange={(e) => setForm(p => ({ ...p, academicYear: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Term</label>
                  <input className="form-input" placeholder="e.g. Term 1" value={form.term} onChange={(e) => setForm(p => ({ ...p, term: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>{createMut.isPending ? 'Creating…' : 'Create Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

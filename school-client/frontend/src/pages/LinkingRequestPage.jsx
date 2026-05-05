import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, CheckCircle, Clock, XCircle, AlertCircle, Send } from 'lucide-react'
import api from '../services/api'
import Layout from '../components/Layout'

const getMyRequests  = () => api.get('/linking').then(r => r.data.data)
const submitRequest  = (d) => api.post('/linking', d).then(r => r.data)

const statusConfig = {
  pending:  { badge: 'badge-warning', icon: Clock,        label: 'Pending Review' },
  approved: { badge: 'badge-success', icon: CheckCircle,  label: 'Approved' },
  rejected: { badge: 'badge-danger',  icon: XCircle,      label: 'Rejected' },
}

export default function LinkingRequestPage() {
  const qc = useQueryClient()
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['myLinking'], queryFn: getMyRequests })
  const [form, setForm] = useState({ studentCode: '', message: '' })
  const [msg, setMsg]   = useState({ type: '', text: '' })

  const submitMut = useMutation({
    mutationFn: submitRequest,
    onSuccess: (r) => {
      setMsg({ type: 'success', text: r.message })
      setForm({ studentCode: '', message: '' })
      qc.invalidateQueries(['myLinking'])
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to submit request.' }),
  })

  return (
    <Layout title="Link Student Account">
      <div className="page-header">
        <div>
          <h1 className="page-title">Link Student Account</h1>
          <p className="page-sub">Submit a request to link your account to a student record using their student code.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Submit form */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Link2 size={16} /> Submit Linking Request</span></div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={15} className="alert-icon" />
              Ask the school office for the student code. Once submitted, an admin will review and approve your request.
            </div>

            {msg.text && <div className={`alert alert-${msg.type}`}>{msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertCircle size={15} className="alert-icon" />}{msg.text}</div>}

            <form onSubmit={(e) => { e.preventDefault(); submitMut.mutate(form) }}>
              <div className="form-group">
                <label className="form-label">Student Code *</label>
                <input className="form-input" placeholder="e.g. STU001" value={form.studentCode}
                  onChange={(e) => setForm(p => ({ ...p, studentCode: e.target.value }))} required />
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  The unique code assigned to the student by the school.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <input className="form-input" placeholder="e.g. I am the parent of this student"
                  value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} maxLength={300} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                disabled={submitMut.isPending}>
                <Send size={15} /> {submitMut.isPending ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* My requests */}
        <div className="card">
          <div className="card-header"><span className="card-title">My Requests</span></div>
          {isLoading ? <div className="spinner" /> : (
            <div>
              {requests.length === 0 ? (
                <div className="card-body" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                  No requests submitted yet.
                </div>
              ) : (
                requests.map((r) => {
                  const cfg = statusConfig[r.status] || statusConfig.pending
                  const StatusIcon = cfg.icon
                  return (
                    <div key={r._id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            Student Code: <code style={{ background: 'var(--gray-100)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{r.studentCode}</code>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                            Submitted: {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                          {r.message && <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>{r.message}</div>}
                        </div>
                        <span className={`badge ${cfg.badge}`}><StatusIcon size={11} /> {cfg.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

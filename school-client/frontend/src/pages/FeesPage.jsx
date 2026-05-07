import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle,
  XCircle, AlertTriangle, Receipt, Link2, Upload, FileText, CreditCard,
} from 'lucide-react'
import { getStoredUser } from '../utils/auth'
import { getFeeInfo, deposit, withdraw } from '../services/feeService'
import Layout from '../components/Layout'
import RefreshBar from '../components/RefreshBar'

const statusConfig = {
  approved: { label: 'Paid',     badge: 'badge-success', icon: CheckCircle },
  pending:  { label: 'Pending',  badge: 'badge-warning', icon: Clock },
  rejected: { label: 'Rejected', badge: 'badge-danger',  icon: XCircle },
}

const chargeStatusConfig = {
  pending:  { label: 'Unpaid',   badge: 'badge-danger',  icon: AlertTriangle },
  approved: { label: 'Paid',     badge: 'badge-success', icon: CheckCircle },
  rejected: { label: 'Cancelled',badge: 'badge-info',    icon: XCircle },
}

export default function FeesPage() {
  const user      = getStoredUser()
  const studentId = user?.studentProfile || user?.children?.[0] || user?.id || null
  const qc        = useQueryClient()
  const fileRef   = useRef()

  const [activeTab, setActiveTab] = useState('overview')
  const [form, setForm]       = useState({ amount: '', description: '' })
  const [proofType, setProofType] = useState('link')
  const [proofLink, setProofLink] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [msg, setMsg]         = useState({ type: '', text: '' })

  const { data, isLoading } = useQuery({
    queryKey:        ['fees', studentId],
    queryFn:         () => getFeeInfo(studentId),
    enabled:         !!studentId,
    refetchInterval: 15000,
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) { setMsg({ type: 'danger', text: 'Only PDF, JPG, or PNG files are accepted.' }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'danger', text: 'File must be under 5MB.' }); return }
    const reader = new FileReader()
    reader.onload = (ev) => setProofFile({ name: file.name, base64: ev.target.result, mimeType: file.type })
    reader.readAsDataURL(file)
  }

  const buildProof = () => {
    if (proofType === 'link') return proofLink.trim() ? { type: 'link', value: proofLink.trim() } : null
    return proofFile ? { type: 'file', value: proofFile.base64, mimeType: proofFile.mimeType } : null
  }

  const depositMut = useMutation({
    mutationFn: () => deposit(studentId, Number(form.amount), form.description, buildProof()),
    onSuccess: () => {
      setMsg({ type: 'success', text: 'Payment submitted. Awaiting admin verification.' })
      setForm({ amount: '', description: '' }); setProofLink(''); setProofFile(null)
      if (fileRef.current) fileRef.current.value = ''
      qc.invalidateQueries(['fees', studentId])
    },
    onError: (err) => setMsg({ type: 'danger', text: err.response?.data?.message || 'Payment failed.' }),
  })

  const withdrawMut = useMutation({
    mutationFn: () => withdraw(studentId, Number(form.amount), form.description),
    onSuccess: () => {
      setMsg({ type: 'success', text: 'Refund request submitted. Awaiting admin approval.' })
      setForm({ amount: '', description: '' })
      qc.invalidateQueries(['fees', studentId])
    },
    onError: (err) => setMsg({ type: 'danger', text: err.response?.data?.message || 'Request failed.' }),
  })

  // Separate transaction types
  const allTx       = data?.transactions || []
  const charges     = allTx.filter(t => t.type === 'charge')
  const payments    = allTx.filter(t => t.type === 'deposit')
  const refunds     = allTx.filter(t => t.type === 'withdrawal')
  const unpaidCharges = charges.filter(t => t.status === 'pending')
  const totalOwed   = unpaidCharges.reduce((s, t) => s + t.amount, 0)
  const totalPaid   = payments.filter(t => t.status === 'approved').reduce((s, t) => s + t.amount, 0)
  const pendingPayments = payments.filter(t => t.status === 'pending').length

  if (!studentId) {
    return (
      <Layout title="Fees">
        <div className="alert alert-info">No student record linked. Contact the school admin.</div>
      </Layout>
    )
  }

  return (
    <Layout title="Fees">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-sub">View your outstanding fees, make payments, and track your history.</p>
        </div>
      </div>

      <RefreshBar queryKeys={[['fees', studentId]]} />

      {/* ── Outstanding fee alert ─────────────────────────────────────────── */}
      {unpaidCharges.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} className="alert-icon" />
          <div>
            <strong>You have {unpaidCharges.length} unpaid fee{unpaidCharges.length > 1 ? 's' : ''} totalling {totalOwed.toLocaleString()} RWF.</strong>
            {unpaidCharges.map((t, i) => (
              <span key={i} style={{ display: 'block', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
                • {t.description} — {t.amount.toLocaleString()} RWF
              </span>
            ))}
            <button className="btn btn-sm btn-danger" style={{ marginTop: '0.5rem' }}
              onClick={() => { setActiveTab('pay'); setForm({ amount: String(unpaidCharges[0]?.amount || ''), description: `Payment for: ${unpaidCharges[0]?.description || ''}` }) }}>
              Pay Now
            </button>
          </div>
        </div>
      )}

      {pendingPayments > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
          <Clock size={16} className="alert-icon" />
          You have <strong>{pendingPayments}</strong> payment{pendingPayments > 1 ? 's' : ''} awaiting admin verification.
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className={`stat-icon ${unpaidCharges.length > 0 ? 'stat-icon-danger' : 'stat-icon-success'}`}>
            <CreditCard size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Outstanding Fees</div>
            <div className="stat-value" style={{ color: unpaidCharges.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {totalOwed.toLocaleString()}
            </div>
            <div className="stat-sub" style={{ color: unpaidCharges.length > 0 ? 'var(--danger)' : 'var(--gray-400)' }}>
              {unpaidCharges.length > 0 ? `${unpaidCharges.length} unpaid fee${unpaidCharges.length > 1 ? 's' : ''}` : 'All fees paid'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><ArrowDownCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Paid</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{totalPaid.toLocaleString()}</div>
            <div className="stat-sub">RWF approved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${pendingPayments > 0 ? 'stat-icon-warning' : 'stat-icon-navy'}`}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: pendingPayments > 0 ? 'var(--warning)' : undefined }}>
              {pendingPayments}
            </div>
            <div className="stat-sub">awaiting admin</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'overview', icon: Receipt,         label: 'Overview' },
          { id: 'pay',      icon: ArrowDownCircle, label: 'Pay a Fee' },
          { id: 'refund',   icon: ArrowUpCircle,   label: 'Request Refund' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id}
            className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab(id); setMsg({ type: '', text: '' }) }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Outstanding charges */}
          {charges.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header">
                <span className="card-title"><CreditCard size={15} /> Fees Charged by School</span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {charges.map(tx => {
                      const cfg = chargeStatusConfig[tx.status] || chargeStatusConfig.pending
                      const Icon = cfg.icon
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ fontWeight: 500 }}>{tx.description}</td>
                          <td style={{ fontWeight: 700, color: tx.status === 'pending' ? 'var(--danger)' : 'var(--gray-600)' }}>
                            {tx.amount.toLocaleString()} RWF
                          </td>
                          <td>
                            <span className={`badge ${cfg.badge}`}>
                              <Icon size={11} /> {cfg.label}
                            </span>
                          </td>
                          <td>
                            {tx.status === 'pending' && (
                              <button className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setForm({ amount: String(tx.amount), description: `Payment for: ${tx.description}` })
                                  setActiveTab('pay')
                                }}>
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment history */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Receipt size={15} /> Payment History</span>
            </div>
            {isLoading ? <div className="spinner" /> : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Amount</th><th>Proof</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {[...payments, ...refunds].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(tx => {
                      const cfg = statusConfig[tx.status] || statusConfig.pending
                      const Icon = cfg.icon
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td>{tx.description}</td>
                          <td style={{ fontWeight: 600, color: tx.type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>
                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} RWF
                          </td>
                          <td>
                            {tx.proof?.value ? (
                              tx.proof.type === 'link'
                                ? <a href={tx.proof.value} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '0.8125rem' }}><Link2 size={13} /> View</a>
                                : <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}><FileText size={13} /> File</span>
                            ) : <span style={{ color: 'var(--gray-300)', fontSize: '0.8125rem' }}>—</span>}
                          </td>
                          <td>
                            <span className={`badge ${cfg.badge}`}><Icon size={11} /> {cfg.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {payments.length === 0 && refunds.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No payment history yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Pay a Fee tab ──────────────────────────────────────────────────── */}
      {activeTab === 'pay' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-header">
            <span className="card-title"><ArrowDownCircle size={16} /> Submit a Payment</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <FileText size={15} className="alert-icon" />
              Attach proof of payment (bank receipt, mobile money screenshot, or link).
              Your payment will be verified by the school admin.
            </div>

            {msg.text && (
              <div className={`alert alert-${msg.type}`}>
                {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertTriangle size={15} className="alert-icon" />}
                {msg.text}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); depositMut.mutate() }}>
              <div className="form-group">
                <label className="form-label">Amount (RWF) *</label>
                <input type="number" className="form-input" value={form.amount}
                  onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                  min="1" required placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Term 1 tuition fees" />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Proof *</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[{ id: 'link', icon: Link2, label: 'Paste a link' }, { id: 'file', icon: Upload, label: 'Upload file' }].map(({ id, icon: Icon, label }) => (
                    <button key={id} type="button"
                      className={`btn btn-sm ${proofType === id ? 'btn-navy' : 'btn-outline'}`}
                      onClick={() => { setProofType(id); setProofLink(''); setProofFile(null) }}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
                {proofType === 'link' && (
                  <input type="url" className="form-input" value={proofLink}
                    onChange={(e) => setProofLink(e.target.value)}
                    placeholder="https://... bank receipt or mobile money screenshot URL" required />
                )}
                {proofType === 'file' && (
                  <div>
                    <div onClick={() => fileRef.current?.click()}
                      style={{ border: `2px dashed ${proofFile ? 'var(--success)' : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: proofFile ? 'var(--success-light)' : 'var(--gray-50)' }}>
                      {proofFile ? (
                        <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <FileText size={20} />
                          <div><div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{proofFile.name}</div><div style={{ fontSize: '0.75rem' }}>Click to change</div></div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--gray-400)' }}>
                          <Upload size={24} style={{ margin: '0 auto 0.5rem' }} />
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Click to upload</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PDF, JPG, PNG — max 5MB</div>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileChange} />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-success"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                disabled={depositMut.isPending || (proofType === 'link' && !proofLink) || (proofType === 'file' && !proofFile)}>
                {depositMut.isPending ? 'Submitting…' : 'Submit Payment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Request Refund tab ─────────────────────────────────────────────── */}
      {activeTab === 'refund' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-header">
            <span className="card-title"><ArrowUpCircle size={16} /> Request a Refund</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <Clock size={15} className="alert-icon" />
              Refund requests require admin approval. Only previously approved payments can be refunded.
            </div>
            {msg.text && (
              <div className={`alert alert-${msg.type}`}>
                {msg.type === 'success' ? <CheckCircle size={15} className="alert-icon" /> : <AlertTriangle size={15} className="alert-icon" />}
                {msg.text}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); withdrawMut.mutate() }}>
              <div className="form-group">
                <label className="form-label">Amount (RWF) *</label>
                <input type="number" className="form-input" value={form.amount}
                  onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))}
                  min="1" required placeholder="e.g. 10000" />
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  Total paid: <strong>{totalPaid.toLocaleString()} RWF</strong>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Overpayment refund" required />
              </div>
              <button type="submit" className="btn btn-danger"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={withdrawMut.isPending || totalPaid <= 0}>
                {withdrawMut.isPending ? 'Submitting…' : 'Submit Refund Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}


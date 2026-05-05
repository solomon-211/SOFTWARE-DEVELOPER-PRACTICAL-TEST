import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Wallet, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle,
  XCircle, AlertTriangle, Receipt, Link2, Upload, FileText, Eye,
} from 'lucide-react'
import { getStoredUser } from '../utils/auth'
import { getFeeInfo, deposit, withdraw } from '../services/feeService'
import Layout from '../components/Layout'
import RefreshBar from '../components/RefreshBar'

const LOW_BALANCE_THRESHOLD = 5000

const statusConfig = {
  approved: { label: 'Approved', badge: 'badge-success', icon: CheckCircle },
  pending:  { label: 'Pending',  badge: 'badge-warning', icon: Clock },
  rejected: { label: 'Rejected', badge: 'badge-danger',  icon: XCircle },
}

export default function FeesPage() {
  const user      = getStoredUser()
  const studentId = user?.studentProfile || user?.children?.[0] || null
  const qc        = useQueryClient()
  const fileRef   = useRef()

  const [activeTab, setActiveTab] = useState('history')
  const [form, setForm]     = useState({ amount: '', description: '' })
  const [proofType, setProofType] = useState('link')   // 'link' | 'file'
  const [proofLink, setProofLink] = useState('')
  const [proofFile, setProofFile] = useState(null)     // { name, base64, mimeType }
  const [msg, setMsg]       = useState({ type: '', text: '' })

  const { data, isLoading } = useQuery({
    queryKey:        ['fees', studentId],
    queryFn:         () => getFeeInfo(studentId),
    enabled:         !!studentId,
    refetchInterval: 15000,
  })

  // Convert file to base64 for storage
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) {
      setMsg({ type: 'danger', text: 'Only PDF, JPG, or PNG files are accepted.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ type: 'danger', text: 'File must be under 5MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProofFile({ name: file.name, base64: ev.target.result, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const buildProof = () => {
    if (proofType === 'link') {
      if (!proofLink.trim()) return null
      return { type: 'link', value: proofLink.trim() }
    }
    if (!proofFile) return null
    return { type: 'file', value: proofFile.base64, mimeType: proofFile.mimeType }
  }

  const depositMut = useMutation({
    mutationFn: () => {
      const proof = buildProof()
      return deposit(studentId, Number(form.amount), form.description, proof)
    },
    onSuccess: () => {
      setMsg({ type: 'success', text: 'Payment submitted with proof. Awaiting admin verification.' })
      setForm({ amount: '', description: '' })
      setProofLink(''); setProofFile(null)
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

  const balance = data?.balance ?? 0
  const isLow   = balance < LOW_BALANCE_THRESHOLD
  const pending = data?.transactions?.filter(t => t.status === 'pending').length || 0

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
          <p className="page-sub">View your balance, make payments, and request refunds.</p>
        </div>
      </div>

      <RefreshBar queryKeys={[['fees', studentId]]} />

      {isLow && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          Low balance: <strong>{balance.toLocaleString()} RWF</strong>. Please make a payment soon.
        </div>
      )}
      {pending > 0 && (
        <div className="alert alert-info">
          <Clock size={16} className="alert-icon" />
          You have <strong>{pending}</strong> transaction{pending > 1 ? 's' : ''} awaiting admin review.
        </div>
      )}

      {/* Balance summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className={`stat-icon ${isLow ? 'stat-icon-danger' : 'stat-icon-success'}`}><Wallet size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Current Balance</div>
            <div className="stat-value" style={{ color: isLow ? 'var(--danger)' : 'var(--success)' }}>
              {balance.toLocaleString()}
            </div>
            <div className="stat-sub">RWF</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><ArrowDownCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Approved</div>
            <div className="stat-value">
              {(data?.transactions?.filter(t => t.type === 'deposit' && t.status === 'approved')
                .reduce((s, t) => s + t.amount, 0) || 0).toLocaleString()}
            </div>
            <div className="stat-sub">RWF deposited</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-warning"><Clock size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{pending}</div>
            <div className="stat-sub">transactions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'history',  icon: Receipt,         label: 'Transaction History' },
          { id: 'deposit',  icon: ArrowDownCircle, label: 'Pay Fees' },
          { id: 'withdraw', icon: ArrowUpCircle,   label: 'Request Refund' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id}
            className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTab(id); setMsg({ type: '', text: '' }) }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Receipt size={16} /> Transaction History</span>
          </div>
          {isLoading ? <div className="spinner" /> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Description</th><th>Type</th>
                    <th>Amount</th><th>Proof</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.transactions?.map((tx) => {
                    const cfg = statusConfig[tx.status] || statusConfig.pending
                    const StatusIcon = cfg.icon
                    return (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td>{tx.description}</td>
                        <td>
                          <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : 'badge-info'}`}>
                            {tx.type === 'deposit'
                              ? <><ArrowDownCircle size={11} /> deposit</>
                              : <><ArrowUpCircle size={11} /> refund</>}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: tx.type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>
                          {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} RWF
                        </td>
                        <td>
                          {tx.proof?.value ? (
                            tx.proof.type === 'link' ? (
                              <a href={tx.proof.value} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontSize: '0.8125rem' }}>
                                <Link2 size={13} /> View link
                              </a>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--gray-500)', fontSize: '0.8125rem' }}>
                                <FileText size={13} /> File uploaded
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--gray-300)', fontSize: '0.8125rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${cfg.badge}`}>
                            <StatusIcon size={11} /> {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!data?.transactions?.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pay Fees */}
      {activeTab === 'deposit' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-header">
            <span className="card-title"><ArrowDownCircle size={16} /> Make a Payment</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <FileText size={15} className="alert-icon" />
              You must attach proof of payment (bank receipt, mobile money screenshot, or payment link).
              Your balance will be updated after admin verification.
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
                  min="1" required placeholder="e.g. 50000" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Term 1 tuition fees" />
              </div>

              {/* Proof section */}
              <div className="form-group">
                <label className="form-label">Payment Proof *</label>

                {/* Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { id: 'link', icon: Link2,   label: 'Paste a link' },
                    { id: 'file', icon: Upload,  label: 'Upload file' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} type="button"
                      className={`btn btn-sm ${proofType === id ? 'btn-navy' : 'btn-outline'}`}
                      onClick={() => { setProofType(id); setProofLink(''); setProofFile(null) }}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {proofType === 'link' && (
                  <div style={{ position: 'relative' }}>
                    <Link2 size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                    <input type="url" className="form-input" style={{ paddingLeft: '2.25rem' }}
                      value={proofLink}
                      onChange={(e) => setProofLink(e.target.value)}
                      placeholder="https://drive.google.com/... or bank receipt URL"
                      required
                    />
                  </div>
                )}

                {proofType === 'file' && (
                  <div>
                    <div
                      onClick={() => fileRef.current?.click()}
                      style={{
                        border: `2px dashed ${proofFile ? 'var(--success)' : 'var(--gray-200)'}`,
                        borderRadius: 'var(--radius)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: proofFile ? 'var(--success-light)' : 'var(--gray-50)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {proofFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                          <FileText size={20} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{proofFile.name}</div>
                            <div style={{ fontSize: '0.75rem' }}>Click to change</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--gray-400)' }}>
                          <Upload size={24} style={{ margin: '0 auto 0.5rem' }} />
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Click to upload</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PDF, JPG, PNG — max 5MB</div>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }} onChange={handleFileChange} />
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

      {/* Request Refund */}
      {activeTab === 'withdraw' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card-header">
            <span className="card-title"><ArrowUpCircle size={16} /> Request a Refund</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <Clock size={15} className="alert-icon" />
              Refund requests require admin approval. Your balance will be deducted once approved.
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
                  min="1" max={balance} required placeholder="e.g. 10000" />
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  Available balance: <strong>{balance.toLocaleString()} RWF</strong>
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
                disabled={withdrawMut.isPending || balance <= 0}>
                {withdrawMut.isPending ? 'Submitting…' : 'Submit Refund Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

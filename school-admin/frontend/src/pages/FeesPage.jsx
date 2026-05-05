import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, CheckCircle, XCircle, Clock, Link2,
  FileText, Eye, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
} from 'lucide-react'
import { getTransactions, getFeeStats, processWithdrawal } from '../services/adminService'
import Layout from '../components/Layout'

const statusConfig = {
  approved: { badge: 'badge-success', icon: CheckCircle, label: 'Approved' },
  pending:  { badge: 'badge-warning', icon: Clock,        label: 'Pending'  },
  rejected: { badge: 'badge-danger',  icon: XCircle,      label: 'Rejected' },
}

export default function FeesPage() {
  const qc = useQueryClient()
  const [filter, setFilter]       = useState('')
  const [msg, setMsg]             = useState({ type: '', text: '' })
  const [viewProof, setViewProof] = useState(null) // transaction with proof to preview

  const { data: stats } = useQuery({
    queryKey: ['feeStats'], queryFn: getFeeStats, refetchInterval: 15000,
  })
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn:  () => getTransactions(filter ? { status: filter } : {}),
    refetchInterval: 15000,
  })

  const processMut = useMutation({
    mutationFn: ({ txId, action }) => processWithdrawal(txId, action),
    onSuccess: (res) => {
      setMsg({ type: 'success', text: res.message })
      qc.invalidateQueries(['transactions'])
      qc.invalidateQueries(['feeStats'])
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed' }),
  })

  return (
    <Layout title="Fee Management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-sub">Review payment proofs, approve deposits, and process refund requests.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={16} className="alert-icon" /> : <AlertTriangle size={16} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-success"><ArrowDownCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {stats?.totalDeposited?.toLocaleString() || 0}
            </div>
            <div className="stat-sub">RWF approved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-danger"><ArrowUpCircle size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Refunded</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {stats?.totalWithdrawn?.toLocaleString() || 0}
            </div>
            <div className="stat-sub">RWF refunded</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${stats?.pendingWithdrawals > 0 ? 'stat-icon-warning' : 'stat-icon-navy'}`}>
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: stats?.pendingWithdrawals > 0 ? 'var(--warning)' : undefined }}>
              {stats?.pendingWithdrawals || 0}
            </div>
            <div className="stat-sub">need action</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(val)}>
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><CreditCard size={16} /> Transactions</span>
        </div>
        {isLoading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Student</th><th>Type</th><th>Amount</th>
                  <th>Description</th><th>Proof</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx) => {
                  const cfg = statusConfig[tx.status] || statusConfig.pending
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {tx.student?.firstName} {tx.student?.lastName}
                        {tx.student?.studentCode && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{tx.student.studentCode}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${tx.type === 'deposit' ? 'badge-success' : 'badge-info'}`}>
                          {tx.type === 'deposit'
                            ? <><ArrowDownCircle size={11} /> deposit</>
                            : <><ArrowUpCircle size={11} /> refund</>}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.amount?.toLocaleString()} RWF</td>
                      <td style={{ color: 'var(--gray-600)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.description || '—'}
                      </td>
                      <td>
                        {tx.proof?.value ? (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ gap: '0.3rem' }}
                            onClick={() => setViewProof(tx)}
                          >
                            <Eye size={13} /> View Proof
                          </button>
                        ) : (
                          <span style={{ color: 'var(--gray-300)', fontSize: '0.8125rem' }}>No proof</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${cfg.badge}`}>
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td>
                        {tx.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-success btn-sm"
                              disabled={processMut.isPending}
                              onClick={() => processMut.mutate({ txId: tx.id, action: 'approve' })}>
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button className="btn btn-outline btn-sm"
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                              disabled={processMut.isPending}
                              onClick={() => processMut.mutate({ txId: tx.id, action: 'reject' })}>
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {!transactions?.length && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof Preview Modal */}
      {viewProof && (
        <div className="modal-overlay" onClick={() => setViewProof(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Payment Proof</h2>

            <div style={{ marginBottom: '1rem', padding: '0.875rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Student</span>
                <span style={{ fontWeight: 600 }}>{viewProof.student?.firstName} {viewProof.student?.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>Amount</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{viewProof.amount?.toLocaleString()} RWF</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Description</span>
                <span>{viewProof.description || '—'}</span>
              </div>
            </div>

            {viewProof.proof?.type === 'link' ? (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Payment link provided:</div>
                <a
                  href={viewProof.proof.value}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem', background: 'var(--primary-light)',
                    borderRadius: 'var(--radius)', color: 'var(--primary)',
                    fontWeight: 500, wordBreak: 'break-all',
                  }}
                >
                  <Link2 size={16} style={{ flexShrink: 0 }} />
                  {viewProof.proof.value}
                </a>
              </div>
            ) : viewProof.proof?.mimeType?.startsWith('image/') ? (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Uploaded image:</div>
                <img
                  src={viewProof.proof.value}
                  alt="Payment proof"
                  style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}
                />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Uploaded PDF:</div>
                <a
                  href={viewProof.proof.value}
                  download="payment-proof.pdf"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem', background: 'var(--gray-50)',
                    borderRadius: 'var(--radius)', color: 'var(--navy)',
                    fontWeight: 500,
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--danger)' }} />
                  Download PDF receipt
                </a>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setViewProof(null)}>Close</button>
              {viewProof.status === 'pending' && (
                <>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => { processMut.mutate({ txId: viewProof.id, action: 'reject' }); setViewProof(null) }}>
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="btn btn-success"
                    onClick={() => { processMut.mutate({ txId: viewProof.id, action: 'approve' }); setViewProof(null) }}>
                    <CheckCircle size={14} /> Approve Payment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

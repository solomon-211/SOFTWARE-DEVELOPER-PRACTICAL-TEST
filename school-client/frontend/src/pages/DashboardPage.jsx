import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, BookOpen, Receipt, AlertTriangle, ArrowRight } from 'lucide-react'
import { getStoredUser } from '../utils/auth'
import { getFeeInfo } from '../services/feeService'
import { getGrades, getAttendance } from '../services/academicService'
import Layout from '../components/Layout'
import RefreshBar from '../components/RefreshBar'

const LOW_BALANCE = 5000

export default function DashboardPage() {
  const user = getStoredUser()
  // studentProfile can be an ObjectId string or null
  const studentId = user?.studentProfile || user?.children?.[0] || user?.id || null

  const { data: feeData }    = useQuery({ queryKey: ['fees', studentId],       queryFn: () => getFeeInfo(studentId),    enabled: !!studentId })
  const { data: grades }     = useQuery({ queryKey: ['grades', studentId],     queryFn: () => getGrades(studentId),     enabled: !!studentId })
  const { data: attendance } = useQuery({ queryKey: ['attendance', studentId], queryFn: () => getAttendance(studentId), enabled: !!studentId })

  const balance  = feeData?.balance ?? 0
  const isLow    = balance < LOW_BALANCE
  const present  = attendance?.filter(a => a.status === 'present').length || 0
  const total    = attendance?.length || 0
  const attRate  = total ? Math.round((present / total) * 100) : 0
  const recentTx = feeData?.transactions?.slice(0, 5) || []
  const recentGr = grades?.slice(-4) || []

  // Outstanding charges — admin-created fees the student hasn't paid yet
  const outstanding = (feeData?.transactions || []).filter(
    t => t.type === 'charge' && t.status === 'pending'
  )
  const totalOwed   = outstanding.reduce((s, t) => s + t.amount, 0)
  const totalPaid   = (feeData?.transactions || [])
    .filter(t => t.type === 'deposit' && t.status === 'approved')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Welcome, {user?.firstName}</h1>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem',
              borderRadius: 20, textTransform: 'capitalize',
              background: user?.role === 'parent' ? 'var(--primary-light)' : 'var(--success-light)',
              color: user?.role === 'parent' ? 'var(--primary)' : 'var(--success)',
            }}>
              {user?.role}
            </span>
          </div>
          <p className="page-sub">
            {user?.role === 'parent' ? 'Parent portal' : 'Student portal'} — here's your school activity overview.
          </p>
        </div>
      </div>

      <RefreshBar queryKeys={[['fees', studentId], ['grades', studentId], ['attendance', studentId]]} />

      {!studentId && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} className="alert-icon" />
          <div>
            <strong>No student record linked yet.</strong> Your account needs to be linked to a student record by the school admin before your grades, fees, and attendance appear here.
            Contact the school office if this is unexpected.
          </div>
        </div>
      )}

      {/* Outstanding fee alert — shown prominently when admin has charged fees */}
      {outstanding.length > 0 && studentId && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} className="alert-icon" />
          <div>
            <strong>Unpaid fee{outstanding.length > 1 ? 's' : ''}:</strong>{' '}
            You have been charged <strong>{totalOwed.toLocaleString()} RWF</strong> by the school.
            {outstanding.map((t, i) => (
              <span key={i} style={{ display: 'block', fontSize: '0.8125rem', marginTop: '0.2rem', color: 'var(--gray-700)' }}>
                • {t.description} — {t.amount.toLocaleString()} RWF
              </span>
            ))}
            {' '}<Link to="/fees" style={{ fontWeight: 600, textDecoration: 'underline', display: 'inline-block', marginTop: '0.375rem' }}>
              Pay Now →
            </Link>
          </div>
        </div>
      )}

      {isLow && outstanding.length === 0 && studentId && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <div>
            <strong>Low fee balance:</strong> Your balance is <strong>{balance.toLocaleString()} RWF</strong>.
            {' '}<Link to="/fees" style={{ fontWeight: 600, textDecoration: 'underline' }}>Make a payment</Link>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'stretch' }}>
        <div className="stat-card" style={{ alignItems: 'stretch', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div className={`stat-icon ${outstanding.length > 0 ? 'stat-icon-danger' : 'stat-icon-success'}`}><Wallet size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Outstanding Fees</div>
              <div className="stat-value" style={{ color: outstanding.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{totalOwed.toLocaleString()}</div>
              <div className="stat-sub" style={{ color: outstanding.length > 0 ? 'var(--danger)' : undefined }}>
                {outstanding.length > 0 ? `${outstanding.length} unpaid fee${outstanding.length > 1 ? 's' : ''}` : 'All fees paid ✓'}
              </div>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ alignItems: 'stretch', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div className="stat-icon stat-icon-orange"><TrendingUp size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-value">{attRate}%</div>
              <div className="stat-sub">{present} / {total} days</div>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ alignItems: 'stretch', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div className="stat-icon stat-icon-navy"><BookOpen size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Subjects</div>
              <div className="stat-value">{grades?.length || 0}</div>
              <div className="stat-sub">Recorded grades</div>
            </div>
          </div>
        </div>
        <div className="stat-card" style={{ alignItems: 'stretch', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div className="stat-icon stat-icon-info"><Receipt size={20} /></div>
            <div className="stat-content">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{feeData?.transactions?.length || 0}</div>
              <div className="stat-sub">Total payments</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Receipt size={16} /> Recent Payments</span>
            <Link to="/fees" style={{ fontSize: '0.8125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: '0.5rem 0' }}>
            {recentTx.length ? recentTx.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{tx.description}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: tx.type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} RWF
                  </div>
                  <span className={`badge badge-${tx.status === 'approved' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>No transactions yet.</div>
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><BookOpen size={16} /> Recent Grades</span>
            <Link to="/grades" style={{ fontSize: '0.8125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: '0.5rem 0' }}>
            {recentGr.length ? recentGr.map((g, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{g.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{g.term}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: g.score >= 80 ? 'var(--success)' : g.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{g.grade}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{g.score}%</div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.875rem' }}>No grades recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}


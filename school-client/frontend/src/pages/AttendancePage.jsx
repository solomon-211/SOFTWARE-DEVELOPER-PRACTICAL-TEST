import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, CheckCircle, XCircle, Clock, School, User, CalendarDays } from 'lucide-react'
import { getStoredUser } from '../utils/auth'
import { getAttendance, getStudentProfile } from '../services/academicService'
import Layout from '../components/Layout'
import RefreshBar from '../components/RefreshBar'

const statusConfig = {
  present: { badge: 'badge-success', icon: CheckCircle, label: 'Present' },
  absent:  { badge: 'badge-danger',  icon: XCircle,     label: 'Absent'  },
  late:    { badge: 'badge-warning', icon: Clock,       label: 'Late'    },
  excused: { badge: 'badge-info',    icon: Clock,       label: 'Excused' },
}

export default function AttendancePage() {
  const user      = getStoredUser()
  const studentId = user?.studentProfile || user?.children?.[0] || user?.id || null

  const { data: records, isLoading } = useQuery({
    queryKey:        ['attendance', studentId],
    queryFn:         () => getAttendance(studentId),
    enabled:         !!studentId,
    refetchInterval: 30000,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', studentId],
    queryFn:  () => getStudentProfile(studentId),
    enabled:  !!studentId,
  })

  if (!studentId) {
    return (
      <Layout title="Attendance">
        <div className="alert alert-info">No student profile linked. Contact admin.</div>
      </Layout>
    )
  }

  const total   = records?.length || 0
  const present = records?.filter(r => r.status === 'present').length || 0
  const absent  = records?.filter(r => r.status === 'absent').length  || 0
  const late    = records?.filter(r => r.status === 'late').length    || 0
  const excused = records?.filter(r => r.status === 'excused').length || 0
  const rate    = total ? Math.round((present / total) * 100) : 0

  const className   = profile?.class?.name || 'Not assigned'
  const studentName = profile ? `${profile.firstName} ${profile.lastName}` : ''

  return (
    <Layout title="Attendance">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Records</h1>
          <p className="page-sub">Daily attendance history for {studentName}.</p>
        </div>
      </div>

      <RefreshBar queryKeys={[['attendance', studentId]]} />

      {/* Class + student info banner */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <School size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Class</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--navy)' }}>{className}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: '#e8edf5', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Student</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--navy)' }}>{studentName || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Attendance Rate</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                {rate}% <span style={{ fontWeight: 400, fontSize: '0.8125rem', color: 'var(--gray-400)' }}>({present}/{total} days)</span>
              </div>
            </div>
          </div>

          {rate < 80 && total > 0 && (
            <div className="alert alert-warning" style={{ margin: 0, padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}>
              Attendance below 80% — {80 - rate}% improvement needed.
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        {[
          { label: 'Present', value: present, icon: CheckCircle, variant: 'stat-icon-success' },
          { label: 'Absent',  value: absent,  icon: XCircle,     variant: 'stat-icon-danger'  },
          { label: 'Late',    value: late,    icon: Clock,       variant: 'stat-icon-warning' },
          { label: 'Excused', value: excused, icon: Clock,       variant: 'stat-icon-info'    },
        ].map(({ label, value, icon: Icon, variant }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${variant}`}><Icon size={18} /></div>
            <div className="stat-content">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-sub">{total ? Math.round((value / total) * 100) : 0}% of total</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance log */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><CalendarDays size={16} /> Attendance Log</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>{total} records</span>
        </div>
        {isLoading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records?.slice().reverse().map((r, i) => {
                  const d   = new Date(r.date)
                  const cfg = statusConfig[r.status] || statusConfig.present
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{d.toLocaleDateString('en-US', { weekday: 'long' })}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                          <School size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          {className}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${cfg.badge}`}>
                          <StatusIcon size={11} /> {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!records?.length && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}


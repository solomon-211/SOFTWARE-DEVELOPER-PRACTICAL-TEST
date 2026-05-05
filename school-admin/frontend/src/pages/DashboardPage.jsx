import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Users, School, CreditCard,
  Smartphone, TrendingUp, AlertTriangle, ArrowRight,
  BookOpen, CalendarCheck,
} from 'lucide-react'
import { getDashboardStats } from '../services/adminService'
import { getStoredUser } from '../services/authService'
import Layout from '../components/Layout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ── Teacher dashboard ─────────────────────────────────────────────────────────
function TeacherDashboard({ user }) {
  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.firstName}</h1>
          <p className="page-sub">Teacher portal — manage your students' grades and attendance.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-orange"><GraduationCap size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Your Role</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>Teacher</div>
            <div className="stat-sub">Staff account</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-navy"><School size={20} /></div>
          <div className="stat-content">
            <div className="stat-label">Access Level</div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>Limited</div>
            <div className="stat-sub">Grades & attendance only</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/students" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> Update Student Grades
            </span>
            <ArrowRight size={15} />
          </Link>
          <Link to="/students" className="btn btn-navy" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={16} /> Mark Attendance
            </span>
            <ArrowRight size={15} />
          </Link>
          <Link to="/classes" className="btn btn-outline" style={{ justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={16} /> View Classes
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <Smartphone size={16} className="alert-icon" />
        You have teacher-level access. Contact an administrator for account or fee management.
      </div>
    </Layout>
  )
}

// ── Admin dashboard ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  })

  const feeChartData = stats ? [
    { name: 'Collected', value: stats.fees.totalCollected, color: '#f97316' },
    { name: 'Refunded',  value: stats.fees.totalRefunded,  color: '#0f172a' },
  ] : []

  const statCards = stats ? [
    { label: 'Total Students',  value: stats.totalStudents,  icon: GraduationCap, variant: 'orange' },
    { label: 'Teachers',        value: stats.totalTeachers,  icon: Users,         variant: 'navy' },
    { label: 'Classes',         value: stats.totalClasses,   icon: School,        variant: 'info' },
    { label: 'Parents',         value: stats.totalParents,   icon: Users,         variant: 'success' },
    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: TrendingUp, variant: 'success' },
    { label: 'Pending Devices', value: stats.pendingDeviceVerifications, icon: Smartphone,
      variant: stats.pendingDeviceVerifications > 0 ? 'danger' : 'navy' },
  ] : []

  return (
    <Layout title="Dashboard">
      {isLoading ? <div className="spinner" /> : (
        <>
          {stats?.pendingDeviceVerifications > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              <AlertTriangle size={16} className="alert-icon" />
              <div>
                <strong>{stats.pendingDeviceVerifications} device(s)</strong> are pending verification.{' '}
                <Link to="/devices" style={{ fontWeight: 600, textDecoration: 'underline' }}>Review now</Link>
              </div>
            </div>
          )}

          <div className="stats-grid">
            {statCards.map((s) => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon stat-icon-${s.variant}`}><s.icon size={20} /></div>
                <div className="stat-content">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><CreditCard size={16} /> Fee Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Total Collected</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {stats?.fees.totalCollected.toLocaleString()} RWF
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Total Refunded</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)' }}>
                      {stats?.fees.totalRefunded.toLocaleString()} RWF
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={feeChartData} barSize={48}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--gray-400)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => [`${v.toLocaleString()} RWF`]}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--gray-200)', fontSize: 13 }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {feeChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Quick Actions</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { to: '/devices',  label: `Verify Pending Devices (${stats?.pendingDeviceVerifications || 0})`, icon: Smartphone, variant: 'btn-primary' },
                  { to: '/students', label: 'Manage Students',     icon: GraduationCap, variant: 'btn-navy' },
                  { to: '/classes',  label: 'Manage Classes',      icon: School,        variant: 'btn-outline' },
                  { to: '/fees',     label: 'Review Fee Requests', icon: CreditCard,    variant: 'btn-outline' },
                ].map(({ to, label, icon: Icon, variant }) => (
                  <Link key={to} to={to} className={`btn ${variant}`} style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={16} /> {label}
                    </span>
                    <ArrowRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = getStoredUser()
  if (user?.role === 'teacher') return <TeacherDashboard user={user} />
  return <AdminDashboard />
}

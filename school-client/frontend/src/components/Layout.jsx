import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, BookOpen, CalendarDays,
  Clock, User, LogOut, GraduationCap, Link2,
} from 'lucide-react'
import { logout } from '../services/authService'
import { getStoredUser } from '../utils/auth'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/fees',         icon: CreditCard,      label: 'Fees' },
  { to: '/grades',       icon: BookOpen,        label: 'Grades' },
  { to: '/attendance',   icon: CalendarDays,    label: 'Attendance' },
  { to: '/timetable',    icon: Clock,           label: 'Timetable' },
  { to: '/link-account', icon: Link2,           label: 'Link Account' },
  { to: '/profile',      icon: User,            label: 'Profile' },
]

export default function Layout({ children, title }) {
  const user = getStoredUser()
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U'
  const roleLabel = user?.role === 'student' ? 'Student' : user?.role === 'parent' ? 'Parent' : 'Portal'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="sidebar-logo-text">SchoolPortal</div>
            <div className="sidebar-logo-sub">{roleLabel} Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon"><Icon size={17} /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}
            style={{ width: '100%', color: 'var(--gray-400)', justifyContent: 'flex-start', gap: '0.5rem' }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        {title && (
          <div className="topbar">
            <span className="topbar-title">{title}</span>
          </div>
        )}
        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}

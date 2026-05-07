import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, AlertTriangle } from 'lucide-react'
import { getStoredUser } from '../utils/auth'
import { getTimetable, getStudentProfile } from '../services/academicService'
import Layout from '../components/Layout'
import RefreshBar from '../components/RefreshBar'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const DAY_COLORS = {
  Monday:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' },
  Tuesday:   { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  Wednesday: { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce' },
  Thursday:  { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  Friday:    { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
}

export default function TimetablePage() {
  const user = getStoredUser()

  // studentId: the student record ID (from studentProfile or first child)
  // lookupId: what we pass to the backend — student record ID if available,
  //           otherwise the user's own account ID (backend will find student by userId)
  const studentId = user?.studentProfile || user?.children?.[0] || null
  const lookupId  = studentId || user?.id || null

  const { data: timetable, isLoading } = useQuery({
    queryKey: ['timetable', lookupId],
    queryFn:  () => getTimetable(lookupId),
    enabled:  !!lookupId,
    refetchInterval: 30000,
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', lookupId],
    queryFn:  () => getStudentProfile(lookupId),
    enabled:  !!lookupId,
  })

  if (!lookupId) {
    return (
      <Layout title="Timetable">
        <div className="alert alert-info">No student profile linked. Contact the school admin.</div>
      </Layout>
    )
  }

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = (timetable || [])
      .filter(t => t.day === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    return acc
  }, {})

  const totalSlots = (timetable || []).length

  return (
    <Layout title="Timetable">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class Timetable</h1>
          <p className="page-sub">
            {profile?.class?.name
              ? `Weekly schedule for ${profile.class.name}`
              : 'Weekly schedule for all subjects.'}
          </p>
        </div>
        {totalSlots > 0 && (
          <span className="badge badge-info" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.875rem' }}>
            <Clock size={13} /> {totalSlots} slot{totalSlots !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <RefreshBar queryKeys={[['timetable', lookupId]]} />

      {isLoading ? (
        <div className="spinner" />
      ) : totalSlots === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
          <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No timetable set yet</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {profile?.class?.name
              ? `The timetable for ${profile.class.name} hasn't been configured by the school admin yet.`
              : 'Your class timetable hasn\'t been configured yet.'}
          </p>
          {!profile?.class && (
            <div className="alert alert-warning" style={{ maxWidth: 400, margin: '1rem auto 0' }}>
              <AlertTriangle size={15} className="alert-icon" />
              You are not assigned to a class. Contact the school admin.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {DAYS.map(day => {
            const slots  = byDay[day]
            const colors = DAY_COLORS[day]
            return (
              <div key={day} className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  background: colors.bg,
                  borderBottom: `2px solid ${colors.border}`,
                  padding: '0.625rem 1rem',
                }}>
                  <h3 style={{
                    fontSize: '0.8125rem', fontWeight: 700,
                    color: colors.text, textTransform: 'uppercase',
                    letterSpacing: '0.06em', margin: 0,
                  }}>
                    {day}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: colors.text, opacity: 0.7, marginTop: '0.1rem' }}>
                    {slots.length} class{slots.length !== 1 ? 'es' : ''}
                  </div>
                </div>

                <div style={{ padding: '0.625rem' }}>
                  {slots.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--gray-300)', textAlign: 'center', padding: '1rem 0' }}>
                      Free day
                    </p>
                  ) : (
                    slots.map((slot, i) => (
                      <div key={i} style={{
                        borderLeft: `3px solid ${colors.border}`,
                        background: colors.bg,
                        borderRadius: '0 6px 6px 0',
                        padding: '0.5rem 0.75rem',
                        marginBottom: i < slots.length - 1 ? '0.5rem' : 0,
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--navy)' }}>
                          {slot.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} />
                          {slot.startTime} – {slot.endTime}
                        </div>
                        {slot.room && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.1rem' }}>
                            Room {slot.room}
                          </div>
                        )}
                        {slot.teacher && (
                          <div style={{ fontSize: '0.7rem', color: colors.text, marginTop: '0.15rem', fontWeight: 500 }}>
                            {slot.teacher.firstName} {slot.teacher.lastName}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

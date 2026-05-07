import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, CheckCircle, AlertCircle, Users } from 'lucide-react'
import api from '../services/api'
import { getClasses, getStudents } from '../services/adminService'
import Layout from '../components/Layout'

const bulkMark = (data) => api.post('/students/bulk-attendance', data).then(r => r.data)

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', bg: 'var(--success)',       color: 'white' },
  { value: 'absent',  label: 'Absent',  bg: 'var(--danger)',        color: 'white' },
  { value: 'late',    label: 'Late',    bg: 'var(--warning)',       color: 'white' },
  { value: 'excused', label: 'Excused', bg: 'var(--info)',          color: 'white' },
]

const STATUS_BADGE = {
  present: 'badge-success',
  absent:  'badge-danger',
  late:    'badge-warning',
  excused: 'badge-info',
}

export default function BulkAttendancePage() {
  const qc = useQueryClient()
  const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: getClasses })

  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0])
  const [defaultStatus, setDefaultStatus] = useState('present')
  const [overrides, setOverrides]         = useState({}) // { studentId: status }
  const [msg, setMsg] = useState({ type: '', text: '' })

  const { data: students = [] } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn:  () => getStudents({ classId: selectedClass }),
    enabled:  !!selectedClass,
  })

  // When class or defaultStatus changes, reset overrides
  const handleClassChange = (classId) => {
    setSelectedClass(classId)
    setOverrides({})
    setMsg({ type: '', text: '' })
  }

  const handleDefaultChange = (status) => {
    setDefaultStatus(status)
    setOverrides({}) // reset individual overrides when default changes
  }

  const setStudentStatus = (studentId, status) => {
    setOverrides(prev => {
      const currentOverride = prev[studentId]
      // If the chosen status equals the current default, remove any override
      if (status === defaultStatus) {
        const { [studentId]: _removed, ...rest } = prev
        return rest
      }
      // Toggle: if the student already has the same override, remove it
      if (currentOverride === status) {
        const { [studentId]: _removed, ...rest } = prev
        return rest
      }
      // Otherwise set the override
      return { ...prev, [studentId]: status }
    })
  }

  const getStudentStatus = (studentId) => overrides[studentId] || defaultStatus

  const markMut = useMutation({
    mutationFn: bulkMark,
    onSuccess: (r) => {
      setMsg({ type: 'success', text: r.message })
      setOverrides({})
      qc.invalidateQueries(['students'])
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedClass) { setMsg({ type: 'danger', text: 'Please select a class.' }); return }
    const overrideList = Object.entries(overrides).map(([studentId, status]) => ({ studentId, status }))
    markMut.mutate({ classId: selectedClass, date, defaultStatus, overrides: overrideList })
  }

  // Count by status
  const counts = students.reduce((acc, s) => {
    const st = getStudentStatus(s.id)
    acc[st] = (acc[st] || 0) + 1
    return acc
  }, {})

  return (
    <Layout title="Bulk Attendance">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk Attendance</h1>
          <p className="page-sub">Mark attendance for an entire class at once.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          {msg.type === 'success'
            ? <CheckCircle size={15} className="alert-icon" />
            : <AlertCircle size={15} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Session setup */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <span className="card-title"><CalendarCheck size={16} /> Session Setup</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 1rem' }}>
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select className="form-input" value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)} required>
                  <option value="">Select a class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={date}
                  onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Default Status (applied to all)</label>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      className="btn btn-sm"
                      style={{
                        background: defaultStatus === opt.value ? opt.bg : 'var(--gray-100)',
                        color:      defaultStatus === opt.value ? opt.color : 'var(--gray-600)',
                        border:     'none',
                        fontWeight: defaultStatus === opt.value ? 600 : 400,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => handleDefaultChange(opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary badges */}
        {selectedClass && students.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(opt => (
              <div key={opt.value} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)',
                fontSize: '0.8125rem',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.bg, flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{counts[opt.value] || 0}</span>
                <span style={{ color: 'var(--gray-500)' }}>{opt.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Student table */}
        {selectedClass && students.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <span className="card-title"><Users size={16} /> Students ({students.length})</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>
                Click an action to override a student's status
              </span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const current = getStudentStatus(s.id)
                    const isOverridden = !!overrides[s.id]
                    const currentOpt = STATUS_OPTIONS.find(o => o.value === current)

                    return (
                      <tr key={s.id}>
                        {/* Student name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%',
                              background: 'var(--primary-light)', color: 'var(--primary)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                            }}>
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td>
                          <code style={{
                            fontSize: '0.8125rem',
                            background: 'var(--gray-100)',
                            padding: '0.15rem 0.4rem',
                            borderRadius: 4,
                          }}>
                            {s.studentCode}
                          </code>
                        </td>

                        {/* Current status badge */}
                        <td>
                          <span className={`badge ${STATUS_BADGE[current]}`}
                            style={{ fontSize: '0.8125rem', padding: '0.3rem 0.75rem' }}>
                            {currentOpt?.label}
                          </span>
                          {isOverridden && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginLeft: '0.375rem' }}>
                              (overridden)
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map(opt => (
                              <button key={opt.value} type="button"
                                className="btn btn-sm"
                                style={{
                                  background: current === opt.value ? opt.bg : 'var(--gray-100)',
                                  color:      current === opt.value ? 'white' : 'var(--gray-600)',
                                  border:     current === opt.value ? 'none' : '1px solid var(--gray-200)',
                                  fontWeight: current === opt.value ? 600 : 400,
                                  opacity:    current === opt.value ? 1 : 0.75,
                                  transition: 'all 0.15s',
                                }}
                                onClick={() => setStudentStatus(s.id, opt.value)}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedClass && students.length === 0 && (
          <div className="alert alert-info">No students found in this class.</div>
        )}

        {!selectedClass && (
          <div className="alert alert-info">
            <CalendarCheck size={15} className="alert-icon" />
            Select a class above to load students and mark attendance.
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg"
          disabled={markMut.isPending || !selectedClass || students.length === 0}
          style={{ justifyContent: 'center' }}>
          <CalendarCheck size={16} />
          {markMut.isPending
            ? 'Saving…'
            : `Save Attendance for ${students.length} Student${students.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </Layout>
  )
}

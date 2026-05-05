import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, School, Clock, UserCheck, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { getClasses, createClass, assignTeacher, updateTimetable } from '../services/adminService'
import { getTeachers } from '../services/adminService'
import Layout from '../components/Layout'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function ClassesPage() {
  const qc = useQueryClient()
  const { data: classes, isLoading } = useQuery({ queryKey: ['classes'], queryFn: getClasses })
  const { data: teachers = [] }      = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })

  const [showCreate,    setShowCreate]    = useState(false)
  const [showTimetable, setShowTimetable] = useState(null)
  const [showAssign,    setShowAssign]    = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [newClass, setNewClass] = useState({ name: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) })
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [assignSubject, setAssignSubject] = useState('')
  const [timetableSlot, setTimetableSlot] = useState({ day: 'Monday', subject: '', startTime: '08:00', endTime: '09:00', room: '' })
  const [timetable, setTimetable] = useState([])

  const createMut = useMutation({
    mutationFn: createClass,
    onSuccess: () => { qc.invalidateQueries(['classes']); setShowCreate(false); setMsg({ type: 'success', text: 'Class created successfully.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to create class.' }),
  })

  const assignMut = useMutation({
    mutationFn: ({ classId, teacherId, subject }) => assignTeacher(classId, teacherId, subject),
    onSuccess: () => { qc.invalidateQueries(['classes']); setShowAssign(null); setMsg({ type: 'success', text: 'Teacher assigned successfully.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to assign teacher.' }),
  })

  const timetableMut = useMutation({
    mutationFn: ({ classId, timetable }) => updateTimetable(classId, timetable),
    onSuccess: () => { qc.invalidateQueries(['classes']); setShowTimetable(null); setMsg({ type: 'success', text: 'Timetable saved.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to save timetable.' }),
  })

  const addSlot = () => {
    if (!timetableSlot.subject || !timetableSlot.startTime || !timetableSlot.endTime) return
    setTimetable(p => [...p, { ...timetableSlot }])
    setTimetableSlot(p => ({ ...p, subject: '', room: '' }))
  }

  const removeSlot = (i) => setTimetable(p => p.filter((_, idx) => idx !== i))

  return (
    <Layout title="Classes">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-sub">Create classes, assign teachers, and build timetables.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Class
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.type === 'success' ? <CheckCircle size={16} className="alert-icon" /> : <AlertCircle size={16} className="alert-icon" />}
          {msg.text}
        </div>
      )}

      {isLoading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {classes?.map((c) => (
            <div key={c.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.2rem' }}>
                    {c.academicYear || 'No academic year set'}
                  </div>
                </div>
                <span className="badge badge-orange">{c.timetable?.length || 0} slots</span>
              </div>
              <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
                {/* Teachers */}
                <div style={{ marginBottom: '0.875rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.375rem' }}>Subject Teachers</div>
                  {c.teachers?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {c.teachers.map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                            {t.teacher?.firstName?.[0]}{t.teacher?.lastName?.[0]}
                          </div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--navy)' }}>
                            {t.teacher?.firstName} {t.teacher?.lastName}
                          </span>
                          <span className="badge badge-orange" style={{ fontSize: '0.6875rem' }}>{t.subject}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>No teachers assigned</div>
                  )}
                </div>

                {/* Timetable preview */}
                {c.timetable?.length > 0 && (
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.375rem' }}>Timetable preview</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {c.timetable.slice(0, 4).map((s, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '0.15rem 0.5rem', borderRadius: 4 }}>
                          {s.day.slice(0, 3)} · {s.subject}
                        </span>
                      ))}
                      {c.timetable.length > 4 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>+{c.timetable.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setShowAssign(c); setSelectedTeacherId(''); setAssignSubject('') }}>
                    <UserCheck size={13} /> Assign Teacher
                  </button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { setTimetable(c.timetable || []); setShowTimetable(c) }}>
                    <Clock size={13} /> Timetable
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!classes?.length && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <School size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No classes yet. Create your first class to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Class</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(newClass) }}>
              <div className="form-group">
                <label className="form-label">Class Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Senior 1A, Grade 7B, Year 3"
                  value={newClass.name}
                  onChange={(e) => setNewClass(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                  Use a clear name that includes the level and section, e.g. "Senior 2B"
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input
                  className="form-input"
                  placeholder="e.g. 2024-2025"
                  value={newClass.academicYear}
                  onChange={(e) => setNewClass(p => ({ ...p, academicYear: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal — dropdown of real teachers */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Assign Teacher — {showAssign.name}</h2>

            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              A teacher can be assigned to multiple subjects across different classes.
              Each subject in a class can have its own teacher.
            </div>

            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input
                className="form-input"
                placeholder="e.g. Mathematics, English, Physics"
                value={assignSubject}
                onChange={(e) => setAssignSubject(e.target.value)}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                If this subject already has a teacher, they will be replaced.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Teacher</label>
              {teachers.length === 0 ? (
                <div className="alert alert-warning">
                  No teachers found. Create teacher accounts first from the Teachers &amp; Staff page.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {teachers.map((t) => (
                    <label key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem',
                      border: `2px solid ${selectedTeacherId === t.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius)',
                      background: selectedTeacherId === t.id ? 'var(--primary-light)' : 'var(--white)',
                      cursor: 'pointer',
                    }}>
                      <input type="radio" name="teacher" value={t.id}
                        checked={selectedTeacherId === t.id}
                        onChange={() => setSelectedTeacherId(t.id)}
                        style={{ accentColor: 'var(--primary)' }} />
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {t.firstName[0]}{t.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{t.firstName} {t.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{t.email}</div>
                        {t.assignedClasses?.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.1rem' }}>
                            Assigned to {t.assignedClasses.length} class{t.assignedClasses.length > 1 ? 'es' : ''}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={assignMut.isPending || !selectedTeacherId || !assignSubject.trim()}
                onClick={() => assignMut.mutate({ classId: showAssign.id, teacherId: selectedTeacherId, subject: assignSubject.trim() })}
              >
                {assignMut.isPending ? 'Assigning…' : 'Assign Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetable && (
        <div className="modal-overlay" onClick={() => setShowTimetable(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Timetable — {showTimetable.name}</h2>

            {/* Add slot form */}
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.75rem' }}>Add a slot</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Day</label>
                  <select className="form-input" value={timetableSlot.day} onChange={(e) => setTimetableSlot(p => ({ ...p, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject *</label>
                  <input className="form-input" placeholder="e.g. Mathematics" value={timetableSlot.subject} onChange={(e) => setTimetableSlot(p => ({ ...p, subject: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Room</label>
                  <input className="form-input" placeholder="e.g. Room 12" value={timetableSlot.room} onChange={(e) => setTimetableSlot(p => ({ ...p, room: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={timetableSlot.startTime} onChange={(e) => setTimetableSlot(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={timetableSlot.endTime} onChange={(e) => setTimetableSlot(p => ({ ...p, endTime: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={addSlot}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Slot list */}
            {timetable.length > 0 ? (
              <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: '0.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem', background: 'var(--gray-50)', color: 'var(--gray-500)', fontWeight: 600 }}>Day</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', background: 'var(--gray-50)', color: 'var(--gray-500)', fontWeight: 600 }}>Subject</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', background: 'var(--gray-50)', color: 'var(--gray-500)', fontWeight: 600 }}>Time</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', background: 'var(--gray-50)', color: 'var(--gray-500)', fontWeight: 600 }}>Room</th>
                      <th style={{ padding: '0.5rem', background: 'var(--gray-50)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '0.5rem' }}>{s.day}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{s.subject}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--gray-500)' }}>{s.startTime} – {s.endTime}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--gray-400)' }}>{s.room || '—'}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '0.2rem 0.4rem' }} onClick={() => removeSlot(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                No slots added yet. Use the form above to build the timetable.
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowTimetable(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={timetableMut.isPending} onClick={() => timetableMut.mutate({ classId: showTimetable.id, timetable })}>
                {timetableMut.isPending ? 'Saving…' : 'Save Timetable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

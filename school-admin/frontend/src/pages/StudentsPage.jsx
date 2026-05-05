import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, CalendarCheck, Search, Link2, School, CheckCircle, AlertCircle } from 'lucide-react'
import { getStudents, createStudent, updateGrades, markAttendance, linkUserAccount, updateStudent } from '../services/adminService'
import { getClasses } from '../services/adminService'
import Layout from '../components/Layout'

export default function StudentsPage() {
  const qc = useQueryClient()
  const { data: students, isLoading } = useQuery({ queryKey: ['students'], queryFn: getStudents })
  const { data: classes = [] }        = useQuery({ queryKey: ['classes'],  queryFn: getClasses })

  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showGrades, setShowGrades] = useState(null)
  const [showAttend, setShowAttend] = useState(null)
  const [showLink,   setShowLink]   = useState(null)
  const [showClass,  setShowClass]  = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const [newStudent, setNewStudent] = useState({ studentCode: '', firstName: '', lastName: '', gender: 'male', dateOfBirth: '' })
  const [gradeForm, setGradeForm]   = useState({ subject: '', score: '', grade: 'A', term: '' })
  const [attendForm, setAttendForm] = useState({ date: new Date().toISOString().split('T')[0], status: 'present' })
  const [linkEmail,  setLinkEmail]  = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  const createMut = useMutation({
    mutationFn: createStudent,
    onSuccess: () => { qc.invalidateQueries(['students']); setShowCreate(false); setMsg({ type: 'success', text: 'Student created successfully.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to create student.' }),
  })

  const gradesMut = useMutation({
    mutationFn: ({ id, grades }) => updateGrades(id, grades),
    onSuccess: () => { setShowGrades(null); setMsg({ type: 'success', text: 'Grades updated.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const attendMut = useMutation({
    mutationFn: ({ id, records }) => markAttendance(id, records),
    onSuccess: () => { setShowAttend(null); setMsg({ type: 'success', text: 'Attendance marked.' }) },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const linkMut = useMutation({
    mutationFn: ({ id, email }) => linkUserAccount(id, email),
    onSuccess: () => {
      qc.invalidateQueries(['students'])
      setShowLink(null); setLinkEmail('')
      setMsg({ type: 'success', text: 'Account linked. The student can now log in and see their data.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed to link account.' }),
  })

  const classMut = useMutation({
    mutationFn: ({ id, classId }) => updateStudent(id, { class: classId }),
    onSuccess: () => {
      qc.invalidateQueries(['students'])
      setShowClass(null)
      setMsg({ type: 'success', text: 'Student assigned to class.' })
    },
    onError: (e) => setMsg({ type: 'danger', text: e.response?.data?.message || 'Failed.' }),
  })

  const filtered = students?.filter(s =>
    `${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <Layout title="Students">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">Manage student records, grades, and attendance.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
          {msg.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Students ({filtered.length})</span>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '2rem', width: 220 }}
              placeholder="Search students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Code</th><th>Gender</th><th>Class</th><th>Fee Balance</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td><code style={{ fontSize: '0.8125rem', background: 'var(--gray-100)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>{s.studentCode}</code></td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--gray-500)' }}>{s.gender}</td>
                    <td>{s.class?.name || <span style={{ color: 'var(--gray-400)' }}>—</span>}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: s.feeBalance < 5000 ? 'var(--danger)' : 'var(--success)' }}>
                        {s.feeBalance?.toLocaleString()} RWF
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setShowClass(s); setSelectedClass(s.class?._id || s.class || '') }}>
                          <School size={13} /> {s.class ? 'Change Class' : 'Assign Class'}
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowGrades(s)}>
                          <BookOpen size={13} /> Grades
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowAttend(s)}>
                          <CalendarCheck size={13} /> Attendance
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: s.userId ? 'var(--success-light)' : 'var(--primary-light)', color: s.userId ? 'var(--success)' : 'var(--primary)', border: 'none' }}
                          onClick={() => { setShowLink(s); setLinkEmail('') }}
                        >
                          <Link2 size={13} /> {s.userId ? 'Linked' : 'Link Account'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem' }}>No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Student Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add New Student</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(newStudent) }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Student Code *</label>
                  <input className="form-input" placeholder="e.g. STU001" value={newStudent.studentCode} onChange={(e) => setNewStudent(p => ({ ...p, studentCode: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={newStudent.gender} onChange={(e) => setNewStudent(p => ({ ...p, gender: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={newStudent.firstName} onChange={(e) => setNewStudent(p => ({ ...p, firstName: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={newStudent.lastName} onChange={(e) => setNewStudent(p => ({ ...p, lastName: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={newStudent.dateOfBirth} onChange={(e) => setNewStudent(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grades Modal */}
      {showGrades && (
        <div className="modal-overlay" onClick={() => setShowGrades(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Update Grades — {showGrades.firstName} {showGrades.lastName}</h2>
            <form onSubmit={(e) => { e.preventDefault(); gradesMut.mutate({ id: showGrades.id, grades: [{ ...gradeForm, score: Number(gradeForm.score) }] }) }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-input" placeholder="e.g. Mathematics" value={gradeForm.subject} onChange={(e) => setGradeForm(p => ({ ...p, subject: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Term *</label>
                  <input className="form-input" placeholder="e.g. Term 1 2024" value={gradeForm.term} onChange={(e) => setGradeForm(p => ({ ...p, term: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Score (%) *</label>
                  <input type="number" min="0" max="100" className="form-input" value={gradeForm.score} onChange={(e) => setGradeForm(p => ({ ...p, score: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Grade</label>
                  <select className="form-input" value={gradeForm.grade} onChange={(e) => setGradeForm(p => ({ ...p, grade: e.target.value }))}>
                    {['A+','A','A-','B+','B','B-','C+','C','C-','D','F'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowGrades(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={gradesMut.isPending}>Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttend && (
        <div className="modal-overlay" onClick={() => setShowAttend(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Mark Attendance — {showAttend.firstName} {showAttend.lastName}</h2>
            <form onSubmit={(e) => { e.preventDefault(); attendMut.mutate({ id: showAttend.id, records: [attendForm] }) }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={attendForm.date} onChange={(e) => setAttendForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={attendForm.status} onChange={(e) => setAttendForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowAttend(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={attendMut.isPending}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Assign Class Modal */}
      {showClass && (
        <div className="modal-overlay" onClick={() => setShowClass(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Assign to Class — {showClass.firstName} {showClass.lastName}</h2>
            <div className="form-group">
              <label className="form-label">Select Class</label>
              {classes.length === 0 ? (
                <div className="alert alert-warning">No classes found. Create classes first.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {classes.map((c) => (
                    <label key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem',
                      border: `2px solid ${selectedClass === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                      borderRadius: 'var(--radius)',
                      background: selectedClass === c.id ? 'var(--primary-light)' : 'var(--white)',
                      cursor: 'pointer',
                    }}>
                      <input type="radio" name="class" value={c.id} checked={selectedClass === c.id}
                        onChange={() => setSelectedClass(c.id)} style={{ accentColor: 'var(--primary)' }} />
                      <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <School size={15} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                          {c.teacher ? `Teacher: ${c.teacher.firstName} ${c.teacher.lastName}` : 'No teacher assigned'} · {c.academicYear || ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowClass(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={classMut.isPending || !selectedClass}
                onClick={() => classMut.mutate({ id: showClass.id, classId: selectedClass })}>
                {classMut.isPending ? 'Saving…' : 'Assign to Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {showLink && (
        <div className="modal-overlay" onClick={() => setShowLink(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              <Link2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Link Account — {showLink.firstName} {showLink.lastName}
            </h2>

            {showLink.userId ? (
              <div className="alert alert-success">
                This student is already linked to a user account.
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Enter the email address of the registered parent or student account to link it to this student record.
                  Once linked, that user will see this student's grades, attendance, fees, and timetable in the portal.
                </p>
                <div className="form-group">
                  <label className="form-label">Registered account email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. student@example.com"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowLink(null)}>Cancel</button>
              {!showLink.userId && (
                <button
                  className="btn btn-primary"
                  disabled={linkMut.isPending || !linkEmail}
                  onClick={() => linkMut.mutate({ id: showLink.id, email: linkEmail })}
                >
                  {linkMut.isPending ? 'Linking…' : 'Link Account'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

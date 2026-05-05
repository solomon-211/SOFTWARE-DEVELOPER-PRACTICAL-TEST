import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoredUser } from '../utils/auth';
import { getTimetable } from '../services/academicService';
import Layout from '../components/Layout';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablePage() {
  const user = getStoredUser();
  const studentId = user?.studentProfile || user?.children?.[0] || null

  const { data: timetable, isLoading } = useQuery({
    queryKey: ['timetable', studentId],
    queryFn:  () => getTimetable(studentId),
    enabled:  !!studentId,
  });

  if (!studentId) {
    return <Layout><div className="alert alert-info">No student profile linked. Contact admin.</div></Layout>;
  }

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = (timetable || []).filter((t) => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {});

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Class Timetable</h1>
        <p className="page-sub">Weekly schedule for all subjects.</p>
      </div>

      {isLoading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {DAYS.map((day) => (
            <div key={day} className="card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {day}
              </h3>
              {byDay[day].length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray-400)' }}>No classes</p>
              ) : (
                byDay[day].map((slot, i) => (
                  <div key={i} style={{ background: 'var(--primary-light)', borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary-dark)' }}>{slot.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{slot.startTime} – {slot.endTime}</div>
                    {slot.room && <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Room {slot.room}</div>}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !timetable?.length && (
        <div className="alert alert-info">No timetable has been set for your class yet.</div>
      )}
    </Layout>
  );
}


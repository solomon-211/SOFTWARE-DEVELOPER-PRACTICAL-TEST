import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoredUser } from '../utils/auth';
import { getGrades } from '../services/academicService';
import Layout from '../components/Layout';
import RefreshBar from '../components/RefreshBar';

const gradeColor = (score) => {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
};

export default function GradesPage() {
  const user = getStoredUser();
  const studentId = user?.studentProfile || user?.children?.[0] || user?.id || null

  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades', studentId],
    queryFn:  () => getGrades(studentId),
    enabled:  !!studentId,
  });

  if (!studentId) {
    return <Layout><div className="alert alert-info">No student profile linked. Contact admin.</div></Layout>;
  }

  const avg = grades?.length
    ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length)
    : 0;

  return (
    <Layout title="Grades">
      <div className="page-header">
        <h1 className="page-title">Academic Grades</h1>
        <p className="page-sub">View all recorded grades by subject and term.</p>
      </div>
      <RefreshBar queryKeys={[['grades', studentId]]} />

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <span className="stat-label">Subjects</span>
          <span className="stat-value">{grades?.length || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Score</span>
          <span className="stat-value" style={{ color: gradeColor(avg) }}>{avg}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Highest Score</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {grades?.length ? Math.max(...grades.map((g) => g.score)) : 0}%
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Grade Report</h2>
        {isLoading ? <div className="spinner" /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Term</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {grades?.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{g.subject}</td>
                    <td>{g.term}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--gray-200)', borderRadius: 3, maxWidth: 80 }}>
                          <div style={{ width: `${g.score}%`, height: '100%', background: gradeColor(g.score), borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 600, color: gradeColor(g.score) }}>{g.score}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${g.score >= 80 ? 'success' : g.score >= 60 ? 'warning' : 'danger'}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-400)', fontSize: '0.8125rem' }}>
                      {new Date(g.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {!grades?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-400)' }}>No grades recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}



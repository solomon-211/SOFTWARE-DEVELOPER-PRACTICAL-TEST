import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, Mail, Phone, Shield, Calendar, Smartphone, CheckCircle, Clock } from 'lucide-react'
import { getMe } from '../services/authService'
import { getDeviceId } from '../utils/deviceId'
import Layout from '../components/Layout'

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe })
  const deviceId = getDeviceId()

  if (isLoading) return <Layout title="My Profile"><div className="spinner" /></Layout>

  const infoRows = [
    { icon: User,     label: 'Full Name',    value: `${user?.firstName} ${user?.lastName}` },
    { icon: Mail,     label: 'Email',        value: user?.email },
    { icon: Phone,    label: 'Phone',        value: user?.phone || '—' },
    { icon: Shield,   label: 'Role',         value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
    { icon: Calendar, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
  ]

  return (
    <Layout title="My Profile">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-sub">Account information and device verification status.</p>
        </div>
      </div>

      {/* Avatar + name banner */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
              {user?.email}
            </div>
            <span className="badge badge-orange" style={{ marginTop: '0.4rem' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Personal Information */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><User size={16} /> Personal Information</span>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1.5rem',
                borderBottom: '1px solid var(--gray-100)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--radius)',
                  background: 'var(--primary-light)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '0.1rem' }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: '0.9rem', fontWeight: 500, color: 'var(--navy)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Verification */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Smartphone size={16} /> Device Verification</span>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              Your device ID is sent automatically with every login. An admin must verify it before you can access the portal.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {user?.devices?.length ? user.devices.map((d) => {
                const isCurrent  = d.deviceId === deviceId
                const isVerified = d.verified

                return (
                  <div key={d.deviceId} style={{
                    padding: '1rem',
                    border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-lg)',
                    background: isCurrent ? 'var(--primary-light)' : 'var(--gray-50)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius)',
                          background: isCurrent ? 'var(--primary)' : 'var(--gray-200)',
                          color: isCurrent ? 'white' : 'var(--gray-500)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Smartphone size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                            {d.deviceName || 'Unknown Device'}
                            {isCurrent && (
                              <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 600 }}>
                                This device
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.15rem' }}>
                            Registered: {new Date(d.registeredAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      <span className={`badge badge-${isVerified ? 'success' : 'warning'}`} style={{ flexShrink: 0 }}>
                        {isVerified
                          ? <><CheckCircle size={11} /> Verified</>
                          : <><Clock size={11} /> Pending</>
                        }
                      </span>
                    </div>

                    {!isVerified && isCurrent && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--warning-light)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.8rem',
                        color: '#92400e',
                      }}>
                        Awaiting admin approval. You will be able to log in once verified.
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '1.5rem', fontSize: '0.875rem' }}>
                  No devices registered.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}

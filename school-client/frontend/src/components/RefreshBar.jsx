import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export default function RefreshBar({ queryKeys = [] }) {
  const qc = useQueryClient()
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [spinning, setSpinning] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setLastUpdated(prev => prev), 60000)
    return () => clearInterval(id)
  }, [])

  const handleRefresh = async () => {
    setSpinning(true)
    await Promise.all(queryKeys.map(k => qc.invalidateQueries(k)))
    setLastUpdated(new Date())
    setTimeout(() => setSpinning(false), 600)
  }

  const timeAgo = () => {
    const secs = Math.floor((new Date() - lastUpdated) / 1000)
    if (secs < 10)  return 'just now'
    if (secs < 60)  return `${secs}s ago`
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    return lastUpdated.toLocaleTimeString()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      fontSize: '0.8125rem', color: 'var(--gray-400)',
      marginBottom: '1rem',
    }}>
      <button
        onClick={handleRefresh}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          background: 'var(--white)', border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius)', padding: '0.375rem 0.75rem',
          fontSize: '0.8125rem', color: 'var(--gray-600)', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-200)'}
      >
        <RefreshCw size={13} style={{ animation: spinning ? 'spin 0.6s linear' : 'none' }} />
        Refresh
      </button>
      <span>Updated {timeAgo()}</span>
    </div>
  )
}

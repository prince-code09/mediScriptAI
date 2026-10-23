import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users } from 'lucide-react';

interface SourceItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
  gradient: [string, string];
  description: string;
}

export const PatientSourceChart: React.FC = () => {
  const { prescriptions, activeClinic } = useApp();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter genuine records for active clinic
  const clinicPrescriptions = useMemo(() => {
    return prescriptions.filter(
      p => !activeClinic?.id || !p.clinicId || p.clinicId === activeClinic.id
    );
  }, [prescriptions, activeClinic?.id]);

  const totalConsultations = clinicPrescriptions.length;

  // Calculate actual consultation origin breakdown from genuine records
  const sources: SourceItem[] = useMemo(() => {
    if (totalConsultations === 0) return [];

    const patientRxCounts: { [key: string]: number } = {};
    clinicPrescriptions.forEach(p => {
      const key = p.patientId || p.patientName;
      patientRxCounts[key] = (patientRxCounts[key] || 0) + 1;
    });

    let newCount = 0;
    let followUpCount = 0;

    clinicPrescriptions.forEach(p => {
      const key = p.patientId || p.patientName;
      if (patientRxCounts[key] > 1) {
        followUpCount++;
      } else {
        newCount++;
      }
    });

    const newPct = Math.round((newCount / totalConsultations) * 100);
    const followUpPct = 100 - newPct;

    const list: SourceItem[] = [];
    if (newPct > 0) {
      list.push({
        id: 'walkin',
        label: 'New Walk-in OPD',
        percentage: newPct,
        color: '#7667F8',
        gradient: ['#A095FF', '#6353E8'],
        description: `${newCount} first-time consultation${newCount === 1 ? '' : 's'}`
      });
    }
    if (followUpPct > 0) {
      list.push({
        id: 'followup',
        label: 'Follow-up / Chronic',
        percentage: followUpPct,
        color: '#38BDF8',
        gradient: ['#76B9FF', '#1D4ED8'],
        description: `${followUpCount} review consultation${followUpCount === 1 ? '' : 's'}`
      });
    }

    return list;
  }, [clinicPrescriptions, totalConsultations]);

  // SVG Donut calculation
  const size = 150;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Patient OPD Breakdown
          </h3>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          Distribution by consultation origin
        </p>
      </div>

      {totalConsultations === 0 ? (
        <div
          style={{
            height: '240px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            padding: '1.5rem',
            textAlign: 'center',
            margin: '1rem 0'
          }}
        >
          <Users size={32} style={{ opacity: 0.35, marginBottom: '8px', color: 'var(--primary-navy)' }} />
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No consultation data yet
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            OPD distribution will appear once patient visits are recorded.
          </div>
        </div>
      ) : (
        <>
          {/* Donut Chart Visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0', position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <defs>
                {sources.map(s => (
                  <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={s.gradient[0]} />
                    <stop offset="100%" stopColor={s.gradient[1]} />
                  </linearGradient>
                ))}
              </defs>

              {/* Slices */}
              {sources.map(s => {
                const strokeDasharray = `${(s.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                accumulatedPercent += s.percentage;
                const isHovered = hoveredId === s.id;

                return (
                  <circle
                    key={s.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#grad-${s.id})`}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      opacity: hoveredId && !isHovered ? 0.6 : 1
                    }}
                  />
                );
              })}
            </svg>

            {/* Center cutout info */}
            <div 
              style={{
                position: 'absolute',
                textAlign: 'center',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {hoveredId ? `${sources.find(s => s.id === hoveredId)?.percentage}%` : '100%'}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>
                {hoveredId ? sources.find(s => s.id === hoveredId)?.label.split(' ')[0] : 'Total OPD'}
              </span>
            </div>
          </div>

          {/* Compact Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sources.map(s => (
              <div
                key={s.id}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: hoveredId === s.id ? 'var(--bg-card-subtle)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {s.label}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.color }}>
                  {s.percentage}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

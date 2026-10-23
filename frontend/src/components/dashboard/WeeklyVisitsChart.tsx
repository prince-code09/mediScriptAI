import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar } from 'lucide-react';

export const WeeklyVisitsChart: React.FC = () => {
  const { prescriptions, activeClinic } = useApp();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Filter genuine records for active clinic
  const clinicPrescriptions = useMemo(() => {
    return prescriptions.filter(
      p => !activeClinic?.id || !p.clinicId || p.clinicId === activeClinic.id
    );
  }, [prescriptions, activeClinic?.id]);

  // Dynamically compute the last 7 calendar days from actual records
  const data = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const displayDate = `${d.getDate()} ${monthNames[d.getMonth()]}`;

      const dayRxs = clinicPrescriptions.filter(p => p.date === isoDate);
      const uniquePatients = new Set(dayRxs.map(p => p.patientId || p.patientName)).size;
      const confirmedCount = dayRxs.filter(p => p.isDiagnosisConfirmed !== false).length;

      result.push({
        day: dayName,
        date: displayDate,
        isoDate,
        visits: dayRxs.length,
        uniquePatients,
        prescriptions: confirmedCount
      });
    }
    return result;
  }, [clinicPrescriptions]);

  const totalWeeklyVisits = useMemo(() => {
    return data.reduce((sum, d) => sum + d.visits, 0);
  }, [data]);

  // Dynamic Y-axis scale based on maximum real daily visits
  const maxDayVisits = Math.max(...data.map(d => Math.max(d.visits, d.uniquePatients)), 0);
  const maxVal = maxDayVisits <= 4 ? 4 : maxDayVisits <= 10 ? 10 : Math.ceil(maxDayVisits / 5) * 5;
  const yTicks = maxVal === 4 ? [0, 1, 2, 3, 4] : maxVal === 10 ? [0, 2, 5, 8, 10] : [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  // Compact, balanced SVG dimensions
  const width = 640;
  const height = 230;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 38;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getY = (val: number) => padTop + chartH - (val / maxVal) * chartH;

  const groupCount = data.length;
  const groupWidth = chartW / groupCount;
  const barWidth = 14;
  const barGap = 4;
  const groupInnerWidth = barWidth * 2 + barGap;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Top Header & Legend */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Weekly Consultations (Last 7 Days)
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Total Clinic Visits vs. Unique Individual Patients
          </p>
        </div>

        {/* Legend: Violet/Navy-Purple for Total Visits, Lavender for Unique Patients */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: 'linear-gradient(180deg, #7C3AED 0%, #3B2A6B 100%)',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)'
              }} 
            />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Visits</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div 
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: 'linear-gradient(180deg, #DDD6FE 0%, #A78BFA 100%)',
                boxShadow: '0 2px 4px rgba(167, 139, 250, 0.3)'
              }} 
            />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Unique Patients</span>
          </div>
        </div>
      </div>

      {totalWeeklyVisits === 0 ? (
        <div
          style={{
            height: `${height}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <Calendar size={32} style={{ opacity: 0.35, marginBottom: '8px', color: 'var(--primary-navy)' }} />
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No consultation data yet
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px' }}>
            Weekly consultation trends will appear here once patient prescriptions are confirmed.
          </div>
        </div>
      ) : (
        <>
          {/* SVG 3D Column Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', minWidth: '460px', overflow: 'visible' }}
          role="img"
          aria-label="Grouped 3D Column Chart comparing weekly patient visits with unique patients"
        >
          <defs>
            {/* Total Visits 3D Gradient: Violet / Navy-Purple */}
            <linearGradient id="col3DVisits" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2E1C59" />
              <stop offset="30%" stopColor="#8B5CF6" />
              <stop offset="70%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#431D78" />
            </linearGradient>

            {/* Unique Patients 3D Gradient: Lavender tones */}
            <linearGradient id="col3DUnique" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="35%" stopColor="#DDD6FE" />
              <stop offset="70%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>

            {/* Top Specular Edge Highlight */}
            <linearGradient id="col3DHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="90%" stopColor="#FFFFFF" stopOpacity="0.05" />
            </linearGradient>

            {/* Soft Column Base Drop Shadow */}
            <filter id="colShadow3D" x="-20%" y="-10%" width="140%" height="130%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#101014" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Grid Guidelines */}
          {yTicks.map(val => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10.5"
                  fontWeight="600"
                  fill="var(--text-muted)"
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Grouped Columns for each day */}
          {data.map((d, idx) => {
            const groupCenterX = padLeft + idx * groupWidth + groupWidth / 2;
            const startX = groupCenterX - groupInnerWidth / 2;
            const isHovered = hoveredIdx === idx;

            // Visit bar metrics
            const targetVisitH = (d.visits / maxVal) * chartH;
            const visitH = animateIn ? targetVisitH : 0;
            const visitY = padTop + chartH - visitH;

            // Unique bar metrics
            const targetUniqueH = (d.uniquePatients / maxVal) * chartH;
            const uniqueH = animateIn ? targetUniqueH : 0;
            const uniqueY = padTop + chartH - uniqueH;

            const xVisits = startX;
            const xUnique = startX + barWidth + barGap;

            return (
              <g
                key={d.day}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  cursor: 'pointer',
                  transform: isHovered ? 'translateY(-3.5px)' : 'none',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                {/* Background Pillar Glow on Hover */}
                {isHovered && (
                  <rect
                    x={groupCenterX - groupWidth / 2 + 3}
                    y={padTop}
                    width={groupWidth - 6}
                    height={chartH + 2}
                    rx="6"
                    fill="var(--bg-card-subtle)"
                    opacity="0.8"
                  />
                )}

                {/* 3D Base Shadows */}
                <ellipse
                  cx={xVisits + barWidth / 2}
                  cy={padTop + chartH + 1}
                  rx={barWidth * 0.6}
                  ry="2"
                  fill="rgba(46, 28, 89, 0.35)"
                />
                <ellipse
                  cx={xUnique + barWidth / 2}
                  cy={padTop + chartH + 1}
                  rx={barWidth * 0.6}
                  ry="2"
                  fill="rgba(124, 58, 237, 0.3)"
                />

                {/* Column 1: Total Visits (Violet / Navy-Purple) */}
                <g filter={isHovered ? 'url(#colShadow3D)' : undefined}>
                  <rect
                    x={xVisits}
                    y={visitY}
                    width={barWidth}
                    height={visitH}
                    rx="4.5"
                    fill="url(#col3DVisits)"
                    style={{
                      transition: 'y 0.5s cubic-bezier(0.34, 1.15, 0.64, 1), height 0.5s cubic-bezier(0.34, 1.15, 0.64, 1)'
                    }}
                  />
                  {visitH > 6 && (
                    <rect
                      x={xVisits + 1.5}
                      y={visitY + 1.5}
                      width="2.5"
                      height={visitH - 3}
                      rx="1.2"
                      fill="url(#col3DHighlight)"
                      style={{
                        transition: 'y 0.5s cubic-bezier(0.34, 1.15, 0.64, 1), height 0.5s cubic-bezier(0.34, 1.15, 0.64, 1)'
                      }}
                    />
                  )}
                  {visitH > 3 && (
                    <ellipse
                      cx={xVisits + barWidth / 2}
                      cy={visitY + 2}
                      rx={barWidth / 2 - 1.2}
                      ry="1.8"
                      fill="rgba(255, 255, 255, 0.45)"
                    />
                  )}
                </g>

                {/* Column 2: Unique Patients (Lavender) */}
                <g filter={isHovered ? 'url(#colShadow3D)' : undefined}>
                  <rect
                    x={xUnique}
                    y={uniqueY}
                    width={barWidth}
                    height={uniqueH}
                    rx="4.5"
                    fill="url(#col3DUnique)"
                    style={{
                      transition: 'y 0.5s cubic-bezier(0.34, 1.15, 0.64, 1) 0.04s, height 0.5s cubic-bezier(0.34, 1.15, 0.64, 1) 0.04s'
                    }}
                  />
                  {uniqueH > 6 && (
                    <rect
                      x={xUnique + 1.5}
                      y={uniqueY + 1.5}
                      width="2.5"
                      height={uniqueH - 3}
                      rx="1.2"
                      fill="url(#col3DHighlight)"
                      style={{
                        transition: 'y 0.5s cubic-bezier(0.34, 1.15, 0.64, 1) 0.04s, height 0.5s cubic-bezier(0.34, 1.15, 0.64, 1) 0.04s'
                      }}
                    />
                  )}
                  {uniqueH > 3 && (
                    <ellipse
                      cx={xUnique + barWidth / 2}
                      cy={uniqueY + 2}
                      rx={barWidth / 2 - 1.2}
                      ry="1.8"
                      fill="rgba(255, 255, 255, 0.6)"
                    />
                  )}
                </g>

                {/* X-Axis Day & Date Labels */}
                <text
                  x={groupCenterX}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight={isHovered ? '800' : '600'}
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontFamily="inherit"
                >
                  {d.day}
                </text>
                <text
                  x={groupCenterX}
                  y={padTop + chartH + 28}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="500"
                  fill="var(--text-muted)"
                  fontFamily="inherit"
                >
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Detailed Hover Tooltip */}
      {hoveredIdx !== null && (
        <div
          style={{
            position: 'absolute',
            top: '25px',
            left: `${Math.min(Math.max(6, (hoveredIdx / (data.length - 1)) * 74 + 4), 70)}%`,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '9px 13px',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 30,
            minWidth: '185px'
          }}
        >
          <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '5px', fontSize: '0.84rem' }}>
            {data[hoveredIdx].day}, {data[hoveredIdx].date}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '2.5px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED' }} />
              Total Patient Visits:
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              {data[hoveredIdx].visits}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '2.5px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#A78BFA' }} />
              Unique Patients:
            </span>
            <strong style={{ color: '#8B5CF6', fontSize: '0.88rem' }}>
              {data[hoveredIdx].uniquePatients}
            </strong>
          </div>

          <div style={{ borderTop: '1px dashed var(--border-subtle)', marginTop: '4px', paddingTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Confirmed Rx:</span>
            <span style={{ fontWeight: 700, color: '#10B981', fontSize: '0.76rem' }}>
              {data[hoveredIdx].prescriptions}
            </span>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  ChevronDown, 
  Moon, 
  Sun, 
  RefreshCw, 
  Check, 
  Menu, 
  User, 
  CloudCheck, 
  HardDrive,
  RotateCcw
} from 'lucide-react';

interface Props {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<Props> = ({ onToggleMobileMenu }) => {
  const { 
    activeClinic, 
    clinics, 
    setActiveClinicId, 
    theme, 
    setTheme, 
    doctor, 
    pendingSyncCount, 
    syncAllPending,
    startNewConsultation
  } = useApp();

  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <header 
      className="app-header no-print"
      style={{
        height: '68px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileMenu}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            background: 'var(--bg-card-subtle)'
          }}
        >
          <Menu size={20} />
        </button>

        {/* Clinic Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setClinicMenuOpen(!clinicMenuOpen)}
            aria-expanded={clinicMenuOpen}
            aria-label="Select Clinic Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card-subtle)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.88rem'
            }}
          >
            {activeClinic.logoUrl ? (
              <img 
                src={activeClinic.logoUrl} 
                alt="Clinic Logo" 
                style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '3px' }} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <Building2 size={16} color="var(--primary-navy)" />
            )}
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{activeClinic.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {activeClinic.isPrimary ? 'Primary Clinic' : 'Sub-Centre'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {clinicMenuOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 60 }} 
                onClick={() => setClinicMenuOpen(false)} 
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '320px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px',
                  zIndex: 70
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Switch Active Clinic
                </div>
                {clinics.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveClinicId(c.id);
                      setClinicMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: c.id === activeClinic.id ? 'var(--bg-card-subtle)' : 'transparent',
                      color: 'var(--text-primary)',
                      textAlign: 'left'
                    }}
                  >
                    {c.logoUrl ? (
                      <img 
                        src={c.logoUrl} 
                        alt="Logo" 
                        style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px', marginTop: '2px' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Building2 size={16} style={{ marginTop: '2px', color: c.id === activeClinic.id ? 'var(--ai-violet)' : 'var(--text-muted)' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{c.address}</div>
                    </div>
                    {c.id === activeClinic.id && <Check size={16} color="var(--ai-violet)" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Sync status, Theme switch, Doctor info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Quick New Consultation Action */}
        <button
          onClick={() => startNewConsultation('home')}
          title="Start fresh consultation (clears unconfirmed transcript and draft)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={13} style={{ color: 'var(--ai-violet)' }} />
          <span>New Consultation</span>
        </button>

        {/* Sync queue indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {pendingSyncCount > 0 ? (
            <button
              onClick={syncAllPending}
              className="badge badge-pending"
              title="Click to simulate cloud synchronization queue"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                border: 'none',
                padding: '6px 10px'
              }}
            >
              <RefreshCw size={12} className="spin-icon" />
              <span>{pendingSyncCount} pending sync</span>
            </button>
          ) : (
            <span
              className="badge badge-synced"
              title="All confirmed records synced with cloud database"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
            >
              <HardDrive size={12} />
              <span>Saved & Synced</span>
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark and light mode"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'dark' ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} color="var(--primary-navy)" />}
        </button>

        {/* Doctor Identity Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px 4px 6px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--primary-navy-bg, #243B64)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem'
            }}
          >
            {doctor.fullName.replace('Dr. ', '').charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {doctor.fullName}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {doctor.regNumber}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

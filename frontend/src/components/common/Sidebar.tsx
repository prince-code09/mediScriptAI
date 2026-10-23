import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavPage } from '../../types';
import { 
  Mic, 
  LayoutDashboard, 
  Users, 
  FileText, 
  History, 
  Settings, 
  LogOut, 
  X,
  Stethoscope,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface Props {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({ mobileOpen, onCloseMobile }) => {
  const { currentPage, setCurrentPage, logout, startNewConsultation } = useApp();

  const navItems: { id: NavPage; label: string; icon: React.ReactNode; isAIFeature?: boolean }[] = [
    { id: 'home', label: 'Home / AI Voice', icon: <Mic size={19} />, isAIFeature: true },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { id: 'patients', label: 'Patients', icon: <Users size={19} /> },
    { id: 'prescriptions', label: 'Prescriptions', icon: <FileText size={19} /> },
    { id: 'history', label: 'History', icon: <History size={19} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={19} /> }
  ];

  const handleNavClick = (pageId: NavPage) => {
    setCurrentPage(pageId);
    onCloseMobile();
  };

  const handleLogoutClick = () => {
    onCloseMobile();
    logout();
  };

  const sidebarContent = (
    <aside 
      aria-label="Application Navigation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '260px',
        background: 'var(--bg-sidebar, var(--bg-card))',
        borderRight: '1px solid var(--border-subtle)',
        padding: '1.25rem 1rem'
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div 
          onClick={() => handleNavClick('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--ai-violet) 0%, var(--primary-navy) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 3px 10px rgba(118, 103, 248, 0.3)'
            }}
          >
            <Stethoscope size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.18rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              MediScript
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ai-violet)', letterSpacing: '0.02em' }}>
              CLINICAL AI
            </div>
          </div>
        </div>

        {mobileOpen && (
          <button 
            onClick={onCloseMobile}
            aria-label="Close menu"
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Quick Action: Start New Consultation */}
      <button
        onClick={() => {
          startNewConsultation('home');
          onCloseMobile();
        }}
        title="Start a fresh consultation (clears current unconfirmed transcript and draft)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.88rem',
          fontWeight: 600,
          background: 'linear-gradient(135deg, var(--ai-violet) 0%, #5B4BEB 100%)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 8px rgba(118, 103, 248, 0.25)',
          cursor: 'pointer'
        }}
      >
        <RotateCcw size={15} />
        <span>New Consultation</span>
      </button>

      {/* Main Navigation List */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive 
                  ? (item.isAIFeature ? 'var(--ai-violet-light)' : 'var(--bg-card-subtle)') 
                  : 'transparent',
                borderLeft: isActive ? `3.5px solid ${item.isAIFeature ? 'var(--ai-violet)' : 'var(--primary-navy)'}` : '3.5px solid transparent',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <span style={{ color: isActive ? (item.isAIFeature ? 'var(--ai-violet)' : 'var(--primary-navy)') : 'var(--text-muted)' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.isAIFeature && (
                <span 
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(118, 103, 248, 0.15)',
                    color: 'var(--ai-violet)'
                  }}
                >
                  Core
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tagline & Demo Indicator */}
      <div 
        style={{
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-card-subtle)',
          marginBottom: '1rem',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ai-violet)', marginBottom: '4px' }}>
          <Sparkles size={14} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Brand Purpose
          </span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.35 }}>
          “Speak. Prescribe. Focus on Care.”
        </p>
      </div>

      {/* Logout Navigation Action */}
      <button
        onClick={handleLogoutClick}
        className="nav-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          color: '#DC2626',
          fontSize: '0.92rem',
          fontWeight: 500,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left'
        }}
      >
        <LogOut size={19} />
        <span>Logout</span>
      </button>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="desktop-sidebar no-print" style={{ display: 'block', zIndex: 40 }}>
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="mobile-drawer-overlay no-print" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 100,
            display: 'flex'
          }}
        >
          <div 
            style={{ width: '270px', height: '100%', animation: 'slideInLeft 0.25s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
          <div style={{ flex: 1 }} onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};

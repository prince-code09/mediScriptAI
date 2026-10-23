import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Mic, 
  Stethoscope, 
  FileText, 
  ShieldCheck, 
  Printer, 
  Users, 
  ArrowRight, 
  Languages,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header 
        style={{
          height: '70px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              MediScript
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setCurrentPage('auth')}
            className="btn btn-secondary"
          >
            Login
          </button>
          <button 
            onClick={() => setCurrentPage('auth')}
            className="btn btn-primary"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1.5rem', textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Brand Tagline Badge */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--ai-violet-light)',
            color: 'var(--ai-violet)',
            fontWeight: 700,
            fontSize: '0.84rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(118, 103, 248, 0.25)'
          }}
        >
          <Sparkles size={16} />
          <span>Speak. Prescribe. Focus on Care.</span>
        </div>

        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)', maxWidth: '780px', lineHeight: 1.2, marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
          AI-Assisted Clinical Prescriptions for Indian Doctors & Rural Clinics
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6, marginBottom: '2.25rem' }}>
          Speak naturally in Hindi or English. MediScript automatically organizes your clinical thoughts into structured prescription fields for quick doctor review, confirmation, and instant one-click printing.
        </p>

        {/* Hero CTA buttons */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          <button 
            onClick={() => setCurrentPage('home')}
            className="btn btn-ai"
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
          >
            <span>Open AI Voice Assistant Demo</span>
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={() => setCurrentPage('auth')}
            className="btn btn-secondary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}
          >
            Doctor Login
          </button>
        </div>

        {/* Tasteful Preview of 3D Voice Assistant */}
        <div 
          className="card"
          onClick={() => setCurrentPage('home')}
          style={{
            cursor: 'pointer',
            padding: '2rem 3rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            maxWidth: '680px',
            width: '100%',
            marginBottom: '3.5rem',
            textAlign: 'left'
          }}
        >
          <div 
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #A398FF 0%, #7667F8 40%, #243B64 100%)',
              boxShadow: '0 0 25px rgba(118, 103, 248, 0.4), inset -5px -5px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0
            }}
          >
            <Mic size={38} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ai-violet)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>
              <Languages size={15} />
              <span>Bilingual Hindi & English Voice Assistant</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              One-Click Voice Dictation
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Click to experience hands-free clinical transcription with structured dosages, frequencies, and advice.
            </p>
          </div>
        </div>

        {/* Three Concise Benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', width: '100%', textAlign: 'left' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--ai-violet-light)',
                color: 'var(--ai-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Mic size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              1. Voice-Assisted Entry
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Speak diagnoses and medications in natural language. The AI parses dosages, routes, frequencies, and instructions.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Users size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              2. Structured Patient Records
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Maintain patient demographics, drug allergies, chronic history, and prior consultation records safely.
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Printer size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              3. Clean Prescription Printing
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              One-click print with clinic branding, registration numbers, Rx details, and doctor signature layout on A4/A5.
            </p>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer 
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)'
        }}
      >
        <p style={{ margin: 0 }}>
          MediScript · Clinical Prescription Software for Local Doctors & Rural Healthcare in India.
        </p>
      </footer>
    </div>
  );
};

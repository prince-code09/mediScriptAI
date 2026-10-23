import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VoiceOrb3D } from '../components/voice/VoiceOrb3D';
import { PatientModal } from '../components/patients/PatientModal';
import { 
  UserPlus, 
  FileEdit, 
  History, 
  Sparkles,
  Info
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentPage, setStagedVoiceData, addPatient } = useApp();
  const [patientModalOpen, setPatientModalOpen] = useState(false);

  const handleManualPrescription = () => {
    // Clear any voice staged data and navigate to fresh manual form
    setStagedVoiceData(null);
    setCurrentPage('prescriptions');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      {/* 3D Voice Assistant Orb is the Front-and-Center Signature Experience */}
      <VoiceOrb3D />

      {/* Secondary Quick Actions - Strictly limited to Add Patient, Manual Prescription, and History */}
      <div 
        style={{
          marginTop: '2.5rem',
          width: '100%',
          maxWidth: '580px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.85rem' }}>
          Secondary Clinical Actions
        </span>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}
        >
          {/* Quick Action 1: Add Patient */}
          <button
            onClick={() => setPatientModalOpen(true)}
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)'
            }}
          >
            <UserPlus size={18} color="var(--primary-navy)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Add Patient</span>
          </button>

          {/* Quick Action 2: Manual Prescription */}
          <button
            onClick={handleManualPrescription}
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)'
            }}
          >
            <FileEdit size={18} color="var(--primary-navy)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Manual Entry</span>
          </button>

          {/* Quick Action 3: Prescription History */}
          <button
            onClick={() => setCurrentPage('history')}
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)'
            }}
          >
            <History size={18} color="var(--primary-navy)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Rx History</span>
          </button>
        </div>
      </div>

      {/* Patient Modal */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={addPatient}
      />
    </div>
  );
};

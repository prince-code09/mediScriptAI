import React from 'react';
import { useApp } from '../context/AppContext';
import { PatientList } from '../components/patients/PatientList';
import { Users, ShieldCheck } from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const { patients } = useApp();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} color="var(--primary-navy)" />
            <span>Patient Records & Directory</span>
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {patients.length} Registered Patients · Confidential Clinical Health Records
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <ShieldCheck size={15} />
          <span>Encrypted Local Storage Compliant</span>
        </div>
      </div>

      <PatientList />
    </div>
  );
};

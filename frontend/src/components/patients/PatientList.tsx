import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Patient } from '../../types';
import { PatientModal } from './PatientModal';
import { 
  Search, 
  UserPlus, 
  FilePlus, 
  Edit3, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  User 
} from 'lucide-react';

export const PatientList: React.FC = () => {
  const { patients, addPatient, updatePatient, setCurrentPage, setStagedVoiceData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setModalOpen(true);
  };

  const handleSavePatient = (patient: Patient) => {
    if (editingPatient) {
      updatePatient(patient);
    } else {
      addPatient(patient);
    }
  };

  const handlePrescribeForPatient = (patient: Patient) => {
    // Pre-populate prescription staged data with patient details
    setStagedVoiceData({
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientPhone: patient.phone,
      symptoms: '',
      clinicalFindings: '',
      vitals: {},
      medicines: [],
      advice: '',
      followUp: '',
      source: 'manual'
    });
    setCurrentPage('prescriptions');
  };

  return (
    <div>
      {/* Search and Action Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by name, Patient ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
          />
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <UserPlus size={17} />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="card desktop-table-container" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Patient ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name & Demographics</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Known Allergies</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Last Visit</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No patients match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => {
                  const hasAllergy = p.allergies && p.allergies.toLowerCase() !== 'none reported' && p.allergies.toLowerCase() !== 'none';
                  return (
                    <tr 
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--primary-navy)', fontWeight: 600 }}>
                        {p.patientId}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {p.age} yrs · {p.gender}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} color="var(--text-muted)" />
                          <span>{p.phone}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {hasAllergy ? (
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#DC2626',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 600
                            }}
                          >
                            <AlertTriangle size={12} />
                            {p.allergies}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None reported</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>{p.lastVisit}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {p.totalVisits} {p.totalVisits === 1 ? 'visit' : 'visits'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handlePrescribeForPatient(p)}
                            className="btn btn-sm btn-primary"
                            title="Create prescription for this patient"
                          >
                            <FilePlus size={14} />
                            <span>Prescribe</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="btn btn-sm btn-secondary"
                            title="Edit patient details"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePatient}
        initialPatient={editingPatient}
      />
    </div>
  );
};

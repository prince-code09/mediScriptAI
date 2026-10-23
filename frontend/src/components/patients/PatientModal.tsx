import React, { useState, useEffect } from 'react';
import { Patient } from '../../types';
import { X, User, Phone, AlertCircle, FileText, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  initialPatient?: Patient | null;
}

export const PatientModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialPatient }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Patient['gender']>('Male');
  const [phone, setPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialPatient) {
      setName(initialPatient.name);
      setAge(initialPatient.age);
      setGender(initialPatient.gender);
      setPhone(initialPatient.phone);
      setAllergies(initialPatient.allergies);
      setClinicalNotes(initialPatient.clinicalNotes || '');
    } else {
      setName('');
      setAge('');
      setGender('Male');
      setPhone('');
      setAllergies('None reported');
      setClinicalNotes('');
    }
    setErrors({});
  }, [initialPatient, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Patient name is required';
    if (!age || Number(age) <= 0 || Number(age) > 120) errs.age = 'Valid age (1-120) is required';
    if (!phone.trim()) errs.phone = 'Contact number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const patientData: Patient = {
      id: initialPatient ? initialPatient.id : `p-${Date.now()}`,
      patientId: initialPatient ? initialPatient.patientId : `PAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      age: Number(age),
      gender,
      phone: phone.trim(),
      allergies: allergies.trim() || 'None reported',
      clinicalNotes: clinicalNotes.trim(),
      createdAt: initialPatient ? initialPatient.createdAt : new Date().toISOString().split('T')[0],
      lastVisit: initialPatient ? initialPatient.lastVisit : new Date().toISOString().split('T')[0],
      totalVisits: initialPatient ? initialPatient.totalVisits : 1
    };

    onSave(patientData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          position: 'relative',
          borderRadius: 'var(--radius-md)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {initialPatient ? 'Edit Patient Record' : 'Register New Patient'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Confidential clinical record for OPD consultations
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            style={{ padding: '6px', color: 'var(--text-muted)', borderRadius: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px' }}
              />
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {errors.name && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.name}</span>}
          </div>

          {/* Age and Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Age (Years) *
              </label>
              <input
                type="number"
                placeholder="e.g. 45"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: '100%' }}
              />
              {errors.age && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.age}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Patient['gender'])}
                style={{ width: '100%' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Mobile / Contact Number *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px' }}
              />
              <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {errors.phone && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.phone}</span>}
          </div>

          {/* Known Allergies (Safety critical) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: '#DC2626' }}>
              <AlertCircle size={15} />
              <span>Known Drug Allergies (Critical for Safety)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Penicillin, Sulfa drugs, NSAIDs (or None reported)"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              style={{ width: '100%', borderColor: allergies && allergies !== 'None reported' ? '#FCA5A5' : undefined }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Alerts doctor when prescribing contraindicated medicines.
            </span>
          </div>

          {/* Clinical Notes / Chronic History */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Relevant Clinical Notes / Medical History
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Known hypertensive for 5 years, type 2 diabetes, previous surgeries..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Check size={16} />
              <span>{initialPatient ? 'Save Changes' : 'Register Patient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

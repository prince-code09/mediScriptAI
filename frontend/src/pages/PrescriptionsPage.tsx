import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PrescriptionForm } from '../components/prescription/PrescriptionForm';
import { PrescriptionPrintView } from '../components/prescription/PrescriptionPrintView';
import { Prescription } from '../types';
import { FileText, Sparkles, Printer, Edit3 } from 'lucide-react';

export const PrescriptionsPage: React.FC = () => {
  const { prescriptions, activePrescriptionId, setActivePrescriptionId, stagedVoiceData } = useApp();

  // If there's an activePrescriptionId set in context, preview that prescription
  const selectedRx = activePrescriptionId 
    ? prescriptions.find(p => p.id === activePrescriptionId) || null
    : null;

  const [previewingRx, setPreviewingRx] = useState<Prescription | null>(selectedRx);
  const [isEditing, setIsEditing] = useState<boolean>(!selectedRx);

  // Synchronize state when stagedVoiceData or activePrescriptionId changes
  useEffect(() => {
    if (stagedVoiceData) {
      // Staged voice prescription draft opens immediately in editable review mode
      setPreviewingRx(null);
      setIsEditing(true);
      if (activePrescriptionId) {
        setActivePrescriptionId(null);
      }
    } else if (activePrescriptionId) {
      const rx = prescriptions.find(p => p.id === activePrescriptionId) || null;
      setPreviewingRx(rx);
      setIsEditing(!rx);
    }
  }, [stagedVoiceData, activePrescriptionId, prescriptions]);

  const handlePreview = (rx: Prescription) => {
    setPreviewingRx(rx);
    setIsEditing(false);
  };

  const handleBackToForm = () => {
    setIsEditing(true);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="var(--primary-navy)" />
            <span>{isEditing ? 'Create & Review Prescription' : 'Prescription Preview & Print'}</span>
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {isEditing 
              ? 'Organized clinical fields. Verify dosages and confirm before saving.' 
              : 'Print-ready format with clinic branding and signature area.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {previewingRx && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary btn-sm"
            >
              {isEditing ? <Printer size={15} /> : <Edit3 size={15} />}
              <span>{isEditing ? 'View Print Preview' : 'Edit Fields'}</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <PrescriptionForm
          onPreview={handlePreview}
          initialPrescription={previewingRx}
        />
      ) : previewingRx ? (
        <PrescriptionPrintView
          prescription={previewingRx}
          onEdit={handleBackToForm}
          onBack={handleBackToForm}
        />
      ) : (
        <PrescriptionForm onPreview={handlePreview} />
      )}
    </div>
  );
};

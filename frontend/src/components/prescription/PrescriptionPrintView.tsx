import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Prescription } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Printer, 
  Edit3, 
  CheckCircle2, 
  ArrowLeft, 
  Building2, 
  HeartPulse,
  Languages,
  X,
  FileCheck2,
  FileText
} from 'lucide-react';
import { 
  PrintLanguage, 
  getPrescriptionLabels, 
  translateFrequency, 
  translateInstructions, 
  translateAdvice 
} from '../../services/prescriptionTranslation';

interface Props {
  prescription: Prescription;
  onEdit: () => void;
  onBack?: () => void;
}

export const PrescriptionPrintView: React.FC<Props> = ({ prescription, onEdit, onBack }) => {
  const { formatSettings, savePrescription, showToast, activeClinic } = useApp();
  const [printLang, setPrintLang] = useState<PrintLanguage>(prescription.printLanguage || 'en');
  
  // Mandatory language-selection dialog state before final print action
  const [showLanguageDialog, setShowLanguageDialog] = useState<boolean>(false);
  const [selectedDialogLang, setSelectedDialogLang] = useState<PrintLanguage>(printLang);

  const handleOpenPrintModal = () => {
    setSelectedDialogLang(printLang);
    setShowLanguageDialog(true);
  };

  // Apply language and refresh the on-screen preview WITHOUT opening print dialog
  const handleApplyLanguage = (newLang: PrintLanguage) => {
    setPrintLang(newLang);
    setShowLanguageDialog(false);

    // Save language choice to record
    const updated: Prescription = {
      ...prescription,
      printLanguage: newLang
    };
    savePrescription(updated);

    const langName = newLang === 'hi' ? 'हिंदी (Hindi — Devanagari)' : newLang === 'hinglish' ? 'Hinglish (Roman)' : 'English';
    showToast(`Prescription preview updated to ${langName}. Review below, then click Print Prescription.`, 'info');
  };

  // Explicit print trigger: opens browser print dialog only when doctor clicks Print Prescription
  const handlePrintPrescription = () => {
    window.print();
  };

  const handleConfirmSave = () => {
    const updated: Prescription = {
      ...prescription,
      status: 'confirmed',
      syncStatus: 'saved_on_device',
      printLanguage: printLang
    };
    savePrescription(updated);
    showToast('Prescription confirmed and safely saved on this device!', 'success');
  };

  const isA5 = formatSettings.paperSize === 'A5';
  const labels = getPrescriptionLabels(printLang);

  // Check if vitals have any recorded non-empty value
  const vitals = prescription.vitals;
  const hasVitals = Boolean(
    formatSettings.showVitals !== false &&
    vitals &&
    (vitals.bp?.trim() || vitals.pulse?.trim() || vitals.temp?.trim() || vitals.spo2?.trim() || vitals.weight?.trim())
  );

  // Check if clinical context exists
  const hasClinicalNotes = Boolean(
    prescription.symptoms?.trim() ||
    prescription.durationOfSymptoms?.trim() ||
    prescription.clinicalFindings?.trim() ||
    prescription.diagnosis?.trim() ||
    prescription.consultationReport?.trim()
  );

  // Font family resolution: Hindi uses proper Devanagari font stack
  const resolvedFontFamily = printLang === 'hi'
    ? "'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : formatSettings.fontFamily === 'serif'
      ? 'Georgia, serif'
      : 'var(--font-sans)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Action Bar - Hidden in Print */}
      <div 
        className="action-toolbar no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onBack && (
            <button onClick={onBack} className="btn btn-secondary btn-sm" aria-label="Go back">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {prescription.prescriptionNumber}
              </span>
              <StatusBadge status={prescription.syncStatus} />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Paper Layout: {formatSettings.paperSize} ({formatSettings.template === 'custom' ? 'Custom Clinic Template' : 'General Format'}) · Language: {printLang.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right side controls: Language Selector + Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Quick Language Toggle */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'var(--bg-elevated)', 
              padding: '4px 8px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-subtle)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <Languages size={15} style={{ color: 'var(--primary-violet)' }} />
              <span className="hide-on-mobile">Language:</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['en', 'hi', 'hinglish'] as PrintLanguage[]).map((lang) => {
                const langLabels: Record<PrintLanguage, string> = {
                  en: 'English',
                  hi: 'हिंदी (Hindi)',
                  hinglish: 'Hinglish'
                };
                const isActive = printLang === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setPrintLang(lang)}
                    style={{
                      padding: '4px 9px',
                      fontSize: '0.76rem',
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: '4px',
                      border: isActive ? '1px solid var(--primary-violet)' : '1px solid transparent',
                      background: isActive ? 'var(--primary-violet)' : 'transparent',
                      color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Preview in ${langLabels[lang]}`}
                  >
                    {langLabels[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={onEdit} className="btn btn-secondary" title="Return to editable prescription form without losing data">
            <Edit3 size={16} />
            <span>Back / Edit Fields</span>
          </button>

          <button 
            onClick={handleOpenPrintModal} 
            className="btn btn-secondary"
            title="Select prescription language"
          >
            <Languages size={16} color="var(--ai-violet)" />
            <span>Change Language</span>
          </button>

          {prescription.status !== 'confirmed' && (
            <button onClick={handleConfirmSave} className="btn btn-ai">
              <CheckCircle2 size={16} />
              <span>Confirm & Save</span>
            </button>
          )}

          {/* Explicit Print Action: Opens print dialog directly using current preview language */}
          <button 
            onClick={handlePrintPrescription} 
            className="btn btn-primary" 
            style={{ background: 'var(--primary-navy)' }}
            title="Open browser print dialog"
          >
            <Printer size={16} />
            <span>Print Prescription</span>
          </button>
        </div>
      </div>

      {/* Mandatory Language Selection Modal before Final Print */}
      {showLanguageDialog && (
        <div 
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowLanguageDialog(false)}
        >
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-subtle)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Languages size={22} color="var(--ai-violet)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Select Print Language
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowLanguageDialog(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Select the language for the patient's printed prescription. Medicine names and strengths are preserved accurately for pharmacy safety.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              {/* Option 1: English */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: selectedDialogLang === 'en' ? '2px solid var(--ai-violet)' : '1px solid var(--border-subtle)',
                  background: selectedDialogLang === 'en' ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-card-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="printLanguage" 
                  value="en"
                  checked={selectedDialogLang === 'en'}
                  onChange={() => setSelectedDialogLang('en')}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                    1. English (Default)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Standard English clinical headers, dosing schedules, and dietary instructions.
                  </span>
                </div>
              </label>

              {/* Option 2: Hindi (Devanagari script) */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: selectedDialogLang === 'hi' ? '2px solid var(--ai-violet)' : '1px solid var(--border-subtle)',
                  background: selectedDialogLang === 'hi' ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-card-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="printLanguage" 
                  value="hi"
                  checked={selectedDialogLang === 'hi'}
                  onChange={() => setSelectedDialogLang('hi')}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                    2. हिंदी (Hindi — Devanagari Script)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    मरीज की भाषा में निर्देश एवं खान-पान परहेज। दवाइयों के नाम सुरक्षित रहेंगे।
                  </span>
                </div>
              </label>

              {/* Option 3: Hinglish (Roman script) */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: selectedDialogLang === 'hinglish' ? '2px solid var(--ai-violet)' : '1px solid var(--border-subtle)',
                  background: selectedDialogLang === 'hinglish' ? 'rgba(139, 92, 246, 0.06)' : 'var(--bg-card-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input 
                  type="radio" 
                  name="printLanguage" 
                  value="hinglish"
                  checked={selectedDialogLang === 'hinglish'}
                  onChange={() => setSelectedDialogLang('hinglish')}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                    3. Hinglish (Hindi in Roman Script)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Hindi written in English alphabets (e.g., 'Subah khali pet lein').
                  </span>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setShowLanguageDialog(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleApplyLanguage(selectedDialogLang)}
                className="btn btn-ai btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Languages size={15} />
                <span>Apply Language & Preview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Prescription Document Container */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <div 
          className={`prescription-print-document ${isA5 ? 'print-page-a5' : 'print-page-a4'}`}
          style={{
            width: '100%',
            maxWidth: isA5 ? '165mm' : '210mm',
            minHeight: isA5 ? '220mm' : '285mm',
            background: '#FFFFFF',
            color: '#1A202C',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: isA5 ? '20px 24px' : '28px 36px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: resolvedFontFamily,
            lineHeight: printLang === 'hi' ? 1.6 : 1.45,
            boxSizing: 'border-box'
          }}
        >
          {/* Header Section: Clinic & Doctor Details (NO INTERNAL USER/DOCTOR IDs) */}
          <div>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: `2.5px solid ${formatSettings.clinicHeaderColor || '#243B64'}`,
                paddingBottom: '16px',
                marginBottom: '16px'
              }}
            >
              {/* Clinic Branding */}
              <div style={{ maxWidth: '60%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {formatSettings.showClinicLogo !== false && (
                    (prescription.clinicLogoUrl || activeClinic?.logoUrl) ? (
                      <img 
                        src={prescription.clinicLogoUrl || activeClinic?.logoUrl} 
                        alt="Clinic Logo" 
                        style={{
                          maxHeight: '44px',
                          maxWidth: '120px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: formatSettings.clinicHeaderColor || '#243B64',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Building2 size={18} />
                      </div>
                    )
                  )}
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: formatSettings.clinicHeaderColor || '#243B64', margin: 0, lineHeight: 1.15 }}>
                    {prescription.clinicName}
                  </h1>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#4A5568', margin: '2px 0 0 0', lineHeight: 1.35 }}>
                  {prescription.clinicAddress}
                </p>
                {prescription.clinicPhone && (
                  <p style={{ fontSize: '0.8rem', color: '#4A5568', margin: '2px 0 0 0', fontWeight: 500 }}>
                    {labels.clinicPhone}: {prescription.clinicPhone}
                  </p>
                )}
              </div>

              {/* Doctor Details (Credentials only when configured; zero internal DB IDs) */}
              <div style={{ textAlign: 'right', maxWidth: '38%' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1A202C', margin: 0 }}>
                  {prescription.doctorName}
                </h2>
                {prescription.doctorQualification && prescription.doctorQualification.trim() && (
                  <p style={{ fontSize: '0.82rem', color: '#4A5568', margin: '2px 0 0 0', fontWeight: 600 }}>
                    {prescription.doctorQualification}
                  </p>
                )}
                {formatSettings.showDoctorRegNo !== false && prescription.doctorRegNo && prescription.doctorRegNo.trim() && (
                  <p style={{ fontSize: '0.78rem', color: '#718096', margin: '2px 0 0 0' }}>
                    Reg. No: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{prescription.doctorRegNo}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Patient Meta Strip (NO INTERNAL PATIENT ID) */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.84rem'
              }}
            >
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  {labels.patientName}
                </span>
                <span style={{ fontWeight: 700, color: '#1A202C' }}>{prescription.patientName}</span>
              </div>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  {labels.ageGender}
                </span>
                <span style={{ fontWeight: 600, color: '#2D3748' }}>
                  {prescription.patientAge} Yrs / {prescription.patientGender}
                </span>
              </div>
              <div>
                <span style={{ color: '#718096', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  {labels.date}
                </span>
                <span style={{ fontWeight: 600, color: '#2D3748' }}>{prescription.date}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#718096', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  {labels.rxNumber}
                </span>
                <span style={{ fontWeight: 700, color: '#243B64', fontFamily: 'var(--font-mono)' }}>{prescription.prescriptionNumber}</span>
              </div>
            </div>

            {/* Vitals Section - Strictly Optional: Only rendered if at least one vital was entered */}
            {hasVitals && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '7px 12px',
                  background: '#FFFFFF',
                  border: '1px dashed #CBD5E0',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '0.8rem',
                  color: '#2D3748',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#243B64' }}>
                  <HeartPulse size={14} />
                  <span>{labels.vitals}:</span>
                </div>
                {vitals?.bp?.trim() && <div>BP: <strong>{vitals.bp}</strong></div>}
                {vitals?.pulse?.trim() && <div>Pulse: <strong>{vitals.pulse} bpm</strong></div>}
                {vitals?.temp?.trim() && <div>Temp: <strong>{vitals.temp} °F</strong></div>}
                {vitals?.spo2?.trim() && <div>SpO2: <strong>{vitals.spo2}</strong></div>}
                {vitals?.weight?.trim() && <div>Weight: <strong>{vitals.weight} kg</strong></div>}
              </div>
            )}

            {/* Patient Complaints, Clinical Findings, & Diagnosis */}
            {hasClinicalNotes && (
              <div style={{ marginBottom: '18px', fontSize: '0.86rem', lineHeight: 1.5 }}>
                {/* Patient-Reported Complaints */}
                {prescription.symptoms?.trim() && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#2D3748' }}>
                      {printLang === 'hi' ? 'मरीज द्वारा बताए गए लक्षण (Complaints): ' : labels.complaints + ' (Patient-Reported): '}
                    </span>
                    <span style={{ color: '#4A5568' }}>
                      {prescription.symptoms}
                      {prescription.durationOfSymptoms?.trim() ? ` (${prescription.durationOfSymptoms})` : ''}
                    </span>
                  </div>
                )}

                {/* Doctor's Clinical Findings */}
                {prescription.clinicalFindings?.trim() && (
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#2D3748' }}>
                      {printLang === 'hi' ? 'चिकित्सीय जांच (Doctor Examination): ' : labels.findings + ' (Doctor Examination): '}
                    </span>
                    <span style={{ color: '#4A5568' }}>{prescription.clinicalFindings}</span>
                  </div>
                )}

                {/* Confirmed Diagnosis vs Provisional Assessment */}
                {prescription.diagnosis?.trim() && (
                  <div>
                    <span style={{ fontWeight: 700, color: prescription.isDiagnosisConfirmed ? '#059669' : '#D97706' }}>
                      {prescription.isDiagnosisConfirmed ? (
                        printLang === 'hi' 
                          ? '✓ पुष्ट निदान (Doctor-Confirmed Diagnosis): ' 
                          : '✓ Doctor-Confirmed Diagnosis: '
                      ) : (
                        printLang === 'hi' 
                          ? '⚠ संभावित निदान (Provisional Assessment): ' 
                          : '⚠ Provisional Assessment (Unconfirmed): '
                      )}
                    </span>
                    <span style={{ color: '#1A202C', fontWeight: 600 }}>
                      {prescription.diagnosis}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Rx Symbol & Medicine Table */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#243B64', fontFamily: 'serif', fontStyle: 'italic' }}>
                  ℞
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {labels.rxHeader}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #CBD5E0', textAlign: 'left', color: '#4A5568' }}>
                    <th style={{ padding: '6px 8px', width: '28px' }}>#</th>
                    <th style={{ padding: '6px 8px' }}>{labels.colMedicine}</th>
                    <th style={{ padding: '6px 8px', width: '70px' }}>{labels.colDose}</th>
                    <th style={{ padding: '6px 8px', width: '150px' }}>{labels.colFrequency}</th>
                    <th style={{ padding: '6px 8px', width: '80px' }}>{labels.colDuration}</th>
                    {formatSettings.showDosageInstructions !== false && (
                      <th style={{ padding: '6px 8px' }}>{labels.colInstructions}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {prescription.medicines.map((med, index) => (
                    <tr key={med.id || index} style={{ borderBottom: '1px solid #EDF2F7' }}>
                      <td style={{ padding: '8px 8px', color: '#718096', fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: '8px 8px' }}>
                        {/* Medicine name is strictly preserved for medical accuracy */}
                        <strong style={{ color: '#1A202C' }}>{med.name}</strong>
                        <div style={{ fontSize: '0.74rem', color: '#718096' }}>
                          {med.dosageForm} {med.strength && `· ${med.strength}`} {med.route && `· [${med.route}]`}
                        </div>
                      </td>
                      <td style={{ padding: '8px 8px', color: '#2D3748' }}>{med.dose}</td>
                      <td style={{ padding: '8px 8px', color: '#243B64', fontWeight: 600 }}>
                        {translateFrequency(med.frequency, printLang)}
                      </td>
                      <td style={{ padding: '8px 8px', color: '#2D3748' }}>{med.duration}</td>
                      {formatSettings.showDosageInstructions !== false && (
                        <td style={{ padding: '8px 8px', color: '#4A5568', fontStyle: 'italic' }}>
                          {translateInstructions(med.instructions || '', printLang) || '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Advice and Follow-Up - Strictly Optional */}
            {(
              (formatSettings.showAdvice !== false && Boolean(prescription.advice?.trim())) ||
              (formatSettings.showFollowUp !== false && Boolean(prescription.followUp?.trim()))
            ) && (
              <div style={{ marginBottom: '24px', fontSize: '0.85rem' }}>
                {formatSettings.showAdvice !== false && Boolean(prescription.advice?.trim()) && (
                  <div style={{ marginBottom: '8px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '4px', borderLeft: '3px solid #243B64' }}>
                    <strong style={{ color: '#1A202C' }}>{labels.adviceHeader}: </strong>
                    <span style={{ color: '#4A5568' }}>{translateAdvice(prescription.advice, printLang)}</span>
                  </div>
                )}
                {formatSettings.showFollowUp !== false && Boolean(prescription.followUp?.trim()) && (
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: '4px', borderLeft: '3px solid #7667F8' }}>
                    <strong style={{ color: '#1A202C' }}>{labels.followUpHeader}: </strong>
                    <span style={{ color: '#4A5568' }}>{prescription.followUp}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with Doctor Signature & Legal Note (NO INTERNAL DATABASE IDs) */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.74rem', color: '#718096', maxWidth: '60%' }}>
                {formatSettings.printNotes || labels.legalNote}
              </div>

              {formatSettings.showSignatureLine !== false && (
                <div style={{ textAlign: 'center', width: '180px' }}>
                  <div style={{ height: '38px', borderBottom: '1px dashed #718096', marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1A202C', display: 'block' }}>
                    {prescription.doctorName}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#718096' }}>
                    {labels.signatureLabel}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#A0AEC0' }}>
              <span>Generated via MediScript Clinical AI</span>
              <span>Electronic Medical Record · {prescription.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

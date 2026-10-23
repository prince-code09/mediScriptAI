import React from 'react';
import { ClinicProfile, DoctorProfile, FormatSettings } from '../../types';
import { Building2, HeartPulse, Check, Sparkles } from 'lucide-react';

interface Props {
  settings: FormatSettings;
  doctor: DoctorProfile;
  clinic: ClinicProfile;
}

export const LiveFormatPreview: React.FC<Props> = ({ settings, doctor, clinic }) => {
  const isA5 = settings.paperSize === 'A5';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* Live Preview Header Pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--ai-violet)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Live Prescription Preview
          </span>
        </div>
        <span 
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {settings.paperSize} Format ({settings.template === 'custom' ? 'Custom Clinic' : 'Default General'})
        </span>
      </div>

      {/* Illustrative Notice */}
      <div 
        style={{
          background: 'rgba(118, 103, 248, 0.08)',
          border: '1px dashed rgba(118, 103, 248, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)'
        }}
      >
        <strong>Preview Sample:</strong> Illustrates layout and selected formatting. Real patient data is never populated here.
      </div>

      {/* Scaled Prescription Sheet */}
      <div 
        style={{
          width: '100%',
          maxWidth: isA5 ? '100%' : '100%',
          minHeight: isA5 ? '380px' : '480px',
          background: '#FFFFFF',
          color: '#1A202C',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          padding: isA5 ? '18px 22px' : '24px 28px',
          fontSize: isA5 ? '0.76rem' : '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Upper Document Area */}
        <div>
          {/* Clinic Header */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: `2px solid ${settings.clinicHeaderColor || '#243B64'}`,
              paddingBottom: '12px',
              marginBottom: '12px'
            }}
          >
            {/* Left: Clinic Info */}
            <div style={{ maxWidth: '60%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                {settings.showClinicLogo && (
                  clinic.logoUrl ? (
                    <img 
                      src={clinic.logoUrl} 
                      alt="Clinic Logo" 
                      style={{
                        width: '28px',
                        height: '28px',
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
                        width: '26px',
                        height: '26px',
                        borderRadius: '5px',
                        background: settings.clinicHeaderColor || '#243B64',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Building2 size={15} />
                    </div>
                  )
                )}
                <h4 style={{ fontSize: isA5 ? '1.05rem' : '1.2rem', fontWeight: 800, color: settings.clinicHeaderColor || '#243B64', margin: 0, lineHeight: 1.15 }}>
                  {clinic.name}
                </h4>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#4A5568', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                {clinic.address}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#4A5568', margin: '2px 0 0 0', fontWeight: 500 }}>
                Phone: {clinic.phone}
              </p>
            </div>

            {/* Right: Doctor Info */}
            <div style={{ textAlign: 'right', maxWidth: '38%' }}>
              <div style={{ fontSize: isA5 ? '0.88rem' : '0.98rem', fontWeight: 800, color: '#1A202C' }}>
                {doctor.fullName}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#4A5568', fontWeight: 600 }}>
                {doctor.qualification}
              </div>
              {settings.showDoctorRegNo !== false && (
                <div style={{ fontSize: '0.7rem', color: '#718096' }}>
                  Reg. No: <span style={{ fontFamily: 'var(--font-mono)' }}>{doctor.regNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Patient Meta Strip */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              padding: '6px 10px',
              marginBottom: '12px',
              fontSize: '0.76rem'
            }}
          >
            <div>
              <span style={{ color: '#718096', display: 'block', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Patient Name</span>
              <strong style={{ color: '#1A202C' }}>Sample Patient</strong>
            </div>
            <div>
              <span style={{ color: '#718096', display: 'block', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Age / Gender</span>
              <span style={{ color: '#2D3748' }}>45 Yrs / Male</span>
            </div>
            <div>
              <span style={{ color: '#718096', display: 'block', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Date</span>
              <span style={{ color: '#2D3748' }}>22-Oct-2026</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#718096', display: 'block', fontSize: '0.66rem', textTransform: 'uppercase', fontWeight: 600 }}>Rx Number</span>
              <span style={{ fontWeight: 700, color: '#243B64', fontFamily: 'var(--font-mono)' }}>RX-SAMPLE</span>
            </div>
          </div>

          {/* Patient Vitals Strip (Conditional) */}
          {settings.showVitals && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px 8px',
                background: '#FFFFFF',
                border: '1px dashed #CBD5E0',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '0.72rem',
                color: '#2D3748',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#243B64' }}>
                <HeartPulse size={12} />
                <span>Vitals:</span>
              </div>
              <div>BP: <strong>120/80</strong></div>
              <div>Pulse: <strong>76 bpm</strong></div>
              <div>Temp: <strong>98.6 °F</strong></div>
              <div>SpO2: <strong>98%</strong></div>
            </div>
          )}

          {/* Rx Symbol & Sample Medicines Table */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#243B64', fontFamily: 'serif', fontStyle: 'italic' }}>
                ℞
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4A5568', textTransform: 'uppercase' }}>
                Prescribed Medicines
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #CBD5E0', textAlign: 'left', color: '#4A5568' }}>
                  <th style={{ padding: '4px 6px', width: '24px' }}>#</th>
                  <th style={{ padding: '4px 6px' }}>Medicine</th>
                  <th style={{ padding: '4px 6px', width: '50px' }}>Dose</th>
                  <th style={{ padding: '4px 6px', width: '100px' }}>Frequency</th>
                  <th style={{ padding: '4px 6px', width: '60px' }}>Duration</th>
                  {settings.showDosageInstructions !== false && (
                    <th style={{ padding: '4px 6px' }}>Instructions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #EDF2F7' }}>
                  <td style={{ padding: '5px 6px', color: '#718096' }}>1</td>
                  <td style={{ padding: '5px 6px' }}>
                    <strong style={{ color: '#1A202C' }}>Paracetamol 650 mg</strong> (Tab)
                  </td>
                  <td style={{ padding: '5px 6px' }}>1 Tab</td>
                  <td style={{ padding: '5px 6px', color: '#243B64', fontWeight: 600 }}>1-0-1 (After Food)</td>
                  <td style={{ padding: '5px 6px' }}>3 Days</td>
                  {settings.showDosageInstructions !== false && (
                    <td style={{ padding: '5px 6px', color: '#4A5568', fontStyle: 'italic' }}>After meals with water</td>
                  )}
                </tr>
                <tr style={{ borderBottom: '1px solid #EDF2F7' }}>
                  <td style={{ padding: '5px 6px', color: '#718096' }}>2</td>
                  <td style={{ padding: '5px 6px' }}>
                    <strong style={{ color: '#1A202C' }}>Pantoprazole 40 mg</strong> (Tab)
                  </td>
                  <td style={{ padding: '5px 6px' }}>1 Tab</td>
                  <td style={{ padding: '5px 6px', color: '#243B64', fontWeight: 600 }}>1-0-0 (Empty Stomach)</td>
                  <td style={{ padding: '5px 6px' }}>5 Days</td>
                  {settings.showDosageInstructions !== false && (
                    <td style={{ padding: '5px 6px', color: '#4A5568', fontStyle: 'italic' }}>Morning 30m before tea</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Advice & Follow-Up (Conditional) */}
          {(settings.showAdvice !== false || settings.showFollowUp !== false) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px', fontSize: '0.72rem' }}>
              {settings.showAdvice !== false && (
                <div style={{ padding: '4px 8px', background: '#F8FAFC', borderRadius: '4px', borderLeft: '2.5px solid #243B64' }}>
                  <strong>General Advice: </strong>
                  <span style={{ color: '#4A5568' }}>Warm saline gargles, plenty of boiled water, rest.</span>
                </div>
              )}
              {settings.showFollowUp !== false && (
                <div style={{ padding: '4px 8px', background: '#F8FAFC', borderRadius: '4px', borderLeft: '2.5px solid #7667F8' }}>
                  <strong>Next Follow-Up: </strong>
                  <span style={{ color: '#4A5568' }}>Review in OPD after 4 days or SOS if needed.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
            <div style={{ fontSize: '0.68rem', color: '#718096', maxWidth: '65%' }}>
              {settings.printNotes || 'Valid for dispensing at any licensed pharmacy in India.'}
            </div>

            {settings.showSignatureLine !== false && (
              <div style={{ textAlign: 'center', width: '130px' }}>
                <div style={{ height: '24px', borderBottom: '1px dashed #718096', marginBottom: '2px' }} />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1A202C', display: 'block' }}>
                  {doctor.fullName}
                </span>
                <span style={{ fontSize: '0.64rem', color: '#718096' }}>
                  Signature & Seal
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#A0AEC0' }}>
            <span>MediScript OPD Format</span>
            <span>Electronic Record Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};

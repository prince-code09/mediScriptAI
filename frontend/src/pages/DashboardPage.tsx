import React from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyVisitsChart } from '../components/dashboard/WeeklyVisitsChart';
import { PatientSourceChart } from '../components/dashboard/PatientSourceChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Users, 
  FileCheck2, 
  FilePlus, 
  ArrowRight, 
  Calendar,
  Eye,
  FileText
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { patients, prescriptions, setCurrentPage, activeClinic, setStagedVoiceData, setActivePrescriptionId } = useApp();

  // Filter genuine records for the active clinic
  const clinicPrescriptions = prescriptions.filter(
    p => !activeClinic?.id || !p.clinicId || p.clinicId === activeClinic.id
  );
  const clinicPatients = patients;

  // Real date reference
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayPrescriptions = clinicPrescriptions.filter(p => p.date === todayDateStr);
  
  // Real calculations computed strictly from existing genuine records
  const todayVisitsCount = todayPrescriptions.length;
  const uniquePatientKeys = new Set(todayPrescriptions.map(p => p.patientId || p.patientName));
  const todayUniquePatients = uniquePatientKeys.size;
  const todayConfirmedCount = todayPrescriptions.filter(p => p.isDiagnosisConfirmed !== false).length;

  // Recent 4 genuine patients & prescriptions
  const recentPatients = clinicPatients.slice(0, 4);
  const recentPrescriptions = clinicPrescriptions.slice(0, 4);

  const handleStartPrescription = () => {
    setStagedVoiceData(null);
    setCurrentPage('prescriptions');
  };

  const handleViewPrescription = (rxId: string) => {
    setActivePrescriptionId(rxId);
    setCurrentPage('prescriptions');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Clinic Analytics & OPD Dashboard
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Daily consultation metrics and patient flow for <strong>{activeClinic.name}</strong>
          </p>
        </div>

        <button
          onClick={handleStartPrescription}
          className="btn btn-ai"
        >
          <FilePlus size={17} />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Primary Statistic Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Metric 1: Today's Patient Visits */}
        <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(36, 59, 100, 0.1)',
              color: 'var(--primary-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
              Today's Patient Visits
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {todayVisitsCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({todayUniquePatients} unique {todayUniquePatients === 1 ? 'patient' : 'patients'})
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Total consultations recorded today
            </span>
          </div>
        </div>

        {/* Metric 2: Today's Confirmed Prescriptions */}
        <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(118, 103, 248, 0.12)',
              color: 'var(--ai-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FileCheck2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
              Confirmed Prescriptions
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {todayConfirmedCount}
              </span>
              <span style={{ fontSize: '0.8rem', color: todayConfirmedCount > 0 ? '#059669' : 'var(--text-muted)', fontWeight: 600 }}>
                {todayConfirmedCount > 0 ? 'Doctor Confirmed' : 'None today'}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Saved locally on device & ready to print
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: 3D Grouped Column Chart + Patient Source Donut Chart */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        {/* 7-Day Patient Visits 3D Column Graph */}
        <div className="card" style={{ flex: 2, minWidth: '320px' }}>
          <WeeklyVisitsChart />
        </div>

        {/* Patient Source Breakdown Compact Donut Chart */}
        <div className="card" style={{ flex: 1, minWidth: '260px' }}>
          <PatientSourceChart />
        </div>
      </div>

      {/* Bottom Row: Recent Patients & Prescription Activity */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Section 1: Recent Consulted Patients */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Recent Consulted Patients
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Latest patient records in this clinic
              </span>
            </div>

            <button
              onClick={() => setCurrentPage('patients')}
              className="btn btn-secondary btn-sm"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div 
              style={{ 
                padding: '2.5rem 1rem', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-subtle)'
              }}
            >
              <Users size={30} style={{ opacity: 0.35, marginBottom: '6px' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No consultation data yet
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Patients consulted in this clinic will appear here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentPatients.map(p => (
                <div
                  key={p.id}
                  onClick={() => setCurrentPage('patients')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {p.age} Yrs · {p.gender} · {p.phone}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--primary-navy)', fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'block' }}>
                      {p.patientId}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Last: {p.lastVisit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Recent Prescription Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Prescription Activity
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Confirmed prescriptions on this device
              </span>
            </div>

            <button
              onClick={() => setCurrentPage('history')}
              className="btn btn-secondary btn-sm"
            >
              <span>Rx History</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentPrescriptions.length === 0 ? (
            <div 
              style={{ 
                padding: '2.5rem 1rem', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-subtle)'
              }}
            >
              <FileText size={30} style={{ opacity: 0.35, marginBottom: '6px' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No prescriptions yet
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Confirmed prescriptions will be listed here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentPrescriptions.map(rx => (
                <div
                  key={rx.id}
                  onClick={() => handleViewPrescription(rx.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card-subtle)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(118, 103, 248, 0.12)',
                        color: 'var(--ai-violet)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem'
                      }}
                    >
                      ℞
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {rx.patientName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        {rx.medicines.length} medicines · {rx.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={rx.syncStatus} showIcon={false} />
                    <Eye size={15} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

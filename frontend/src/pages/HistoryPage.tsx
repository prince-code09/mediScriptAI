import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Prescription } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  History, 
  Search, 
  Printer, 
  Eye, 
  Calendar, 
  User, 
  Filter, 
  CheckCircle2, 
  Clock, 
  HardDrive 
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { prescriptions, setActivePrescriptionId, setCurrentPage } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = prescriptions.filter(p => {
    const matchesSearch = 
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patientPhone && p.patientPhone.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'all' || p.syncStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewPrescription = (rx: Prescription) => {
    setActivePrescriptionId(rx.id);
    setCurrentPage('prescriptions');
  };

  const handleDirectReprint = (rx: Prescription) => {
    setActivePrescriptionId(rx.id);
    setCurrentPage('prescriptions');
    // Allow state to mount then invoke print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} color="var(--primary-navy)" />
            <span>Prescription History & Reprints</span>
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Archived OPD prescriptions saved locally and synced to cloud
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Rx number, patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
          />
        </div>

        {/* Sync Status Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: statusFilter === 'all' ? 'var(--primary-navy)' : 'var(--bg-card)',
              color: statusFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            All Records ({prescriptions.length})
          </button>
          <button
            onClick={() => setStatusFilter('saved_on_device')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: statusFilter === 'saved_on_device' ? 'var(--primary-navy)' : 'var(--bg-card)',
              color: statusFilter === 'saved_on_device' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Saved on Device
          </button>
          <button
            onClick={() => setStatusFilter('synced')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: statusFilter === 'synced' ? 'var(--primary-navy)' : 'var(--bg-card)',
              color: statusFilter === 'synced' ? '#FFFFFF' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Synced
          </button>
        </div>
      </div>

      {/* Prescription History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Prescriptions Found
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
              Try adjusting your search criteria or create a new prescription.
            </p>
          </div>
        ) : (
          filtered.map(rx => (
            <div 
              key={rx.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.15rem 1.35rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: rx.source === 'voice' ? 'var(--ai-violet-light)' : 'rgba(36, 59, 100, 0.1)',
                    color: rx.source === 'voice' ? 'var(--ai-violet)' : 'var(--primary-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}
                >
                  Rx
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary-navy)' }}>
                      {rx.prescriptionNumber}
                    </span>
                    <StatusBadge status={rx.syncStatus} />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Source: {rx.source === 'voice' ? 'AI Voice Dictation' : 'Manual Entry'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-primary)' }}>
                    {rx.patientName} <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>({rx.patientAge}y · {rx.patientGender})</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {rx.medicines.length} Medicines: {rx.medicines.slice(0, 3).map(m => m.name).join(', ')}{rx.medicines.length > 3 ? '...' : ''}
                  </div>
                </div>
              </div>

              {/* Right Side: Date & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <Calendar size={13} />
                    <span>{rx.date}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem' }}>{rx.clinicName}</div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleViewPrescription(rx)}
                    className="btn btn-secondary btn-sm"
                    title="View and Edit Prescription"
                  >
                    <Eye size={15} />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDirectReprint(rx)}
                    className="btn btn-primary btn-sm"
                    title="Reprint this Prescription"
                  >
                    <Printer size={15} />
                    <span>Reprint</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

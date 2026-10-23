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
  HardDrive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Info,
  Archive,
  ShieldAlert
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { 
    prescriptions, 
    recycleBin,
    softDeletePrescription,
    restorePrescription,
    permanentlyDeletePrescription,
    emptyRecycleBin,
    setActivePrescriptionId, 
    setCurrentPage 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'recycle-bin'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Confirmation Modals State
  const [rxToSoftDelete, setRxToSoftDelete] = useState<Prescription | null>(null);
  const [rxToPermanentDelete, setRxToPermanentDelete] = useState<Prescription | null>(null);
  const [showEmptyBinModal, setShowEmptyBinModal] = useState(false);

  const filteredActive = prescriptions.filter(p => {
    const matchesSearch = 
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patientPhone && p.patientPhone.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'all' || p.syncStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredRecycleBin = recycleBin.filter(p => {
    return (
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prescriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patientPhone && p.patientPhone.includes(searchTerm))
    );
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
    }, 400);
  };

  const handleConfirmSoftDelete = () => {
    if (rxToSoftDelete) {
      softDeletePrescription(rxToSoftDelete.id);
      setRxToSoftDelete(null);
    }
  };

  const handleConfirmPermanentDelete = () => {
    if (rxToPermanentDelete) {
      permanentlyDeletePrescription(rxToPermanentDelete.id);
      setRxToPermanentDelete(null);
    }
  };

  const handleConfirmEmptyBin = () => {
    emptyRecycleBin();
    setShowEmptyBinModal(false);
  };

  const calculateExpiryInfo = (rx: Prescription) => {
    const deletionTime = rx.deletedAt ? new Date(rx.deletedAt).getTime() : Date.now();
    const expiryTime = deletionTime + 15 * 24 * 60 * 60 * 1000;
    const msRemaining = expiryTime - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const formattedDeletion = new Date(deletionTime).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const formattedExpiry = new Date(expiryTime).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return { daysRemaining, formattedDeletion, formattedExpiry };
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} color="var(--primary-navy)" />
            <span>Prescription History & Archives</span>
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Archived OPD prescriptions saved locally, synced to cloud, with 15-day safety retention
          </p>
        </div>

        {/* View Switcher Tabs: Active History vs Recycle Bin */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'active' ? 'var(--primary-navy)' : 'transparent',
              color: activeTab === 'active' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Archive size={16} />
            <span>Active Prescriptions ({prescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('recycle-bin')}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'recycle-bin' ? 'var(--primary-navy)' : 'transparent',
              color: activeTab === 'recycle-bin' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Trash2 size={16} />
            <span>Recycle Bin ({recycleBin.length})</span>
          </button>
        </div>
      </div>

      {/* ACTIVE PRESCRIPTIONS TAB */}
      {activeTab === 'active' && (
        <>
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
            {filteredActive.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No Prescriptions Found
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Try adjusting your search criteria or create a new consultation.
                </p>
              </div>
            ) : (
              filteredActive.map(rx => (
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
                        {rx.printLanguage && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-subtle, #f1f5f9)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                            {rx.printLanguage}
                          </span>
                        )}
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

                      <button
                        onClick={() => setRxToSoftDelete(rx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          transition: 'background 0.15s ease'
                        }}
                        title="Move to Recycle Bin (15-day safety retention)"
                      >
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* RECYCLE BIN TAB */}
      {activeTab === 'recycle-bin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Informative Recycle Bin Banner */}
          <div 
            style={{
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={22} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                  15-Day Automatic Retention & Safety Recycle Bin
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Deleted prescriptions are held here for exactly 15 days before automatic permanent deletion. You can restore any prescription or permanently purge it immediately.
                </div>
              </div>
            </div>

            {recycleBin.length > 0 && (
              <button
                onClick={() => setShowEmptyBinModal(true)}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600
                }}
              >
                <Trash2 size={15} />
                <span>Empty Recycle Bin</span>
              </button>
            )}
          </div>

          {/* Search inside Recycle Bin */}
          {recycleBin.length > 0 && (
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search deleted prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '38px', borderRadius: 'var(--radius-full)' }}
              />
            </div>
          )}

          {/* Recycle Bin Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredRecycleBin.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                <Trash2 size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Recycle Bin is Empty
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  No deleted prescriptions. Prescriptions deleted from active history will appear here for 15 days.
                </p>
              </div>
            ) : (
              filteredRecycleBin.map(rx => {
                const { daysRemaining, formattedDeletion, formattedExpiry } = calculateExpiryInfo(rx);

                return (
                  <div 
                    key={rx.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.15rem 1.35rem',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div 
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={20} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {rx.prescriptionNumber}
                          </span>
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px',
                              padding: '2px 8px', 
                              borderRadius: 'var(--radius-full)', 
                              fontSize: '0.75rem', 
                              fontWeight: 700,
                              background: daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              color: daysRemaining <= 3 ? '#dc2626' : '#d97706'
                            }}
                          >
                            <Clock size={12} />
                            <span>Auto-purges in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}</span>
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-primary)' }}>
                          {rx.patientName} <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>({rx.patientAge}y · {rx.patientGender})</span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span><strong>Deleted on:</strong> {formattedDeletion}</span>
                          <span><strong>Expiry Date:</strong> {formattedExpiry}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Restore & Permanent Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => restorePrescription(rx.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        title="Restore prescription back to Active OPD History"
                      >
                        <RotateCcw size={15} color="#16a34a" />
                        <span style={{ color: '#16a34a' }}>Restore</span>
                      </button>

                      <button
                        onClick={() => setRxToPermanentDelete(rx)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#dc2626',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                        title="Permanently remove now (Cannot be undone)"
                      >
                        <Trash2 size={15} />
                        <span>Delete Forever</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SOFT DELETE CONFIRMATION */}
      {rxToSoftDelete && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Move to Recycle Bin?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Prescription: {rxToSoftDelete.prescriptionNumber}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', background: 'var(--bg-subtle, #f8fafc)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Patient:</strong> {rxToSoftDelete.patientName} ({rxToSoftDelete.patientAge}y · {rxToSoftDelete.patientGender})</div>
              <div style={{ marginTop: '6px' }}><strong>Date:</strong> {rxToSoftDelete.date} · {rxToSoftDelete.medicines.length} Medicines</div>
              <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                This prescription will be moved to the Recycle Bin and retained safely for <strong>15 days</strong>. You can restore it anytime before 15 days, after which it will be permanently purged.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setRxToSoftDelete(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSoftDelete}
                style={{
                  background: '#dc2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} />
                <span>Move to Recycle Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PERMANENT DELETE CONFIRMATION */}
      {rxToPermanentDelete && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Permanently Delete Prescription?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                  This action CANNOT be undone!
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Prescription Number:</strong> {rxToPermanentDelete.prescriptionNumber}</div>
              <div><strong>Patient:</strong> {rxToPermanentDelete.patientName}</div>
              <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#b91c1c' }}>
                Are you sure you want to permanently erase this record? It will be immediately and irreversibly removed from local storage and the cloud database.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setRxToPermanentDelete(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                style={{
                  background: '#dc2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} />
                <span>Delete Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EMPTY RECYCLE BIN CONFIRMATION */}
      {showEmptyBinModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Empty Entire Recycle Bin?
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                  Permanent purge of {recycleBin.length} prescription(s)
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to permanently purge all <strong>{recycleBin.length}</strong> deleted prescription(s) right now? None of these records can be recovered once purged.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={() => setShowEmptyBinModal(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.86rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmptyBin}
                style={{
                  background: '#dc2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={16} />
                <span>Empty All Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

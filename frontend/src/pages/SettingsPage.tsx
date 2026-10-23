import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeMode, TextSize, LayoutDensity, Language, FormatSettings } from '../types';
import { LiveFormatPreview } from '../components/prescription/LiveFormatPreview';
import { supabase } from '../services/supabaseClient';
import { apiClient } from '../services/apiClient';
import { 
  Settings, 
  Palette, 
  User, 
  Building2, 
  FileText, 
  Mic, 
  Shield, 
  LogOut, 
  Check, 
  Sun, 
  Moon, 
  Laptop,
  Save,
  RotateCcw,
  Sparkles,
  Printer,
  Upload,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  KeyRound
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { 
    user,
    theme, 
    setTheme, 
    textSize, 
    setTextSize, 
    layoutDensity, 
    setLayoutDensity, 
    language, 
    setLanguage, 
    doctor, 
    updateDoctor, 
    clinics, 
    activeClinicId, 
    setActiveClinicId, 
    activeClinic, 
    updateClinic, 
    formatSettings, 
    updateFormatSettings, 
    logout,
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'appearance' | 'doctor' | 'clinic' | 'format' | 'voice' | 'security'>('appearance');

  // Form states for Doctor
  const [docName, setDocName] = useState(doctor.fullName);
  const [docQual, setDocQual] = useState(doctor.qualification);
  const [docReg, setDocReg] = useState(doctor.regNumber);
  const [docPhone, setDocPhone] = useState(doctor.phone);
  const [docEmail, setDocEmail] = useState(doctor.email);

  // Form states for Active Clinic
  const [clinicName, setClinicName] = useState(activeClinic.name);
  const [clinicAddress, setClinicAddress] = useState(activeClinic.address);
  const [clinicPhone, setClinicPhone] = useState(activeClinic.phone);
  const [clinicTagline, setClinicTagline] = useState(activeClinic.tagline || '');
  const [clinicLogoUrl, setClinicLogoUrl] = useState<string | undefined>(activeClinic.logoUrl);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Synchronize form states whenever active clinic changes or doctor switches accounts
  React.useEffect(() => {
    setClinicName(activeClinic.name);
    setClinicAddress(activeClinic.address);
    setClinicPhone(activeClinic.phone);
    setClinicTagline(activeClinic.tagline || '');
    setClinicLogoUrl(activeClinic.logoUrl);
  }, [activeClinic]);

  // Handle logo file selection and validation (PNG, JPG, WEBP under 2MB)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      showToast('Please select a valid image file (PNG, JPG, or WEBP).', 'error');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      showToast('Logo file size exceeds 2MB limit. Please upload a smaller image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setClinicLogoUrl(dataUrl);
        showToast('Logo selected! Click Save Clinic Profile to persist.', 'info');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setClinicLogoUrl(undefined);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    showToast('Custom logo removed. Default medical icon will be used.', 'info');
  };

  // Form states for Prescription Format
  const [template, setTemplate] = useState<FormatSettings['template']>(formatSettings.template);
  const [paperSize, setPaperSize] = useState<FormatSettings['paperSize']>(formatSettings.paperSize);
  const [showLogo, setShowLogo] = useState(formatSettings.showClinicLogo);
  const [showVitals, setShowVitals] = useState(formatSettings.showVitals);
  const [headerColor, setHeaderColor] = useState(formatSettings.clinicHeaderColor || '#243B64');
  const [printNotes, setPrintNotes] = useState(formatSettings.printNotes);
  const [showDoctorRegNo, setShowDoctorRegNo] = useState(formatSettings.showDoctorRegNo !== false);
  const [showPatientPhone, setShowPatientPhone] = useState(formatSettings.showPatientPhone !== false);
  const [showDosageInstructions, setShowDosageInstructions] = useState(formatSettings.showDosageInstructions !== false);
  const [showAdvice, setShowAdvice] = useState(formatSettings.showAdvice !== false);
  const [showFollowUp, setShowFollowUp] = useState(formatSettings.showFollowUp !== false);
  const [showSignatureLine, setShowSignatureLine] = useState(formatSettings.showSignatureLine !== false);

  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtpLoading, setDeleteOtpLoading] = useState(false);
  const [deleteOtpCooldown, setDeleteOtpCooldown] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Resend cooldown timer for delete account OTP
  useEffect(() => {
    if (deleteOtpCooldown <= 0) return;
    const t = setTimeout(() => setDeleteOtpCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [deleteOtpCooldown]);

  const handleSendDeleteOtp = async () => {
    if (!user?.email) {
      setDeleteError("Unable to locate doctor clinical email for OTP verification.");
      return;
    }
    setDeleteOtpLoading(true);
    setDeleteError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        setDeleteError(`Failed to send OTP: ${error.message}`);
        showToast(error.message, 'error');
      } else {
        setDeleteOtpSent(true);
        setDeleteOtpCooldown(30);
        showToast(`Verification OTP & reset link sent to ${user.email}`, 'info');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to dispatch verification OTP.');
      showToast('Failed to dispatch verification OTP', 'error');
    } finally {
      setDeleteOtpLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== 'DELETE') {
      setDeleteError("Please type 'DELETE' in all capital letters to confirm.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');

    try {
      // 1. Re-authenticate doctor identity:
      // Option A: Doctor provided 6-digit OTP code sent to email
      if (deleteOtp.trim() && user?.email) {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          email: user.email,
          token: deleteOtp.trim(),
          type: 'recovery'
        });
        if (otpErr) {
          setDeleteError(`Re-authentication failed: ${otpErr.message}. Please check your 6-digit OTP or click Resend.`);
          setDeleteLoading(false);
          return;
        }
      } 
      // Option B: Doctor provided current password
      else if (deletePassword && user?.email) {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: deletePassword
        });
        if (authErr) {
          setDeleteError(`Re-authentication failed: ${authErr.message}. If you forgot your password, click "Forgot Password? Send OTP" to verify identity via email.`);
          setDeleteLoading(false);
          return;
        }
      } 
      // Option C: Neither password nor OTP was entered
      else {
        setDeleteError("Re-authentication required. Please enter your current password, or click 'Forgot Password? Send OTP' to verify via email.");
        setDeleteLoading(false);
        return;
      }

      // 2. Call authorized backend deletion endpoint
      const res = await apiClient.deleteAccount('DELETE', deletePassword || undefined);
      
      if (res && res.success) {
        showToast(res.message || 'Practitioner account permanently deleted.', 'success');
        setShowDeleteModal(false);
        // Only log out and redirect after deletion genuinely succeeds
        logout();
      } else {
        setDeleteError('Account deletion could not be completed. Please try again.');
      }
    } catch (err: any) {
      console.error('Account deletion failure:', err);
      setDeleteError(err.message || 'Failed to delete account. Please verify credentials or connection.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoctor({
      ...doctor,
      fullName: docName,
      qualification: docQual,
      regNumber: docReg,
      phone: docPhone,
      email: docEmail
    });
  };

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinic({
      ...activeClinic,
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      tagline: clinicTagline,
      logoUrl: clinicLogoUrl
    });
  };

  const currentLiveSettings: FormatSettings = {
    template,
    paperSize,
    showClinicLogo: showLogo,
    showVitals,
    showRxHeader: true,
    clinicHeaderColor: headerColor,
    printNotes,
    showDoctorRegNo,
    showPatientPhone,
    showDosageInstructions,
    showAdvice,
    showFollowUp,
    showSignatureLine
  };

  const handleSaveFormat = (e: React.FormEvent) => {
    e.preventDefault();
    updateFormatSettings(currentLiveSettings);
  };

  const handleResetFormatToDefault = () => {
    setTemplate('general');
    setPaperSize('A4');
    setShowLogo(true);
    setShowVitals(true);
    setHeaderColor('#243B64');
    setShowDoctorRegNo(true);
    setShowPatientPhone(true);
    setShowDosageInstructions(true);
    setShowAdvice(true);
    setShowFollowUp(true);
    setShowSignatureLine(true);
    setPrintNotes('Valid for dispensing at any licensed pharmacy in India. Keep out of reach of children.');
    showToast('Reset format settings to default Indian OPD General Format', 'info');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={28} color="var(--primary-navy)" />
          <span>Application Settings</span>
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure doctor credentials, clinic branding, print formats, and theme preferences
        </p>
      </div>

      {/* Tabs */}
      <div 
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '4px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveTab('appearance')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'appearance' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'appearance' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <Palette size={16} />
          <span>Appearance & Display</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'doctor' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'doctor' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'doctor' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <User size={16} />
          <span>Doctor Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('clinic')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'clinic' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'clinic' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'clinic' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <Building2 size={16} />
          <span>Clinic Profiles</span>
        </button>

        <button
          onClick={() => setActiveTab('format')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'format' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'format' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'format' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <FileText size={16} />
          <span>Prescription Formats</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'voice' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'voice' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'voice' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <Mic size={16} />
          <span>Voice & Language</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'security' ? 'var(--bg-card-subtle)' : 'transparent',
            color: activeTab === 'security' ? 'var(--primary-navy)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'security' ? '2.5px solid var(--primary-navy)' : '2.5px solid transparent'
          }}
        >
          <Shield size={16} />
          <span>Security & Sessions</span>
        </button>
      </div>

      {/* Tab 1: Appearance & Display */}
      {activeTab === 'appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Theme Mode */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              Theme Selection
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Preference is securely persisted locally on this computer
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              {/* Light Mode */}
              <button
                onClick={() => setTheme('light')}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: theme === 'light' ? '2px solid var(--primary-navy)' : '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Sun size={26} color="#F59E0B" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Light Mode</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Warm soft off-white</span>
                {theme === 'light' && <Check size={16} color="var(--primary-navy)" />}
              </button>

              {/* Dark Mode */}
              <button
                onClick={() => setTheme('dark')}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: theme === 'dark' ? '2px solid var(--ai-violet)' : '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Moon size={26} color="var(--ai-violet)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dark Mode</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Deep navy contrast</span>
                {theme === 'dark' && <Check size={16} color="var(--ai-violet)" />}
              </button>

              {/* System Mode */}
              <button
                onClick={() => setTheme('system')}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: theme === 'system' ? '2px solid var(--primary-navy)' : '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Laptop size={26} color="var(--text-muted)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>System Default</span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Match OS setting</span>
                {theme === 'system' && <Check size={16} color="var(--primary-navy)" />}
              </button>
            </div>
          </div>

          {/* Text Size & Density */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
              Display Sizing & Density
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Adjust legibility for varying screen distances in OPD consulting rooms
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Text Sizing Scale
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['normal', 'medium', 'large'] as TextSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setTextSize(size)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: textSize === size ? '2px solid var(--primary-navy)' : '1px solid var(--border-subtle)',
                        background: textSize === size ? 'var(--bg-card-subtle)' : 'transparent',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Layout Density
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['comfortable', 'compact'] as LayoutDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setLayoutDensity(d)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: layoutDensity === d ? '2px solid var(--primary-navy)' : '1px solid var(--border-subtle)',
                        background: layoutDensity === d ? 'var(--bg-card-subtle)' : 'transparent',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Doctor Profile */}
      {activeTab === 'doctor' && (
        <form onSubmit={handleSaveDoctor} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Practitioner Details
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              These clinical credentials appear automatically on all confirmed prescriptions and prints
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Full Doctor Name *
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Medical Registration Number *
              </label>
              <input
                type="text"
                value={docReg}
                onChange={(e) => setDocReg(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Qualifications & Degrees *
              </label>
              <input
                type="text"
                value={docQual}
                onChange={(e) => setDocQual(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Contact Phone
              </label>
              <input
                type="text"
                value={docPhone}
                onChange={(e) => setDocPhone(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Registered Clinical Email
            </label>
            <input
              type="email"
              value={docEmail}
              onChange={(e) => setDocEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Doctor Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Clinic Profiles & Multi-Clinic Switcher */}
      {activeTab === 'clinic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Clinic Switcher List */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Configured Clinic Locations
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Future-ready multi-clinic support: switch locations to update print headers
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clinics.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: c.id === activeClinicId ? '2px solid var(--primary-navy)' : '1px solid var(--border-subtle)',
                    background: c.id === activeClinicId ? 'var(--bg-card-subtle)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Building2 size={20} color={c.id === activeClinicId ? 'var(--ai-violet)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {c.name} {c.isPrimary && <span style={{ fontSize: '0.72rem', color: 'var(--primary-navy)', background: 'rgba(36, 59, 100, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Primary</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {c.address} · Phone: {c.phone}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveClinicId(c.id)}
                    className={`btn btn-sm ${c.id === activeClinicId ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {c.id === activeClinicId ? 'Active Clinic' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Active Clinic Form */}
          <form onSubmit={handleSaveClinic} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Edit Details for: {activeClinic.name}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Clinic / Hospital Name *
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={clinicTagline}
                  onChange={(e) => setClinicTagline(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Physical Address (Printed on Prescription Header) *
              </label>
              <textarea
                rows={2}
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Clinic Phone / Helpline
                </label>
                <input
                  type="text"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Clinic Logo (Optional)
                </label>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '8px 12px', 
                    border: '1px dashed var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)', 
                    background: 'var(--bg-card-subtle)' 
                  }}
                >
                  {/* Accurate preview box */}
                  <div 
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-subtle)', 
                      background: '#FFFFFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {clinicLogoUrl ? (
                      <img 
                        src={clinicLogoUrl} 
                        alt="Logo preview" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        onError={() => {
                          showToast('Custom logo image failed to load. Reverting to default icon.', 'warning');
                          setClinicLogoUrl(undefined);
                        }}
                      />
                    ) : (
                      <Building2 size={22} color="var(--primary-navy)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1px' }}>
                      {clinicLogoUrl ? 'Custom Logo Selected' : 'Default Medical Icon'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      PNG, JPG, or WEBP (Max 2MB).
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoFileChange}
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                      title="Select logo image from your device"
                    >
                      <Upload size={13} />
                      <span>{clinicLogoUrl ? 'Change' : 'Upload'}</span>
                    </button>

                    {clinicLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '4px 8px', color: '#EF4444' }}
                        title="Remove custom logo and restore default medical cross"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Save Clinic Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Prescription Formats with Understandable Groups & Live Real-Time Preview */}
      {activeTab === 'format' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Grouped Understandable Settings */}
          <form onSubmit={handleSaveFormat} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Group 1: Format Style & Paper Size */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                1. Template Style & Paper Dimensions
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Select standard Indian OPD prescription pad or custom clinic stationery size.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Prescription Template
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as any)}
                    style={{ width: '100%', fontSize: '0.86rem' }}
                  >
                    <option value="general">General OPD Format (Default)</option>
                    <option value="custom">Custom Clinic Format</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Target Paper Size
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as any)}
                    style={{ width: '100%', fontSize: '0.86rem' }}
                  >
                    <option value="A4">Standard A4 Sheet (210 × 297 mm)</option>
                    <option value="A5">Compact A5 Pad (148 × 210 mm)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Group 2: Clinic Header & Branding */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                2. Clinic Header & Branding
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Configure clinic identification and top banner styling.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Show Clinic Logo in Header</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Header Accent Line Color:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      style={{ width: '42px', height: '32px', padding: '2px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{headerColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3: Patient Demographics & Identification */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                3. Patient Details & Doctor Registration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Control which identifying credentials appear in the patient box and doctor block.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showDoctorRegNo}
                    onChange={(e) => setShowDoctorRegNo(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Show Doctor Medical Council Reg. Number</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showPatientPhone}
                    onChange={(e) => setShowPatientPhone(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Show Patient Contact Number</span>
                </label>
              </div>
            </div>

            {/* Group 4: Vitals Strip */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                4. Patient Clinical Vitals
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Display blood pressure, pulse, temperature, and SpO2 in the examination strip.
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={showVitals}
                  onChange={(e) => setShowVitals(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>Include Vitals Strip (BP, Pulse, Temp, SpO2) on Printout</span>
              </label>
            </div>

            {/* Group 5: Medicine Table & Clinical Advice */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                5. Medicine Rows & Advice Sections
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Options for medication table columns and clinical instruction blocks.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showDosageInstructions}
                    onChange={(e) => setShowDosageInstructions(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Show 'Instructions' Column in Medicine Table</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showAdvice}
                    onChange={(e) => setShowAdvice(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Include General Diet & Lifestyle Advice Section</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showFollowUp}
                    onChange={(e) => setShowFollowUp(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Include Follow-Up OPD Visit Instructions</span>
                </label>
              </div>
            </div>

            {/* Group 6: Footer & Signature */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                6. Footer & Legal Dispensing Notice
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Doctor approval stamp area and pharmacy dispensing notice.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={showSignatureLine}
                    onChange={(e) => setShowSignatureLine(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>Show Doctor's Signature & Stamp Area</span>
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Legal Dispensing Notes (Printed at bottom)
                  </label>
                  <textarea
                    rows={2}
                    value={printNotes}
                    onChange={(e) => setPrintNotes(e.target.value)}
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions: Save Settings & Reset to Default */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleResetFormatToDefault}
                className="btn btn-secondary"
                style={{ fontSize: '0.86rem' }}
              >
                <RotateCcw size={15} />
                <span>Reset to Default</span>
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.6rem' }}
              >
                <Save size={16} />
                <span>Save Format Settings</span>
              </button>
            </div>
          </form>

          {/* Right Column: Live Real-Time Interactive Prescription Preview */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <LiveFormatPreview 
              settings={currentLiveSettings} 
              doctor={doctor} 
              clinic={activeClinic} 
            />
          </div>
        </div>
      )}

      {/* Tab 5: Voice Preferences */}
      {activeTab === 'voice' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Voice Assistant & Speech Dictation
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Set your natural speaking preference for clinical consultations
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Preferred Voice Input Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as Language);
                  showToast(`Language preference set to ${e.target.value === 'hi' ? 'Hindi / Hinglish' : 'English'}`, 'info');
                }}
                style={{ width: '100%' }}
              >
                <option value="en">English (India) — Clinical Medical Terms</option>
                <option value="hi">हिंदी / Hinglish — Bilingual OPD Speech</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Microphone Audio Reactivity
              </label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                3D Equalizer & Waveform Active · Web Speech API Enabled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Security & Sessions — CRITICAL: Offline-First Medical Data Protection section and its explanatory text PRESERVED WORD-FOR-WORD */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Security, Offline Storage & Session Management
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Future Supabase / FastAPI cloud authentication placeholders
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Offline-First Medical Data Protection
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                All patient consultations are stored in encrypted browser local storage and queued for synchronization. In production, row-level security (RLS) in Supabase ensures data compliance.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button
                onClick={logout}
                className="btn btn-danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <LogOut size={16} />
                <span>Log Out Current Doctor Session</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Permanent Account Deletion */}
          <div 
            className="card" 
            style={{ 
              border: '1px solid rgba(239, 68, 68, 0.35)', 
              background: 'rgba(239, 68, 68, 0.03)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626'
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#DC2626' }}>
                  Danger Zone: Delete Practitioner Account
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Irreversible account erasure and credential revocation
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Permanently delete your clinician account, authentication credentials, and active device sessions. 
              Once confirmed, you will no longer be able to log in with this practitioner identity.
            </p>

            <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Medical Record Retention Compliance:</strong> In accordance with statutory Indian Medical Council / National Medical Commission (NMC) regulations, clinical records (prescriptions and patient encounter logs) must be retained under clinic custody for legal compliance (minimum 3-year statutory retention), but will be unlinked from your erased authentication profile.
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setDeletePassword('');
                  setDeleteOtp('');
                  setDeleteOtpSent(false);
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
                className="btn btn-danger"
                style={{ background: '#DC2626', color: '#FFFFFF', borderColor: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={16} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Permanently Delete Account?
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>
                  This action is permanent and cannot be undone
                </span>
              </div>
            </div>

            {/* Explanatory breakdown of data impact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Account & Profile:</strong> Your login credentials, doctor profile, and active clinical sessions will be permanently erased.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Clinic Ownership:</strong> Any clinic solely owned by you will be marked as deactivated.
              </div>
              <div style={{ padding: '8px 10px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Medical Records Retention:</strong> Under Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations and NMC mandates, patient encounter logs and prescriptions must be preserved in clinic archives for at least 3 years. They remain archived under clinic custody but unlinked from your deleted personal account.
              </div>
            </div>

            {/* Re-authentication & Confirmation Inputs */}
            <form onSubmit={(e) => { e.preventDefault(); handleDeleteAccount(); }}>
              {/* Password or OTP Re-authentication */}
              <div style={{ marginBottom: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Re-authenticate (Password or Email OTP) *
                  </label>
                  <button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    disabled={deleteOtpLoading || deleteOtpCooldown > 0}
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--ai-violet)',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: (deleteOtpLoading || deleteOtpCooldown > 0) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {deleteOtpLoading ? (
                      <Loader2 size={12} className="spin-icon" />
                    ) : (
                      <KeyRound size={12} />
                    )}
                    <span>
                      {deleteOtpCooldown > 0 
                        ? `Resend in ${deleteOtpCooldown}s` 
                        : (deleteOtpSent ? 'Resend OTP / Link' : 'Forgot Password? Send OTP')}
                    </span>
                  </button>
                </div>

                {/* Password input (shown by default) */}
                {!deleteOtpSent && (
                  <div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showDeletePassword ? 'text' : 'password'}
                        placeholder="Enter your current password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        style={{ width: '100%', paddingLeft: '34px', paddingRight: '36px' }}
                        disabled={deleteLoading}
                      />
                      <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {showDeletePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Forgot password? Click <strong>Forgot Password? Send OTP</strong> above to verify via email.
                    </span>
                  </div>
                )}

                {/* Email OTP Verification Input (shown when OTP is requested) */}
                {deleteOtpSent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div 
                      style={{ 
                        padding: '8px 12px', 
                        background: 'rgba(59, 130, 246, 0.08)', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid rgba(59, 130, 246, 0.25)', 
                        fontSize: '0.78rem', 
                        color: 'var(--text-primary)',
                        lineHeight: 1.45
                      }}
                    >
                      A 6-digit OTP code & password reset link have been dispatched to <strong>{user?.email}</strong>. Enter the OTP code below:
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="123456"
                        value={deleteOtp}
                        onChange={(e) => setDeleteOtp(e.target.value)}
                        maxLength={8}
                        style={{ width: '100%', paddingLeft: '34px', letterSpacing: '3px', fontWeight: 700 }}
                        disabled={deleteLoading}
                        autoFocus
                      />
                      <Mail size={15} color="var(--ai-violet)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>Remembered your password?</span>
                      <button
                        type="button"
                        onClick={() => { setDeleteOtpSent(false); setDeleteOtp(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--ai-violet)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Use password instead
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Explicit Confirmation Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  To proceed, type <strong style={{ color: '#DC2626' }}>DELETE</strong> in capital letters:
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  style={{ width: '100%', borderColor: deleteConfirmText === 'DELETE' ? '#DC2626' : undefined }}
                  disabled={deleteLoading}
                  required
                />
              </div>

              {/* Error banner */}
              {deleteError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {deleteError}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  style={{ background: '#DC2626', borderColor: '#DC2626', color: '#FFFFFF' }}
                  disabled={deleteConfirmText.trim() !== 'DELETE' || deleteLoading}
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 size={14} className="spin-icon" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <span>Permanently Delete My Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

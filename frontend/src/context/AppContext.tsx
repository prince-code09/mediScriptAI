import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ClinicProfile, 
  DoctorProfile, 
  FormatSettings, 
  Language, 
  LayoutDensity, 
  NavPage, 
  Patient, 
  Prescription, 
  TextSize, 
  ThemeMode 
} from '../types';
import { storageService } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { supabase } from '../services/supabaseClient';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;
  activePrescriptionId: string | null;
  setActivePrescriptionId: (id: string | null) => void;
  
  // Theme & Display
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  layoutDensity: LayoutDensity;
  setLayoutDensity: (density: LayoutDensity) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Profiles
  doctor: DoctorProfile;
  updateDoctor: (doc: DoctorProfile) => void;
  clinics: ClinicProfile[];
  activeClinicId: string;
  setActiveClinicId: (id: string) => void;
  activeClinic: ClinicProfile;
  updateClinic: (clinic: ClinicProfile) => void;

  // Medical Records
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  prescriptions: Prescription[];
  savePrescription: (rx: Prescription) => void;
  updatePrescriptionSyncStatus: (id: string, status: Prescription['syncStatus']) => void;
  recycleBin: Prescription[];
  softDeletePrescription: (id: string) => void;
  restorePrescription: (id: string) => void;
  permanentlyDeletePrescription: (id: string) => void;
  emptyRecycleBin: () => void;
  
  // Settings & Format
  formatSettings: FormatSettings;
  updateFormatSettings: (settings: FormatSettings) => void;

  // Voice to Prescription handoff & Consultation reset
  stagedVoiceData: any | null;
  setStagedVoiceData: (data: any | null) => void;
  startNewConsultation: (targetPage?: NavPage) => void;

  // Auth mock
  user: { email: string; name: string; isLoggedIn: boolean };
  setUser: (u: { email: string; name: string; isLoggedIn: boolean }) => void;
  logout: () => void;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (active: boolean) => void;

  // Offline / Sync status helper
  syncAllPending: () => void;
  pendingSyncCount: number;

  // Notifications
  toast: ToastNotification | null;
  showToast: (message: string, type?: ToastNotification['type']) => void;
  hideToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [activePrescriptionId, setActivePrescriptionId] = useState<string | null>(null);

  // Theme & Preferences
  const [theme, setThemeState] = useState<ThemeMode>(() => storageService.getTheme());
  const [textSize, setTextSizeState] = useState<TextSize>(() => storageService.getTextSize());
  const [layoutDensity, setLayoutDensityState] = useState<LayoutDensity>(() => storageService.getLayoutDensity());
  const [language, setLanguageState] = useState<Language>(() => storageService.getLanguage());

  // Profiles
  const [doctor, setDoctorState] = useState<DoctorProfile>(() => storageService.getDoctorProfile());
  const [clinics, setClinicsState] = useState<ClinicProfile[]>(() => storageService.getClinics());
  const [activeClinicId, setActiveClinicIdState] = useState<string>(() => storageService.getActiveClinicId());
  
  // Data
  const [patients, setPatientsState] = useState<Patient[]>(() => storageService.getPatients());
  const [prescriptions, setPrescriptionsState] = useState<Prescription[]>(() => storageService.getPrescriptions());
  const [recycleBin, setRecycleBinState] = useState<Prescription[]>(() => storageService.getRecycleBinPrescriptions());
  const [formatSettings, setFormatSettingsState] = useState<FormatSettings>(() => storageService.getFormatSettings());

  // Staged data from voice assistant
  const [stagedVoiceData, setStagedVoiceData] = useState<any | null>(null);

  // Auth
  const [user, setUserState] = useState(() => storageService.getAuthUser());
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery';
    }
    return false;
  });

  // Automatic reliable background check: permanently purge items older than 15 days
  useEffect(() => {
    const runAutoPurge = () => {
      const purged = storageService.purgeExpiredPrescriptions();
      if (purged > 0) {
        setPrescriptionsState(storageService.getPrescriptions());
        setRecycleBinState(storageService.getRecycleBinPrescriptions());
      }
    };
    runAutoPurge();
    const interval = setInterval(runAutoPurge, 60 * 60 * 1000); // Hourly check
    return () => clearInterval(interval);
  }, []);

  // Toast
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: ToastNotification['type'] = 'info') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3800);
  };

  const hideToast = () => setToast(null);

  // Function to load and isolate state for a specific doctor
  const loadDoctorSession = (u: { email: string; name: string; isLoggedIn: boolean }) => {
    storageService.setCurrentUser(u.email, u.email, u.name);
    const doc = storageService.getDoctorProfile(u);
    const loadedClinics = storageService.getClinics(u.name);
    const activeId = storageService.getActiveClinicId(loadedClinics);
    const pats = storageService.getPatients();
    const rxs = storageService.getPrescriptions();
    const bin = storageService.getRecycleBinPrescriptions();
    const format = storageService.getFormatSettings();

    setDoctorState(doc);
    setClinicsState(loadedClinics);
    setActiveClinicIdState(activeId);
    setPatientsState(pats);
    setPrescriptionsState(rxs);
    setRecycleBinState(bin);
    setFormatSettingsState(format);
    setStagedVoiceData(null);
    setActivePrescriptionId(null);
  };

  // Function to clear active doctor state on logout (preserves offline data in localStorage)
  const clearDoctorSession = () => {
    storageService.clearActiveSession();
    apiClient.clearAuthToken();
    const doc = storageService.getDoctorProfile();
    const loadedClinics = storageService.getClinics();
    const activeId = storageService.getActiveClinicId(loadedClinics);

    setUserState({ email: '', name: '', isLoggedIn: false });
    setDoctorState(doc);
    setClinicsState(loadedClinics);
    setActiveClinicIdState(activeId);
    setPatientsState([]);
    setPrescriptionsState([]);
    setRecycleBinState([]);
    setFormatSettingsState(storageService.getFormatSettings());
    setStagedVoiceData(null);
    setActivePrescriptionId(null);
    setCurrentPage('landing');
  };

  // Supabase Auth Persistence, Session Sync & 401 Event Listener
  useEffect(() => {
    // 0. Handle OAuth redirect errors in URL (e.g. user cancelled Google OAuth)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthError = urlParams.get('error_description') || hashParams.get('error_description') || urlParams.get('error') || hashParams.get('error');
      if (oauthError) {
        showToast(`Google Sign-In notice: ${decodeURIComponent(oauthError)}`, 'warning');
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 1. Check existing active Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isRecovery = typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery');
      if (isRecovery) {
        setIsPasswordRecovery(true);
        setCurrentPage('auth');
      } else if (session?.user) {
        const u = {
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Doctor',
          isLoggedIn: true
        };
        setUserState(u);
        storageService.setAuthUser(u);
        loadDoctorSession(u);
        if (session.access_token) {
          apiClient.setAuthToken(session.access_token);
        }
        setCurrentPage(prev => (prev === 'auth' || prev === 'landing' ? 'home' : prev));
        // Clean OAuth hash and PKCE code params from URL
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }).catch(err => {
      console.warn('Supabase getSession notice:', err);
    });

    // 2. Listen to real-time auth events (Sign in, Sign out, Token refreshed, Password Recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setCurrentPage('auth');
        showToast('Password recovery session verified. Please enter your new password.', 'info');
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        // If password recovery is active, remain on auth page until password update completes
        const isRecovery = typeof window !== 'undefined' && (window.location.hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery');
        if (isRecovery) {
          setIsPasswordRecovery(true);
          setCurrentPage('auth');
          return;
        }

        const u = {
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Doctor',
          isLoggedIn: true
        };
        setUserState(u);
        storageService.setAuthUser(u);
        loadDoctorSession(u);
        if (session.access_token) {
          apiClient.setAuthToken(session.access_token);
        }
        setCurrentPage(prev => (prev === 'auth' || prev === 'landing' ? 'home' : prev));
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('code='))) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        clearDoctorSession();
      }
    });

    // 3. Listen to 401 Unauthorized events from apiClient to gracefully handle session expiry
    const handleUnauthorizedEvent = () => {
      console.warn('Clinical session expired or unauthorized. Logging out.');
      clearDoctorSession();
      showToast('Your clinical session has expired. Please sign in again.', 'warning');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mediscript:unauthorized', handleUnauthorizedEvent);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('mediscript:unauthorized', handleUnauthorizedEvent);
      }
    };
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    
    let resolvedTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    if (resolvedTheme === 'dark') {
      root.classList.add('theme-dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
    }

    root.setAttribute('data-text-size', textSize);
    root.setAttribute('data-density', layoutDensity);
  }, [theme, textSize, layoutDensity]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    storageService.setTheme(t);
  };

  const setTextSize = (s: TextSize) => {
    setTextSizeState(s);
    storageService.setTextSize(s);
  };

  const setLayoutDensity = (d: LayoutDensity) => {
    setLayoutDensityState(d);
    storageService.setLayoutDensity(d);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    storageService.setLanguage(l);
  };

  const updateDoctor = (doc: DoctorProfile) => {
    setDoctorState(doc);
    storageService.saveDoctorProfile(doc);
    showToast('Doctor profile updated', 'success');
  };

  const setActiveClinicId = (id: string) => {
    setActiveClinicIdState(id);
    storageService.setActiveClinicId(id);
    const target = clinics.find(c => c.id === id);
    if (target) {
      showToast(`Switched to ${target.name}`, 'info');
    }
  };

  const updateClinic = (clinic: ClinicProfile) => {
    const updated = clinics.map(c => c.id === clinic.id ? clinic : c);
    setClinicsState(updated);
    storageService.saveClinics(updated);
    showToast('Clinic details updated', 'success');
  };

  const activeClinic = clinics.find(c => c.id === activeClinicId) || clinics[0];

  const addPatient = (patient: Patient) => {
    const updated = storageService.savePatient(patient);
    setPatientsState(updated);
    showToast(`Patient ${patient.name} registered successfully`, 'success');
  };

  const updatePatient = (patient: Patient) => {
    const updated = storageService.savePatient(patient);
    setPatientsState(updated);
    showToast(`Patient details updated`, 'success');
  };

  const savePrescription = (rx: Prescription) => {
    const updated = storageService.savePrescription(rx);
    setPrescriptionsState(updated);

    // Update patient visit info
    const patientIndex = patients.findIndex(p => p.id === rx.patientId || p.name.toLowerCase() === rx.patientName.toLowerCase());
    if (patientIndex >= 0) {
      const p = patients[patientIndex];
      const updatedP: Patient = {
        ...p,
        lastVisit: rx.date,
        totalVisits: p.totalVisits + 1
      };
      updatePatient(updatedP);
    }
  };

  const updatePrescriptionSyncStatus = (id: string, status: Prescription['syncStatus']) => {
    const updated = storageService.updatePrescriptionSyncStatus(id, status);
    setPrescriptionsState(updated);
  };

  const softDeletePrescription = (id: string) => {
    const { active, recycleBin: newBin } = storageService.softDeletePrescription(id);
    setPrescriptionsState(active);
    setRecycleBinState(newBin);
    if (activePrescriptionId === id) {
      setActivePrescriptionId(null);
    }
    showToast('Prescription moved to Recycle Bin (Retained for 15 days)', 'info');
  };

  const restorePrescription = (id: string) => {
    const { active, recycleBin: newBin } = storageService.restorePrescription(id);
    setPrescriptionsState(active);
    setRecycleBinState(newBin);
    showToast('Prescription restored to History successfully', 'success');
  };

  const permanentlyDeletePrescription = (id: string) => {
    const { active, recycleBin: newBin } = storageService.permanentlyDeletePrescription(id);
    setPrescriptionsState(active);
    setRecycleBinState(newBin);
    showToast('Prescription permanently deleted from storage', 'info');
  };

  const emptyRecycleBin = () => {
    const { active, recycleBin: newBin } = storageService.emptyRecycleBin();
    setPrescriptionsState(active);
    setRecycleBinState(newBin);
    showToast('Recycle Bin has been emptied', 'info');
  };

  const updateFormatSettings = (settings: FormatSettings) => {
    setFormatSettingsState(settings);
    storageService.saveFormatSettings(settings);
    showToast('Prescription format settings saved', 'success');
  };

  const setUser = (u: { email: string; name: string; isLoggedIn: boolean }) => {
    setUserState(u);
    storageService.setAuthUser(u);
    if (u.isLoggedIn) {
      loadDoctorSession(u);
    } else {
      clearDoctorSession();
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    clearDoctorSession();
    showToast('Logged out securely', 'info');
  };

  // Sync calculation: pending active items
  const pendingSyncCount = prescriptions.filter(
    p => !p.isDeleted && (p.syncStatus === 'saved_on_device' || p.syncStatus === 'sync_pending')
  ).length;

  const syncAllPending = async () => {
    // Only sync active non-deleted prescriptions, plus soft_delete operations for recycle bin items
    const pendingActive = prescriptions.filter(
      p => !p.isDeleted && (p.syncStatus === 'saved_on_device' || p.syncStatus === 'sync_pending' || p.syncStatus === 'sync_failed')
    );
    const pendingDeleted = recycleBin.filter(
      p => p.syncStatus === 'saved_on_device' || p.syncStatus === 'sync_pending'
    );

    if (pendingActive.length === 0 && pendingDeleted.length === 0) {
      showToast('All patient consultations are already synchronized with the server.', 'info');
      return;
    }

    showToast(`Attempting synchronization for ${pendingActive.length + pendingDeleted.length} consultation(s)...`, 'info');

    try {
      // Build idempotent operations with client-generated UUIDs
      const activeOps = pendingActive.map(p => ({
        client_operation_id: typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        entity_type: 'prescription',
        entity_id: p.id,
        operation: 'update',
        payload: p
      }));

      const deleteOps = pendingDeleted.map(p => ({
        client_operation_id: typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `op-del-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        entity_type: 'prescription',
        entity_id: p.id,
        operation: 'soft_delete',
        payload: p
      }));

      const operations = [...activeOps, ...deleteOps];

      const syncRes = await apiClient.syncBatch(activeClinicId, operations);
      
      // Update local statuses based on server acknowledgements
      const syncedIds = new Set(
        syncRes.results
          .filter((r: any) => r.status === 'synced' || r.status === 'duplicate_ignored')
          .map((r: any) => r.entity_id)
      );

      const updated = prescriptions.map(p => {
        if (syncedIds.has(p.id)) {
          const item = { ...p, syncStatus: 'synced' as const };
          storageService.savePrescription(item);
          return item;
        }
        return p;
      });

      setPrescriptionsState(updated);
      showToast(`Cloud synchronization complete! ${syncRes.synced_count || syncRes.total_processed} record(s) synced.`, 'success');
    } catch (err: any) {
      console.warn('Sync notice: Backend offline or unreachable, local data preserved', err);
      // Prescriptions remain safely saved on device (NEVER deleted)
      const updated = prescriptions.map(p => {
        if (p.syncStatus === 'sync_pending' || p.syncStatus === 'saved_on_device') {
          const item = { ...p, syncStatus: 'sync_failed' as const };
          storageService.savePrescription(item);
          return item;
        }
        return p;
      });
      setPrescriptionsState(updated);
      showToast('Offline mode: Prescriptions safely preserved in local device storage.', 'warning');
    }
  };

  // Start clean consultation without affecting saved patient or prescription history
  const startNewConsultation = (targetPage: NavPage = 'home') => {
    setStagedVoiceData(null);
    setActivePrescriptionId(null);
    setCurrentPage(targetPage);
    showToast('Started new consultation. Previous records preserved in history.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        activePrescriptionId,
        setActivePrescriptionId,
        startNewConsultation,
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
        patients,
        addPatient,
        updatePatient,
        prescriptions,
        recycleBin,
        savePrescription,
        softDeletePrescription,
        restorePrescription,
        permanentlyDeletePrescription,
        emptyRecycleBin,
        updatePrescriptionSyncStatus,
        formatSettings,
        updateFormatSettings,
        stagedVoiceData,
        setStagedVoiceData,
        user,
        setUser,
        logout,
        isPasswordRecovery,
        setIsPasswordRecovery,
        syncAllPending,
        pendingSyncCount,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

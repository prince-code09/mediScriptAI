import { ClinicProfile, DoctorProfile, FormatSettings, Patient, Prescription, ThemeMode, TextSize, LayoutDensity, Language } from '../types';
import { initialClinics, initialDoctorProfile, initialFormatSettings, initialPatients, initialPrescriptions } from './mockData';

const BASE_STORAGE_KEYS = {
  PRESCRIPTIONS: 'mediscript_prescriptions_v1',
  PATIENTS: 'mediscript_patients_v1',
  CLINICS: 'mediscript_clinics_v1',
  ACTIVE_CLINIC_ID: 'mediscript_active_clinic_id_v1',
  DOCTOR: 'mediscript_doctor_v1',
  FORMAT_SETTINGS: 'mediscript_format_settings_v1',
  THEME: 'mediscript_theme_v1',
  TEXT_SIZE: 'mediscript_text_size_v1',
  LAYOUT_DENSITY: 'mediscript_density_v1',
  LANGUAGE: 'mediscript_lang_v1',
  AUTH_USER: 'mediscript_auth_user_v1'
};

// Safe multi-doctor isolated local storage manager
class StorageService {
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;
  private currentUserName: string | null = null;

  constructor() {
    // Restore user context from stored session if present
    try {
      const storedAuth = localStorage.getItem(BASE_STORAGE_KEYS.AUTH_USER);
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        if (parsed?.isLoggedIn && parsed?.email) {
          this.setCurrentUser(parsed.email, parsed.email, parsed.name);
        }
      }
    } catch (e) {
      // Ignore on startup
    }
  }

  public setCurrentUser(userId: string | null, email?: string, name?: string): void {
    this.currentUserId = userId;
    this.currentUserEmail = email || userId;
    this.currentUserName = name || null;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  private isDefaultDemoUser(): boolean {
    if (!this.currentUserId) return true;
    const lower = (this.currentUserEmail || this.currentUserId).toLowerCase();
    return (
      lower.includes('dr.sharma') ||
      lower.includes('test-token-dr-sharma') ||
      lower === '00000000-0000-0000-0000-000000000001'
    );
  }

  private getScopedKey(baseKey: string): string {
    if (!this.currentUserId) {
      return baseKey;
    }
    // Dr. Sharma / default demo account uses base key for backwards compatibility
    if (this.isDefaultDemoUser()) {
      return baseKey;
    }
    // Independent doctors receive their own strictly isolated partition
    const safeId = encodeURIComponent(this.currentUserId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${baseKey}_user_${safeId}`;
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Failed reading key ${key} from storage`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed writing key ${key} to storage`, e);
    }
  }

  // --- Doctor Profile ---
  getDoctorProfile(userContext?: { email?: string; name?: string }): DoctorProfile {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.DOCTOR);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing) as DoctorProfile;
      } catch (e) {}
    }

    // Default demo doctor receives Dr. Sharma profile
    if (this.isDefaultDemoUser()) {
      return { ...initialDoctorProfile };
    }

    // New doctor receives fresh default profile isolated from any other doctor
    const email = userContext?.email || this.currentUserEmail || '';
    const name = userContext?.name || this.currentUserName || (email ? `Dr. ${email.split('@')[0]}` : 'Dr. Doctor');
    const freshProfile: DoctorProfile = {
      id: `doc-${this.currentUserId || 'new'}`,
      fullName: name.startsWith('Dr.') ? name : `Dr. ${name}`,
      qualification: 'MBBS',
      regNumber: '',
      specialization: 'General Medicine',
      phone: '',
      email: email
    };
    return freshProfile;
  }

  saveDoctorProfile(profile: DoctorProfile): void {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.DOCTOR);
    this.set(key, profile);
  }

  // --- Clinics ---
  getClinics(doctorName?: string): ClinicProfile[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.CLINICS);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing) as ClinicProfile[];
      } catch (e) {}
    }

    if (this.isDefaultDemoUser()) {
      return JSON.parse(JSON.stringify(initialClinics));
    }

    // New independent doctor receives a fresh clinic with NO logo (medical cross fallback)
    const doc = doctorName || this.currentUserName || 'Doctor';
    const freshClinics: ClinicProfile[] = [
      {
        id: `clinic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: doc.startsWith('Dr.') ? `${doc}'s Clinic` : `Dr. ${doc}'s Clinic`,
        tagline: 'Primary Healthcare & Clinical OPD',
        address: 'Clinical OPD Centre',
        phone: '',
        email: this.currentUserEmail || '',
        logoUrl: undefined,
        isPrimary: true
      }
    ];
    return freshClinics;
  }

  saveClinics(clinics: ClinicProfile[]): void {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.CLINICS);
    this.set(key, clinics);
  }

  getActiveClinicId(clinicsList?: ClinicProfile[]): string {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.ACTIVE_CLINIC_ID);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing) as string;
      } catch (e) {}
    }
    const currentClinics = clinicsList || this.getClinics();
    return currentClinics[0]?.id || '';
  }

  setActiveClinicId(id: string): void {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.ACTIVE_CLINIC_ID);
    this.set(key, id);
  }

  // --- Patients (Strict Isolation) ---
  getPatients(): Patient[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.PATIENTS);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing) as Patient[];
      } catch (e) {}
    }

    // Only default demo user receives initial demo patients
    if (this.isDefaultDemoUser()) {
      return JSON.parse(JSON.stringify(initialPatients));
    }

    // Any other doctor starts with an empty patient roster
    return [];
  }

  savePatient(patient: Patient): Patient[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.PATIENTS);
    const list = this.getPatients();
    const index = list.findIndex(p => p.id === patient.id);
    let updated: Patient[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = patient;
    } else {
      updated = [patient, ...list];
    }
    this.set(key, updated);
    return updated;
  }

  // --- Prescriptions (Strict Isolation) ---
  getPrescriptions(): Prescription[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.PRESCRIPTIONS);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        return JSON.parse(existing) as Prescription[];
      } catch (e) {}
    }

    // Only default demo user receives initial demo prescriptions
    if (this.isDefaultDemoUser()) {
      return JSON.parse(JSON.stringify(initialPrescriptions));
    }

    // Any other doctor starts with zero prescriptions
    return [];
  }

  savePrescription(prescription: Prescription): Prescription[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.PRESCRIPTIONS);
    const list = this.getPrescriptions();
    const index = list.findIndex(p => p.id === prescription.id);
    let updated: Prescription[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = prescription;
    } else {
      updated = [prescription, ...list];
    }
    this.set(key, updated);
    return updated;
  }

  updatePrescriptionSyncStatus(id: string, syncStatus: Prescription['syncStatus']): Prescription[] {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.PRESCRIPTIONS);
    const list = this.getPrescriptions();
    const updated = list.map(item => item.id === id ? { ...item, syncStatus } : item);
    this.set(key, updated);
    return updated;
  }

  // --- Format Settings ---
  getFormatSettings(): FormatSettings {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.FORMAT_SETTINGS);
    return this.get<FormatSettings>(key, { ...initialFormatSettings });
  }

  saveFormatSettings(settings: FormatSettings): void {
    const key = this.getScopedKey(BASE_STORAGE_KEYS.FORMAT_SETTINGS);
    this.set(key, settings);
  }

  // --- Preferences (App-wide) ---
  getTheme(): ThemeMode {
    return this.get<ThemeMode>(BASE_STORAGE_KEYS.THEME, 'light');
  }

  setTheme(theme: ThemeMode): void {
    this.set(BASE_STORAGE_KEYS.THEME, theme);
  }

  getTextSize(): TextSize {
    return this.get<TextSize>(BASE_STORAGE_KEYS.TEXT_SIZE, 'normal');
  }

  setTextSize(size: TextSize): void {
    this.set(BASE_STORAGE_KEYS.TEXT_SIZE, size);
  }

  getLayoutDensity(): LayoutDensity {
    return this.get<LayoutDensity>(BASE_STORAGE_KEYS.LAYOUT_DENSITY, 'comfortable');
  }

  setLayoutDensity(density: LayoutDensity): void {
    this.set(BASE_STORAGE_KEYS.LAYOUT_DENSITY, density);
  }

  getLanguage(): Language {
    return this.get<Language>(BASE_STORAGE_KEYS.LANGUAGE, 'en');
  }

  setLanguage(lang: Language): void {
    this.set(BASE_STORAGE_KEYS.LANGUAGE, lang);
  }

  // --- Auth User State ---
  getAuthUser(): { email: string; name: string; isLoggedIn: boolean } {
    return this.get(BASE_STORAGE_KEYS.AUTH_USER, {
      email: '',
      name: '',
      isLoggedIn: false
    });
  }

  setAuthUser(user: { email: string; name: string; isLoggedIn: boolean }): void {
    this.set(BASE_STORAGE_KEYS.AUTH_USER, user);
    if (user.isLoggedIn && user.email) {
      this.setCurrentUser(user.email, user.email, user.name);
    } else {
      this.setCurrentUser(null);
    }
  }

  // Clear current active memory state on logout (preserves offline records in their partitioned keys)
  clearActiveSession(): void {
    this.currentUserId = null;
    this.currentUserEmail = null;
    this.currentUserName = null;
    this.setAuthUser({ email: '', name: '', isLoggedIn: false });
  }
}

export const storageService = new StorageService();

// MediScript TypeScript Definitions

export type NavPage = 
  | 'home' 
  | 'dashboard' 
  | 'patients' 
  | 'prescriptions' 
  | 'history' 
  | 'settings' 
  | 'landing' 
  | 'auth';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSize = 'normal' | 'medium' | 'large';
export type LayoutDensity = 'comfortable' | 'compact';
export type Language = 'en' | 'hi';

export type SyncStatus = 
  | 'saved_on_device' 
  | 'sync_pending' 
  | 'synced' 
  | 'sync_failed';

export type VoiceAssistantState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'ready_for_review' 
  | 'error';

export interface DoctorProfile {
  id: string;
  fullName: string;
  qualification: string;
  regNumber: string;
  specialization: string;
  phone: string;
  email: string;
}

export interface ClinicProfile {
  id: string;
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  isPrimary: boolean;
}

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  allergies: string;
  clinicalNotes?: string;
  createdAt: string;
  lastVisit: string;
  totalVisits: number;
}

export type DosageForm = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment';

export interface MedicineItem {
  id: string;
  name: string;
  strength: string;
  dosageForm: DosageForm;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
  route?: string;
}

export interface Vitals {
  bp?: string;
  pulse?: string;
  temp?: string;
  weight?: string;
  spo2?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone?: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicLogoUrl?: string;
  doctorName: string;
  doctorRegNo: string;
  doctorQualification: string;
  symptoms: string;
  durationOfSymptoms?: string;
  clinicalFindings: string;
  diagnosis?: string;
  isDiagnosisConfirmed?: boolean;
  consultationReport?: string;
  rawTranscript?: string;
  vitals?: Vitals;
  medicines: MedicineItem[];
  advice: string;
  followUp: string;
  status: 'draft' | 'confirmed';
  syncStatus: SyncStatus;
  createdAt: string;
  source: 'voice' | 'manual';
  printLanguage?: 'en' | 'hi' | 'hinglish';
}

export interface FormatSettings {
  template: 'general' | 'custom';
  paperSize: 'A4' | 'A5';
  showClinicLogo: boolean;
  showVitals: boolean;
  showRxHeader: boolean;
  clinicHeaderColor: string;
  printNotes: string;
  fontFamily?: 'sans' | 'serif';
  showPatientPhone?: boolean;
  showDoctorRegNo?: boolean;
  showAdvice?: boolean;
  showFollowUp?: boolean;
  showDosageInstructions?: boolean;
  showSignatureLine?: boolean;
}

export interface VoiceSimulationSample {
  id: string;
  language: Language;
  title: string;
  doctorSpeechText: string;
  extractedData: {
    patientName: string;
    patientAge: number;
    patientGender: 'Male' | 'Female' | 'Other';
    symptoms: string;
    clinicalFindings: string;
    vitals: Vitals;
    medicines: Omit<MedicineItem, 'id'>[];
    advice: string;
    followUp: string;
  };
}

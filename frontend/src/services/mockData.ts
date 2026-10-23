import { ClinicProfile, DoctorProfile, FormatSettings, Patient, Prescription, VoiceSimulationSample } from '../types';

export const initialDoctorProfile: DoctorProfile = {
  id: 'doc-001',
  fullName: 'Dr. Rajesh Sharma',
  qualification: 'MBBS, MD (Internal Medicine)',
  regNumber: 'UP-MCI/48291/2012',
  specialization: 'General Physician & Family Medicine',
  phone: '+91 98370 12345',
  email: 'dr.sharma.clinic@mediscript.in'
};

export const initialClinics: ClinicProfile[] = [
  {
    id: 'clinic-001',
    name: 'Aarogya Clinic & Family Care',
    tagline: 'Accessible Healthcare for Every Family',
    address: 'Shop 14-16, Civil Hospital Road, Rampur, UP - 244901',
    phone: '+91 98765 43210',
    email: 'aarogya.rampur@mediscript.in',
    isPrimary: true
  },
  {
    id: 'clinic-002',
    name: 'Seva Gram Rural Sub-Health Centre',
    tagline: 'Dedicated Community Health Outreach',
    address: 'Village Bilaspur Crossroad, NH-24, Rampur, UP - 244921',
    phone: '+91 94123 09876',
    email: 'sevagram.bilaspur@mediscript.in',
    isPrimary: false
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'p-001',
    patientId: 'PAT-2026-101',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    phone: '+91 98711 23450',
    allergies: 'None reported',
    clinicalNotes: 'Known case of Essential Hypertension (3 yrs) on regular medication. Compliant.',
    createdAt: '2026-04-10',
    lastVisit: '2026-10-22',
    totalVisits: 6
  },
  {
    id: 'p-002',
    patientId: 'PAT-2026-102',
    name: 'Sunita Devi',
    age: 38,
    gender: 'Female',
    phone: '+91 98912 34561',
    allergies: 'Penicillin, Amoxicillin (Causes urticaria rash)',
    clinicalNotes: 'Recurrent seasonal bronchitis. Advise non-penicillin alternatives.',
    createdAt: '2026-05-18',
    lastVisit: '2026-10-21',
    totalVisits: 4
  },
  {
    id: 'p-003',
    patientId: 'PAT-2026-103',
    name: 'Mohd. Imran',
    age: 29,
    gender: 'Male',
    phone: '+91 97180 98712',
    allergies: 'No known drug allergies',
    clinicalNotes: 'Frequent acidity, works irregular night shifts.',
    createdAt: '2026-07-02',
    lastVisit: '2026-10-20',
    totalVisits: 3
  },
  {
    id: 'p-004',
    patientId: 'PAT-2026-104',
    name: 'Geeta Verma',
    age: 54,
    gender: 'Female',
    phone: '+91 94567 12389',
    allergies: 'Sulfa drugs (Sulfonamides)',
    clinicalNotes: 'Bilateral knee Osteoarthritis Grade II, mild osteoporosis.',
    createdAt: '2026-08-14',
    lastVisit: '2026-10-18',
    totalVisits: 5
  },
  {
    id: 'p-005',
    patientId: 'PAT-2026-105',
    name: 'Ankit Yadav',
    age: 12,
    gender: 'Male',
    phone: '+91 99198 76543',
    allergies: 'None reported',
    clinicalNotes: 'Pediatric patient. Accompanied by mother (Smt. Rekha Yadav).',
    createdAt: '2026-09-01',
    lastVisit: '2026-10-15',
    totalVisits: 2
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'rx-001',
    prescriptionNumber: 'RX-2026-0841',
    date: '2026-10-22',
    patientId: 'p-001',
    patientName: 'Ramesh Kumar',
    patientAge: 45,
    patientGender: 'Male',
    patientPhone: '+91 98711 23450',
    clinicId: 'clinic-001',
    clinicName: 'Aarogya Clinic & Family Care',
    clinicAddress: 'Shop 14-16, Civil Hospital Road, Rampur, UP - 244901',
    clinicPhone: '+91 98765 43210',
    doctorName: 'Dr. Rajesh Sharma',
    doctorRegNo: 'UP-MCI/48291/2012',
    doctorQualification: 'MBBS, MD (Internal Medicine)',
    symptoms: 'High fever for 2 days with severe body ache, mild dry cough, and headache.',
    clinicalFindings: 'Throat erythematous, no exudates. Chest: bilateral clear, no crepts. Abdomen soft.',
    vitals: {
      bp: '130/84 mmHg',
      pulse: '84 bpm',
      temp: '101.2 °F',
      weight: '72 kg',
      spo2: '98%'
    },
    medicines: [
      {
        id: 'm-1',
        name: 'Paracetamol',
        strength: '650 mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '1-0-1 (After Food)',
        duration: '3 Days',
        instructions: 'Take with warm water. SOS if fever is above 100°F.'
      },
      {
        id: 'm-2',
        name: 'Azithromycin',
        strength: '500 mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '1-0-0 (1 hour before food)',
        duration: '5 Days',
        instructions: 'Complete full 5-day antibiotic course without skipping.'
      },
      {
        id: 'm-3',
        name: 'Pantoprazole',
        strength: '40 mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '1-0-0 (Empty Stomach)',
        duration: '5 Days',
        instructions: 'Take 30 minutes before morning tea/breakfast.'
      },
      {
        id: 'm-4',
        name: 'Cetirizine',
        strength: '10 mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '0-0-1 (At Bedtime)',
        duration: '5 Days',
        instructions: 'May cause mild drowsiness; avoid driving at night.'
      }
    ],
    advice: 'Adequate hydration (minimum 3 litres of boiled water daily), salt-water gargle twice daily, light khichdi/daliya diet. Avoid cold liquids.',
    followUp: 'Review in OPD after 4 days or SOS if fever persists beyond 72 hours.',
    status: 'confirmed',
    syncStatus: 'saved_on_device',
    createdAt: '2026-10-22T09:30:00Z',
    source: 'voice'
  },
  {
    id: 'rx-002',
    prescriptionNumber: 'RX-2026-0840',
    date: '2026-10-21',
    patientId: 'p-002',
    patientName: 'Sunita Devi',
    patientAge: 38,
    patientGender: 'Female',
    patientPhone: '+91 98912 34561',
    clinicId: 'clinic-001',
    clinicName: 'Aarogya Clinic & Family Care',
    clinicAddress: 'Shop 14-16, Civil Hospital Road, Rampur, UP - 244901',
    clinicPhone: '+91 98765 43210',
    doctorName: 'Dr. Rajesh Sharma',
    doctorRegNo: 'UP-MCI/48291/2012',
    doctorQualification: 'MBBS, MD (Internal Medicine)',
    symptoms: 'Productive cough with yellowish sputum, chest tightness, wheezing in cold weather.',
    clinicalFindings: 'Rhonchi heard bilaterally. Patient is strictly allergic to Penicillin.',
    vitals: {
      bp: '118/78 mmHg',
      pulse: '78 bpm',
      temp: '98.6 °F',
      weight: '58 kg',
      spo2: '97%'
    },
    medicines: [
      {
        id: 'm-5',
        name: 'Cefixime',
        strength: '200 mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '1-0-1 (After Food)',
        duration: '5 Days',
        instructions: 'Non-penicillin cephalosporin alternative. Take after meals.'
      },
      {
        id: 'm-6',
        name: 'Levocetirizine + Montelukast',
        strength: '5mg + 10mg',
        dosageForm: 'Tablet',
        dose: '1 Tab',
        frequency: '0-0-1 (At Bedtime)',
        duration: '10 Days',
        instructions: 'Take continuously for 10 days for airway inflammation.'
      },
      {
        id: 'm-7',
        name: 'Ambroxol + Levosalbutamol Syrup',
        strength: '30mg/1mg per 5ml',
        dosageForm: 'Syrup',
        dose: '10 ml',
        frequency: '1-1-1 (TDS)',
        duration: '5 Days',
        instructions: 'Shake bottle well. Take with warm water.'
      }
    ],
    advice: 'Steam inhalation twice daily with tulsi leaves. Avoid dust exposure, wear mask outdoors. Strictly avoid penicillin.',
    followUp: 'Review after 5 days with repeat chest auscultation.',
    status: 'confirmed',
    syncStatus: 'synced',
    createdAt: '2026-10-21T11:15:00Z',
    source: 'voice'
  },
  {
    id: 'rx-003',
    prescriptionNumber: 'RX-2026-0839',
    date: '2026-10-20',
    patientId: 'p-003',
    patientName: 'Mohd. Imran',
    patientAge: 29,
    patientGender: 'Male',
    patientPhone: '+91 97180 98712',
    clinicId: 'clinic-001',
    clinicName: 'Aarogya Clinic & Family Care',
    clinicAddress: 'Shop 14-16, Civil Hospital Road, Rampur, UP - 244901',
    clinicPhone: '+91 98765 43210',
    doctorName: 'Dr. Rajesh Sharma',
    doctorRegNo: 'UP-MCI/48291/2012',
    doctorQualification: 'MBBS, MD (Internal Medicine)',
    symptoms: 'Epigastric burning pain, sour belching, nausea on empty stomach.',
    clinicalFindings: 'Epigastrium tender on deep palpation. No guarding or rigidity.',
    vitals: {
      bp: '122/80 mmHg',
      pulse: '76 bpm',
      temp: '98.4 °F',
      weight: '65 kg',
      spo2: '99%'
    },
    medicines: [
      {
        id: 'm-8',
        name: 'Rabeprazole + Domperidone (RAB-D)',
        strength: '20mg + 30mg SR',
        dosageForm: 'Capsule',
        dose: '1 Cap',
        frequency: '1-0-0 (Empty Stomach)',
        duration: '14 Days',
        instructions: 'Take first thing in the morning with plain water, 40 min before food.'
      },
      {
        id: 'm-9',
        name: 'Magaldrate + Simethicone Gel',
        strength: 'Oral Suspension',
        dosageForm: 'Syrup',
        dose: '10 ml',
        frequency: '0-1-1 (Post-prandial)',
        duration: '7 Days',
        instructions: 'Take 1 hour after lunch and dinner, and at bedtime if burning.'
      }
    ],
    advice: 'Avoid spicy, oily foods, tea, coffee and smoking. Eat small frequent meals. Do not lie down immediately after dinner.',
    followUp: 'Review after 14 days or earlier if nausea persists.',
    status: 'confirmed',
    syncStatus: 'sync_pending',
    createdAt: '2026-10-20T16:45:00Z',
    source: 'manual'
  }
];

export const initialFormatSettings: FormatSettings = {
  template: 'general',
  paperSize: 'A4',
  showClinicLogo: true,
  showVitals: true,
  showRxHeader: true,
  clinicHeaderColor: '#243B64',
  printNotes: 'Valid for dispensing at any licensed pharmacy in India. Keep out of reach of children.',
  fontFamily: 'sans',
  showPatientPhone: true,
  showDoctorRegNo: true,
  showAdvice: true,
  showFollowUp: true,
  showDosageInstructions: true,
  showSignatureLine: true
};

export const sampleVoiceScenarios: VoiceSimulationSample[] = [
  {
    id: 'sample-en-1',
    language: 'en',
    title: 'English Clinical Dictation: Acute Viral Fever & Bronchitis',
    doctorSpeechText: 'Patient is Ramesh Kumar, 45 year old male. Complaining of high fever since 2 days, severe body ache and dry hacking cough. Vitals recorded: BP 128 by 82, Pulse 86, Temperature 101.4 Fahrenheit, SPO2 98 percent. Clinical examination reveals congested pharynx, chest clear bilaterally. Prescribing Paracetamol 650 milligram tablet, one tablet twice daily after food for three days. Azithromycin 500 milligram tablet, one tablet once daily before bed for five days. Pantoprazole 40 milligram tablet, once daily empty stomach in the morning for five days. Levocetirizine 5 milligram tablet at bedtime for five days. Advice: Drink warm fluids, salt water gargles twice daily, steam inhalation, and complete the full antibiotic course. Follow up in clinic after four days.',
    extractedData: {
      patientName: 'Ramesh Kumar',
      patientAge: 45,
      patientGender: 'Male',
      symptoms: 'High fever for 2 days, severe body ache, dry hacking cough, malaise.',
      clinicalFindings: 'Pharyngeal congestion present. Bilateral chest clear, no added sounds. Abdomen soft, non-tender.',
      vitals: {
        bp: '128/82 mmHg',
        pulse: '86 bpm',
        temp: '101.4 °F',
        spo2: '98%',
        weight: '72 kg'
      },
      medicines: [
        {
          name: 'Paracetamol',
          strength: '650 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '1-0-1 (After Food)',
          duration: '3 Days',
          instructions: 'Take after meals. SOS for fever above 100°F.'
        },
        {
          name: 'Azithromycin',
          strength: '500 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '0-0-1 (At Bedtime)',
          duration: '5 Days',
          instructions: 'Complete full 5-day course without skipping.'
        },
        {
          name: 'Pantoprazole',
          strength: '40 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '1-0-0 (Empty Stomach)',
          duration: '5 Days',
          instructions: 'Take 30 mins before breakfast with water.'
        },
        {
          name: 'Levocetirizine',
          strength: '5 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '0-0-1 (Night)',
          duration: '5 Days',
          instructions: 'Take at night. May cause drowsiness.'
        }
      ],
      advice: 'Plenty of warm fluids (3 litres/day), warm saline gargles twice daily, steam inhalation. Rest adequately.',
      followUp: 'Review in OPD after 4 days or immediately if breathlessness occurs.'
    }
  },
  {
    id: 'sample-hi-1',
    language: 'hi',
    title: 'Hindi/Hinglish Dictation: Gale me Dard aur Bukhar (Acute Tonsillitis)',
    doctorSpeechText: 'M मरीज Sunita Devi, umar 38 saal, female. Complaint hai teen din se tez bukhar, gale me tez dard khane me takleef aur sharir me dard. Check karne par BP 120 by 80, pulse 82, temperature 101 degree. Gale me tonsils swollen hain red hain. Dawa likho: Tab Paracetamol 650 mg ek goli subah ek goli sham khana khane ke baad teen din. Tab Cefuroxime Axetil 500 mg ek goli subah sham paanch din ke liye. Tab Pantoprazole 40 mg subah khali pet paanch din. Betadine 2 percent gargle gungune paani me milakar din me teen bar kulla karein. Advice: Gunguna paani piyo, dahi chawal ice cream bilkul band rakhein. Chaar din baad dobara dikhane aana hai.',
    extractedData: {
      patientName: 'Sunita Devi',
      patientAge: 38,
      patientGender: 'Female',
      symptoms: '3 din se tez bukhar, gale me tez dard, nigalne me takleef (dysphagia), sharir dard.',
      clinicalFindings: 'Bilateral tonsils enlarged and erythematous. Mild tender cervical lymphadenopathy. Chest clear.',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '82 bpm',
        temp: '101.0 °F',
        spo2: '99%',
        weight: '58 kg'
      },
      medicines: [
        {
          name: 'Paracetamol',
          strength: '650 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '1-0-1 (After Food)',
          duration: '3 Days',
          instructions: 'Subah-shaam khane ke baad. Bukhar me lein.'
        },
        {
          name: 'Cefuroxime Axetil',
          strength: '500 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '1-0-1 (After Food)',
          duration: '5 Days',
          instructions: 'Antibiotic course 5 din poora karein.'
        },
        {
          name: 'Pantoprazole',
          strength: '40 mg',
          dosageForm: 'Tablet',
          dose: '1 Tab',
          frequency: '1-0-0 (Empty Stomach)',
          duration: '5 Days',
          instructions: 'Subah khali pet paani ke sath lein.'
        },
        {
          name: 'Povidone Iodine 2% Gargle',
          strength: '2% w/v',
          dosageForm: 'Drops',
          dose: '10 ml in half cup water',
          frequency: '1-1-1 (TDS)',
          duration: '5 Days',
          instructions: 'Gungune paani me milakar gargle karein. Nigalna nahi hai.'
        }
      ],
      advice: 'Gunguna paani piyo, dahi, chawal, thandi cheeze aur tel-masala band rakhein. Aaram karein.',
      followUp: '4 din baad OPD me check-up ke liye aana hai.'
    }
  }
];

// Sample 7-day clinic statistics for the dashboard (Monday through Sunday)
export const lastSevenDaysVisitsData = [
  { day: 'Mon', date: 'Oct 19', visits: 29, uniquePatients: 24, prescriptions: 27 },
  { day: 'Tue', date: 'Oct 20', visits: 26, uniquePatients: 22, prescriptions: 24 },
  { day: 'Wed', date: 'Oct 21', visits: 22, uniquePatients: 19, prescriptions: 20 },
  { day: 'Thu', date: 'Oct 22', visits: 25, uniquePatients: 21, prescriptions: 23 },
  { day: 'Fri', date: 'Oct 23', visits: 28, uniquePatients: 24, prescriptions: 26 },
  { day: 'Sat', date: 'Oct 24', visits: 34, uniquePatients: 30, prescriptions: 31 },
  { day: 'Sun', date: 'Oct 25', visits: 12, uniquePatients: 10, prescriptions: 11 }
];

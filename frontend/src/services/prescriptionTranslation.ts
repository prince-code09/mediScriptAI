// MediScript Clinical Prescription Translation & Multilingual Print Engine
// Supports English, हिंदी (Hindi with Devanagari script), and Hinglish (Phonetic Roman Hindi)

export type PrintLanguage = 'en' | 'hi' | 'hinglish';

export interface PrescriptionLabels {
  clinicPhone: string;
  patientName: string;
  ageGender: string;
  date: string;
  rxNumber: string;
  vitals: string;
  complaints: string;
  findings: string;
  diagnosis: string;
  rxHeader: string;
  colMedicine: string;
  colDose: string;
  colFrequency: string;
  colDuration: string;
  colInstructions: string;
  adviceHeader: string;
  followUpHeader: string;
  signatureLabel: string;
  stampNote: string;
  legalNote: string;
  regNo: string;
  years: string;
  vitalBp: string;
  vitalPulse: string;
  vitalTemp: string;
  vitalSpo2: string;
  vitalWeight: string;
  diagnosisConfirmed: string;
  diagnosisProvisional: string;
  complaintsPatient: string;
  findingsDoctor: string;
  footerEmr: string;
  footerGenerated: string;
}

const labelsEn: PrescriptionLabels = {
  clinicPhone: 'Phone',
  patientName: 'Patient Name',
  ageGender: 'Age / Gender',
  date: 'Date',
  rxNumber: 'Prescription ID',
  vitals: 'Clinical Vitals',
  complaints: 'Chief Complaints / Symptoms',
  findings: 'Clinical Findings',
  diagnosis: 'Provisional Diagnosis',
  rxHeader: 'Prescribed Medicines (Rx)',
  colMedicine: 'Medicine & Strength',
  colDose: 'Dose',
  colFrequency: 'Frequency',
  colDuration: 'Duration',
  colInstructions: 'Instructions',
  adviceHeader: 'General Advice & Dietary Guidelines',
  followUpHeader: 'Follow-Up OPD Visit',
  signatureLabel: "Doctor's Signature / Stamp",
  stampNote: 'Registered Medical Practitioner',
  legalNote: 'Valid for dispensing at any licensed pharmacy in India. Keep out of reach of children.',
  regNo: 'Reg. No:',
  years: 'Yrs',
  vitalBp: 'BP',
  vitalPulse: 'Pulse',
  vitalTemp: 'Temp',
  vitalSpo2: 'SpO2',
  vitalWeight: 'Weight',
  diagnosisConfirmed: '✓ Doctor-Confirmed Diagnosis:',
  diagnosisProvisional: '⚠ Provisional Assessment (Unconfirmed):',
  complaintsPatient: 'Chief Complaints / Symptoms (Patient-Reported):',
  findingsDoctor: 'Clinical Findings (Doctor Examination):',
  footerEmr: 'Electronic Medical Record',
  footerGenerated: 'Generated via MediScript Clinical AI'
};

const labelsHi: PrescriptionLabels = {
  clinicPhone: 'फोन / संपर्क',
  patientName: 'मरीज का नाम',
  ageGender: 'उम्र / लिंग',
  date: 'दिनांक',
  rxNumber: 'पर्चा क्रमांक',
  vitals: 'शारीरिक जांच (Vitals)',
  complaints: 'मुख्य लक्षण एवं तकलीफ (लक्षण)',
  findings: 'चिकित्सीय जांच (Findings)',
  diagnosis: 'रोग का निदान (Diagnosis)',
  rxHeader: 'दवाइयाँ (Rx)',
  colMedicine: 'दवा का नाम व क्षमता',
  colDose: 'मात्रा',
  colFrequency: 'लेने का समय व नियम',
  colDuration: 'अवधि',
  colInstructions: 'विशेष निर्देश',
  adviceHeader: 'सामान्य सलाह एवं खान-पान परहेज',
  followUpHeader: 'अगली जांच / फॉलो-अप तारीख',
  signatureLabel: 'चिकित्सक के हस्ताक्षर एवं मुहर',
  stampNote: 'पंजीकृत चिकित्सक (RMP)',
  legalNote: 'भारत के किसी भी पंजीकृत मेडिकल स्टोर से दवा लेने हेतु मान्य। बच्चों की पहुँच से दूर रखें।',
  regNo: 'पंजीकरण संख्या (Reg. No):',
  years: 'वर्ष',
  vitalBp: 'रक्तचाप (BP)',
  vitalPulse: 'नाड़ी (Pulse)',
  vitalTemp: 'तापमान (Temp)',
  vitalSpo2: 'ऑक्सीजन (SpO2)',
  vitalWeight: 'वजन (Weight)',
  diagnosisConfirmed: '✓ पुष्ट निदान (Confirmed Diagnosis):',
  diagnosisProvisional: '⚠ संभावित निदान (Provisional Assessment):',
  complaintsPatient: 'मुख्य लक्षण एवं तकलीफ (Complaints):',
  findingsDoctor: 'चिकित्सीय जांच (Doctor Examination):',
  footerEmr: 'इलेक्ट्रॉनिक मेडिकल रिकॉर्ड',
  footerGenerated: 'मेडिस्क्रिप्ट क्लिनिकल एआई द्वारा प्रमाणित'
};

const labelsHinglish: PrescriptionLabels = {
  clinicPhone: 'Phone / Helpline',
  patientName: 'Patient ka Naam',
  ageGender: 'Umar / Gender',
  date: 'Tareekh (Date)',
  rxNumber: 'Parcha Number',
  vitals: 'Shareerik Jaanch (Vitals)',
  complaints: 'Takleef / Symptoms',
  findings: 'Jaanch ki Jankari (Findings)',
  diagnosis: 'Bimari ka Nidan (Diagnosis)',
  rxHeader: 'Dawaiyan (Rx)',
  colMedicine: 'Dawai ka Naam aur Strength',
  colDose: 'Matra (Dose)',
  colFrequency: 'Lene ka Samay (Frequency)',
  colDuration: 'Kitne Din (Duration)',
  colInstructions: 'Khas Nirdesh',
  adviceHeader: 'Aam Salah aur Parhez (Diet Advice)',
  followUpHeader: 'Agla Check-up (Follow-Up)',
  signatureLabel: "Doctor ke Dastakhat wa Mohar",
  stampNote: 'Registered Doctor (RMP)',
  legalNote: 'Kisi bhi registered medical store par dawa lene ke liye maanya. Bachho ki pahuch se door rakhein.',
  regNo: 'Reg. No:',
  years: 'Saal',
  vitalBp: 'BP',
  vitalPulse: 'Pulse',
  vitalTemp: 'Temp',
  vitalSpo2: 'SpO2',
  vitalWeight: 'Weight',
  diagnosisConfirmed: '✓ Pakka Nidan (Confirmed Diagnosis):',
  diagnosisProvisional: '⚠ Sambhavit Nidan (Provisional Assessment):',
  complaintsPatient: 'Takleef / Symptoms (Patient-Reported):',
  findingsDoctor: 'Jaanch ki Jankari (Doctor Examination):',
  footerEmr: 'Electronic Medical Record',
  footerGenerated: 'MediScript Clinical AI dwara banaya gaya'
};

export const getPrescriptionLabels = (lang: PrintLanguage): PrescriptionLabels => {
  switch (lang) {
    case 'hi':
      return labelsHi;
    case 'hinglish':
      return labelsHinglish;
    case 'en':
    default:
      return labelsEn;
  }
};

// Translates standard clinical frequencies safely without changing medical meaning
export const translateFrequency = (freq: string, lang: PrintLanguage): string => {
  if (!freq || lang === 'en') return freq;

  const lower = freq.toLowerCase();

  if (lang === 'hi') {
    if (lower.includes('1-0-1') && lower.includes('after food')) return '१-०-१ (सुबह व रात, खाने के बाद)';
    if (lower.includes('1-0-1')) return '१-०-१ (सुबह व रात)';
    if (lower.includes('1-0-0') && lower.includes('empty')) return '१-०-० (सुबह खाली पेट)';
    if (lower.includes('1-0-0')) return '१-०-० (सुबह नाश्ते के बाद)';
    if (lower.includes('0-0-1') && lower.includes('bedtime')) return '०-०-१ (रात को सोते समय)';
    if (lower.includes('0-0-1')) return '०-०-१ (रात को)';
    if (lower.includes('1-1-1')) return '१-१-१ (सुबह, दोपहर, शाम खाने के बाद)';
    if (lower.includes('sos')) return 'जरूरत पड़ने पर (SOS)';
    return freq;
  }

  if (lang === 'hinglish') {
    if (lower.includes('1-0-1') && lower.includes('after food')) return '1-0-1 (Subah aur raat, khane ke baad)';
    if (lower.includes('1-0-1')) return '1-0-1 (Subah aur raat)';
    if (lower.includes('1-0-0') && lower.includes('empty')) return '1-0-0 (Subah khali pet)';
    if (lower.includes('1-0-0')) return '1-0-0 (Subah nashte ke baad)';
    if (lower.includes('0-0-1') && lower.includes('bedtime')) return '0-0-1 (Raat ko sote waqt)';
    if (lower.includes('0-0-1')) return '0-0-1 (Raat ko)';
    if (lower.includes('1-1-1')) return '1-1-1 (Subah, dopahar, shaam khane ke baad)';
    if (lower.includes('sos')) return 'Zaroorat padne par (SOS)';
    return freq;
  }

  return freq;
};

// Translates standard instructions if available
export const translateInstructions = (inst: string, lang: PrintLanguage): string => {
  if (!inst || lang === 'en') return inst;

  const lower = inst.toLowerCase();

  if (lang === 'hi') {
    if (lower.includes('warm water')) return 'गुनगुने पानी के साथ लें।';
    if (lower.includes('before breakfast') || lower.includes('empty stomach')) return 'सुबह नाश्ते से ३० मिनट पहले खाली पेट लें।';
    if (lower.includes('after food') || lower.includes('after meal')) return 'खाना खाने के बाद लें।';
    if (lower.includes('drowsiness')) return 'नींद आ सकती है; रात को गाड़ी न चलाएं।';
    if (lower.includes('complete') && lower.includes('course')) return 'एंटीबायोटिक का पूरा कोर्स बिना छोड़े लें।';
    if (lower.includes('shake')) return 'पीने से पहले शीशी को अच्छी तरह हिलाएं।';
    return inst;
  }

  if (lang === 'hinglish') {
    if (lower.includes('warm water')) return 'Gungune paani ke sath lein.';
    if (lower.includes('before breakfast') || lower.includes('empty stomach')) return 'Subah nashte se 30 min pehle khali pet lein.';
    if (lower.includes('after food') || lower.includes('after meal')) return 'Khana khane ke baad lein.';
    if (lower.includes('drowsiness')) return 'Neend aa sakti hai; raat ko driving na karein.';
    if (lower.includes('complete') && lower.includes('course')) return 'Antibiotic ka poora course bina chhode lein.';
    if (lower.includes('shake')) return 'Sheeshi ko acche se shake karke lein.';
    return inst;
  }

  return inst;
};

// Translates dietary advice
export const translateAdvice = (adv: string, lang: PrintLanguage): string => {
  if (!adv || lang === 'en') return adv;

  const lower = adv.toLowerCase();

  if (lang === 'hi') {
    if (lower.includes('warm fluids') || lower.includes('hydration') || lower.includes('water')) {
      return 'खूब उबला या गुनगुना पानी पिएं (कम से कम ३ लीटर रोजाना), गुनगुने नमक के पानी से गरारे करें, हल्का सुपाच्य भोजन (खिचड़ी/दलिया) लें। ठंडी चीजों से परहेज रखें।';
    }
    if (lower.includes('spicy') || lower.includes('oily') || lower.includes('smoke')) {
      return 'तली-भुनी, तीखी और मसालेदार चीजों, चाय, सिगरेट से परहेज करें। समय पर हल्का भोजन करें।';
    }
    return adv;
  }

  if (lang === 'hinglish') {
    if (lower.includes('warm fluids') || lower.includes('hydration') || lower.includes('water')) {
      return 'Khoob gunguna paani piyein (kam se kam 3 litre rozana), namak ke gungune paani se gargle karein, halka khana (khichdi/daliya) lein. Thandi cheezon se parhez karein.';
    }
    if (lower.includes('spicy') || lower.includes('oily') || lower.includes('smoke')) {
      return 'Tali-bhuni, teekhi masaledar cheezon, chai, smoking se parhez karein. Samay par halka khana khayein.';
    }
    return adv;
  }

  return adv;
};

// Translates patient gender
export const translateGender = (gender: string, lang: PrintLanguage): string => {
  if (!gender || lang === 'en') return gender;
  const lower = gender.toLowerCase();
  if (lang === 'hi') {
    if (lower === 'male') return 'पुरुष (Male)';
    if (lower === 'female') return 'महिला (Female)';
    return 'अन्य (Other)';
  }
  if (lang === 'hinglish') {
    if (lower === 'male') return 'Purush (Male)';
    if (lower === 'female') return 'Mahila (Female)';
    return 'Other';
  }
  return gender;
};

// Translates medicine dosage form (Tablet, Capsule, Syrup, etc.)
export const translateDosageForm = (form: string, lang: PrintLanguage): string => {
  if (!form || lang === 'en') return form;
  const lower = form.toLowerCase();
  if (lang === 'hi') {
    if (lower.includes('tab')) return 'टैबलेट / गोली';
    if (lower.includes('cap')) return 'कैप्सूल';
    if (lower.includes('syr') || lower.includes('susp')) return 'सिरप';
    if (lower.includes('inj')) return 'इंजेक्शन';
    if (lower.includes('drop')) return 'ड्रॉप्स';
    if (lower.includes('oint') || lower.includes('gel') || lower.includes('cream')) return 'मलहम / ऑइंटमेंट';
    return form;
  }
  if (lang === 'hinglish') {
    if (lower.includes('tab')) return 'Tablet (Goli)';
    if (lower.includes('cap')) return 'Capsule';
    if (lower.includes('syr')) return 'Syrup';
    if (lower.includes('inj')) return 'Injection';
    if (lower.includes('drop')) return 'Drops';
    if (lower.includes('oint')) return 'Ointment (Malham)';
    return form;
  }
  return form;
};

// Translates duration (e.g. 5 days, 1 week)
export const translateDuration = (duration: string, lang: PrintLanguage): string => {
  if (!duration || lang === 'en') return duration;
  const lower = duration.toLowerCase().trim();

  if (lang === 'hi') {
    // Replace english duration words
    let translated = duration
      .replace(/(\d+)\s*days?/gi, '$1 दिन')
      .replace(/(\d+)\s*weeks?/gi, '$1 सप्ताह')
      .replace(/(\d+)\s*months?/gi, '$1 महीने')
      .replace(/for\s+/gi, '')
      .replace(/(\d+)\s*din/gi, '$1 दिन');
    return translated;
  }

  if (lang === 'hinglish') {
    let translated = duration
      .replace(/(\d+)\s*days?/gi, '$1 Din')
      .replace(/(\d+)\s*weeks?/gi, '$1 Hafte')
      .replace(/(\d+)\s*months?/gi, '$1 Mahine');
    return translated;
  }

  return duration;
};

// Translates follow-up instructions
export const translateFollowUp = (fu: string, lang: PrintLanguage): string => {
  if (!fu || lang === 'en') return fu;
  const lower = fu.toLowerCase();

  if (lang === 'hi') {
    if (lower.includes('5 day') || lower.includes('5 दिन')) return '५ दिन बाद (After 5 days)';
    if (lower.includes('3 day') || lower.includes('3 दिन')) return '३ दिन बाद (After 3 days)';
    if (lower.includes('7 day') || lower.includes('1 week') || lower.includes('सप्ताह')) return '१ सप्ताह बाद (After 1 week)';
    if (lower.includes('10 day')) return '१० दिन बाद (After 10 days)';
    if (lower.includes('15 day') || lower.includes('2 week')) return '१५ दिन बाद (After 15 days)';
    if (lower.includes('1 month') || lower.includes('महीना')) return '१ महीने बाद (After 1 month)';
    if (lower.includes('sos') || lower.includes('needed')) return 'जरूरत पड़ने पर या तकलीफ बढ़ने पर तुरंत आएं (SOS)';
    return fu.replace(/after\s+/gi, '').replace(/days?/gi, 'दिन बाद');
  }

  if (lang === 'hinglish') {
    if (lower.includes('5 day')) return '5 din baad (After 5 days)';
    if (lower.includes('3 day')) return '3 din baad (After 3 days)';
    if (lower.includes('7 day') || lower.includes('1 week')) return '1 hafte baad (After 1 week)';
    if (lower.includes('sos') || lower.includes('needed')) return 'Zaroorat padne par turant check-up karein (SOS)';
    return fu.replace(/after\s+/gi, '').replace(/days?/gi, 'din baad');
  }

  return fu;
};

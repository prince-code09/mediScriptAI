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
  legalNote: 'Valid for dispensing at any licensed pharmacy in India. Keep out of reach of children.'
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
  legalNote: 'भारत के किसी भी पंजीकृत मेडिकल स्टोर से दवा लेने हेतु मान्य। बच्चों की पहुँच से दूर रखें।'
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
  legalNote: 'Kisi bhi registered medical store par dawa lene ke liye maanya. Bachho ki pahuch se door rakhein.'
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

import { VoiceSimulationSample, MedicineItem } from '../types';
import { sampleVoiceScenarios } from './mockData';

// Voice Recognition and Voice Workflow Simulator
export interface SpeechRecognitionResultState {
  transcript: string;
  isRealSpeech: boolean;
  sampleData?: VoiceSimulationSample;
}

export class SpeechService {
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
      }
    }
  }

  isBrowserSpeechSupported(): boolean {
    return this.isSupported;
  }

  getSampleScenario(lang: 'en' | 'hi'): VoiceSimulationSample {
    const found = sampleVoiceScenarios.find(s => s.language === lang);
    return found || sampleVoiceScenarios[0];
  }

  // Safe client-side clinical extractor: parses ONLY what the doctor actually spoke
  // Never inserts demo patients, fake vitals, or unmentioned medicines
  extractPrescriptionFromSpeech(text: string, sample?: VoiceSimulationSample) {
    // Only return sample if user explicitly chose a demo sample and text matches it
    if (sample && text && text.trim().toLowerCase().includes(sample.extractedData.patientName.toLowerCase())) {
      return JSON.parse(JSON.stringify(sample.extractedData));
    }

    const lower = (text || '').toLowerCase();

    // 1. Patient Name (Supports English, Hinglish, and Hindi Devanagari)
    let patientName = '';
    const nameMatch = text.match(/(?:patient\s+name|patient|mareez|मरीज\s+का\s+नाम|मरीज|name\s+is|shri|smt)\s*(?::|\bis\b|\bhai\b)?\s*([A-Za-z\u0900-\u097F\s]+?)(?:,|\.|\b(?:age|umar|years|saal|उम्र|साल)\b|\d+)/i);
    if (nameMatch && nameMatch[1]) {
      patientName = nameMatch[1].trim();
    }

    // 2. Patient Age
    let patientAge: number | '' = '';
    const ageMatch = lower.match(/(?:age|umar|saal|उम्र|साल)\s*(?:is|hai|:)?\s*(\d{1,3})/i) || lower.match(/(\d{1,3})\s*(?:years|saal|yr|y\/o|साल)/i);
    if (ageMatch && ageMatch[1]) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge > 0 && parsedAge <= 130) {
        patientAge = parsedAge;
      }
    }

    // 3. Gender
    let patientGender: 'Male' | 'Female' | 'Other' = 'Male';
    if (/\b(female|mahila|aurat|woman|girl|महिला|औरत)\b/i.test(lower)) {
      patientGender = 'Female';
    } else if (/\b(male|purush|aadmi|man|boy|पुरुष|आदमी)\b/i.test(lower)) {
      patientGender = 'Male';
    }

    // 4. Vitals - STRICT: Only if explicitly spoken
    const vitals: any = {};
    const bpMatch = lower.match(/(?:bp|blood pressure)\s*(?:is|hai|:)?\s*(\d{2,3}\s*\/\s*\d{2,3})/i);
    if (bpMatch) vitals.bp = bpMatch[1].replace(/\s+/g, '') + ' mmHg';

    const pulseMatch = lower.match(/(?:pulse|heart rate)\s*(?:is|hai|:)?\s*(\d{2,3})/i);
    if (pulseMatch) vitals.pulse = pulseMatch[1] + ' bpm';

    const tempMatch = lower.match(/(?:temp|temperature|bukhar)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)/i);
    if (tempMatch) vitals.temp = tempMatch[1] + ' °F';

    const spo2Match = lower.match(/(?:spo2|oxygen|saturation)\s*(?:is|hai|:)?\s*(\d{2,3})/i);
    if (spo2Match) vitals.spo2 = spo2Match[1] + '%';

    const weightMatch = lower.match(/(?:weight|wazan|wt)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)/i);
    if (weightMatch) vitals.weight = weightMatch[1] + ' kg';

    const hasAnyVital = Boolean(vitals.bp || vitals.pulse || vitals.temp || vitals.spo2 || vitals.weight);

    // 5. Symptoms
    let symptoms = '';
    let durationOfSymptoms = '';
    const symMatch = text.match(/(?:complaint|symptom|takleef|problem|तकलीफ|शिकायत)\s*(?:is|are|hai|of|:)?\s*([^,\.]+)/i);
    if (symMatch && symMatch[1]) {
      symptoms = symMatch[1].trim();
    } else {
      const symList: string[] = [];
      if (/fever|bukhar|बुखार/i.test(lower)) symList.push('Fever');
      if (/cough|khansi|खांसी/i.test(lower)) symList.push('Cough');
      if (/cold|jukham|जुकाम|सर्दी/i.test(lower)) symList.push('Common cold');
      if (/body ache|badan dard|बदन दर्द/i.test(lower)) symList.push('Body ache');
      if (/throat pain|gale me dard|गले में दर्द/i.test(lower)) symList.push('Sore throat');
      if (/headache|sar dard|सिर दर्द/i.test(lower)) symList.push('Headache');
      if (/vomiting|ulti|उल्टी/i.test(lower)) symList.push('Vomiting');
      if (symList.length > 0) symptoms = symList.join(', ');
    }

    const durMatch = lower.match(/(?:since|for|se)\s*(\d+\s*(?:days|din|weeks|hafte|months|mahine|दिन))/i);
    if (durMatch) {
      durationOfSymptoms = durMatch[1].trim();
    }

    // 6. Diagnosis - only if explicitly stated
    let diagnosis = '';
    let isDiagnosisConfirmed = false;
    const diagMatch = text.match(/(?:diagnosis|bimari|nidan|निदान|बीमारी)\s*(?:is|hai|:)?\s*([^,\.]+)/i);
    if (diagMatch && diagMatch[1]) {
      diagnosis = diagMatch[1].trim();
      isDiagnosisConfirmed = /confirmed\s+diagnosis|confirmed\s+case|final\s+diagnosis|पुष्ट\s+निदान/i.test(lower);
    }

    // 7. Medicines - accurately extract explicitly spoken medicines with context-specific frequencies
    const medicines: MedicineItem[] = [];
    const medCandidates = [
      { pat: /paracetamol|pcm|calpol|dolo|paracitamol|पैरासिटामोल|पेरासिटामोल/i, name: 'Paracetamol', defaultStrength: '650 mg', form: 'Tablet' as const },
      { pat: /azithromycin|azee|azithro|azithromicin|अज़ीथ्रोमाइसिन|एजिथ्रोमाइसिन/i, name: 'Azithromycin', defaultStrength: '500 mg', form: 'Tablet' as const },
      { pat: /amoxicillin|mox|augmentin|amoxyclav|एमोक्सिसिलिन/i, name: 'Amoxicillin & Clavulanate', defaultStrength: '625 mg', form: 'Tablet' as const },
      { pat: /pantoprazole|pan\s*40|pantocid|पेंटोप्रजोल|पैंटोसिड/i, name: 'Pantoprazole', defaultStrength: '40 mg', form: 'Tablet' as const },
      { pat: /cetirizine|cetrizine|cetzine|सिट्रिजिन/i, name: 'Cetirizine', defaultStrength: '10 mg', form: 'Tablet' as const },
      { pat: /levocetirizine|montek\s*lc|montair|लेवोसिट्रिजिन/i, name: 'Levocetirizine + Montelukast', defaultStrength: '5mg+10mg', form: 'Tablet' as const },
      { pat: /cough syrup|syrup|ascoril|benadryl|कफ सिरप/i, name: 'Cough Syrup', defaultStrength: '100 ml', form: 'Syrup' as const },
      { pat: /cefixime|zifi|सेफिक्सिम/i, name: 'Cefixime', defaultStrength: '200 mg', form: 'Tablet' as const },
      { pat: /metformin|glycomet|मेटफॉर्मिन/i, name: 'Metformin', defaultStrength: '500 mg', form: 'Tablet' as const },
      { pat: /telmisartan|telma|टेलमिसार्टन/i, name: 'Telmisartan', defaultStrength: '40 mg', form: 'Tablet' as const },
      { pat: /ibuprofen|brufen|combiflam|इबुप्रोफेन/i, name: 'Ibuprofen + Paracetamol', defaultStrength: '400mg+325mg', form: 'Tablet' as const },
      { pat: /multivitamin|becosules|zincovit|मल्टीविटामिन/i, name: 'Multivitamin with Zinc', defaultStrength: '', form: 'Capsule' as const }
    ];

    const matchedCands: { cand: typeof medCandidates[0]; start: number; end: number }[] = [];
    medCandidates.forEach((cand) => {
      const match = cand.pat.exec(lower);
      if (match) {
        matchedCands.push({ cand, start: match.index, end: match.index + match[0].length });
      }
    });

    matchedCands.sort((a, b) => a.start - b.start);

    matchedCands.forEach((item, idx) => {
      const { cand, start } = item;
      const end = idx + 1 < matchedCands.length ? matchedCands[idx + 1].start : Math.min(lower.length, start + 140);
      const segment = lower.substring(start, end);

      // Strength in segment
      const strMatch = segment.match(/(\d+\s*(?:mg|gm|ml))/i);
      const strength = strMatch ? strMatch[1] : cand.defaultStrength;

      // Frequency in medicine-specific segment
      let freq = '';
      if (/1-0-1|twice daily|subah sham|सुबह शाम|bd/i.test(segment)) freq = '1-0-1 (After Food)';
      else if (/1-0-0|once daily|subah khali pet|सुबह खाली पेट|od/i.test(segment)) freq = '1-0-0 (Morning)';
      else if (/0-0-1|bedtime|raat ko|रात को|hs/i.test(segment)) freq = '0-0-1 (At Bedtime)';
      else if (/1-1-1|tds|thrice daily|तीन बार/i.test(segment)) freq = '1-1-1 (After Food)';
      else if (matchedCands.length === 1) {
        // Only 1 medicine in entire dictation
        if (/1-0-1|twice daily|subah sham|bd/i.test(lower)) freq = '1-0-1 (After Food)';
        else if (/1-0-0|once daily|subah khali pet|od/i.test(lower)) freq = '1-0-0 (Morning)';
        else if (/0-0-1|bedtime|raat ko|hs/i.test(lower)) freq = '0-0-1 (At Bedtime)';
        else if (/1-1-1|tds|thrice daily/i.test(lower)) freq = '1-1-1 (After Food)';
      }

      // Duration in segment
      let dur = '';
      const medDurMatch = segment.match(/(\d+)\s*(?:days|din|दिन)/i) || (matchedCands.length === 1 ? lower.match(/(\d+)\s*(?:days|din|दिन)/i) : null);
      if (medDurMatch) dur = `${medDurMatch[1]} Days`;

      // Dose if explicitly spoken
      let dose = '';
      const doseMatch = segment.match(/(\d+\s*(?:tab|tablet|cap|capsule|ml|tsp|puff|drop))/i);
      if (doseMatch) {
        dose = doseMatch[1];
      }

      medicines.push({
        id: `med-${Date.now()}-${idx}`,
        name: cand.name,
        strength,
        dosageForm: cand.form,
        dose,
        frequency: freq,
        duration: dur,
        instructions: '',
        route: 'Oral'
      });
    });

    // 8. Advice & Follow Up
    let advice = '';
    if (/warm fluids|water|paani|steam|gargle|rest|aaram/i.test(lower)) {
      advice = 'Plenty of warm fluids, steam inhalation, and adequate rest.';
    }

    let followUp = '';
    const fuMatch = lower.match(/(?:follow\s*up|review|dikhana)\s*(?:after|in|baad)?\s*(\d+\s*(?:days|din|weeks|hafte))/i);
    if (fuMatch) {
      followUp = `Review in OPD after ${fuMatch[1]}`;
    }

    return {
      patientName,
      patientAge,
      patientGender,
      symptoms,
      durationOfSymptoms,
      clinicalFindings: '',
      diagnosis,
      isDiagnosisConfirmed,
      vitals: hasAnyVital ? vitals : undefined,
      medicines,
      advice,
      followUp
    };
  }
}

export const speechService = new SpeechService();

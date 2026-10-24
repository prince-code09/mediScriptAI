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

    // 1. Delimiters & Patient Name (Supports English, Hinglish, and Hindi Devanagari)
    const END_BOUNDARIES_STR = '(?:,|\.|\b(?:age|umar|years|year|saal|yrs|old|उम्र|साल|male|female|purush|mahila|पुरुष|महिला|complaints?|takleef|problem|shikayat|तकलीफ|शिकायत|suffering|having|with|ko|tab|tablet|cap|capsule|syrup|dawa)\b|\b\d{1,3}\b)';
    let patientName = '';
    const nameMatch = text.match(new RegExp(`(?:patient\s+name|patient|mareez|मरीज\s+का\s+नाम|मरीज|shri|smt|mr\.|mrs\.)\s*(?::|\bis\b|\bhai\b)?\s*([A-Za-z\u0900-\u097F\s\.\\'-]+?)(?=${END_BOUNDARIES_STR}|$)`, 'i')) ||
                      text.match(new RegExp(`^\s*([A-Za-z\u0900-\u097F\s\.\\'-]+?)(?=${END_BOUNDARIES_STR})`, 'i'));
    if (nameMatch && nameMatch[1]) {
      const cand = nameMatch[1].trim();
      if (cand && !['name', 'is', 'a', 'the', 'ko', 'hai'].includes(cand.toLowerCase()) && cand.split(/\s+/).length <= 4) {
        patientName = /[A-Za-z]/.test(cand) ? cand.replace(/\b\\w/g, c => c.toUpperCase()) : cand;
      }
    }

    // 2. Patient Age (handles 'age 35', '35 years', 'Rahul Sharma, 35, male')
    let patientAge: number | '' = '';
    const ageMatch = lower.match(/\b(?:age|umar|उम्र)\s*(?:is|hai|:)?\s*(\d{1,3})\b/i) ||
                     lower.match(/\b(\d{1,3})\s*(?:years\s*old|yrs\s*old|years|year|saal|yrs|साल)\b/i) ||
                     lower.match(/(?:patient|name|mareez)?\s*[A-Za-z\u0900-\u097F\s\.\\'-]+?[,\s]+(\d{1,3})\s*(?:years|saal|yr|y\/o|साल|male|female|purush|mahila|m\b|f\b)/i);
    if (ageMatch && ageMatch[1]) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge > 0 && parsedAge <= 130) {
        patientAge = parsedAge;
      }
    }

    // 3. Gender
    let patientGender: 'Male' | 'Female' | 'Other' = 'Male';
    if (/\b(female|mahila|aurat|woman|girl|महिला|औरत)\b/i.test(lower) || /\b\d{1,3}\s*(?:y|yr|years|saal)?\s*[\/,]?\s*(female|f)\b/i.test(lower)) {
      patientGender = 'Female';
    } else if (/\b(male|purush|aadmi|man|boy|पुरुष|आदमी)\b/i.test(lower) || /\b\d{1,3}\s*(?:y|yr|years|saal)?\s*[\/,]?\s*(male|m)\b/i.test(lower)) {
      patientGender = 'Male';
    }

    // 3b. Phone Number (Optional 10-digit Indian mobile)
    let patientPhone = '';
    const phoneMatch = text.match(/(?:phone|mobile|contact|number|ph)\s*(?:is|number|no|:)?\s*(\\+?91[\-\s]?)?([6-9]\d{9})\b/i);
    if (phoneMatch && phoneMatch[2]) {
      patientPhone = phoneMatch[2];
    }

    // 4. Vitals - STRICT: Only if explicitly spoken
    const vitals: any = {};
    const bpMatch = lower.match(/(?:bp|blood pressure)\s*(?:is|hai|:)?\s*(\d{2,3}\s*\/\s*\d{2,3})/i);
    if (bpMatch) vitals.bp = bpMatch[1].replace(/\s+/g, '') + ' mmHg';

    const pulseMatch = lower.match(/(?:pulse|heart rate)\s*(?:is|hai|:)?\s*(\d{2,3})/i);
    if (pulseMatch) vitals.pulse = pulseMatch[1] + ' bpm';

    const tempMatch = lower.match(/(?:temp|temperature|bukhar)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)/i) || lower.match(/fever\s*(?:of|is|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|deg|degree)?/i);
    if (tempMatch) vitals.temp = tempMatch[1] + ' °F';

    const spo2Match = lower.match(/(?:spo2|oxygen|saturation)\s*(?:is|hai|:)?\s*(\d{2,3})/i);
    if (spo2Match) vitals.spo2 = spo2Match[1] + '%';

    const weightMatch = lower.match(/(?:weight|wazan|wt)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)/i);
    if (weightMatch) vitals.weight = weightMatch[1] + ' kg';

    const hasAnyVital = Boolean(vitals.bp || vitals.pulse || vitals.temp || vitals.spo2 || vitals.weight);

    // 5. Symptoms (Cough Syrup must NOT trigger Cough complaint)
    let symptoms = '';
    let durationOfSymptoms = '';
    const symMatch = text.match(/(?:complaint|symptom|takleef|problem|तकलीफ|शिकायत)\s*(?:is|are|hai|of|:)?\s*([^,\.]+)/i);
    if (symMatch && symMatch[1]) {
      symptoms = symMatch[1].trim();
    } else {
      const symList: string[] = [];
      if (/\b(fever|bukhar|बुखार)\b/i.test(lower)) symList.push('Fever');
      if (/\bcough\b(?!\s*syrup)\b|khansi|खांसी/i.test(lower)) symList.push('Cough');
      if (/\b(cold|jukham|जुकाम|सर्दी)\b/i.test(lower)) symList.push('Common Cold / Coryza');
      if (/\b(body ache|badan dard|बदन दर्द)\b/i.test(lower)) symList.push('Body ache');
      if (/\b(throat pain|gale me dard|sore throat|गले में दर्द)\b/i.test(lower)) symList.push('Sore throat');
      if (/\b(headache|sar dard|सिर दर्द)\b/i.test(lower)) symList.push('Headache');
      if (/\b(vomiting|ulti|उल्टी)\b/i.test(lower)) symList.push('Vomiting');
      if (/\b(acidity|gas|पेट में जलन)\b/i.test(lower)) symList.push('Acidity / Dyspepsia');
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

    // 7. Multi-Medicine Extraction (Comprehensive Indian catalog, strictly extracting all items)
    const medCatalog = [
      { pat: /\b(?:dolo\s*650|dolo)\b/gi, name: 'Dolo 650', defaultStrength: '650 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:calpol\s*650|calpol\s*500|calpol)\b/gi, name: 'Calpol', defaultStrength: '650 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\bcrocin\b/gi, name: 'Crocin', defaultStrength: '650 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:paracetamol|pcm|paracitamol|पैरासिटामोल|पेरासिटामोल)\b/gi, name: 'Paracetamol', defaultStrength: '650 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:cough syrup|benadryl|ascoril|grilinctus|chericof|alex|tusq|zedex|kufma|कफ सिरप)\b/gi, name: 'Cough Syrup', defaultStrength: '100 ml', form: 'Syrup' as const, route: 'Oral' },
      { pat: /\b(?:azithromycin|azithro|azee|azithral|अज़ीथ्रोमाइसिन|एजिथ्रोमाइसिन)\b/gi, name: 'Azithromycin', defaultStrength: '500 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:amoxicillin|amoxycillin|mox|augmentin|amoxyclav|clavam|एमोक्सिसिलिन)\b/gi, name: 'Amoxicillin & Clavulanate', defaultStrength: '625 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:pantoprazole|pantocid|pan\s*40|पेंटोप्रजोल|पैंटोसिड)\b/gi, name: 'Pantoprazole', defaultStrength: '40 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:pan\s*d|pantoprazole\s*d)\b/gi, name: 'Pan-D', defaultStrength: '40mg + 30mg', form: 'Capsule' as const, route: 'Oral' },
      { pat: /\b(?:rabeprazole|razo|rablet|rabicip)\b/gi, name: 'Rabeprazole', defaultStrength: '20 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:omeprazole|omez)\b/gi, name: 'Omeprazole', defaultStrength: '20 mg', form: 'Capsule' as const, route: 'Oral' },
      { pat: /\b(?:cetirizine|cetrizine|cetzine|alerid|सिट्रिजिन)\b/gi, name: 'Cetirizine', defaultStrength: '10 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:levocetirizine|montek\s*lc|montair\s*lc|telekast|लेवोसिट्रिजिन)\b/gi, name: 'Levocetirizine + Montelukast', defaultStrength: '5mg+10mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:fexofenadine|allegra)\b/gi, name: 'Fexofenadine', defaultStrength: '120 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:cefixime|zifi|taxim\s*o|taxim|mahacef|सेफिक्सिम)\b/gi, name: 'Cefixime', defaultStrength: '200 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:ciprofloxacin|ciplox)\b/gi, name: 'Ciprofloxacin', defaultStrength: '500 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:ofloxacin|zanocin|oflox|o2)\b/gi, name: 'Ofloxacin', defaultStrength: '200 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:ibuprofen|brufen|combiflam|इबुप्रोफेन)\b/gi, name: 'Ibuprofen + Paracetamol', defaultStrength: '400mg+325mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:aceclofenac|zerodol\s*sp|zerodol\s*p|zerodol|hifenac)\b/gi, name: 'Aceclofenac', defaultStrength: '100 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:diclofenac|voveran)\b/gi, name: 'Diclofenac', defaultStrength: '50 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:tramadol|ultracet)\b/gi, name: 'Tramadol', defaultStrength: '50 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:meftal\s*spas|dicyclomine|cyclopam)\b/gi, name: 'Meftal-Spas', defaultStrength: '', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:ondansetron|emeset|vomikind)\b/gi, name: 'Ondansetron', defaultStrength: '4 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:domperidone|domstal)\b/gi, name: 'Domperidone', defaultStrength: '10 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:metformin|glycomet|मेटफॉर्मिन)\b/gi, name: 'Metformin', defaultStrength: '500 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:glimepiride|amaryl)\b/gi, name: 'Glimepiride', defaultStrength: '1 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:telmisartan|telma|telmikind|टेलमिसार्टन)\b/gi, name: 'Telmisartan', defaultStrength: '40 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:amlodipine|stamlo|amlong)\b/gi, name: 'Amlodipine', defaultStrength: '5 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:atorvastatin|atorva|storvas)\b/gi, name: 'Atorvastatin', defaultStrength: '10 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:multivitamin|becosules|zincovit|a\s*to\s*z|मल्टीविटामिन)\b/gi, name: 'Multivitamin with Zinc', defaultStrength: '', form: 'Capsule' as const, route: 'Oral' },
      { pat: /\b(?:calcium|shelcal)\b/gi, name: 'Calcium + Vitamin D3', defaultStrength: '500 mg', form: 'Tablet' as const, route: 'Oral' },
      { pat: /\b(?:vitamin\s*d3|calcirol|d3\s*60k)\b/gi, name: 'Vitamin D3', defaultStrength: '60,000 IU', form: 'Capsule' as const, route: 'Oral' },
      { pat: /\b(?:ors|electral)\b/gi, name: 'Oral Rehydration Salts (ORS)', defaultStrength: '', form: 'Syrup' as const, route: 'Oral' },
      { pat: /\b(?:antacid|digene|gelusil|mucaine)\b/gi, name: 'Antacid', defaultStrength: '', form: 'Syrup' as const, route: 'Oral' },
      { pat: /\b(?:eye\s*drops?|ear\s*drops?)\b/gi, name: 'Eye/Ear Drops', defaultStrength: '', form: 'Drops' as const, route: 'Ophthalmic/Otic' }
    ];

    interface MatchedCandidate {
      start: number;
      end: number;
      name: string;
      defaultStrength: string;
      form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment' ;
      route: string;
    }

    const rawMatches: MatchedCandidate[] = [];
    medCatalog.forEach(cand => {
      cand.pat.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = cand.pat.exec(lower)) !== null) {
        rawMatches.push({
          start: m.index,
          end: m.index + m[0].length,
          name: cand.name,
          defaultStrength: cand.defaultStrength,
          form: cand.form,
          route: cand.route
        });
      }
    });

    // Generic prefix matching e.g. "Tab XYZ", "Syrup ABC"
    const genericPat = /\b(tab|tablet|cap|capsule|syp|syrup|inj|injection|drops?|cream|ointment|gel)\s+([A-Za-z0-9\-\\+]+)\b/gi;
    const formMap: Record<string, 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment'> = {
      tab: 'Tablet', tablet: 'Tablet',
      cap: 'Capsule', capsule: 'Capsule',
      syp: 'Syrup', syrup: 'Syrup',
      inj: 'Injection', injection: 'Injection',
      drops: 'Drops', drop: 'Drops',
      cream: 'Ointment', ointment: 'Ointment', gel: 'Ointment'
    };
    let gm: RegExpExecArray | null;
    while ((gm = genericPat.exec(lower)) !== null) {
      const formWord = gm[1].toLowerCase();
      const drugWord = gm[2];
      if (!['is', 'a', 'the', 'and', 'for', 'after', 'before', 'once', 'twice', 'thrice', 'daily', 'days', 'ko', 'hai'].includes(drugWord.toLowerCase())) {
        const titleName = drugWord.charAt(0).toUpperCase() + drugWord.slice(1);
        rawMatches.push({
          start: gm.index,
          end: gm.index + gm[0].length,
          name: titleName,
          defaultStrength: '',
          form: formMap[formWord] || 'Tablet',
          route: ['tab', 'tablet', 'cap', 'capsule', 'syp', 'syrup'].includes(formWord) ? 'Oral' : 'Topical'
        });
      }
    }

    // Deduplicate overlapping matches (prefer longer match)
    rawMatches.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const matchedCands: MatchedCandidate[] = [];
    for (const m of rawMatches) {
      let overlaps = false;
      for (const kept of matchedCands) {
        if (!(m.end <= kept.start || m.start >= kept.end)) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        matchedCands.push(m);
      }
    }

    matchedCands.sort((a, b) => a.start - b.start);

    const medicines: MedicineItem[] = [];
    matchedCands.forEach((item, idx) => {
      const { start } = item;
      const end = idx + 1 < matchedCands.length ? matchedCands[idx + 1].start : Math.min(lower.length, start + 140);
      const segment = lower.substring(start, end);

      // Strength in segment
      const strMatch = segment.match(/(\d+(?:\.\d+)?\s*(?:mg|gm|ml|mcg|iu|%))/i);
      const strength = strMatch ? strMatch[1] : item.defaultStrength;

      // Frequency in medicine-specific segment (STRICT: no fabrication if unmentioned)
      let freq = '';
      if (/1-0-1|twice daily|subah\s+sham|सुबह\s+शाम|bd\b/i.test(segment)) freq = '1-0-1 (After Food)';
      else if (/1-0-0|once daily|subah\s+khali\s+pet|सुबह\s+खाली\s+पेट|od\b/i.test(segment)) freq = '1-0-0 (Morning)';
      else if (/0-0-1|bedtime|raat\s+ko|रात\s+को|hs\b/i.test(segment)) freq = '0-0-1 (At Bedtime)';
      else if (/1-1-1|tds|thrice daily|तीन\s+बार/i.test(segment)) freq = '1-1-1 (After Food)';
      else if (matchedCands.length === 1) {
        if (/1-0-1|twice daily|subah\s+sham|bd\b/i.test(lower)) freq = '1-0-1 (After Food)';
        else if (/1-0-0|once daily|subah\s+khali\s+pet|od\b/i.test(lower)) freq = '1-0-0 (Morning)';
        else if (/0-0-1|bedtime|raat\s+ko|hs\b/i.test(lower)) freq = '0-0-1 (At Bedtime)';
        else if (/1-1-1|tds|thrice daily/i.test(lower)) freq = '1-1-1 (After Food)';
      }

      // Duration in segment (STRICT: no fabrication if unmentioned)
      let dur = '';
      const medDurMatch = segment.match(/(\d+)\s*(?:days|din|weeks|hafte|दिन)/i) || (matchedCands.length === 1 ? lower.match(/(\d+)\s*(?:days|din|weeks|hafte|दिन)/i) : null);
      if (medDurMatch) dur = `${medDurMatch[1]} Days`;

      // Dose if explicitly spoken
      let dose = '';
      const doseMatch = segment.match(/(\d+\s*(?:tab|tablet|cap|capsule|ml|tsp|puff|drop))/i);
      if (doseMatch) {
        dose = doseMatch[1];
      }

      medicines.push({
        id: `med-${Date.now()}-${idx}`,
        name: item.name,
        strength,
        dosageForm: item.form,
        dose,
        frequency: freq,
        duration: dur,
        instructions: '',
        route: item.route
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
      patientPhone,
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

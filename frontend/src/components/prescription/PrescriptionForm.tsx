import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicineItem, Prescription, DosageForm } from '../../types';
import { speechService } from '../../services/speechService';
import { apiClient } from '../../services/apiClient';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Mic, 
  Edit, 
  UserCheck, 
  Calendar,
  AlertTriangle,
  HeartPulse,
  Send,
  RotateCcw,
  Check,
  X,
  Languages,
  FileText,
  FileCheck2,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  onPreview: (rx: Prescription) => void;
  initialPrescription?: Prescription | null;
}

interface ProposedChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export const PrescriptionForm: React.FC<Props> = ({ onPreview, initialPrescription }) => {
  const { 
    patients, 
    doctor, 
    activeClinic, 
    stagedVoiceData, 
    setStagedVoiceData, 
    startNewConsultation,
    savePrescription, 
    showToast,
    setCurrentPage 
  } = useApp();

  const [mode, setMode] = useState<'voice_review' | 'manual'>('manual');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Patient fields
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientAllergies, setPatientAllergies] = useState<string>('');

  // Clinical fields - ALL OPTIONAL, no fabricated defaults!
  const [symptoms, setSymptoms] = useState<string>('');
  const [durationOfSymptoms, setDurationOfSymptoms] = useState<string>('');
  const [clinicalFindings, setClinicalFindings] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [isDiagnosisConfirmed, setIsDiagnosisConfirmed] = useState<boolean>(false);
  const [consultationReport, setConsultationReport] = useState<string>('');
  const [showOriginalTranscript, setShowOriginalTranscript] = useState<boolean>(false);
  
  // Vitals - completely optional, empty strings by default
  const [bp, setBp] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [temp, setTemp] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');

  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [followUp, setFollowUp] = useState<string>('');

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Refine with AI state
  const [aiCorrectionText, setAiCorrectionText] = useState<string>('');
  const [isAiListening, setIsAiListening] = useState<boolean>(false);
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[] | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [backupDraft, setBackupDraft] = useState<any | null>(null);

  // Load from initial prescription or staged voice data
  useEffect(() => {
    if (initialPrescription) {
      setSelectedPatientId(initialPrescription.patientId);
      setPatientName(initialPrescription.patientName);
      setPatientAge(initialPrescription.patientAge);
      setPatientGender(initialPrescription.patientGender);
      setPatientPhone(initialPrescription.patientPhone || '');
      setSymptoms(initialPrescription.symptoms || '');
      setDurationOfSymptoms(initialPrescription.durationOfSymptoms || '');
      setClinicalFindings(initialPrescription.clinicalFindings || '');
      setDiagnosis(initialPrescription.diagnosis || '');
      setIsDiagnosisConfirmed(Boolean(initialPrescription.isDiagnosisConfirmed));
      setConsultationReport(initialPrescription.consultationReport || '');
      
      if (initialPrescription.vitals) {
        setBp(initialPrescription.vitals.bp || '');
        setPulse(initialPrescription.vitals.pulse || '');
        setTemp(initialPrescription.vitals.temp || '');
        setWeight(initialPrescription.vitals.weight || '');
        setSpo2(initialPrescription.vitals.spo2 || '');
      }
      setMedicines(initialPrescription.medicines || []);
      setAdvice(initialPrescription.advice || '');
      setFollowUp(initialPrescription.followUp || '');
      setMode(initialPrescription.source === 'voice' ? 'voice_review' : 'manual');
    } else if (stagedVoiceData) {
      setMode('voice_review');
      setPatientName(stagedVoiceData.patientName || '');
      setPatientAge(stagedVoiceData.patientAge || '');
      setPatientGender(stagedVoiceData.patientGender || 'Male');
      setPatientPhone(stagedVoiceData.patientPhone || '');
      setSymptoms(stagedVoiceData.symptoms || '');
      setDurationOfSymptoms(stagedVoiceData.durationOfSymptoms || '');
      setClinicalFindings(stagedVoiceData.clinicalFindings || '');
      setDiagnosis(stagedVoiceData.diagnosis || '');
      setIsDiagnosisConfirmed(Boolean(stagedVoiceData.isDiagnosisConfirmed));
      setConsultationReport(stagedVoiceData.consultationReport || '');
      
      // Check if patient matches registered patients
      const exactMatch = patients.find(p => p.name.toLowerCase() === (stagedVoiceData.patientName || '').toLowerCase());
      if (exactMatch) {
        setSelectedPatientId(exactMatch.id);
        if (!stagedVoiceData.patientPhone && exactMatch.phone) setPatientPhone(exactMatch.phone);
        setPatientAllergies(exactMatch.allergies);
      } else if (stagedVoiceData.patientId && (!stagedVoiceData.patientNameSuggestion || stagedVoiceData.patientNameSuggestion.toLowerCase() === (stagedVoiceData.patientName || '').toLowerCase())) {
        const idMatch = patients.find(p => p.id === stagedVoiceData.patientId);
        if (idMatch) {
          setSelectedPatientId(idMatch.id);
          if (!stagedVoiceData.patientPhone && idMatch.phone) setPatientPhone(idMatch.phone);
          setPatientAllergies(idMatch.allergies);
        }
      }

      if (stagedVoiceData.vitals) {
        setBp(stagedVoiceData.vitals.bp || '');
        setPulse(stagedVoiceData.vitals.pulse || '');
        setTemp(stagedVoiceData.vitals.temp || '');
        setSpo2(stagedVoiceData.vitals.spo2 || '');
        setWeight(stagedVoiceData.vitals.weight || '');
      }

      if (stagedVoiceData.medicines && stagedVoiceData.medicines.length > 0) {
        setMedicines(stagedVoiceData.medicines.map((m: any, idx: number) => ({
          ...m,
          id: `m-${Date.now()}-${idx}`
        })));
      } else {
        setMedicines([]);
      }

      setAdvice(stagedVoiceData.advice || '');
      setFollowUp(stagedVoiceData.followUp || '');
    } else {
      setMode('manual');
      if (medicines.length === 0) {
        handleAddMedicineRow();
      }
    }
  }, [initialPrescription, stagedVoiceData]);

  // When patient is selected from dropdown
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    if (!patientId) return;
    const p = patients.find(item => item.id === patientId);
    if (p) {
      setPatientName(p.name);
      setPatientAge(p.age);
      setPatientGender(p.gender);
      setPatientPhone(p.phone);
      setPatientAllergies(p.allergies);
      showToast(`Selected patient: ${p.name}`, 'info');
    }
  };

  // One-click confirmation for phonetically matched registered patient
  const handleConfirmSuggestedPatient = (suggestedName: string, suggestedId?: string) => {
    setPatientName(suggestedName);
    const matched = patients.find(p => (suggestedId && p.id === suggestedId) || p.name.toLowerCase() === suggestedName.toLowerCase());
    if (matched) {
      setSelectedPatientId(matched.id);
      if (matched.phone) setPatientPhone(matched.phone);
      if (matched.age) setPatientAge(matched.age);
      if (matched.gender) setPatientGender(matched.gender);
      if (matched.allergies) setPatientAllergies(matched.allergies);
      showToast(`Confirmed registered patient: ${matched.name}`, 'info');
    } else {
      showToast(`Updated patient name to "${suggestedName}"`, 'info');
    }
  };

  // Medicine management
  const handleAddMedicineRow = () => {
    const newMed: MedicineItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      strength: '',
      dosageForm: 'Tablet',
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
      route: 'Oral'
    };
    setMedicines(prev => [...prev, newMed]);
  };

  const handleUpdateMedicine = (id: string, field: keyof MedicineItem, value: any) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  // Missing Fields Validation (Only essentials required)
  const validateForm = () => {
    const warnings: string[] = [];
    if (!patientName.trim()) warnings.push('Patient Name is required');
    if (!patientAge) warnings.push('Patient Age is required');
    if (medicines.filter(m => m.name.trim() !== '').length === 0) {
      warnings.push('At least one medicine with a valid name must be added');
    }
    setValidationErrors(warnings);
    return warnings.length === 0;
  };

  const buildPrescriptionObject = (): Prescription => {
    // Only package vitals if at least one was recorded
    const hasVitals = bp || pulse || temp || weight || spo2;
    const vitalsObj = hasVitals ? {
      bp: bp || undefined,
      pulse: pulse || undefined,
      temp: temp || undefined,
      weight: weight || undefined,
      spo2: spo2 || undefined
    } : undefined;

    return {
      id: initialPrescription ? initialPrescription.id : `rx-${Date.now()}`,
      prescriptionNumber: initialPrescription ? initialPrescription.prescriptionNumber : `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      patientId: selectedPatientId || `pat-${Date.now()}`,
      patientName: patientName.trim(),
      patientAge: patientAge !== '' ? Number(patientAge) : 0,
      patientGender,
      patientPhone: patientPhone.trim() || undefined,
      clinicId: activeClinic.id,
      clinicName: activeClinic.name,
      clinicAddress: activeClinic.address,
      clinicPhone: activeClinic.phone,
      clinicLogoUrl: activeClinic.logoUrl,
      doctorName: doctor.fullName,
      doctorRegNo: doctor.regNumber,
      doctorQualification: doctor.qualification,
      symptoms: symptoms.trim(),
      durationOfSymptoms: durationOfSymptoms.trim() || undefined,
      clinicalFindings: clinicalFindings.trim(),
      diagnosis: diagnosis.trim() || undefined,
      isDiagnosisConfirmed,
      consultationReport: consultationReport.trim() || undefined,
      rawTranscript: (stagedVoiceData?.rawDictation || initialPrescription?.rawTranscript || '').trim() || undefined,
      vitals: vitalsObj,
      medicines: medicines.filter(m => m.name.trim() !== ''),
      advice: advice.trim(),
      followUp: followUp.trim(),
      status: 'confirmed',
      syncStatus: 'saved_on_device',
      createdAt: new Date().toISOString(),
      source: mode === 'voice_review' ? 'voice' : 'manual'
    };
  };

  const handlePreviewClick = () => {
    validateForm();
    const rx = buildPrescriptionObject();
    onPreview(rx);
  };

  const handleConfirmAndSave = () => {
    if (isSaving) return;
    if (!validateForm()) {
      showToast('Please complete patient name, age, and at least one medicine', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const rx = buildPrescriptionObject();
      savePrescription(rx);
      setStagedVoiceData(null);
      showToast(`Prescription ${rx.prescriptionNumber} confirmed & saved!`, 'success');
      onPreview(rx);
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  };

  // ----------------------------------------------------
  // Refine with AI: Voice/Text Prescription Corrections (Gemini AI + Fallback)
  // ----------------------------------------------------
  const handleApplyAiCorrection = async (instructionText?: string) => {
    const textToProcess = (instructionText || aiCorrectionText).trim();
    if (!textToProcess) {
      showToast('Please type or speak an AI correction instruction', 'warning');
      return;
    }

    // Save full backup draft for undo
    setBackupDraft({
      patientAge,
      patientName,
      patientGender,
      patientPhone,
      patientAllergies,
      bp,
      pulse,
      temp,
      weight,
      spo2,
      symptoms,
      durationOfSymptoms,
      clinicalFindings,
      diagnosis,
      advice,
      followUp,
      medicines: JSON.parse(JSON.stringify(medicines))
    });

    // Try backend Gemini AI endpoint
    try {
      const currentDraftPayload = {
        patient_name: patientName,
        patient_age: patientAge ? Number(patientAge) : undefined,
        patient_gender: patientGender,
        patient_phone: patientPhone,
        symptoms,
        duration_of_symptoms: durationOfSymptoms,
        clinical_findings: clinicalFindings,
        diagnosis,
        vitals: {
          bp: bp || undefined,
          pulse: pulse || undefined,
          temp: temp || undefined,
          weight: weight || undefined,
          spo2: spo2 || undefined
        },
        medicines: medicines.map(m => ({
          name: m.name,
          strength: m.strength,
          dosage_form: m.dosageForm,
          dose: m.dose,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        })),
        advice,
        follow_up: followUp
      };

      const aiResponse = await apiClient.refinePrescription(currentDraftPayload, textToProcess, 'en');
      if (aiResponse && aiResponse.changes && aiResponse.changes.length > 0) {
        const changes: ProposedChange[] = aiResponse.changes.map((c: any) => ({
          field: c.explanation || c.field,
          oldValue: String(c.original_value !== null && c.original_value !== undefined ? c.original_value : 'Empty'),
          newValue: String(c.proposed_value !== null && c.proposed_value !== undefined ? c.proposed_value : 'Updated')
        }));

        const prop = aiResponse.proposed_prescription || {};
        const fieldsToHighlight: string[] = [];

        // Apply proposed changes into active form fields
        if (prop.patient_age !== undefined && prop.patient_age !== null) {
          setPatientAge(prop.patient_age);
          fieldsToHighlight.push('age');
        } else if (prop.patientAge !== undefined && prop.patientAge !== null) {
          setPatientAge(prop.patientAge);
          fieldsToHighlight.push('age');
        }

        if (prop.patient_gender) {
          setPatientGender(prop.patient_gender);
        } else if (prop.patientGender) {
          setPatientGender(prop.patientGender);
        }

        if (prop.diagnosis) {
          setDiagnosis(prop.diagnosis);
          fieldsToHighlight.push('diagnosis');
        }

        if (prop.advice) {
          setAdvice(prop.advice);
          fieldsToHighlight.push('advice');
        }

        if (prop.follow_up || prop.followUp) {
          setFollowUp(prop.follow_up || prop.followUp);
          fieldsToHighlight.push('followUp');
        }

        if (prop.vitals) {
          if (prop.vitals.temp) setTemp(prop.vitals.temp.replace(/[^0-9.]/g, ''));
          if (prop.vitals.bp) setBp(prop.vitals.bp);
          if (prop.vitals.pulse) setPulse(prop.vitals.pulse);
          if (prop.vitals.weight) setWeight(prop.vitals.weight);
          if (prop.vitals.spo2) setSpo2(prop.vitals.spo2);
          fieldsToHighlight.push('vitals');
        }

        if (prop.medicines && Array.isArray(prop.medicines) && prop.medicines.length > 0) {
          setMedicines(prop.medicines.map((m: any, idx: number) => ({
            id: m.id || `med-${Date.now()}-${idx}`,
            name: m.name || '',
            strength: m.strength || '',
            dosageForm: m.dosage_form || m.dosageForm || 'Tablet',
            dose: m.dose || '',
            frequency: m.frequency || '',
            duration: m.duration || '',
            instructions: m.instructions || '',
            route: m.route || 'Oral'
          })));
          fieldsToHighlight.push('medicines');
        }

        setProposedChanges(changes);
        setHighlightedFields(fieldsToHighlight);
        setAiCorrectionText('');
        showToast(
          aiResponse.provider_used?.includes('gemini')
            ? `Gemini AI applied ${changes.length} proposed field adjustments for doctor review`
            : `AI applied ${changes.length} proposed field adjustments`,
          'info'
        );
        return;
      }
    } catch (err) {
      console.warn('Backend refinePrescription offline or failed, falling back to local regex engine', err);
    }

    // Resilient fallback: local regex rule engine
    const lower = textToProcess.toLowerCase();
    const changes: ProposedChange[] = [];
    const fieldsToHighlight: string[] = [];

    // 1. Age correction: e.g. "age 48", "age 45 nahi 48", "umar 48 saal"
    const ageMatch = lower.match(/(?:age|umar|years?|saal)\s*(?:ko|nahi)?\s*(\d{1,3})/i) || lower.match(/(\d{1,3})\s*(?:years?|saal|age)/i);
    if (ageMatch && ageMatch[1]) {
      const newAgeVal = parseInt(ageMatch[1], 10);
      if (newAgeVal > 0 && newAgeVal < 120 && newAgeVal !== patientAge) {
        changes.push({
          field: 'Patient Age',
          oldValue: `${patientAge || 'Empty'} Yrs`,
          newValue: `${newAgeVal} Yrs`
        });
        setPatientAge(newAgeVal);
        fieldsToHighlight.push('age');
      }
    }

    // 2. Temperature correction: e.g. "temperature 101.4", "bukhar 101"
    const tempMatch = lower.match(/(?:temperature|temp|bukhar|fever)\s*(?:add|kar do|is)?\s*(\d{2,3}(?:\.\d)?)/i);
    if (tempMatch && tempMatch[1]) {
      const newTemp = `${tempMatch[1]} °F`;
      changes.push({
        field: 'Vitals: Body Temperature',
        oldValue: temp ? `${temp} °F` : 'Not recorded',
        newValue: newTemp
      });
      setTemp(tempMatch[1]);
      fieldsToHighlight.push('vitals');
    }

    // 3. Medicine duration update: e.g. "paracetamol 5 days", "duration 5 din"
    if (lower.includes('duration') || lower.includes('days') || lower.includes('din')) {
      const durationMatch = lower.match(/(\d+)\s*(?:days?|din)/i);
      if (durationMatch && durationMatch[1]) {
        const newDuration = `${durationMatch[1]} Days`;
        setMedicines(prev => {
          const mentionedAnyMed = prev.some(m => m.name && lower.includes(m.name.toLowerCase()));
          return prev.map((m, idx) => {
            const matchesThis = Boolean(m.name && lower.includes(m.name.toLowerCase()));
            const fallbackMatch = !mentionedAnyMed && idx === 0;
            if (matchesThis || fallbackMatch) {
            changes.push({
              field: `${m.name || 'Medicine #1'} Duration`,
              oldValue: m.duration || 'Not set',
              newValue: newDuration
            });
            fieldsToHighlight.push('medicines');
            return { ...m, duration: newDuration };
          }
          return m;
        });
      });
      }
    }

    // 4. Adding Advice/Diet: e.g. "advice steam", "salt water gargles"
    if (lower.includes('advice') || lower.includes('salah') || lower.includes('steam') || lower.includes('gargle')) {
      const addedAdvice = lower.includes('steam') 
        ? 'Steam inhalation twice daily with tulsi leaves.' 
        : 'Drink warm water and salt-water gargle twice daily.';
      changes.push({
        field: 'General Dietary Advice',
        oldValue: advice ? advice : 'Empty',
        newValue: advice ? `${advice} · ${addedAdvice}` : addedAdvice
      });
      setAdvice(prev => prev ? `${prev} · ${addedAdvice}` : addedAdvice);
      fieldsToHighlight.push('advice');
    }

    if (changes.length === 0) {
      changes.push({
        field: 'Instruction Clarification',
        oldValue: textToProcess,
        newValue: 'No recognized numerical field modified. Please specify age, temperature, or medicine duration.'
      });
    }

    setProposedChanges(changes);
    setHighlightedFields(fieldsToHighlight);
    setAiCorrectionText('');
    showToast(`AI identified ${changes.length} proposed field adjustments`, 'info');
  };

  const handleAcceptAiChanges = () => {
    setProposedChanges(null);
    setHighlightedFields([]);
    setBackupDraft(null);
    showToast('AI proposed corrections accepted into draft', 'success');
  };

  const handleRejectAiChanges = () => {
    if (backupDraft) {
      setPatientAge(backupDraft.patientAge);
      setPatientName(backupDraft.patientName);
      if (backupDraft.patientGender) setPatientGender(backupDraft.patientGender);
      if (backupDraft.patientPhone) setPatientPhone(backupDraft.patientPhone);
      if (backupDraft.patientAllergies) setPatientAllergies(backupDraft.patientAllergies);
      setBp(backupDraft.bp);
      setPulse(backupDraft.pulse);
      setTemp(backupDraft.temp);
      if (backupDraft.weight) setWeight(backupDraft.weight);
      if (backupDraft.spo2) setSpo2(backupDraft.spo2);
      setSymptoms(backupDraft.symptoms);
      if (backupDraft.durationOfSymptoms) setDurationOfSymptoms(backupDraft.durationOfSymptoms);
      if (backupDraft.clinicalFindings) setClinicalFindings(backupDraft.clinicalFindings);
      if (backupDraft.diagnosis) setDiagnosis(backupDraft.diagnosis);
      setAdvice(backupDraft.advice);
      setFollowUp(backupDraft.followUp);
      setMedicines(backupDraft.medicines);
    }
    setProposedChanges(null);
    setHighlightedFields([]);
    setBackupDraft(null);
    showToast('Proposed AI adjustments reverted', 'info');
  };

  // Simulated or Web Speech microphone input for AI correction
  const handleToggleVoiceCorrection = () => {
    if (isAiListening) {
      setIsAiListening(false);
      return;
    }

    setIsAiListening(true);
    showToast('Listening for correction instruction...', 'info');

    // If browser supports SpeechRecognition, use it
    if (speechService.isBrowserSpeechSupported()) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const rec = new SpeechRecognition();
          rec.lang = 'en-IN';
          rec.onresult = (e: any) => {
            const captured = e.results[0][0].transcript;
            setAiCorrectionText(captured);
            setIsAiListening(false);
            handleApplyAiCorrection(captured);
          };
          rec.onerror = () => setIsAiListening(false);
          rec.start();
          return;
        }
      } catch (e) {
        // Fallback below
      }
    }

    // Fallback simulation after 2 seconds
    setTimeout(() => {
      setIsAiListening(false);
      const sampleText = 'Patient ki age 45 nahi, 48 years kar do. Temperature 101.4 F add karo.';
      setAiCorrectionText(sampleText);
      handleApplyAiCorrection(sampleText);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Mode Switcher Banner */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: mode === 'voice_review' ? 'var(--ai-violet-light)' : 'var(--bg-card-subtle)',
              color: mode === 'voice_review' ? 'var(--ai-violet)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {mode === 'voice_review' ? <Sparkles size={16} /> : <Edit size={16} />}
            <span>{mode === 'voice_review' ? 'AI Voice Dictation Review' : 'Manual Entry Mode'}</span>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {mode === 'voice_review' 
              ? 'Organized from speech. Doctor must verify all clinical values before confirming.'
              : 'Direct manual structured prescription entry.'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => startNewConsultation('prescriptions')}
            className="btn btn-secondary btn-sm"
            title="Start fresh consultation without previous data"
          >
            <RotateCcw size={14} />
            <span>New Consultation</span>
          </button>

          {(mode === 'voice_review' || stagedVoiceData?.rawDictation) && (
            <button
              type="button"
              onClick={() => setCurrentPage('home')}
              className="btn btn-secondary btn-sm"
              title="Return to voice dictation to edit speech transcript"
            >
              <Mic size={14} />
              <span>Edit Transcript</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === 'voice_review' ? 'manual' : 'voice_review')}
            className="btn btn-secondary btn-sm"
          >
            Switch to {mode === 'voice_review' ? 'Manual Mode' : 'Voice Review Mode'}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: REFINE WITH AI (Voice & Text Corrections) */}
      {/* ---------------------------------------------------- */}
      <div 
        className="card" 
        style={{
          border: '1.5px solid var(--ai-violet)',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.12)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'var(--ai-violet)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Refine with AI (Voice & Natural Language Corrections)
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Speak or type natural corrections in Hindi or English without re-typing each field.
              </p>
            </div>
          </div>

          <span 
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card-subtle)',
              color: 'var(--ai-violet)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            Demo AI Correction Assistant
          </span>
        </div>

        {/* Natural Language Correction Input Bar */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
          {/* Mic Button for Voice Correction */}
          <button
            type="button"
            onClick={handleToggleVoiceCorrection}
            className={`btn ${isAiListening ? 'btn-danger' : 'btn-secondary'}`}
            style={{ flexShrink: 0, padding: '0.6rem 0.9rem' }}
            title="Speak correction instruction"
          >
            <Mic size={16} className={isAiListening ? 'mic-listening-pulse' : ''} />
            <span style={{ fontSize: '0.82rem' }}>{isAiListening ? 'Listening...' : 'Speak'}</span>
          </button>

          {/* Text Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g. 'Patient age 48 kar do', 'Add temp 101.4 F', 'Change Paracetamol to 5 days'..."
              value={aiCorrectionText}
              onChange={(e) => setAiCorrectionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyAiCorrection();
                }
              }}
              style={{ width: '100%', fontSize: '0.86rem', padding: '0.6rem 0.85rem' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={() => handleApplyAiCorrection()}
            className="btn btn-ai"
            style={{ flexShrink: 0, padding: '0.6rem 1.1rem' }}
          >
            <Send size={15} />
            <span>Apply</span>
          </button>
        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick corrections:</span>
          {[
            'Change patient age to 48',
            'Add temperature 101.4 °F',
            'Change Paracetamol duration to 5 days',
            'Add steam inhalation to advice'
          ].map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => handleApplyAiCorrection(chip)}
              style={{
                fontSize: '0.73rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              + {chip}
            </button>
          ))}
        </div>

        {/* Proposed Changes Review Box (Doctor must review & accept) */}
        {proposedChanges && (
          <div 
            style={{
              marginTop: '12px',
              padding: '12px 14px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.86rem', color: 'var(--ai-violet)' }}>
                <Sparkles size={16} />
                <span>Proposed AI Modifications (Review Required Before Acceptance):</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRejectAiChanges}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <X size={14} />
                  <span>Reject & Revert</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAiChanges}
                  className="btn btn-ai btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Check size={14} />
                  <span>Accept Changes</span>
                </button>
              </div>
            </div>

            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              {proposedChanges.map((c, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>
                  <strong>{c.field}:</strong> <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{c.oldValue}</span> → <strong style={{ color: 'var(--ai-violet)' }}>{c.newValue}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Missing or Incomplete Fields Warning */}
      {validationErrors.length > 0 && (
        <div 
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
            <AlertTriangle size={15} />
            <span>Essential Missing Fields:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Patient Information Section */}
      <div 
        className="card"
        style={{
          border: highlightedFields.includes('age') ? '2px solid var(--ai-violet)' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="var(--primary-navy)" />
            <span>Patient Information</span>
            {highlightedFields.includes('age') && (
              <span className="badge" style={{ background: 'var(--ai-violet)', color: '#FFFFFF', fontSize: '0.68rem' }}>
                AI Modified
              </span>
            )}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Quick Select:
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handleSelectPatient(e.target.value)}
              style={{ fontSize: '0.84rem', padding: '4px 10px' }}
            >
              <option value="">-- Choose Registered Patient --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId} · {p.age}y/{p.gender})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Patient Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              style={{ width: '100%' }}
            />
            {stagedVoiceData?.patientNameSuggestion && stagedVoiceData.patientNameSuggestion.toLowerCase() !== (patientName || '').toLowerCase() && (
              <div 
                style={{
                  marginTop: '6px',
                  padding: '6px 10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#fbbf24'
                }}
              >
                <span>
                  Matches registered: <strong>"{stagedVoiceData.patientNameSuggestion}"</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleConfirmSuggestedPatient(stagedVoiceData.patientNameSuggestion, stagedVoiceData.patientId)}
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Use "{stagedVoiceData.patientNameSuggestion}"
                </button>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Age (Years) *
            </label>
            <input
              type="number"
              placeholder="45"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ 
                width: '100%', 
                borderColor: highlightedFields.includes('age') ? 'var(--ai-violet)' : undefined,
                boxShadow: highlightedFields.includes('age') ? '0 0 0 3px rgba(139, 92, 246, 0.2)' : undefined
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Gender
            </label>
            <select
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value as any)}
              style={{ width: '100%' }}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Contact Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {patientAllergies && patientAllergies.toLowerCase() !== 'none reported' && (
          <div 
            style={{
              marginTop: '1rem',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.82rem'
            }}
          >
            <AlertCircle size={15} color="#EF4444" />
            <strong style={{ color: '#EF4444' }}>Known Drug Allergy:</strong>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{patientAllergies}</span>
          </div>
        )}
      </div>

      {/* SECTION A: Patient-Reported Complaints */}
      <div 
        className="card"
        style={{
          border: highlightedFields.includes('symptoms') ? '2px solid var(--ai-violet)' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--primary-navy)" />
              <span>A. Patient-Reported Complaints</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Subjective complaints and duration as reported by the patient. Labelled as patient-reported information, not confirmed clinical findings.
            </span>
          </div>
          <span 
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#2563EB',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}
          >
            Patient-Reported (Subjective)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Patient's Reported Symptoms & Complaints
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Fever for 2 days, sore throat, cough, body ache as described by the patient..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Duration of Symptoms (Patient Reported)
            </label>
            <input
              type="text"
              placeholder="e.g. 2 days, 1 week, since yesterday..."
              value={durationOfSymptoms}
              onChange={(e) => setDurationOfSymptoms(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* SECTION B: Doctor's Clinical Findings & Measured Vitals */}
      <div 
        className="card"
        style={{
          border: highlightedFields.includes('vitals') || highlightedFields.includes('findings') ? '2px solid var(--ai-violet)' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={18} color="var(--primary-navy)" />
              <span>B. Doctor's Clinical Findings & Vitals</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Physical examination findings and measured vitals explicitly entered by doctor. Never invent vital signs.
            </span>
          </div>
          <span 
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            Doctor Examination (Objective)
          </span>
        </div>

        {/* Vitals row - Strictly Optional */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              BP (mmHg)
            </label>
            <input
              type="text"
              placeholder="e.g. 120/80"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Pulse (bpm)
            </label>
            <input
              type="text"
              placeholder="e.g. 76"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Temp (°F)
            </label>
            <input
              type="text"
              placeholder="e.g. 98.6"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              style={{ 
                width: '100%', 
                fontSize: '0.85rem', 
                padding: '6px 8px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              SpO2 (%)
            </label>
            <input
              type="text"
              placeholder="e.g. 98"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>
              Weight (kg)
            </label>
            <input
              type="text"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              style={{ width: '100%', fontSize: '0.85rem', padding: '6px 8px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Doctor's Physical Examination & Clinical Observations
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Throat erythematous, tonsils mildly enlarged, bilateral chest clear on auscultation, abdomen soft..."
            value={clinicalFindings}
            onChange={(e) => setClinicalFindings(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      </div>

      {/* SECTION C: Doctor-Confirmed Diagnosis or Assessment */}
      <div 
        className="card"
        style={{
          border: isDiagnosisConfirmed ? '1.5px solid #10B981' : '1px solid var(--border-subtle)',
          background: isDiagnosisConfirmed ? 'rgba(16, 185, 129, 0.02)' : 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck2 size={18} color={isDiagnosisConfirmed ? '#10B981' : 'var(--primary-navy)'} />
              <span>C. Doctor's Clinical Diagnosis & Assessment</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              AI never independently diagnoses patients. A confirmed diagnosis appears only when explicitly confirmed by the doctor.
            </span>
          </div>

          {/* Status Badge */}
          {diagnosis.trim() ? (
            isDiagnosisConfirmed ? (
              <span 
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={13} />
                <span>Doctor-Confirmed Diagnosis</span>
              </span>
            ) : (
              <span 
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertTriangle size={13} />
                <span>Provisional Assessment (Unconfirmed)</span>
              </span>
            )
          ) : (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              No diagnosis entered
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="e.g. Acute Tonsillopharyngitis, Viral URI, Essential Hypertension..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            style={{ width: '100%', fontSize: '0.92rem', fontWeight: 600 }}
          />

          {diagnosis && (
            <button
              type="button"
              onClick={() => { setDiagnosis(''); setIsDiagnosisConfirmed(false); }}
              className="btn btn-secondary btn-sm"
              title="Remove diagnosis"
            >
              <Trash2 size={14} color="#EF4444" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Doctor Confirmation Checkbox Toggle */}
        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={isDiagnosisConfirmed}
              onChange={(e) => setIsDiagnosisConfirmed(e.target.checked)}
              style={{ width: '17px', height: '17px', cursor: 'pointer' }}
            />
            <span>I have examined the patient and explicitly confirm this diagnosis</span>
          </label>

          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {!isDiagnosisConfirmed && diagnosis.trim() ? '* Will be printed/saved as Provisional Assessment' : ''}
          </span>
        </div>
      </div>

      {/* Structured Medicines Table */}
      <div 
        className="card"
        style={{
          border: highlightedFields.includes('medicines') ? '2px solid var(--ai-violet)' : undefined
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Prescribed Medicines (Rx)</span>
              {highlightedFields.includes('medicines') && (
                <span className="badge" style={{ background: 'var(--ai-violet)', color: '#FFFFFF', fontSize: '0.68rem' }}>
                  AI Modified
                </span>
              )}
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Add, edit, or adjust dosages, frequencies, and instructions.
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddMedicineRow}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={15} />
            <span>Add Medicine</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', minWidth: '150px' }}>Medicine Name *</th>
                <th style={{ padding: '8px 10px', width: '90px' }}>Type</th>
                <th style={{ padding: '8px 10px', width: '90px' }}>Strength</th>
                <th style={{ padding: '8px 10px', width: '80px' }}>Dose</th>
                <th style={{ padding: '8px 10px', minWidth: '150px' }}>Frequency *</th>
                <th style={{ padding: '8px 10px', width: '95px' }}>Duration</th>
                <th style={{ padding: '8px 10px', minWidth: '150px' }}>Instructions</th>
                <th style={{ padding: '8px 10px', width: '40px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(med.id, 'name', e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.84rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <select
                      value={med.dosageForm}
                      onChange={(e) => handleUpdateMedicine(med.id, 'dosageForm', e.target.value as DosageForm)}
                      style={{ width: '100%', padding: '5px 6px', fontSize: '0.82rem' }}
                    >
                      <option value="Tablet">Tab</option>
                      <option value="Capsule">Cap</option>
                      <option value="Syrup">Syr</option>
                      <option value="Injection">Inj</option>
                      <option value="Drops">Drops</option>
                      <option value="Ointment">Oint</option>
                    </select>
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="650 mg"
                      value={med.strength}
                      onChange={(e) => handleUpdateMedicine(med.id, 'strength', e.target.value)}
                      style={{ width: '100%', padding: '5px 6px', fontSize: '0.82rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="1 Tab"
                      value={med.dose}
                      onChange={(e) => handleUpdateMedicine(med.id, 'dose', e.target.value)}
                      style={{ width: '100%', padding: '5px 6px', fontSize: '0.82rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="1-0-1 (After Food)"
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedicine(med.id, 'frequency', e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="5 Days"
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(med.id, 'duration', e.target.value)}
                      style={{ width: '100%', padding: '5px 6px', fontSize: '0.82rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px' }}>
                    <input
                      type="text"
                      placeholder="Take with warm water"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMedicine(med.id, 'instructions', e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', fontSize: '0.82rem' }}
                    />
                  </td>

                  <td style={{ padding: '6px 6px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(med.id)}
                      title="Remove medicine"
                      style={{ padding: '6px', color: '#EF4444', borderRadius: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Advice and Follow-up Details */}
      <div 
        className="card"
        style={{
          border: highlightedFields.includes('advice') ? '2px solid var(--ai-violet)' : undefined
        }}
      >
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Dietary Advice & Follow-Up (Optional)</span>
          {highlightedFields.includes('advice') && (
            <span className="badge" style={{ background: 'var(--ai-violet)', color: '#FFFFFF', fontSize: '0.68rem' }}>
              AI Modified
            </span>
          )}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              General Advice & Dietary Guidelines
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Plenty of warm fluids, rest, salt water gargles..."
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Follow-Up OPD Visit Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Review in OPD after 4 days or SOS..."
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* SECTION E: AI-Generated Consultation Report (Editable) */}
      <div 
        className="card"
        style={{
          border: '1.5px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--ai-violet)" />
              <span>E. AI-Generated Consultation Report (Editable)</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Comprehensive clinical summary keeping complaints, findings, vitals, diagnosis, and treatment distinct.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const lines: string[] = [];
              lines.push(`1. Patient-Reported Complaints: ${symptoms.trim() || 'None recorded'}${durationOfSymptoms.trim() ? ` (Duration: ${durationOfSymptoms.trim()})` : ''}`);
              lines.push(`2. Doctor Examination Findings: ${clinicalFindings.trim() || 'No explicit findings entered'}`);
              const vList = [];
              if (bp) vList.push(`BP: ${bp}`);
              if (pulse) vList.push(`Pulse: ${pulse} bpm`);
              if (temp) vList.push(`Temp: ${temp} °F`);
              if (spo2) vList.push(`SpO2: ${spo2}%`);
              if (weight) vList.push(`Weight: ${weight} kg`);
              lines.push(`3. Actual Recorded Vitals: ${vList.length > 0 ? vList.join(', ') : 'None measured/recorded (strictly optional)'}`);
              if (diagnosis.trim()) {
                lines.push(`4. Doctor Assessment: ${diagnosis.trim()} [${isDiagnosisConfirmed ? 'CONFIRMED BY DOCTOR' : 'PROVISIONAL / UNCONFIRMED'}]`);
              } else {
                lines.push('4. Doctor Assessment: No diagnosis confirmed');
              }
              const validMeds = medicines.filter(m => m.name.trim());
              if (validMeds.length > 0) {
                lines.push(`5. Prescribed Treatment & Medicines: ${validMeds.map(m => `${m.name} ${m.strength || ''} (${m.frequency}, ${m.duration})`).join('; ')}`);
              } else {
                lines.push('5. Prescribed Treatment & Medicines: None entered');
              }
              if (advice.trim()) lines.push(`6. General Advice: ${advice.trim()}`);
              if (followUp.trim()) lines.push(`7. Follow-Up: ${followUp.trim()}`);
              setConsultationReport(lines.join('\n\n'));
              showToast('Consultation report regenerated from current fields', 'info');
            }}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={14} />
            <span>Regenerate Summary</span>
          </button>
        </div>

        <textarea
          rows={6}
          placeholder="Consultation summary will appear here. The doctor must review, edit, and approve before confirming..."
          value={consultationReport}
          onChange={(e) => setConsultationReport(e.target.value)}
          style={{
            width: '100%',
            fontFamily: 'inherit',
            fontSize: '0.86rem',
            lineHeight: 1.6,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            boxSizing: 'border-box'
          }}
        />
        <span style={{ display: 'block', marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          * Preserves distinction between subjective complaints and objective findings. Doctor must verify all values before saving.
        </span>
      </div>

      {/* Original Voice Dictation Transcript Reference Box */}
      {(stagedVoiceData?.rawDictation || initialPrescription?.rawTranscript) && (
        <div 
          className="card"
          style={{
            background: 'var(--bg-card-subtle)',
            border: '1px dashed var(--border-subtle)'
          }}
        >
          <div 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setShowOriginalTranscript(!showOriginalTranscript)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mic size={16} color="var(--ai-violet)" />
              <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                Original Voice Dictation Transcript (Clinical Reference)
              </strong>
            </div>
            <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showOriginalTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showOriginalTranscript && (
            <p style={{ marginTop: '10px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)', margin: '10px 0 0 0' }}>
              {stagedVoiceData?.rawDictation || initialPrescription?.rawTranscript}
            </p>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '1rem 0',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={handlePreviewClick}
          className="btn btn-secondary"
        >
          <Eye size={17} />
          <span>Preview Prescription</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmAndSave}
          disabled={isSaving}
          className="btn btn-ai"
          style={{ padding: '0.65rem 1.6rem' }}
        >
          <CheckCircle2 size={18} />
          <span>{isSaving ? 'Saving...' : 'Confirm & Save Prescription'}</span>
        </button>
      </div>
    </div>
  );
};

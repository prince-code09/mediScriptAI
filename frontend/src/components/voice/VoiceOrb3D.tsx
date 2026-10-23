import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { VoiceAssistantState, Language } from '../../types';
import { speechService } from '../../services/speechService';
import { apiClient } from '../../services/apiClient';
import { 
  Mic, 
  MicOff, 
  Square, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Languages,
  Edit,
  Radio,
  FileText
} from 'lucide-react';
import '../../styles/orb.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

// Deterministic phonetic clinical speech normalization
const normalizeClinicalSpeech = (text: string): string => {
  return text
    // Normalize frequency abbreviations from speech
    .replace(/\b1\s+0\s+1\b/gi, '1-0-1')
    .replace(/\b1\s+0\s+0\b/gi, '1-0-0')
    .replace(/\b0\s+0\s+1\b/gi, '0-0-1')
    .replace(/\b1\s+1\s+1\b/gi, '1-1-1')
    .replace(/\bb\s+d\b/gi, 'BD')
    .replace(/\bo\s+d\b/gi, 'OD')
    .replace(/\bt\s+d\s+s\b/gi, 'TDS')
    .replace(/\bh\s+s\b/gi, 'HS')
    .replace(/\bs\s+o\s+s\b/gi, 'SOS')
    // Fix phonetic mishearings of Indian medicines without inventing words
    .replace(/\b(?:parasita\s*mol|parasite\s*amol|parasitamaal|paracitmol|paracitamol)\b/gi, 'Paracetamol')
    .replace(/\b(?:azithro\s*mycin|azithromicin)\b/gi, 'Azithromycin')
    .replace(/\b(?:panto\s*prazole|pantaprazole)\b/gi, 'Pantoprazole')
    .replace(/\b(?:amoxycillin|amoxicilin)\b/gi, 'Amoxicillin')
    .replace(/\b(?:cetrizine|cetzine|citrizine)\b/gi, 'Cetirizine')
    .replace(/\b(?:levocetrizine|montek\s*lc)\b/gi, 'Levocetirizine + Montelukast')
    .replace(/\b(?:cop\s*syrup|cup\s*syrup|cough\s*syrop)\b/gi, 'Cough Syrup')
    // Standardize BP formatting
    .replace(/\b(?:bp|blood\s*pressure)\s*(\d{2,3})\s*(?:by|over|\/)\s*(\d{2,3})\b/gi, 'BP $1/$2 mmHg');
};

export const VoiceOrb3D: React.FC = () => {
  const { setCurrentPage, stagedVoiceData, setStagedVoiceData, startNewConsultation, showToast, patients } = useApp();
  
  const [voiceState, setVoiceState] = useState<VoiceAssistantState>('idle');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  // Preserve edits if returning from prescription view
  const [speechText, setSpeechText] = useState<string>(() => stagedVoiceData?.rawDictation || '');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [parsingProvider, setParsingProvider] = useState<string>('');
  
  const parsedVoiceResultRef = useRef<any | null>(null);
  const speechTextRef = useRef<string>(stagedVoiceData?.rawDictation || '');
  const sessionBaseTextRef = useRef<string>(stagedVoiceData?.rawDictation || '');
  const isListeningRef = useRef<boolean>(false);
  const isActionPendingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio Context for real mic amplitude driving the luminous waveform
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const micAmplitudeRef = useRef<number>(0);

  // Sync back if stagedVoiceData changes externally (or clear on new consultation)
  useEffect(() => {
    if (stagedVoiceData?.rawDictation) {
      setSpeechText(stagedVoiceData.rawDictation);
      speechTextRef.current = stagedVoiceData.rawDictation;
      sessionBaseTextRef.current = stagedVoiceData.rawDictation;
    } else if (stagedVoiceData === null) {
      // Clean slate for new consultation: never append old speech
      setSpeechText('');
      speechTextRef.current = '';
      sessionBaseTextRef.current = '';
      parsedVoiceResultRef.current = null;
    }
  }, [stagedVoiceData]);

  // Handle timer during listening
  useEffect(() => {
    if (voiceState === 'listening') {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [voiceState]);

  // Clean up Audio on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Canvas Luminous Waveform & Particle Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = 440);
    let height = (canvas.height = 440);
    const centerX = width / 2;
    const centerY = height / 2;
    const orbRadius = width / 2 - 20;

    // Initialize floating glowing particles inside sphere
    const particleColors = ['#38BDF8', '#22D3EE', '#8B5CF6', '#C084FC'];
    const particles: Particle[] = Array.from({ length: 24 }, () => ({
      x: centerX + (Math.random() - 0.5) * orbRadius * 1.2,
      y: centerY + (Math.random() - 0.5) * orbRadius * 1.2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1.2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      alpha: Math.random() * 0.6 + 0.3
    }));

    let phase = 0;
    const dataArray = new Uint8Array(32);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Measure real mic amplitude if listening with audio stream
      let currentAmp = 0.15;
      if (analyserRef.current && voiceState === 'listening') {
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        micAmplitudeRef.current = Math.min(1.0, avg / 70);
        currentAmp = 0.35 + micAmplitudeRef.current * 0.65;
      } else if (voiceState === 'listening') {
        currentAmp = 0.45 + Math.sin(phase * 3) * 0.25;
      } else if (voiceState === 'processing') {
        currentAmp = 0.3 + Math.sin(phase * 5) * 0.15;
      } else if (voiceState === 'ready_for_review') {
        currentAmp = 0.2;
      }

      phase += voiceState === 'listening' ? 0.05 : voiceState === 'processing' ? 0.07 : 0.02;

      // Draw spherical clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.clip();

      // Soft radial background glow inside sphere
      const bgGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, orbRadius);
      if (voiceState === 'listening') {
        bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        bgGlow.addColorStop(0.6, 'rgba(139, 92, 246, 0.15)');
        bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0.5)');
      } else if (voiceState === 'processing') {
        bgGlow.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
        bgGlow.addColorStop(0.6, 'rgba(139, 92, 246, 0.15)');
        bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0.5)');
      } else if (voiceState === 'ready_for_review') {
        bgGlow.addColorStop(0, 'rgba(45, 212, 191, 0.25)');
        bgGlow.addColorStop(0.7, 'rgba(20, 184, 166, 0.1)');
        bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0.5)');
      } else {
        bgGlow.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
        bgGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
        bgGlow.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
      }
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Render Floating Luminous Particles
      particles.forEach(p => {
        p.x += p.vx * (voiceState === 'listening' ? 1.8 : 1);
        p.y += p.vy * (voiceState === 'listening' ? 1.8 : 1);

        // Keep inside circular boundary
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > orbRadius - 10) {
          p.vx = -p.vx;
          p.vy = -p.vy;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1.0;

      // Draw Flowing Electric Sine Waves
      const waves = [
        { color: '#38BDF8', freq: 0.015, speed: 1.0, ampMult: 45, yOffset: 0, lineWidth: 2.8 },
        { color: '#22D3EE', freq: 0.022, speed: -1.2, ampMult: 35, yOffset: -8, lineWidth: 2.2 },
        { color: '#8B5CF6', freq: 0.018, speed: 1.4, ampMult: 40, yOffset: 8, lineWidth: 2.5 },
        { color: '#C084FC', freq: 0.028, speed: -0.9, ampMult: 25, yOffset: 4, lineWidth: 1.8 }
      ];

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.lineWidth = wave.lineWidth;
        ctx.strokeStyle = wave.color;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = voiceState === 'listening' ? 14 : 7;

        for (let x = 0; x <= width; x += 3) {
          const normX = (x - centerX) / orbRadius;
          const edgeDamp = Math.max(0, 1 - normX * normX);
          const y =
            centerY +
            wave.yOffset +
            Math.sin(x * wave.freq + phase * wave.speed) *
              wave.ampMult *
              currentAmp *
              edgeDamp;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [voiceState]);

  // Start Actual Microphone Speech Recognition (NO Demo Simulation)
  const handleStartListening = async () => {
    if (isActionPendingRef.current || isListeningRef.current || voiceState === 'processing') return;
    isActionPendingRef.current = true;
    setMicPermissionGranted(true);
    setErrorMessage('');

    // Check browser speech recognition support
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      isActionPendingRef.current = false;
      setVoiceState('error');
      setMicPermissionGranted(false);
      setErrorMessage('Speech recognition is not supported in this browser. Live microphone requires Google Chrome, Microsoft Edge, or Safari. You can still type directly in the editable transcript box below.');
      showToast('Speech recognition unsupported in current browser. Use editable transcript or manual entry.', 'warning');
      return;
    }

    // Acquire microphone audio stream for real-time waveform reactivity
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      }
    } catch (err: any) {
      isActionPendingRef.current = false;
      console.warn('Microphone permission denied or device error:', err);
      setVoiceState('error');
      setMicPermissionGranted(false);
      setErrorMessage('Microphone permission was denied. Please allow microphone access in your browser address bar to dictate consultations.');
      showToast('Microphone access denied. Please check permissions.', 'error');
      return;
    }

    // Initialize real browser SpeechRecognition
    try {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';

      // Initialize base text from current textarea/ref to prevent dropping or duplicating
      const currentRaw = (speechTextRef.current || speechText).trim();
      sessionBaseTextRef.current = currentRaw ? currentRaw + ' ' : '';

      rec.onresult = (e: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < e.results.length; i++) {
          const item = e.results[i];
          if (!item || !item[0]) continue;
          const chunk = item[0].transcript || '';
          if (item.isFinal) {
            sessionFinal += chunk + ' ';
          } else {
            sessionInterim += chunk;
          }
        }

        const fullCurrent = (sessionBaseTextRef.current + sessionFinal + sessionInterim).trim();
        if (fullCurrent) {
          speechTextRef.current = fullCurrent;
          setSpeechText(fullCurrent);
        }
      };

      rec.onerror = (err: any) => {
        console.warn('SpeechRecognition event error:', err);
        if (err.error === 'no-speech') {
          // Normal silence detection from browser engine; continue listening smoothly
          return;
        }
        if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
          isListeningRef.current = false;
          setVoiceState('error');
          setMicPermissionGranted(false);
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
          showToast('Microphone access denied', 'error');
        } else if (err.error === 'network') {
          console.warn('SpeechRecognition network notice; preserved transcript.');
        }
      };

      rec.onend = () => {
        // Continuous listening: seamlessly restart if user hasn't explicitly clicked stop
        if (isListeningRef.current) {
          // Commit finalized session text into base so restart continues cleanly without duplicates
          const currentText = (speechTextRef.current || speechText).trim();
          sessionBaseTextRef.current = currentText ? currentText + ' ' : '';
          try {
            rec.start();
          } catch (e) {
            // Already started or busy
          }
        }
      };

      rec.start();
      recognitionRef.current = rec;
      isListeningRef.current = true;
      setVoiceState('listening');
    } catch (err: any) {
      console.error('SpeechRecognition start failed:', err);
      isListeningRef.current = false;
      setVoiceState('error');
      setErrorMessage('Could not activate speech recognition service. You can type clinical notes manually below.');
    } finally {
      isActionPendingRef.current = false;
    }
  };

  // Stop Listening & Automatically Process Transcript into Prescription Draft
  const handleStopListening = async () => {
    if (isActionPendingRef.current || voiceState === 'processing') return;
    isActionPendingRef.current = true;
    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const text = (speechTextRef.current || speechText).trim();
    if (!text) {
      setVoiceState('idle');
      showToast('No speech was detected. Click the sphere to start speaking or use manual entry.', 'info');
      isActionPendingRef.current = false;
      return;
    }

    // Clean up transcript phonetics deterministically before extraction
    const cleanedText = normalizeClinicalSpeech(text);
    speechTextRef.current = cleanedText;
    setSpeechText(cleanedText);

    // Direct one-click doctor workflow: automatically organize speech and open editable prescription draft
    try {
      await handleProcessAndNavigate(cleanedText);
    } finally {
      isActionPendingRef.current = false;
    }
  };

  // Stop Recording but stay on Voice page to let doctor review or edit transcript first
  const handleStopToEditTranscript = () => {
    if (isActionPendingRef.current) return;
    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setVoiceState('idle');
    const text = (speechTextRef.current || speechText).trim();
    if (text) {
      const cleaned = normalizeClinicalSpeech(text);
      speechTextRef.current = cleaned;
      setSpeechText(cleaned);
      showToast('Recording finished! Transcript is ready for review or editing below.', 'info');
    }
  };

  // Process transcript with Gemini AI and navigate directly to prescription review
  const handleProcessAndNavigate = async (textToProcess?: string) => {
    const text = (textToProcess !== undefined ? textToProcess : (speechTextRef.current || speechText)).trim();
    if (!text) {
      showToast('Please speak or type consultation notes in the transcript box first.', 'warning');
      return;
    }

    // Stop active mic if running
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setVoiceState('processing');

    try {
      const knownPatients = (patients || []).map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        age: p.age,
        gender: p.gender
      }));

      // Call backend Gemini AI endpoint with the latest transcript and known registered patients
      const aiResponse = await apiClient.parseSpeech(text, selectedLang, knownPatients);
      if (aiResponse && aiResponse.extracted_data) {
        const ed = aiResponse.extracted_data;
        const normalized = {
          patientName: ed.patient_name || '',
          patientNameSuggestion: ed.patient_name_suggestion || '',
          patientId: ed.patient_id || '',
          patientAge: ed.patient_age !== undefined && ed.patient_age !== null ? ed.patient_age : '',
          patientGender: ed.patient_gender || 'Male',
          patientPhone: ed.patient_phone || '',
          symptoms: ed.symptoms || '',
          durationOfSymptoms: ed.duration_of_symptoms || '',
          clinicalFindings: ed.clinical_findings || '',
          diagnosis: ed.diagnosis || '',
          isDiagnosisConfirmed: Boolean(ed.is_diagnosis_confirmed),
          consultationReport: ed.consultation_report || '',
          vitals: ed.vitals ? {
            bp: ed.vitals.bp || '',
            pulse: ed.vitals.pulse || '',
            temp: ed.vitals.temp || '',
            weight: ed.vitals.weight || '',
            spo2: ed.vitals.spo2 || ''
          } : undefined,
          medicines: (ed.medicines && ed.medicines.length > 0) ? ed.medicines.map((m: any, idx: number) => ({
            id: `med-${Date.now()}-${idx}`,
            name: m.name || '',
            strength: m.strength || '',
            dosageForm: m.dosage_form || m.dosageForm || 'Tablet',
            dose: m.dose || '',
            frequency: m.frequency || '',
            duration: m.duration || '',
            instructions: m.instructions || '',
            route: m.route || 'Oral'
          })) : [],
          advice: ed.advice || '',
          followUp: ed.follow_up || '',
          rawDictation: text,
          source: 'voice' as const,
          language: selectedLang,
          confidenceFlags: aiResponse.confidence_flags || [],
          ambiguities: aiResponse.ambiguities || [],
          providerUsed: aiResponse.provider_used || 'gemini',
          processingTimeMs: aiResponse.processing_time_ms
        };

        setStagedVoiceData(normalized);
        setVoiceState('idle');
        showToast(
          aiResponse.provider_used?.includes('gemini')
            ? `Prescription draft generated with Gemini AI (${aiResponse.processing_time_ms ? Math.round(aiResponse.processing_time_ms) + 'ms' : 'fast'})! Review and confirm below.`
            : 'Prescription draft generated! Review and confirm below.',
          'success'
        );
        setCurrentPage('prescriptions');
        return;
      }
    } catch (err) {
      console.warn('Backend parseSpeech failed or unreachable, falling back to local extractor', err);
    }

    // Resilient offline fallback using safe clinical extractor (strictly parses text without sample defaults)
    const extracted = speechService.extractPrescriptionFromSpeech(text);
    let offlineSuggestion = '';
    let offlinePatientId = '';
    if (patients && extracted.patientName) {
      const normName = extracted.patientName.toLowerCase().trim();
      const matchedP = patients.find(p => {
        const pn = p.name.toLowerCase().trim();
        return pn === normName || pn.includes(normName) || normName.includes(pn);
      });
      if (matchedP) {
        offlineSuggestion = matchedP.name;
        offlinePatientId = matchedP.id;
      }
    }
    const offlineNormalized = {
      ...extracted,
      patientNameSuggestion: offlineSuggestion,
      patientId: offlinePatientId,
      rawDictation: text,
      source: 'voice' as const,
      language: selectedLang,
      isDiagnosisConfirmed: false,
      providerUsed: 'offline_clinical_engine'
    };
    setStagedVoiceData(offlineNormalized);
    setVoiceState('idle');
    showToast('Prescription draft organized! Review, edit, and confirm below.', 'info');
    setCurrentPage('prescriptions');
  };

  // Hand-off organized data into the Prescription Review & Creation form
  const handleReviewFields = () => {
    if (parsedVoiceResultRef.current) {
      setStagedVoiceData(parsedVoiceResultRef.current);
    }
    setCurrentPage('prescriptions');
  };

  // Direct Manual Entry (Bypasses voice/AI)
  const handleManualEntry = () => {
    setStagedVoiceData(null);
    setCurrentPage('prescriptions');
  };

  // Reset or retry
  const handleReset = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    parsedVoiceResultRef.current = null;
    setParsingProvider('');
    setVoiceState('idle');
    setSpeechText('');
    setErrorMessage('');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`orb-stage state-${voiceState}`}>
      {/* Language Selector & Manual Entry Shortcut */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '0.85rem',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 6px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Languages size={15} color="var(--ai-violet)" style={{ marginLeft: '6px' }} />
          <button
            type="button"
            onClick={() => { setSelectedLang('en'); }}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: selectedLang === 'en' ? 'var(--primary-navy)' : 'transparent',
              color: selectedLang === 'en' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            English (India)
          </button>
          <button
            type="button"
            onClick={() => { setSelectedLang('hinglish' as any); }}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: (selectedLang as string) === 'hinglish' ? 'var(--primary-navy)' : 'transparent',
              color: (selectedLang as string) === 'hinglish' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Hinglish (Roman)
          </button>
          <button
            type="button"
            onClick={() => { setSelectedLang('hi'); }}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: selectedLang === 'hi' ? 'var(--primary-navy)' : 'transparent',
              color: selectedLang === 'hi' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            हिंदी (Devanagari)
          </button>
        </div>

        {/* Visible Actions: Start New Consultation & Manual Entry */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
              if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
              isListeningRef.current = false;
              setVoiceState('idle');
              setSpeechText('');
              speechTextRef.current = '';
              startNewConsultation('home');
            }}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
            title="Start completely empty consultation without previous transcript"
          >
            <RotateCcw size={14} />
            <span>New Consultation</span>
          </button>

          <button
            type="button"
            onClick={handleManualEntry}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            <Edit size={14} />
            <span>Manual Entry Form</span>
          </button>
        </div>
      </div>

      {/* Enlarged Transparent 3D Glass Sphere with Flowing Internal Waveform */}
      <div className="orb-container-wrapper">
        <div className="orb-ring orb-ring-1" />
        <div className="orb-ring orb-ring-2" />
        <div className="orb-ring orb-ring-3" />
        <div className="orb-floor-shadow" />

        <button
          className="orb-core-btn"
          onClick={() => {
            if (voiceState === 'idle') handleStartListening();
            else if (voiceState === 'listening') handleStopListening();
            else if (voiceState === 'ready_for_review') handleReviewFields();
            else if (voiceState === 'error') handleStartListening();
          }}
          aria-label={
            voiceState === 'idle' ? 'Ready to speak. Click sphere to Start Microphone' :
            voiceState === 'listening' ? 'Listening active. Click to Stop and generate prescription draft' :
            voiceState === 'ready_for_review' ? 'Prescription Draft Ready. Click to Review' :
            'Microphone error. Click to retry'
          }
        >
          {/* Glass Sphere Body with Specular Curvature */}
          <div className="orb-glass-sphere">
            {/* Luminous Canvas Waveform Layer inside Glass */}
            <canvas ref={canvasRef} className="orb-canvas" />

            {/* Specular Light Curved Reflections */}
            <div className="orb-specular-top" />
            <div className="orb-specular-rim" />
          </div>

          {/* Central Floating Microphone Icon */}
          <div className="orb-icon-wrapper">
            {voiceState === 'idle' && <Mic size={52} />}

            {voiceState === 'listening' && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={54} className="mic-listening-pulse" />
                <span className="mic-active-dot" />
              </div>
            )}

            {voiceState === 'processing' && <Sparkles size={52} className="spin-icon" />}

            {voiceState === 'ready_for_review' && <CheckCircle2 size={54} color="#10B981" />}

            {voiceState === 'error' && <MicOff size={52} color="#EF4444" />}
          </div>
        </button>
      </div>

      {/* Main Status Label, Recording Controls & Feedback */}
      <div style={{ textAlign: 'center', marginTop: '0.5rem', maxWidth: '620px' }}>
        {voiceState === 'idle' && (
          <>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {speechText ? 'Dictation Ready to Process' : 'Click Sphere to Start Microphone'}
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Speak naturally into your microphone. MediScript transcribes your voice in real time. You can edit the transcript below at any time before AI organizes it into prescription fields.
            </p>
          </>
        )}

        {voiceState === 'listening' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '1rem'
              }}
            >
              <Radio size={17} className="mic-listening-pulse" />
              <span>Microphone Active... ({formatTime(recordingSeconds)})</span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Speak patient complaints, findings, and medicines. Click below when finished speaking.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleStopListening}
                className="btn btn-primary"
                style={{
                  padding: '0.65rem 1.6rem',
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  fontWeight: 700
                }}
              >
                <Sparkles size={16} />
                <span>Stop & Generate Prescription Draft</span>
              </button>

              <button
                type="button"
                onClick={handleStopToEditTranscript}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600
                }}
              >
                <Square size={14} color="#EF4444" />
                <span>Stop (Edit Transcript First)</span>
              </button>
            </div>
          </div>
        )}

        {voiceState === 'processing' && (
          <>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--ai-violet)', marginBottom: '0.4rem' }}>
              AI Structuring Clinical Prescription...
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
              Parsing complaints, vitals, dosages, frequencies, and instructions.
            </p>
          </>
        )}

        {voiceState === 'ready_for_review' && (
          <>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginBottom: '0.4rem' }}>
              Review Required: Prescription Draft Ready
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Doctor review required. AI never prescribes independently. Please verify, edit, or adjust before saving.
            </p>
            {parsingProvider && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span 
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: parsingProvider.includes('gemini') ? 'rgba(118, 103, 248, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                    color: parsingProvider.includes('gemini') ? 'var(--ai-violet)' : '#10B981',
                    fontWeight: 700,
                    border: `1px solid ${parsingProvider.includes('gemini') ? 'rgba(118, 103, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                  }}
                >
                  {parsingProvider.includes('gemini') ? '⚡ Structured with Gemini AI (gemini-3.5-flash)' : '⚡ Clinical Engine Active'}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleReviewFields}
                className="btn btn-ai"
                style={{ padding: '0.8rem 1.85rem', fontSize: '1rem' }}
              >
                <span>Review & Confirm Prescription</span>
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={handleReset}
                className="btn btn-secondary"
              >
                <RotateCcw size={16} />
                <span>Dictate Again</span>
              </button>
            </div>
          </>
        )}

        {voiceState === 'error' && (
          <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#EF4444', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <span>Microphone Access or Recognition Notice</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              {errorMessage || (!micPermissionGranted 
                ? 'Microphone permission was not granted. Please allow microphone access in your browser or type your consultation notes below.'
                : 'Unable to capture audio stream from microphone. You can retry microphone or use manual entry.')}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleStartListening} className="btn btn-primary btn-sm">
                <RotateCcw size={14} />
                <span>Retry Microphone</span>
              </button>
              <button onClick={handleManualEntry} className="btn btn-secondary btn-sm">
                <Edit size={14} />
                <span>Open Manual Entry Form</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Captured Clinical Dictation Card — Fully Editable Multiline Textarea */}
      <div 
        className="card"
        style={{
          marginTop: '1.5rem',
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} color="var(--ai-violet)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Clinical Dictation Transcript (Editable)
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {voiceState === 'listening' ? '● Recording live...' : 'Doctor can edit before AI processing'}
          </span>
        </div>

        {/* Multiline Editable Textarea */}
        <textarea
          value={speechText}
          onChange={(e) => {
            setSpeechText(e.target.value);
            speechTextRef.current = e.target.value;
            sessionBaseTextRef.current = e.target.value;
          }}
          placeholder="Microphone dictation will appear here in real-time as you speak. You can also directly type, edit, or paste patient complaints, clinical observations, vitals, and prescribed medicines here..."
          rows={5}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />

        {/* Action Controls for Editable Transcript */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            * AI organizes information; doctor review is strictly required before prescription confirmation.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {speechText && (
              <button
                type="button"
                onClick={() => setSpeechText('')}
                className="btn btn-secondary btn-sm"
                title="Clear transcript"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => handleProcessAndNavigate(speechText)}
              className="btn btn-ai btn-sm"
              style={{ fontWeight: 700 }}
              disabled={voiceState === 'processing' || !speechText.trim()}
            >
              <Sparkles size={14} />
              <span>Generate Prescription Draft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

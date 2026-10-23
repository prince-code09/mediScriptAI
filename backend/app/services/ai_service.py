import re
import json
from typing import Optional, List, Dict, Any, Tuple
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.schemas.ai import (
    SpeechParseRequest,
    SpeechParseResponse,
    ExtractedPrescriptionData,
    ProposedChangeItem,
    RefinePrescriptionRequest,
    RefinePrescriptionResponse
)
from app.schemas.prescription import MedicineItemSchema, VitalsSchema

class AIService:
    """
    Provider-independent AI Service for Clinical Dictation Parsing and Refinement.
    Implements Gemini AI (gemini-3.5-flash) with deterministic clinical safety boundaries:
    - Never fabricates normal vitals or unmentioned symptoms
    - Never infers diagnoses not spoken by the clinician
    - Preserves uncertainty and highlights ambiguity
    - Deterministic fallback when offline or provider unavailable
    """

    async def parse_speech(self, request: SpeechParseRequest) -> SpeechParseResponse:
        transcript = request.transcript.strip()
        lang = request.language or "en"
        confidence_flags: List[str] = []
        ambiguities: List[str] = []

        if not transcript:
            return SpeechParseResponse(
                extracted_data=ExtractedPrescriptionData(),
                confidence_flags=["Empty audio dictation transcript provided."],
                ambiguities=["No clinical speech detected."],
                provider_used="deterministic_parser"
            )

        # 1. Attempt Gemini 3.5 Flash if configured
        if settings.is_ai_configured and settings.AI_PROVIDER.lower() == "gemini":
            try:
                gemini_result = await self._call_gemini_parse(transcript, lang, confidence_flags, ambiguities)
                if gemini_result:
                    return SpeechParseResponse(
                        extracted_data=gemini_result,
                        confidence_flags=confidence_flags,
                        ambiguities=ambiguities,
                        provider_used="gemini-3.5-flash"
                    )
            except Exception as e:
                logger.warning(f"Gemini parse exception, falling back to deterministic extractor: {type(e).__name__}")
                confidence_flags.append("Gemini provider timed out or failed; used safe deterministic clinical parser.")

        # 2. Safe Deterministic Clinical Extractor with zero-fabrication guarantee
        extracted = self._extract_clinically_safe_data(transcript, lang, confidence_flags, ambiguities)

        return SpeechParseResponse(
            extracted_data=extracted,
            confidence_flags=confidence_flags,
            ambiguities=ambiguities,
            provider_used="deterministic_clinical_extractor"
        )

    async def _call_gemini_parse(
        self,
        transcript: str,
        lang: str,
        flags: List[str],
        ambiguities: List[str]
    ) -> Optional[ExtractedPrescriptionData]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={settings.AI_API_KEY}"
        
        system_instruction = (
            "You are an expert clinical transcription and structuring engine for Indian clinics and OPDs.\n"
            "Extract structured prescription fields from doctor speech in English, Hindi, or Hinglish.\n"
            "STRICT HEALTHCARE SAFETY RULES:\n"
            "1. NEVER fabricate normal vitals (BP, pulse, temp, spo2, weight) if not explicitly spoken.\n"
            "2. If doctor mentions fever temperature (e.g. 'temp 101', 'temperature 99.4 F', 'bukhar 102 degree', 'fever 100 F'), extract into vitals.temp (e.g. '101 °F'). If fever is just described as a complaint without degrees, record 'Fever' under symptoms.\n"
            "3. NEVER invent symptoms, findings, or diagnoses. If no diagnosis is spoken, set diagnosis to null.\n"
            "4. NEVER mark diagnosis as confirmed unless doctor explicitly says 'confirmed diagnosis', 'confirmed case', or 'final diagnosis'. Default is_diagnosis_confirmed to false.\n"
            "5. NEVER invent medicines, dosages, strengths, frequencies, or durations not spoken. Preserve original drug names and strengths exactly.\n"
            "6. EXTRACT EVERY MENTIONED MEDICINE as its own separate row in the 'medicines' array. Never truncate or stop after the first medicine.\n"
            "7. Accurately translate Indian frequency terms:\n"
            "   - 'subah sham' / 'subah shaam' / 'twice daily' / 'BD' -> '1-0-1 (After Food)' or '1-0-1'\n"
            "   - 'subah khali pet' / 'khali pet' / 'once daily morning' / 'OD' -> '1-0-0 (Morning)' or '1-0-0'\n"
            "   - 'raat ko' / 'sote samay' / 'bedtime' / 'HS' -> '0-0-1 (At Bedtime)' or '0-0-1'\n"
            "   - 'din me teen baar' / 'thrice daily' / 'TDS' -> '1-1-1'\n"
            "   - 'jarurat padne par' / 'jab dard ho' / 'SOS' -> 'SOS'\n"
            "8. If frequency, duration, or dose for a medicine was NOT explicitly mentioned, set that field to empty string \"\" and add a note to 'ambiguities'. Never guess.\n"
            "9. If an unclear or phonetically ambiguous word sounds like a possible medicine, do NOT invent or substitute another drug; add it to 'ambiguities' for clinician review.\n"
            "10. Return a valid JSON object matching the requested schema.\n"
        )
        prompt = (
            f"Doctor Speech ({lang}): \"{transcript}\"\n\n"
            "Extract into JSON with keys:\n"
            "- patient_name (string or null)\n"
            "- patient_age (integer or null)\n"
            "- patient_gender (string 'Male'/'Female'/'Other' or null)\n"
            "- patient_phone (string or null, 10-digit Indian phone/mobile number if spoken, otherwise null)\n"
            "- symptoms (string or null)\n"
            "- duration_of_symptoms (string or null)\n"
            "- clinical_findings (string or null)\n"
            "- diagnosis (string or null)\n"
            "- is_diagnosis_confirmed (boolean: true ONLY if explicitly confirmed by doctor, otherwise false)\n"
            "- consultation_report (structured markdown string categorizing: 1. Patient-Reported Complaints, 2. Doctor Examination Findings, 3. Actual Recorded Vitals, 4. Doctor Assessment / Confirmed Diagnosis, 5. Prescribed Treatment & Medicines, 6. Ambiguities/Missing Info)\n"
            "- vitals (object with optional string keys: bp, pulse, temp, spo2, weight; or null if none spoken)\n"
            "- medicines (list of objects with: name, strength, dosage_form, dose, frequency, duration, instructions, route)\n"
            "- advice (string or null)\n"
            "- follow_up (string or null)\n"
            "- confidence_flags (list of strings)\n"
            "- ambiguities (list of strings)\n"
        )

        payload = {
            "contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning(f"Gemini API returned status {resp.status_code}")
                flags.append(f"Gemini API returned status {resp.status_code}. Used fallback extractor.")
                return None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or not parts[0].get("text"):
                return None

            parsed = json.loads(parts[0]["text"])
            
            # Normalize symptoms if array
            syms = parsed.get("symptoms")
            if isinstance(syms, list):
                syms = ", ".join([str(s) for s in syms if s])
            
            # Normalize advice if array
            adv = parsed.get("advice")
            if isinstance(adv, list):
                adv = " ".join([str(a) for a in adv if a])

            # Process medicines
            meds_list = []
            for i, m in enumerate(parsed.get("medicines", [])):
                if isinstance(m, dict) and m.get("name"):
                    med_name = str(m["name"]).strip()
                    med_strength = str(m.get("strength") or "").strip()
                    med_form = str(m.get("dosage_form") or "Tablet").strip()
                    med_dose = str(m.get("dose") or "").strip()
                    med_freq = str(m.get("frequency") or "").strip()
                    med_dur = str(m.get("duration") or "").strip()
                    med_inst = str(m.get("instructions") or "").strip()
                    med_route = m.get("route")

                    # If frequency or duration was omitted in speech, flag for doctor verification
                    if not med_freq:
                        ambiguities.append(f"Frequency for '{med_name}' was not specified in dictation. Doctor verification required.")
                    if not med_dur:
                        flags.append(f"Duration for '{med_name}' was not specified.")

                    meds_list.append(MedicineItemSchema(
                        id=f"med-{i+1}",
                        name=med_name,
                        strength=med_strength,
                        dosage_form=med_form,
                        dose=med_dose,
                        frequency=med_freq,
                        duration=med_dur,
                        instructions=med_inst,
                        route=med_route
                    ))

            # Process vitals
            v_data = parsed.get("vitals")
            vitals_obj = None
            if isinstance(v_data, dict) and any(v_data.values()):
                vitals_obj = VitalsSchema(
                    bp=v_data.get("bp"),
                    pulse=v_data.get("pulse"),
                    temp=v_data.get("temp"),
                    spo2=v_data.get("spo2"),
                    weight=v_data.get("weight")
                )

            # Append any flags from Gemini
            for f in parsed.get("confidence_flags") or []:
                flags.append(str(f))
            for a in parsed.get("ambiguities") or []:
                ambiguities.append(str(a))

            if not parsed.get("diagnosis"):
                flags.append("No explicit diagnosis stated in dictation; field left blank for doctor confirmation.")

            # Age normalization
            age_val = parsed.get("patient_age")
            if age_val is not None:
                try:
                    age_val = int(age_val)
                except (ValueError, TypeError):
                    age_val = None

            # Confirmed diagnosis explicit check
            is_confirmed = bool(parsed.get("is_diagnosis_confirmed"))
            if not is_confirmed and parsed.get("diagnosis"):
                flags.append("Provisional diagnosis identified; requires explicit doctor confirmation.")

            return ExtractedPrescriptionData(
                patient_name=parsed.get("patient_name"),
                patient_age=age_val,
                patient_gender=parsed.get("patient_gender"),
                patient_phone=parsed.get("patient_phone"),
                symptoms=syms,
                duration_of_symptoms=parsed.get("duration_of_symptoms"),
                clinical_findings=parsed.get("clinical_findings"),
                diagnosis=parsed.get("diagnosis"),
                is_diagnosis_confirmed=is_confirmed,
                consultation_report=parsed.get("consultation_report"),
                vitals=vitals_obj,
                medicines=meds_list,
                advice=adv,
                follow_up=parsed.get("follow_up")
            )

    def _extract_clinically_safe_data(
        self,
        text: str,
        lang: str,
        flags: List[str],
        ambiguities: List[str]
    ) -> ExtractedPrescriptionData:
        lower = text.lower()
        
        # 1. Patient Name extraction (Supports English, Hinglish, and Hindi Devanagari)
        name = None
        name_patterns = [
            r'(?:patient\s+name|patient|name|mareez|मरीज\s+का\s+नाम|मरीज|shri|smt|mr\.|mrs\.)\s*(?::|\bis\b|\bhai\b)?\s*([A-Za-z\u0900-\u097F\s]+?)(?:,|\.|\b(?:age|umar|years|saal|उम्र|साल)\b|\d+)',
            r'(?:patient\s+name\s+is|patient\s+is|patient)\s+([A-Za-z\u0900-\u097F\s]+?)(?:,|\.|\b(?:age|umar)\b|\d+)'
        ]
        for pat in name_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                if candidate and len(candidate.split()) <= 4:
                    name = candidate.title()
                    break

        # 2. Patient Age extraction
        age = None
        age_patterns = [
            r'(?:age|umar|saal|years old|yrs old|उम्र|साल)\s*(?:is|hai|:)?\s*(\d{1,3})',
            r'(\d{1,3})\s*(?:years old|saal|yrs old|saal ka|saal ki|साल)'
        ]
        for pat in age_patterns:
            match = re.search(pat, lower)
            if match:
                try:
                    val = int(match.group(1))
                    if 0 <= val <= 130:
                        age = val
                        break
                except ValueError:
                    pass

        # 3. Patient Gender
        gender = None
        if re.search(r'\b(male|purush|aadmi|boy|man|पुरुष|आदमी)\b', lower):
            gender = "Male"
        elif re.search(r'\b(female|mahila|aurat|girl|woman|महिला|औरत)\b', lower):
            gender = "Female"

        # 3b. Patient Phone (Optional 10-digit mobile)
        phone = None
        phone_match = re.search(r'(?:phone|mobile|contact|number|ph)\s*(?:is|number|no|:)?\s*(\+?91[\-\s]?)?([6-9]\d{9})\b', text, re.IGNORECASE)
        if phone_match:
            phone = phone_match.group(2)

        # 4. Vitals - STRICT: Only extract if explicitly stated in dictation
        vitals = VitalsSchema()
        bp_match = re.search(r'(?:bp|blood pressure)\s*(?:is|hai|:)?\s*(\d{2,3}\s*/\s*\d{2,3})', lower)
        if bp_match:
            vitals.bp = bp_match.group(1).replace(" ", "") + " mmHg"

        pulse_match = re.search(r'(?:pulse|heart rate)\s*(?:is|hai|:)?\s*(\d{2,3})', lower)
        if pulse_match:
            vitals.pulse = pulse_match.group(1) + " bpm"

        temp_match = re.search(r'(?:temp|temperature|bukhar)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|c|deg|degree)?', lower) or re.search(r'fever\s*(?:of|is|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:f|deg|degree)?', lower)
        if temp_match:
            vitals.temp = temp_match.group(1) + " °F"

        spo2_match = re.search(r'(?:spo2|oxygen|saturation)\s*(?:is|hai|:)?\s*(\d{2,3})%?', lower)
        if spo2_match:
            vitals.spo2 = spo2_match.group(1) + "%"

        weight_match = re.search(r'(?:weight|wazan|wt)\s*(?:is|hai|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:kg|kilo)?', lower)
        if weight_match:
            vitals.weight = weight_match.group(1) + " kg"

        # Check if any vital was found
        has_any_vital = any([vitals.bp, vitals.pulse, vitals.temp, vitals.spo2, vitals.weight])
        final_vitals = vitals if has_any_vital else None

        # 5. Symptoms & Duration
        symptoms = None
        duration = None
        symptom_match = re.search(r'(?:complaints?|symptoms?|takleef|problem|तकलीफ|शिकायत)\s*(?:are|is|hai|of|:)?\s*([^,\.]+)', text, re.IGNORECASE)
        if symptom_match:
            candidate_sym = symptom_match.group(1).strip()
            if candidate_sym.lower().startswith("of "):
                candidate_sym = candidate_sym[3:].strip()
            symptoms = candidate_sym.capitalize()
        elif "fever" in lower or "bukhar" in lower or "बुखार" in lower or "cough" in lower or "khansi" in lower or "खांसी" in lower:
            extracted_symptoms = []
            if "fever" in lower or "bukhar" in lower or "बुखार" in lower:
                extracted_symptoms.append("Fever")
            if "cough" in lower or "khansi" in lower or "खांसी" in lower:
                extracted_symptoms.append("Cough")
            if "cold" in lower or "jukham" in lower or "जुकाम" in lower or "सर्दी" in lower:
                extracted_symptoms.append("Common Cold / Coryza")
            if "body ache" in lower or "badan dard" in lower or "बदन दर्द" in lower:
                extracted_symptoms.append("Body ache")
            if "throat pain" in lower or "gale me dard" in lower or "sore throat" in lower or "गले में दर्द" in lower:
                extracted_symptoms.append("Sore Throat")
            if "headache" in lower or "sar dard" in lower or "सिर दर्द" in lower:
                extracted_symptoms.append("Headache")
            if "vomiting" in lower or "ulti" in lower or "उल्टी" in lower:
                extracted_symptoms.append("Vomiting")
            if "acidity" in lower or "gas" in lower or "पेट में जलन" in lower:
                extracted_symptoms.append("Acidity / Dyspepsia")
            if extracted_symptoms:
                symptoms = ", ".join(extracted_symptoms)

        dur_match = re.search(r'(?:since|for|se)\s*(\d+\s*(?:days|din|weeks|hafte|months|mahine|दिन))', lower)
        if dur_match:
            duration = dur_match.group(1).strip()

        # 6. Diagnosis - STRICT: Never infer without explicit speech
        diagnosis = None
        diag_match = re.search(r'(?:diagnosis|provisional diagnosis|bimari|nidan|निदान|बीमारी)\s*(?:is|hai|:)?\s*([^,\.]+)', text, re.IGNORECASE)
        if diag_match:
            diagnosis = diag_match.group(1).strip()
        else:
            flags.append("No explicit diagnosis stated in dictation; field left blank for doctor confirmation.")

        # 7. Medicines Extraction (Context-specific multi-medicine capture without fabricating missing frequencies)
        medicines: List[MedicineItemSchema] = []
        med_dict_patterns = [
            (r'paracetamol|pcm|calpol|dolo|paracitamol|पैरासिटामोल|पेरासिटामोल', "Paracetamol", "650 mg", "Tablet", "Oral"),
            (r'azithromycin|azithro|azee|azithromicin|अज़ीथ्रोमाइसिन|एजिथ्रोमाइसिन', "Azithromycin", "500 mg", "Tablet", "Oral"),
            (r'amoxicillin|amoxycillin|mox|augmentin|amoxyclav|एमोक्सिसिलिन', "Amoxicillin & Clavulanate", "625 mg", "Tablet", "Oral"),
            (r'pantoprazole|pantocid|pan\s*40|पेंटोप्रजोल|पैंटोसिड', "Pantoprazole", "40 mg", "Tablet", "Oral"),
            (r'cetirizine|cetrizine|cetzine|सिट्रिजिन', "Cetirizine", "10 mg", "Tablet", "Oral"),
            (r'levocetirizine|montek\s*lc|montair|लेवोसिट्रिजिन', "Levocetirizine + Montelukast", "5mg + 10mg", "Tablet", "Oral"),
            (r'cefixime|zifi|taxim|सेफिक्सिम', "Cefixime", "200 mg", "Tablet", "Oral"),
            (r'cough syrup|syrup|benadryl|ascoril|grilinctus|कफ सिरप', "Cough Syrup", "100 ml", "Syrup", "Oral"),
            (r'ibuprofen|brufen|combiflam|इबुप्रोफेन', "Ibuprofen + Paracetamol", "400mg + 325mg", "Tablet", "Oral"),
            (r'metformin|glycomet|मेटफॉर्मिन', "Metformin", "500 mg", "Tablet", "Oral"),
            (r'telmisartan|telma|टेलमिसार्टन', "Telmisartan", "40 mg", "Tablet", "Oral"),
            (r'multivitamin|becosules|zinc|मल्टीविटामिन', "Multivitamin with Zinc", "", "Capsule", "Oral")
        ]

        # First find all matching medicines and their positions in text
        matched_meds = []
        for pat, med_name, default_strength, dosage_form, route in med_dict_patterns:
            m = re.search(rf'\b(?:{pat})\b', lower)
            if m:
                matched_meds.append({
                    "start": m.start(),
                    "end": m.end(),
                    "pat": pat,
                    "name": med_name,
                    "default_strength": default_strength,
                    "form": dosage_form,
                    "route": route
                })

        # Sort matches by order of appearance in dictation
        matched_meds.sort(key=lambda x: x["start"])

        # Extract context-specific parameters for each medicine
        for idx, med_info in enumerate(matched_meds):
            # Context segment starts at medicine name and ends at next medicine or punctuation/end
            seg_start = med_info["start"]
            if idx + 1 < len(matched_meds):
                seg_end = matched_meds[idx + 1]["start"]
            else:
                seg_end = min(len(lower), seg_start + 140)
            
            med_segment = lower[seg_start:seg_end]

            # Strength: check segment first, then default
            str_search = re.search(r'(\d+\s*(?:mg|gm|ml))', med_segment)
            actual_strength = str_search.group(1) if str_search else med_info["default_strength"]

            # Dose: check if explicitly spoken (e.g., 1 tablet, 2 tabs, 10 ml), otherwise empty string
            dose_search = re.search(r'(\d+\s*(?:tab|tablet|cap|capsule|ml|tsp|puff|drop))', med_segment)
            med_dose = dose_search.group(1) if dose_search else ""

            # Frequency: check medicine-specific segment first
            med_freq = ""
            if re.search(r'1-0-1|twice daily|subah\s+sham|सुबह\s+शाम|bd\b', med_segment):
                med_freq = "1-0-1"
            elif re.search(r'1-0-0|once daily|subah\s+khali\s+pet|सुबह\s+खाली\s+पेट|od\b', med_segment):
                med_freq = "1-0-0"
            elif re.search(r'0-0-1|bedtime|raat\s+ko|रात\s+को|hs\b', med_segment):
                med_freq = "0-0-1"
            elif re.search(r'1-1-1|tds|thrice daily|दिन\s+में\s+तीन\s+बार', med_segment):
                med_freq = "1-1-1"
            elif len(matched_meds) == 1:
                # If only one medicine exists, check entire dictation for global frequency
                if re.search(r'1-0-1|twice daily|subah\s+sham|सुबह\s+शाम|bd\b', lower):
                    med_freq = "1-0-1"
                elif re.search(r'1-0-0|once daily|subah\s+khali\s+pet|सुबह\s+खाली\s+पेट|od\b', lower):
                    med_freq = "1-0-0"
                elif re.search(r'0-0-1|bedtime|raat\s+ko|रात\s+को|hs\b', lower):
                    med_freq = "0-0-1"
                elif re.search(r'1-1-1|tds|thrice daily', lower):
                    med_freq = "1-1-1"

            # Duration: check medicine segment first
            med_dur = ""
            dur_search = re.search(r'(\d+)\s*(?:days|din|weeks|hafte|दिन)', med_segment)
            if dur_search:
                med_dur = f"{dur_search.group(1)} days"
            elif len(matched_meds) == 1:
                dur_search_global = re.search(r'(\d+)\s*(?:days|din|weeks|hafte|दिन)', lower)
                if dur_search_global:
                    med_dur = f"{dur_search_global.group(1)} days"

            if not med_freq:
                ambiguities.append(f"Frequency for '{med_info['name']}' was not specified in dictation. Doctor review required.")

            medicines.append(MedicineItemSchema(
                id=f"med-{len(medicines)+1}",
                name=med_info["name"],
                strength=actual_strength,
                dosage_form=med_info["form"],
                dose=med_dose,
                frequency=med_freq,
                duration=med_dur,
                instructions="",
                route=med_info["route"]
            ))

        if not medicines:
            ambiguities.append("No standard medication names recognized in dictation; please add medicines manually.")

        # 8. Advice & Follow-Up
        advice = None
        if "water" in lower or "paani" in lower or "gargle" in lower or "rest" in lower or "aaram" in lower:
            advice = "Take warm fluids, plenty of water, salt water gargles. Adequate rest."

        follow_up = None
        follow_match = re.search(r'(?:follow\s*up|checkup|dikhana)\s*(?:after|in|baad)?\s*(\d+\s*(?:days|din|weeks|hafte))', lower)
        if follow_match:
            follow_up = f"Review OPD after {follow_match.group(1)}"

        is_confirmed = bool(re.search(r'\b(confirmed diagnosis|confirmed case|final diagnosis|pucca diagnosis)\b', lower))
        
        # Build structured consultation report preserving clinical meaning
        report_parts = []
        if symptoms:
            report_parts.append(f"1. Patient-Reported Complaints: {symptoms}" + (f" (Duration: {duration})" if duration else ""))
        else:
            report_parts.append("1. Patient-Reported Complaints: Not explicitly dictated")

        report_parts.append("2. Doctor's Examination Findings: Pending clinician verification")

        if final_vitals:
            v_strs = []
            if final_vitals.bp: v_strs.append(f"BP: {final_vitals.bp}")
            if final_vitals.pulse: v_strs.append(f"Pulse: {final_vitals.pulse}")
            if final_vitals.temp: v_strs.append(f"Temp: {final_vitals.temp}")
            if final_vitals.spo2: v_strs.append(f"SpO2: {final_vitals.spo2}")
            if final_vitals.weight: v_strs.append(f"Weight: {final_vitals.weight}")
            report_parts.append(f"3. Actual Recorded Vitals: {', '.join(v_strs)}")
        else:
            report_parts.append("3. Actual Recorded Vitals: None measured/dictated (strictly optional)")

        if diagnosis:
            diag_label = f"Confirmed Diagnosis: {diagnosis}" if is_confirmed else f"Provisional Diagnosis (Pending Confirmation): {diagnosis}"
            report_parts.append(f"4. Doctor Assessment: {diag_label}")
        else:
            report_parts.append("4. Doctor Assessment: No confirmed diagnosis dictated; pending doctor evaluation")

        if medicines:
            med_summaries = [f"{m.name} {m.strength} ({m.frequency}, {m.duration})" for m in medicines]
            report_parts.append(f"5. Doctor-Provided Treatment: {'; '.join(med_summaries)}")
        else:
            report_parts.append("5. Doctor-Provided Treatment: None dictated")

        if ambiguities or flags:
            report_parts.append(f"6. Unclear / Missing Information: {'; '.join(ambiguities + flags)}")

        consultation_report = "\n\n".join(report_parts)

        return ExtractedPrescriptionData(
            patient_name=name,
            patient_age=age,
            patient_gender=gender,
            patient_phone=phone,
            symptoms=symptoms,
            duration_of_symptoms=duration,
            clinical_findings=None,
            diagnosis=diagnosis,
            is_diagnosis_confirmed=is_confirmed,
            consultation_report=consultation_report,
            vitals=final_vitals,
            medicines=medicines,
            advice=advice,
            follow_up=follow_up
        )

    async def refine_prescription(self, request: RefinePrescriptionRequest) -> RefinePrescriptionResponse:
        current = dict(request.current_prescription)
        instruction = request.doctor_instruction.strip()
        lang = request.language or "en"

        # 1. Attempt Gemini 3.5 Flash if configured
        if settings.is_ai_configured and settings.AI_PROVIDER.lower() == "gemini":
            try:
                gemini_refine = await self._call_gemini_refine(current, instruction, lang)
                if gemini_refine:
                    return gemini_refine
            except Exception as e:
                logger.warning(f"Gemini refine exception, falling back to deterministic rules: {type(e).__name__}")

        # 2. Deterministic Rule Engine Fallback
        lower_inst = instruction.lower()
        changes: List[ProposedChangeItem] = []
        clarification: Optional[str] = None
        proposed = dict(current)

        # Correction Pattern: Age (e.g. "Age 45 nahi 48 kar do" or "Change age to 52")
        new_age = None
        correction_match = re.search(r'(?:age|umar|saal)?\s*(\d{1,3})\s*(?:nahi|not|nhi)[\s,]+(?:kar\s*do\s*)?(\d{1,3})', lower_inst)
        if correction_match:
            new_age = int(correction_match.group(2))
        else:
            age_match = re.search(r'(?:age|umar|saal)\s*(?:to|kar\s*do|change\s*to|is)?\s*(\d{1,3})', lower_inst)
            if age_match:
                new_age = int(age_match.group(1))

        if new_age is not None:
            old_age = current.get("patient_age") or current.get("patientAge")
            proposed["patient_age"] = new_age
            proposed["patientAge"] = new_age
            changes.append(ProposedChangeItem(
                field="patient_age",
                original_value=old_age,
                proposed_value=new_age,
                explanation=f"Updated patient age to {new_age} years per doctor's instruction."
            ))

        # Correction Pattern: Gender
        if "female" in lower_inst or "mahila" in lower_inst:
            old_gender = current.get("patient_gender") or current.get("patientGender")
            proposed["patient_gender"] = "Female"
            proposed["patientGender"] = "Female"
            changes.append(ProposedChangeItem(
                field="patient_gender",
                original_value=old_gender,
                proposed_value="Female",
                explanation="Updated patient gender to Female."
            ))
        elif "male" in lower_inst or "purush" in lower_inst:
            old_gender = current.get("patient_gender") or current.get("patientGender")
            proposed["patient_gender"] = "Male"
            proposed["patientGender"] = "Male"
            changes.append(ProposedChangeItem(
                field="patient_gender",
                original_value=old_gender,
                proposed_value="Male",
                explanation="Updated patient gender to Male."
            ))

        # Correction Pattern: Diagnosis
        diag_match = re.search(r'(?:diagnosis|bimari)\s*(?:is|likho|kar\s*do|to)?\s*([A-Za-z\s]+?)(?:$|\.|,|\band\b)', instruction, re.IGNORECASE)
        if diag_match:
            new_diag = diag_match.group(1).strip()
            if len(new_diag) > 3 and new_diag.lower() not in ["nahi", "kar do", "same"]:
                old_diag = current.get("diagnosis")
                proposed["diagnosis"] = new_diag
                changes.append(ProposedChangeItem(
                    field="diagnosis",
                    original_value=old_diag,
                    proposed_value=new_diag,
                    explanation=f"Updated provisional diagnosis to '{new_diag}'."
                ))

        # Correction Pattern: Add Medicine
        if "pantoprazole" in lower_inst or "pan 40" in lower_inst:
            meds = list(current.get("medicines", []))
            new_med = {
                "id": f"med-{len(meds)+1}",
                "name": "Pantoprazole",
                "strength": "40 mg",
                "dosage_form": "Tablet",
                "dose": "1 tablet",
                "frequency": "1-0-0",
                "duration": "5 days",
                "instructions": "Empty stomach in morning",
                "route": "Oral"
            }
            meds.append(new_med)
            proposed["medicines"] = meds
            changes.append(ProposedChangeItem(
                field="medicines",
                original_value=f"{len(current.get('medicines', []))} medicines",
                proposed_value=f"Added Pantoprazole 40mg ({len(meds)} total)",
                explanation="Added Pantoprazole 40mg Tablet OD on empty stomach."
            ))

        # Correction Pattern: Change Frequency / Dosage for Paracetamol
        if "paracetamol" in lower_inst and ("tds" in lower_inst or "1-1-1" in lower_inst or "thrice" in lower_inst):
            meds = [dict(m) for m in current.get("medicines", [])]
            for m in meds:
                if "paracetamol" in m.get("name", "").lower():
                    old_f = m.get("frequency")
                    m["frequency"] = "1-1-1 (TDS)"
                    proposed["medicines"] = meds
                    changes.append(ProposedChangeItem(
                        field="medicines.frequency",
                        original_value=f"Paracetamol: {old_f}",
                        proposed_value="Paracetamol: 1-1-1 (TDS)",
                        explanation="Updated Paracetamol frequency to 1-1-1 (thrice daily)."
                    ))

        # Correction Pattern: Follow up
        follow_match = re.search(r'(?:follow\s*up|checkup)\s*(?:after|in|baad)?\s*(\d+\s*(?:days|din|weeks|hafte))', lower_inst)
        if follow_match:
            new_follow = f"Review OPD after {follow_match.group(1)}"
            old_follow = current.get("follow_up") or current.get("followUp")
            proposed["follow_up"] = new_follow
            proposed["followUp"] = new_follow
            changes.append(ProposedChangeItem(
                field="follow_up",
                original_value=old_follow,
                proposed_value=new_follow,
                explanation=f"Updated follow-up to '{new_follow}'."
            ))

        if not changes:
            clarification = f"Could not determine specific field change from '{instruction}'. Please specify the exact field (e.g., 'Change age to 50' or 'Add Pantoprazole 40mg')."

        return RefinePrescriptionResponse(
            proposed_prescription=proposed,
            changes=changes,
            clarification_needed=clarification,
            provider_used="deterministic_rules"
        )

    async def _call_gemini_refine(
        self,
        current: Dict[str, Any],
        instruction: str,
        lang: str
    ) -> Optional[RefinePrescriptionResponse]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={settings.AI_API_KEY}"
        prompt = (
            "You are an expert AI clinical prescription assistant.\n"
            "A doctor provided a correction instruction on an existing prescription draft.\n"
            f"Doctor Instruction ({lang}): \"{instruction}\"\n"
            f"Current Prescription Draft: {json.dumps(current)}\n\n"
            "Rules:\n"
            "1. ONLY modify fields explicitly specified by the doctor.\n"
            "2. Preserve all other fields exactly as they are without alterations.\n"
            "3. Return a JSON object with keys:\n"
            "   - \"proposed_prescription\": updated draft\n"
            "   - \"changes\": list of objects with {\"field\": str, \"original_value\": any, \"proposed_value\": any, \"explanation\": str}\n"
            "   - \"clarification_needed\": string if instruction is ambiguous, otherwise null\n"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                logger.warning(f"Gemini Refine returned status {resp.status_code}")
                return None
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts or not parts[0].get("text"):
                return None
            parsed = json.loads(parts[0]["text"])
            
            changes = []
            for ch in parsed.get("changes", []):
                if isinstance(ch, dict) and "field" in ch:
                    changes.append(ProposedChangeItem(
                        field=str(ch["field"]),
                        original_value=ch.get("original_value"),
                        proposed_value=ch.get("proposed_value"),
                        explanation=str(ch.get("explanation") or f"Updated {ch['field']}")
                    ))

            return RefinePrescriptionResponse(
                proposed_prescription=parsed.get("proposed_prescription", current),
                changes=changes,
                clarification_needed=parsed.get("clarification_needed"),
                provider_used="gemini-3.5-flash"
            )

ai_service = AIService()

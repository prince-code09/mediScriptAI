from fastapi.testclient import TestClient

def test_speech_parsing_clinical_safety(client: TestClient, auth_headers: dict):
    # Dictation without vitals and without explicit diagnosis
    dictation = (
        "Patient Ramesh Kumar, age 45 years male. Complaints of high fever and throat pain since 3 days. "
        "Prescribing Paracetamol 650mg twice daily and Azithromycin 500mg once daily for 3 days. "
        "Take plenty of warm fluids."
    )
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "en"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    # Validated extractions
    assert extracted["patient_name"] == "Ramesh Kumar"
    assert extracted["patient_age"] == 45
    assert extracted["patient_gender"] == "Male"
    assert "fever" in extracted["symptoms"].lower()
    assert len(extracted["medicines"]) >= 2
    med_names = [m["name"] for m in extracted["medicines"]]
    assert "Paracetamol" in med_names
    assert "Azithromycin" in med_names

    # MANDATORY SAFETY RULE VERIFICATION:
    # 1. No fabricated vitals (doctor did not say BP, pulse, temp)
    assert extracted["vitals"] is None

    # 2. No invented diagnosis (doctor did not state diagnosis)
    assert extracted["diagnosis"] is None
    assert any("No explicit diagnosis" in flag for flag in data["confidence_flags"])

def test_refine_with_ai_preserves_unrelated_fields(client: TestClient, auth_headers: dict):
    draft = {
        "patient_name": "Ramesh Kumar",
        "patient_age": 45,
        "patient_gender": "Male",
        "symptoms": "High fever",
        "diagnosis": "Viral Fever",
        "medicines": [
            {
                "name": "Paracetamol",
                "strength": "650 mg",
                "dosage_form": "Tablet",
                "dose": "1 tablet",
                "frequency": "1-0-1",
                "duration": "3 days"
            }
        ],
        "advice": "Rest well"
    }

    # Instruction changes ONLY age
    instruction = "Age 45 nahi, 48 kar do, baaki sab same rakho."
    response = client.post(
        "/api/v1/ai/refine",
        json={"current_prescription": draft, "doctor_instruction": instruction, "language": "hi"},
        headers=auth_headers
    )
    assert response.status_code == 200
    res = response.json()
    
    # 1. Proposed changes list has exactly the target field
    assert len(res["changes"]) == 1
    assert res["changes"][0]["field"] == "patient_age"
    assert res["changes"][0]["original_value"] == 45
    assert res["changes"][0]["proposed_value"] == 48

    # 2. Unrelated fields are strictly preserved
    proposed = res["proposed_prescription"]
    assert proposed["patient_age"] == 48
    assert proposed["patient_name"] == "Ramesh Kumar"
    assert proposed["symptoms"] == "High fever"
    assert proposed["diagnosis"] == "Viral Fever"
    assert len(proposed["medicines"]) == 1
    assert proposed["medicines"][0]["name"] == "Paracetamol"

def test_speech_parsing_multiple_medicines_no_fabricated_frequencies(client: TestClient, auth_headers: dict):
    # Spoken dictation with 3 distinct medicines: Paracetamol, Azithromycin, Pantoprazole
    dictation = (
        "Patient Sunita Sharma, age 32 years female. "
        "Complaints of severe acidity, throat infection and body ache for 2 days. "
        "Giving Paracetamol 650 mg, Azithromycin 500 mg, and Pantoprazole 40 mg."
    )
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "en"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    assert extracted["patient_name"] == "Sunita Sharma"
    assert extracted["patient_age"] == 32
    assert extracted["patient_gender"] == "Female"
    
    # 3 distinct medicines in separate rows
    assert len(extracted["medicines"]) == 3
    med_names = [m["name"] for m in extracted["medicines"]]
    assert "Paracetamol" in med_names
    assert "Azithromycin" in med_names
    assert "Pantoprazole" in med_names

    # Verify no fabricated frequency when not spoken
    for med in extracted["medicines"]:
        assert med["frequency"] == ""

    # Ambiguity flags present alerting clinician to specify frequency
    assert len(data["ambiguities"]) >= 3

def test_speech_parsing_multiple_medicines_independent_frequencies(client: TestClient, auth_headers: dict):
    # Dictation with distinct frequencies per medicine
    dictation = (
        "Patient Ankit Verma, age 40 years male. Complaints of fever and throat pain. "
        "Giving Paracetamol 650 mg twice daily for 5 days, and Azithromycin 500 mg once daily for 3 days."
    )
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "en"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    assert len(extracted["medicines"]) == 2
    pcm = next(m for m in extracted["medicines"] if m["name"] == "Paracetamol")
    azm = next(m for m in extracted["medicines"] if m["name"] == "Azithromycin")

    # Verify context-specific frequencies and durations
    assert pcm["frequency"] == "1-0-1"
    assert "5" in pcm["duration"]
    assert azm["frequency"] == "1-0-0"
    assert "3" in azm["duration"]

def test_speech_parsing_hindi_devanagari_support(client: TestClient, auth_headers: dict):
    # Dictation in Devanagari Hindi
    dictation = "मरीज का नाम राहुल शर्मा, उम्र 35 साल पुरुष। तकलीफ बुखार और बदन दर्द 3 दिन से। पैरासिटामोल 650 mg सुबह शाम।"
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "hi"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    assert extracted["patient_name"] == "राहुल शर्मा"
    assert extracted["patient_age"] == 35
    assert extracted["patient_gender"] == "Male"
    assert len(extracted["medicines"]) >= 1
    assert extracted["medicines"][0]["name"] in ["Paracetamol", "पैरासिटामोल"]
    assert "1-0-1" in extracted["medicines"][0]["frequency"]

def test_speech_parsing_hinglish_and_phone_support(client: TestClient, auth_headers: dict):
    # Dictation in Hinglish with phone number and fever temperature
    dictation = (
        "Mareez Rohit Verma, age 29 male, phone 9816012345. "
        "Takleef bukhar 101 degree aur gale me dard 2 din se. "
        "Paracetamol 650 mg subah sham, Pantoprazole 40 mg subah khali pet. "
        "Review after 3 din."
    )
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "hinglish"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    # Validated field mappings
    assert extracted["patient_name"] == "Rohit Verma"
    assert extracted["patient_age"] == 29
    assert extracted["patient_gender"] == "Male"
    assert extracted["patient_phone"] == "9816012345"
    assert extracted["vitals"] is not None
    assert "101" in extracted["vitals"]["temp"]
    assert len(extracted["medicines"]) >= 2
    pcm = next(m for m in extracted["medicines"] if m["name"] == "Paracetamol")
    pan = next(m for m in extracted["medicines"] if m["name"] == "Pantoprazole")
    assert "1-0-1" in pcm["frequency"]
    assert "1-0-0" in pan["frequency"]

def test_speech_parsing_known_patients_fuzzy_phonetic_match(client: TestClient, auth_headers: dict):
    # Case: Doctor says "Sanskar Mrya" but registered patient is "Sanskar Maurya"
    dictation = "Mareez Sanskar Mrya, age 24 male. Takleef bukhar 2 din se. Paracetamol 650 mg subah sham."
    known = [
        {"id": "pat-101", "name": "Sanskar Maurya", "phone": "9876543210", "age": 24, "gender": "Male"},
        {"id": "pat-102", "name": "Ananya Gupta", "phone": "9812345678", "age": 30, "gender": "Female"}
    ]
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "hinglish", "known_patients": known},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    # Spoken name is preserved as transcribed
    assert extracted["patient_name"] == "Sanskar Mrya"
    # Suggestion is provided matching the registered patient
    assert extracted["patient_name_suggestion"] == "Sanskar Maurya"
    assert extracted["patient_id"] == "pat-101"
    # Ambiguity note generated for doctor verification
    assert any("Sanskar Mrya" in amb and "Sanskar Maurya" in amb for amb in data["ambiguities"])
    # Processing latency is tracked
    assert "processing_time_ms" in data
    assert data["processing_time_ms"] is not None

def test_speech_parsing_known_patients_exact_match(client: TestClient, auth_headers: dict):
    # Case: Spoken name matches registered patient exactly
    dictation = "Patient Priya Sharma, age 28 female. Complaints of headache and fever."
    known = [
        {"id": "pat-102", "name": "Priya Sharma", "phone": "9812345678"}
    ]
    response = client.post(
        "/api/v1/ai/parse-speech",
        json={"transcript": dictation, "language": "en", "known_patients": known},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    extracted = data["extracted_data"]

    assert extracted["patient_name"] == "Priya Sharma"
    assert extracted["patient_name_suggestion"] == "Priya Sharma"
    assert extracted["patient_id"] == "pat-102"
    # No ambiguity note generated since exact match
    assert not any("closely matches" in amb for amb in data["ambiguities"])


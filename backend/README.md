# MediScript Backend — Clinical API & Supabase Architecture

MediScript Clinical API is an asynchronous healthcare web backend built with Python, FastAPI, and Supabase PostgreSQL. It powers AI-assisted prescription workflows, demographic records, prescription revisions, offline-first synchronization, and clinical auditing for rural clinics and outpatient departments (OPDs) in India.

---

## 1. Architecture & Design Principles

- **Framework**: FastAPI (modular versioned routing under `/api/v1`)
- **Data Validation**: Pydantic v2 schemas
- **Database**: Supabase PostgreSQL with strict Row Level Security (RLS)
- **Authentication**: Supabase Auth (JWT Bearer Token verification)
- **HTTP Engine**: Asynchronous HTTP client (HTTPX)
- **Offline-First Synchronization**: Idempotent batch sync queue with client-generated UUID operation tracking
- **Clinical Safety Engine**: Deterministic extraction & AI structuring boundaries preventing fabrication of patient vitals, symptoms, or diagnoses
- **Audit Logging**: Immutable, append-only clinical audit history

---

## 2. Project Directory Structure

```
MediScript/
├── frontend/                  # Completed React + Vite + TypeScript application
│   ├── src/
│   │   ├── services/
│   │   │   ├── apiClient.ts  # Typed API client connecting frontend to backend
│   │   │   └── ...
│   │   └── ...
│   ├── .env.example
│   └── package.json
│
└── backend/                   # FastAPI Backend
    ├── app/
    │   ├── main.py            # FastAPI entry point, CORS, and /health check
    │   ├── api/
    │   │   └── v1/
    │   │       ├── api_router.py
    │   │       └── endpoints/
    │   │           ├── clinics.py
    │   │           ├── patients.py
    │   │           ├── prescriptions.py
    │   │           ├── ai.py
    │   │           ├── sync.py
    │   │           └── analytics.py
    │   ├── core/
    │   │   ├── config.py      # Pydantic BaseSettings configuration
    │   │   ├── security.py    # Supabase JWT decoding and dependency injection
    │   │   ├── logging.py     # HIPAA/DISHA safe logging (redacts credentials & tokens)
    │   │   └── exceptions.py  # Structured HTTP exception classes
    │   ├── schemas/           # Pydantic request and response models
    │   ├── services/          # Business logic and clinical safety rules
    │   └── db/
    │       ├── memory_store.py
    │       └── supabase_client.py
    ├── supabase/
    │   ├── migrations/
    │   │   ├── 001_initial_schema.sql
    │   │   └── 002_rls_policies.sql
    │   ├── schema.sql         # Consolidated table definitions
    │   └── rls_policies.sql   # Consolidated RLS policies
    ├── tests/                 # Pytest test suite (14 passing tests)
    ├── requirements.txt       # Production dependencies
    ├── .env.example           # Environment template
    ├── .gitignore
    └── README.md
```

---

## 3. Local Development Setup

To run MediScript locally, run the frontend and backend in separate terminals:

### Terminal 1 — Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

### Terminal 2 — Backend (FastAPI + Uvicorn)
```bash
cd backend

# Create virtual environment (Python 3.12 recommended)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend starts on `http://127.0.0.1:8000`.

- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`
- Health Endpoint: `http://127.0.0.1:8000/health`

---

## 4. Supabase Database Setup

When deploying or connecting to your live Supabase project:

1. Open your project on the [Supabase Dashboard](https://app.supabase.com).
2. Navigate to **SQL Editor**.
3. Execute the migration scripts in this exact order:
   - **Step 1**: Execute `backend/supabase/migrations/001_initial_schema.sql` (creates `clinics`, `clinic_members`, `patients`, `prescriptions`, `prescription_audit_logs`, `sync_queue` and automatic timestamp triggers).
   - **Step 2**: Execute `backend/supabase/migrations/002_rls_policies.sql` (enables Row Level Security across all tables, installs membership verification helpers, and grants clinic-isolated access).
4. In **Settings -> API**:
   - Copy `Project URL` to `SUPABASE_URL` in `backend/.env`.
   - Copy `anon public key` to `SUPABASE_KEY` in `backend/.env`.
   - Copy `JWT Secret` to `SUPABASE_JWT_SECRET` in `backend/.env`.

---

## 5. Security & Row Level Security (RLS) Specification

All tables enforce PostgreSQL Row Level Security:
- **Unauthenticated Access**: Denied across all medical tables.
- **Cross-Clinic Isolation**: Doctors cannot read, query, insert, or modify patients or prescriptions belonging to unrelated clinics.
- **Prescription Confirmation Immutability**: Confirmed prescriptions cannot be modified directly via standard update endpoints. Doctors must submit a formal revision with a clinical reason, incrementing the revision counter and appending an immutable audit trail entry.
- **Audit Logs**: Append-only; `UPDATE` and `DELETE` operations are blocked by PostgreSQL policies.
- **Safe Logging**: Operational logs use a custom filter (`HealthcareSafeFormatter`) to redact access tokens, authorization headers, passwords, and 10-digit Indian mobile numbers.

---

## 6. Testing

Run the automated backend test suite:
```bash
cd backend
.venv\Scripts\pytest tests -v
```

Current test suite coverage (17 passing tests):
- Application startup and `/health` response validation.
- Missing, expired, and malformed token rejection (401).
- Patient pagination, name search, and demographic CRUD.
- Cross-clinic access denial (403 Forbidden).
- Prescription draft creation and explicit confirmation transition.
- Prevention of silent modifications to confirmed prescriptions (409 Conflict).
- Prescription revision version incrementing and audit log tracking.
- AI dictation parsing with clinical safety rules (no fabricated vitals or inferred diagnoses).
- Multiple-medicine extraction ensuring independent dose, frequency, and duration across all drug rows.
- Devanagari Hindi clinical dictation parsing.
- "Refine with AI" natural language proposals preserving unrelated clinical fields.
- Offline-first idempotent synchronization with duplicate request detection.

---

## 7. Deployment Instructions

### Backend Deployment (Render)
1. Push the repository to GitHub.
2. In Render, create a new **Web Service**.
3. Select your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Add Environment Variables:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_KEY`: Your Supabase Anon/Public Key
   - `SUPABASE_JWT_SECRET`: Your Supabase Project JWT Secret
   - `BACKEND_CORS_ORIGINS`: `["https://your-mediscript-frontend.vercel.app"]`
   - `AI_PROVIDER`: `"none"` (or `"gemini"` / `"openai"`)
   - `AI_API_KEY`: Optional provider API key

### Frontend Deployment (Vercel)
1. In Vercel, import the repository and set **Root Directory** to `frontend`.
2. Framework Preset: `Vite`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com/api/v1`
4. Deploy.

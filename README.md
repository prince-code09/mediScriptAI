
# MediScriptAI — AI-Assisted Clinical Prescription System

MediScriptAI is an AI-assisted prescription and OPD consultation web application designed for local doctors, small clinics, and rural healthcare practitioners in India.

The application aims to simplify clinical documentation through structured prescription creation, patient information management, and AI-assisted workflows.

## Features

- Doctor authentication and account management
- Clinic and patient management
- Structured prescription creation
- AI-assisted clinical documentation
- OPD dashboard and consultation workflows
- Supabase integration for authentication and data storage

> Note: Features may depend on the current application configuration and deployment status.

## Tech Stack

### Frontend
- React
- Vite
- TypeScript

### Backend
- Python
- FastAPI
- Pydantic

### Database and Authentication
- Supabase
- PostgreSQL
- Row Level Security (RLS)

### AI Integration
- Gemini API (when configured)

## Project Structure

```text
MediScriptAI/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── supabase/
│   │   └── migrations/
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── .gitignore
└── README.md
```

The directory structure above is illustrative. Actual files and folders may vary as development continues.

## Prerequisites

Install the following before running the application:

- Node.js and npm
- Python 3.11 or a version supported by the backend dependencies
- Git
- A Supabase project
- A Gemini API key if AI features are enabled

## Environment Configuration

Configure environment variables separately for the frontend and backend.

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Fill in the required values using your own project credentials.

Never commit `.env` files, API keys, passwords, access tokens, or service-role keys to GitHub.

## Running Locally

Run the frontend and backend in separate terminals.

### 1. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

`http://localhost:5173`

### 2. Set Up the Backend

Open another terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install the backend dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the API server using the entry point configured in the project:

```bash
python -m uvicorn app.main:app --reload
```

The backend normally runs at:

`http://127.0.0.1:8000`

If enabled by the backend configuration, API documentation is available at:

`http://127.0.0.1:8000/docs`

## Testing

Run tests using the project's configured test framework.

For a Python backend using pytest:

```bash
cd backend
python -m pytest
```

Test results depend on the current code, environment variables, and database configuration.

## Deployment

The intended deployment architecture is:

- **Frontend:** Vercel
- **Backend:** Render
- **Authentication and Database:** Supabase

Production deployment requires correctly configured environment variables, backend API URLs, Supabase authentication redirect URLs, and Google OAuth settings when Google login is enabled.

Do not use local development URLs such as `localhost` as production URLs.

## Security and Medical Data

- Keep API keys and credentials out of source control.
- Enforce authentication and appropriate authorization for protected operations.
- Apply database Row Level Security policies where required.
- Protect patient records and prescription data.
- Verify applicable medical-record retention requirements before deleting clinical data.
- AI-generated clinical content must be reviewed by a qualified healthcare professional before use.


## License

No license has been specified yet. All rights are reserved by default unless a license is added to this repository.

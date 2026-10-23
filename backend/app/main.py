from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import MediScriptException
from app.schemas.common import HealthResponse
from app.api.v1.api_router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="MediScript Clinical API — Prescription Management for Indian Local Clinics & OPDs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ------------------------------------------------------------------------------
# Configurable CORS Middleware
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Global Exception Handlers
# ------------------------------------------------------------------------------
@app.exception_handler(MediScriptException)
async def mediscript_exception_handler(request: Request, exc: MediScriptException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": exc.code,
            "extra": exc.extra
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        errors.append(f"{field}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error in request payload",
            "code": "REQUEST_VALIDATION_ERROR",
            "errors": errors
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected internal server error occurred. Please contact system support.",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# ------------------------------------------------------------------------------
# Lightweight Health Check Endpoint (Required by prompt)
# ------------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Lightweight health-check endpoint.
    Reports operational status without exposing database connection details or credentials.
    """
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version="1.0.0",
        supabase_configured=settings.is_supabase_configured,
        ai_provider=settings.AI_PROVIDER
    )

# ------------------------------------------------------------------------------
# Include Versioned API Routes (/api/v1/...)
# ------------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "MediScript Clinical API is running",
        "docs": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

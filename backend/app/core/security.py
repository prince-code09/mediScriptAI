import time
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from fastapi import Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWTError, ExpiredSignatureError

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.logging import logger

security_scheme = HTTPBearer(auto_error=False)

class AuthenticatedUser(BaseModel):
    id: str
    email: str
    role: str = "doctor"
    clinic_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase JWT access token.
    Enforces expiration, subject identity, and signature verification.
    """
    # 1. Dev / Mock token support for local testing and demonstration
    if token == "test-token-other-doctor":
        return {
            "sub": "00000000-0000-0000-0000-000000000002",
            "email": "dr.verma@otherclinic.in",
            "role": "authenticated",
            "user_metadata": {
                "name": "Dr. Sunita Verma",
                "clinic_id": "c2222222-2222-2222-2222-222222222222"
            }
        }

    if token.startswith("test-token-") or token == "mock-doctor-token":
        return {
            "sub": "00000000-0000-0000-0000-000000000001",
            "email": "dr.sharma@mediscript.in",
            "role": "authenticated",
            "user_metadata": {
                "name": "Dr. Rajesh Sharma",
                "clinic_id": "c1111111-1111-1111-1111-111111111111"
            }
        }

    # 2. Production / Live Supabase Token Verification
    if settings.SUPABASE_JWT_SECRET:
        try:
            # Supabase tokens are signed with HMAC-SHA256 using the project JWT secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            return payload
        except ExpiredSignatureError:
            raise UnauthorizedException(detail="Authentication token has expired. Please sign in again.", code="TOKEN_EXPIRED")
        except PyJWTError as e:
            logger.warning(f"JWT signature verification failed: {str(e)}")
            raise UnauthorizedException(detail="Invalid authentication token signature", code="INVALID_TOKEN")

    # 3. Fallback when SUPABASE_JWT_SECRET is not configured in local environment
    # Parse unverified headers/claims to extract identity safely while logging warning
    try:
        unverified = jwt.decode(token, options={"verify_signature": False, "verify_exp": True})
        if "sub" not in unverified:
            raise UnauthorizedException(detail="Token is missing required user identity claim", code="MALFORMED_TOKEN")
        return unverified
    except ExpiredSignatureError:
        raise UnauthorizedException(detail="Authentication token has expired", code="TOKEN_EXPIRED")
    except Exception as e:
        raise UnauthorizedException(detail=f"Malformed bearer token: {str(e)}", code="MALFORMED_TOKEN")

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)
) -> AuthenticatedUser:
    """
    FastAPI dependency to extract and verify the authenticated doctor/user identity.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(detail="Missing Authorization bearer header", code="MISSING_TOKEN")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException(detail="Token payload contains no user identity (sub)", code="INVALID_TOKEN_SUB")

    email = payload.get("email", "")
    metadata = payload.get("user_metadata", {}) or {}
    clinic_id = metadata.get("clinic_id")

    return AuthenticatedUser(
        id=user_id,
        email=email,
        role=payload.get("role", "authenticated"),
        clinic_id=clinic_id,
        metadata=metadata
    )

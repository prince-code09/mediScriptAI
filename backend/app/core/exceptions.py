from typing import Optional, Any, Dict
from fastapi import HTTPException, status

class MediScriptException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code or "MEDISCRIPT_ERROR"
        self.extra = extra or {}

class UnauthorizedException(MediScriptException):
    def __init__(self, detail: str = "Invalid or missing authentication credentials", code: str = "UNAUTHORIZED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code=code
        )

class ForbiddenException(MediScriptException):
    def __init__(self, detail: str = "Not authorized to access this clinic or record", code: str = "FORBIDDEN"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code=code
        )

class EntityNotFoundException(MediScriptException):
    def __init__(self, entity: str = "Resource", entity_id: str = "", code: str = "NOT_FOUND"):
        detail = f"{entity} with ID '{entity_id}' was not found" if entity_id else f"{entity} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            code=code
        )

class ConflictException(MediScriptException):
    def __init__(self, detail: str = "Conflict detected with existing record or revision", code: str = "CONFLICT"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code=code
        )

class ValidationException(MediScriptException):
    def __init__(self, detail: str, code: str = "VALIDATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            code=code
        )

class ServiceUnavailableException(MediScriptException):
    def __init__(self, detail: str = "External clinical service or provider is unconfigured or unavailable", code: str = "SERVICE_UNAVAILABLE"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
            code=code
        )

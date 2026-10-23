from app.schemas.common import PaginatedResponse, HealthResponse, MessageResponse
from app.schemas.clinic import ClinicCreate, ClinicUpdate, ClinicResponse, FormatSettingsSchema
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.prescription import (
    MedicineItemSchema,
    VitalsSchema,
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionConfirmRequest,
    PrescriptionReviseRequest,
    PrescriptionAuditLogResponse
)
from app.schemas.ai import (
    SpeechParseRequest,
    SpeechParseResponse,
    ExtractedPrescriptionData,
    ProposedChangeItem,
    RefinePrescriptionRequest,
    RefinePrescriptionResponse
)
from app.schemas.sync import (
    SyncOperationItem,
    SyncBatchRequest,
    SyncOperationResult,
    SyncBatchResponse
)

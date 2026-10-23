/**
 * MediScript Centralized Typed API Client
 * Connects the React frontend to the FastAPI backend.
 * Provides configurable base URL, JWT bearer authorization,
 * structured error handling, network failure resilience, and offline fallback.
 */

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  detail?: any;
}

export class MediScriptApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
  }

  public getAuthToken(): string {
    return localStorage.getItem('mediscript_access_token') || '';
  }

  public setAuthToken(token: string): void {
    localStorage.setItem('mediscript_access_token', token);
  }

  public clearAuthToken(): void {
    localStorage.removeItem('mediscript_access_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch (e) {
          errData = { detail: response.statusText };
        }

        const apiError: ApiError = {
          status: response.status,
          message: errData.detail || errData.message || 'API request failed',
          code: errData.code || `HTTP_${response.status}`,
          detail: errData
        };

        if (response.status === 401) {
          console.warn('[MediScript API] 401 Unauthorized - session expired or token missing.');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mediscript:unauthorized'));
          }
        }

        throw apiError;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      // Network failure / offline
      throw {
        status: 0,
        message: 'Network error or backend unreachable. Running in offline-first mode.',
        code: 'NETWORK_OFFLINE'
      } as ApiError;
    }
  }

  // Health
  async checkHealth(): Promise<{ status: string; service: string; version: string; supabase_configured: boolean }> {
    const rootUrl = this.baseUrl.replace(/\/api\/v1$/, '');
    const res = await fetch(`${rootUrl}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  }

  // Clinics
  async getClinics(): Promise<any[]> {
    return this.request<any[]>('/clinics');
  }

  async getFormatSettings(clinicId: string): Promise<any> {
    return this.request<any>(`/clinics/${clinicId}/format-settings`);
  }

  async updateFormatSettings(clinicId: string, settings: any): Promise<any> {
    return this.request<any>(`/clinics/${clinicId}/format-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async uploadClinicLogo(clinicId: string, logoData: string): Promise<any> {
    return this.request<any>(`/clinics/${clinicId}/logo`, {
      method: 'POST',
      body: JSON.stringify({ logo_data: logoData })
    });
  }

  async removeClinicLogo(clinicId: string): Promise<any> {
    return this.request<any>(`/clinics/${clinicId}/logo`, {
      method: 'DELETE'
    });
  }

  // Patients
  async getPatients(clinicId: string, page = 1, pageSize = 50, q?: string): Promise<{ items: any[]; total: number }> {
    const params = new URLSearchParams({
      clinic_id: clinicId,
      page: page.toString(),
      page_size: pageSize.toString()
    });
    if (q) params.append('q', q);
    return this.request<{ items: any[]; total: number }>(`/patients?${params.toString()}`);
  }

  async createPatient(patient: any): Promise<any> {
    return this.request<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient)
    });
  }

  async updatePatient(patientId: string, patient: any): Promise<any> {
    return this.request<any>(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patient)
    });
  }

  // Prescriptions
  async getPrescriptions(clinicId: string, status?: string): Promise<{ items: any[]; total: number }> {
    const params = new URLSearchParams({ clinic_id: clinicId });
    if (status) params.append('status', status);
    return this.request<{ items: any[]; total: number }>(`/prescriptions?${params.toString()}`);
  }

  async createPrescriptionDraft(prescription: any): Promise<any> {
    return this.request<any>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescription)
    });
  }

  async updatePrescriptionDraft(prescriptionId: string, prescription: any): Promise<any> {
    return this.request<any>(`/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(prescription)
    });
  }

  async confirmPrescription(prescriptionId: string, confirmationNotes?: string): Promise<any> {
    return this.request<any>(`/prescriptions/${prescriptionId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmation_notes: confirmationNotes })
    });
  }

  async revisePrescription(prescriptionId: string, reason: string, updates: any): Promise<any> {
    return this.request<any>(`/prescriptions/${prescriptionId}/revise`, {
      method: 'POST',
      body: JSON.stringify({ reason, updates })
    });
  }

  // AI Voice & Refinement
  async parseSpeech(transcript: string, language = 'en'): Promise<any> {
    return this.request<any>('/ai/parse-speech', {
      method: 'POST',
      body: JSON.stringify({ transcript, language })
    });
  }

  async refinePrescription(currentPrescription: any, doctorInstruction: string, language = 'en'): Promise<any> {
    return this.request<any>('/ai/refine', {
      method: 'POST',
      body: JSON.stringify({
        current_prescription: currentPrescription,
        doctor_instruction: doctorInstruction,
        language
      })
    });
  }

  // Offline-First Sync Batch
  async syncBatch(clinicId: string, operations: any[]): Promise<any> {
    return this.request<any>('/sync/batch', {
      method: 'POST',
      body: JSON.stringify({
        clinic_id: clinicId,
        operations
      })
    });
  }

  // Analytics
  async getWeeklyVisits(clinicId: string): Promise<any[]> {
    return this.request<any[]>(`/analytics/weekly-visits?clinic_id=${clinicId}`);
  }

  // Account Deletion
  async deleteAccount(confirmation: string, password?: string): Promise<{ success: boolean; message: string; retention_notice: string }> {
    return this.request<{ success: boolean; message: string; retention_notice: string }>('/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({
        confirmation,
        password: password || undefined
      })
    });
  }
}

export const apiClient = new MediScriptApiClient();

"""
MediScript Supabase Client Wrapper
Provides authenticated async HTTP access to Supabase PostgREST and Auth APIs,
attaching the user's JWT bearer token so PostgreSQL Row Level Security (RLS) is enforced.
Gracefully handles unconfigured, invalid-key, or network error states by logging warnings
and allowing services to utilize the resilient local clinical store.
"""
from typing import Optional, Dict, Any, List
import httpx
from app.core.config import settings
from app.core.logging import logger

class SupabaseClient:
    def __init__(self):
        self.base_url = settings.SUPABASE_URL.rstrip('/') if settings.SUPABASE_URL else ""
        self.anon_key = settings.SUPABASE_KEY
        self.rest_url = f"{self.base_url}/rest/v1" if self.base_url else ""
        self.auth_url = f"{self.base_url}/auth/v1" if self.base_url else ""

    def get_headers(self, user_token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.anon_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        if user_token:
            headers["Authorization"] = f"Bearer {user_token}"
        elif self.anon_key:
            headers["Authorization"] = f"Bearer {self.anon_key}"
        return headers

    async def get(self, table: str, params: Optional[Dict[str, Any]] = None, user_token: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
        if not settings.is_supabase_configured:
            return None
        url = f"{self.rest_url}/{table}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params, headers=self.get_headers(user_token))
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f"Supabase GET {table} returned {resp.status_code}: {resp.text[:120]}")
                return None
        except Exception as e:
            logger.warning(f"Supabase GET {table} connection error: {type(e).__name__}")
            return None

    async def insert(self, table: str, data: Dict[str, Any], user_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not settings.is_supabase_configured:
            return None
        url = f"{self.rest_url}/{table}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=data, headers=self.get_headers(user_token))
                if resp.status_code in [200, 201]:
                    res = resp.json()
                    return res[0] if isinstance(res, list) and res else res
                logger.warning(f"Supabase INSERT {table} returned {resp.status_code}: {resp.text[:120]}")
                return None
        except Exception as e:
            logger.warning(f"Supabase INSERT {table} connection error: {type(e).__name__}")
            return None

    async def update(self, table: str, id_val: str, data: Dict[str, Any], user_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not settings.is_supabase_configured:
            return None
        url = f"{self.rest_url}/{table}"
        params = {"id": f"eq.{id_val}"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.patch(url, params=params, json=data, headers=self.get_headers(user_token))
                if resp.status_code in [200, 204]:
                    res = resp.json() if resp.text else data
                    return res[0] if isinstance(res, list) and res else res
                logger.warning(f"Supabase UPDATE {table} returned {resp.status_code}: {resp.text[:120]}")
                return None
        except Exception as e:
            logger.warning(f"Supabase UPDATE {table} connection error: {type(e).__name__}")
            return None

    async def delete(self, table: str, id_val: str, user_token: Optional[str] = None) -> bool:
        if not settings.is_supabase_configured:
            return False
        url = f"{self.rest_url}/{table}"
        params = {"id": f"eq.{id_val}"}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.delete(url, params=params, headers=self.get_headers(user_token))
                return resp.status_code in [200, 204]
        except Exception as e:
            logger.warning(f"Supabase DELETE {table} connection error: {type(e).__name__}")
            return False

supabase_client = SupabaseClient()

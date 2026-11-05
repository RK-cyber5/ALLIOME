from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class CrustdataError(Exception):
    code: str
    message: str
    status_code: int | None = None
    retryable: bool = False
    metadata: dict[str, Any] | None = None


class CrustdataClient:
    """Small async REST client; the browser never receives its API key."""

    base_url = "https://api.crustdata.com"

    def __init__(self, api_key: str | None, *, timeout: float = 20, max_concurrency: int = 3,
                 transport: httpx.AsyncBaseTransport | None = None):
        self.api_key = api_key
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout, transport=transport)

    async def close(self) -> None:
        await self.client.aclose()

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise CrustdataError("configuration_missing", "CRUSTDATA_API_KEY is not configured")
        return {"authorization": f"Bearer {self.api_key}", "content-type": "application/json", "x-api-version": "2025-11-01"}

    async def request(self, method: str, path: str, *, payload: dict[str, Any] | None = None) -> Any:
        attempts = 0
        while True:
            try:
                async with self.semaphore:
                    response = await self.client.request(method, path, headers=self._headers(), json=payload)
            except httpx.TimeoutException as exc:
                error = CrustdataError("timeout", "Crustdata request timed out", retryable=True)
            except httpx.HTTPError as exc:
                error = CrustdataError("network_error", str(exc), retryable=True)
            else:
                if response.is_success:
                    return self._json_or_error(response)
                error = self._http_error(response)
            attempts += 1
            if not error.retryable or attempts >= 3:
                raise error
            retry_after = (error.metadata or {}).get("retry_after")
            await asyncio.sleep(min(float(retry_after) if retry_after else 2 ** (attempts - 1), 8))

    @staticmethod
    def _json_or_error(response: httpx.Response) -> Any:
        try:
            return response.json()
        except ValueError as exc:
            raise CrustdataError("malformed_response", "Crustdata returned invalid JSON", response.status_code) from exc

    @staticmethod
    def _http_error(response: httpx.Response) -> CrustdataError:
        try:
            body = response.json()
        except ValueError:
            body = {"detail": response.text[:500]}
        nested_error = body.get("error") if isinstance(body.get("error"), dict) else {}
        detail = str(body.get("detail") or body.get("message") or nested_error.get("message") or "Crustdata request failed")
        code_map = {401: "authentication_failed", 402: "credits_exhausted", 403: "permission_denied", 429: "rate_limited"}
        code = code_map.get(response.status_code, "provider_error")
        retryable = response.status_code == 429 or response.status_code >= 500
        return CrustdataError(code, detail, response.status_code, retryable, {"retry_after": response.headers.get("retry-after"), "provider_body": body})

    async def credits(self) -> Any:
        return await self.request("GET", "/account/credits")

    async def search_companies(self, payload: dict[str, Any]) -> Any:
        return await self.request("POST", "/company/search", payload=payload)

    async def identify_companies(self, payload: dict[str, Any]) -> Any:
        return await self.request("POST", "/company/identify", payload=payload)

    async def enrich_companies(self, payload: dict[str, Any]) -> Any:
        return await self.request("POST", "/company/enrich", payload=payload)

    async def search_people(self, payload: dict[str, Any]) -> Any:
        return await self.request("POST", "/person/search", payload=payload)

    async def enrich_people(self, payload: dict[str, Any]) -> Any:
        return await self.request("POST", "/person/enrich", payload=payload)

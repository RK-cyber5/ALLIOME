from __future__ import annotations

import httpx
import pytest

from app.crustdata_client import CrustdataClient


@pytest.mark.parametrize(
    ("status", "code", "retryable"),
    [(401, "authentication_failed", False), (402, "credits_exhausted", False), (403, "permission_denied", False), (429, "rate_limited", True), (500, "provider_error", True)],
)
def test_http_error_classification(status, code, retryable):
    response = httpx.Response(status, json={"message": "provider message"}, request=httpx.Request("POST", "https://api.crustdata.com/company/search"))
    error = CrustdataClient._http_error(response)
    assert (error.code, error.retryable) == (code, retryable)


def test_malformed_response_is_reported():
    response = httpx.Response(200, content=b"not-json", request=httpx.Request("POST", "https://api.crustdata.com/company/search"))
    with pytest.raises(Exception) as exc_info:
        CrustdataClient._json_or_error(response)
    assert getattr(exc_info.value, "code", None) == "malformed_response"


def test_nested_provider_error_message_is_extracted():
    response = httpx.Response(400, json={"error": {"message": "unknown fields in the request"}}, request=httpx.Request("POST", "https://api.crustdata.com/company/search"))
    error = CrustdataClient._http_error(response)
    assert error.message == "unknown fields in the request"

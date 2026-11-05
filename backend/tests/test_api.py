import asyncio
import json

from fastapi import HTTPException
from starlette.requests import Request

from app.main import http_error


def test_http_errors_use_structured_json():
    request = Request({"type": "http", "method": "GET", "path": "/missing", "headers": []})
    response = asyncio.run(http_error(request, HTTPException(status_code=404, detail="Analysis not found")))
    assert response.status_code == 404
    assert json.loads(response.body) == {"error": {"code": "request_error", "message": "Analysis not found"}}

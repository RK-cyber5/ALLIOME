from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class AnalysisRepository:
    def __init__(self, path: Path):
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    progress INTEGER NOT NULL,
                    request_json TEXT NOT NULL,
                    report_json TEXT,
                    warnings_json TEXT NOT NULL DEFAULT '[]',
                    errors_json TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS stage_outputs (
                    analysis_id TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    output_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    PRIMARY KEY (analysis_id, stage),
                    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
                );
                """
            )

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def create(self, analysis_id: str, request: dict[str, Any]) -> None:
        now = utcnow()
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO analyses VALUES (?, ?, ?, ?, ?, NULL, '[]', '[]', ?, ?)",
                (analysis_id, "queued", "queued", 0, json.dumps(request), now, now),
            )

    def get(self, analysis_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
        return self._decode(row) if row else None

    def update(self, analysis_id: str, *, status: str | None = None, stage: str | None = None,
               progress: int | None = None, report: dict[str, Any] | None = None,
               warning: dict[str, Any] | None = None, error: dict[str, Any] | None = None,
               clear_errors: bool = False) -> None:
        item = self.get(analysis_id)
        if not item:
            raise KeyError(analysis_id)
        warnings = item["warnings"] + ([warning] if warning else [])
        errors = [] if clear_errors else item["errors"] + ([error] if error else [])
        with self._connect() as conn:
            conn.execute(
                """UPDATE analyses SET status=?, stage=?, progress=?, report_json=?, warnings_json=?, errors_json=?, updated_at=? WHERE id=?""",
                (status or item["status"], stage or item["stage"], progress if progress is not None else item["progress"],
                 json.dumps(report) if report is not None else (json.dumps(item["report"]) if item["report"] is not None else None),
                 json.dumps(warnings), json.dumps(errors), utcnow(), analysis_id),
            )

    def checkpoint(self, analysis_id: str, stage: str, output: Any) -> None:
        with self._connect() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO stage_outputs VALUES (?, ?, ?, ?)",
                (analysis_id, stage, json.dumps(output), utcnow()),
            )

    def output(self, analysis_id: str, stage: str) -> Any | None:
        with self._connect() as conn:
            row = conn.execute("SELECT output_json FROM stage_outputs WHERE analysis_id=? AND stage=?", (analysis_id, stage)).fetchone()
        return json.loads(row["output_json"]) if row else None

    @staticmethod
    def _decode(row: sqlite3.Row) -> dict[str, Any]:
        data = dict(row)
        data["request"] = json.loads(data.pop("request_json"))
        data["report"] = json.loads(data["report_json"]) if data["report_json"] else None
        data.pop("report_json")
        data["warnings"] = json.loads(data.pop("warnings_json"))
        data["errors"] = json.loads(data.pop("errors_json"))
        return data

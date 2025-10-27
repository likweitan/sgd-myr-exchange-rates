"""File-related helpers for project automation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def resolve_path(*parts: str) -> Path:
    """Return an absolute path anchored at the repository root."""
    return PROJECT_ROOT.joinpath(*parts).resolve()


def load_json(path: str | Path) -> Any:
    """Load JSON from disk."""
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str | Path, data: Any) -> None:
    """Write JSON to disk."""
    with Path(path).open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, sort_keys=True)
        handle.write("\n")

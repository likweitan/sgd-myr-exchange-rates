"""PocketBase client helpers for automation scripts."""

from __future__ import annotations

from typing import Any, Sequence

import requests

from .config import (
    POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD,
    POCKETBASE_COLLECTION,
    POCKETBASE_URL,
    pocketbase_configured,
)

_cached_token: str | None = None


class PocketBaseConfigurationError(RuntimeError):
    """Raised when PocketBase URL is missing or invalid."""


def _get_auth_token() -> str | None:
    """Authenticate as admin and return a token, or None if no credentials."""
    global _cached_token

    if not POCKETBASE_ADMIN_EMAIL or not POCKETBASE_ADMIN_PASSWORD:
        return None

    if _cached_token:
        return _cached_token

    resp = requests.post(
        f"{POCKETBASE_URL}/api/collections/_superusers/auth-with-password",
        json={
            "identity": POCKETBASE_ADMIN_EMAIL,
            "password": POCKETBASE_ADMIN_PASSWORD,
        },
        timeout=30,
    )
    resp.raise_for_status()
    _cached_token = resp.json().get("token")
    return _cached_token


def _get_headers() -> dict[str, str]:
    """Return headers dict, including auth token if available."""
    headers: dict[str, str] = {"Content-Type": "application/json"}
    token = _get_auth_token()
    if token:
        headers["Authorization"] = token
    return headers


def _ensure_configured() -> None:
    if not pocketbase_configured():
        raise PocketBaseConfigurationError(
            "PocketBase URL is not configured. Check your environment variables."
        )


def insert_rows(rows: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    """Insert rows into the exchange rates collection."""
    if not rows:
        return []

    _ensure_configured()
    headers = _get_headers()
    results: list[dict[str, Any]] = []

    for row in rows:
        resp = requests.post(
            f"{POCKETBASE_URL}/api/collections/{POCKETBASE_COLLECTION}/records",
            json=row,
            headers=headers,
            timeout=30,
        )
        resp.raise_for_status()
        results.append(resp.json())

    return results


def fetch_rows(limit: int | None = None) -> list[dict[str, Any]]:
    """Fetch rows ordered by most recent first."""
    _ensure_configured()
    headers = _get_headers()

    params: dict[str, str] = {
        "sort": "-created",
        "perPage": str(limit if limit and limit > 0 else 200),
    }

    resp = requests.get(
        f"{POCKETBASE_URL}/api/collections/{POCKETBASE_COLLECTION}/records",
        params=params,
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("items", [])

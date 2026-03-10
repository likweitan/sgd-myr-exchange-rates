"""Project-wide configuration loaded from environment variables."""

from __future__ import annotations

import os
from typing import Dict

from dotenv import load_dotenv

from .file_utils import resolve_path

_DOTENV_LOADED = False


def load_dotenv_if_needed() -> None:
    """Load environment variables from .env if they have not been loaded."""
    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return

    # Attempt to load from current working directory first.
    load_dotenv()

    # If required values are still missing, look for repository root .env.
    if not os.getenv("POCKETBASE_URL"):
        root_env = resolve_path(".env")
        if root_env.exists():
            load_dotenv(dotenv_path=root_env)

    _DOTENV_LOADED = True


def _get_env(key: str, default: str | None = None) -> str | None:
    load_dotenv_if_needed()
    return os.getenv(key, default)


POCKETBASE_URL: str | None = _get_env("POCKETBASE_URL")
POCKETBASE_ADMIN_EMAIL: str | None = _get_env("POCKETBASE_ADMIN_EMAIL")
POCKETBASE_ADMIN_PASSWORD: str | None = _get_env("POCKETBASE_ADMIN_PASSWORD")
POCKETBASE_COLLECTION: str = _get_env("POCKETBASE_COLLECTION", "exchange_rates") or "exchange_rates"

BASE_CURRENCY: str = _get_env("BASE_CURRENCY", "SGD") or "SGD"
TARGET_CURRENCY: str = _get_env("TARGET_CURRENCY", "MYR") or "MYR"


def pocketbase_configured() -> bool:
    """Return True if PocketBase URL appears to be configured."""
    return bool(
        POCKETBASE_URL
        and "YOUR_POCKETBASE_URL" not in POCKETBASE_URL
    )


def get_environment_variables() -> Dict[str, str | None]:
    """Return a mapping of environment variables relevant to automation."""
    return {
        "POCKETBASE_URL": POCKETBASE_URL,
        "POCKETBASE_ADMIN_EMAIL": POCKETBASE_ADMIN_EMAIL,
        "POCKETBASE_COLLECTION": POCKETBASE_COLLECTION,
        "BASE_CURRENCY": BASE_CURRENCY,
        "TARGET_CURRENCY": TARGET_CURRENCY,
    }

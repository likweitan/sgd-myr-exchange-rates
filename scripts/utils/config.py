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
    if not os.getenv("SUPABASE_URL"):
        root_env = resolve_path(".env")
        if root_env.exists():
            load_dotenv(dotenv_path=root_env)

    _DOTENV_LOADED = True


def _get_env(key: str, default: str | None = None) -> str | None:
    load_dotenv_if_needed()
    return os.getenv(key, default)


SUPABASE_URL: str | None = _get_env("SUPABASE_URL")
SUPABASE_KEY: str | None = _get_env("SUPABASE_KEY")
SUPABASE_TABLE: str = _get_env("SUPABASE_TABLE", "exchange_rates") or "exchange_rates"

BASE_CURRENCY: str = _get_env("BASE_CURRENCY", "SGD") or "SGD"
TARGET_CURRENCY: str = _get_env("TARGET_CURRENCY", "MYR") or "MYR"


def supabase_configured() -> bool:
    """Return True if Supabase variables appear to be configured."""
    return bool(
        SUPABASE_URL
        and SUPABASE_KEY
        and "YOUR_SUPABASE_URL" not in SUPABASE_URL
        and "YOUR_SUPABASE_KEY" not in SUPABASE_KEY
    )


def get_environment_variables() -> Dict[str, str | None]:
    """Return a mapping of environment variables relevant to automation."""
    return {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_KEY": SUPABASE_KEY,
        "SUPABASE_TABLE": SUPABASE_TABLE,
        "BASE_CURRENCY": BASE_CURRENCY,
        "TARGET_CURRENCY": TARGET_CURRENCY,
    }

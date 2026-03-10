"""Helper utilities shared across project scripts."""

from .config import (  # noqa: F401
    BASE_CURRENCY,
    POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_COLLECTION,
    POCKETBASE_URL,
    TARGET_CURRENCY,
    load_dotenv_if_needed,
    pocketbase_configured,
)
from .file_utils import load_json, write_json  # noqa: F401
from .rates_scraper import collect_rates  # noqa: F401
from .rates_service import get_latest_rates, get_rates, insert_rates  # noqa: F401
from .pocketbase_client import PocketBaseConfigurationError  # noqa: F401

__all__ = [
    "BASE_CURRENCY",
    "POCKETBASE_ADMIN_EMAIL",
    "POCKETBASE_COLLECTION",
    "POCKETBASE_URL",
    "TARGET_CURRENCY",
    "PocketBaseConfigurationError",
    "collect_rates",
    "get_latest_rates",
    "get_rates",
    "insert_rates",
    "load_dotenv_if_needed",
    "load_json",
    "pocketbase_configured",
    "write_json",
]

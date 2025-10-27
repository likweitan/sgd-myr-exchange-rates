"""Helpers for interacting with Vercel configuration and deployments."""

from __future__ import annotations

from typing import Dict

from .config import get_environment_variables


def generate_vercel_env_payload() -> Dict[str, str]:
    """Return a mapping suitable for seeding Vercel environment variables."""
    env_vars = {}
    for key, value in get_environment_variables().items():
        if value:
            env_vars[key] = value
    return env_vars

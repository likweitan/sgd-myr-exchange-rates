"""CLI script to run scraping and deployment tasks."""

from __future__ import annotations

import argparse
from typing import List

from .utils import (
    SupabaseConfigurationError,
    collect_rates,
    insert_rates,
    supabase_configured,
)


def _scrape_and_insert(dry_run: bool = False) -> int:
    rates = collect_rates()
    if not rates:
        print("No rates collected; nothing to insert.")
        return 0

    if dry_run:
        print("Dry run enabled; scraped rates will not be inserted.")
        for rate in rates:
            print(rate)
        return 0

    if not supabase_configured():
        print("Supabase credentials not configured; cannot insert rates.")
        return 1

    try:
        response = insert_rates(rates)
        print("Inserted into Supabase:", response)
        return 0
    except SupabaseConfigurationError as exc:
        print(f"Supabase configuration error: {exc}")
        return 1
    except Exception as exc:  # pragma: no cover - defensive logging path
        print(f"Failed to insert into Supabase: {exc}")
        return 1


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Deployment helpers.")
    parser.add_argument(
        "--scrape",
        action="store_true",
        help="Collect exchange rates and push to Supabase.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Collect rates but skip inserts.",
    )

    args = parser.parse_args(argv)

    exit_code = 0
    if args.scrape:
        exit_code = _scrape_and_insert(dry_run=args.dry_run)

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())

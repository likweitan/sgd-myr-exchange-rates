"""Utility entry point for running project test tasks from Python."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def run_command(command: list[str], cwd: Path) -> int:
    process = subprocess.Popen(command, cwd=str(cwd))
    process.wait()
    return process.returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run automated tests.")
    parser.add_argument(
        "--script",
        default="test",
        help="npm script to execute (default: test)",
    )
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[1]
    code = run_command(["npm", "run", args.script], cwd=repo_root)
    if code != 0:
        print(f"Test command exited with code {code}", file=sys.stderr)
    return code


if __name__ == "__main__":
    raise SystemExit(main())

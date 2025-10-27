"""Utility entry point for running project build tasks from Python."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def run_command(command: list[str], cwd: Path) -> int:
    """Run a shell command and stream output."""
    process = subprocess.Popen(command, cwd=str(cwd))
    process.wait()
    return process.returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run project build pipeline.")
    parser.add_argument(
        "--script",
        default="build",
        help="npm script to execute (default: build)",
    )
    args = parser.parse_args(argv)

    repo_root = Path(__file__).resolve().parents[1]
    code = run_command(["npm", "run", args.script], cwd=repo_root)
    if code != 0:
        print(f"Build command exited with code {code}", file=sys.stderr)
    return code


if __name__ == "__main__":
    raise SystemExit(main())

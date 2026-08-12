#!/usr/bin/env python3
"""Zip neon-adda-theme/ into neon-adda-theme.zip for Shopify upload.

Run: python3 scripts/package_theme.py
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "neon-adda-theme"
OUT = ROOT / "neon-adda-theme.zip"

EXCLUDE_DIRS = {".git", "__pycache__"}
EXCLUDE_SUFFIXES = {".pyc"}


def main():
    if not THEME.exists():
        raise SystemExit("neon-adda-theme/ not found — run the plan tasks first.")

    count = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(THEME.rglob("*")):
            if path.is_dir():
                continue
            if any(part in EXCLUDE_DIRS for part in path.relative_to(THEME).parts):
                continue
            if path.suffix in EXCLUDE_SUFFIXES:
                continue
            zf.write(path, path.relative_to(THEME))
            count += 1

    print(f"Packaged {count} files -> {OUT.name} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

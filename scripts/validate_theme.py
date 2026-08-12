#!/usr/bin/env python3
"""Local structural validation for the Neon Adda Shopify theme.

Checks that don't require a live Shopify store. Run from the workspace root:
    python3 scripts/validate_theme.py
Exit code 0 = all checks pass.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "neon-adda-theme"

# The sections/snippets written by this plan. Class parity is checked
# against these only, so Horizon's own classes don't flood the report.
OUR_FILES = [
    "sections/neon-hero.liquid",
    "sections/trust-bar.liquid",
    "sections/occasions.liquid",
    "sections/how-it-works.liquid",
    "sections/stats.liquid",
    "sections/reviews.liquid",
    "sections/faq.liquid",
    "sections/cta-band.liquid",
    "sections/neon-page-hero.liquid",
    "sections/contact-info.liquid",
    "sections/neon-customizer.liquid",
    "snippets/na-wa-float.liquid",
]

REQUIRED = [
    "layout/theme.liquid",
    "config/settings_schema.json",
    "config/settings_data.json",
    "templates/index.json",
    "assets/neonadda.css",
    "assets/neonadda.js",
]

# Classes added by JS or belonging to the Horizon/system layer that our
# section markup may legitimately use without being defined in neonadda.css.
ALLOWLIST = {
    "shopify-section", "section", "section-background", "section--page-width",
    "spacing-style", "color-custom", "page-width", "page-width-narrow",
    "page-width-normal", "page-width-wide", "page-width-content",
    "reveal", "is-in", "is-off", "neon", "neon--sm", "neon--boot",
    "data-ph", "na-highlight-ph",
}

errors = []


def err(msg):
    errors.append(msg)
    print(f"  FAIL: {msg}")


def ok(msg):
    print(f"  ok: {msg}")


def strip_jsonc(text):
    # Shopify JSON files (templates, locales) may contain comments: a
    # leading /* ... */ header and // line comments. Remove them, but only
    # outside strings so values like "https://…" survive intact.
    out = []
    i = 0
    n = len(text)
    in_str = False
    while i < n:
        c = text[i]
        if in_str:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(text[i + 1])
                i += 1
            elif c == '"':
                in_str = False
            i += 1
            continue
        if c == '"':
            in_str = True
            out.append(c)
            i += 1
            continue
        if c == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i = min(i + 2, n)
            continue
        out.append(c)
        i += 1
    return "".join(out)


def check_json(path):
    try:
        json.loads(strip_jsonc(path.read_text(encoding="utf-8")))
        ok(f"JSON {path.relative_to(THEME)}")
        return True
    except json.JSONDecodeError as e:
        err(f"JSON {path.relative_to(THEME)}: {e}")
        return False


def check_liquid_balance(path):
    text = path.read_text(encoding="utf-8")
    opens = text.count("{%")
    closes = text.count("%}")
    if opens != closes:
        err(f"Liquid tag balance {path.relative_to(THEME)}: {opens} opens vs {closes} closes")
    else:
        ok(f"Liquid balance {path.relative_to(THEME)} ({opens} tags)")


def check_schema(path):
    text = path.read_text(encoding="utf-8")
    m = re.search(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", text, re.S)
    if not m:
        err(f"No schema block in {path.relative_to(THEME)}")
        return
    try:
        json.loads(m.group(1))
        ok(f"Schema JSON {path.relative_to(THEME)}")
    except json.JSONDecodeError as e:
        err(f"Schema JSON {path.relative_to(THEME)}: {e}")


def extract_classes(text):
    classes = set()
    for m in re.finditer(r'class="([^"]+)"', text):
        for token in m.group(1).split():
            if "{{" in token or "{%" in token:
                continue
            classes.add(token)
    return classes


def check_class_parity():
    css_path = THEME / "assets" / "neonadda.css"
    if not css_path.exists():
        print("  skip: class parity (assets/neonadda.css not created yet)")
        return
    css_text = css_path.read_text(encoding="utf-8")
    missing = {}
    for rel in OUR_FILES:
        path = THEME / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        # Only the markup portion counts; strip the schema block.
        text = re.sub(r"{%\s*schema\s*%}.*?{%\s*endschema\s*%}", "", text, flags=re.S)
        for cls in extract_classes(text):
            if cls in ALLOWLIST:
                continue
            if cls not in css_text:
                missing.setdefault(rel, []).append(cls)
    if missing:
        for rel, classes in missing.items():
            err(f"Classes in {rel} missing from neonadda.css: {sorted(classes)}")
    else:
        ok("Class parity (all section classes defined in neonadda.css)")


def check_node():
    if not (THEME / "assets" / "neonadda.js").exists():
        return
    try:
        subprocess.run(
            ["node", "--check", str(THEME / "assets" / "neonadda.js")],
            check=True, capture_output=True, text=True,
        )
        ok("node --check assets/neonadda.js")
    except FileNotFoundError:
        print("  skip: node not installed (JS parse check skipped)")
    except subprocess.CalledProcessError as e:
        err(f"node --check: {e.stderr.strip()}")


def main():
    if not THEME.exists():
        print("Neon Adda theme directory not found. Run Task 1 first.")
        sys.exit(1)

    print("== Required files ==")
    for rel in REQUIRED:
        path = THEME / rel
        if path.exists():
            ok(f"{rel}")
        else:
            err(f"missing required file {rel}")

    print("== JSON ==")
    for path in sorted((THEME / "templates").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "config").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "sections").glob("*.json")):
        check_json(path)
    for path in sorted((THEME / "locales").glob("*.json")):
        check_json(path)

    print("== Section schemas + Liquid balance ==")
    for rel in OUR_FILES:
        path = THEME / rel
        if not path.exists():
            err(f"missing {rel}")
            continue
        check_schema(path)
        check_liquid_balance(path)
    check_liquid_balance(THEME / "layout" / "theme.liquid")

    print("== Class parity ==")
    check_class_parity()

    print("== JS ==")
    check_node()

    if errors:
        print(f"\n{len(errors)} problem(s) found.")
        sys.exit(1)
    print("\nAll checks passed.")


if __name__ == "__main__":
    main()

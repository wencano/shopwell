#!/usr/bin/env python3
"""Exit 0 if shopwell.seed.json order_items reference valid products; exit 1 otherwise."""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parent
    path = root / "shopwell.seed.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    products = data.get("products") or []
    items = data.get("order_items") or []
    by_id = {p["id"]: p for p in products}

    errors: list[str] = []
    for item in items:
        pid = item.get("product_id")
        if pid not in by_id:
            errors.append(f"order_item {item.get('id')}: unknown product_id {pid}")
            continue
        exp_title = by_id[pid].get("title")
        got = item.get("title_snapshot")
        if exp_title != got:
            errors.append(
                f"order_item {item.get('id')}: title_snapshot {got!r} != product.title {exp_title!r}"
            )

    if errors:
        print("seed validation failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"OK: {len(items)} order_items, {len(products)} products")
    return 0


if __name__ == "__main__":
    sys.exit(main())

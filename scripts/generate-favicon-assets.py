#!/usr/bin/env python3
"""Generate favicon.ico, icon.png (512), apple-icon.png (180) from square brand PNG.

Source: public/badwr-logo-square.png (upscaled to 1240×1240 for sharper downscales).
Outputs: public/* and src/app/icon.png + src/app/favicon.ico
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "badwr-logo-square.png"
TARGET = 1240
def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source image: {SRC}")

    base = Image.open(SRC).convert("RGBA")
    if base.size[0] != base.size[1]:
        raise SystemExit("Source logo must be square")
    base_1240 = base.resize((TARGET, TARGET), Image.Resampling.LANCZOS)

    public = ROOT / "public"
    app = ROOT / "src" / "app"
    public.mkdir(parents=True, exist_ok=True)
    app.mkdir(parents=True, exist_ok=True)

    icon512 = base_1240.resize((512, 512), Image.Resampling.LANCZOS)
    icon512.save(public / "icon.png", "PNG", optimize=True)
    icon512.save(app / "icon.png", "PNG", optimize=True)

    apple = base_1240.resize((180, 180), Image.Resampling.LANCZOS)
    apple.save(public / "apple-icon.png", "PNG", optimize=True)

    # Largest master for ICO; Pillow embeds smaller sizes from `sizes` list.
    ico_master = base_1240.resize((48, 48), Image.Resampling.LANCZOS)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48)]
    for dest in (public / "favicon.ico", app / "favicon.ico"):
        ico_master.save(dest, format="ICO", sizes=ico_sizes)

    print("Wrote:", public / "favicon.ico", public / "icon.png", public / "apple-icon.png")
    print("Wrote:", app / "favicon.ico", app / "icon.png")


if __name__ == "__main__":
    main()

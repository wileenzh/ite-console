#!/usr/bin/env python3
"""Draw every icon and splash from the PSOC logo (resources/brand/*.png).
   python3 scripts/make-icons.py   then   npx capacitor-assets generate --android --ios ...   (npm run icons does both)
Outputs: resources/ (Capacitor sources), ../app/icons/ (installable web app) and the notification icon."""
from PIL import Image
import pathlib
R = pathlib.Path(__file__).resolve().parent.parent / "resources"; B = R / "brand"; APP = R.parent.parent / "app" / "icons"
mark, mark_d, full_d = Image.open(B / "psoc_mark.png"), Image.open(B / "psoc_mark_dark.png"), Image.open(B / "psoc_full_dark.png")
def place(canvas, img, frac, cy=0.5):
    W, H = canvas.size; s = min(W * frac / img.width, H * frac / img.height); im = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
    canvas.alpha_composite(im, ((W - im.width) // 2, round(H * cy - im.height / 2))); return canvas
def icon(size, frac=0.66, bg=(255, 255, 255, 255)): return place(Image.new("RGBA", (size, size), bg), mark, frac)
icon(1024).convert("RGB").save(R / "icon-only.png")
place(Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)), mark, 0.5).save(R / "icon-foreground.png")
Image.new("RGB", (1024, 1024), "white").save(R / "icon-background.png")
for n in ("splash.png", "splash-dark.png"): place(Image.new("RGBA", (2732, 2732), (12, 22, 38, 255)), full_d, 0.26).convert("RGB").save(R / n)
st = place(Image.new("RGBA", (96, 96), (0, 0, 0, 0)), mark, 0.86); w = Image.new("RGBA", st.size, (255, 255, 255, 0)); w.putalpha(st.getchannel("A")); w.save(R / "ic_stat_ite.png")
APP.mkdir(parents=True, exist_ok=True)
for n, s in (("icon-180.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)): icon(s, 0.7).convert("RGB").save(APP / n)
icon(512, 0.5).convert("RGB").save(APP / "icon-maskable-512.png"); icon(32, 0.86).save(APP / "favicon-32.png")
print("icons drawn from the PSOC logo")

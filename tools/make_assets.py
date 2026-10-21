from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
W, H = 1200, 630
random.seed(21)
img = Image.new("RGB", (W, H), (7, 3, 5))
d = ImageDraw.Draw(img)

glow = Image.new("RGB", (W, H), (0, 0, 0))
gd = ImageDraw.Draw(glow)
for r in range(420, 0, -14):
    v = int(24 * (1 - r / 420) ** 1.8)
    gd.ellipse((W // 2 - r, H // 2 - r - 20, W // 2 + r, H // 2 + r - 20), fill=(v * 2, v // 3, v // 2))
img = Image.blend(img, glow, 0.55)
d = ImageDraw.Draw(img)

for _ in range(900):
    t = random.random() * math.tau
    x = 16 * math.sin(t) ** 3
    y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
    px = W * 0.5 + x * 13 + random.uniform(-3, 3)
    py = 250 - y * 13 + random.uniform(-3, 3)
    rr = random.uniform(0.7, 2.4)
    a = random.randint(40, 150)
    d.ellipse((px - rr, py - rr, px + rr, py + rr), fill=(255, int(90 + random.random() * 80), int(110 + random.random() * 60), a))

heart = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hd = ImageDraw.Draw(heart)
for _ in range(1800):
    t = random.random() * math.tau
    r = random.uniform(0, 0.9)
    x = 16 * math.sin(t) ** 3 * r
    y = (13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)) * r
    px = W * 0.5 + x * 13
    py = 250 - y * 13
    rr = random.uniform(0.5, 1.8)
    hd.ellipse((px - rr, py - rr, px + rr, py + rr), fill=(255, 90, 125, random.randint(15, 55)))
heart = heart.filter(ImageFilter.GaussianBlur(1.2))
img = Image.alpha_composite(img.convert("RGBA"), heart).convert("RGB")
d = ImageDraw.Draw(img)

serif_path = r"C:\Windows\Fonts\simsun.ttc"
sans_path = r"C:\Windows\Fonts\msyh.ttc"
try:
    f1 = ImageFont.truetype(serif_path, 54)
    f2 = ImageFont.truetype(sans_path, 22)
except Exception:
    f1 = ImageFont.load_default()
    f2 = f1


def center_text(y, text, font, fill):
    bbox = d.textbbox((0, 0), text, font=font)
    d.text(((W - (bbox[2] - bbox[0])) / 2, y), text, font=font, fill=fill)


center_text(492, "有句话想对你说", f1, (255, 247, 248))
center_text(568, "点开，收下这份只属于你的心意", f2, (255, 214, 222))

out = ROOT / "assets" / "img" / "share-cover.jpg"
img.save(out, quality=90)
print("saved", out)

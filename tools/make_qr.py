"""生成分享二维码卡片：python tools/make_qr.py"""

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFilter, ImageFont

URL = "https://zziks-031025.github.io/LOVE/"
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / "assets" / "img" / "qr-card.png"

INK = (255, 247, 248)
MUTED = (214, 166, 176)
ROSE = (255, 143, 163)
DEEP = (7, 3, 5)
CARD = (255, 247, 248)


def font(path, size):
    return ImageFont.truetype(path, size)


def make_qr(size):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=3,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color=(20, 6, 10), back_color=CARD).convert("RGB")
    return img.resize((size, size), Image.Resampling.NEAREST)


def main():
    width, height = 1080, 1440
    image = Image.new("RGB", (width, height), DEEP)
    draw = ImageDraw.Draw(image)

    # 背景的柔和玫瑰光，从一个偏上的中心散开。
    glow = Image.new("RGB", (width, height), DEEP)
    gd = ImageDraw.Draw(glow)
    for i in range(260, 0, -2):
        alpha = int(20 * (1 - i / 260) ** 2)
        color = (7 + alpha, 3 + alpha // 3, 5 + alpha // 2)
        gd.ellipse((540 - i * 2.4, 440 - i * 1.7, 540 + i * 2.4, 440 + i * 1.7), fill=color)
    image = Image.blend(image, glow, 0.82)
    draw = ImageDraw.Draw(image)

    title_font = font(r"C:\Windows\Fonts\STSONG.TTF", 86)
    small_font = font(r"C:\Windows\Fonts\msyh.ttc", 26)
    tiny_font = font(r"C:\Windows\Fonts\msyh.ttc", 19)
    url_font = font(r"C:\Windows\Fonts\Deng.ttf", 21)

    draw.text((540, 170), "P R I V A T E   ·   F O R   Y O U", anchor="mm", font=tiny_font, fill=MUTED)
    draw.text((540, 280), "有句话想对你说", anchor="mm", font=title_font, fill=INK)
    draw.text((540, 366), "把想说的话，收进一颗心里。", anchor="mm", font=small_font, fill=MUTED)

    qr_size = 640
    card_size = 760
    card_left = (width - card_size) // 2
    card_top = 470
    # 卡片底部的柔和阴影。
    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (card_left + 8, card_top + 18, card_left + card_size + 8, card_top + card_size + 18),
        radius=38,
        fill=(0, 0, 0, 110),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    image = Image.alpha_composite(image.convert("RGBA"), shadow).convert("RGB")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (card_left, card_top, card_left + card_size, card_top + card_size),
        radius=38,
        fill=CARD,
    )

    qr = make_qr(qr_size)
    qr_left = (width - qr_size) // 2
    qr_top = card_top + (card_size - qr_size) // 2
    image.paste(qr, (qr_left, qr_top))

    draw.text((540, 1306), "长按识别二维码，打开这份心意", anchor="mm", font=small_font, fill=INK)
    draw.text((540, 1352), URL, anchor="mm", font=url_font, fill=(169, 118, 130))

    image.save(OUT, quality=94)
    print(OUT)


if __name__ == "__main__":
    main()

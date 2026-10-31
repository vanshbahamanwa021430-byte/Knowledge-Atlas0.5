# Builds every app icon from the chosen artwork (resources/icon-source.jpg: a rounded gradient tile with a white
# book-and-globe glyph on a white background). Needs Python with Pillow and numpy. Run: python3 scripts/icon-from-image.py
# - full-bleed square (iOS, apple-touch, maskable): the tile's gradient is fitted and extended to the corners
# - rounded tile with transparent corners (Android legacy, PWA, favicon, Windows, splash logo)
# - adaptive foreground: the white glyph only, scaled into the 66/108 safe zone; background = fitted gradient
import numpy as np, base64, io, os
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda p: os.path.join(ROOT, p)
src = np.asarray(Image.open(P('resources/icon-source.jpg')).convert('RGB')).astype(float)
X0, X1, Y0, Y1 = 143, 882, 135, 874            # the tile's box in the artwork
tile = src[Y0:Y1, X0:X1]; T = tile.shape[0]
mn = tile.min(2)
# Fit colour = a + b*x + c*y on clean tile pixels (not glyph, not the top highlight) to extend the gradient.
yy, xx = np.mgrid[0:T, 0:T] / (T - 1)
sel = (mn < 160) & (yy > 0.12) & (xx > .05) & (xx < .95) & (yy < .95)
A = np.stack([np.ones(sel.sum()), xx[sel], yy[sel]], 1)
coef = [np.linalg.lstsq(A, tile[..., k][sel], rcond=None)[0] for k in range(3)]
grad = lambda n: np.clip(np.stack([c[0] + c[1] * (np.mgrid[0:n, 0:n][1] / (n - 1)) + c[2] * (np.mgrid[0:n, 0:n][0] / (n - 1)) for c in coef], 2), 0, 255)
def rr_mask(n, r, scale=4):
    m = Image.new('L', (n * scale, n * scale), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, n * scale - 1, n * scale - 1), radius=r * scale, fill=255)
    return m.resize((n, n), Image.LANCZOS)
R = int(T * 0.235)
inside = np.asarray(rr_mask(T, R)).astype(float) / 255
# full-bleed: real tile inside the rounded shape, fitted gradient outside it (shrink mask a bit to drop the white fringe)
inner = np.asarray(rr_mask(T, R).filter(__import__('PIL.ImageFilter', fromlist=['x']).MinFilter(9))).astype(float)[..., None] / 255
full = tile * inner + grad(T) * (1 - inner)
FULL = Image.fromarray(full.astype('uint8'), 'RGB')
ROUNDED = FULL.convert('RGBA'); ROUNDED.putalpha(rr_mask(T, R))
# glyph: white strokes and sparkle (below the glossy top band)
g = np.clip((mn - 175) / (240 - 175), 0, 1); g[: int(T * 0.09)] = 0; g *= inner[..., 0]   # only inside the tile (drops the white page corners)
GLYPH = Image.fromarray((g * 255).astype('uint8'), 'L')
gb = GLYPH.getbbox()
def glyph_on(n, frac, bg=None):
    """glyph scaled so its longer side is frac of n, centred; on transparent or a gradient background"""
    crop = GLYPH.crop(gb); s = frac * n / max(crop.size)
    crop = crop.resize((max(1, round(crop.width * s)), max(1, round(crop.height * s))), Image.LANCZOS)
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0)) if bg is None else Image.fromarray(grad(n).astype('uint8'), 'RGB').convert('RGBA')
    white = Image.new('RGBA', crop.size, (255, 255, 255, 255))
    out.paste(white, ((n - crop.width) // 2, (n - crop.height) // 2), crop); return out
def save(im, path, n):
    path = P(path); os.makedirs(os.path.dirname(path), exist_ok=True)
    im.resize((n, n), Image.LANCZOS).save(path, optimize=True)
def pad(im, n, frac):
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0)); k = round(n * frac); s = im.resize((k, k), Image.LANCZOS)
    out.alpha_composite(s.convert('RGBA'), ((n - k) // 2, (n - k) // 2)); return out
circle = lambda n: (lambda m: (ImageDraw.Draw(m).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255), m.resize((n, n), Image.LANCZOS))[1])(Image.new('L', (n * 4, n * 4), 0))
for d, k in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
    n = int(48 * k)
    save(pad(ROUNDED, 512, 0.92), f'resources/android/mipmap-{d}/ic_launcher.png', n)
    rnd = glyph_on(512, 0.62, bg=True); rnd.putalpha(circle(512)); save(rnd, f'resources/android/mipmap-{d}/ic_launcher_round.png', n)
    save(glyph_on(432, 0.56), f'resources/android/mipmap-{d}/ic_launcher_foreground.png', int(108 * k))   # glyph inside the 66dp safe circle
    save(pad(ROUNDED, 512, 112 / 144), f'resources/android/drawable-{d}/splash_logo.png', int(144 * k))
save(FULL, 'resources/ios/AppIcon-1024.png', 1024)
bgc = (244, 247, 252); sp = Image.new('RGB', (2732, 2732), bgc); lg = ROUNDED.resize((420, 420), Image.LANCZOS); sp.paste(lg, (1156, 1156), lg); sp.save(P('resources/ios/splash-2732.png'), optimize=True)
save(ROUNDED, 'public/icons/icon-192.png', 192); save(ROUNDED, 'public/icons/icon-512.png', 512)
save(glyph_on(512, 0.6, bg=True), 'public/icons/maskable-512.png', 512)        # glyph inside the 80% maskable safe zone
save(FULL, 'public/icons/apple-touch-icon.png', 180); save(ROUNDED, 'public/icons/favicon-32.png', 32)
b = io.BytesIO(); ROUNDED.resize((128, 128), Image.LANCZOS).save(b, 'PNG', optimize=True)
open(P('public/icons/favicon.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" width="128" height="128"><image width="128" height="128" href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/></svg>\n')
save(ROUNDED, 'resources/electron/icon.png', 1024)
ROUNDED.resize((256, 256), Image.LANCZOS).save(P('resources/electron/icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
c0 = grad(2)[0, 0].astype(int); c1 = grad(2)[1, 1].astype(int)
print('gradient', '#%02X%02X%02X' % tuple(c0), '#%02X%02X%02X' % tuple(c1))

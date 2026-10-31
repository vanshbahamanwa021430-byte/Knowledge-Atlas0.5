"""Recompresses the generated PNGs losslessly. No colour reduction: the blue gradient tile would band.
Opaque images (iOS icon, splash, apple-touch icon) are saved without an alpha channel, as Apple requires."""
import sys, pathlib
from PIL import Image

total_before = total_after = 0
for p in sys.argv[1:]:
    path = pathlib.Path(p)
    before = path.stat().st_size
    im = Image.open(path)
    opaque = 'AppIcon' in path.name or 'splash-2732' in path.name or 'apple-touch' in path.name or 'maskable' in path.name
    im = im.convert('RGB' if opaque else 'RGBA')
    im.save(path, optimize=True, compress_level=9)
    total_before += before; total_after += path.stat().st_size
print(f'{total_before//1024} KB -> {total_after//1024} KB')

#!/usr/bin/env python3
"""Tile stills (named tSSS.SS.png by render.js) into labeled contact sheets you can look at.
Usage: python3 contact_sheet.py <stills_dir> <out_prefix> [cols=6] [per_sheet=18]"""
import glob, os, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
per = int(sys.argv[4]) if len(sys.argv) > 4 else 18
tt = lambda f: float(os.path.basename(f)[1:-4])
files = sorted(glob.glob(os.path.join(d, 't*.png')), key=tt)
w, h = 360, 640
for n in range(0, len(files), per):
    part = files[n:n + per]
    rows = (len(part) + cols - 1) // cols
    im = Image.new('RGB', (cols * w, rows * h))
    dr = ImageDraw.Draw(im)
    for i, f in enumerate(part):
        im.paste(Image.open(f).convert('RGB').resize((w, h)), ((i % cols) * w, (i // cols) * h))
        dr.text(((i % cols) * w + 8, (i // cols) * h + 6), f'{tt(f):.1f}s', fill=(255, 255, 255))
    p = f'{out}-{n // per + 1}.png'
    im.save(p); print(p)

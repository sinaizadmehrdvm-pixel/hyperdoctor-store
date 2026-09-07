"""Rebuild documentary catalog crops: python scripts/extract-jts-catalog-media.py SOURCE.pdf.

Requires PyMuPDF and Pillow. Coordinates are fractions of each original page;
no generated imagery or background replacement is used.
"""
import gzip
import hashlib
import io
import json
import re
import sys
import tarfile
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == '19503c090e87bfe8923d0624b91c1935aad5ee98d47bb542d1e3e61011e598ac', 'Source PDF checksum mismatch'
ASSETS = ROOT / 'assets/catalog/jts-v281'
MAPPING = ROOT / 'supabase/migrations/20260907023000_jts_verified_product_media.sql'
# Individually reviewed main product regions; shared pages use separate SKU crops.
REGIONS = {
    3:(.24,.23,.75,.635), 4:(.34,.29,.76,.60), 5:(.38,.25,.90,.63),
    6:(.20,.205,.72,.645), 7:(.14,.26,.65,.62), 8:(.15,.25,.70,.64),
    9:(.17,.25,.78,.675), 10:(.18,.235,.80,.675), 11:(.19,.25,.78,.66),
    12:(.31,.26,.79,.635), 13:(.26,.30,.82,.645), 14:(.43,.27,.86,.61),
    15:(.36,.22,.89,.64), 16:(.35,.25,.77,.62), 17:(.20,.225,.75,.65),
    18:(.28,.22,.75,.66), 20:(.29,.26,.83,.66), 21:(.19,.22,.80,.65),
    22:(.22,.22,.82,.65), 23:(.37,.28,.93,.63), 24:(.45,.27,.94,.61),
    25:(.45,.23,.90,.59), 26:(.46,.27,.94,.63), 27:(.36,.285,.79,.63),
    28:(.44,.23,.92,.64), 29:(.40,.24,.86,.635), 30:(.43,.245,.89,.61),
    31:(.16,.285,.56,.64), 32:(.45,.245,.87,.66), 33:(.39,.23,.79,.565),
    34:(.46,.24,.93,.60), 35:(.16,.27,.48,.70), 36:(.08,.20,.65,.66),
    37:(.20,.25,.69,.685), 38:(.24,.27,.58,.575), 39:(.25,.235,.73,.625),
    40:(.35,.23,.72,.56), 41:(.28,.25,.70,.59), 42:(.26,.26,.80,.66),
    43:(.31,.22,.81,.63), 44:(.46,.25,.89,.60), 45:(.32,.265,.74,.64),
    46:(.29,.27,.68,.645), 47:(.45,.245,.88,.65), 48:(.15,.26,.59,.68),
    52:(.33,.26,.65,.66), 53:(.16,.29,.83,.67),
}
SHARED = {
    'JTS-WALKER-STEEL-WHEELED':(.14,.25,.38,.53),
    'JTS-WALKER-STEEL':(.62,.57,.88,.81),
    'JTS-WALKER-ALUMINIUM-WHEELED':(.43,.275,.65,.455),
    'JTS-WALKER-ALUMINIUM':(.43,.515,.65,.715),
    'JTS-CANE-QUAD':(.35,.265,.50,.625),
    'JTS-CANE-DERBY':(.56,.265,.70,.65),
}

doc = fitz.open(SOURCE)
assert len(doc) == 55, 'Expected original 55-page catalog'
mapping = re.findall(r"\('(JTS-[^']+)',(\d+)\)", MAPPING.read_text())
assert len(mapping) == 53
records, blobs = [], {}
for sku, page in mapping:
    page = int(page)
    region = SHARED[sku] if sku in SHARED else REGIONS[page]
    pg = doc[page-1]
    clip = fitz.Rect(region[0]*pg.rect.width, region[1]*pg.rect.height,
                     region[2]*pg.rect.width, region[3]*pg.rect.height)
    pix = pg.get_pixmap(matrix=fitz.Matrix(1,1), clip=clip, alpha=False)
    crop = Image.frombytes('RGB', (pix.width,pix.height), pix.samples)
    crop.thumbnail((228,228), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB',(240,240),'white')
    canvas.paste(crop,((240-crop.width)//2,(240-crop.height)//2))
    out = io.BytesIO(); canvas.save(out,format='WEBP',quality=85,method=6)
    data = out.getvalue(); name = sku+'.webp'; blobs[name] = data
    records.append(dict(sku=sku,filename=name,page=page,crop=region,
                        width=240,height=240,byteSize=len(data),sha256=hashlib.sha256(data).hexdigest()))

archive = ASSETS / 'jts-v281-media-240q85.tar.gz'
with archive.open('wb') as raw:
    with gzip.GzipFile(fileobj=raw,mode='wb',filename='',mtime=0) as gz:
        with tarfile.open(fileobj=gz,mode='w',format=tarfile.USTAR_FORMAT) as tar:
            for name,data in sorted(blobs.items()):
                info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o644
                tar.addfile(info,io.BytesIO(data))
manifest=dict(archive=archive.name,sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),
              source='file_0000000098d481f4a1baa422ec264c0d',
              sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              sourcePageCount=55,files=53,encoding=dict(format='WEBP',quality=85),
              policy='Exact catalog regions only; no generated, substitute or inferred imagery.',
              assets=sorted(records,key=lambda r:r['filename']))
(ASSETS/'source-derived-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(files=53,archiveBytes=archive.stat().st_size,sha256=manifest['sha256'])))

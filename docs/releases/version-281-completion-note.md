# Version 281 completion repair

PR #42 previously contained a truncated 4,108-byte gzip stream. Its checksum had been repinned to the incomplete bytes, so the checksum-only audit passed but extraction failed in CI.

The replacement archive contains all 53 individually reviewed source-page crops, encoded as 240x240 WEBP at quality 85. The original PDF checksum, exact per-SKU page and crop coordinates, output dimensions, byte sizes and SHA-256 checksums are recorded in `assets/catalog/jts-v281/source-derived-manifest.json`. The extractor rejects any different source PDF. Original catalog backgrounds and callout lines are preserved; these are documentary crops.

Build preparation validates the compressed stream, exact entry set and each output checksum before replacing the generated directory. The static-media audit fully decodes all 53 images and checks their dimensions.

Release gates: PR and main CI must pass; production must serve all 53 matching files before applying the static Media URL migration. No product publication, current price, stock, branch price or warehouse inventory is created. Version 282 remains the next phase after these gates.

# JTS Version 281 verified media

Canonical build artifact: `jts-v281-media-240q35.tar.gz`

SHA-256: `97d74907fb5d24175873044c1e0f664ef6e1d5389bd6f2e3525480e01518c4ec`

The archive contains exactly 53 `240x240` WEBP storefront assets derived only from the verified 55-page Jahan Tajhizat Shafa / JTS catalogue source `file_0000000098d481f4a1baa422ec264c0d`. Each filename maps 1:1 to the verified JTS site SKU and its exact catalogue page. Pages containing more than one product family are cropped independently per SKU. No generated, synthetic, stock, substitute, or inferred product imagery is permitted.

`prepare-jts-verified-media.ts` verifies the archive checksum, extracts exactly the canonical 53 filenames, verifies each WEBP container, and fails closed before build if any invariant is broken.

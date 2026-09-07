# JTS Version 281 verified media

Canonical build artifact: `jts-v281-media-240q85.tar.gz`

SHA-256: `43acbc1a958b6e558c6965670661a1cdcfd524d34602067f6ab96bc6cb1fdee2`

The archive contains exactly 53 `240x240` WEBP storefront assets derived only from the verified 55-page Jahan Tajhizat Shafa / JTS catalogue source `file_0000000098d481f4a1baa422ec264c0d`. Each filename maps 1:1 to the verified JTS site SKU and its exact catalogue page. Pages containing more than one product family are cropped independently per SKU. No generated, synthetic, stock, substitute, or inferred product imagery is permitted.

`prepare-jts-verified-media.ts` verifies the archive checksum, extracts exactly the canonical 53 filenames, verifies each WEBP container, and fails closed before build if any invariant is broken.

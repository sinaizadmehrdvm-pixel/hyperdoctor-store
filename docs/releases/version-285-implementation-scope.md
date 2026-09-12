# Version 285 implementation scope

Version 285 treats current price and current inventory as operator-owned operational data. Their absence does not block completion of catalogue content, verified media, translations, source provenance, CI, deployment, or production integrity checks. They remain intentionally empty until entered by the store operator.

Product publication remains fail-closed while those operational fields are unset. Version 285 does not auto-publish products and does not fabricate price, stock, availability, warranty, barcode, regulatory, or medical claims.

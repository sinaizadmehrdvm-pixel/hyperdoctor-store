# Version 285 Production Closeout Gate

This file is intentionally a verification checklist, not a claim that Production has already been mutated.

Before Version 285 is marked complete:

1. `npm run test:catalog-enrichment` and full repository CI must pass on the PR head.
2. The PR must merge to `main` and the exact merge SHA must deploy READY to Vercel Production.
3. Both Version 285 Supabase migrations must apply successfully to `hyperdoctor-production`.
4. All 117 source-derived WEBP payloads must be inserted into `ProductMediaBlob` with the exact SHA-256 and byte size recorded in the Version 285 manifests.
5. Production must report 170/170 complete four-language descriptions and 170/170 products with VERIFIED media evidence.
6. Representative B.Well, Hooshmand and EGT Version 285 media endpoints must return HTTP 200 `image/webp`.
7. Product publication must remain zero and no current branch price or available inventory may be inferred or seeded.
8. The five blocked Hooshmand staging SKUs must remain `NEEDS_REVIEW`, unpromoted and without inferred sibling-model evidence.

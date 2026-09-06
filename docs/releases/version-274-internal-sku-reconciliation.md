# Version 274 — Internal SKU Reconciliation Suggestions

- Adds deliberately limited, source-backed Hyper Doctor internal SKU suggestions for four high-confidence Hooshmand name matches found in `hyperdoctor_products_ready_for_import.xlsx`.
- Suggestions contain identity evidence only; no selling price, purchase price or inventory is imported from the snapshot.
- Suggestions never set `identityStatus=VERIFIED` automatically.
- Explicit SUPER_ADMIN/EDITOR confirmation remains mandatory before Product Master promotion.
- Ambiguous firmness/color/model variants are intentionally left unresolved.

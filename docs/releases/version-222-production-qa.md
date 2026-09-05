# Version 222 — Production QA Hardening

Production QA covered authentication guards, public tracking privacy, rental document integrity, branch/inventory invariants, localization route smoke tests, build/type checks, Supabase security/performance advisors, and production runtime error review.

## Hardening included
- Public order/rental tracking RPCs now reject weak or empty phone identifiers even when called directly through the Data API.
- Rental tracking/document API schemas accept only plausible phone syntax and require at least 8 characters.
- Eleven foreign-key covering indexes were added from Supabase performance-advisor findings.

## Verified invariants
- No negative/over-reserved warehouse inventory rows.
- No invalid variant inventory rows.
- Exactly one default branch and no duplicate branch codes.
- No rental settlement-before-return / return-before-handover lifecycle violations.
- No rental document SHA-256 mismatches.
- No invalid rental quantities/date ranges or negative order monetary totals.
- Invalid admin/customer session tokens are rejected.
- Weak direct-RPC tracking/document requests return null.

## Known follow-up
Supabase Security Advisor still reports executable SECURITY DEFINER functions because the current app architecture deliberately invokes token-guarded RPCs using the public Data API role. Sampled privileged RPCs perform their own admin/customer session validation, but a later security-architecture phase should move privileged server-side RPC execution to a dedicated server role and reduce public execution grants.

Visual viewport QA on physical mobile/tablet/browser matrices is separate from this server-side/route/build QA and should be performed during the UI polish/device QA phase.

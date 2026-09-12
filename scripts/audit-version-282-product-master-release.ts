import { readFileSync } from 'node:fs';

const release = JSON.parse(readFileSync('docs/releases/version-282-product-master.json', 'utf8')) as {
  version: number;
  production: Record<string, number>;
  productMasterByBrand: Record<string, number>;
  blockedStagingItems: Array<{ siteSku: string; reason: string; policy: string }>;
  commercePolicy: Record<string, boolean>;
  releaseDecision: string;
};

const expectedBlocked = [
  'HOO-COOLER-CLASSIC',
  'HOO-COOLER-WAVE-L',
  'HOO-COOLER-WAVE-XL',
  'HOO-SLEEP-NECK',
  'HOO-WAVE-MASSAGER',
].sort();

if (release.version !== 282) throw new Error(`Expected Version 282, got ${release.version}`);
if (release.releaseDecision !== 'COMPLETE_FAIL_CLOSED') throw new Error('Version 282 must remain fail-closed');

const p = release.production;
const exact: Record<string, number> = {
  stagingItems: 175,
  verifiedIdentities: 175,
  unresolvedIdentities: 0,
  promotedStagingItems: 170,
  products: 170,
  publishedProducts: 0,
  branchProductPrices: 0,
  warehouseInventoryRows: 0,
  productSourceEvidenceRows: 170,
  productsWithSourceEvidence: 170,
  productMediaEvidenceRows: 53,
  productsWithMediaEvidence: 53,
};
for (const [key, expected] of Object.entries(exact)) {
  if (p[key] !== expected) throw new Error(`Version 282 release contract mismatch: ${key}=${p[key]}, expected ${expected}`);
}

if (p.verifiedIdentities !== p.stagingItems) throw new Error('Every staging identity must be VERIFIED');
if (p.products !== p.promotedStagingItems) throw new Error('Product count must equal promoted staging count');
if (p.stagingItems - p.promotedStagingItems !== expectedBlocked.length) {
  throw new Error('Only the five documented source-blocked staging items may remain unpromoted');
}

const brandTotal = Object.values(release.productMasterByBrand).reduce((sum, value) => sum + value, 0);
if (brandTotal !== p.products) throw new Error(`Brand Product total ${brandTotal} does not equal Product count ${p.products}`);
for (const [brand, expected] of Object.entries({ 'B.Well': 50, EGT: 24, Hooshmand: 43, JTS: 53 })) {
  if (release.productMasterByBrand[brand] !== expected) throw new Error(`Unexpected ${brand} Product count`);
}

const blocked = release.blockedStagingItems.map((item) => item.siteSku).sort();
if (blocked.join('\n') !== expectedBlocked.join('\n')) throw new Error(`Blocked SKU set mismatch: ${blocked.join(', ')}`);
for (const item of release.blockedStagingItems) {
  if (item.reason !== 'technical_source_unverified') throw new Error(`${item.siteSku} must be blocked only on technical source evidence`);
  if (!item.policy || item.policy.length < 20) throw new Error(`${item.siteSku} must document its provenance guard`);
}

const policy = release.commercePolicy;
for (const key of [
  'currentPriceRequiresCurrentEvidence',
  'currentInventoryRequiresCurrentEvidence',
  'promotionMayNotPublishProducts',
  'promotionMayNotCreateBranchPrice',
  'promotionMayNotCreateWarehouseInventory',
]) {
  if (policy[key] !== true) throw new Error(`Required fail-closed policy disabled: ${key}`);
}
for (const key of ['historicalPriceIsCurrent', 'historicalStockIsCurrent']) {
  if (policy[key] !== false) throw new Error(`Historical commerce data must remain reference-only: ${key}`);
}

console.log('Version 282 Product Master release audit passed: 175/175 identities verified, 170 source-supported products promoted, exactly five Hooshmand technical-source blockers retained, commerce/publication remain closed.');

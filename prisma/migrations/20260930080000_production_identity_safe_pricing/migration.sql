-- Production identity and safe pricing controls.
ALTER TABLE "Product" ADD COLUMN "priceIsPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSetting" ADD COLUMN "contactPhone2" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSetting" ADD COLUMN "respiratoryPhone" TEXT NOT NULL DEFAULT '';

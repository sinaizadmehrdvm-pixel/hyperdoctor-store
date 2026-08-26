-- Phase 2 integration foundation: ordered product media + page section CMS.

ALTER TABLE "Media" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Media" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Media" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Media_productId_sortOrder_idx" ON "Media"("productId", "sortOrder");

CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "titleFa" TEXT NOT NULL DEFAULT '',
    "titleEn" TEXT NOT NULL DEFAULT '',
    "bodyFa" TEXT NOT NULL DEFAULT '',
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "ctaLabelFa" TEXT NOT NULL DEFAULT '',
    "ctaLabelEn" TEXT NOT NULL DEFAULT '',
    "ctaHref" TEXT NOT NULL DEFAULT '',
    "backgroundUrl" TEXT NOT NULL DEFAULT '',
    "backgroundAltFa" TEXT NOT NULL DEFAULT '',
    "backgroundAltEn" TEXT NOT NULL DEFAULT '',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PageSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PageSection_pageId_sortOrder_idx" ON "PageSection"("pageId", "sortOrder");
CREATE UNIQUE INDEX "PageSection_pageId_sortOrder_key" ON "PageSection"("pageId", "sortOrder");

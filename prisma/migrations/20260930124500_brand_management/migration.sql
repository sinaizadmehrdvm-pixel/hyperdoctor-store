CREATE TABLE "Brand" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "nameFa" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "logoUrl" TEXT,
  "websiteUrl" TEXT NOT NULL DEFAULT '',
  "descriptionFa" TEXT NOT NULL DEFAULT '',
  "descriptionEn" TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");
ALTER TABLE "Product" ADD COLUMN "brandId" TEXT REFERENCES "Brand"("id");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

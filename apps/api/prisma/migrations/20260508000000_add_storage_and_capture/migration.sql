CREATE TABLE "wine_images" (
  "id" TEXT NOT NULL,
  "wineId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "label" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "bytes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wine_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capture_sessions" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "costCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "capture_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capture_photos" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "bytes" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'uploaded',
  "recognitionError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "capture_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognized_candidates" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "photoId" TEXT NOT NULL,
  "name" TEXT,
  "producer" TEXT,
  "vintage" INTEGER,
  "region" TEXT,
  "country" TEXT,
  "type" TEXT,
  "confidence" DOUBLE PRECISION,
  "rawJson" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "linkedWineId" TEXT,
  "bbox" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recognized_candidates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wine_images_storageKey_key" ON "wine_images"("storageKey");
CREATE INDEX "wine_images_wineId_idx" ON "wine_images"("wineId");
CREATE UNIQUE INDEX "capture_photos_storageKey_key" ON "capture_photos"("storageKey");
CREATE INDEX "capture_photos_sessionId_idx" ON "capture_photos"("sessionId");
CREATE INDEX "recognized_candidates_sessionId_idx" ON "recognized_candidates"("sessionId");
CREATE INDEX "recognized_candidates_photoId_idx" ON "recognized_candidates"("photoId");

ALTER TABLE "wine_images" ADD CONSTRAINT "wine_images_wineId_fkey"
  FOREIGN KEY ("wineId") REFERENCES "wines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "capture_photos" ADD CONSTRAINT "capture_photos_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "capture_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recognized_candidates" ADD CONSTRAINT "recognized_candidates_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "capture_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recognized_candidates" ADD CONSTRAINT "recognized_candidates_photoId_fkey"
  FOREIGN KEY ("photoId") REFERENCES "capture_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

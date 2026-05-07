CREATE TABLE "cellar_movements" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "wineId" TEXT NOT NULL,
  "wineName" TEXT NOT NULL,
  "wineProducer" TEXT NOT NULL,
  "wineVintage" INTEGER NOT NULL,
  "wineType" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "date" TEXT NOT NULL,
  "occasion" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cellar_movements_pkey" PRIMARY KEY ("id")
);

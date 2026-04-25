-- CreateTable
CREATE TABLE "wines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "grape" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseDate" TEXT NOT NULL DEFAULT '',
    "purchaseLocation" TEXT NOT NULL DEFAULT '',
    "storageLocation" TEXT,
    "drinkFrom" INTEGER NOT NULL DEFAULT 0,
    "drinkUntil" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "personalRating" DOUBLE PRECISION,
    "notes" TEXT,
    "imageUri" TEXT,
    "imageUrl" TEXT,
    "imageData" TEXT,
    "images" JSONB,
    "purchaseLink" TEXT,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "giftFrom" TEXT,
    "isRarity" BOOLEAN NOT NULL DEFAULT false,
    "bottleSize" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer" TEXT,
    "vintage" INTEGER,
    "type" TEXT,
    "region" TEXT,
    "country" TEXT,
    "grape" TEXT,
    "rating" DOUBLE PRECISION,
    "tastedDate" TEXT,
    "tastedLocation" TEXT,
    "price" DOUBLE PRECISION,
    "imageUri" TEXT,
    "imageData" TEXT,
    "images" JSONB,
    "tastingEvent" TEXT,
    "tastingSupplier" TEXT,
    "tastingStand" TEXT,
    "location" TEXT NOT NULL DEFAULT '',
    "occasion" TEXT NOT NULL DEFAULT '',
    "companions" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "source" TEXT,
    "sourceUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL DEFAULT '',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumed_wines" (
    "id" TEXT NOT NULL,
    "wineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "consumedDate" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumed_wines_pkey" PRIMARY KEY ("id")
);

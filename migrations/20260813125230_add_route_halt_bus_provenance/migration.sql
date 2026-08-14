-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('REAL', 'PUBLIC_THIRD_PARTY', 'COMMUNITY_DERIVED', 'DERIVED', 'SIMULATED');

-- AlterTable
ALTER TABLE "Bus" ADD COLUMN     "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATED',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fetchedAt" TIMESTAMPTZ,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "Halt" ADD COLUMN     "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATED',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fetchedAt" TIMESTAMPTZ,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "dataSource" "DataSource" NOT NULL DEFAULT 'SIMULATED',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "fetchedAt" TIMESTAMPTZ,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Bus_provider_externalId_key" ON "Bus"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Halt_provider_externalId_key" ON "Halt"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_provider_externalId_key" ON "Route"("provider", "externalId");


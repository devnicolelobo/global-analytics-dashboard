-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('running', 'success', 'failed');

-- CreateTable
CREATE TABLE "countries" (
    "iso2" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "upstream_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("iso2")
);

-- CreateTable
CREATE TABLE "covid_daily_metrics" (
    "id" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "reference_date" DATE NOT NULL,
    "cases_total" INTEGER,
    "cases_new" INTEGER,
    "deaths_total" INTEGER,
    "deaths_new" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'api-ninjas',
    "ingested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "covid_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'running',
    "source" TEXT NOT NULL DEFAULT 'api-ninjas',
    "mode" TEXT NOT NULL,
    "records_upserted" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "countries_upstream_name_key" ON "countries"("upstream_name");

-- CreateIndex
CREATE INDEX "covid_daily_metrics_country_code_reference_date_idx" ON "covid_daily_metrics"("country_code", "reference_date");

-- CreateIndex
CREATE INDEX "covid_daily_metrics_reference_date_idx" ON "covid_daily_metrics"("reference_date");

-- CreateIndex
CREATE UNIQUE INDEX "covid_daily_metrics_country_code_region_reference_date_key" ON "covid_daily_metrics"("country_code", "region", "reference_date");

-- CreateIndex
CREATE INDEX "sync_runs_started_at_idx" ON "sync_runs"("started_at");

-- AddForeignKey
ALTER TABLE "covid_daily_metrics" ADD CONSTRAINT "covid_daily_metrics_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

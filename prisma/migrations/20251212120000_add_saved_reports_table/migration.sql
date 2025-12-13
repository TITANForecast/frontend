-- CreateTable
CREATE TABLE IF NOT EXISTS "saved_reports" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "visibility" VARCHAR(20) NOT NULL,
    "allow_filters" BOOLEAN NOT NULL DEFAULT true,
    "filters" JSONB,
    "grouping" JSONB,
    "column_state" JSONB,
    "created_by" TEXT NOT NULL,
    "dealer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_reports_created_by_idx" ON "saved_reports"("created_by");

-- CreateIndex
CREATE INDEX "saved_reports_report_type_idx" ON "saved_reports"("report_type");

-- CreateIndex
CREATE INDEX "saved_reports_visibility_idx" ON "saved_reports"("visibility");

-- CreateIndex
CREATE INDEX "saved_reports_dealer_id_idx" ON "saved_reports"("dealer_id");

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

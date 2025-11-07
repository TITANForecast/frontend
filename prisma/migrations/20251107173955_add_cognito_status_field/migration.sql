-- AlterTable
ALTER TABLE "dealer_api_configs" ALTER COLUMN "dataSource" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cognitoStatus" TEXT;

-- CreateTable
CREATE TABLE "import_log" (
    "id" BIGSERIAL NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "import_type" TEXT NOT NULL,
    "file_type" TEXT,
    "request_id" TEXT,
    "status" TEXT NOT NULL,
    "total_records" INTEGER,
    "processed_records" INTEGER,
    "failed_records" INTEGER,
    "new_records" INTEGER,
    "updated_records" INTEGER,
    "error_message" TEXT,
    "import_start_time" TIMESTAMP,
    "import_end_time" TIMESTAMP,
    "elapsed_seconds" DECIMAL(8,2),
    "created_at" TIMESTAMP,

    CONSTRAINT "import_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_log_dealer_id_idx" ON "import_log"("dealer_id");

-- CreateIndex
CREATE INDEX "import_log_file_type_idx" ON "import_log"("file_type");

-- CreateIndex
CREATE INDEX "import_log_status_idx" ON "import_log"("status");

-- CreateIndex
CREATE INDEX "import_log_created_at_idx" ON "import_log"("created_at");

-- AddForeignKey
ALTER TABLE "import_log" ADD CONSTRAINT "import_log_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

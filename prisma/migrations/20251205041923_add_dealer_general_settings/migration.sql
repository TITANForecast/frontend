-- CreateTable
CREATE TABLE "dealer_general_settings" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "current_warranty_labor_rate" DECIMAL(10,2),
    "current_warranty_parts_markup" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_general_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_general_settings_dealer_id_key" ON "dealer_general_settings"("dealer_id");

-- AddForeignKey
ALTER TABLE "dealer_general_settings" ADD CONSTRAINT "dealer_general_settings_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;


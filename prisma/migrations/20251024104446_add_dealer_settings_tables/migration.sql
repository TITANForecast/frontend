-- CreateTable
CREATE TABLE "service_categories" (
    "id" BIGSERIAL NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_subcategories" (
    "id" BIGSERIAL NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" BIGSERIAL NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category_id" BIGINT NOT NULL,
    "subcategory_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_categories_dealer_id_is_active_idx" ON "service_categories"("dealer_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "unique_dealer_category_name" ON "service_categories"("dealer_id", "name");

-- CreateIndex
CREATE INDEX "service_subcategories_dealer_id_category_id_is_active_idx" ON "service_subcategories"("dealer_id", "category_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "unique_dealer_category_subcategory_name" ON "service_subcategories"("dealer_id", "category_id", "name");

-- CreateIndex
CREATE INDEX "services_dealer_id_is_active_idx" ON "services"("dealer_id", "is_active");

-- CreateIndex
CREATE INDEX "services_dealer_id_category_id_idx" ON "services"("dealer_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_dealer_service_name_category_subcategory" ON "services"("dealer_id", "name", "category_id", "subcategory_id");

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_subcategories" ADD CONSTRAINT "service_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "service_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


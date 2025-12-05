-- AlterTable
ALTER TABLE "dealer_general_settings" ADD COLUMN "last_labor_rate_submission" TIMESTAMP(3),
ADD COLUMN "last_parts_profit_submission" TIMESTAMP(3),
ADD COLUMN "warranty_request_cooldown_period" INTEGER DEFAULT 180;


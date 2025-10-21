-- Migration: Rename dealerShortCode to rooftopId
-- This migration renames the column for better clarity

BEGIN;

-- Rename the column in dealer_api_configs table
ALTER TABLE dealer_api_configs 
RENAME COLUMN "dealerShortCode" TO "rooftopId";

COMMIT;


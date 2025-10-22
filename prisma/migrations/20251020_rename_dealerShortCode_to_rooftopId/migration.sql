-- Migration: Rename dealerShortCode to rooftopId
-- This migration renames the column for better clarity

BEGIN;

-- Rename the column in dealer_api_configs table (only if dealerShortCode exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dealer_api_configs' AND column_name = 'dealerShortCode') THEN
    ALTER TABLE dealer_api_configs RENAME COLUMN "dealerShortCode" TO "rooftopId";
  END IF;
END $$;

COMMIT;


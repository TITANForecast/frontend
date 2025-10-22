-- Migration: Add fileTypeCodes array to dealer_api_configs
-- This migration safely migrates from single fileTypeCode to array fileTypeCodes

BEGIN;

-- Step 1: Add the new fileTypeCodes column as an array
ALTER TABLE dealer_api_configs 
ADD COLUMN IF NOT EXISTS "fileTypeCodes" TEXT[] DEFAULT ARRAY['SV'];

-- Step 2: Migrate existing data from fileTypeCode to fileTypeCodes (only if column exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dealer_api_configs' AND column_name = 'fileTypeCode') THEN
    UPDATE dealer_api_configs 
    SET "fileTypeCodes" = ARRAY["fileTypeCode"]
    WHERE "fileTypeCode" IS NOT NULL 
      AND ("fileTypeCodes" IS NULL OR "fileTypeCodes" = ARRAY['SV']);
  END IF;
END $$;

-- Step 3: Drop the old fileTypeCode column
ALTER TABLE dealer_api_configs 
DROP COLUMN IF EXISTS "fileTypeCode";

-- Note: import_log table already exists in the database from Python backend
-- No need to create it. The Prisma schema model is just for ORM access.

COMMIT;


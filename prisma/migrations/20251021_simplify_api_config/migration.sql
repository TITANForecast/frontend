-- Migration: Simplify DealerApiConfig by removing unnecessary fields and adding Data Source
-- Date: 2024-10-21

-- Add Data Source column (or rename from api_type if it exists)
DO $$ 
BEGIN
  -- Check if api_type column exists and rename it
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'dealer_api_configs' AND column_name = 'api_type') THEN
    ALTER TABLE dealer_api_configs RENAME COLUMN api_type TO "dataSource";
  END IF;
  
  -- Add dataSource column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'dealer_api_configs' AND column_name = 'dataSource') THEN
    ALTER TABLE dealer_api_configs ADD COLUMN "dataSource" VARCHAR(50) DEFAULT 'Certify-Staging' NOT NULL;
  END IF;
END $$;

-- Drop the columns that are no longer needed (using exact Prisma column names)
ALTER TABLE dealer_api_configs 
DROP COLUMN IF EXISTS "subscriptionKey",
DROP COLUMN IF EXISTS "xUserEmail",
DROP COLUMN IF EXISTS "deliveryEndpoint",
DROP COLUMN IF EXISTS "jwtTokenUrl";

-- Add comment for the Data Source column
COMMENT ON COLUMN dealer_api_configs."dataSource" IS 'Data Source: Certify-Staging or DealerVault-Production';


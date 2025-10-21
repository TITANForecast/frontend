-- Migration: Simplify DealerApiConfig by removing unnecessary fields and adding Data Source
-- Date: 2024-10-21

-- Add Data Source column
ALTER TABLE dealer_api_configs 
ADD COLUMN IF NOT EXISTS "dataSource" VARCHAR(50) DEFAULT 'Certify-Staging' NOT NULL;

-- Rename api_type to dataSource if it exists (for existing databases)
ALTER TABLE dealer_api_configs 
RENAME COLUMN api_type TO "dataSource";

-- Drop the columns that are no longer needed (using exact Prisma column names)
ALTER TABLE dealer_api_configs 
DROP COLUMN IF EXISTS "subscriptionKey",
DROP COLUMN IF EXISTS "xUserEmail",
DROP COLUMN IF EXISTS "deliveryEndpoint",
DROP COLUMN IF EXISTS "jwtTokenUrl";

-- Add comment for the Data Source column
COMMENT ON COLUMN dealer_api_configs."dataSource" IS 'Data Source: Certify-Staging or DealerVault-Production';


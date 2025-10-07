-- TITAN Forecast Platform Database Initialization Script
-- This script sets up the initial database schema for local development

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS data;

-- Set search path
SET search_path TO public, auth, core, data;

-- =============================================
-- AUTH SCHEMA - Authentication & Authorization
-- =============================================

-- Users table (linked to Cognito)
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dealers table (multi-tenant organizations)
CREATE TABLE IF NOT EXISTS auth.dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Dealer relationships (multi-tenancy)
CREATE TABLE IF NOT EXISTS auth.user_dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dealer_id UUID NOT NULL REFERENCES auth.dealers(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, dealer_id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS auth.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CORE SCHEMA - Core Business Logic
-- =============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS core.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES auth.dealers(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DATA SCHEMA - Data Processing & Analytics
-- =============================================

-- Repair Orders table
CREATE TABLE IF NOT EXISTS data.repair_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES auth.dealers(id) ON DELETE CASCADE,
    ro_number VARCHAR(100) NOT NULL,
    open_date DATE,
    close_date DATE,
    total_cost DECIMAL(10,2),
    total_sale DECIMAL(10,2),
    customer_name VARCHAR(255),
    vehicle_vin VARCHAR(17),
    vehicle_year VARCHAR(4),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, ro_number)
);

-- Operations table
CREATE TABLE IF NOT EXISTS data.operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID NOT NULL REFERENCES data.repair_orders(id) ON DELETE CASCADE,
    operation_line_number INTEGER NOT NULL,
    operation_code VARCHAR(100),
    operation_description TEXT,
    sale_type CHAR(1), -- C=Customer, W=Warranty, I=Internal
    operation_cost DECIMAL(10,2),
    operation_sale DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(repair_order_id, operation_line_number)
);

-- Parts table
CREATE TABLE IF NOT EXISTS data.parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID NOT NULL REFERENCES data.repair_orders(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES data.operations(id) ON DELETE CASCADE,
    part_number VARCHAR(100),
    part_description TEXT,
    quantity DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    unit_sale DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    total_sale DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Labor table
CREATE TABLE IF NOT EXISTS data.labor (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_order_id UUID NOT NULL REFERENCES data.repair_orders(id) ON DELETE CASCADE,
    operation_id UUID REFERENCES data.operations(id) ON DELETE CASCADE,
    tech_number VARCHAR(50),
    tech_name VARCHAR(255),
    tech_hours DECIMAL(10,2),
    tech_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Auth indexes
CREATE INDEX IF NOT EXISTS idx_users_cognito_id ON auth.users(cognito_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_user_dealers_user_id ON auth.user_dealers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dealers_dealer_id ON auth.user_dealers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON auth.user_sessions(session_token);

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_dealer_id ON core.subscriptions(dealer_id);

-- Data indexes
CREATE INDEX IF NOT EXISTS idx_repair_orders_dealer_id ON data.repair_orders(dealer_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_ro_number ON data.repair_orders(ro_number);
CREATE INDEX IF NOT EXISTS idx_operations_repair_order_id ON data.operations(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_repair_order_id ON data.parts(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_parts_operation_id ON data.parts(operation_id);
CREATE INDEX IF NOT EXISTS idx_labor_repair_order_id ON data.labor(repair_order_id);
CREATE INDEX IF NOT EXISTS idx_labor_operation_id ON data.labor(operation_id);

-- =============================================
-- SAMPLE DATA FOR DEVELOPMENT
-- =============================================

-- Insert sample dealers
INSERT INTO auth.dealers (id, name, address, phone, city, state, zip) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Titan Motors', '123 Main St', '555-0123', 'Anytown', 'CA', '12345'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Auto World', '456 Oak Ave', '555-0456', 'Somewhere', 'CA', '67890'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Premier Auto', '789 Pine St', '555-0789', 'Elsewhere', 'TX', '54321')
ON CONFLICT (id) DO NOTHING;

-- Insert sample users
INSERT INTO auth.users (id, cognito_user_id, email, name, role) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', 'dev-user-1', 'admin@titan.com', 'Admin User', 'SUPER_ADMIN'),
    ('660e8400-e29b-41d4-a716-446655440002', 'dev-user-2', 'manager@titan.com', 'Manager User', 'MULTI_DEALER'),
    ('660e8400-e29b-41d4-a716-446655440003', 'dev-user-3', 'user@titan.com', 'Regular User', 'USER')
ON CONFLICT (id) DO NOTHING;

-- Insert user-dealer relationships
INSERT INTO auth.user_dealers (user_id, dealer_id, is_default) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', true), -- Admin -> Titan Motors
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', false), -- Admin -> Auto World
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', false), -- Admin -> Premier Auto
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', true), -- Manager -> Titan Motors
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', false), -- Manager -> Auto World
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', true)  -- User -> Titan Motors
ON CONFLICT (user_id, dealer_id) DO NOTHING;

-- Insert sample subscriptions
INSERT INTO core.subscriptions (dealer_id, plan_name, status) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Professional', 'active'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Standard', 'active'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Basic', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample repair orders
INSERT INTO data.repair_orders (id, dealer_id, ro_number, open_date, close_date, total_cost, total_sale, customer_name, vehicle_vin, vehicle_year, vehicle_make, vehicle_model) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '911468', '2024-01-15', '2024-01-15', 6929.96, 9300.09, 'JOHN A DOE', '5YFB4MDE6PP008260', '2023', 'TOYOTA', 'COROLLA'),
    ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '911469', '2024-01-16', '2024-01-16', 1250.00, 1500.00, 'JANE SMITH', '1HGBH41JXMN109186', '2021', 'HONDA', 'CIVIC'),
    ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '911470', '2024-01-17', NULL, 0.00, 0.00, 'BOB JOHNSON', '2FMDK3GC4EBA12345', '2014', 'FORD', 'FOCUS')
ON CONFLICT (id) DO NOTHING;

-- Insert sample operations
INSERT INTO data.operations (repair_order_id, operation_line_number, operation_code, operation_description, sale_type, operation_cost, operation_sale) VALUES
    ('770e8400-e29b-41d4-a716-446655440001', 1, '91TOZ15KSYN', 'TOYO CARE 15K SYN', 'C', 1000.00, 1204.33),
    ('770e8400-e29b-41d4-a716-446655440001', 2, '10TOZZDRIVE2', 'DRIVABILITY CONCERN', 'I', 750.00, 890.40),
    ('770e8400-e29b-41d4-a716-446655440001', 3, '11TOZ01', 'ENGINE CONCERN', 'W', 5000.00, 6152.13),
    ('770e8400-e29b-41d4-a716-446655440002', 1, 'OILCHANGE', 'Oil Change Service', 'C', 50.00, 75.00),
    ('770e8400-e29b-41d4-a716-446655440002', 2, 'BRAKEINSP', 'Brake Inspection', 'C', 100.00, 150.00)
ON CONFLICT (repair_order_id, operation_line_number) DO NOTHING;

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON auth.dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON core.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_orders_updated_at BEFORE UPDATE ON data.repair_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant permissions to application users (if they exist)
DO $$
BEGIN
    -- Grant permissions to core_api_user if it exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'core_api_user') THEN
        GRANT USAGE ON SCHEMA auth, core, data TO core_api_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth, core, data TO core_api_user;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth, core, data TO core_api_user;
    END IF;
    
    -- Grant permissions to data_api_user if it exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'data_api_user') THEN
        GRANT USAGE ON SCHEMA auth, core, data TO data_api_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth, core, data TO data_api_user;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth, core, data TO data_api_user;
    END IF;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE 'TITAN Forecast Platform database initialized successfully!';
    RAISE NOTICE 'Schemas created: auth, core, data';
    RAISE NOTICE 'Sample data inserted for development';
    RAISE NOTICE 'Database ready for local development';
END $$;

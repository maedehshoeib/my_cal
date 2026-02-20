-- Initialize database with basic settings
-- This file will be executed when PostgreSQL container starts for the first time

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance (will be created after tables are created by SQLAlchemy)
-- Note: SQLAlchemy will create the tables, but we can add additional optimizations here

-- Insert default system settings
-- These will be handled by the application, but we can add some defaults

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully for MyCalc application';
END $$;
-- Migration: 004_microsoft_oauth
-- Description: Add Microsoft OAuth support to profiles table

-- Add Microsoft ID column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS microsoft_id VARCHAR(255) UNIQUE;

-- Add auth_provider column to profiles (null for local auth, 'microsoft' for Microsoft OAuth)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50);

-- Update existing profiles to have local auth
UPDATE profiles SET auth_provider = NULL WHERE auth_provider IS NULL;

-- Create token_storage table for auth tokens if needed
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    refresh_token TEXT,
    access_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on microsoft_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_microsoft_id ON profiles(microsoft_id);

-- Ejecutar en Supabase → SQL Editor → New Query
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMPTZ;

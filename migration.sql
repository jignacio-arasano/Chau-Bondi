-- ============================================================
-- Ejecutar en Supabase → SQL Editor → New Query
-- SOLO si ya tenés la tabla profiles del proyecto anterior
-- ============================================================

-- Agregar columnas de verificación de email
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified      BOOLEAN      DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMPTZ;

-- DEFAULT true para que los usuarios ya cargados manualmente
-- no queden bloqueados y puedan seguir entrando

-- ============================================================
-- Listo. Los nuevos usuarios registrados desde la app
-- tendrán email_verified = false hasta verificar su correo.
-- ============================================================

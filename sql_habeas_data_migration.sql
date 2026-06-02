-- ============================================================
-- MIGRACIÓN: Habeas Data — Ley 1581 de 2012 / Colombia
-- Proyecto: WayRoute — MoviCali
-- Tabla: usuarios (pública)
-- 
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas a la tabla usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS habeas_data_aceptado  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS habeas_data_fecha      TIMESTAMPTZ  NULL,
  ADD COLUMN IF NOT EXISTS habeas_data_ley        TEXT         NULL DEFAULT 'Ley 1581 de 2012 / Decreto 1377 de 2013';

-- 2. Comentarios descriptivos en las columnas
COMMENT ON COLUMN usuarios.habeas_data_aceptado IS
  'Indica si el usuario autorizó el tratamiento de sus datos personales conforme a la Ley 1581 de 2012 (Habeas Data - Colombia).';

COMMENT ON COLUMN usuarios.habeas_data_fecha IS
  'Fecha y hora exacta en que el usuario otorgó la autorización de tratamiento de datos personales (ISO 8601 con zona horaria).';

COMMENT ON COLUMN usuarios.habeas_data_ley IS
  'Referencia legal del marco normativo bajo el cual se otorgó la autorización.';

-- 3. (Opcional) Índice para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_usuarios_habeas_data
  ON usuarios (habeas_data_aceptado, habeas_data_fecha);

-- 4. Verificación
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND column_name LIKE 'habeas%'
ORDER BY column_name;

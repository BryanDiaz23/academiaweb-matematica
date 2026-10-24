-- =====================================================================
--  Migración V3: mejoras de seguridad y de control de vigencia
-- =====================================================================

-- Contraseña temporal: obliga al usuario a cambiarla en su siguiente ingreso
ALTER TABLE usuarios ADD COLUMN debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Acelera la búsqueda de matrículas activas vencidas (tarea diaria de vencimiento)
CREATE INDEX idx_matriculas_estado_fin ON matriculas (estado, fecha_fin);

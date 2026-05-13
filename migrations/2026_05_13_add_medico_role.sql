-- =============================================
-- Migracion: agregar rol 'medico' al ENUM de usuarios
-- Fecha: 2026-05-13
-- =============================================
--
-- Permite que un usuario tenga rol 'medico' para acceder al panel medico
-- y registrar dosis a pacientes (vacuna, fecha, lugar, lote).
--
-- Si vuelves a crear la BD desde cero, vacunas.sql ya incluye el enum extendido,
-- por lo que este script solo aplica a instalaciones existentes.
-- =============================================

ALTER TABLE `usuarios`
  MODIFY `rol` enum('usuario','administrador','medico')
  NOT NULL DEFAULT 'usuario';

-- Medicos de prueba (CURP sintetica que NO se valida contra RENAPO).
-- Contrasena: '123' (texto plano para compatibilidad con el resto de la BD;
-- se re-hashea automaticamente con bcrypt en el primer login exitoso).

INSERT INTO `usuarios` (
  `curp`, `nombre`, `apellido_paterno`, `apellido_materno`,
  `celular`, `correo`, `contrasena_hash`, `rol`,
  `unidad_medica_id`, `medico_familiar`, `nss`,
  `grupo_prioritario`, `fecha_nacimiento`, `sexo`
) VALUES
('MEDI800101HNLDDC01', 'Daniela',  'Medina',   'Cantu',   '8180000001', 'daniela.medina@piaia.mx',  '123', 'medico', 1, NULL, NULL, 'personal_salud', '1980-01-01', 'M'),
('MEDI750505HNLDDR02', 'Rodrigo',  'Medina',   'Reyes',   '8180000002', 'rodrigo.medina@piaia.mx',  '123', 'medico', 7, NULL, NULL, 'personal_salud', '1975-05-05', 'H')
ON DUPLICATE KEY UPDATE
  `rol` = 'medico',
  `contrasena_hash` = VALUES(`contrasena_hash`),
  `unidad_medica_id` = VALUES(`unidad_medica_id`);

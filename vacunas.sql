-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 13-05-2026 a las 00:38:42
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `vacunas`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_vacunas`
--

CREATE TABLE `historial_vacunas` (
  `id` int(11) NOT NULL,
  `curp_usuario` varchar(18) NOT NULL,
  `vacuna_id` int(11) NOT NULL,
  `numero_dosis` tinyint(4) NOT NULL DEFAULT 1,
  `fecha_aplicacion` date NOT NULL,
  `lugar_aplicacion` varchar(200) DEFAULT NULL,
  `lote` varchar(60) DEFAULT NULL,
  `modificado_por` varchar(18) DEFAULT NULL,
  `registrado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_vacunas`
--

INSERT INTO `historial_vacunas` (`id`, `curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`, `registrado_en`) VALUES
(1, 'MAGL850305MNLRMS04', 1, 1, '2020-03-15', 'UMF No. 27', 'LOT-001', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(2, 'MAGL850305MNLRMS04', 2, 1, '2020-06-01', 'UMF No. 27', 'LOT-002', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(3, 'MAGL850305MNLRMS04', 2, 2, '2020-08-01', 'UMF No. 27', 'LOT-002', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(4, 'MAGL850305MNLRMS04', 2, 3, '2020-12-01', 'UMF No. 27', 'LOT-003', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(5, 'MAGL850305MNLRMS04', 3, 1, '2020-09-10', 'UMF No. 27', 'LOT-004', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(6, 'MAGL850305MNLRMS04', 3, 2, '2020-11-10', 'UMF No. 27', 'LOT-004', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(7, 'MAGL850305MNLRMS04', 3, 3, '2021-01-10', 'UMF No. 27', 'LOT-005', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(8, 'MAGL850305MNLRMS04', 4, 1, '2020-10-12', 'UMF No. 27', 'LOT-006', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(9, 'MAGL850305MNLRMS04', 4, 2, '2020-12-12', 'UMF No. 27', 'LOT-006', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(10, 'MAGL850305MNLRMS04', 5, 1, '2021-02-01', 'UMF No. 27', 'LOT-007', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(11, 'MAGL850305MNLRMS04', 5, 2, '2021-04-01', 'UMF No. 27', 'LOT-007', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(12, 'MAGL850305MNLRMS04', 5, 3, '2021-06-01', 'UMF No. 27', 'LOT-008', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(13, 'MAGL850305MNLRMS04', 6, 1, '2022-04-03', 'UMF No. 27', 'LOT-009', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(14, 'MAGL850305MNLRMS04', 6, 2, '2022-06-03', 'UMF No. 27', 'LOT-009', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(15, 'MAGL850305MNLRMS04', 8, 1, '2023-08-17', 'UMF No. 27', 'LOT-010', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(16, 'MAGL850305MNLRMS04', 10, 1, '2025-04-05', 'UMF No. 27', 'LOT-011', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(17, 'MAGL850305MNLRMS04', 11, 1, '2024-01-14', 'UMF No. 27', 'LOT-012', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(18, 'MAGL850305MNLRMS04', 11, 2, '2024-07-14', 'UMF No. 27', 'LOT-012', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(19, 'MAGL850305MNLRMS04', 7, 1, '2021-03-20', 'UMF No. 27', 'LOT-013', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(20, 'GARM850101HDFRRS04', 1, 1, '2019-01-10', 'UMF No. 33', 'LOT-020', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(21, 'GARM850101HDFRRS04', 2, 1, '2019-03-10', 'UMF No. 33', 'LOT-021', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51'),
(22, 'GARM850101HDFRRS04', 10, 1, '2024-11-01', 'UMF No. 33', 'LOT-022', 'XEXX010101HNEXXXA4', '2026-05-12 15:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_buzon`
--

CREATE TABLE `mensajes_buzon` (
  `id` int(11) NOT NULL,
  `destinatario_curp` varchar(18) NOT NULL,
  `remitente_curp` varchar(18) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` enum('informacion','advertencia','urgente') NOT NULL DEFAULT 'informacion',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `enviado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `leido_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_buzon`
--

INSERT INTO `mensajes_buzon` (`id`, `destinatario_curp`, `remitente_curp`, `titulo`, `contenido`, `tipo`, `leido`, `enviado_en`, `leido_en`) VALUES
(1, 'MAGL850305MNLRMS04', 'XEXX010101HNEXXXA4', 'Campaña de vacunación', 'Estimada Laura, le informamos que la jornada de vacunación contra Influenza 2025 está disponible en su unidad médica a partir del 1 de octubre.', 'informacion', 0, '2026-05-12 15:47:51', NULL),
(2, 'MAGL850305MNLRMS04', 'XEXX010101HNEXXXA4', 'Dosis pendiente: Varicela', 'Tiene pendiente la 2.ª dosis de Varicela. Le recomendamos acudir a su unidad médica a la brevedad.', 'advertencia', 0, '2026-05-12 15:47:51', NULL),
(3, 'GARM850101HDFRRS04', 'XEXX010101HNEXXXA4', 'Actualización de expediente', 'Su expediente de vacunación ha sido actualizado. Por favor verifique su historial.', 'informacion', 0, '2026-05-12 15:47:51', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidades_medicas`
--

CREATE TABLE `unidades_medicas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` varchar(80) NOT NULL,
  `ciudad` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `unidades_medicas`
--

INSERT INTO `unidades_medicas` (`id`, `nombre`, `telefono`, `estado`, `ciudad`) VALUES
(1, 'UMF No. 27', '81 8158-0000', 'Nuevo León', 'San Pedro Garza García'),
(2, 'UMF No. 33', '81 8340-1100', 'Nuevo León', 'Monterrey'),
(3, 'UMF No. 44', '55 5726-1700', 'CDMX', 'Iztapalapa'),
(4, 'UMF No. 10', '33 3668-3000', 'Jalisco', 'Guadalajara');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `curp` varchar(18) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `apellido_paterno` varchar(80) NOT NULL,
  `apellido_materno` varchar(80) DEFAULT NULL,
  `celular` varchar(15) DEFAULT NULL,
  `correo` varchar(120) NOT NULL,
  `contrasena_hash` text DEFAULT NULL,
  `rol` enum('usuario','administrador') NOT NULL DEFAULT 'usuario',
  `unidad_medica_id` int(11) DEFAULT NULL,
  `medico_familiar` varchar(120) DEFAULT NULL,
  `nss` varchar(11) DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`curp`, `nombre`, `apellido_paterno`, `apellido_materno`, `celular`, `correo`, `contrasena_hash`, `rol`, `unidad_medica_id`, `medico_familiar`, `nss`, `creado_en`) VALUES
('GARM850101HDFRRS04', 'Carlos', 'García', 'Ramírez', '', 'carlos.garcia@gmail.com', '123', 'usuario', 2, 'Dr. Juan Torres Medina', '98765432101', '2026-05-12 15:47:51'),
('MAGL850305MNLRMS04', 'Laura', 'Martínez', 'Gómez', '+52 81 1234 567', 'laura.martinez@gmail.com', '123', 'usuario', 1, 'Dra. Laura Reyes Vázquez', '12345678901', '2026-05-12 15:47:51'),
('XEXX010101HNEXXXA4', 'Admin', 'Sistema', NULL, NULL, 'admin@plataforma.com', '123', 'administrador', NULL, NULL, NULL, '2026-05-12 15:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vacunas_catalogo`
--

CREATE TABLE `vacunas_catalogo` (
  `id` int(11) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `enfermedad` varchar(200) NOT NULL,
  `dosis_descripcion` varchar(200) DEFAULT NULL,
  `dosis_total` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `vacunas_catalogo`
--

INSERT INTO `vacunas_catalogo` (`id`, `nombre`, `enfermedad`, `dosis_descripcion`, `dosis_total`) VALUES
(1, 'BCG', 'Tuberculosis', 'Dosis única al nacer', 1),
(2, 'Hepatitis B', 'Hepatitis B', '3 dosis: nacer, 2 y 6 meses', 3),
(3, 'Pentavalente acelular', 'Difteria, tos ferina, tétanos, Hib, Hepatitis B', '4 dosis: 2, 4, 6 y 18 meses', 4),
(4, 'Rotavirus', 'Gastroenteritis por rotavirus', '2 dosis: 2 y 4 meses', 2),
(5, 'Neumocócica conjugada', 'Neumonía y meningitis neumocócica', '3 dosis: 2, 4 y 12 meses', 3),
(6, 'SRP (Triple viral)', 'Sarampión, rubéola y parotiditis', '2 dosis: 12 meses y 6 años', 2),
(7, 'Varicela', 'Varicela', '1 dosis a los 12 meses', 1),
(8, 'DPT (refuerzo)', 'Difteria, tos ferina, tétanos', 'Refuerzo a los 4 años', 1),
(9, 'Hepatitis A', 'Hepatitis A', '1 dosis a los 12 meses', 1),
(10, 'Influenza estacional', 'Influenza', 'Anual desde los 6 meses', 1),
(11, 'VPH', 'Cáncer cervicouterino y verrugas genitales', '2 dosis: niñas de 5.º grado o 11 años', 2),
(12, 'Td (adultos)', 'Tétanos y difteria', 'Refuerzo cada 10 años en adultos', 1),
(13, 'Neumocócica polisacárida', 'Neumonía en adultos mayores', '1 dosis en mayores de 65 años', 1),
(14, 'SR (doble viral)', 'Sarampión y rubéola', 'Para adultos sin esquema previo', 1),
(15, 'Toxoide tetánico (TT)', 'Tétanos', '5 dosis durante embarazo o riesgo', 5),
(16, '', '', NULL, 1),
(17, '', '', NULL, 1),
(18, '', '', NULL, 1),
(19, '', '', NULL, 1),
(20, '', '', NULL, 1),
(21, '', '', NULL, 1),
(22, '', '', NULL, 1),
(23, '', '', NULL, 1),
(24, '', '', NULL, 1),
(25, '', '', NULL, 1),
(26, '', '', NULL, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `historial_vacunas`
--
ALTER TABLE `historial_vacunas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_historial_curp` (`curp_usuario`),
  ADD KEY `fk_hv_vacuna` (`vacuna_id`),
  ADD KEY `fk_hv_modificado` (`modificado_por`);

--
-- Indices de la tabla `mensajes_buzon`
--
ALTER TABLE `mensajes_buzon`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mensajes_dest` (`destinatario_curp`),
  ADD KEY `idx_mensajes_no_leidos` (`destinatario_curp`,`leido`),
  ADD KEY `fk_mb_remitente` (`remitente_curp`);

--
-- Indices de la tabla `unidades_medicas`
--
ALTER TABLE `unidades_medicas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`curp`),
  ADD UNIQUE KEY `uq_correo` (`correo`),
  ADD KEY `fk_usuario_unidad` (`unidad_medica_id`);

--
-- Indices de la tabla `vacunas_catalogo`
--
ALTER TABLE `vacunas_catalogo`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `historial_vacunas`
--
ALTER TABLE `historial_vacunas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `mensajes_buzon`
--
ALTER TABLE `mensajes_buzon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `unidades_medicas`
--
ALTER TABLE `unidades_medicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `vacunas_catalogo`
--
ALTER TABLE `vacunas_catalogo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `historial_vacunas`
--
ALTER TABLE `historial_vacunas`
  ADD CONSTRAINT `fk_hv_modificado` FOREIGN KEY (`modificado_por`) REFERENCES `usuarios` (`curp`),
  ADD CONSTRAINT `fk_hv_usuario` FOREIGN KEY (`curp_usuario`) REFERENCES `usuarios` (`curp`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hv_vacuna` FOREIGN KEY (`vacuna_id`) REFERENCES `vacunas_catalogo` (`id`);

--
-- Filtros para la tabla `mensajes_buzon`
--
ALTER TABLE `mensajes_buzon`
  ADD CONSTRAINT `fk_mb_destinatario` FOREIGN KEY (`destinatario_curp`) REFERENCES `usuarios` (`curp`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mb_remitente` FOREIGN KEY (`remitente_curp`) REFERENCES `usuarios` (`curp`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuario_unidad` FOREIGN KEY (`unidad_medica_id`) REFERENCES `unidades_medicas` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

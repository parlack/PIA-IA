-- =============================================
-- Cartilla de Vacunacion Digital PIA-IA
-- Base de datos: vacunas
-- =============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Tabla: unidades_medicas
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `unidades_medicas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estado` varchar(80) NOT NULL,
  `ciudad` varchar(80) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `unidades_medicas` (`id`, `nombre`, `telefono`, `estado`, `ciudad`) VALUES
(1, 'UMF No. 27', '81 8158-0000', 'Nuevo Leon', 'San Pedro Garza Garcia'),
(2, 'UMF No. 33', '81 8340-1100', 'Nuevo Leon', 'Monterrey'),
(3, 'UMF No. 44', '55 5726-1700', 'CDMX', 'Iztapalapa'),
(4, 'UMF No. 10', '33 3668-3000', 'Jalisco', 'Guadalajara'),
(5, 'UMF No. 15', '81 8190-2200', 'Nuevo Leon', 'Guadalupe'),
(6, 'UMF No. 23', '55 5623-4500', 'CDMX', 'Tlalpan'),
(7, 'Hospital General de Zona No. 4', '81 8348-0100', 'Nuevo Leon', 'Monterrey');

-- --------------------------------------------------------
-- Tabla: usuarios
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuarios` (
  `curp` varchar(18) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `apellido_paterno` varchar(80) NOT NULL,
  `apellido_materno` varchar(80) DEFAULT NULL,
  `celular` varchar(15) DEFAULT NULL,
  `correo` varchar(120) NOT NULL,
  `contrasena_hash` text DEFAULT NULL,
  `rol` enum('usuario','administrador','medico') NOT NULL DEFAULT 'usuario',
  `unidad_medica_id` int(11) DEFAULT NULL,
  `medico_familiar` varchar(120) DEFAULT NULL,
  `nss` varchar(11) DEFAULT NULL,
  `grupo_prioritario` enum('ninguno','adulto_mayor','embarazada','personal_salud','cronico') NOT NULL DEFAULT 'ninguno',
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('H','M') DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`curp`),
  UNIQUE KEY `uq_correo` (`correo`),
  KEY `fk_usuario_unidad` (`unidad_medica_id`),
  CONSTRAINT `fk_usuario_unidad` FOREIGN KEY (`unidad_medica_id`) REFERENCES `unidades_medicas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`curp`, `nombre`, `apellido_paterno`, `apellido_materno`, `celular`, `correo`, `contrasena_hash`, `rol`, `unidad_medica_id`, `medico_familiar`, `nss`, `grupo_prioritario`, `fecha_nacimiento`, `sexo`) VALUES
('XEXX010101HNEXXXA4', 'Admin',     'Sistema',    NULL,        NULL,              'admin@plataforma.com',          '123', 'administrador', NULL, NULL,                           NULL,          'ninguno',        NULL,         NULL),
('MEDI800101HNLDDC01', 'Daniela',   'Medina',     'Cantu',     '8180000001',      'daniela.medina@piaia.mx',        '123', 'medico',        1,    NULL,                           NULL,          'personal_salud', '1980-01-01', 'M'),
('MEDI750505HNLDDR02', 'Rodrigo',   'Medina',     'Reyes',     '8180000002',      'rodrigo.medina@piaia.mx',        '123', 'medico',        7,    NULL,                           NULL,          'personal_salud', '1975-05-05', 'H'),
('MAGL850305MNLRMS04', 'Laura',     'Martinez',   'Gomez',     '+52 81 1234 567', 'laura.martinez@gmail.com',      '123', 'usuario',       1,    'Dra. Laura Reyes Vazquez',     '12345678901', 'ninguno',        '1985-03-05', 'M'),
('GARM850101HDFRRS04', 'Carlos',    'Garcia',     'Ramirez',   '+52 81 9876 543', 'carlos.garcia@gmail.com',       '123', 'usuario',       2,    'Dr. Juan Torres Medina',       '98765432101', 'ninguno',        '1985-01-01', 'H'),
('LOPR570812MNLPZS08', 'Rosa',      'Lopez',      'Perez',     '+52 81 5555 111', 'rosa.lopez@correo.com',         NULL,  'usuario',       1,    'Dra. Laura Reyes Vazquez',     '55512345678', 'adulto_mayor',   '1957-08-12', 'M'),
('HETR601230HDFRRS06', 'Roberto',   'Hernandez',  'Torres',    '+52 55 4444 222', 'roberto.hdz@outlook.com',       NULL,  'usuario',       3,    'Dr. Arturo Solis Cantu',       '66698765432', 'adulto_mayor',   '1960-12-30', 'H'),
('GUMA950715MNLTRR02', 'Maria',     'Gutierrez',  'Morales',   '+52 81 7777 333', 'maria.gutierrez@gmail.com',     '123', 'usuario',       5,    'Dra. Patricia Mendez Lopez',   '77712345678', 'embarazada',     '1995-07-15', 'M'),
('ROLF880920HDFLPS05', 'Fernando',  'Rodriguez',  'Lopez',     '+52 33 6666 444', 'fernando.rdz@hotmail.com',      '123', 'usuario',       4,    'Dr. Miguel Estrada',           '88898765432', 'personal_salud', '1988-09-20', 'H'),
('SAVL750403MNLLZR01', 'Leticia',   'Salazar',    'Vazquez',   '+52 81 3333 555', 'leticia.salazar@yahoo.com',     NULL,  'usuario',       2,    'Dr. Juan Torres Medina',       '33312345678', 'cronico',        '1975-04-03', 'M'),
('CAMJ000215HNLSRS09', 'Juan',      'Castillo',   'Moreno',    '+52 81 2222 666', 'juan.castillo@gmail.com',       '123', 'usuario',       7,    'Dr. Ricardo Garza',            '22298765432', 'ninguno',        '2000-02-15', 'H'),
('PEAL930610MNLRRR07', 'Adriana',   'Perez',      'Alvarado',  '+52 55 1111 777', 'adriana.perez@outlook.com',     NULL,  'usuario',       6,    'Dra. Sofia Leal',              '11112345678', 'ninguno',        '1993-06-10', 'M');

-- --------------------------------------------------------
-- Tabla: vacunas_catalogo
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `vacunas_catalogo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(120) NOT NULL,
  `enfermedad` varchar(200) NOT NULL,
  `dosis_descripcion` varchar(200) DEFAULT NULL,
  `dosis_total` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `vacunas_catalogo` (`id`, `nombre`, `enfermedad`, `dosis_descripcion`, `dosis_total`) VALUES
(1,  'BCG',                       'Tuberculosis',                                           'Dosis unica al nacer',                            1),
(2,  'Hepatitis B',               'Hepatitis B',                                            '3 dosis: nacer, 2 y 6 meses',                     3),
(3,  'Pentavalente acelular',     'Difteria, tos ferina, tetanos, Hib, Hepatitis B',        '4 dosis: 2, 4, 6 y 18 meses',                     4),
(4,  'Rotavirus',                 'Gastroenteritis por rotavirus',                           '2 dosis: 2 y 4 meses',                            2),
(5,  'Neumococica conjugada',     'Neumonia y meningitis neumococica',                       '3 dosis: 2, 4 y 12 meses',                        3),
(6,  'SRP (Triple viral)',        'Sarampion, rubeola y parotiditis',                        '2 dosis: 12 meses y 6 anos',                      2),
(7,  'Varicela',                  'Varicela',                                                '1 dosis a los 12 meses',                          1),
(8,  'DPT (refuerzo)',            'Difteria, tos ferina, tetanos',                           'Refuerzo a los 4 anos',                           1),
(9,  'Hepatitis A',               'Hepatitis A',                                            '1 dosis a los 12 meses',                          1),
(10, 'Influenza estacional',      'Influenza',                                               'Anual desde los 6 meses',                         1),
(11, 'VPH',                       'Cancer cervicouterino y verrugas genitales',               '2 dosis: ninas de 5to grado o 11 anos',           2),
(12, 'Td (adultos)',              'Tetanos y difteria',                                      'Refuerzo cada 10 anos en adultos',                1),
(13, 'Neumococica polisacarida',  'Neumonia en adultos mayores',                              '1 dosis en mayores de 65 anos',                   1),
(14, 'SR (doble viral)',          'Sarampion y rubeola',                                     'Para adultos sin esquema previo',                 1),
(15, 'Toxoide tetanico (TT)',     'Tetanos',                                                 '5 dosis durante embarazo o riesgo',               5),
(16, 'COVID-19',                  'SARS-CoV-2',                                              '2 dosis + refuerzos anuales',                     3),
(17, 'Dengvaxia (Dengue)',        'Dengue',                                                  '3 dosis a partir de los 9 anos',                  3);

-- --------------------------------------------------------
-- Tabla: historial_vacunas
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `historial_vacunas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curp_usuario` varchar(18) NOT NULL,
  `vacuna_id` int(11) NOT NULL,
  `numero_dosis` tinyint(4) NOT NULL DEFAULT 1,
  `fecha_aplicacion` date NOT NULL,
  `lugar_aplicacion` varchar(200) DEFAULT NULL,
  `lote` varchar(60) DEFAULT NULL,
  `modificado_por` varchar(18) DEFAULT NULL,
  `registrado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_historial_curp` (`curp_usuario`),
  KEY `fk_hv_vacuna` (`vacuna_id`),
  KEY `fk_hv_modificado` (`modificado_por`),
  CONSTRAINT `fk_hv_usuario` FOREIGN KEY (`curp_usuario`) REFERENCES `usuarios` (`curp`) ON DELETE CASCADE,
  CONSTRAINT `fk_hv_vacuna` FOREIGN KEY (`vacuna_id`) REFERENCES `vacunas_catalogo` (`id`),
  CONSTRAINT `fk_hv_modificado` FOREIGN KEY (`modificado_por`) REFERENCES `usuarios` (`curp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Laura Martinez - esquema bastante completo
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('MAGL850305MNLRMS04', 1,  1, '2020-03-15', 'UMF No. 27', 'LOT-BCG-001',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 2,  1, '2020-06-01', 'UMF No. 27', 'LOT-HB-002',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 2,  2, '2020-08-01', 'UMF No. 27', 'LOT-HB-002',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 2,  3, '2020-12-01', 'UMF No. 27', 'LOT-HB-003',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 3,  1, '2020-09-10', 'UMF No. 27', 'LOT-PV-004',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 3,  2, '2020-11-10', 'UMF No. 27', 'LOT-PV-004',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 3,  3, '2021-01-10', 'UMF No. 27', 'LOT-PV-005',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 4,  1, '2020-10-12', 'UMF No. 27', 'LOT-RV-006',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 4,  2, '2020-12-12', 'UMF No. 27', 'LOT-RV-006',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 5,  1, '2021-02-01', 'UMF No. 27', 'LOT-NC-007',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 5,  2, '2021-04-01', 'UMF No. 27', 'LOT-NC-007',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 5,  3, '2021-06-01', 'UMF No. 27', 'LOT-NC-008',   'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 6,  1, '2022-04-03', 'UMF No. 27', 'LOT-SRP-009',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 6,  2, '2022-06-03', 'UMF No. 27', 'LOT-SRP-009',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 7,  1, '2021-03-20', 'UMF No. 27', 'LOT-VAR-013',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 8,  1, '2023-08-17', 'UMF No. 27', 'LOT-DPT-010',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 10, 1, '2025-04-05', 'UMF No. 27', 'LOT-INF-011',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 11, 1, '2024-01-14', 'UMF No. 27', 'LOT-VPH-012',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 11, 2, '2024-07-14', 'UMF No. 27', 'LOT-VPH-012',  'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 16, 1, '2021-05-20', 'Centro de Vacunacion Cumbres', 'LOT-COV-100', 'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 16, 2, '2021-07-15', 'Centro de Vacunacion Cumbres', 'LOT-COV-101', 'XEXX010101HNEXXXA4'),
('MAGL850305MNLRMS04', 16, 3, '2022-02-10', 'UMF No. 27', 'LOT-COV-150', 'XEXX010101HNEXXXA4');

-- Carlos Garcia - esquema parcial
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('GARM850101HDFRRS04', 1,  1, '2019-01-10', 'UMF No. 33', 'LOT-BCG-020',  'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 2,  1, '2019-03-10', 'UMF No. 33', 'LOT-HB-021',   'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 2,  2, '2019-05-10', 'UMF No. 33', 'LOT-HB-021',   'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 10, 1, '2024-11-01', 'UMF No. 33', 'LOT-INF-022',  'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 12, 1, '2020-06-15', 'UMF No. 33', 'LOT-TD-023',   'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 16, 1, '2021-06-01', 'Estadio Universitario UANL',  'LOT-COV-110', 'XEXX010101HNEXXXA4'),
('GARM850101HDFRRS04', 16, 2, '2021-08-01', 'Estadio Universitario UANL',  'LOT-COV-111', 'XEXX010101HNEXXXA4');

-- Rosa Lopez (adulto mayor) - esquema con vacunas prioritarias
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('LOPR570812MNLPZS08', 10, 1, '2025-03-10', 'UMF No. 27', 'LOT-INF-030',  'XEXX010101HNEXXXA4'),
('LOPR570812MNLPZS08', 13, 1, '2024-09-05', 'UMF No. 27', 'LOT-NP-031',   'XEXX010101HNEXXXA4'),
('LOPR570812MNLPZS08', 12, 1, '2023-01-20', 'UMF No. 27', 'LOT-TD-032',   'XEXX010101HNEXXXA4'),
('LOPR570812MNLPZS08', 16, 1, '2021-04-10', 'Parque Fundidora', 'LOT-COV-120', 'XEXX010101HNEXXXA4'),
('LOPR570812MNLPZS08', 16, 2, '2021-06-10', 'Parque Fundidora', 'LOT-COV-121', 'XEXX010101HNEXXXA4'),
('LOPR570812MNLPZS08', 16, 3, '2022-03-15', 'UMF No. 27', 'LOT-COV-155', 'XEXX010101HNEXXXA4');

-- Roberto Hernandez (adulto mayor)
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('HETR601230HDFRRS06', 10, 1, '2025-02-20', 'UMF No. 44', 'LOT-INF-040',  'XEXX010101HNEXXXA4'),
('HETR601230HDFRRS06', 13, 1, '2024-08-12', 'UMF No. 44', 'LOT-NP-041',   'XEXX010101HNEXXXA4'),
('HETR601230HDFRRS06', 16, 1, '2021-07-01', 'Centro de Salud Iztapalapa', 'LOT-COV-130', 'XEXX010101HNEXXXA4'),
('HETR601230HDFRRS06', 16, 2, '2021-09-01', 'Centro de Salud Iztapalapa', 'LOT-COV-131', 'XEXX010101HNEXXXA4');

-- Maria Gutierrez (embarazada) - vacunas de embarazo
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('GUMA950715MNLTRR02', 15, 1, '2025-01-10', 'UMF No. 15', 'LOT-TT-050',   'XEXX010101HNEXXXA4'),
('GUMA950715MNLTRR02', 15, 2, '2025-03-10', 'UMF No. 15', 'LOT-TT-051',   'XEXX010101HNEXXXA4'),
('GUMA950715MNLTRR02', 10, 1, '2025-04-01', 'UMF No. 15', 'LOT-INF-052',  'XEXX010101HNEXXXA4'),
('GUMA950715MNLTRR02', 16, 1, '2021-08-20', 'Centro de Vacunacion Guadalupe', 'LOT-COV-140', 'XEXX010101HNEXXXA4'),
('GUMA950715MNLTRR02', 16, 2, '2021-10-20', 'Centro de Vacunacion Guadalupe', 'LOT-COV-141', 'XEXX010101HNEXXXA4');

-- Fernando Rodriguez (personal de salud) - esquema completo por protocolo
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('ROLF880920HDFLPS05', 2,  1, '2018-01-15', 'UMF No. 10', 'LOT-HB-060',  'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 2,  2, '2018-03-15', 'UMF No. 10', 'LOT-HB-060',  'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 2,  3, '2018-07-15', 'UMF No. 10', 'LOT-HB-061',  'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 10, 1, '2025-03-01', 'UMF No. 10', 'LOT-INF-062', 'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 12, 1, '2022-05-20', 'UMF No. 10', 'LOT-TD-063',  'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 14, 1, '2019-08-10', 'UMF No. 10', 'LOT-SR-064',  'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 16, 1, '2021-01-15', 'Hospital General de Zona No. 4', 'LOT-COV-160', 'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 16, 2, '2021-02-12', 'Hospital General de Zona No. 4', 'LOT-COV-161', 'XEXX010101HNEXXXA4'),
('ROLF880920HDFLPS05', 16, 3, '2021-12-01', 'Hospital General de Zona No. 4', 'LOT-COV-170', 'XEXX010101HNEXXXA4');

-- Leticia Salazar (cronico)
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('SAVL750403MNLLZR01', 10, 1, '2025-04-10', 'UMF No. 33', 'LOT-INF-070', 'XEXX010101HNEXXXA4'),
('SAVL750403MNLLZR01', 13, 1, '2024-07-25', 'UMF No. 33', 'LOT-NP-071',  'XEXX010101HNEXXXA4'),
('SAVL750403MNLLZR01', 16, 1, '2021-05-01', 'Parque Fundidora', 'LOT-COV-180', 'XEXX010101HNEXXXA4'),
('SAVL750403MNLLZR01', 16, 2, '2021-07-01', 'Parque Fundidora', 'LOT-COV-181', 'XEXX010101HNEXXXA4');

-- Juan Castillo (joven)
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('CAMJ000215HNLSRS09', 1,  1, '2000-02-20', 'Hospital General de Zona No. 4', 'LOT-BCG-080', 'XEXX010101HNEXXXA4'),
('CAMJ000215HNLSRS09', 2,  1, '2000-04-15', 'Hospital General de Zona No. 4', 'LOT-HB-081',  'XEXX010101HNEXXXA4'),
('CAMJ000215HNLSRS09', 2,  2, '2000-06-15', 'Hospital General de Zona No. 4', 'LOT-HB-081',  'XEXX010101HNEXXXA4'),
('CAMJ000215HNLSRS09', 2,  3, '2000-10-15', 'Hospital General de Zona No. 4', 'LOT-HB-082',  'XEXX010101HNEXXXA4'),
('CAMJ000215HNLSRS09', 16, 1, '2021-09-10', 'Estadio Universitario UANL', 'LOT-COV-190', 'XEXX010101HNEXXXA4'),
('CAMJ000215HNLSRS09', 16, 2, '2021-11-10', 'Estadio Universitario UANL', 'LOT-COV-191', 'XEXX010101HNEXXXA4');

-- Adriana Perez
INSERT INTO `historial_vacunas` (`curp_usuario`, `vacuna_id`, `numero_dosis`, `fecha_aplicacion`, `lugar_aplicacion`, `lote`, `modificado_por`) VALUES
('PEAL930610MNLRRR07', 10, 1, '2025-03-15', 'UMF No. 23', 'LOT-INF-090', 'XEXX010101HNEXXXA4'),
('PEAL930610MNLRRR07', 11, 1, '2023-05-20', 'UMF No. 23', 'LOT-VPH-091', 'XEXX010101HNEXXXA4'),
('PEAL930610MNLRRR07', 16, 1, '2021-06-15', 'Centro de Salud Tlalpan', 'LOT-COV-200', 'XEXX010101HNEXXXA4'),
('PEAL930610MNLRRR07', 16, 2, '2021-08-15', 'Centro de Salud Tlalpan', 'LOT-COV-201', 'XEXX010101HNEXXXA4');

-- --------------------------------------------------------
-- Tabla: mensajes_buzon
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `mensajes_buzon` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `destinatario_curp` varchar(18) NOT NULL,
  `remitente_curp` varchar(18) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `contenido` text NOT NULL,
  `tipo` enum('informacion','advertencia','urgente') NOT NULL DEFAULT 'informacion',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `enviado_en` datetime NOT NULL DEFAULT current_timestamp(),
  `leido_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mensajes_dest` (`destinatario_curp`),
  KEY `idx_mensajes_no_leidos` (`destinatario_curp`, `leido`),
  KEY `fk_mb_remitente` (`remitente_curp`),
  CONSTRAINT `fk_mb_destinatario` FOREIGN KEY (`destinatario_curp`) REFERENCES `usuarios` (`curp`) ON DELETE CASCADE,
  CONSTRAINT `fk_mb_remitente` FOREIGN KEY (`remitente_curp`) REFERENCES `usuarios` (`curp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `mensajes_buzon` (`destinatario_curp`, `remitente_curp`, `titulo`, `contenido`, `tipo`, `leido`, `enviado_en`) VALUES
('MAGL850305MNLRMS04', 'XEXX010101HNEXXXA4', 'Campana de vacunacion Influenza 2025',     'Estimada Laura, le informamos que la jornada de vacunacion contra Influenza 2025 esta disponible en su unidad medica UMF No. 27 a partir del 1 de octubre. Acuda con su cartilla de vacunacion.',   'informacion',  0, '2025-09-15 10:00:00'),
('MAGL850305MNLRMS04', 'XEXX010101HNEXXXA4', 'Dosis pendiente: Hepatitis A', 'Tiene pendiente la dosis de Hepatitis A. Le recomendamos acudir a su unidad medica UMF No. 27 a la brevedad para completar su esquema de vacunacion.',                                                    'advertencia',  0, '2025-08-20 09:30:00'),
('MAGL850305MNLRMS04', 'XEXX010101HNEXXXA4', 'Refuerzo Td proximo', 'Su refuerzo de vacuna Td (Tetanos y Difteria) esta proximo. Recuerde que debe aplicarse cada 10 anos.',                                                    'informacion',  1, '2025-07-01 14:00:00'),
('GARM850101HDFRRS04', 'XEXX010101HNEXXXA4', 'Esquema incompleto de Hepatitis B', 'Estimado Carlos, su esquema de Hepatitis B esta incompleto (2 de 3 dosis). Le sugerimos acudir a UMF No. 33 para completar su esquema.',                                                                   'advertencia',  0, '2025-09-01 11:00:00'),
('GARM850101HDFRRS04', 'XEXX010101HNEXXXA4', 'Refuerzo COVID-19 disponible', 'Ya esta disponible el refuerzo anual de la vacuna COVID-19. Acuda a su unidad medica mas cercana.',                                                                   'informacion',  0, '2025-08-10 08:00:00'),
('LOPR570812MNLPZS08', 'XEXX010101HNEXXXA4', 'Recordatorio: Influenza anual', 'Estimada Sra. Rosa, como adulto mayor es prioritario que reciba su vacuna anual de Influenza. Esta disponible en su UMF.',                                                                   'urgente',  0, '2025-09-20 09:00:00'),
('LOPR570812MNLPZS08', 'XEXX010101HNEXXXA4', 'Jornada de vacunacion para adultos mayores', 'Se llevara a cabo una jornada especial de vacunacion para adultos mayores el proximo 15 de octubre en Parque Fundidora.',                                                                   'informacion',  0, '2025-09-25 10:00:00'),
('GUMA950715MNLTRR02', 'XEXX010101HNEXXXA4', 'Vacunas durante el embarazo', 'Estimada Maria, recuerde que durante el embarazo es importante completar su esquema de Toxoide Tetanico. Tiene 2 de 5 dosis aplicadas.',                                                                   'advertencia',  0, '2025-04-15 11:00:00'),
('GUMA950715MNLTRR02', 'XEXX010101HNEXXXA4', 'Control prenatal y vacunacion', 'Le recordamos que su proximo control prenatal debe incluir revision de su cartilla de vacunacion. Acuda a UMF No. 15.',                                                                   'informacion',  0, '2025-05-01 09:00:00'),
('ROLF880920HDFLPS05', 'XEXX010101HNEXXXA4', 'Protocolo vacunacion personal de salud', 'Estimado Fernando, como personal de salud su esquema de vacunacion debe estar completo. Revise su historial y acuda a HGZ No. 4 para vacunas faltantes.',                                                                   'informacion',  0, '2025-08-01 08:00:00'),
('SAVL750403MNLLZR01', 'XEXX010101HNEXXXA4', 'Vacunacion para pacientes cronicos', 'Estimada Leticia, como paciente con condiciones cronicas es importante que mantenga su esquema de vacunacion al dia. Acuda a UMF No. 33.',                                                                   'advertencia',  0, '2025-09-05 10:00:00'),
('CAMJ000215HNLSRS09', 'XEXX010101HNEXXXA4', 'Esquema de vacunacion incompleto', 'Estimado Juan, detectamos que tu esquema de vacunacion tiene varias vacunas pendientes. Te recomendamos acudir a HGZ No. 4 para una revision completa.',                                                                   'advertencia',  0, '2025-09-10 14:00:00'),
('PEAL930610MNLRRR07', 'XEXX010101HNEXXXA4', 'Dosis pendiente VPH', 'Estimada Adriana, tienes pendiente la 2da dosis de VPH. Acude a UMF No. 23 para completar tu esquema.',                                                                   'advertencia',  0, '2025-08-25 09:00:00');

COMMIT;

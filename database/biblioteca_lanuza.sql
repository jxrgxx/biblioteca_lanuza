-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 30-04-2026 a las 11:09:51
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
-- Base de datos: `biblioteca_lanuza`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `config`
--

CREATE TABLE `config` (
  `clave` varchar(50) NOT NULL,
  `valor` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `config`
--

INSERT INTO `config` (`clave`, `valor`) VALUES
('codigo_registro', 'AGHSQE');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estanteria`
--

CREATE TABLE `estanteria` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estanteria`
--

INSERT INTO `estanteria` (`id`, `nombre`) VALUES
(1, 'A1 - Comics'),
(2, 'A1 - Mangas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `libro`
--

CREATE TABLE `libro` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(6) DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `autor` varchar(150) DEFAULT NULL,
  `editorial` varchar(100) DEFAULT NULL,
  `volumen` int(11) DEFAULT NULL,
  `idioma` varchar(50) DEFAULT NULL,
  `genero` varchar(100) DEFAULT NULL,
  `estanteria` varchar(50) DEFAULT NULL,
  `categoria` varchar(100) NOT NULL,
  `estado` enum('disponible','prestado','extraviado','no disponible') NOT NULL DEFAULT 'disponible',
  `nombre_foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `libro`
--

INSERT INTO `libro` (`id`, `codigo`, `titulo`, `autor`, `editorial`, `volumen`, `idioma`, `genero`, `estanteria`, `categoria`, `estado`, `nombre_foto`) VALUES
(1, 'L_1', 'Invencible', 'Robert Kirkman', 'ECC', 144, 'Español', 'Superhéroes', 'A1 - Comics', '', 'disponible', 'invencible_144_1776861664511.jpg'),
(2, 'L_2', 'One Piece', 'Eiichiro Oda', 'Planeta Cómic', 1, 'Español', 'Aventura', 'A1 - Mangas', '', 'disponible', NULL),
(3, 'L_3', 'Naruto', 'Masashi Kishimoto', 'Planeta Cómic', 1, 'Español', 'Acción', 'A1 - Mangas', '', 'disponible', NULL),
(4, 'L_4', 'Dragon Ball', 'Akira Toriyama', 'Planeta Cómic', 1, 'Español', 'Aventura', 'A1 - Mangas', '', 'prestado', NULL),
(5, 'L_5', 'El nombre del viento', 'Patrick Rothfuss', 'Plaza & Janés', NULL, 'Español', 'Fantasía', NULL, '', 'disponible', NULL),
(6, 'L_6', 'Harry Potter y la piedra filosofal', 'J.K. Rowling', 'Salamandra', 1, 'Español', 'Fantasía', NULL, '', 'disponible', NULL),
(7, 'L_7', 'El señor de los anillos', 'J.R.R. Tolkien', 'Minotauro', NULL, 'Español', 'Fantasía', NULL, '', 'prestado', NULL),
(8, 'L_8', 'Dune', 'Frank Herbert', 'Debolsillo', NULL, 'Español', 'Ciencia Ficción', NULL, '', 'disponible', NULL),
(9, 'L_9', 'Batman: El regreso del Caballero Oscuro', 'Frank Miller', 'ECC', NULL, 'Español', 'Superhéroes', 'A1 - Comics', '', 'disponible', NULL),
(10, 'L_10', 'Watchmen', 'Alan Moore', 'ECC', NULL, 'Español', 'Superhéroes', 'A1 - Comics', '', 'extraviado', NULL),
(11, 'L_11', 'Saga', 'Brian K. Vaughan', 'ECC', 1, 'Español', 'Ciencia Ficción', 'A1 - Comics', '', 'disponible', NULL),
(12, 'L_12', 'Diario de Greg', 'Jeff Kinney', 'RBA', 1, 'Español', 'Humor', NULL, '', 'disponible', NULL),
(13, 'L_13', 'Los juegos del hambre', 'Suzanne Collins', 'Molino', 1, 'Español', 'Distopía', NULL, '', 'disponible', NULL),
(14, 'L_14', 'Divergente', 'Veronica Roth', 'Molino', 1, 'Español', 'Distopía', NULL, '', 'disponible', NULL),
(15, 'L_15', 'It', 'Stephen King', 'Debolsillo', NULL, 'Español', 'Terror', NULL, '', 'disponible', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset`
--

CREATE TABLE `password_reset` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `password_reset`
--

INSERT INTO `password_reset` (`id`, `id_usuario`, `token`, `expires_at`, `usado`, `created_at`) VALUES
(1, 10, 'c1cec9ebc76f8569ac730991c1e32a0e72ed3c5feefee6ffc59ecc23bd290cf5', '2026-04-28 16:01:36', 1, '2026-04-28 13:01:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prestamo`
--

CREATE TABLE `prestamo` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(6) DEFAULT NULL,
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `id_libro` int(10) UNSIGNED NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_devolucion_prevista` date DEFAULT NULL,
  `fecha_devolucion_real` date DEFAULT NULL,
  `devuelto` tinyint(1) NOT NULL DEFAULT 0,
  `codigo_lote` varchar(9) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `prestamo`
--

INSERT INTO `prestamo` (`id`, `codigo`, `id_usuario`, `id_libro`, `fecha_inicio`, `fecha_devolucion_prevista`, `fecha_devolucion_real`, `devuelto`, `codigo_lote`, `created_at`) VALUES
(12, '9XTWXS', 10, 1, '2026-04-28', '2026-04-29', '2026-04-28', 1, NULL, '2026-04-29 14:13:09'),
(13, 'HTWDUG', 1, 1, '2026-04-28', '2026-04-30', '2026-04-28', 1, NULL, '2026-04-29 14:13:09'),
(14, 'M2EDFY', 10, 1, '2026-04-28', '2026-04-30', '2026-04-29', 1, NULL, '2026-04-29 14:13:09'),
(15, 'L74YNB', 10, 1, '2026-04-28', '2026-05-01', '2026-04-28', 1, NULL, '2026-04-29 14:13:09'),
(16, 'AK3T9P', 11, 4, '2026-04-20', '2026-05-05', NULL, 0, NULL, '2026-04-29 14:13:09'),
(17, 'BX7MNQ', 12, 7, '2026-04-22', '2026-05-06', NULL, 0, NULL, '2026-04-29 14:13:09'),
(18, 'CZ2WRF', 13, 14, '2026-04-25', '2026-05-09', '2026-04-29', 1, NULL, '2026-04-29 14:13:09'),
(20, 'EY8KJV', 11, 7, '2026-03-15', '2026-03-29', NULL, 0, NULL, '2026-04-29 14:13:09'),
(21, 'FN4QSU', 12, 4, '2026-03-20', '2026-04-03', NULL, 0, NULL, '2026-04-29 14:13:09'),
(22, 'GT6RAB', 15, 2, '2026-04-01', '2026-04-15', '2026-04-29', 1, NULL, '2026-04-29 14:13:09'),
(23, 'HM9WCD', 16, 3, '2026-04-05', '2026-04-19', '2026-04-18', 1, NULL, '2026-04-29 14:13:09'),
(24, 'JP2XEF', 17, 5, '2026-04-08', '2026-04-22', '2026-04-20', 1, NULL, '2026-04-29 14:13:09'),
(25, 'KR5YGH', 18, 6, '2026-04-10', '2026-04-24', '2026-04-23', 1, NULL, '2026-04-29 14:13:09'),
(26, 'LT8ZJK', 11, 8, '2026-03-01', '2026-03-15', '2026-03-22', 1, NULL, '2026-04-29 14:13:09'),
(27, 'MV3ALM', 12, 9, '2026-03-05', '2026-03-19', '2026-03-28', 1, NULL, '2026-04-29 14:13:09'),
(28, 'NW6BNP', 13, 11, '2026-03-10', '2026-03-24', '2026-04-01', 1, NULL, '2026-04-29 14:13:09'),
(30, 'QY2DST', 11, 13, '2026-02-15', '2026-03-01', '2026-02-28', 1, NULL, '2026-04-29 14:13:09'),
(31, 'DSN8TY', 21, 9, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(32, 'WR2AX2', 21, 12, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(33, '95ACU6', 21, 8, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(34, '9V5F8L', 21, 5, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(35, 'Q3GM4W', 21, 6, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(36, 'J9QQQ4', 21, 1, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-NPY6Q4', '2026-04-29 14:13:09'),
(37, '2VMTQB', 11, 9, '2026-04-29', '2026-04-30', '2026-04-29', 1, NULL, '2026-04-29 14:13:09'),
(38, '7KD5G6', 10, 1, '2026-04-29', '2026-04-30', '2026-04-29', 1, NULL, '2026-04-29 14:13:09'),
(39, 'YLGH6C', 22, 9, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(40, '6UAA58', 22, 12, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(41, 'MZ7VBC', 22, 8, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(42, 'LENBC7', 22, 5, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(43, 'MKBTXD', 22, 6, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(44, '582RCE', 22, 1, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-7TF3AR', '2026-04-29 14:13:09'),
(45, 'XRKKBK', 10, 9, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(46, '4TNNZ6', 10, 12, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(47, 'CBP5K8', 10, 8, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(48, 'ZVTR2W', 10, 5, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(49, 'WR3CAF', 10, 6, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(50, 'T89MAZ', 10, 1, '2026-04-29', '2026-05-01', '2026-04-29', 1, 'PM-CQF5R4', '2026-04-29 14:13:09'),
(51, '7KQ2FA', 10, 1, '2026-04-29', '2026-04-30', '2026-04-29', 1, 'PM-SY3WGE', '2026-04-29 14:13:09'),
(52, 'HTT7KH', 10, 11, '2026-04-29', NULL, '2026-04-29', 1, 'PM-BTREZA', '2026-04-29 14:13:09'),
(53, 'GMPFU8', 10, 1, '2026-04-29', '2026-04-30', '2026-04-30', 1, NULL, '2026-04-29 14:28:25'),
(54, 'F32F5G', 10, 1, '2026-04-30', '2026-05-01', '2026-04-30', 1, NULL, '2026-04-30 07:37:43'),
(55, 'CHP7Q9', 10, 1, '2026-04-30', '2026-05-01', '2026-04-30', 1, NULL, '2026-04-30 08:02:34'),
(56, '9R8CMR', 10, 1, '2026-04-30', NULL, '2026-04-30', 1, 'PM-937P2Y', '2026-04-30 08:59:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recordatorio`
--

CREATE TABLE `recordatorio` (
  `id` int(10) UNSIGNED NOT NULL,
  `id_prestamo` int(10) UNSIGNED DEFAULT NULL,
  `codigo_lote` varchar(9) DEFAULT NULL,
  `enviar_en` datetime NOT NULL,
  `enviado` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro`
--

CREATE TABLE `registro` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo_usuario` varchar(10) DEFAULT NULL,
  `curso` enum('1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria','1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach') NOT NULL,
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `registro`
--

INSERT INTO `registro` (`id`, `nombre`, `codigo_usuario`, `curso`, `fecha`) VALUES
(27, 'María García López', 'U_11', '1º ESO', '2026-04-07'),
(28, 'Carlos Martínez Ruiz', 'U_12', '2º ESO', '2026-04-07'),
(29, 'Laura Sánchez Mora', 'U_13', '3º ESO', '2026-04-07'),
(30, 'Diego Fernández Gil', 'U_14', '4º ESO', '2026-04-07'),
(31, 'Ana López Serrano', 'U_15', '1º Bach', '2026-04-08'),
(32, 'Pablo Romero Vega', 'U_16', '2º Bach', '2026-04-08'),
(33, 'Sofía Jiménez Castro', 'U_17', '5º Primaria', '2026-04-08'),
(34, 'Miguel Torres Blanco', 'U_18', '6º Primaria', '2026-04-08'),
(35, 'María García López', 'U_11', '1º ESO', '2026-04-09'),
(36, 'alumno prueba', 'U_8', '3º ESO', '2026-04-09'),
(37, 'Carlos Martínez Ruiz', 'U_12', '2º ESO', '2026-04-10'),
(38, 'Laura Sánchez Mora', 'U_13', '3º ESO', '2026-04-10'),
(39, 'Ana López Serrano', 'U_15', '1º Bach', '2026-04-11'),
(40, 'Pablo Romero Vega', 'U_16', '2º Bach', '2026-04-11'),
(41, 'Diego Fernández Gil', 'U_14', '4º ESO', '2026-04-14'),
(42, 'Sofía Jiménez Castro', 'U_17', '5º Primaria', '2026-04-14'),
(43, 'Miguel Torres Blanco', 'U_18', '6º Primaria', '2026-04-14'),
(44, 'María García López', 'U_11', '1º ESO', '2026-04-22'),
(45, 'Carlos Martínez Ruiz', 'U_12', '2º ESO', '2026-04-22'),
(46, 'Laura Sánchez Mora', 'U_13', '3º ESO', '2026-04-23'),
(47, 'Ana López Serrano', 'U_15', '1º Bach', '2026-04-23'),
(48, 'Pablo Romero Vega', 'U_16', '2º Bach', '2026-04-24'),
(49, 'alumno prueba', 'U_8', '3º ESO', '2026-04-24'),
(50, 'Alumno Prueba2', 'U_9', '4º ESO', '2026-04-25'),
(51, 'Diego Fernández Gil', 'U_14', '4º ESO', '2026-04-25'),
(52, 'María García López', 'U_11', '1º ESO', '2026-04-28'),
(53, 'Laura Sánchez Mora', 'U_13', '3º ESO', '2026-04-29'),
(54, 'Laura Sánchez Mora', 'U_13', '2º Primaria', '2026-04-30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(20) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('personal','profesorado','alumno','biblioteca','admin') NOT NULL,
  `ubicacion` enum('1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria','1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach') DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_alta` date DEFAULT NULL,
  `fecha_baja` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id`, `codigo`, `nombre`, `apellidos`, `email`, `password`, `rol`, `ubicacion`, `activo`, `fecha_alta`, `fecha_baja`) VALUES
(1, 'U_1', 'Biblioteca', 'Juan de Lanuza', 'biblioteca@juandelanuza.org', '$2a$10$1y6zBd.ELhFBL5madTGpvuheV5PDdPJeo4EHbQJSF/YAVn7NosK1G', 'biblioteca', NULL, 1, NULL, NULL),
(10, 'U_10', 'Jorge Lei', 'León Pérez', 'practicasinfor@juandelanuza.org', '$2a$10$bRiY7rDaemlDX0sj4T72ROZ0e0lJCTCoSWeT8uij5Gy9uukP0XaCC', 'personal', NULL, 1, NULL, NULL),
(11, 'U_11', 'María', 'García López', 'maria.garcia@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(12, 'U_12', 'Carlos', 'Martínez Ruiz', 'carlos.martinez@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(13, 'U_13', 'Laura', 'Sánchez Mora', 'laura.sanchez@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(15, 'U_15', 'Ana', 'López Serrano', 'ana.lopez@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', NULL, 0, NULL, NULL),
(16, 'U_16', 'Pablo', 'Romero Vega', 'pablo.romero@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(17, 'U_17', 'Sofía', 'Jiménez Castro', 'sofia.jimenez@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(18, 'U_18', 'Miguel', 'Torres Blanco', 'miguel.torres@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'alumno', '2º Primaria', 1, NULL, NULL),
(19, 'U_19', 'Elena', 'Navarro Pinto', 'elena.navarro@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'profesorado', '2º ESO', 1, NULL, NULL),
(20, 'U_20', 'Roberto', 'Díaz Herrera', 'roberto.diaz@juandelanuza.org', '$2a$10$ghGuV90zM8Z45WNZ4I0W9uyGBZiK724ARcDyvrpriyQ4vC4tPzzCa', 'profesorado', '1º Bach', 0, NULL, '2026-04-29'),
(21, 'U_21', 'prueba', 'profesor', 'prueba@juandelanuza.org', '$2a$10$Gr8nqxojDmUSvgcincFb5.6KyI0QTqvkd224J.6sg2wzSJKoVYDde', 'profesorado', '2º Bach', 1, '2026-04-29', NULL),
(22, 'U_22', 'Jorge ', 'Ferrando', 'jferrando@juandelanuza.org', '$2a$10$hb.PhOq9GKCKo4Q4qsKftuPqkEw4yp189TGgwpSbgBdjht./YBiZ6', 'personal', NULL, 1, '2026-04-29', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `config`
--
ALTER TABLE `config`
  ADD PRIMARY KEY (`clave`);

--
-- Indices de la tabla `estanteria`
--
ALTER TABLE `estanteria`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `libro`
--
ALTER TABLE `libro`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `password_reset`
--
ALTER TABLE `password_reset`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`);

--
-- Indices de la tabla `prestamo`
--
ALTER TABLE `prestamo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `id_libro` (`id_libro`),
  ADD KEY `prestamo_ibfk_1` (`id_usuario`),
  ADD KEY `idx_codigo_lote` (`codigo_lote`);

--
-- Indices de la tabla `recordatorio`
--
ALTER TABLE `recordatorio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pendientes` (`enviado`,`enviar_en`);

--
-- Indices de la tabla `registro`
--
ALTER TABLE `registro`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estanteria`
--
ALTER TABLE `estanteria`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `libro`
--
ALTER TABLE `libro`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `password_reset`
--
ALTER TABLE `password_reset`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `prestamo`
--
ALTER TABLE `prestamo`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de la tabla `recordatorio`
--
ALTER TABLE `recordatorio`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `registro`
--
ALTER TABLE `registro`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `prestamo`
--
ALTER TABLE `prestamo`
  ADD CONSTRAINT `prestamo_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `prestamo_ibfk_2` FOREIGN KEY (`id_libro`) REFERENCES `libro` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

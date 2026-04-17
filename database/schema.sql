CREATE DATABASE IF NOT EXISTS biblioteca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biblioteca;

CREATE TABLE registro (
    id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    curso  ENUM('1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach') NOT NULL,
    fecha  DATE NOT NULL
);

CREATE TABLE libro (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    titulo      VARCHAR(255) NOT NULL,
    autor       VARCHAR(150),
    editorial   VARCHAR(100),
    volumen     INT,
    idioma      VARCHAR(50),
    genero      VARCHAR(100),
    estanteria  VARCHAR(50),
    estado      ENUM('disponible','prestado','extraviado','no disponible') NOT NULL DEFAULT 'disponible',
    nombre_foto VARCHAR(255)
);

CREATE TABLE usuario (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    rol       ENUM('personal','profesorado','alumno') NOT NULL,
    ubicacion ENUM('1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                   '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach') NULL
);

CREATE TABLE prestamo (
    id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario                INT UNSIGNED NOT NULL,
    id_libro                  INT UNSIGNED NOT NULL,
    fecha_inicio              DATE NOT NULL,
    fecha_devolucion_prevista DATE NULL,
    fecha_devolucion_real     DATE NULL,
    devuelto                  TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    FOREIGN KEY (id_libro)   REFERENCES libro(id)
);

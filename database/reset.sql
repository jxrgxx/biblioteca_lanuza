-- ─────────────────────────────────────────────────────────────────
-- RESET DE BASE DE DATOS — borra todos los datos de prueba
-- Conserva: usuario con rol 'biblioteca' (id = 1)
-- Reinicia todos los AUTO_INCREMENT
-- ─────────────────────────────────────────────────────────────────

-- Orden: primero tablas hijas, luego las madres
DELETE FROM `recordatorio`;
DELETE FROM `prestamo`;
DELETE FROM `password_reset`;
DELETE FROM `registro`;
DELETE FROM `libro`;
DELETE FROM `estanteria`;

-- Usuarios: borrar todos excepto el de rol 'biblioteca'
DELETE FROM `usuario` WHERE `rol` != 'biblioteca';

-- Reiniciar AUTO_INCREMENT
ALTER TABLE `recordatorio`   AUTO_INCREMENT = 1;
ALTER TABLE `prestamo`       AUTO_INCREMENT = 1;
ALTER TABLE `password_reset` AUTO_INCREMENT = 1;
ALTER TABLE `registro`       AUTO_INCREMENT = 1;
ALTER TABLE `libro`          AUTO_INCREMENT = 1;
ALTER TABLE `estanteria`     AUTO_INCREMENT = 1;
-- usuario: id=1 ya ocupado por biblioteca, el próximo será U_2
ALTER TABLE `usuario`        AUTO_INCREMENT = 2;

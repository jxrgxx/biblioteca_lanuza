const cron = require('node-cron');
const db = require('../db');
const { enviarRecordatorio } = require('../services/mailer');

/**
 * Consulta los préstamos activos cuya fecha de devolución prevista
 * es exactamente mañana y el libro aún no ha sido devuelto.
 */
async function obtenerPrestamosManana() {
  const [rows] = await db.query(`
    SELECT
      p.id,
      p.codigo          AS codigoPrestamo,
      p.fecha_devolucion_prevista AS fechaPrevista,
      u.nombre,
      u.apellidos,
      u.email,
      l.titulo,
      l.autor,
      l.codigo          AS codigoLibro
    FROM prestamo p
    JOIN usuario u ON p.id_usuario = u.id
    JOIN libro   l ON p.id_libro   = l.id
    WHERE p.devuelto = 0
      AND DATE(p.fecha_devolucion_prevista) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  `);
  return rows;
}

/**
 * Tarea principal: busca préstamos y manda correos.
 * Diseñada para no lanzar excepciones (el cron debe seguir vivo aunque falle).
 */
async function ejecutarRecordatorios() {
  console.log('[recordatorios] Buscando préstamos que vencen mañana…');

  let prestamos;
  try {
    prestamos = await obtenerPrestamosManana();
  } catch (err) {
    console.error('[recordatorios] Error al consultar la BD:', err.message);
    return;
  }

  if (!prestamos.length) {
    console.log(
      '[recordatorios] Ningún préstamo vence mañana. Nada que enviar.'
    );
    return;
  }

  console.log(`[recordatorios] ${prestamos.length} recordatorio(s) a enviar.`);

  let enviados = 0;
  let fallidos = 0;

  for (const p of prestamos) {
    try {
      await enviarRecordatorio({
        email: p.email,
        nombre: `${p.nombre} ${p.apellidos}`,
        titulo: p.titulo,
        autor: p.autor,
        codigoLibro: p.codigoLibro,
        codigoPrestamo: p.codigoPrestamo,
        fechaPrevista:
          p.fechaPrevista instanceof Date
            ? p.fechaPrevista.toISOString().split('T')[0]
            : String(p.fechaPrevista).split('T')[0],
      });
      console.log(
        `[recordatorios] ✓ Enviado a ${p.email} (préstamo ${p.codigoPrestamo})`
      );
      enviados++;
    } catch (err) {
      console.error(
        `[recordatorios] ✗ Fallo al enviar a ${p.email}:`,
        err.message
      );
      fallidos++;
    }
  }

  console.log(
    `[recordatorios] Resumen: ${enviados} enviados, ${fallidos} fallidos.`
  );
}

function iniciarCron() {
  const expresion = process.env.CRON_RECORDATORIOS || '0 8 * * *';

  if (!cron.validate(expresion)) {
    console.error('[recordatorios] Expresión cron inválida:', expresion);
    return;
  }

  cron.schedule(expresion, ejecutarRecordatorios, {
    timezone: 'Europe/Madrid',
  });

  console.log(`[recordatorios] Cron activo → "${expresion}" (Europe/Madrid)`);
}

module.exports = { iniciarCron, ejecutarRecordatorios };

const cron = require('node-cron');
const db = require('../db');
const {
  enviarRecordatorio,
  enviarRecordatorioLote,
} = require('../services/mailer');

/**
 * Programa un recordatorio 24h antes de la devolución.
 * Si ese momento ya pasó, lo programa para dentro de 5 minutos.
 * Usa conn para ir dentro de la transacción del préstamo.
 */
async function programarRecordatorio(
  conn,
  { id_prestamo, fecha_devolucion_prevista }
) {
  if (!fecha_devolucion_prevista) return;
  await conn.query(
    `
    INSERT INTO recordatorio (id_prestamo, enviar_en)
    VALUES (?, GREATEST(
      TIMESTAMP(DATE_SUB(?, INTERVAL 1 DAY), TIME(NOW())),
      TIMESTAMP(CURDATE(), '20:00:00')
    ))
  `,
    [id_prestamo, fecha_devolucion_prevista]
  );
}

async function programarRecordatorioLote(
  conn,
  { codigo_lote, fecha_devolucion_prevista }
) {
  if (!fecha_devolucion_prevista) return;
  await conn.query(
    `
    INSERT INTO recordatorio (codigo_lote, enviar_en)
    VALUES (?, GREATEST(
      TIMESTAMP(DATE_SUB(?, INTERVAL 1 DAY), TIME(NOW())),
      TIMESTAMP(CURDATE(), '20:00:00')
    ))
  `,
    [codigo_lote, fecha_devolucion_prevista]
  );
}

async function cancelarRecordatorio(conn, { id_prestamo, codigo_lote }) {
  if (id_prestamo) {
    await conn.query(
      'DELETE FROM recordatorio WHERE id_prestamo = ? AND enviado = 0',
      [id_prestamo]
    );
  } else if (codigo_lote) {
    await conn.query(
      'DELETE FROM recordatorio WHERE codigo_lote = ? AND enviado = 0',
      [codigo_lote]
    );
  }
}

async function procesarPendientes() {
  let pendientes;
  try {
    [pendientes] = await db.query(
      'SELECT * FROM recordatorio WHERE enviado = 0 AND enviar_en <= NOW()'
    );
  } catch (err) {
    console.error(
      '[recordatorios] Error al consultar pendientes:',
      err.message
    );
    return;
  }

  if (!pendientes.length) return;
  console.log(
    `[recordatorios] ${pendientes.length} recordatorio(s) pendiente(s).`
  );

  for (const r of pendientes) {
    try {
      if (r.id_prestamo) {
        const [[p]] = await db.query(
          `
          SELECT p.codigo AS codigoPrestamo, p.fecha_devolucion_prevista AS fechaPrevista,
                 u.nombre, u.apellidos, u.email,
                 l.titulo, l.autor, l.codigo AS codigoLibro
          FROM prestamo p
          JOIN usuario u ON p.id_usuario = u.id
          JOIN libro   l ON p.id_libro   = l.id
          WHERE p.id = ? AND p.devuelto = 0
        `,
          [r.id_prestamo]
        );

        if (p) {
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
            `[recordatorios] ✓ Individual → ${p.email} (${p.codigoPrestamo})`
          );
        }
      } else if (r.codigo_lote) {
        const [filas] = await db.query(
          `
          SELECT p.codigo AS codigoPrestamo, p.fecha_devolucion_prevista AS fechaPrevista,
                 u.nombre, u.apellidos, u.email,
                 l.titulo, l.autor, l.codigo AS codigoLibro
          FROM prestamo p
          JOIN usuario u ON p.id_usuario = u.id
          JOIN libro   l ON p.id_libro   = l.id
          WHERE p.codigo_lote = ? AND p.devuelto = 0
        `,
          [r.codigo_lote]
        );

        if (filas.length) {
          const { nombre, apellidos, email, fechaPrevista } = filas[0];
          await enviarRecordatorioLote({
            email,
            nombre: `${nombre} ${apellidos}`,
            codigoLote: r.codigo_lote,
            libros: filas.map((f) => ({
              titulo: f.titulo,
              autor: f.autor,
              codigoLibro: f.codigoLibro,
              codigoPrestamo: f.codigoPrestamo,
            })),
            fechaPrevista:
              fechaPrevista instanceof Date
                ? fechaPrevista.toISOString().split('T')[0]
                : String(fechaPrevista).split('T')[0],
          });
          console.log(`[recordatorios] ✓ Lote → ${email} (${r.codigo_lote})`);
        }
      }

      await db.query('UPDATE recordatorio SET enviado = 1 WHERE id = ?', [
        r.id,
      ]);
    } catch (err) {
      console.error(
        `[recordatorios] ✗ Error en recordatorio id=${r.id}:`,
        err.message
      );
    }
  }
}

function iniciarCron() {
  cron.schedule('*/5 * * * *', procesarPendientes, {
    timezone: 'Europe/Madrid',
  });
  console.log('[recordatorios] Cron activo → cada 5 minutos');
}

module.exports = {
  iniciarCron,
  procesarPendientes,
  programarRecordatorio,
  programarRecordatorioLote,
  cancelarRecordatorio,
};

const nodemailer = require('nodemailer');

/**
 * Transporter reutilizable.
 * Se configura con las variables de entorno SMTP_*.
 * Si no están definidas, el objeto se crea igualmente pero
 * sendMail lanzará un error claro en lugar de crashear el proceso.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  secure: process.env.SMTP_SECURE === 'true', // true → TLS (puerto 465)
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined, // sin auth para relay interno
  tls: {
    // Permite certificados autofirmados habituales en servidores internos
    rejectUnauthorized:
      process.env.SMTP_REJECT_UNAUTH !== 'false' ? false : true,
  },
});

/**
 * Verifica la conexión con el servidor SMTP.
 * Llama esto al arrancar para detectar problemas de config temprano.
 */
async function verificarConexion() {
  try {
    await transporter.verify();
    console.log('[mailer] Conexión SMTP OK →', process.env.SMTP_HOST);
  } catch (err) {
    console.warn('[mailer] No se pudo conectar al SMTP:', err.message);
    console.warn('[mailer] Los recordatorios por email quedan desactivados.');
  }
}

/**
 * Genera el HTML del recordatorio de devolución.
 */
function htmlRecordatorio({
  nombre,
  titulo,
  autor,
  codigoLibro,
  codigoPrestamo,
  fechaPrevista,
}) {
  const fecha = new Date(fechaPrevista + 'T00:00:00').toLocaleDateString(
    'es-ES',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio de devolución</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Cabecera -->
          <tr>
            <td style="background:#1a3c5e;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">
                📚 Biblioteca Juan de Lanuza
              </p>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">
                Recordatorio de devolución
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">
                Hola, <strong>${nombre}</strong>
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
                Te recordamos que mañana vence el plazo de devolución del siguiente préstamo:
              </p>

              <!-- Tarjeta del libro -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f8fafc;border:1px solid #e2e8f0;
                            border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#1e293b;">
                      ${titulo}
                    </p>
                    <p style="margin:0 0 12px;font-size:13px;color:#64748b;">
                      ${autor}
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:20px;">
                          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;
                                    letter-spacing:.05em;">Código libro</p>
                          <p style="margin:2px 0 0;font-size:13px;font-family:monospace;
                                    color:#374151;">${codigoLibro}</p>
                        </td>
                        <td>
                          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;
                                    letter-spacing:.05em;">Código préstamo</p>
                          <p style="margin:2px 0 0;font-size:13px;font-family:monospace;
                                    color:#374151;">${codigoPrestamo}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fecha destacada -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fef3c7;border:1px solid #fcd34d;
                            border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 20px;">
                    <p style="margin:0;font-size:12px;color:#92400e;font-weight:bold;
                              text-transform:uppercase;letter-spacing:.05em;">
                      Fecha límite de devolución
                    </p>
                    <p style="margin:4px 0 0;font-size:17px;font-weight:bold;color:#92400e;">
                      ${fecha}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Por favor, devuelve el libro en la biblioteca <strong>antes de que termine el día de mañana</strong>
                para evitar penalizaciones.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                       padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Biblioteca · Colegio Juan de Lanuza
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
                Este mensaje es automático, no respondas a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envía un recordatorio a un usuario.
 */
async function enviarRecordatorio(datos) {
  const {
    email,
    nombre,
    titulo,
    autor,
    codigoLibro,
    codigoPrestamo,
    fechaPrevista,
  } = datos;

  await transporter.sendMail({
    from: `"Biblioteca Juan de Lanuza" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'biblioteca@juandelanuza.org'}>`,
    to: email,
    subject: `📚 Recuerda devolver "${titulo}" mañana`,
    html: htmlRecordatorio({
      nombre,
      titulo,
      autor,
      codigoLibro,
      codigoPrestamo,
      fechaPrevista,
    }),
  });
}

module.exports = { transporter, verificarConexion, enviarRecordatorio };

const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

/* ── Colores corporativos ── */
const BRAND = {
  50:  '#fdf2f3',
  100: '#f9e0e2',
  600: '#7F252E',
  700: '#6b1e27',
  800: '#57181f',
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  tls: { rejectUnauthorized: false },
});

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
 * Genera el QR como Buffer PNG (para adjunto CID, compatible con todos los clientes).
 */
async function generarQRBuffer(texto) {
  return await QRCode.toBuffer(texto, {
    width: 180,
    margin: 2,
    color: {
      dark: BRAND[800],
      light: '#ffffff',
    },
  });
}

/**
 * HTML del recordatorio.
 * La imagen QR se referencia con cid:qr_prestamo (adjunto inline).
 */
function htmlRecordatorio({ nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaPrevista }) {
  const fecha = new Date(fechaPrevista + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Recordatorio de devolución</title>
  <style>
    :root { color-scheme: light only; }
    body  { margin:0; padding:0; background:#f4f4f5 !important;
            font-family:Arial,sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.10);">

          <!-- Cabecera corporativa -->
          <tr>
            <td bgcolor="${BRAND[600]}"
                style="background-color:${BRAND[600]} !important;padding:24px 32px;">
              <p style="margin:0;color:#ffffff !important;font-size:20px;
                        font-weight:bold;letter-spacing:-.02em;">
                Biblioteca Juan de Lanuza
              </p>
              <p style="margin:6px 0 0;color:#f9e0e2 !important;font-size:13px;">
                Recordatorio de devolución
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td bgcolor="#ffffff"
                style="background-color:#ffffff !important;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                Hola, <strong>${nombre}</strong>
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Te recordamos que <strong>mañana</strong> vence el plazo de devolución
                del siguiente préstamo:
              </p>

              <!-- Tarjeta del libro + QR -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fdf2f3;border:1px solid #f9e0e2;
                            border-radius:10px;margin-bottom:20px;">
                <tr>
                  <!-- Info del libro -->
                  <td style="padding:18px 20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:bold;
                              color:#1e293b;">
                      ${titulo}
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                      ${autor}
                    </p>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:24px;">
                          <p style="margin:0;font-size:10px;color:#94a3b8;
                                    text-transform:uppercase;letter-spacing:.06em;">
                            Código libro
                          </p>
                          <p style="margin:3px 0 0;font-size:13px;font-family:monospace;
                                    color:#374151;font-weight:bold;">
                            ${codigoLibro}
                          </p>
                        </td>
                        <td>
                          <p style="margin:0;font-size:10px;color:#94a3b8;
                                    text-transform:uppercase;letter-spacing:.06em;">
                            Código préstamo
                          </p>
                          <p style="margin:3px 0 0;font-size:13px;font-family:monospace;
                                    color:${BRAND[600]};font-weight:bold;">
                            ${codigoPrestamo}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- QR (CID adjunto) -->
                  <td style="padding:18px 20px 18px 0;vertical-align:middle;
                             text-align:center;width:130px;">
                    <img src="cid:qr_prestamo"
                         alt="QR ${codigoPrestamo}"
                         width="110" height="110"
                         style="display:block;margin:0 auto;border-radius:6px;
                                border:3px solid #f9e0e2;" />
                    <p style="margin:6px 0 0;font-size:9px;color:#94a3b8;
                              text-align:center;letter-spacing:.04em;">
                      ESCANEA PARA<br/>DEVOLVER
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fecha límite -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fef3c7;border:1px solid #fcd34d;
                            border-radius:8px;margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 20px;">
                    <p style="margin:0;font-size:11px;color:#92400e;font-weight:bold;
                              text-transform:uppercase;letter-spacing:.06em;">
                      Fecha límite de devolución
                    </p>
                    <p style="margin:4px 0 0;font-size:17px;font-weight:bold;
                              color:#92400e;">
                      ${fecha}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Devuelve el libro en la biblioteca
                <strong>antes de que termine el día de mañana</strong>
                para evitar penalizaciones.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td bgcolor="#fdf2f3"
                style="background-color:#fdf2f3 !important;
                       border-top:2px solid #f9e0e2;
                       padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND[700]};font-weight:bold;">
                Biblioteca · Colegio Juan de Lanuza
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">
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
 * El QR viaja como adjunto inline (CID) para máxima compatibilidad.
 */
async function enviarRecordatorio(datos) {
  const { email, nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaPrevista } = datos;

  const qrBuffer = await generarQRBuffer(codigoPrestamo);

  await transporter.sendMail({
    from: `"Biblioteca Juan de Lanuza" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'biblioteca@juandelanuza.org'}>`,
    to: email,
    subject: `Recuerda devolver "${titulo}" mañana`,
    html: htmlRecordatorio({ nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaPrevista }),
    attachments: [
      {
        filename: `qr-${codigoPrestamo}.png`,
        content: qrBuffer,
        cid: 'qr_prestamo',   // referenciado en el HTML como cid:qr_prestamo
        contentDisposition: 'inline',
      },
    ],
  });
}

/**
 * HTML de la confirmación de préstamo.
 */
function htmlConfirmacion({ nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaInicio, fechaPrevista }) {
  const fmtFecha = (f) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Confirmación de préstamo</title>
  <style>
    :root { color-scheme: light only; }
    body  { margin:0; padding:0; background:#f4f4f5 !important;
            font-family:Arial,sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.10);">

          <!-- Cabecera -->
          <tr>
            <td bgcolor="${BRAND[600]}"
                style="background-color:${BRAND[600]} !important;padding:24px 32px;">
              <p style="margin:0;color:#ffffff !important;font-size:20px;
                        font-weight:bold;letter-spacing:-.02em;">
                Biblioteca Juan de Lanuza
              </p>
              <p style="margin:6px 0 0;color:#f9e0e2 !important;font-size:13px;">
                Confirmación de préstamo
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td bgcolor="#ffffff"
                style="background-color:#ffffff !important;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                Hola, <strong>${nombre}</strong>
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                Tu préstamo ha sido registrado correctamente. Aquí tienes el resumen:
              </p>

              <!-- Tarjeta del libro + QR -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fdf2f3;border:1px solid #f9e0e2;
                            border-radius:10px;margin-bottom:20px;">
                <tr>
                  <!-- Info -->
                  <td style="padding:18px 20px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:16px;font-weight:bold;color:#1e293b;">
                      ${titulo}
                    </p>
                    <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                      ${autor}
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:24px;">
                          <p style="margin:0;font-size:10px;color:#94a3b8;
                                    text-transform:uppercase;letter-spacing:.06em;">Código libro</p>
                          <p style="margin:3px 0 0;font-size:13px;font-family:monospace;
                                    color:#374151;font-weight:bold;">${codigoLibro}</p>
                        </td>
                        <td>
                          <p style="margin:0;font-size:10px;color:#94a3b8;
                                    text-transform:uppercase;letter-spacing:.06em;">Código préstamo</p>
                          <p style="margin:3px 0 0;font-size:13px;font-family:monospace;
                                    color:${BRAND[600]};font-weight:bold;">${codigoPrestamo}</p>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- QR -->
                  <td style="padding:18px 20px 18px 0;vertical-align:middle;
                             text-align:center;width:130px;">
                    <img src="cid:qr_prestamo"
                         alt="QR ${codigoPrestamo}"
                         width="110" height="110"
                         style="display:block;margin:0 auto;border-radius:6px;
                                border:3px solid #f9e0e2;" />
                    <p style="margin:6px 0 0;font-size:9px;color:#94a3b8;
                              text-align:center;letter-spacing:.04em;">
                      ESCANEA PARA<br/>DEVOLVER
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Fechas -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="border-radius:8px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td width="50%"
                      style="background:#f8fafc;border:1px solid #e2e8f0;
                             padding:12px 16px;border-radius:8px 0 0 8px;">
                    <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;
                              letter-spacing:.06em;">Fecha de inicio</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:bold;color:#374151;">
                      ${fmtFecha(fechaInicio)}
                    </p>
                  </td>
                  <td width="8px"></td>
                  <td width="50%"
                      style="background:#fef3c7;border:1px solid #fcd34d;
                             padding:12px 16px;border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-size:10px;color:#92400e;text-transform:uppercase;
                              letter-spacing:.06em;">Fecha límite devolución</p>
                    <p style="margin:4px 0 0;font-size:13px;font-weight:bold;color:#92400e;">
                      ${fechaPrevista ? fmtFecha(fechaPrevista) : '—'}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                Recuerda devolver el libro antes de la fecha límite.
                Recibirás un recordatorio por email el día anterior.
              </p>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td bgcolor="#fdf2f3"
                style="background-color:#fdf2f3 !important;border-top:2px solid #f9e0e2;
                       padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND[700]};font-weight:bold;">
                Biblioteca · Colegio Juan de Lanuza
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">
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
 * Envía la confirmación inmediata al crear un préstamo.
 */
async function enviarConfirmacionPrestamo(datos) {
  const { email, nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaInicio, fechaPrevista } = datos;

  const qrBuffer = await generarQRBuffer(codigoPrestamo);

  await transporter.sendMail({
    from: `"Biblioteca Juan de Lanuza" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'biblioteca@juandelanuza.org'}>`,
    to: email,
    subject: `Préstamo registrado: "${titulo}"`,
    html: htmlConfirmacion({ nombre, titulo, autor, codigoLibro, codigoPrestamo, fechaInicio, fechaPrevista }),
    attachments: [
      {
        filename: `qr-${codigoPrestamo}.png`,
        content: qrBuffer,
        cid: 'qr_prestamo',
        contentDisposition: 'inline',
      },
    ],
  });
}

/**
 * Email de recuperación de contraseña.
 * No lleva QR, solo el enlace con botón bien visible.
 */
async function enviarResetPassword({ email, nombre, link }) {
  const html = `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Recuperación de contraseña</title>
  <style>
    :root { color-scheme: light only; }
    body  { margin:0; padding:0; background:#f4f4f5 !important;
            font-family:Arial,sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.10);">

          <!-- Cabecera -->
          <tr>
            <td bgcolor="${BRAND[600]}"
                style="background-color:${BRAND[600]} !important;padding:24px 32px;">
              <p style="margin:0;color:#ffffff !important;font-size:20px;
                        font-weight:bold;letter-spacing:-.02em;">
                Biblioteca Juan de Lanuza
              </p>
              <p style="margin:6px 0 0;color:#f9e0e2 !important;font-size:13px;">
                Recuperación de contraseña
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td bgcolor="#ffffff"
                style="background-color:#ffffff !important;padding:32px 32px 24px;">
              <p style="margin:0 0 8px;font-size:15px;color:#374151;">
                Hola, <strong>${nombre}</strong>
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                Pulsa el botón para crear una nueva contraseña.
                El enlace es válido durante <strong>1 hora</strong>.
              </p>

              <!-- Botón -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td bgcolor="${BRAND[600]}"
                      style="background-color:${BRAND[600]} !important;
                             border-radius:8px;padding:0;">
                    <a href="${link}"
                       style="display:inline-block;padding:14px 32px;
                              color:#ffffff !important;font-size:15px;
                              font-weight:bold;text-decoration:none;
                              letter-spacing:.01em;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Enlace de texto por si el botón no funciona -->
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">
                Si el botón no funciona, copia este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;font-size:11px;color:#94a3b8;
                        text-align:center;word-break:break-all;">
                ${link}
              </p>

              <!-- Aviso de seguridad -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#fdf2f3;border:1px solid #f9e0e2;
                            border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:${BRAND[700]};line-height:1.5;">
                      <strong>¿No has solicitado esto?</strong><br/>
                      Ignora este correo. Tu contraseña no cambiará.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td bgcolor="#fdf2f3"
                style="background-color:#fdf2f3 !important;border-top:2px solid #f9e0e2;
                       padding:14px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND[700]};font-weight:bold;">
                Biblioteca · Colegio Juan de Lanuza
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">
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

  await transporter.sendMail({
    from: `"Biblioteca Juan de Lanuza" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'biblioteca@juandelanuza.org'}>`,
    to: email,
    subject: 'Restablece tu contraseña — Biblioteca Juan de Lanuza',
    html,
  });
}

module.exports = { transporter, verificarConexion, enviarRecordatorio, enviarConfirmacionPrestamo, enviarResetPassword };

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { enviarResetPassword } = require('../services/mailer');

/* Genera un token seguro de 64 caracteres hex */
function generarToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/forgot-password
 * Recibe { email }, genera token y manda el correo.
 * Siempre responde igual para no revelar si el email existe.
 */
exports.solicitarReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const [rows] = await db.query(
      'SELECT id, nombre, apellidos FROM usuario WHERE email = ?',
      [email]
    );

    if (rows.length) {
      const usuario = rows[0];
      const token = generarToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Invalida tokens anteriores del mismo usuario
      await db.query(
        'UPDATE password_reset SET usado = 1 WHERE id_usuario = ? AND usado = 0',
        [usuario.id]
      );

      await db.query(
        'INSERT INTO password_reset (id_usuario, token, expires_at) VALUES (?, ?, ?)',
        [usuario.id, token, expires]
      );

      const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

      console.log(`[reset] Solicitud de ${email} → token generado`);

      enviarResetPassword({
        email,
        nombre: `${usuario.nombre} ${usuario.apellidos}`,
        link,
      })
        .then(() => console.log(`[mailer] ✓ Email de reset enviado a ${email}`))
        .catch(err => console.error(`[mailer] ✗ Error enviando reset a ${email}:`, err.message));
    } else {
      console.log(`[reset] Solicitud para email desconocido: ${email} (ignorado)`);
    }

    // Misma respuesta siempre
    res.json({ message: 'Si el email existe, recibirás un enlace en breve.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/auth/reset-password
 * Recibe { token, password }, valida y actualiza la contraseña.
 */
exports.resetearPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const [rows] = await db.query(
      `SELECT pr.id, pr.id_usuario, pr.expires_at, u.email
       FROM password_reset pr
       JOIN usuario u ON pr.id_usuario = u.id
       WHERE pr.token = ? AND pr.usado = 0`,
      [token]
    );

    if (!rows.length)
      return res.status(400).json({ error: 'El enlace no es válido o ya fue usado' });

    const reset = rows[0];

    if (new Date() > new Date(reset.expires_at))
      return res.status(400).json({ error: 'El enlace ha caducado. Solicita uno nuevo.' });

    const hash = await bcrypt.hash(password, 10);

    await db.query('UPDATE usuario SET password = ? WHERE id = ?', [hash, reset.id_usuario]);
    await db.query('UPDATE password_reset SET usado = 1 WHERE id = ?', [reset.id]);

    console.log(`[reset] ✓ Contraseña actualizada para ${reset.email}`);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

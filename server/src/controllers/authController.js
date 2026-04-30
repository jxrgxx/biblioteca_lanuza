const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const CURSOS = [
  '1º Primaria',
  '2º Primaria',
  '3º Primaria',
  '4º Primaria',
  '5º Primaria',
  '6º Primaria',
  '1º ESO',
  '2º ESO',
  '3º ESO',
  '4º ESO',
  '1º Bach',
  '2º Bach',
];

exports.register = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, rol, ubicacion } = req.body;
    if (!nombre || !apellidos || !email || !password || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!email.toLowerCase().endsWith('@juandelanuza.org')) {
      return res
        .status(400)
        .json({ error: 'El email debe ser del dominio @juandelanuza.org' });
    }
    if (rol === 'profesorado' || rol === 'personal') {
      const { codigoRegistro } = req.body;
      const [cfg] = await db.query(
        "SELECT valor FROM config WHERE clave = 'codigo_registro'"
      );
      const codigoActual = cfg[0]?.valor || '';
      if (
        !codigoActual ||
        !codigoRegistro ||
        codigoRegistro.toUpperCase() !== codigoActual
      ) {
        return res.status(403).json({ error: 'Código de registro incorrecto' });
      }
    }
    const [exists] = await db.query('SELECT id FROM usuario WHERE email = ?', [
      email,
    ]);
    if (exists.length)
      return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion, fecha_alta) VALUES (?,?,?,?,?,?,CURDATE())',
      [nombre, apellidos, email, hash, rol, ubicacion || null]
    );
    const id = result.insertId;
    await db.query(
      "UPDATE usuario SET codigo = CONCAT('U_', ?) WHERE id = ?",
      [id, id]
    );
    const codigo = `U_${id}`;
    const token = jwt.sign(
      {
        id,
        nombre,
        apellidos,
        email,
        rol,
        ubicacion: ubicacion || null,
        codigo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva)
      return res.status(400).json({ error: 'Faltan campos obligatorios' });

    const [rows] = await db.query('SELECT * FROM usuario WHERE id = ?', [
      req.user.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(passwordActual, rows[0].password);
    if (!valid)
      return res
        .status(401)
        .json({ error: 'La contraseña actual no es correcta' });

    const hash = await bcrypt.hash(passwordNueva, 10);
    await db.query('UPDATE usuario SET password = ? WHERE id = ?', [
      hash,
      req.user.id,
    ]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM usuario WHERE email = ?', [
      email,
    ]);
    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        rol: user.rol,
        ubicacion: user.ubicacion,
        codigo: user.codigo,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

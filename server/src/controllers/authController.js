const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const CURSOS = ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];

exports.register = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, rol, ubicacion } = req.body;
    if (!nombre || !apellidos || !email || !password || !rol) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const [exists] = await db.query('SELECT id FROM usuario WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion) VALUES (?,?,?,?,?,?)',
      [nombre, apellidos, email, hash, rol, ubicacion || null]
    );
    const token = jwt.sign(
      { id: result.insertId, nombre, apellidos, email, rol, ubicacion: ubicacion || null },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, apellidos: user.apellidos, email: user.email, rol: user.rol, ubicacion: user.ubicacion },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

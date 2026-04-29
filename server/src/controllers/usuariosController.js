const bcrypt = require('bcryptjs');
const db = require('../db');

const CAMPOS = 'id, codigo, nombre, apellidos, email, rol, ubicacion, activo, fecha_alta, fecha_baja';

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario ORDER BY apellidos, nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPerfil = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario WHERE id = ?`,
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
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
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion, fecha_alta) VALUES (?,?,?,?,?,?,CURDATE())',
      [nombre, apellidos, email, hash, rol, ubicacion || null]
    );
    const newId = result.insertId;
    await db.query(
      "UPDATE usuario SET codigo = CONCAT('U_', LPAD(?, 4, '0')) WHERE id = ?",
      [newId, newId]
    );
    const [rows] = await db.query(
      'SELECT id, codigo, nombre, apellidos, email, rol, ubicacion FROM usuario WHERE id = ?',
      [newId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, rol, ubicacion } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE usuario SET nombre=?, apellidos=?, email=?, password=?, rol=?, ubicacion=? WHERE id=?',
        [nombre, apellidos, email, hash, rol, ubicacion || null, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE usuario SET nombre=?, apellidos=?, email=?, rol=?, ubicacion=? WHERE id=?',
        [nombre, apellidos, email, rol, ubicacion || null, req.params.id]
      );
    }
    const [rows] = await db.query(
      'SELECT id, codigo, nombre, apellidos, email, rol, ubicacion FROM usuario WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM usuario WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    await db.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.prestamosCount = async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM prestamo WHERE id_usuario = ?',
      [req.params.id]
    );
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleActivo = async (req, res) => {
  try {
    const { activo } = req.body;
    await db.query(
      'UPDATE usuario SET activo = ?, fecha_baja = ? WHERE id = ?',
      [activo ? 1 : 0, activo ? null : new Date().toISOString().slice(0, 10), req.params.id]
    );
    res.json({ activo: activo ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.subidaDeCurso = async (req, res) => {
  const CURSOS = [
    '1º Primaria', '2º Primaria', '3º Primaria', '4º Primaria',
    '5º Primaria', '6º Primaria',
    '1º ESO', '2º ESO', '3º ESO', '4º ESO',
    '1º Bach', '2º Bach',
  ];

  try {
    // Contar antes de ejecutar para devolver el resumen
    const [[{ graduados }]] = await db.query(
      "SELECT COUNT(*) AS graduados FROM usuario WHERE rol = 'alumno' AND activo = 1 AND ubicacion = '2º Bach'"
    );
    const [[{ avanzados }]] = await db.query(
      "SELECT COUNT(*) AS avanzados FROM usuario WHERE rol = 'alumno' AND activo = 1 AND ubicacion != '2º Bach' AND ubicacion IS NOT NULL"
    );

    // CASE para avanzar ubicacion (excluye 2º Bach → se queda igual por ELSE)
    const whenClauses = CURSOS.slice(0, -1).map(() => 'WHEN ? THEN ?').join(' ');
    const params = CURSOS.slice(0, -1).flatMap((c, i) => [c, CURSOS[i + 1]]);

    const hoy = new Date().toISOString().slice(0, 10);
    await db.query(
      `UPDATE usuario
       SET
         activo    = CASE WHEN ubicacion = '2º Bach' THEN 0 ELSE activo END,
         fecha_baja = CASE WHEN ubicacion = '2º Bach' THEN ? ELSE fecha_baja END,
         ubicacion = CASE ubicacion ${whenClauses} WHEN '2º Bach' THEN NULL ELSE ubicacion END
       WHERE rol = 'alumno' AND activo = 1`,
      [hoy, ...params]
    );

    console.log(`[subida de curso] ${avanzados} avanzados · ${graduados} graduados`);
    res.json({ avanzados, graduados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

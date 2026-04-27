const bcrypt = require('bcryptjs');
const db = require('../db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, codigo, nombre, apellidos, email, rol, ubicacion FROM usuario ORDER BY apellidos, nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
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
      'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion) VALUES (?,?,?,?,?,?)',
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

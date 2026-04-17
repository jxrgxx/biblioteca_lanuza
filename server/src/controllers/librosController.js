const db = require('../db');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const { estado, genero, idioma, search } = req.query;
    let query = 'SELECT * FROM libro WHERE 1=1';
    const params = [];
    if (estado)  { query += ' AND estado = ?';                params.push(estado); }
    if (genero)  { query += ' AND genero = ?';                params.push(genero); }
    if (idioma)  { query += ' AND idioma = ?';                params.push(idioma); }
    if (search)  { query += ' AND (titulo LIKE ? OR autor LIKE ? OR codigo LIKE ?)';
                   params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY titulo';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo, titulo, autor, editorial, volumen, idioma, genero, estanteria, estado } = req.body;
    if (!codigo || !titulo) return res.status(400).json({ error: 'codigo y titulo son obligatorios' });
    const [result] = await db.query(
      'INSERT INTO libro (codigo, titulo, autor, editorial, volumen, idioma, genero, estanteria, estado) VALUES (?,?,?,?,?,?,?,?,?)',
      [codigo, titulo, autor || null, editorial || null, volumen || null, idioma || null, genero || null, estanteria || null, estado || 'disponible']
    );
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Código ya existe' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { codigo, titulo, autor, editorial, volumen, idioma, genero, estanteria, estado } = req.body;
    await db.query(
      'UPDATE libro SET codigo=?, titulo=?, autor=?, editorial=?, volumen=?, idioma=?, genero=?, estanteria=?, estado=? WHERE id=?',
      [codigo, titulo, autor || null, editorial || null, volumen || null, idioma || null, genero || null, estanteria || null, estado, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT nombre_foto FROM libro WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
    if (rows[0].nombre_foto) {
      const fotoPath = path.join(__dirname, '../../uploads', rows[0].nombre_foto);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    await db.query('DELETE FROM libro WHERE id = ?', [req.params.id]);
    res.json({ message: 'Libro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const [rows] = await db.query('SELECT nombre_foto FROM libro WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Libro no encontrado' });
    if (rows[0].nombre_foto) {
      const old = path.join(__dirname, '../../uploads', rows[0].nombre_foto);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await db.query('UPDATE libro SET nombre_foto = ? WHERE id = ?', [req.file.filename, req.params.id]);
    res.json({ nombre_foto: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

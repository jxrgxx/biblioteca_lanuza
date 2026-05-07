const db = require('../db');
const path = require('path');
const fs = require('fs');

exports.getEnums = async (req, res) => {
  try {
    const [[tipoRow]] = await db.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'actividad'
         AND COLUMN_NAME  = 'tipo'`
    );
    // COLUMN_TYPE → "enum('PYP','escritura_creativa','indagacion')"
    const tipos = tipoRow.COLUMN_TYPE
      .replace(/^enum\(|\)$/g, '')
      .split(',')
      .map((v) => v.replace(/'/g, '').trim());
    res.json({ tipos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [actividades] = await db.query(
      'SELECT * FROM actividad ORDER BY fecha DESC'
    );
    const [fotos] = await db.query('SELECT * FROM actividad_foto');
    const fotosMap = {};
    fotos.forEach((f) => {
      if (!fotosMap[f.id_actividad]) fotosMap[f.id_actividad] = [];
      fotosMap[f.id_actividad].push(f);
    });
    actividades.forEach((a) => {
      a.fotos = fotosMap[a.id] || [];
    });
    res.json(actividades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM actividad WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Actividad no encontrada' });
    const [fotos] = await db.query(
      'SELECT * FROM actividad_foto WHERE id_actividad = ?',
      [req.params.id]
    );
    rows[0].fotos = fotos;
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, fecha, tipo, subtipo, idioma, duracion, destinatario, curso_destinatario, objetivos } = req.body;
    if (!nombre || !fecha || !tipo || !destinatario)
      return res.status(400).json({ error: 'nombre, fecha, tipo y destinatario son obligatorios' });
    const [result] = await db.query(
      'INSERT INTO actividad (nombre, fecha, tipo, subtipo, idioma, duracion, destinatario, curso_destinatario, objetivos) VALUES (?,?,?,?,?,?,?,?,?)',
      [nombre, fecha, tipo, subtipo || null, idioma || null, duracion || null, destinatario, curso_destinatario || null, objetivos || null]
    );
    const [rows] = await db.query('SELECT * FROM actividad WHERE id = ?', [result.insertId]);
    rows[0].fotos = [];
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, fecha, tipo, subtipo, idioma, duracion, destinatario, curso_destinatario, objetivos, reflexiones } = req.body;
    const [check] = await db.query('SELECT id FROM actividad WHERE id = ?', [req.params.id]);
    if (!check.length)
      return res.status(404).json({ error: 'Actividad no encontrada' });
    await db.query(
      'UPDATE actividad SET nombre=?, fecha=?, tipo=?, subtipo=?, idioma=?, duracion=?, destinatario=?, curso_destinatario=?, objetivos=?, reflexiones=? WHERE id=?',
      [nombre, fecha, tipo, subtipo || null, idioma || null, duracion || null, destinatario, curso_destinatario || null, objetivos || null, reflexiones || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM actividad WHERE id = ?', [req.params.id]);
    const [fotos] = await db.query('SELECT * FROM actividad_foto WHERE id_actividad = ?', [req.params.id]);
    rows[0].fotos = fotos;
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM actividad WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Actividad no encontrada' });
    const [fotos] = await db.query(
      'SELECT nombre_foto FROM actividad_foto WHERE id_actividad = ?',
      [req.params.id]
    );
    fotos.forEach((f) => {
      const fotoPath = path.join(__dirname, '../../uploads', f.nombre_foto);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    });
    await db.query('DELETE FROM actividad WHERE id = ?', [req.params.id]);
    res.json({ message: 'Actividad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const [check] = await db.query('SELECT id FROM actividad WHERE id = ?', [
      req.params.id,
    ]);
    if (!check.length)
      return res.status(404).json({ error: 'Actividad no encontrada' });
    const [result] = await db.query(
      'INSERT INTO actividad_foto (id_actividad, nombre_foto) VALUES (?,?)',
      [req.params.id, req.file.filename]
    );
    res.status(201).json({
      id: result.insertId,
      id_actividad: parseInt(req.params.id),
      nombre_foto: req.file.filename,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFoto = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM actividad_foto WHERE id = ? AND id_actividad = ?',
      [req.params.fotoId, req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Foto no encontrada' });
    const fotoPath = path.join(__dirname, '../../uploads', rows[0].nombre_foto);
    if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    await db.query('DELETE FROM actividad_foto WHERE id = ?', [
      req.params.fotoId,
    ]);
    res.json({ message: 'Foto eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

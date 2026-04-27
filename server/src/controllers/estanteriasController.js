const db = require('../db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre FROM estanteria ORDER BY nombre'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim())
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    const [result] = await db.query(
      'INSERT INTO estanteria (nombre) VALUES (?)',
      [nombre.trim()]
    );
    res.status(201).json({ id: result.insertId, nombre: nombre.trim() });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res
        .status(409)
        .json({ error: 'Ya existe una estantería con ese nombre' });
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM estanteria WHERE id = ?', [req.params.id]);
    res.json({ message: 'Estantería eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

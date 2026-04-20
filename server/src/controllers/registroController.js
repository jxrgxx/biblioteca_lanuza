const db = require("../db");

exports.getAll = async (req, res) => {
  try {
    const { fecha } = req.query;
    let query = "SELECT * FROM registro WHERE 1=1";
    const params = [];
    if (fecha) {
      query += " AND fecha = ?";
      params.push(fecha);
    }
    query += " ORDER BY id DESC";
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, curso, fecha } = req.body;
    if (!nombre || !curso || !fecha) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const [result] = await db.query(
      "INSERT INTO registro (nombre, curso, fecha) VALUES (?,?,?)",
      [nombre, curso, fecha],
    );
    const [rows] = await db.query("SELECT * FROM registro WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, curso, fecha } = req.body;
    if (!nombre || !curso || !fecha)
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    await db.query("UPDATE registro SET nombre=?, curso=?, fecha=? WHERE id=?", [
      nombre, curso, fecha, req.params.id,
    ]);
    const [rows] = await db.query("SELECT * FROM registro WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Registro no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query("DELETE FROM registro WHERE id = ?", [req.params.id]);
    res.json({ message: "Registro eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const db = require("../db");
const path = require("path");
const fs = require("fs");

exports.getAll = async (req, res) => {
  try {
    const { estado, genero, idioma, search } = req.query;
    let query = "SELECT * FROM libro WHERE 1=1";
    const params = [];
    if (estado) {
      query += " AND estado = ?";
      params.push(estado);
    }
    if (genero) {
      query += " AND genero = ?";
      params.push(genero);
    }
    if (idioma) {
      query += " AND idioma = ?";
      params.push(idioma);
    }
    if (search) {
      query += " AND (titulo LIKE ? OR autor LIKE ? OR codigo LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.editorial) {
      query += " AND editorial = ?";
      params.push(req.query.editorial);
    }
    if (req.query.estanteria) {
      query += " AND estanteria = ?";
      params.push(req.query.estanteria);
    }
    const validSort = ["titulo", "autor", "editorial"];
    const sortBy = validSort.includes(req.query.sortBy) ? req.query.sortBy : "titulo";
    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
    query += ` ORDER BY ${sortBy} ${order}`;
    if (req.query.limit) {
      const limit = Math.min(parseInt(req.query.limit), 100);
      const offset = parseInt(req.query.offset) || 0;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEditoriales = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT editorial FROM libro WHERE editorial IS NOT NULL ORDER BY editorial"
    );
    res.json(rows.map((r) => r.editorial));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEstanterias = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT estanteria FROM libro WHERE estanteria IS NOT NULL ORDER BY estanteria"
    );
    res.json(rows.map((r) => r.estanteria));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGeneros = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT genero FROM libro WHERE genero IS NOT NULL ORDER BY genero"
    );
    res.json(rows.map((r) => r.genero));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIdiomas = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT idioma FROM libro WHERE idioma IS NOT NULL ORDER BY idioma"
    );
    res.json(rows.map((r) => r.idioma));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM libro WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Libro no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { titulo, autor, editorial, volumen, idioma, genero, estanteria, estado } = req.body;
    if (!titulo)
      return res.status(400).json({ error: "El título es obligatorio" });
    const [result] = await db.query(
      "INSERT INTO libro (titulo, autor, editorial, volumen, idioma, genero, estanteria, estado) VALUES (?,?,?,?,?,?,?,?)",
      [
        titulo,
        autor || null,
        editorial || null,
        volumen || null,
        idioma || null,
        genero || null,
        estanteria || null,
        estado || "disponible",
      ],
    );
    const newId = result.insertId;
    await db.query(
      "UPDATE libro SET codigo = CONCAT('COL-', LPAD(?, 4, '0')) WHERE id = ?",
      [newId, newId]
    );
    const [rows] = await db.query("SELECT * FROM libro WHERE id = ?", [newId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { titulo, autor, editorial, volumen, idioma, genero, estanteria, estado } = req.body;
    await db.query(
      "UPDATE libro SET titulo=?, autor=?, editorial=?, volumen=?, idioma=?, genero=?, estanteria=?, estado=? WHERE id=?",
      [
        titulo,
        autor || null,
        editorial || null,
        volumen || null,
        idioma || null,
        genero || null,
        estanteria || null,
        estado,
        req.params.id,
      ],
    );
    const [rows] = await db.query("SELECT * FROM libro WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Libro no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT nombre_foto FROM libro WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Libro no encontrado" });
    if (rows[0].nombre_foto) {
      const fotoPath = path.join(
        __dirname,
        "../../uploads",
        rows[0].nombre_foto,
      );
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    await db.query("DELETE FROM libro WHERE id = ?", [req.params.id]);
    res.json({ message: "Libro eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    const [rows] = await db.query(
      "SELECT nombre_foto FROM libro WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Libro no encontrado" });
    if (rows[0].nombre_foto) {
      const old = path.join(__dirname, "../../uploads", rows[0].nombre_foto);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await db.query("UPDATE libro SET nombre_foto = ? WHERE id = ?", [
      req.file.filename,
      req.params.id,
    ]);
    res.json({ nombre_foto: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

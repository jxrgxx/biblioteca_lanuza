const db = require('../db');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const { estado, genero, idioma, search } = req.query;
    let query = 'SELECT * FROM libro WHERE 1=1';
    const params = [];
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    if (genero) {
      query += ' AND genero = ?';
      params.push(genero);
    }
    if (idioma) {
      query += ' AND idioma = ?';
      params.push(idioma);
    }
    if (search) {
      query += ' AND (titulo LIKE ? OR autor LIKE ? OR codigo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.editorial) {
      query += ' AND editorial = ?';
      params.push(req.query.editorial);
    }
    if (req.query.estanteria) {
      query += ' AND estanteria = ?';
      params.push(req.query.estanteria);
    }
    if (req.query.etiquetado !== undefined && req.query.etiquetado !== '') {
      query += ' AND etiquetado = ?';
      params.push(parseInt(req.query.etiquetado));
    }
    const validSort = ['titulo', 'autor', 'editorial'];
    const sortBy = validSort.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'titulo';
    const order = req.query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
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
      'SELECT DISTINCT editorial FROM libro WHERE editorial IS NOT NULL ORDER BY editorial'
    );
    res.json(rows.map((r) => r.editorial));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEstanterias = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT estanteria FROM libro WHERE estanteria IS NOT NULL ORDER BY estanteria'
    );
    res.json(rows.map((r) => r.estanteria));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGeneros = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT genero FROM libro WHERE genero IS NOT NULL ORDER BY genero'
    );
    res.json(rows.map((r) => r.genero));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIdiomas = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT idioma FROM libro WHERE idioma IS NOT NULL ORDER BY idioma'
    );
    res.json(rows.map((r) => r.idioma));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      titulo,
      autor,
      editorial,
      volumen,
      idioma,
      genero,
      categoria,
      estanteria,
      estado,
    } = req.body;
    if (!titulo)
      return res.status(400).json({ error: 'El título es obligatorio' });
    const [result] = await db.query(
      'INSERT INTO libro (titulo, autor, editorial, volumen, idioma, genero, categoria, estanteria, estado) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        titulo,
        autor || null,
        editorial || null,
        volumen || null,
        idioma || null,
        genero || null,
        categoria || null,
        estanteria || null,
        estado || 'disponible',
      ]
    );
    const newId = result.insertId;
    await db.query("UPDATE libro SET codigo = CONCAT('L_', ?) WHERE id = ?", [
      newId,
      newId,
    ]);
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [newId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      titulo,
      autor,
      editorial,
      volumen,
      idioma,
      genero,
      categoria,
      estanteria,
      estado,
    } = req.body;
    await db.query(
      'UPDATE libro SET titulo=?, autor=?, editorial=?, volumen=?, idioma=?, genero=?, categoria=?, estanteria=?, estado=? WHERE id=?',
      [
        titulo,
        autor || null,
        editorial || null,
        volumen || null,
        idioma || null,
        genero || null,
        categoria || null,
        estanteria || null,
        estado,
        req.params.id,
      ]
    );
    const [rows] = await db.query('SELECT * FROM libro WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT nombre_foto FROM libro WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Libro no encontrado' });
    const [activos] = await db.query(
      'SELECT id FROM prestamo WHERE id_libro = ? AND devuelto = 0 LIMIT 1',
      [req.params.id]
    );
    if (activos.length)
      return res.status(409).json({
        error: 'No se puede eliminar el libro porque tiene un préstamo activo',
      });
    if (rows[0].nombre_foto) {
      const fotoPath = path.join(
        __dirname,
        '../../uploads/fotos_portadas',
        rows[0].nombre_foto
      );
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }
    await db.query('DELETE FROM libro WHERE id = ?', [req.params.id]);
    res.json({ message: 'Libro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.marcarEtiquetado = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: 'No hay libros seleccionados' });
  const idsValidos = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!idsValidos.length)
    return res.status(400).json({ error: 'IDs inválidos' });
  await db.query('UPDATE libro SET etiquetado = 1 WHERE id IN (?)', [idsValidos]);
  res.json({ actualizados: idsValidos.length });
};

exports.eliminarMultiple = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: 'No hay libros seleccionados' });
  try {
    const fallos = [];
    for (const id of ids) {
      const [rows] = await db.query('SELECT titulo FROM libro WHERE id = ?', [id]);
      const [activos] = await db.query(
        'SELECT id FROM prestamo WHERE id_libro = ? AND devuelto = 0 LIMIT 1',
        [id]
      );
      if (activos.length) fallos.push(rows[0]?.titulo || `ID ${id}`);
    }
    if (fallos.length)
      return res.status(409).json({ fallos });

    for (const id of ids) {
      const [rows] = await db.query('SELECT nombre_foto FROM libro WHERE id = ?', [id]);
      if (rows[0]?.nombre_foto) {
        const fotoPath = path.join(__dirname, '../../uploads/fotos_portadas', rows[0].nombre_foto);
        if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
      }
    }
    const placeholders = ids.map(() => '?').join(',');
    await db.query(`DELETE FROM libro WHERE id IN (${placeholders})`, ids);
    res.json({ eliminados: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.importar = async (req, res) => {
  const { libros, estanteria } = req.body;
  if (!Array.isArray(libros) || !libros.length)
    return res.status(400).json({ error: 'No hay libros para importar' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const l of libros) {
      const { titulo, autor, editorial, volumen, idioma, genero, categoria } = l;
      if (!titulo) throw new Error('Hay filas sin título');
      const [result] = await conn.query(
        'INSERT INTO libro (titulo, autor, editorial, volumen, idioma, genero, categoria, estanteria, estado) VALUES (?,?,?,?,?,?,?,?,?)',
        [
          titulo,
          autor || null,
          editorial || null,
          volumen || null,
          idioma || null,
          genero || null,
          categoria || null,
          estanteria || null,
          'disponible',
        ]
      );
      const newId = result.insertId;
      await conn.query(
        "UPDATE libro SET codigo = CONCAT('L_', ?) WHERE id = ?",
        [newId, newId]
      );
    }
    await conn.commit();
    res.json({ importados: libros.length });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    const [rows] = await db.query(
      'SELECT nombre_foto FROM libro WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Libro no encontrado' });
    if (rows[0].nombre_foto) {
      const old = path.join(
        __dirname,
        '../../uploads/fotos_portadas',
        rows[0].nombre_foto
      );
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    await db.query('UPDATE libro SET nombre_foto = ? WHERE id = ?', [
      req.file.filename,
      req.params.id,
    ]);
    res.json({ nombre_foto: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

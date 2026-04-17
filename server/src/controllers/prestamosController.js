const db = require('../db');

exports.getAll = async (req, res) => {
  try {
    const { devuelto } = req.query;
    let query = `
      SELECT p.*,
             u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos, u.rol AS usuario_rol,
             l.titulo AS libro_titulo, l.codigo AS libro_codigo, l.autor AS libro_autor
      FROM prestamo p
      JOIN usuario u ON p.id_usuario = u.id
      JOIN libro   l ON p.id_libro   = l.id
      WHERE 1=1`;
    const params = [];
    if (devuelto !== undefined) { query += ' AND p.devuelto = ?'; params.push(devuelto); }
    query += ' ORDER BY p.fecha_inicio DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
             u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos,
             l.titulo AS libro_titulo, l.codigo AS libro_codigo
      FROM prestamo p
      JOIN usuario u ON p.id_usuario = u.id
      JOIN libro   l ON p.id_libro   = l.id
      WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Préstamo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista } = req.body;
    if (!id_usuario || !id_libro || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const [libro] = await conn.query('SELECT estado FROM libro WHERE id = ?', [id_libro]);
    if (!libro.length) return res.status(404).json({ error: 'Libro no encontrado' });
    if (libro[0].estado !== 'disponible') {
      return res.status(409).json({ error: `El libro no está disponible (estado: ${libro[0].estado})` });
    }
    const [result] = await conn.query(
      'INSERT INTO prestamo (id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista) VALUES (?,?,?,?)',
      [id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista || null]
    );
    await conn.query('UPDATE libro SET estado = "prestado" WHERE id = ?', [id_libro]);
    await conn.commit();
    const [rows] = await db.query(`
      SELECT p.*, u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos,
             l.titulo AS libro_titulo, l.codigo AS libro_codigo
      FROM prestamo p JOIN usuario u ON p.id_usuario=u.id JOIN libro l ON p.id_libro=l.id
      WHERE p.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.devolver = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { fecha_devolucion_real } = req.body;
    const [rows] = await conn.query('SELECT * FROM prestamo WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Préstamo no encontrado' });
    if (rows[0].devuelto) return res.status(409).json({ error: 'El préstamo ya fue devuelto' });

    const fecha = fecha_devolucion_real || new Date().toISOString().split('T')[0];
    await conn.query(
      'UPDATE prestamo SET devuelto = 1, fecha_devolucion_real = ? WHERE id = ?',
      [fecha, req.params.id]
    );
    await conn.query('UPDATE libro SET estado = "disponible" WHERE id = ?', [rows[0].id_libro]);
    await conn.commit();
    res.json({ message: 'Devolución registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.getMisPrestamos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, l.titulo AS libro_titulo, l.codigo AS libro_codigo, l.autor AS libro_autor
      FROM prestamo p JOIN libro l ON p.id_libro = l.id
      WHERE p.id_usuario = ?
      ORDER BY p.fecha_inicio DESC`, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

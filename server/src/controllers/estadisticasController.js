const db = require('../db');

const DEFAULT_LIMIT = 10;

exports.librosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (desde) { where += ' AND p.fecha_inicio >= ?'; params.push(desde); }
    if (hasta) { where += ' AND p.fecha_inicio <= ?'; params.push(hasta); }
    params.push(parseInt(limit, 10));

    const [rows] = await db.query(`
      SELECT l.titulo, l.autor, l.codigo, COUNT(*) AS total
      FROM prestamo p
      JOIN libro l ON p.id_libro = l.id
      ${where}
      GROUP BY l.id
      ORDER BY total DESC
      LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.prestamosPorMes = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (desde) { where += ' AND fecha_inicio >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha_inicio <= ?'; params.push(hasta); }

    const [rows] = await db.query(`
      SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes, COUNT(*) AS total
      FROM prestamo
      ${where}
      GROUP BY mes
      ORDER BY mes ASC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.alumnosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const params = [];
    let where = "WHERE u.rol = 'alumno'";
    if (desde) { where += ' AND p.fecha_inicio >= ?'; params.push(desde); }
    if (hasta) { where += ' AND p.fecha_inicio <= ?'; params.push(hasta); }
    params.push(parseInt(limit, 10));

    const [rows] = await db.query(`
      SELECT u.nombre, u.apellidos, u.codigo, u.ubicacion, COUNT(*) AS total
      FROM prestamo p
      JOIN usuario u ON p.id_usuario = u.id
      ${where}
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.registroPorMes = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (desde) { where += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha <= ?'; params.push(hasta); }

    const [rows] = await db.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, COUNT(*) AS total
      FROM registro
      ${where}
      GROUP BY mes
      ORDER BY mes ASC
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cursosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (desde) { where += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha <= ?'; params.push(hasta); }
    params.push(parseInt(limit, 10));

    const [rows] = await db.query(`
      SELECT curso, COUNT(*) AS total
      FROM registro
      ${where}
      GROUP BY curso
      ORDER BY total DESC
      LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resumen = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (desde) { where += ' AND fecha_inicio >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha_inicio <= ?'; params.push(hasta); }

    const today = new Date().toISOString().split('T')[0];

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM prestamo ${where}`, params);
    const [[{ devueltos }]] = await db.query(`SELECT COUNT(*) AS devueltos FROM prestamo ${where} AND devuelto = 1`, params);
    const [[{ vencidos }]] = await db.query(
      `SELECT COUNT(*) AS vencidos FROM prestamo ${where} AND devuelto = 0 AND fecha_devolucion_prevista < ?`,
      [...params, today]
    );

    const rParams = [];
    let rWhere = 'WHERE 1=1';
    if (desde) { rWhere += ' AND fecha >= ?'; rParams.push(desde); }
    if (hasta) { rWhere += ' AND fecha <= ?'; rParams.push(hasta); }
    const [[{ visitas }]] = await db.query(`SELECT COUNT(*) AS visitas FROM registro ${rWhere}`, rParams);

    res.json({ total, devueltos, activos: total - devueltos - vencidos, vencidos, visitas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

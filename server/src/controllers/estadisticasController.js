const db = require('../db');

const DEFAULT_LIMIT = 10;

function buildWhere(desde, hasta, prefix = '') {
  const params = [];
  let where = 'WHERE 1=1';
  if (desde) { where += ` AND ${prefix}fecha_inicio >= ?`; params.push(desde); }
  if (hasta) { where += ` AND ${prefix}fecha_inicio <= ?`; params.push(hasta); }
  return { where, params };
}

function buildWhereReg(desde, hasta) {
  const params = [];
  let where = 'WHERE 1=1';
  if (desde) { where += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { where += ' AND fecha <= ?'; params.push(hasta); }
  return { where, params };
}

/* ── PRÉSTAMOS ── */

exports.librosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const { where, params } = buildWhere(desde, hasta, 'p.');
    params.push(parseInt(limit, 10));
    const [rows] = await db.query(`
      SELECT l.titulo, l.autor, l.codigo, COUNT(*) AS total
      FROM prestamo p JOIN libro l ON p.id_libro = l.id
      ${where} GROUP BY l.id ORDER BY total DESC LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.alumnosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const { where, params } = buildWhere(desde, hasta, 'p.');
    const base = where.replace('WHERE 1=1', "WHERE u.rol = 'alumno'");
    params.push(parseInt(limit, 10));
    const [rows] = await db.query(`
      SELECT u.nombre, u.apellidos, u.codigo, u.ubicacion, COUNT(*) AS total
      FROM prestamo p JOIN usuario u ON p.id_usuario = u.id
      ${base} GROUP BY u.id ORDER BY total DESC LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.prestamosPorMes = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhere(desde, hasta);
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes, COUNT(*) AS total
      FROM prestamo ${where} AND fecha_inicio IS NOT NULL
      GROUP BY mes ORDER BY mes ASC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.prestamosPorCurso = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhere(desde, hasta, 'p.');
    const [rows] = await db.query(`
      SELECT u.ubicacion AS curso, COUNT(*) AS total
      FROM prestamo p JOIN usuario u ON p.id_usuario = u.id
      ${where} AND u.ubicacion IS NOT NULL
      GROUP BY u.ubicacion ORDER BY total DESC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.librosNuncaPrestados = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.titulo, l.autor, l.codigo, l.estanteria, l.estado
      FROM libro l
      LEFT JOIN prestamo p ON p.id_libro = l.id
      WHERE p.id IS NULL
      ORDER BY l.titulo ASC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.tasaDevolucion = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhere(desde, hasta);
    const today = new Date().toISOString().split('T')[0];

    const [[{ total }]]     = await db.query(`SELECT COUNT(*) AS total FROM prestamo ${where}`, params);
    const [[{ devueltos }]] = await db.query(`SELECT COUNT(*) AS devueltos FROM prestamo ${where} AND devuelto = 1`, params);
    const [[{ a_tiempo }]]  = await db.query(
      `SELECT COUNT(*) AS a_tiempo FROM prestamo ${where} AND devuelto = 1 AND (fecha_devolucion_real <= fecha_devolucion_prevista OR fecha_devolucion_prevista IS NULL)`,
      params
    );
    const [[{ vencidos }]]  = await db.query(
      `SELECT COUNT(*) AS vencidos FROM prestamo ${where} AND devuelto = 0 AND fecha_devolucion_prevista < ?`,
      [...params, today]
    );

    res.json({
      total,
      devueltos,
      a_tiempo,
      tarde: devueltos - a_tiempo,
      vencidos,
      activos: total - devueltos - vencidos,
      tasa: devueltos > 0 ? Math.round((a_tiempo / devueltos) * 100) : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.tiempoMedio = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhere(desde, hasta);
    const { where: whereP, params: paramsP } = buildWhere(desde, hasta, 'p.');

    const [[{ media_dias }]] = await db.query(`
      SELECT ROUND(AVG(DATEDIFF(fecha_devolucion_real, fecha_inicio)), 1) AS media_dias
      FROM prestamo ${where} AND devuelto = 1 AND fecha_devolucion_real IS NOT NULL
    `, params);

    const [[{ media_retraso }]] = await db.query(`
      SELECT ROUND(AVG(DATEDIFF(fecha_devolucion_real, fecha_devolucion_prevista)), 1) AS media_retraso
      FROM prestamo ${where} AND devuelto = 1
        AND fecha_devolucion_real > fecha_devolucion_prevista
        AND fecha_devolucion_prevista IS NOT NULL
    `, params);

    const [por_curso] = await db.query(`
      SELECT u.ubicacion AS curso,
             ROUND(AVG(DATEDIFF(p.fecha_devolucion_real, p.fecha_inicio)), 1) AS media_dias,
             COUNT(*) AS total
      FROM prestamo p JOIN usuario u ON p.id_usuario = u.id
      ${whereP} AND p.devuelto = 1 AND p.fecha_devolucion_real IS NOT NULL AND u.ubicacion IS NOT NULL
      GROUP BY u.ubicacion ORDER BY media_dias DESC
    `, paramsP);

    res.json({ media_dias, media_retraso, por_curso });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.alumnosMorosos = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const today = new Date().toISOString().split('T')[0];
    const dateParams = [];
    let where = "WHERE u.rol = 'alumno'";
    if (desde) { where += ' AND p.fecha_inicio >= ?'; dateParams.push(desde); }
    if (hasta) { where += ' AND p.fecha_inicio <= ?'; dateParams.push(hasta); }

    // Param order matches placeholders in query:
    // 1. today  → DATEDIFF(?, p.fecha_devolucion_prevista)
    // 2. desde? → p.fecha_inicio >= ?
    // 3. hasta? → p.fecha_inicio <= ?
    // 4. today  → p.fecha_devolucion_prevista < ?
    // 5. limit  → LIMIT ?
    const [rows] = await db.query(`
      SELECT u.nombre, u.apellidos, u.codigo, u.ubicacion,
             COUNT(*) AS total_vencidos,
             SUM(DATEDIFF(?, p.fecha_devolucion_prevista)) AS dias_totales_retraso
      FROM prestamo p JOIN usuario u ON p.id_usuario = u.id
      ${where} AND p.devuelto = 0 AND p.fecha_devolucion_prevista < ?
      GROUP BY u.id ORDER BY total_vencidos DESC LIMIT ?
    `, [today, ...dateParams, today, parseInt(limit, 10)]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

/* ── REGISTRO DIARIO ── */

exports.registroPorMes = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhereReg(desde, hasta);
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, COUNT(*) AS total
      FROM registro ${where} GROUP BY mes ORDER BY mes ASC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.cursosTop = async (req, res) => {
  try {
    const { desde, hasta, limit = DEFAULT_LIMIT } = req.query;
    const { where, params } = buildWhereReg(desde, hasta);
    params.push(parseInt(limit, 10));
    const [rows] = await db.query(`
      SELECT curso, COUNT(*) AS total
      FROM registro ${where} GROUP BY curso ORDER BY total DESC LIMIT ?
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.diaSemana = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhereReg(desde, hasta);
    const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const [rows] = await db.query(`
      SELECT DAYOFWEEK(fecha) AS dow, COUNT(*) AS total
      FROM registro ${where} GROUP BY dow ORDER BY dow ASC
    `, params);
    res.json(rows.map(r => ({ dia: dias[r.dow - 1], total: r.total })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.resumen = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const { where, params } = buildWhere(desde, hasta);
    const today = new Date().toISOString().split('T')[0];

    const [[{ total }]]     = await db.query(`SELECT COUNT(*) AS total FROM prestamo ${where}`, params);
    const [[{ devueltos }]] = await db.query(`SELECT COUNT(*) AS devueltos FROM prestamo ${where} AND devuelto = 1`, params);
    const [[{ vencidos }]]  = await db.query(
      `SELECT COUNT(*) AS vencidos FROM prestamo ${where} AND devuelto = 0 AND fecha_devolucion_prevista < ?`,
      [...params, today]
    );
    const { where: rw, params: rp } = buildWhereReg(desde, hasta);
    const [[{ visitas }]] = await db.query(`SELECT COUNT(*) AS visitas FROM registro ${rw}`, rp);

    res.json({ total, devueltos, activos: total - devueltos - vencidos, vencidos, visitas });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

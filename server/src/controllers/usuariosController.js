const bcrypt = require('bcryptjs');
const db = require('../db');

const CAMPOS =
  'id, codigo, nombre, apellidos, email, rol, ubicacion, activo, fecha_alta, fecha_baja';

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario ORDER BY apellidos, nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPerfil = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${CAMPOS} FROM usuario WHERE id = ?`,
      [req.user.id]
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
      'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion, fecha_alta) VALUES (?,?,?,?,?,?,CURDATE())',
      [nombre, apellidos, email, hash, rol, ubicacion || null]
    );
    const newId = result.insertId;
    await db.query("UPDATE usuario SET codigo = CONCAT('U_', ?) WHERE id = ?", [
      newId,
      newId,
    ]);
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

    if (!email.toLowerCase().endsWith('@juandelanuza.org'))
      return res.status(400).json({ error: 'El email debe ser del dominio @juandelanuza.org' });

    if (rol === 'biblioteca') {
      const [current] = await db.query('SELECT rol FROM usuario WHERE id = ?', [req.params.id]);
      if (!current.length)
        return res.status(404).json({ error: 'Usuario no encontrado' });
      if (!['personal', 'profesorado'].includes(current[0].rol))
        return res.status(400).json({ error: 'Solo se puede asignar el rol biblioteca a personal o profesorado' });
    }

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
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email ya registrado' });
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
    const [activos] = await db.query(
      'SELECT id FROM prestamo WHERE id_usuario = ? AND devuelto = 0 LIMIT 1',
      [req.params.id]
    );
    if (activos.length)
      return res.status(409).json({
        error: 'No se puede eliminar el usuario porque tiene préstamos activos',
      });
    await db.query('DELETE FROM usuario WHERE id = ?', [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.eliminarMultiple = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: 'No hay usuarios seleccionados' });
  try {
    const fallos = [];
    for (const id of ids) {
      const [rows] = await db.query('SELECT nombre, apellidos FROM usuario WHERE id = ?', [id]);
      const [activos] = await db.query(
        'SELECT id FROM prestamo WHERE id_usuario = ? AND devuelto = 0 LIMIT 1',
        [id]
      );
      if (activos.length)
        fallos.push(`${rows[0]?.nombre} ${rows[0]?.apellidos}`.trim() || `ID ${id}`);
    }
    if (fallos.length)
      return res.status(409).json({ fallos });
    const placeholders = ids.map(() => '?').join(',');
    await db.query(`DELETE FROM usuario WHERE id IN (${placeholders})`, ids);
    res.json({ eliminados: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.prestamosCount = async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM prestamo WHERE id_usuario = ?',
      [req.params.id]
    );
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleActivo = async (req, res) => {
  try {
    const { activo } = req.body;
    await db.query(
      'UPDATE usuario SET activo = ?, fecha_baja = ? WHERE id = ?',
      [
        activo ? 1 : 0,
        activo ? null : new Date().toISOString().slice(0, 10),
        req.params.id,
      ]
    );
    res.json({ activo: activo ? 1 : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.importar = async (req, res) => {
  const { usuarios, rol, ubicacion, password } = req.body;
  if (!Array.isArray(usuarios) || !usuarios.length)
    return res.status(400).json({ error: 'No hay usuarios para importar' });
  if (!password)
    return res.status(400).json({ error: 'La contraseña es obligatoria' });

  // Validar formato antes de tocar la BD
  for (const u of usuarios) {
    const { nombre, apellidos, email } = u;
    if (!nombre || !apellidos || !email)
      return res.status(400).json({
        error: `Fila incompleta: "${nombre || ''}" "${apellidos || ''}" "${email || ''}"`,
      });
    if (!email.toLowerCase().endsWith('@juandelanuza.org'))
      return res.status(400).json({ error: `Email inválido: ${email}` });
  }

  // Comprobar duplicados antes de insertar nada
  const emails = usuarios.map((u) => u.email);
  const [existentes] = await db.query(
    'SELECT email FROM usuario WHERE email IN (?)',
    [emails]
  );
  if (existentes.length) {
    const lista = existentes.map((r) => r.email).join('\n');
    return res.status(409).json({
      error: `Los siguientes emails ya están registrados:\n${lista}`,
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const hash = await bcrypt.hash(password, 10);
    for (const u of usuarios) {
      const { nombre, apellidos, email } = u;
      const [result] = await conn.query(
        'INSERT INTO usuario (nombre, apellidos, email, password, rol, ubicacion, fecha_alta) VALUES (?,?,?,?,?,?,CURDATE())',
        [nombre, apellidos, email, hash, rol, ubicacion || null]
      );
      const newId = result.insertId;
      await conn.query(
        "UPDATE usuario SET codigo = CONCAT('U_', ?) WHERE id = ?",
        [newId, newId]
      );
    }
    await conn.commit();
    res.json({ importados: usuarios.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.subidaDeCurso = async (req, res) => {
  const CURSOS = [
    '1º Primaria',
    '2º Primaria',
    '3º Primaria',
    '4º Primaria',
    '5º Primaria',
    '6º Primaria',
    '1º ESO',
    '2º ESO',
    '3º ESO',
    '4º ESO',
    '1º Bach',
    '2º Bach',
  ];

  try {
    // Contar antes de ejecutar para devolver el resumen
    const [[{ graduados }]] = await db.query(
      "SELECT COUNT(*) AS graduados FROM usuario WHERE rol = 'alumno' AND activo = 1 AND ubicacion = '2º Bach'"
    );
    const [[{ avanzados }]] = await db.query(
      "SELECT COUNT(*) AS avanzados FROM usuario WHERE rol = 'alumno' AND activo = 1 AND ubicacion != '2º Bach' AND ubicacion IS NOT NULL"
    );

    // CASE para avanzar ubicacion (excluye 2º Bach → se queda igual por ELSE)
    const whenClauses = CURSOS.slice(0, -1)
      .map(() => 'WHEN ? THEN ?')
      .join(' ');
    const params = CURSOS.slice(0, -1).flatMap((c, i) => [c, CURSOS[i + 1]]);

    const hoy = new Date().toISOString().slice(0, 10);
    await db.query(
      `UPDATE usuario
       SET
         activo    = CASE WHEN ubicacion = '2º Bach' THEN 0 ELSE activo END,
         fecha_baja = CASE WHEN ubicacion = '2º Bach' THEN ? ELSE fecha_baja END,
         ubicacion = CASE ubicacion ${whenClauses} WHEN '2º Bach' THEN NULL ELSE ubicacion END
       WHERE rol = 'alumno' AND activo = 1`,
      [hoy, ...params]
    );

    console.log(
      `[subida de curso] ${avanzados} avanzados · ${graduados} graduados`
    );
    res.json({ avanzados, graduados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

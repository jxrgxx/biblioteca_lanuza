const db = require('../db');
const { enviarConfirmacionPrestamo, enviarConfirmacionLote } = require('../services/mailer');
const { programarRecordatorio, programarRecordatorioLote, cancelarRecordatorio } = require('../jobs/recordatorios');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generarCodigoPrestamo(conn) {
  for (let intento = 0; intento < 10; intento++) {
    let codigo = '';
    for (let i = 0; i < 6; i++) codigo += CHARS[Math.floor(Math.random() * CHARS.length)];
    const [rows] = await conn.query('SELECT id FROM prestamo WHERE codigo = ?', [codigo]);
    if (!rows.length) return codigo;
  }
  throw new Error('No se pudo generar un código único para el préstamo');
}

async function generarCodigoLote(conn) {
  for (let intento = 0; intento < 10; intento++) {
    let sufijo = '';
    for (let i = 0; i < 6; i++) sufijo += CHARS[Math.floor(Math.random() * CHARS.length)];
    const lote = `PM-${sufijo}`;
    const [rows] = await conn.query('SELECT id FROM prestamo WHERE codigo_lote = ? LIMIT 1', [lote]);
    if (!rows.length) return lote;
  }
  throw new Error('No se pudo generar un código de lote único');
}

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
    if (devuelto !== undefined && devuelto !== '') {
      query += ' AND p.devuelto = ?';
      params.push(devuelto);
    }
    query += ' ORDER BY p.fecha_inicio DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT p.*,
             u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos,
             l.titulo AS libro_titulo, l.codigo AS libro_codigo
      FROM prestamo p
      JOIN usuario u ON p.id_usuario = u.id
      JOIN libro   l ON p.id_libro   = l.id
      WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista } =
      req.body;
    if (!id_usuario || !id_libro || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const [libro] = await conn.query('SELECT estado FROM libro WHERE id = ?', [
      id_libro,
    ]);
    if (!libro.length)
      return res.status(404).json({ error: 'Libro no encontrado' });
    if (libro[0].estado !== 'disponible') {
      return res.status(409).json({
        error: `El libro no está disponible (estado: ${libro[0].estado})`,
      });
    }
    const codigo = await generarCodigoPrestamo(conn);
    const [result] = await conn.query(
      'INSERT INTO prestamo (codigo, id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista) VALUES (?,?,?,?,?)',
      [codigo, id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista || null]
    );
    await conn.query('UPDATE libro SET estado = "prestado" WHERE id = ?', [
      id_libro,
    ]);
    await programarRecordatorio(conn, { id_prestamo: result.insertId, fecha_devolucion_prevista: fecha_devolucion_prevista || null });
    await conn.commit();
    const [rows] = await db.query(
      `SELECT p.*,
              u.nombre AS usuario_nombre, u.apellidos AS usuario_apellidos, u.email AS usuario_email,
              l.titulo AS libro_titulo, l.codigo AS libro_codigo, l.autor AS libro_autor
       FROM prestamo p
       JOIN usuario u ON p.id_usuario = u.id
       JOIN libro   l ON p.id_libro   = l.id
       WHERE p.id = ?`,
      [result.insertId]
    );
    const prestamo = rows[0];
    res.status(201).json(prestamo);

    // Fire-and-forget: el email no bloquea ni afecta la respuesta
    const fechaInicioStr = prestamo.fecha_inicio instanceof Date
      ? prestamo.fecha_inicio.toISOString().split('T')[0]
      : String(prestamo.fecha_inicio).split('T')[0];
    const fechaPrevistaStr = prestamo.fecha_devolucion_prevista
      ? (prestamo.fecha_devolucion_prevista instanceof Date
          ? prestamo.fecha_devolucion_prevista.toISOString().split('T')[0]
          : String(prestamo.fecha_devolucion_prevista).split('T')[0])
      : null;

    console.log(`[préstamo] Nuevo préstamo ${prestamo.codigo} → "${prestamo.libro_titulo}" para ${prestamo.usuario_email}`);

    enviarConfirmacionPrestamo({
      email:          prestamo.usuario_email,
      nombre:         `${prestamo.usuario_nombre} ${prestamo.usuario_apellidos}`,
      titulo:         prestamo.libro_titulo,
      autor:          prestamo.libro_autor,
      codigoLibro:    prestamo.libro_codigo,
      codigoPrestamo: prestamo.codigo,
      fechaInicio:    fechaInicioStr,
      fechaPrevista:  fechaPrevistaStr,
    })
      .then(() => console.log(`[mailer] ✓ Confirmación enviada a ${prestamo.usuario_email} (préstamo ${prestamo.codigo})`))
      .catch(err => console.error(`[mailer] ✗ Error enviando confirmación a ${prestamo.usuario_email}:`, err.message));
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
    const [rows] = await conn.query('SELECT * FROM prestamo WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    if (rows[0].devuelto)
      return res.status(409).json({ error: 'El préstamo ya fue devuelto' });

    const fecha =
      fecha_devolucion_real || new Date().toISOString().split('T')[0];
    await conn.query(
      'UPDATE prestamo SET devuelto = 1, fecha_devolucion_real = ? WHERE id = ?',
      [fecha, req.params.id]
    );
    await conn.query('UPDATE libro SET estado = "disponible" WHERE id = ?', [
      rows[0].id_libro,
    ]);
    await cancelarRecordatorio(conn, { id_prestamo: parseInt(req.params.id) });
    await conn.commit();
    res.json({ message: 'Devolución registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      fecha_inicio,
      fecha_devolucion_prevista,
      fecha_devolucion_real,
      devuelto,
    } = req.body;
    const [rows] = await conn.query('SELECT * FROM prestamo WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    const prev = rows[0];

    await conn.query(
      'UPDATE prestamo SET fecha_inicio=?, fecha_devolucion_prevista=?, fecha_devolucion_real=?, devuelto=? WHERE id=?',
      [
        fecha_inicio,
        fecha_devolucion_prevista || null,
        fecha_devolucion_real || null,
        devuelto ? 1 : 0,
        req.params.id,
      ]
    );

    // sync libro.estado when devuelto changes
    if (!!devuelto !== !!prev.devuelto) {
      const nuevoEstado = devuelto ? 'disponible' : 'prestado';
      await conn.query('UPDATE libro SET estado=? WHERE id=?', [
        nuevoEstado,
        prev.id_libro,
      ]);
    }

    // reprogramar recordatorio si cambia la fecha o se marca/desmarca devuelto
    await cancelarRecordatorio(conn, { id_prestamo: parseInt(req.params.id) });
    if (!devuelto) {
      await programarRecordatorio(conn, { id_prestamo: parseInt(req.params.id), fecha_devolucion_prevista: fecha_devolucion_prevista || null });
    }

    await conn.commit();
    res.json({ message: 'Préstamo actualizado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM prestamo WHERE id = ?', [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    const p = rows[0];

    await cancelarRecordatorio(conn, { id_prestamo: parseInt(req.params.id) });
    await conn.query('DELETE FROM prestamo WHERE id = ?', [req.params.id]);
    if (!p.devuelto) {
      await conn.query("UPDATE libro SET estado='disponible' WHERE id=?", [
        p.id_libro,
      ]);
    }
    await conn.commit();
    res.json({ message: 'Préstamo eliminado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.createLote = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { codigo_usuario, ids_libros, fecha_inicio, fecha_devolucion_prevista } = req.body;

    if (!codigo_usuario || !Array.isArray(ids_libros) || !ids_libros.length || !fecha_inicio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const [usuarios] = await conn.query(
      "SELECT id, nombre, apellidos, email, rol FROM usuario WHERE codigo = ? AND activo = 1",
      [codigo_usuario]
    );
    if (!usuarios.length) {
      return res.status(404).json({ error: 'Usuario no encontrado o inactivo' });
    }
    const usuario = usuarios[0];
    if (!['profesorado', 'personal'].includes(usuario.rol)) {
      return res.status(403).json({ error: 'Solo profesorado o personal puede realizar préstamos múltiples' });
    }

    const codigoLote = await generarCodigoLote(conn);
    const creados = [];
    const noDisponibles = [];

    for (const id_libro of ids_libros) {
      const [libros] = await conn.query('SELECT id, titulo, codigo, autor, estado FROM libro WHERE id = ?', [id_libro]);
      if (!libros.length || libros[0].estado !== 'disponible') {
        noDisponibles.push({ id_libro, titulo: libros[0]?.titulo || '—', estado: libros[0]?.estado || 'no encontrado' });
        continue;
      }
      const codigo = await generarCodigoPrestamo(conn);
      const [result] = await conn.query(
        'INSERT INTO prestamo (codigo, codigo_lote, id_usuario, id_libro, fecha_inicio, fecha_devolucion_prevista) VALUES (?,?,?,?,?,?)',
        [codigo, codigoLote, usuario.id, id_libro, fecha_inicio, fecha_devolucion_prevista || null]
      );
      await conn.query('UPDATE libro SET estado = "prestado" WHERE id = ?', [id_libro]);
      creados.push({ id: result.insertId, codigo, id_libro, titulo: libros[0].titulo, autor: libros[0].autor, codigoLibro: libros[0].codigo });
    }

    if (!creados.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ningún libro estaba disponible', noDisponibles });
    }

    await programarRecordatorioLote(conn, { codigo_lote: codigoLote, fecha_devolucion_prevista: fecha_devolucion_prevista || null });
    await conn.commit();
    console.log(`[lote] ${codigoLote} · ${creados.length} préstamos para ${usuario.email}`);
    res.status(201).json({ lote: codigoLote, creados, noDisponibles });

    const fechaInicioStr = fecha_inicio;
    const fechaPrevistaStr = fecha_devolucion_prevista || null;

    enviarConfirmacionLote({
      email:        usuario.email,
      nombre:       `${usuario.nombre} ${usuario.apellidos}`,
      codigoLote,
      libros:       creados.map(c => ({ titulo: c.titulo, autor: c.autor || '—', codigoLibro: c.codigoLibro || '—', codigoPrestamo: c.codigo })),
      fechaInicio:  fechaInicioStr,
      fechaPrevista: fechaPrevistaStr,
    })
      .then(() => console.log(`[mailer] ✓ Confirmación lote enviada a ${usuario.email} (${codigoLote})`))
      .catch(err => console.error(`[mailer] ✗ Error confirmación lote a ${usuario.email}:`, err.message));
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.getMisPrestamos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT p.*, l.titulo AS libro_titulo, l.codigo AS libro_codigo, l.autor AS libro_autor
      FROM prestamo p JOIN libro l ON p.id_libro = l.id
      WHERE p.id_usuario = ?
      ORDER BY p.fecha_inicio DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

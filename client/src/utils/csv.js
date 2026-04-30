/**
 * Exporta un array de objetos a un fichero CSV con BOM UTF-8
 * (para que Excel reconozca los caracteres españoles).
 *
 * @param {object[]} datos     - Array de filas
 * @param {Array<{key:string, label:string, fmt?:function}>} columnas
 * @param {string}   nombre    - Nombre del fichero (sin .csv)
 */
export function exportarCSV(datos, columnas, nombre) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const cabecera = columnas.map((c) => escape(c.label)).join(',');
  const filas = datos.map((row) =>
    columnas
      .map((c) => escape(c.fmt ? c.fmt(row[c.key], row) : row[c.key]))
      .join(',')
  );

  const csv = '﻿' + [cabecera, ...filas].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombre}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Ordena un array por una clave de forma ascendente (devuelve copia). */
export function ordenarPor(datos, key) {
  return [...datos].sort((a, b) =>
    String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'es', { sensitivity: 'base' })
  );
}

// ── Definición de columnas por tabla ────────────────────────────────────────

const fmtFecha = (v) =>
  v ? String(v).split('T')[0] : '';

const fmtBool = (v) =>
  v ? 'Sí' : 'No';

export const COLS_PRESTAMOS = [
  { key: 'codigo',                    label: 'Código préstamo' },
  { key: 'codigo_lote',               label: 'Código lote' },
  { key: 'usuario_nombre',            label: 'Nombre' },
  { key: 'usuario_apellidos',         label: 'Apellidos' },
  { key: 'usuario_rol',               label: 'Rol usuario' },
  { key: 'libro_codigo',              label: 'Código libro' },
  { key: 'libro_titulo',              label: 'Título' },
  { key: 'libro_autor',               label: 'Autor' },
  { key: 'fecha_inicio',              label: 'Fecha inicio',        fmt: fmtFecha },
  { key: 'fecha_devolucion_prevista', label: 'F. dev. prevista',    fmt: fmtFecha },
  { key: 'fecha_devolucion_real',     label: 'F. dev. real',        fmt: fmtFecha },
  { key: 'devuelto',                  label: 'Devuelto',            fmt: fmtBool  },
];

export const COLS_LIBROS = [
  { key: 'codigo',     label: 'Código' },
  { key: 'titulo',     label: 'Título' },
  { key: 'autor',      label: 'Autor' },
  { key: 'editorial',  label: 'Editorial' },
  { key: 'volumen',    label: 'Volumen' },
  { key: 'idioma',     label: 'Idioma' },
  { key: 'genero',     label: 'Género' },
  { key: 'estanteria', label: 'Estantería' },
  { key: 'categoria',  label: 'Categoría' },
  { key: 'estado',     label: 'Estado' },
];

export const COLS_USUARIOS = [
  { key: 'codigo',     label: 'Código' },
  { key: 'nombre',     label: 'Nombre' },
  { key: 'apellidos',  label: 'Apellidos' },
  { key: 'email',      label: 'Email' },
  { key: 'rol',        label: 'Rol' },
  { key: 'ubicacion',  label: 'Ubicación' },
  { key: 'activo',     label: 'Activo',      fmt: fmtBool  },
  { key: 'fecha_alta', label: 'Fecha alta',  fmt: fmtFecha },
  { key: 'fecha_baja', label: 'Fecha baja',  fmt: fmtFecha },
];

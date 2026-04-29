import { useEffect, useRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Search,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  GraduationCap,
} from 'lucide-react';
import api from '../services/api';
import Toast, { useToast } from '../components/Toast';
import { fmt } from '../utils/dates';

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

const EMPTY = {
  nombre: '',
  apellidos: '',
  email: '',
  password: '',
  rol: 'alumno',
  ubicacion: '',
};

const rolBadge = {
  personal: 'bg-purple-100 text-purple-700',
  profesorado: 'bg-brand-100 text-brand-700',
  alumno: 'bg-green-100 text-green-700',
  biblioteca: 'bg-blue-100 text-blue-700',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [modalCodigo, setModalCodigo] = useState(false);
  const [codigoRegistro, setCodigoRegistro] = useState('');
  const [loadingCodigo, setLoadingCodigo] = useState(false);

  const [modalSubida, setModalSubida] = useState(false);
  const [subidaLoading, setSubidaLoading] = useState(false);

  const [modalEliminar, setModalEliminar] = useState(null); // { id, nombre, apellidos, prestamos }
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [sortCol, setSortCol] = useState('apellidos');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  const PAGE_SIZE = 50;

  const load = async () => {
    const { data } = await api.get('/usuarios');
    setUsuarios(data);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowPass(false);
    setModal(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ ...u, password: '' });
    setError('');
    setShowPass(false);
    setModal(true);
  };

  const abrirModalCodigo = async () => {
    setModalCodigo(true);
    setLoadingCodigo(true);
    try {
      const { data } = await api.get('/config/codigo-registro');
      setCodigoRegistro(data.codigo);
    } finally {
      setLoadingCodigo(false);
    }
  };

  const generarNuevoCodigo = async () => {
    setLoadingCodigo(true);
    try {
      const { data } = await api.post('/config/codigo-registro');
      setCodigoRegistro(data.codigo);
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.toLowerCase().endsWith('@juandelanuza.org')) {
      setError('El email debe ser del dominio @juandelanuza.org');
      return;
    }
    try {
      const payload = {
        ...form,
        ubicacion: form.rol === 'personal' ? null : form.ubicacion || null,
      };
      if (editing) await api.put(`/usuarios/${editing.id}`, payload);
      else await api.post('/usuarios', payload);
      setModal(false);
      showToast(
        editing
          ? 'Usuario actualizado correctamente'
          : 'Usuario creado correctamente'
      );
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const abrirModalEliminar = async (u) => {
    const { data } = await api.get(`/usuarios/${u.id}/prestamos-count`);
    setModalEliminar({
      id: u.id,
      nombre: u.nombre,
      apellidos: u.apellidos,
      prestamos: data.total,
    });
  };

  const handleDelete = async () => {
    setEliminandoLoading(true);
    try {
      await api.delete(`/usuarios/${modalEliminar.id}`);
      setModalEliminar(null);
      showToast('Usuario eliminado');
      load();
    } finally {
      setEliminandoLoading(false);
    }
  };

  const { toast, showToast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubidaDeCurso = async () => {
    setSubidaLoading(true);
    try {
      const { data } = await api.post('/usuarios/subida-de-curso');
      setModalSubida(false);
      showToast(
        `${data.avanzados} alumnos avanzados · ${data.graduados} graduados`
      );
      load();
    } catch (err) {
      alert(
        err.response?.data?.error || 'Error al ejecutar la subida de curso'
      );
    } finally {
      setSubidaLoading(false);
    }
  };

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  const filtered = usuarios.filter((u) => {
    if (!mostrarInactivos && u.activo === 0) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.nombre?.toLowerCase().includes(q) &&
        !u.apellidos?.toLowerCase().includes(q) &&
        !u.email?.toLowerCase().includes(q) &&
        !u.codigo?.toLowerCase().includes(q)
      )
        return false;
    }
    if (filtroRol && u.rol !== filtroRol) return false;
    if (filtroUbicacion && u.ubicacion !== filtroUbicacion) return false;
    return true;
  });

  const totalInactivos = usuarios.filter((u) => u.activo === 0).length;

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    const cmp = String(va).localeCompare(String(vb), 'es', {
      sensitivity: 'base',
    });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const Th = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortCol === col ? (
          sortDir === 'asc' ? (
            <ChevronUp size={14} className="text-brand-600" />
          ) : (
            <ChevronDown size={14} className="text-brand-600" />
          )
        ) : (
          <ChevronsUpDown size={14} className="text-gray-300" />
        )}
      </span>
    </th>
  );

  const hayFiltros = searchInput || filtroRol || filtroUbicacion;
  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroRol('');
    setFiltroUbicacion('');
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setModalSubida(true)}
            className="flex items-center gap-1.5 border border-amber-500 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <GraduationCap size={16} />
            Subida de curso
          </button>
          <button
            onClick={abrirModalCodigo}
            className="border border-brand-600 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Código de registro
          </button>
          <button
            onClick={openNew}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Añadir usuario
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Buscar por nombre, apellidos, email o código"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-brand-600 hover:underline whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroRol ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Rol</option>
            <option value="alumno">Alumno</option>
            <option value="profesorado">Profesorado</option>
            <option value="personal">Personal</option>
            <option value="biblioteca">Biblioteca</option>
          </select>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroUbicacion ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Ubicación</option>
            {CURSOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length}{' '}
            {filtered.length === 1
              ? 'usuario encontrado'
              : 'usuarios encontrados'}
            {hayFiltros && ' con los filtros aplicados'}
          </p>
          {totalInactivos > 0 && (
            <button
              onClick={() => setMostrarInactivos((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                mostrarInactivos
                  ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <GraduationCap size={13} />
              {mostrarInactivos
                ? `Ocultar inactivos (${totalInactivos})`
                : `Inactivos (${totalInactivos})`}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <Th col="codigo">Código</Th>
              <Th col="nombre">Nombre</Th>
              <Th col="apellidos">Apellidos</Th>
              <Th col="email">Email</Th>
              <Th col="rol">Rol</Th>
              <Th col="ubicacion">Ubicación</Th>
              <Th col="fecha_alta">Alta</Th>
              <Th col="fecha_baja">Baja</Th>
              <th className="px-4 py-3 text-center">Activo</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina.map((u) => (
              <tr
                key={u.id}
                className={`hover:bg-gray-50 ${u.activo === 0 ? 'opacity-50' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {u.codigo || '—'}
                </td>
                <td className="px-4 py-3 font-medium">{u.nombre}</td>
                <td className="px-4 py-3 font-medium">{u.apellidos}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolBadge[u.rol]}`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.ubicacion || '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {fmt(u.fecha_alta) || '—'}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {u.fecha_baja ? (
                    <span className="text-red-400">{fmt(u.fecha_baja)}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={u.activo !== 0}
                    onChange={async (e) => {
                      await api.patch(`/usuarios/${u.id}/activo`, {
                        activo: e.target.checked,
                      });
                      load();
                    }}
                    className="w-4 h-4 accent-brand-600 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(u)}
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => abrirModalEliminar(u)}
                      title="Eliminar"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {hayFiltros
                    ? 'Sin resultados con los filtros aplicados'
                    : 'Sin usuarios'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            {sorted.length} usuarios — página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">
              {editing ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre *
                  </label>
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => set('nombre', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Apellidos *
                  </label>
                  <input
                    required
                    value={form.apellidos}
                    onChange={(e) => set('apellidos', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraseña {editing && '(dejar vacío para no cambiar)'}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required={!editing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rol *
                  </label>
                  <select
                    value={form.rol}
                    onChange={(e) => set('rol', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="alumno">Alumno</option>
                    <option value="profesorado">Profesorado</option>
                    <option value="personal">Personal</option>
                    <option value="biblioteca">Biblioteca</option>
                  </select>
                </div>
                {form.rol !== 'personal' && form.rol !== 'biblioteca' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ubicación
                    </label>
                    <select
                      value={form.ubicacion}
                      onChange={(e) => set('ubicacion', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">— Selecciona —</option>
                      {CURSOS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg"
                >
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalCodigo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              Código de registro
            </h2>
            <p className="text-sm text-gray-500">
              Comparte este código con el personal o profesorado que quiera
              registrarse. Al generar uno nuevo, el anterior queda invalidado.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-center">
                {loadingCodigo ? (
                  <span className="text-gray-400 text-sm">Cargando...</span>
                ) : codigoRegistro ? (
                  <span className="text-2xl font-mono font-bold tracking-widest text-brand-600">
                    {codigoRegistro}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">
                    Sin código generado
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={generarNuevoCodigo}
              disabled={loadingCodigo}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Generar nuevo código
            </button>
            <button
              onClick={() => setModalCodigo(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal eliminar usuario */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Eliminar usuario
                </h2>
                <p className="text-sm text-gray-500">
                  {modalEliminar.nombre} {modalEliminar.apellidos}
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1.5 text-sm text-red-700">
              <p>
                Esta acción es <strong>irreversible</strong>. Se eliminará:
              </p>
              <ul className="space-y-1 mt-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  El usuario y su cuenta
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {modalEliminar.prestamos === 0
                    ? 'Sus préstamos (ninguno registrado)'
                    : `Sus ${modalEliminar.prestamos} préstamo${modalEliminar.prestamos !== 1 ? 's' : ''} (historial incluido)`}
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setModalEliminar(null)}
                disabled={eliminandoLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={eliminandoLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {eliminandoLoading
                  ? 'Eliminando...'
                  : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal subida de curso */}
      {modalSubida && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <GraduationCap size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Subida de curso
                </h2>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-700">
              <p>
                Se aplicarán los siguientes cambios a
                <strong> todos los alumnos activos</strong>:
              </p>
              <ul className="space-y-1.5 mt-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-1.5" />
                  Cada alumno sube un curso{' '}
                  <span className="text-gray-400">
                    (ej: 3º ESO pasa a 4º ESO)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  Los alumnos de 2º Bach pasan a inactivos y dejan de aparecer
                  en la lista, pero siguen existiendo.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setModalSubida(false)}
                disabled={subidaLoading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubidaDeCurso}
                disabled={subidaLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {subidaLoading ? 'Procesando...' : 'Confirmar subida'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

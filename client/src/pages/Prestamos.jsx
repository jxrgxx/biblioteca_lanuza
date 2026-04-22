import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { fmt } from '../utils/dates';
import Toast, { useToast } from '../components/Toast';

const USR_RE = /^U_(\d{1,4})$/i;
const COL_RE = /^COL-(\d{1,4})$/i;

const EMPTY_FORM = {
  qrUsuario: '',
  qrLibro: '',
  fecha_inicio: '',
  fecha_devolucion_prevista: '',
};

const EMPTY_EDIT = {
  fecha_inicio: '',
  fecha_devolucion_prevista: '',
  fecha_devolucion_real: '',
  devuelto: false,
};

const PAGE_SIZE = 50;

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('activos');

  // Buscador
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroMes, setFiltroMes] = useState('');
  const debounceRef = useRef(null);

  // Ordenación y paginación
  const [sortCol, setSortCol] = useState('fecha_inicio');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Modal nuevo préstamo
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [usuarioPreview, setUsuarioPreview] = useState(null);
  const [libroPreview, setLibroPreview] = useState(null);
  const [usuarioError, setUsuarioError] = useState('');
  const [libroError, setLibroError] = useState('');
  const usrDebounce = useRef(null);
  const colDebounce = useRef(null);

  // Modal editar
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    const { data } = await api.get('/prestamos');
    setPrestamos(data);
    setPage(1);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  const vencido = (p) =>
    p.fecha_devolucion_prevista &&
    p.fecha_devolucion_prevista < today &&
    !p.devuelto;

  // Meses disponibles para el filtro
  const mesesDisponibles = [...new Set(
    prestamos
      .map((p) => p.fecha_inicio?.slice(0, 7))
      .filter(Boolean)
  )].sort().reverse();

  // Filtrado client-side
  const filtered = prestamos.filter((p) => {
    if (filtroEstado === 'activos' && (p.devuelto || vencido(p))) return false;
    if (filtroEstado === 'vencidos' && !vencido(p)) return false;
    if (filtroEstado === 'devueltos' && !p.devuelto) return false;
    if (filtroMes && !p.fecha_inicio?.startsWith(filtroMes)) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches =
        p.usuario_nombre?.toLowerCase().includes(q) ||
        p.usuario_apellidos?.toLowerCase().includes(q) ||
        p.libro_titulo?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Ordenación
  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    const cmp = String(va).localeCompare(String(vb), 'es', {
      sensitivity: 'base',
    });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const Th = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
    >
      {children}
      <span
        className={`ml-1 ${sortCol === col ? 'text-brand-600' : 'text-gray-300'}`}
      >
        {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );

  const hayFiltros = searchInput || filtroMes;
  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroMes('');
    setPage(1);
  };

  const resolveUsuario = (val) => {
    setUsuarioPreview(null);
    setUsuarioError('');
    clearTimeout(usrDebounce.current);
    const match = val.match(USR_RE);
    if (!match) {
      if (val) setUsuarioError('Formato inválido. Usa U_0000');
      return;
    }
    const id = parseInt(match[1], 10);
    usrDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/usuarios/${id}`);
        setUsuarioPreview(data);
        setUsuarioError('');
      } catch {
        setUsuarioError('Usuario no encontrado');
      }
    }, 250);
  };

  const resolveLibro = (val) => {
    setLibroPreview(null);
    setLibroError('');
    clearTimeout(colDebounce.current);
    const match = val.match(COL_RE);
    if (!match) {
      if (val) setLibroError('Formato inválido. Usa COL-0000');
      return;
    }
    const codigo = `COL-${match[1].padStart(4, '0')}`;
    colDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/libros?search=${codigo}`);
        const libro = data.find(
          (l) => l.codigo.toUpperCase() === codigo.toUpperCase()
        );
        if (!libro) {
          setLibroError('Libro no encontrado');
        } else {
          setLibroPreview(libro);
          setLibroError('');
        }
      } catch {
        setLibroError('Error al buscar libro');
      }
    }, 250);
  };

  // Modal nuevo
  const openModal = () => {
    setForm({ ...EMPTY_FORM, fecha_inicio: today });
    setUsuarioPreview(null);
    setLibroPreview(null);
    setUsuarioError('');
    setLibroError('');
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!usuarioPreview) return setError('Introduce un código de usuario válido (U_0000)');
    if (!libroPreview) return setError('Introduce un código de libro válido (COL-0000)');
    if (libroPreview.estado !== 'disponible')
      return setError(`El libro no está disponible (estado: ${libroPreview.estado})`);
    try {
      await api.post('/prestamos', {
        id_usuario: usuarioPreview.id,
        id_libro: libroPreview.id,
        fecha_inicio: form.fecha_inicio,
        fecha_devolucion_prevista: form.fecha_devolucion_prevista,
      });
      setModal(false);
      showToast('Préstamo creado correctamente');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear préstamo');
    }
  };

  // Modal editar
  const openEdit = (p) => {
    setEditId(p.id);
    setEditForm({
      fecha_inicio: p.fecha_inicio || '',
      fecha_devolucion_prevista: p.fecha_devolucion_prevista || '',
      fecha_devolucion_real: p.fecha_devolucion_real || '',
      devuelto: !!p.devuelto,
    });
    setEditError('');
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put(`/prestamos/${editId}`, editForm);
      setEditModal(false);
      showToast('Préstamo actualizado correctamente');
      load();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Error al editar préstamo');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este préstamo? Esta acción no se puede deshacer.'))
      return;
    try {
      await api.delete(`/prestamos/${id}`);
      showToast('Préstamo eliminado');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar préstamo');
    }
  };

  const handleDevolver = async (id) => {
    if (!confirm('¿Registrar devolución?')) return;
    await api.put(`/prestamos/${id}/devolver`, {
      fecha_devolucion_real: today,
    });
    showToast('Devolución registrada');
    load();
  };

  const { toast, showToast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Préstamos</h1>
        <button
          onClick={openModal}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nuevo préstamo
        </button>
      </div>

      {/* Pills de estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { v: 'activos',   l: 'Activos',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
          { v: 'vencidos',  l: 'Vencidos',  color: 'bg-red-100 text-red-700 border-red-200' },
          { v: 'devueltos', l: 'Devueltos', color: 'bg-green-100 text-green-700 border-green-200' },
          { v: '',          l: 'Todos',     color: 'bg-gray-100 text-gray-600 border-gray-200' },
        ].map(({ v, l, color }) => (
          <button
            key={v}
            onClick={() => { setFiltroEstado(v); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroEstado === v
                ? color + ' font-semibold'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {l}
            {v === 'activos'   && <span className="ml-1.5 text-xs opacity-70">{prestamos.filter(p => !p.devuelto && !vencido(p)).length}</span>}
            {v === 'vencidos'  && <span className="ml-1.5 text-xs opacity-70">{prestamos.filter(vencido).length}</span>}
            {v === 'devueltos' && <span className="ml-1.5 text-xs opacity-70">{prestamos.filter(p => p.devuelto).length}</span>}
            {v === ''          && <span className="ml-1.5 text-xs opacity-70">{prestamos.length}</span>}
          </button>
        ))}
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              placeholder="Buscar por nombre, apellidos o título del libro..."
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
            <button onClick={limpiarFiltros} className="text-sm text-brand-600 hover:underline whitespace-nowrap">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filtroMes}
            onChange={(e) => { setFiltroMes(e.target.value); setPage(1); }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroMes ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Todos los meses</option>
            {mesesDisponibles.map((m) => {
              const [y, mo] = m.split('-');
              const label = new Date(y, mo - 1).toLocaleString('es', { month: 'long', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length}{' '}
          {filtered.length === 1 ? 'préstamo encontrado' : 'préstamos encontrados'}
          {hayFiltros && ' con los filtros aplicados'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <Th col="usuario_apellidos">Usuario</Th>
              <Th col="libro_titulo">Libro</Th>
              <Th col="fecha_inicio">F. Inicio</Th>
              <Th col="fecha_devolucion_prevista">F. Dev. prevista</Th>
              <Th col="fecha_devolucion_real">F. Dev. real</Th>
              <Th col="devuelto">Devuelto</Th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 ${vencido(p) ? 'bg-red-50' : ''}`}
              >
                <td className="px-4 py-3">
                  {p.usuario_nombre} {p.usuario_apellidos}
                </td>
                <td className="px-4 py-3">{p.libro_titulo}</td>
                <td className="px-4 py-3">{fmt(p.fecha_inicio)}</td>
                <td className="px-4 py-3">
                  {p.fecha_devolucion_prevista ? (
                    <span
                      className={vencido(p) ? 'text-red-600 font-semibold' : ''}
                    >
                      {fmt(p.fecha_devolucion_prevista)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">{fmt(p.fecha_devolucion_real)}</td>
                <td className="px-4 py-3">
                  {p.devuelto ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Sí
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  {!p.devuelto && (
                    <button
                      onClick={() => handleDevolver(p.id)}
                      className="text-green-600 hover:underline text-xs"
                    >
                      Devolver
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(p)}
                    className="text-brand-600 hover:underline text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!pagina.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Sin préstamos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            {sorted.length} préstamos — página {page} de {totalPages}
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

      {/* Modal nuevo préstamo */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Nuevo préstamo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario QR */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código QR usuario <span className="text-gray-400">(U_0000)</span>
                </label>
                <input
                  placeholder="U_0017"
                  value={form.qrUsuario}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    set('qrUsuario', v);
                    resolveUsuario(v);
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${usuarioError ? 'border-red-400' : usuarioPreview ? 'border-green-400' : 'border-gray-300'}`}
                />
                {usuarioError && <p className="text-red-500 text-xs mt-1">{usuarioError}</p>}
                {usuarioPreview && (
                  <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span className="font-medium">{usuarioPreview.nombre} {usuarioPreview.apellidos}</span>
                    <span className="text-gray-400 text-xs ml-auto">{usuarioPreview.rol}</span>
                  </div>
                )}
              </div>

              {/* Libro QR */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código QR libro <span className="text-gray-400">(COL-0000)</span>
                </label>
                <input
                  placeholder="COL-0042"
                  value={form.qrLibro}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    set('qrLibro', v);
                    resolveLibro(v);
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${libroError ? 'border-red-400' : libroPreview ? 'border-green-400' : 'border-gray-300'}`}
                />
                {libroError && <p className="text-red-500 text-xs mt-1">{libroError}</p>}
                {libroPreview && (
                  <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${libroPreview.estado === 'disponible' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}>
                    <span className={libroPreview.estado === 'disponible' ? 'text-green-600' : 'text-yellow-600'}>
                      {libroPreview.estado === 'disponible' ? '✓' : '⚠'}
                    </span>
                    <span className="font-medium truncate">{libroPreview.titulo}</span>
                    <span className="text-gray-400 text-xs ml-auto shrink-0">{libroPreview.estado}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dev. prevista
                  </label>
                  <input
                    type="date"
                    value={form.fecha_devolucion_prevista}
                    onChange={(e) =>
                      set('fecha_devolucion_prevista', e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
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
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Editar préstamo</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.fecha_inicio}
                    onChange={(e) => setE('fecha_inicio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dev. prevista
                  </label>
                  <input
                    type="date"
                    value={editForm.fecha_devolucion_prevista}
                    onChange={(e) =>
                      setE('fecha_devolucion_prevista', e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dev. real
                </label>
                <input
                  type="date"
                  value={editForm.fecha_devolucion_real}
                  onChange={(e) =>
                    setE('fecha_devolucion_real', e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="devuelto"
                  checked={editForm.devuelto}
                  onChange={(e) => setE('devuelto', e.target.checked)}
                  className="accent-brand-600"
                />
                <label htmlFor="devuelto" className="text-sm text-gray-700">
                  Devuelto
                </label>
              </div>
              {editError && <p className="text-red-500 text-sm">{editError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
}

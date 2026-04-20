import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { fmt } from '../utils/dates';

const EMPTY_FORM = {
  id_usuario: '',
  id_libro: '',
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
  const [filtro, setFiltro] = useState('0');

  // Buscador
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroVencido, setFiltroVencido] = useState('');
  const debounceRef = useRef(null);

  // Ordenación y paginación
  const [sortCol, setSortCol] = useState('fecha_inicio');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  // Modal nuevo préstamo
  const [modal, setModal] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // Modal editar
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    const { data } = await api.get(`/prestamos?devuelto=${filtro}`);
    setPrestamos(data);
    setPage(1);
  };

  useEffect(() => {
    load();
  }, [filtro]);

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

  // Filtrado client-side
  const filtered = prestamos.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        p.usuario_nombre?.toLowerCase().includes(q) ||
        p.usuario_apellidos?.toLowerCase().includes(q) ||
        p.libro_titulo?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filtroVencido === 'si' && !vencido(p)) return false;
    if (filtroVencido === 'no' && vencido(p)) return false;
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

  const hayFiltros = searchInput || filtroVencido;
  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroVencido('');
    setPage(1);
  };

  // Modal nuevo
  const openModal = async () => {
    const [u, l] = await Promise.all([
      api.get('/usuarios'),
      api.get('/libros?estado=disponible'),
    ]);
    setUsuarios(u.data);
    setLibros(l.data);
    setForm({ ...EMPTY_FORM, fecha_inicio: today });
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/prestamos', form);
      setModal(false);
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
    load();
  };

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

      {/* Tabs devuelto */}
      <div className="flex gap-2 mb-4">
        {[
          ['0', 'Activos'],
          ['1', 'Devueltos'],
          ['', 'Todos'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFiltro(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtro === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
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
            value={filtroVencido}
            onChange={(e) => {
              setFiltroVencido(e.target.value);
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroVencido ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Filtro de vencimiento</option>
            <option value="si">Vencido</option>
            <option value="no">No vencido</option>
          </select>
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'préstamo encontrado'
            : 'préstamos encontrados'}
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
                    <span className={vencido(p) ? 'text-red-600 font-semibold' : ''}>
                      {fmt(p.fecha_devolucion_prevista)}
                    </span>
                  ) : '—'}
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Usuario *
                </label>
                <select
                  required
                  value={form.id_usuario}
                  onChange={(e) => set('id_usuario', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— Selecciona —</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.apellidos}, {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Libro (disponibles) *
                </label>
                <select
                  required
                  value={form.id_libro}
                  onChange={(e) => set('id_libro', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">— Selecciona —</option>
                  {libros.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titulo} [{l.codigo}]
                    </option>
                  ))}
                </select>
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
    </div>
  );
}

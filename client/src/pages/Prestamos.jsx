import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Pencil,
  Trash2,
  Undo2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
} from 'lucide-react';
import api from '../services/api';
import { fmt } from '../utils/dates';
import Toast, { useToast } from '../components/Toast';
import { exportarCSV, ordenarPor, COLS_PRESTAMOS } from '../utils/csv';

const USR_RE = /^U_(\d+)$/i;
const COL_RE = /^L_(\d+)$/i;

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
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const debounceRef = useRef(null);

  // Ordenación y paginación
  const [sortCol, setSortCol] = useState('fecha_inicio');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

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
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null });
  const [seleccionados, setSeleccionados] = useState(new Set());
  const lastClickedRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const [usuariosGestion, setUsuariosGestion] = useState([]);

  const load = async () => {
    const { data } = await api.get('/prestamos');
    setPrestamos(data);
    setPage(1);
  };

  useEffect(() => {
    load();
    api.get('/usuarios').then(({ data }) => {
      setUsuariosGestion(
        data.filter(
          (u) => ['profesorado', 'personal'].includes(u.rol) && u.activo
        )
      );
    });
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
  const mesesDisponibles = [
    ...new Set(
      prestamos.map((p) => p.fecha_inicio?.slice(0, 7)).filter(Boolean)
    ),
  ]
    .sort()
    .reverse();

  // Filtrado client-side
  const filtered = prestamos.filter((p) => {
    if (filtroEstado === 'activos' && (p.devuelto || vencido(p))) return false;
    if (filtroEstado === 'vencidos' && !vencido(p)) return false;
    if (filtroEstado === 'devueltos' && !p.devuelto) return false;
    if (filtroMes && !p.fecha_inicio?.startsWith(filtroMes)) return false;
    if (filtroDesde && p.fecha_inicio < filtroDesde) return false;
    if (filtroHasta && p.fecha_inicio > filtroHasta) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches =
        p.codigo?.toLowerCase().includes(q) ||
        p.codigo_lote?.toLowerCase().includes(q) ||
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

  const hayFiltros = searchInput || filtroMes || filtroDesde || filtroHasta;
  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroMes('');
    setFiltroDesde('');
    setFiltroHasta('');
    setPage(1);
  };

  const resolveUsuario = (val) => {
    setUsuarioPreview(null);
    setUsuarioError('');
    clearTimeout(usrDebounce.current);
    const match = val.match(USR_RE);
    if (!match) {
      if (val) setUsuarioError('Formato inválido. Usa U_1');
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
      if (val) setLibroError('Formato inválido. Usa L_1');
      return;
    }
    const codigo = `L_${match[1]}`;
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
    if (!usuarioPreview)
      return setError('Introduce un código de usuario válido (U_1)');
    if (!libroPreview)
      return setError('Introduce un código de libro válido (L_1)');
    if (libroPreview.estado !== 'disponible')
      return setError(
        `El libro no está disponible (estado: ${libroPreview.estado})`
      );
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
      await api.put(`/prestamos/${editId}`, {
        ...editForm,
        devuelto: !!editForm.fecha_devolucion_real,
      });
      setEditModal(false);
      showToast('Préstamo actualizado correctamente');
      load();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Error al editar préstamo');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      message: '¿Eliminar este préstamo? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        try {
          await api.delete(`/prestamos/${id}`);
          showToast('Préstamo eliminado');
          load();
        } catch (err) {
          setConfirmModal({
            open: true,
            message: err.response?.data?.error || 'Error al eliminar préstamo',
            onConfirm: null,
          });
        }
      },
    });
  };

  const handleDevolver = (id) => {
    setConfirmModal({
      open: true,
      message: '¿Registrar devolución?',
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        await api.put(`/prestamos/${id}/devolver`, {
          fecha_devolucion_real: today,
        });
        showToast('Devolución registrada');
        load();
      },
    });
  };

  const toggleSeleccion = (id, index, shiftKey) => {
    const next = new Set(seleccionados);
    if (shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, index);
      const end = Math.max(lastClickedRef.current, index);
      const target = !seleccionados.has(id);
      pagina.slice(start, end + 1).forEach((item) => {
        target ? next.add(item.id) : next.delete(item.id);
      });
    } else {
      next.has(id) ? next.delete(id) : next.add(id);
    }
    lastClickedRef.current = index;
    setSeleccionados(next);
  };

  const toggleTodos = () => {
    const idsPagina = pagina.map((p) => p.id);
    const todosSeleccionados = idsPagina.every((id) => seleccionados.has(id));
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (todosSeleccionados) idsPagina.forEach((id) => next.delete(id));
      else idsPagina.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleEliminarMultiple = () => {
    const ids = [...seleccionados];
    setConfirmModal({
      open: true,
      message: `¿Eliminar ${ids.length} préstamo${ids.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        try {
          await api.post('/prestamos/eliminar-multiple', { ids });
          setSeleccionados(new Set());
          showToast(`${ids.length} préstamo${ids.length > 1 ? 's' : ''} eliminado${ids.length > 1 ? 's' : ''}`);
          load();
        } catch (err) {
          setConfirmModal({
            open: true,
            message: err.response?.data?.error || 'Error al eliminar',
            onConfirm: null,
          });
        }
      },
    });
  };

  // Modal préstamo múltiple (lote)
  const [modalLote, setModalLote] = useState(false);
  const [loteCantidad, setLoteCantidad] = useState('');
  const [loteUsuarioCod, setLoteUsuarioCod] = useState('');
  const [loteUsuario, setLoteUsuario] = useState(null);
  const [loteUsuarioError, setLoteUsuarioError] = useState('');
  const [loteLibros, setLoteLibros] = useState([
    { qr: '', preview: null, error: '' },
  ]);
  const [loteFechaInicio, setLoteFechaInicio] = useState('');
  const [loteFechaPrevista, setLoteFechaPrevista] = useState('');
  const [loteError, setLoteError] = useState('');
  const [loteLoading, setLoteLoading] = useState(false);
  const [loteResultado, setLoteResultado] = useState(null);
  const loteUsrDebounce = useRef(null);
  const loteColDebounces = useRef([]);

  const resolveLoteUsuario = (val) => {
    setLoteUsuario(null);
    setLoteUsuarioError('');
    clearTimeout(loteUsrDebounce.current);
    const match = val.match(USR_RE);
    if (!match) {
      if (val) setLoteUsuarioError('Formato inválido. Usa U_1');
      return;
    }
    const id = parseInt(match[1], 10);
    loteUsrDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/usuarios/${id}`);
        if (!['profesorado', 'personal'].includes(data.rol)) {
          setLoteUsuarioError('Solo profesorado o personal');
          return;
        }
        setLoteUsuario(data);
      } catch {
        setLoteUsuarioError('Usuario no encontrado');
      }
    }, 250);
  };

  const resolveLoteLibro = (idx, val) => {
    setLoteLibros((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], qr: val, preview: null, error: '' };
      return next;
    });
    clearTimeout(loteColDebounces.current[idx]);
    const match = val.match(COL_RE);
    if (!match) {
      if (val)
        setLoteLibros((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], error: 'Formato inválido. Usa L_1' };
          return next;
        });
      return;
    }
    const codigo = `L_${match[1]}`;
    loteColDebounces.current[idx] = setTimeout(async () => {
      try {
        const { data } = await api.get(`/libros?search=${codigo}`);
        const libro = data.find(
          (l) => l.codigo.toUpperCase() === codigo.toUpperCase()
        );
        if (!libro) {
          setLoteLibros((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], error: 'Libro no encontrado' };
            return next;
          });
        } else {
          setLoteLibros((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], preview: libro, error: '' };
            return next;
          });
        }
      } catch {
        setLoteLibros((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], error: 'Error al buscar libro' };
          return next;
        });
      }
    }, 250);
  };

  const openModalLote = () => {
    setLoteCantidad('');
    setLoteUsuarioCod('');
    setLoteUsuario(null);
    setLoteUsuarioError('');
    setLoteLibros([{ qr: '', preview: null, error: '' }]);
    setLoteFechaInicio(today);
    setLoteFechaPrevista('');
    setLoteError('');
    setLoteLoading(false);
    setLoteResultado(null);
    setModalLote(true);
  };

  const handleLoteCantidad = (val) => {
    const n = parseInt(val, 10);
    setLoteCantidad(val);
    if (!isNaN(n) && n >= 1 && n <= 50) {
      setLoteLibros(
        Array.from({ length: n }, () => ({ qr: '', preview: null, error: '' }))
      );
    }
  };

  const handleLoteSubmit = async (e) => {
    e.preventDefault();
    setLoteError('');
    if (!loteUsuario)
      return setLoteError('Introduce un código de usuario válido');
    const librosValidos = loteLibros.filter((l) => l.preview);
    if (!librosValidos.length)
      return setLoteError('Añade al menos un libro válido');
    const noDisponibles = librosValidos.filter(
      (l) => l.preview.estado !== 'disponible'
    );
    if (noDisponibles.length)
      return setLoteError(
        `Hay ${noDisponibles.length} libro${noDisponibles.length > 1 ? 's' : ''} no disponible${noDisponibles.length > 1 ? 's' : ''}. Elimínalos de la lista antes de continuar.`
      );
    setLoteLoading(true);
    try {
      const { data } = await api.post('/prestamos/lote', {
        codigo_usuario: loteUsuarioCod,
        ids_libros: librosValidos.map((l) => l.preview.id),
        fecha_inicio: loteFechaInicio,
        fecha_devolucion_prevista: loteFechaPrevista || undefined,
      });
      setLoteResultado(data);
      load();
    } catch (err) {
      setLoteError(
        err.response?.data?.error || 'Error al crear préstamo múltiple'
      );
      setLoteLoading(false);
    }
  };

  const { toast, showToast } = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Préstamos</h1>
        <div className="flex gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download size={15} />
              Exportar
              <ChevronDown
                size={13}
                className={`transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    exportarCSV(sorted, COLS_PRESTAMOS, 'prestamos_vista');
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download size={13} className="text-gray-400" />
                  Vista actual
                </button>
                <button
                  onClick={() => {
                    exportarCSV(
                      ordenarPor(prestamos, 'fecha_devolucion_prevista'),
                      COLS_PRESTAMOS,
                      'prestamos_todos'
                    );
                    setExportMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download size={13} className="text-gray-400" />
                  Todo el listado
                </button>
              </div>
            )}
          </div>
          <button
            onClick={openModalLote}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nuevo préstamo múltiple
          </button>
          <button
            onClick={openModal}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nuevo préstamo individual
          </button>
        </div>
      </div>

      {/* Pills de estado */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          {
            v: 'activos',
            l: 'Activos',
            color: 'bg-blue-100 text-blue-700 border-blue-200',
          },
          {
            v: 'vencidos',
            l: 'Vencidos',
            color: 'bg-red-100 text-red-700 border-red-200',
          },
          {
            v: 'devueltos',
            l: 'Devueltos',
            color: 'bg-green-100 text-green-700 border-green-200',
          },
          {
            v: '',
            l: 'Todos',
            color: 'bg-gray-100 text-gray-600 border-gray-200',
          },
        ].map(({ v, l, color }) => (
          <button
            key={v}
            onClick={() => {
              setFiltroEstado(v);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroEstado === v
                ? color + ' font-semibold'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {l}
            {v === 'activos' && (
              <span className="ml-1.5 text-xs opacity-70">
                {prestamos.filter((p) => !p.devuelto && !vencido(p)).length}
              </span>
            )}
            {v === 'vencidos' && (
              <span className="ml-1.5 text-xs opacity-70">
                {prestamos.filter(vencido).length}
              </span>
            )}
            {v === 'devueltos' && (
              <span className="ml-1.5 text-xs opacity-70">
                {prestamos.filter((p) => p.devuelto).length}
              </span>
            )}
            {v === '' && (
              <span className="ml-1.5 text-xs opacity-70">
                {prestamos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Buscador y filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Buscar por código de prestamo, codigo de lote, nombre, apellidos o título del libro..."
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

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filtroMes}
            onChange={(e) => {
              setFiltroMes(e.target.value);
              setFiltroDesde('');
              setFiltroHasta('');
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroMes ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Mes</option>
            {mesesDisponibles.map((m) => {
              const [y, mo] = m.split('-');
              const label = new Date(y, mo - 1).toLocaleString('es', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>

          <span className="text-xs text-gray-400">o rango:</span>

          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => {
              setFiltroDesde(e.target.value);
              setFiltroMes('');
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroDesde ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          />
          <span className="text-xs text-gray-400">hasta</span>
          <input
            type="date"
            value={filtroHasta}
            min={filtroDesde || undefined}
            onChange={(e) => {
              setFiltroHasta(e.target.value);
              setFiltroMes('');
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroHasta ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          />
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'préstamo encontrado'
            : 'préstamos encontrados'}
          {hayFiltros && ' con los filtros aplicados'}
        </p>
      </div>

      {seleccionados.size > 0 && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm text-brand-700 font-medium">{seleccionados.size} préstamo{seleccionados.size > 1 ? 's' : ''} seleccionado{seleccionados.size > 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => setSeleccionados(new Set())} className="text-xs text-gray-500 hover:text-gray-700">Deseleccionar todo</button>
            <button onClick={handleEliminarMultiple} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg">
              <Trash2 size={12} /> Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={pagina.length > 0 && pagina.every((p) => seleccionados.has(p.id))}
                  onChange={toggleTodos}
                  className="cursor-pointer"
                />
              </th>
              <Th col="codigo">Código</Th>
              <Th col="codigo_lote">Lote</Th>
              <Th col="usuario_apellidos">Usuario</Th>
              <Th col="libro_titulo">Libro</Th>
              <Th col="libro_codigo">Código Libro</Th>
              <Th col="fecha_inicio">F. Inicio</Th>
              <Th col="fecha_devolucion_prevista">F. Dev. prevista</Th>
              <Th col="fecha_devolucion_real">F. Dev. real</Th>
              <Th col="devuelto">Devuelto</Th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina.map((p, idx) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 ${seleccionados.has(p.id) ? 'bg-brand-50' : vencido(p) ? 'bg-red-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={seleccionados.has(p.id)}
                    onChange={() => {}}
                    onClick={(e) => toggleSeleccion(p.id, idx, e.shiftKey)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs tracking-widest text-gray-500">
                  {p.codigo || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">
                  {p.codigo_lote || '—'}
                </td>
                <td className="px-4 py-3">
                  {p.usuario_nombre} {p.usuario_apellidos}
                </td>
                <td className="px-4 py-3">{p.libro_titulo}</td>
                <td className="px-4 py-3">{p.libro_codigo || '—'}</td>
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
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {!p.devuelto && (
                      <button
                        onClick={() => handleDevolver(p.id)}
                        title="Registrar devolución"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <Undo2 size={12} />
                        Devolver
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(p)}
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
            {!pagina.length && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
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
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
              <h2 className="text-lg font-medium">Nuevo préstamo</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario QR */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código QR usuario <span className="text-gray-400">(U_1)</span>
                </label>
                <input
                  placeholder="U_3"
                  value={form.qrUsuario}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    set('qrUsuario', v);
                    resolveUsuario(v);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${usuarioError ? 'border-red-400' : usuarioPreview ? 'border-green-400' : 'border-gray-300'}`}
                />
                {usuarioError && (
                  <p className="text-red-500 text-xs mt-1">{usuarioError}</p>
                )}
                {usuarioPreview && (
                  <div
                    className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${usuarioPreview.activo ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-300'}`}
                  >
                    <span
                      className={
                        usuarioPreview.activo
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }
                    >
                      {usuarioPreview.activo ? '✓' : '✗'}
                    </span>
                    <span className="font-medium">
                      {usuarioPreview.nombre} {usuarioPreview.apellidos}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {usuarioPreview.activo ? usuarioPreview.rol : 'inactivo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Libro QR */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Código QR libro <span className="text-gray-400">(L_1)</span>
                </label>
                <input
                  placeholder="L_42"
                  value={form.qrLibro}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    set('qrLibro', v);
                    resolveLibro(v);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${libroError ? 'border-red-400' : libroPreview ? 'border-green-400' : 'border-gray-300'}`}
                />
                {libroError && (
                  <p className="text-red-500 text-xs mt-1">{libroError}</p>
                )}
                {libroPreview && (
                  <div
                    className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${libroPreview.estado === 'disponible' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}
                  >
                    <span
                      className={
                        libroPreview.estado === 'disponible'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }
                    >
                      {libroPreview.estado === 'disponible' ? '✓' : '⚠'}
                    </span>
                    <span className="font-medium truncate">
                      {libroPreview.titulo}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto shrink-0">
                      {libroPreview.estado}
                    </span>
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
                    min={today}
                    value={form.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dev. prevista *
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
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
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
              <h2 className="text-lg font-bold">Editar préstamo</h2>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
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
                    min={today}
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
              {editForm.fecha_devolucion_real && (
                <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  Al guardar el préstamo se marcará como devuelto
                  automáticamente.
                </p>
              )}
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
      {/* Modal préstamo múltiple */}
      {modalLote && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            {loteResultado ? (
              <>
                <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
                  <h2 className="text-lg font-bold">Lote creado</h2>
                  <p className="text-sm text-white/70 font-mono mt-0.5">
                    {loteResultado.lote}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {loteResultado.creados.length} préstamo
                  {loteResultado.creados.length !== 1 && 's'} registrado
                  {loteResultado.creados.length !== 1 && 's'}:
                </p>
                <ul className="space-y-1 mb-4">
                  {loteResultado.creados.map((c) => (
                    <li
                      key={c.id}
                      className="text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-1.5 flex items-center gap-2"
                    >
                      <span className="text-green-600">✓</span>
                      <span className="font-medium truncate">{c.titulo}</span>
                      <span className="text-gray-400 text-xs ml-auto font-mono">
                        {c.codigo}
                      </span>
                    </li>
                  ))}
                </ul>
                {loteResultado.noDisponibles.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      {loteResultado.noDisponibles.length} libro
                      {loteResultado.noDisponibles.length !== 1 && 's'} no
                      disponible
                      {loteResultado.noDisponibles.length !== 1 && 's'}:
                    </p>
                    <ul className="space-y-1 mb-4">
                      {loteResultado.noDisponibles.map((n, i) => (
                        <li
                          key={i}
                          className="text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 flex items-center gap-2"
                        >
                          <span className="text-amber-600">⚠</span>
                          <span className="truncate">{n.titulo}</span>
                          <span className="text-gray-400 text-xs ml-auto">
                            {n.estado}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setModalLote(false)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
                  <h2 className="text-lg font-bold">Préstamo múltiple</h2>
                </div>
                <form onSubmit={handleLoteSubmit} className="space-y-4">
                  {/* Cantidad */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Número de libros
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="Ej: 5"
                      value={loteCantidad}
                      onChange={(e) => handleLoteCantidad(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  {/* Usuario */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Usuario
                    </label>
                    <select
                      value={loteUsuarioCod}
                      onChange={(e) => {
                        const cod = e.target.value;
                        setLoteUsuarioCod(cod);
                        const u = usuariosGestion.find((u) => u.codigo === cod);
                        setLoteUsuario(u || null);
                        setLoteUsuarioError('');
                      }}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${loteUsuarioError ? 'border-red-400' : loteUsuario ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {['profesorado', 'personal'].map((rol) => {
                        const grupo = usuariosGestion.filter(
                          (u) => u.rol === rol
                        );
                        if (!grupo.length) return null;
                        return (
                          <optgroup
                            key={rol}
                            label={
                              rol === 'profesorado' ? 'Profesorado' : 'Personal'
                            }
                          >
                            {grupo.map((u) => (
                              <option key={u.id} value={u.codigo}>
                                {u.apellidos}, {u.nombre} · {u.codigo}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    {loteUsuarioError && (
                      <p className="text-red-500 text-xs mt-1">
                        {loteUsuarioError}
                      </p>
                    )}
                  </div>

                  {/* Libros dinámicos */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Código QR libros{' '}
                      <span className="text-gray-400">(L_1)</span>
                    </label>
                    <div className="space-y-2">
                      {loteLibros.map((lb, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {/* Número */}
                          <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                            {idx + 1}
                          </span>
                          {/* Input con X dentro */}
                          <div className="relative w-32 min-w-0">
                            <input
                              placeholder={`L_${idx + 1}`}
                              value={lb.qr}
                              onChange={(e) =>
                                resolveLoteLibro(
                                  idx,
                                  e.target.value.toUpperCase()
                                )
                              }
                              onKeyDown={(e) =>
                                e.key === 'Enter' && e.preventDefault()
                              }
                              className={`w-full border rounded-lg pl-3 pr-7 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 ${lb.error ? 'border-red-400' : lb.preview ? (lb.preview.estado === 'disponible' ? 'border-green-400' : 'border-yellow-400') : 'border-gray-300'}`}
                            />
                            {loteLibros.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setLoteLibros((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 text-base leading-none"
                                title="Quitar libro"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {/* Preview a la derecha */}
                          <div className="flex-1 min-w-0">
                            {lb.error && (
                              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border bg-red-50 border-red-200">
                                <span className="text-red-500 shrink-0">✗</span>
                                <span className="font-medium text-red-600 truncate">
                                  {lb.error}
                                </span>
                              </div>
                            )}
                            {lb.preview && !lb.error && (
                              <div
                                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border ${lb.preview.estado === 'disponible' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-300'}`}
                              >
                                <span
                                  className={
                                    lb.preview.estado === 'disponible'
                                      ? 'text-green-600 shrink-0'
                                      : 'text-yellow-600 shrink-0'
                                  }
                                >
                                  {lb.preview.estado === 'disponible'
                                    ? '✓'
                                    : '⚠'}
                                </span>
                                <span className="font-medium truncate">
                                  {lb.preview.titulo}
                                </span>
                                <span className="text-gray-400 text-xs ml-auto shrink-0">
                                  {lb.preview.estado}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLoteLibros((prev) => [
                          ...prev,
                          { qr: '', preview: null, error: '' },
                        ])
                      }
                      className="mt-2 text-sm text-brand-600 hover:underline"
                    >
                      + Añadir libro
                    </button>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fecha inicio *
                      </label>
                      <input
                        type="date"
                        min={today}
                        required
                        value={loteFechaInicio}
                        onChange={(e) => setLoteFechaInicio(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Dev. prevista
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={loteFechaPrevista}
                        onChange={(e) => setLoteFechaPrevista(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  {loteError && (
                    <p className="text-red-500 text-sm">{loteError}</p>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalLote(false)}
                      className="px-4 py-2 text-sm text-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loteLoading}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm rounded-lg"
                    >
                      {loteLoading ? 'Creando…' : 'Crear lote'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <p className="text-gray-800 font-medium text-center whitespace-pre-line">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              {confirmModal.onConfirm ? (
                <>
                  <button
                    onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
                    className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
                  className="px-5 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ImagePlus,
  X,
  Download,
} from 'lucide-react';
import api from '../services/api';
import { fmt } from '../utils/dates';
import Toast, { useToast } from '../components/Toast';
import { exportarCSV, COLS_ACTIVIDADES } from '../utils/csv';

const TIPOS = [
  { value: 'PYP', label: 'Actividad PYP' },
  { value: 'escritura_creativa', label: 'Escritura creativa' },
  { value: 'indagacion_libre', label: 'Indagación libre' },
  { value: 'taller_lectura', label: 'Taller de lectura' },
  { value: 'charla', label: 'Charla' },
  { value: 'otro', label: 'Otro' },
];

const PYP_SUBTIPOS = [
  'Cómo funciona el mundo',
  'Quiénes somos',
  'Cómo nos organizamos',
  'Cómo nos expresamos',
  'Dónde estamos en tiempo y lugar',
  'Cómo compartimos el planeta',
];

const DESTINATARIOS = [
  { value: 'curso', label: 'Curso' },
  { value: 'profes', label: 'Profesorado' },
  { value: 'familias', label: 'Familias' },
];

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

const EMPTY_FORM = {
  nombre: '',
  fecha: '',
  tipo: '',
  subtipo: '',
  idioma: '',
  objetivos: '',
  duracion: '',
  destinatario: '',
  curso_destinatario: '',
  reflexiones: '',
};

function duracionLabel(val) {
  if (!val) return '—';
  const parts = val.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return '—';
}

function tipoLabel(tipo, subtipo) {
  const base = TIPOS.find((t) => t.value === tipo)?.label ?? tipo;
  if (!subtipo) return base;
  if (tipo === 'PYP') return `PYP · ${subtipo}`;
  if (tipo === 'otro') return `Otro · ${subtipo}`;
  return base;
}

function destinatarioLabel(dest, curso) {
  if (dest === 'curso' && curso) return `${curso}`;
  return DESTINATARIOS.find((d) => d.value === dest)?.label ?? dest;
}

const PAGE_SIZE = 50;
const today = new Date().toISOString().split('T')[0];

// ── Formulario ──────────────────────────────────────────────────────────────
function FormFields({ values, onChange, error, isEdit = false }) {
  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre *
        </label>
        <input
          required
          value={values.nombre}
          onChange={(e) => onChange('nombre', e.target.value)}
          placeholder="Nombre de la actividad"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Fecha + Duración */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fecha *
          </label>
          <input
            type="date"
            required
            min={today}
            value={values.fecha}
            onChange={(e) => onChange('fecha', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Duración
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="23"
              placeholder="0"
              value={
                values.duracion
                  ? parseInt(values.duracion.split(':')[0], 10)
                  : ''
              }
              onChange={(e) => {
                const h =
                  e.target.value === ''
                    ? '00'
                    : String(e.target.value).padStart(2, '0');
                const m = values.duracion
                  ? (values.duracion.split(':')[1] ?? '00')
                  : '00';
                onChange('duracion', `${h}:${m}`);
              }}
              className="w-14 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-400">h</span>
            <input
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={
                values.duracion
                  ? parseInt(values.duracion.split(':')[1], 10)
                  : ''
              }
              onChange={(e) => {
                const h = values.duracion
                  ? (values.duracion.split(':')[0] ?? '00')
                  : '00';
                const m =
                  e.target.value === ''
                    ? '00'
                    : String(e.target.value).padStart(2, '0');
                onChange('duracion', `${h}:${m}`);
              }}
              className="w-14 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-400">min</span>
          </div>
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Tipo *
        </label>
        <select
          required
          value={values.tipo}
          onChange={(e) => {
            onChange('tipo', e.target.value);
            onChange('subtipo', '');
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Seleccionar...</option>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subtipo PYP */}
      {values.tipo === 'PYP' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Línea de indagación *
          </label>
          <select
            required
            value={values.subtipo}
            onChange={(e) => onChange('subtipo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar...</option>
            {PYP_SUBTIPOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subtipo Otro */}
      {values.tipo === 'otro' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Especifica tipo *
          </label>
          <input
            required
            value={values.subtipo}
            onChange={(e) => onChange('subtipo', e.target.value)}
            placeholder="Describe el tipo de actividad"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      {/* Idioma */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Idioma
        </label>
        <input
          value={values.idioma}
          onChange={(e) => onChange('idioma', e.target.value)}
          placeholder="Español, Inglés..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Objetivos */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Objetivos
        </label>
        <textarea
          rows={3}
          value={values.objetivos}
          onChange={(e) => onChange('objetivos', e.target.value)}
          placeholder="Objetivos de la actividad..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      {/* Destinatario */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Destinatario *
        </label>
        <select
          required
          value={values.destinatario}
          onChange={(e) => {
            onChange('destinatario', e.target.value);
            onChange('curso_destinatario', '');
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Seleccionar...</option>
          {DESTINATARIOS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Curso específico */}
      {values.destinatario === 'curso' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Curso *
          </label>
          <select
            required
            value={values.curso_destinatario}
            onChange={(e) => onChange('curso_destinatario', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar curso...</option>
            {CURSOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reflexiones — solo en edición */}
      {isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Reflexiones
          </label>
          <textarea
            rows={3}
            value={values.reflexiones}
            onChange={(e) => onChange('reflexiones', e.target.value)}
            placeholder="Reflexiones tras la actividad..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Actividades() {
  const [actividades, setActividades] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDestinatario, setFiltroDestinatario] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const debounceRef = useRef(null);

  const [sortCol, setSortCol] = useState('fecha');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Modal crear
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal editar
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editFotos, setEditFotos] = useState([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef(null);

  // Modal fotos (vista)
  const [fotosModal, setFotosModal] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const { toast, showToast } = useToast();

  const load = async () => {
    const { data } = await api.get('/actividades');
    setActividades(data);
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

  // Filtrado
  const filtered = actividades.filter((a) => {
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    if (filtroDestinatario && a.destinatario !== filtroDestinatario)
      return false;
    if (filtroDesde && a.fecha < filtroDesde) return false;
    if (filtroHasta && a.fecha > filtroHasta) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.nombre?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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

  const hayFiltros =
    searchInput ||
    filtroTipo ||
    filtroDestinatario ||
    filtroDesde ||
    filtroHasta;
  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroTipo('');
    setFiltroDestinatario('');
    setFiltroDesde('');
    setFiltroHasta('');
    setPage(1);
  };

  // Crear
  const openModal = () => {
    setForm({ ...EMPTY_FORM, fecha: new Date().toISOString().split('T')[0] });
    setFormError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/actividades', form);
      setModal(false);
      showToast('Actividad creada correctamente');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear actividad');
    } finally {
      setSaving(false);
    }
  };

  // Editar
  const openEdit = (a) => {
    setEditId(a.id);
    setEditForm({
      nombre: a.nombre || '',
      fecha: a.fecha || '',
      tipo: a.tipo || '',
      subtipo: a.subtipo || '',
      idioma: a.idioma || '',
      objetivos: a.objetivos || '',
      duracion: a.duracion ? a.duracion.slice(0, 5) : '',
      destinatario: a.destinatario || '',
      curso_destinatario: a.curso_destinatario || '',
      reflexiones: a.reflexiones || '',
    });
    setEditFotos(a.fotos || []);
    setEditError('');
    setEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSaving(true);
    try {
      const { data } = await api.put(`/actividades/${editId}`, editForm);
      setActividades((prev) => prev.map((a) => (a.id === editId ? data : a)));
      setEditModal(false);
      showToast('Actividad actualizada');
    } catch (err) {
      setEditError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta actividad? Se borrarán también sus fotos.'))
      return;
    try {
      await api.delete(`/actividades/${id}`);
      showToast('Actividad eliminada');
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  // Fotos
  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append('foto', file);
      const { data } = await api.post(`/actividades/${editId}/fotos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditFotos((prev) => [...prev, data]);
      setActividades((prev) =>
        prev.map((a) =>
          a.id === editId ? { ...a, fotos: [...(a.fotos || []), data] } : a
        )
      );
      showToast('Foto añadida');
    } catch {
      alert('Error al subir la foto');
    } finally {
      setUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleDeleteFoto = async (fotoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await api.delete(`/actividades/${editId}/fotos/${fotoId}`);
      setEditFotos((prev) => prev.filter((f) => f.id !== fotoId));
      setActividades((prev) =>
        prev.map((a) =>
          a.id === editId
            ? { ...a, fotos: a.fotos.filter((f) => f.id !== fotoId) }
            : a
        )
      );
      showToast('Foto eliminada');
    } catch {
      alert('Error al eliminar la foto');
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Actividades</h1>
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
                    exportarCSV(sorted, COLS_ACTIVIDADES, 'actividades_vista');
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
                      [...actividades].sort((a, b) =>
                        (b.fecha ?? '').localeCompare(a.fecha ?? '')
                      ),
                      COLS_ACTIVIDADES,
                      'actividades_todas'
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
            onClick={openModal}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nueva actividad
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Buscar por nombre"
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
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroTipo ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Tipo</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={filtroDestinatario}
            onChange={(e) => {
              setFiltroDestinatario(e.target.value);
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroDestinatario ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Destinatario</option>
            {DESTINATARIOS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-400">Fecha:</span>
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => {
              setFiltroDesde(e.target.value);
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
              setPage(1);
            }}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroHasta ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          />
        </div>

        <p className="text-xs text-gray-400">
          {filtered.length}{' '}
          {filtered.length === 1
            ? 'actividad encontrada'
            : 'actividades encontradas'}
          {hayFiltros && ' con los filtros aplicados'}
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <Th col="nombre">Nombre</Th>
              <Th col="fecha">Fecha</Th>
              <Th col="tipo">Tipo</Th>
              <Th col="idioma">Idioma</Th>
              <Th col="duracion">Duración</Th>
              <Th col="destinatario">Destinatario</Th>
              <th className="px-4 py-3 text-left whitespace-nowrap">Fotos</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina.map((a) => (
              <tr
                key={a.id}
                onClick={() => setFotosModal(a)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium max-w-xs">
                  <div className="truncate">{a.nombre}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{fmt(a.fecha)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap">
                    {tipoLabel(a.tipo, a.subtipo)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.idioma || '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {duracionLabel(a.duracion)}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                    {destinatarioLabel(a.destinatario, a.curso_destinatario)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.fotos?.length > 0 ? (
                    <span className="text-gray-600 text-xs">
                      {a.fotos.length} foto{a.fotos.length !== 1 && 's'}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(a)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!pagina.length && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Sin actividades
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
            {sorted.length} actividades — página {page} de {totalPages}
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

      {/* Modal crear */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
              <h2 className="text-lg font-bold">Nueva actividad</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <FormFields values={form} onChange={set} error={formError} />
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {saving ? 'Guardando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
              <h2 className="text-lg font-bold">Editar actividad</h2>
            </div>
            <form onSubmit={handleEdit}>
              <FormFields
                values={editForm}
                onChange={setE}
                error={editError}
                isEdit
              />

              {/* Fotos */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Fotos
                  </p>
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={uploadingFoto}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium disabled:opacity-50"
                  >
                    <ImagePlus size={14} />
                    {uploadingFoto ? 'Subiendo…' : 'Añadir foto'}
                  </button>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadFoto}
                  />
                </div>
                {editFotos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Sin fotos — pulsa «Añadir foto» para subir
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {editFotos.map((f) => (
                      <div key={f.id} className="relative group">
                        <img
                          src={`/uploads/${f.nombre_foto}`}
                          alt=""
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFoto(f.id)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {editSaving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal visor de fotos */}
      {fotosModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setFotosModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{fotosModal.nombre}</h2>
                  <p className="text-xs text-white/70 mt-0.5">
                    {fmt(fotosModal.fecha)}
                    {' · '}
                    {tipoLabel(fotosModal.tipo, fotosModal.subtipo)}
                    {' · '}
                    {destinatarioLabel(
                      fotosModal.destinatario,
                      fotosModal.curso_destinatario
                    )}
                    {fotosModal.idioma && ` · ${fotosModal.idioma}`}
                    {fotosModal.duracion &&
                      ` · ${duracionLabel(fotosModal.duracion)}`}
                  </p>
                </div>
                <button
                  onClick={() => setFotosModal(null)}
                  className="text-white/70 hover:text-white ml-4 flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {fotosModal.objetivos && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Objetivos
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {fotosModal.objetivos}
                </p>
              </div>
            )}
            {fotosModal.reflexiones && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Reflexiones
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {fotosModal.reflexiones}
                </p>
              </div>
            )}

            <div className="mt-4 border-t border-gray-100 pt-4">
              {!fotosModal.fotos?.length ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Sin fotos
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {fotosModal.fotos.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setLightbox(`/uploads/${f.nombre_foto}`)}
                      className="block w-full aspect-square overflow-hidden rounded-lg focus:outline-none"
                    >
                      <img
                        src={`/uploads/${f.nombre_foto}`}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={28} />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

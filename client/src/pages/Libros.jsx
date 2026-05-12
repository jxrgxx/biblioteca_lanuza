import { useEffect, useState, useRef } from 'react';
import {
  Search,
  Pencil,
  Trash2,
  Printer,
  Tag,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Upload,
} from 'lucide-react';
import api from '../services/api';
import Toast, { useToast } from '../components/Toast';
import EtiquetasImpresion from '../components/EtiquetasImpresion';
import { exportarCSV, ordenarPor, COLS_LIBROS } from '../utils/csv';
import { QRCodeSVG } from 'qrcode.react';

const ESTADOS = ['disponible', 'prestado', 'extraviado', 'no disponible'];

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
  titulo: '',
  autor: '',
  editorial: '',
  volumen: '',
  idioma: '',
  genero: '',
  categoria: '',
  estanteria: '',
  estado: 'disponible',
  nombre_foto: '',
};

const estadoBadge = {
  disponible: 'bg-green-100 text-green-700',
  prestado: 'bg-yellow-100 text-yellow-700',
  extraviado: 'bg-red-100 text-red-700',
  'no disponible': 'bg-gray-100 text-gray-600',
};

const PAGE_SIZE = 50;

export default function Libros() {
  const [libros, setLibros] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroIdioma, setFiltroIdioma] = useState('');
  const [filtroEditorial, setFiltroEditorial] = useState('');
  const [filtroEstanteria, setFiltroEstanteria] = useState('');
  const [filtroEtiquetado, setFiltroEtiquetado] = useState('');
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('titulo');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fotoFile, setFotoFile] = useState(null);
  const [error, setError] = useState('');
  const { toast, showToast } = useToast();

  const [generos, setGeneros] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [estanterias, setEstanterias] = useState([]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const [fotoModal, setFotoModal] = useState(null);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const lastClickedRef = useRef(null);
  const [imprimiendo, setImprimiendo] = useState(false);

  const [modalImportar, setModalImportar] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importEstanteria, setImportEstanteria] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [importLoading, setImportLoading] = useState(false); // libro seleccionado para ver foto
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });
  const iframeRef = useRef(null);

  const imprimirEtiqueta = (libro) => {
    const qrEl = document.getElementById(`qr-libros-${libro.id}`);
    if (!qrEl) return;
    const doc = iframeRef.current.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Etiqueta_${libro.codigo}</title>
          <style>
            @font-face { font-family: 'Essai'; src: url('/fonts/Essai.ttf') format('truetype'); }
            @page { size: 50mm 50mm; margin: 0; }
            body { font-family: Essai, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .colegio { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #7F252E; }
            .titulo { font-size: 10px; font-weight: bold; margin: 2px 0; max-width: 90%; }
            .codigo { font-size: 9px; font-family: monospace; }
            svg { width: 120px !important; height: 120px !important; }
          </style>
        </head>
        <body>
          <div class="colegio">Colegio Juan de Lanuza</div><br>
          ${qrEl.innerHTML}<br>
          <div class="titulo">${libro.titulo}</div>
          <div class="codigo">${libro.codigo}</div>
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }, 800);
  };

  const [modalEstanterias, setModalEstanterias] = useState(false);
  const [nuevaEstanteria, setNuevaEstanteria] = useState('');
  const [errorEstanteria, setErrorEstanteria] = useState('');
  const [editandoEstanteria, setEditandoEstanteria] = useState(null); // { id, nombre }
  const [editNombreEstanteria, setEditNombreEstanteria] = useState('');

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target))
        setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadEstanterias = async () => {
    const { data } = await api.get('/estanterias');
    setEstanterias(data);
  };

  useEffect(() => {
    api.get('/libros/filtros/generos').then((r) => setGeneros(r.data));
    api.get('/libros/filtros/idiomas').then((r) => setIdiomas(r.data));
    api.get('/libros/filtros/editoriales').then((r) => setEditoriales(r.data));
    loadEstanterias();
  }, []);

  // Debounce 300 ms en el buscador
  const debounceRef = useRef(null);
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 300);
  };

  const load = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filtroEstado) params.set('estado', filtroEstado);
    if (filtroGenero) params.set('genero', filtroGenero);
    if (filtroIdioma) params.set('idioma', filtroIdioma);
    if (filtroEditorial) params.set('editorial', filtroEditorial);
    if (filtroEstanteria) params.set('estanteria', filtroEstanteria);
    if (filtroEtiquetado !== '') params.set('etiquetado', filtroEtiquetado);
    const { data } = await api.get(`/libros?${params}`);
    setLibros(data);
    setPage(1);
  };

  useEffect(() => {
    load();
  }, [
    search,
    filtroEstado,
    filtroGenero,
    filtroIdioma,
    filtroEditorial,
    filtroEstanteria,
    filtroEtiquetado,
  ]);

  const hayFiltros =
    searchInput ||
    filtroEstado ||
    filtroGenero ||
    filtroIdioma ||
    filtroEditorial ||
    filtroEstanteria ||
    filtroEtiquetado !== '';

  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroEstado('');
    setFiltroGenero('');
    setFiltroIdioma('');
    setFiltroEditorial('');
    setFiltroEstanteria('');
    setFiltroEtiquetado('');
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = [...libros].sort((a, b) => {
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    let cmp;
    if (sortCol === 'codigo') {
      const na = parseInt(String(va).replace(/^L_/i, ''), 10);
      const nb = parseInt(String(vb).replace(/^L_/i, ''), 10);
      cmp = (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
    } else if (sortCol === 'volumen') {
      const sa = String(va).trim();
      const sb = String(vb).trim();
      const aVacio = sa === '' || sa === null;
      const bVacio = sb === '' || sb === null;
      const na = parseFloat(sa);
      const nb = parseFloat(sb);
      const aNum = !aVacio && !isNaN(na);
      const bNum = !bVacio && !isNaN(nb);
      // orden: vacío → número → texto
      const rango = (vacio, esNum) => (vacio ? 0 : esNum ? 1 : 2);
      const ra = rango(aVacio, aNum);
      const rb = rango(bVacio, bNum);
      if (ra !== rb) cmp = ra - rb;
      else if (aNum && bNum) cmp = na - nb;
      else cmp = sa.localeCompare(sb, 'es', { sensitivity: 'base' });
    } else if (typeof va === 'number') {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' });
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const librosPagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const openNew = () => {
    setEditing(null);
    setFotoFile(null);
    setError('');
    setForm(EMPTY);
    setModal(true);
  };
  const openEdit = (l) => {
    setEditing(l);
    setForm({ ...l, volumen: l.volumen ?? '' });
    setFotoFile(null);
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let libro;
      if (editing) {
        const { data } = await api.put(`/libros/${editing.id}`, form);
        libro = data;
      } else {
        const { data } = await api.post('/libros', form);
        libro = data;
      }
      if (fotoFile) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        const nombreBase =
          form.nombre_foto ||
          (form.volumen ? `${form.titulo}_${form.volumen}` : form.titulo);
        await api.post(
          `/libros/${libro.id}/foto?nombre=${encodeURIComponent(nombreBase)}`,
          fd
        );
      }
      setModal(false);
      showToast(
        editing
          ? 'Libro actualizado correctamente'
          : 'Libro creado correctamente'
      );
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      message: '¿Eliminar este libro?',
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        try {
          await api.delete(`/libros/${id}`);
          showToast('Libro eliminado');
          load();
        } catch (err) {
          setConfirmModal({
            open: true,
            message: err.response?.data?.error || 'Error al eliminar el libro',
            onConfirm: null,
          });
        }
      },
    });
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSeleccion = (id, index, shiftKey) => {
    const next = new Set(seleccionados);
    if (shiftKey && lastClickedRef.current !== null) {
      const start = Math.min(lastClickedRef.current, index);
      const end = Math.max(lastClickedRef.current, index);
      const target = !seleccionados.has(id);
      librosPagina.slice(start, end + 1).forEach((item) => {
        target ? next.add(item.id) : next.delete(item.id);
      });
    } else {
      next.has(id) ? next.delete(id) : next.add(id);
    }
    lastClickedRef.current = index;
    setSeleccionados(next);
  };

  const toggleTodos = () => {
    const idsPagina = librosPagina.map((l) => l.id);
    const todosSeleccionados = idsPagina.every((id) => seleccionados.has(id));
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (todosSeleccionados) idsPagina.forEach((id) => next.delete(id));
      else idsPagina.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleMarcarEtiquetado = async () => {
    const ids = [...seleccionados];
    try {
      await api.post('/libros/marcar-etiquetado', { ids });
      showToast(
        `${ids.length} libro${ids.length > 1 ? 's marcados' : ' marcado'} como etiquetado${ids.length > 1 ? 's' : ''}`
      );
      setSeleccionados(new Set());
      load();
    } catch {
      showToast('Error al marcar los libros', 'error');
    }
  };

  const handleEliminarMultiple = () => {
    const ids = [...seleccionados];
    setConfirmModal({
      open: true,
      message: `¿Eliminar ${ids.length} libro${ids.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        try {
          await api.post('/libros/eliminar-multiple', { ids });
          setSeleccionados(new Set());
          showToast(
            `${ids.length} libro${ids.length > 1 ? 's' : ''} eliminado${ids.length > 1 ? 's' : ''}`
          );
          load();
        } catch (err) {
          const fallos = err.response?.data?.fallos;
          setConfirmModal({
            open: true,
            message: fallos
              ? `No se pueden eliminar los siguientes libros porque tienen préstamos activos:\n${fallos.join(', ')}`
              : err.response?.data?.error || 'Error al eliminar',
            onConfirm: null,
          });
        }
      },
    });
  };

  const abrirImportar = () => {
    setImportFile(null);
    setImportEstanteria('');
    setImportPreview(null);
    setImportError('');
    setModalImportar(true);
  };

  const parsearCSVLibros = (texto) => {
    const COLS = [
      'titulo',
      'autor',
      'editorial',
      'volumen',
      'idioma',
      'genero',
      'estanteria',
      'categoria',
    ];
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
    if (!lineas.length) throw new Error('El archivo está vacío');
    let inicio = 0;
    const primera = lineas[0].toLowerCase();
    if (
      primera.includes('titulo') ||
      primera.includes('título') ||
      primera.includes('autor')
    ) {
      inicio = 1;
    }
    const resultado = [];
    for (let i = inicio; i < lineas.length; i++) {
      const partes = lineas[i]
        .split(',')
        .map((p) => p.trim().replace(/^"|"$/g, ''));
      if (partes.length < 1 || !partes[0]) continue;
      resultado.push({
        titulo: partes[0] || '',
        autor: partes[1] || '',
        editorial: partes[2] || '',
        volumen: partes[3] || '',
        idioma: partes[4] || '',
        genero: partes[5] || '',
        categoria: partes[7] || '',
      });
    }
    if (!resultado.length)
      throw new Error('No se encontraron datos en el archivo');
    return resultado;
  };

  const handlePrevisualizarLibros = () => {
    setImportError('');
    if (!importFile) {
      setImportError('Selecciona un archivo CSV');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setImportPreview(parsearCSVLibros(e.target.result));
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(importFile, 'UTF-8');
  };

  const handleConfirmarImportLibros = async () => {
    setImportLoading(true);
    setImportError('');
    try {
      const { data } = await api.post('/libros/importar', {
        libros: importPreview,
        estanteria: importEstanteria || null,
      });
      setModalImportar(false);
      showToast(`${data.importados} libros importados correctamente`);
      load();
    } catch (err) {
      setImportError(err.response?.data?.error || 'Error al importar');
    } finally {
      setImportLoading(false);
    }
  };

  const handleAddEstanteria = async (e) => {
    e.preventDefault();
    setErrorEstanteria('');
    try {
      await api.post('/estanterias', { nombre: nuevaEstanteria });
      setNuevaEstanteria('');
      loadEstanterias();
    } catch (err) {
      setErrorEstanteria(err.response?.data?.error || 'Error al añadir');
    }
  };

  const handleEditEstanteria = async (e) => {
    e.preventDefault();
    setErrorEstanteria('');
    try {
      await api.put(`/estanterias/${editandoEstanteria.id}`, {
        nombre: editNombreEstanteria,
      });
      setEditandoEstanteria(null);
      setEditNombreEstanteria('');
      loadEstanterias();
      load(); // refresca libros por si cambió el nombre
    } catch (err) {
      setErrorEstanteria(err.response?.data?.error || 'Error al editar');
    }
  };

  const handleDeleteEstanteria = (id) => {
    setConfirmModal({
      open: true,
      message: '¿Eliminar esta estantería?',
      onConfirm: async () => {
        setConfirmModal({ open: false, message: '', onConfirm: null });
        await api.delete(`/estanterias/${id}`);
        loadEstanterias();
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Libros</h1>
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
                    exportarCSV(sorted, COLS_LIBROS, 'libros_vista');
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
                      ordenarPor(libros, 'codigo'),
                      COLS_LIBROS,
                      'libros_todos'
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
            onClick={abrirImportar}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:border-green-600 hover:text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload size={15} />
            Importar CSV
          </button>
          <button
            onClick={() => {
              setModalEstanterias(true);
              setErrorEstanteria('');
              setNuevaEstanteria('');
            }}
            className="border border-brand-600 text-brand-600 hover:bg-brand-50 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Gestionar estanterías
          </button>
          <button
            onClick={openNew}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Añadir libro
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        {/* Fila 1: buscador + limpiar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Buscar por título, autor o código del libro"
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

        {/* Fila 2: filtros */}
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: 'Estado',
              value: filtroEstado,
              set: setFiltroEstado,
              opts: ESTADOS,
            },
            {
              label: 'Género',
              value: filtroGenero,
              set: setFiltroGenero,
              opts: generos,
            },
            {
              label: 'Idioma',
              value: filtroIdioma,
              set: setFiltroIdioma,
              opts: idiomas,
            },
            {
              label: 'Editorial',
              value: filtroEditorial,
              set: setFiltroEditorial,
              opts: editoriales,
            },
            {
              label: 'Estantería',
              value: filtroEstanteria,
              set: setFiltroEstanteria,
              opts: estanterias.map((e) => e.nombre),
            },
          ].map(({ label, value, set, opts }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => set(e.target.value)}
              className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${value ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
            >
              <option value="">{label}</option>
              {opts.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
          <select
            value={filtroEtiquetado}
            onChange={(e) => setFiltroEtiquetado(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroEtiquetado !== '' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-gray-300'}`}
          >
            <option value="">Etiqueta</option>
            <option value="0">Sin etiquetar</option>
            <option value="1">Etiquetados</option>
          </select>
        </div>

        {/* Contador */}
        <p className="text-xs text-gray-400">
          {libros.length}{' '}
          {libros.length === 1 ? 'libro encontrado' : 'libros encontrados'}
          {hayFiltros && ' con los filtros aplicados'}
        </p>
      </div>

      {seleccionados.size > 0 && (
        <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm text-brand-700 font-medium">
            {seleccionados.size} libro{seleccionados.size > 1 ? 's' : ''}{' '}
            seleccionado{seleccionados.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSeleccionados(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Deseleccionar todo
            </button>
            <button
              onClick={() => setImprimiendo(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg"
            >
              <Printer size={12} />
              Imprimir etiquetas
              {seleccionados.size > 32 && (
                <span className="ml-1 bg-amber-400 text-amber-900 text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  máx. 32
                </span>
              )}
            </button>
            <button
              onClick={handleMarcarEtiquetado}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg"
            >
              <Tag size={12} /> Marcar etiquetadas
            </button>
            <button
              onClick={handleEliminarMultiple}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
            >
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
                  checked={
                    librosPagina.length > 0 &&
                    librosPagina.every((l) => seleccionados.has(l.id))
                  }
                  onChange={toggleTodos}
                  className="cursor-pointer"
                />
              </th>
              <Th col="codigo">Código</Th>
              <Th col="titulo">Título</Th>
              <Th col="autor">Autor</Th>
              <Th col="editorial">Editorial</Th>
              <Th col="volumen">Volumen</Th>
              <Th col="idioma">Idioma</Th>
              <Th col="genero">Género</Th>
              <Th col="categoria">Categoria</Th>
              <Th col="estanteria">Estantería</Th>
              <Th col="estado">Estado</Th>

              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {librosPagina.map((l, idx) => (
              <tr
                key={l.id}
                className={`hover:bg-gray-50 cursor-pointer ${seleccionados.has(l.id) ? 'bg-brand-50' : ''}`}
                onClick={() => setFotoModal(l)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={seleccionados.has(l.id)}
                    onChange={() => {}}
                    onClick={(e) => toggleSeleccion(l.id, idx, e.shiftKey)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  <span className="flex items-center gap-1.5">
                    {l.codigo}
                    {l.etiquetado ? (
                      <Tag size={11} className="text-green-500 flex-shrink-0" />
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{l.titulo}</td>
                <td className="px-4 py-3 text-gray-600">{l.autor || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {l.editorial || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-center">
                  {l.volumen ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{l.idioma || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{l.genero || '—'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {l.categoria || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {l.estanteria || '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[l.estado]}`}
                  >
                    {l.estado}
                  </span>
                </td>

                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(l)}
                      title="Editar"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      <Pencil size={12} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
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
            {!libros.length && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            {libros.length} libros — página {page} de {totalPages}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="bg-brand-700 text-white rounded-t-2xl -mx-6 -mt-6 px-6 py-4 mb-5">
              <h2 className="text-lg font-medium">
                {editing ? 'Editar libro' : 'Nuevo libro'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Código
                  </label>
                  <input
                    readOnly
                    placeholder="Se crea automatico"
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volumen
                  </label>
                  <input
                    value={form.volumen}
                    onChange={(e) => set('volumen', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Título *
                </label>
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => set('titulo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Autor
                  </label>
                  <input
                    value={form.autor}
                    onChange={(e) => set('autor', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Editorial
                  </label>
                  <input
                    value={form.editorial}
                    onChange={(e) => set('editorial', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Idioma
                  </label>
                  <input
                    value={form.idioma}
                    onChange={(e) => set('idioma', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Género
                  </label>
                  <input
                    value={form.genero}
                    onChange={(e) => set('genero', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Categoría
                </label>
                <input
                  value={form.categoria}
                  onChange={(e) => set('categoria', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estantería
                  </label>
                  <select
                    value={form.estanteria}
                    onChange={(e) => set('estanteria', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— Selecciona —</option>
                    {estanterias.map((e) => (
                      <option key={e.id} value={e.nombre}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) => set('estado', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre archivo foto
                </label>
                <input
                  placeholder="si se deja vacio, se usara nombre del libro + volumen"
                  value={form.nombre_foto}
                  onChange={(e) => set('nombre_foto', e.target.value)}
                  readOnly={!!editing && !fotoFile}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${editing && !fotoFile ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Foto de portada
                  {editing && editing.nombre_foto ? ' (cambiar)' : ''}
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-gray-300 hover:border-brand-500 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    📁 Seleccionar archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setFotoFile(e.target.files[0]);
                        set('nombre_foto', '');
                      }}
                    />
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-gray-300 hover:border-brand-500 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    📷 Tomar foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        setFotoFile(e.target.files[0]);
                        set('nombre_foto', '');
                      }}
                    />
                  </label>
                </div>
                {/* Preview */}
                {(fotoFile || editing?.nombre_foto) && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={
                        fotoFile
                          ? URL.createObjectURL(fotoFile)
                          : `/uploads/fotos_portadas/${editing.nombre_foto}`
                      }
                      alt="preview"
                      className="h-16 w-12 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="text-xs text-gray-500">
                      {fotoFile ? (
                        <>
                          <p className="font-medium text-gray-700">
                            {fotoFile.name}
                          </p>
                          <p>{(fotoFile.size / 1024).toFixed(0)} KB</p>
                        </>
                      ) : (
                        <p className="text-gray-400">
                          Foto actual - selecciona una nueva para reemplazarla
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg"
                >
                  {editing ? 'Guardar cambios' : 'Crear libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEstanterias && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              Gestionar estanterías
            </h2>

            {/* Lista actual */}
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {estanterias.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin estanterías creadas
                </p>
              )}
              {estanterias.map((e) => (
                <div key={e.id} className="rounded-lg hover:bg-gray-50">
                  {editandoEstanteria?.id === e.id ? (
                    <form
                      onSubmit={handleEditEstanteria}
                      className="flex items-center gap-2 px-3 py-1.5"
                    >
                      <input
                        autoFocus
                        value={editNombreEstanteria}
                        onChange={(ev) =>
                          setEditNombreEstanteria(ev.target.value)
                        }
                        className="flex-1 border border-brand-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="submit"
                        className="text-brand-600 hover:text-brand-800 text-xs font-medium"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoEstanteria(null);
                          setErrorEstanteria('');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-gray-700">
                        {e.nombre}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditandoEstanteria(e);
                            setEditNombreEstanteria(e.nombre);
                            setErrorEstanteria('');
                          }}
                          className="text-brand-500 hover:text-brand-700 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteEstanteria(e.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Añadir nueva */}
            <form
              onSubmit={handleAddEstanteria}
              className="flex gap-2 pt-2 border-t border-gray-100"
            >
              <input
                value={nuevaEstanteria}
                onChange={(e) => setNuevaEstanteria(e.target.value)}
                placeholder="Nombre de la estantería"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
              >
                Añadir
              </button>
            </form>
            {errorEstanteria && (
              <p className="text-red-500 text-xs">{errorEstanteria}</p>
            )}

            <button
              onClick={() => setModalEstanterias(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal libro */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                fotoModal.nombre_foto
                  ? `/uploads/fotos_portadas/${fotoModal.nombre_foto}`
                  : '/portada-default.png'
              }
              alt={fotoModal.titulo}
              className="w-full object-contain max-h-[50vh]"
              onError={(e) => {
                e.target.src = '/portada-default.png';
              }}
            />
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {fotoModal.titulo}
              </p>
              {fotoModal.autor && (
                <p className="text-xs text-gray-400 truncate">
                  {fotoModal.autor}
                </p>
              )}
            </div>
            <div className="px-4 pb-4 flex items-center gap-4">
              <div
                id={`qr-libros-${fotoModal.id}`}
                className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm shrink-0"
              >
                <QRCodeSVG
                  value={fotoModal.codigo}
                  size={90}
                  level="H"
                  fgColor="#1e293b"
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-mono text-gray-500">
                  {fotoModal.codigo}
                </p>
                <button
                  onClick={() => imprimirEtiqueta(fotoModal)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-all"
                >
                  🖨️ Imprimir etiqueta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <iframe ref={iframeRef} style={{ display: 'none' }} title="impresion" />

      {modalImportar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div
            className={`bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 ${importPreview ? 'max-w-5xl' : 'max-w-lg'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Upload size={18} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Importar libros desde CSV
                </h2>
                <p className="text-xs text-gray-400">
                  Formato esperado: titulo, autor, editorial, volumen, idioma,
                  genero, estanteria, categoria
                </p>
              </div>
            </div>

            {importPreview === null ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Solo compatible con archivos .csv con valores separados por{' '}
                    <b>comas</b>. La columna de estantería del CSV se ignora —
                    se asigna abajo.
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Archivo CSV *
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-300 hover:border-brand-500 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    📁{' '}
                    {importFile ? importFile.name : 'Seleccionar archivo .csv'}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        setImportFile(e.target.files[0]);
                        setImportError('');
                      }}
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estantería a asignar
                  </label>
                  <select
                    value={importEstanteria}
                    onChange={(e) => setImportEstanteria(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">— Sin estantería —</option>
                    {estanterias.map((e) => (
                      <option key={e.id} value={e.nombre}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {importError && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border bg-red-50 border-red-200 text-red-600">
                    <span className="shrink-0">✗</span>
                    <span>{importError}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalImportar(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevisualizarLibros}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg"
                  >
                    Previsualizar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      {importPreview.length} libros
                    </span>{' '}
                    listos para importar
                    {importEstanteria && (
                      <>
                        {' '}
                        · estantería:{' '}
                        <span className="font-medium">{importEstanteria}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Título</th>
                        <th className="px-3 py-2 text-left">Autor</th>
                        <th className="px-3 py-2 text-left">Editorial</th>
                        <th className="px-3 py-2 text-left">Vol.</th>
                        <th className="px-3 py-2 text-left">Idioma</th>
                        <th className="px-3 py-2 text-left">Género</th>
                        <th className="px-3 py-2 text-left">Estantería</th>
                        <th className="px-3 py-2 text-left">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importPreview.map((l, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 text-xs">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2 font-medium">{l.titulo}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.autor || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.editorial || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.volumen || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.idioma || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.genero || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {importEstanteria || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {l.categoria || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importError && (
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border bg-red-50 border-red-200 text-red-600">
                    <span className="shrink-0">✗</span>
                    <span>{importError}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setImportPreview(null);
                      setImportError('');
                    }}
                    disabled={importLoading}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarImportLibros}
                    disabled={importLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {importLoading
                      ? 'Importando...'
                      : `Confirmar importación (${importPreview.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4">
            <p className="text-gray-800 font-medium text-center whitespace-pre-line">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-center">
              {confirmModal.onConfirm ? (
                <>
                  <button
                    onClick={() =>
                      setConfirmModal({
                        open: false,
                        message: '',
                        onConfirm: null,
                      })
                    }
                    className="px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                  >
                    Eliminar
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    setConfirmModal({
                      open: false,
                      message: '',
                      onConfirm: null,
                    })
                  }
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
      {imprimiendo && (
        <EtiquetasImpresion
          libros={libros.filter((l) => seleccionados.has(l.id)).slice(0, 32)}
          onClose={() => setImprimiendo(false)}
        />
      )}
    </div>
  );
}

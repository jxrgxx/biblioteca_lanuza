import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

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
  codigo: '',
  titulo: '',
  autor: '',
  editorial: '',
  volumen: '',
  idioma: '',
  genero: '',
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
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('titulo');
  const [sortDir, setSortDir] = useState('asc');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fotoFile, setFotoFile] = useState(null);
  const [error, setError] = useState('');

  const [generos, setGeneros] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [estanterias, setEstanterias] = useState([]);

  useEffect(() => {
    api.get('/libros/filtros/generos').then((r) => setGeneros(r.data));
    api.get('/libros/filtros/idiomas').then((r) => setIdiomas(r.data));
    api.get('/libros/filtros/editoriales').then((r) => setEditoriales(r.data));
    api.get('/libros/filtros/estanterias').then((r) => setEstanterias(r.data));
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
  ]);

  const hayFiltros =
    searchInput ||
    filtroEstado ||
    filtroGenero ||
    filtroIdioma ||
    filtroEditorial ||
    filtroEstanteria;

  const limpiarFiltros = () => {
    setSearchInput('');
    setSearch('');
    setFiltroEstado('');
    setFiltroGenero('');
    setFiltroIdioma('');
    setFiltroEditorial('');
    setFiltroEstanteria('');
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
    const cmp =
      typeof va === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const librosPagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const openNew = async () => {
    setEditing(null);
    setFotoFile(null);
    setError('');
    const { data } = await api.get('/libros/next-codigo');
    setForm({ ...EMPTY, codigo: data.codigo });
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
        const params = form.nombre_foto ? `?nombre=${encodeURIComponent(form.nombre_foto)}` : '';
        await api.post(`/libros/${libro.id}/foto${params}`, fd);
      }
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este libro?')) return;
    await api.delete(`/libros/${id}`);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Libros</h1>
        <button
          onClick={openNew}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Añadir libro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        {/* Fila 1: buscador + limpiar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              placeholder="Buscar por título, autor o código..."
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
              opts: estanterias,
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
        </div>

        {/* Contador */}
        <p className="text-xs text-gray-400">
          {libros.length}{' '}
          {libros.length === 1 ? 'libro encontrado' : 'libros encontrados'}
          {hayFiltros && ' con los filtros aplicados'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <Th col="codigo">Código</Th>
              <Th col="titulo">Título</Th>
              <Th col="autor">Autor</Th>
              <Th col="editorial">Editorial</Th>
              <Th col="volumen">Volumen</Th>
              <Th col="idioma">Idioma</Th>
              <Th col="genero">Género</Th>
              <Th col="estado">Estado</Th>
              <Th col="estanteria">Estantería</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {librosPagina.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{l.codigo}</td>
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
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[l.estado]}`}
                  >
                    {l.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {l.estanteria || '—'}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openEdit(l)}
                    className="text-brand-600 hover:underline text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
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
            <h2 className="text-lg font-bold mb-4">
              {editing ? 'Editar libro' : 'Nuevo libro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Código *
                  </label>
                  <input
                    required
                    value={form.codigo}
                    onChange={(e) => set('codigo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volumen
                  </label>
                  <input
                    type="number"
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
                      <option key={e} value={e}>{e}</option>
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
                  placeholder="ej: don-quijote  (se añade timestamp automáticamente)"
                  value={form.nombre_foto}
                  onChange={(e) => set('nombre_foto', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Foto de portada{editing && editing.nombre_foto ? ' (cambiar)' : ''}
                </label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-gray-300 hover:border-brand-500 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    📁 Seleccionar archivo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setFotoFile(e.target.files[0])} />
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer border border-gray-300 hover:border-brand-500 rounded-lg px-3 py-2 text-sm text-gray-600 hover:text-brand-600 transition-colors">
                    📷 Tomar foto
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFotoFile(e.target.files[0])} />
                  </label>
                </div>
                {/* Preview */}
                {(fotoFile || (editing?.nombre_foto)) && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={fotoFile ? URL.createObjectURL(fotoFile) : `/uploads/${editing.nombre_foto}`}
                      alt="preview"
                      className="h-16 w-12 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="text-xs text-gray-500">
                      {fotoFile ? (
                        <><p className="font-medium text-gray-700">{fotoFile.name}</p><p>{(fotoFile.size / 1024).toFixed(0)} KB</p></>
                      ) : (
                        <p className="text-gray-400">Foto actual — selecciona una nueva para reemplazarla</p>
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
    </div>
  );
}

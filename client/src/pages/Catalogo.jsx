import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LibroCard from '../components/LibroCard';
import Footer from '../components/Footer';

const ESTADOS = ['disponible', 'prestado', 'extraviado', 'no disponible'];

export default function Catalogo() {
  const [libros, setLibros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generos, setGeneros] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [estanterias, setEstanterias] = useState([]);

  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroIdioma, setFiltroIdioma] = useState('');
  const [filtroEditorial, setFiltroEditorial] = useState('');
  const [filtroEstanteria, setFiltroEstanteria] = useState('');
  const [sortBy, setSortBy] = useState('titulo');
  const [order, setOrder] = useState('ASC');

  // Carga listas de filtros una sola vez desde endpoints DISTINCT
  useEffect(() => {
    api.get('/libros/filtros/generos').then((r) => setGeneros(r.data));
    api.get('/libros/filtros/idiomas').then((r) => setIdiomas(r.data));
    api.get('/libros/filtros/editoriales').then((r) => setEditoriales(r.data));
    api.get('/libros/filtros/estanterias').then((r) => setEstanterias(r.data));
  }, []);

  // Carga libros filtrados cada vez que cambia algún filtro
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filtroEstado) params.set('estado', filtroEstado);
    if (filtroGenero) params.set('genero', filtroGenero);
    if (filtroIdioma) params.set('idioma', filtroIdioma);
    if (filtroEditorial) params.set('editorial', filtroEditorial);
    if (filtroEstanteria) params.set('estanteria', filtroEstanteria);
    params.set('sortBy', sortBy);
    params.set('order', order);

    setLoading(true);
    api
      .get(`/libros?${params}`)
      .then((r) => setLibros(r.data))
      .finally(() => setLoading(false));
  }, [
    search,
    filtroEstado,
    filtroGenero,
    filtroIdioma,
    filtroEditorial,
    filtroEstanteria,
    sortBy,
    order,
  ]);

  const resetFiltros = () => {
    setSearch('');
    setFiltroEstado('');
    setFiltroGenero('');
    setFiltroIdioma('');
    setFiltroEditorial('');
    setFiltroEstanteria('');
    setSortBy('titulo');
    setOrder('ASC');
  };

  const hayFiltros =
    search ||
    filtroEstado ||
    filtroGenero ||
    filtroIdioma ||
    filtroEditorial ||
    filtroEstanteria;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* CABECERA */}
      <header className="bg-brand-700 text-white shadow-md">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/arbol_logo_transparente.png"
              alt="Logo"
              className="h-10 object-contain"
            />
            <div>
              <p className="font-bold text-lg leading-tight">Biblioteca</p>
              <p className="text-brand-300 text-xs">Juan de Lanuza</p>
            </div>
          </div>
          <Link
            to="/login"
            className="bg-white text-brand-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-brand-50 transition-colors"
          >
            Acceder
          </Link>
        </div>
      </header>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="w-full px-6 py-4 flex flex-wrap gap-3 items-center">
          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar por título, autor o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {/* Limpiar filtros */}
          {hayFiltros && (
            <button
              onClick={resetFiltros}
              className="text-sm text-brand-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}

          {/* Filtro estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {/* Filtro género */}
          <select
            value={filtroGenero}
            onChange={(e) => setFiltroGenero(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Géneros</option>
            {generos.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Filtro idioma */}
          <select
            value={filtroIdioma}
            onChange={(e) => setFiltroIdioma(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Idiomas</option>
            {idiomas.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>

          {/* Filtro editorial */}
          <select
            value={filtroEditorial}
            onChange={(e) => setFiltroEditorial(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Editoriales</option>
            {editoriales.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {/* Filtro estantería */}
          <select
            value={filtroEstanteria}
            onChange={(e) => setFiltroEstanteria(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Estanterías</option>
            {estanterias.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          {/* Ordenar por */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="titulo">Ordenar por título</option>
            <option value="autor">Ordenar por autor</option>
            <option value="editorial">Ordenar por editorial</option>
          </select>

          {/* ASC / DESC */}
          <button
            onClick={() => setOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))}
            title={order === 'ASC' ? 'Ascendente' : 'Descendente'}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            {order === 'ASC' ? (
              <>
                ↑ <span className="hidden sm:inline">A–Z</span>
              </>
            ) : (
              <>
                ↓ <span className="hidden sm:inline">Z–A</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GRID DE LIBROS */}
      <main className="flex-1 w-full px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-24 text-gray-400 text-sm">
            Cargando catálogo...
          </div>
        ) : libros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">📚</span>
            <p className="text-sm">
              No se encontraron libros con esos filtros.
            </p>
            {hayFiltros && (
              <button
                onClick={resetFiltros}
                className="mt-3 text-sm text-brand-600 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-5">
              {libros.length}{' '}
              {libros.length === 1 ? 'libro encontrado' : 'libros encontrados'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {libros.map((libro) => (
                <LibroCard key={libro.id} libro={libro} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

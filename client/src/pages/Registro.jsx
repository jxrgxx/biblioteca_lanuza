import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const CURSOS = [
  "1º Primaria", "2º Primaria", "3º Primaria", "4º Primaria",
  "5º Primaria", "6º Primaria",
  "1º ESO", "2º ESO", "3º ESO", "4º ESO",
  "1º Bach", "2º Bach",
];

const PAGE_SIZE = 50;

export default function Registro() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  const [entradas, setEntradas] = useState([]);
  const [form, setForm] = useState({ nombre: "", curso: CURSOS[0] });
  const [error, setError] = useState("");

  // Buscador
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const debounceRef = useRef(null);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  // Edición inline
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: "", curso: "", fecha: "" });

  const load = async () => {
    const { data } = await api.get(`/registro?fecha=${fecha}`);
    setEntradas(data);
    setPage(1);
  };

  useEffect(() => { load(); }, [fecha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/registro", { ...form, fecha });
      setForm((f) => ({ ...f, nombre: "" }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta entrada?")) return;
    await api.delete(`/registro/${id}`);
    load();
  };

  const startEdit = (e) => {
    setEditId(e.id);
    setEditForm({ nombre: e.nombre, curso: e.curso, fecha: e.fecha });
  };

  const handleEditSave = async (id) => {
    try {
      await api.put(`/registro/${id}`, editForm);
      setEditId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Error al editar");
    }
  };

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const Th = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
    >
      {children}
      <span className={`ml-1 ${sortCol === col ? "text-brand-600" : "text-gray-300"}`}>
        {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </th>
  );

  const filtered = entradas.filter((e) => {
    if (search && !e.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (filtroCurso && e.curso !== filtroCurso) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? "";
    const vb = b[sortCol] ?? "";
    const cmp = String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hayFiltros = searchInput || filtroCurso;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Registro diario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario nuevo */}
        <div className="bg-white rounded-xl shadow p-6 self-start">
          <h2 className="font-semibold text-gray-700 mb-4">Añadir entrada</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre del alumno"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Curso *</label>
              <select
                value={form.curso}
                onChange={(e) => setForm((f) => ({ ...f, curso: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium"
            >
              Añadir
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow flex flex-col">
          {/* Cabecera */}
          <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-700 whitespace-nowrap">
              Entradas — <span className="text-brand-600">{filtered.length}</span>
            </h2>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Buscador */}
          <div className="px-6 py-3 border-b flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                placeholder="Buscar por nombre..."
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >×</button>
              )}
            </div>
            <select
              value={filtroCurso}
              onChange={(e) => { setFiltroCurso(e.target.value); setPage(1); }}
              className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroCurso ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-300"}`}
            >
              <option value="">Todos los cursos</option>
              {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {hayFiltros && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setFiltroCurso(""); setPage(1); }}
                className="text-sm text-brand-600 hover:underline whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Tabla de entradas */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <Th col="nombre">Nombre</Th>
                  <Th col="curso">Curso</Th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagina.map((e, i) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    {editId === e.id ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editForm.nombre}
                            onChange={(ev) => setEditForm((f) => ({ ...f, nombre: ev.target.value }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editForm.curso}
                            onChange={(ev) => setEditForm((f) => ({ ...f, curso: ev.target.value }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleEditSave(e.id)}
                            className="text-green-600 hover:underline text-xs"
                          >Guardar</button>
                          <button
                            onClick={() => setEditId(null)}
                            className="text-gray-400 hover:underline text-xs"
                          >Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{e.nombre}</td>
                        <td className="px-4 py-3 text-gray-600">{e.curso}</td>
                        <td className="px-4 py-3 flex gap-3">
                          <button
                            onClick={() => startEdit(e)}
                            className="text-brand-600 hover:underline text-xs"
                          >Editar</button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >Eliminar</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {!pagina.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      Sin entradas para esta fecha
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-500">
              <span>{sorted.length} entradas — página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >← Anterior</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

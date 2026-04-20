import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";

const CURSOS = [
  "1º Primaria",
  "2º Primaria",
  "3º Primaria",
  "4º Primaria",
  "5º Primaria",
  "6º Primaria",
  "1º ESO",
  "2º ESO",
  "3º ESO",
  "4º ESO",
  "1º Bach",
  "2º Bach",
];

const EMPTY = {
  nombre: "",
  apellidos: "",
  email: "",
  password: "",
  rol: "alumno",
  ubicacion: "",
};

const rolBadge = {
  personal: "bg-purple-100 text-purple-700",
  profesorado: "bg-brand-100 text-brand-700",
  alumno: "bg-green-100 text-green-700",
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [sortCol, setSortCol] = useState("apellidos");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  const PAGE_SIZE = 50;

  const load = async () => {
    const { data } = await api.get("/usuarios");
    setUsuarios(data);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowPass(false);
    setModal(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ ...u, password: "" });
    setError("");
    setShowPass(false);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        ubicacion: form.rol === "personal" ? null : form.ubicacion || null,
      };
      if (editing) await api.put(`/usuarios/${editing.id}`, payload);
      else await api.post("/usuarios", payload);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    await api.delete(`/usuarios/${id}`);
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const filtered = usuarios.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.nombre?.toLowerCase().includes(q) &&
        !u.apellidos?.toLowerCase().includes(q) &&
        !u.email?.toLowerCase().includes(q)
      ) return false;
    }
    if (filtroRol && u.rol !== filtroRol) return false;
    if (filtroUbicacion && u.ubicacion !== filtroUbicacion) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? "";
    const vb = b[sortCol] ?? "";
    const cmp = String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagina = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const hayFiltros = searchInput || filtroRol || filtroUbicacion;
  const limpiarFiltros = () => {
    setSearchInput(""); setSearch(""); setFiltroRol(""); setFiltroUbicacion(""); setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button
          onClick={openNew}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Añadir usuario
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              placeholder="Buscar por nombre, apellidos o email..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >×</button>
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
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroRol ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-300"}`}
          >
            <option value="">Rol</option>
            <option value="alumno">Alumno</option>
            <option value="profesorado">Profesorado</option>
            <option value="personal">Personal</option>
            <option value="admin">Admin</option>
            <option value="biblioteca">Biblioteca</option>
          </select>
          <select
            value={filtroUbicacion}
            onChange={(e) => setFiltroUbicacion(e.target.value)}
            className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${filtroUbicacion ? "border-brand-400 bg-brand-50 text-brand-700" : "border-gray-300"}`}
          >
            <option value="">Curso / Ubicación</option>
            {CURSOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">
          {filtered.length} {filtered.length === 1 ? "usuario encontrado" : "usuarios encontrados"}
          {hayFiltros && " con los filtros aplicados"}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <Th col="apellidos">Nombre</Th>
              <Th col="email">Email</Th>
              <Th col="rol">Rol</Th>
              <Th col="ubicacion">Ubicación</Th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {u.apellidos}, {u.nombre}
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolBadge[u.rol]}`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.ubicacion || "—"}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-brand-600 hover:underline text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  {hayFiltros ? "Sin resultados con los filtros aplicados" : "Sin usuarios"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{sorted.length} usuarios — página {page} de {totalPages}</span>
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

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">
              {editing ? "Editar usuario" : "Nuevo usuario"}
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
                    onChange={(e) => set("nombre", e.target.value)}
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
                    onChange={(e) => set("apellidos", e.target.value)}
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
                  onChange={(e) => set("email", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraseña {editing && "(dejar vacío para no cambiar)"}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
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
                    onChange={(e) => set("rol", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="alumno">Alumno</option>
                    <option value="profesorado">Profesorado</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                {form.rol !== "personal" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ubicación
                    </label>
                    <select
                      value={form.ubicacion}
                      onChange={(e) => set("ubicacion", e.target.value)}
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
                  {editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

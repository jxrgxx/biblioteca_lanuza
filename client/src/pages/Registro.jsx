import { useEffect, useRef, useState } from "react";
import { ScanLine, UserCheck, AlertCircle, PenLine, Search, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import api from "../services/api";

const CURSOS = [
  "1º Primaria", "2º Primaria", "3º Primaria", "4º Primaria",
  "5º Primaria", "6º Primaria",
  "1º ESO", "2º ESO", "3º ESO", "4º ESO",
  "1º Bach", "2º Bach",
];

const USR_RE = /^U_(\d{1,4})$/i;
const PAGE_SIZE = 50;

export default function Registro() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  const [entradas, setEntradas] = useState([]);
  const [error, setError] = useState("");

  // Escaneo QR
  const [scanInput, setScanInput] = useState("");
  const [preview, setPreview] = useState(null);   // { nombre, apellidos, ubicacion, id }
  const [scanError, setScanError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const scanRef = useRef(null);

  // Entrada manual
  const [modoManual, setModoManual] = useState(false);
  const [alumnos, setAlumnos] = useState([]);
  const [manualSearch, setManualSearch] = useState("");
  const [manualPreview, setManualPreview] = useState(null);
  const [manualError, setManualError] = useState("");
  const manualDebounce = useRef(null);

  // Buscador / filtros tabla
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const debounceRef = useRef(null);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  const load = async () => {
    const { data } = await api.get(`/registro?fecha=${fecha}`);
    setEntradas(data);
    setPage(1);
  };

  useEffect(() => { load(); }, [fecha]);

  useEffect(() => {
    if (modoManual && alumnos.length === 0) {
      api.get('/usuarios').then((r) =>
        setAlumnos(r.data.filter((u) => u.rol === 'alumno'))
      );
    }
    if (modoManual) {
      setManualSearch("");
      setManualPreview(null);
      setManualError("");
    }
  }, [modoManual]);

  // Mantener foco en el input de escaneo
  useEffect(() => {
    if (!modoManual) {
      const t = setTimeout(() => scanRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [modoManual, preview]);

  const resetScan = () => {
    setScanInput("");
    setPreview(null);
    setScanError("");
    setTimeout(() => scanRef.current?.focus(), 100);
  };

  const handleScan = async (e) => {
    if (e.key !== "Enter") return;
    const val = scanInput.trim();
    if (!val) return;

    const match = val.match(USR_RE);
    if (!match) {
      setScanError("Código no reconocido. Escanea un QR de usuario válido.");
      setScanInput("");
      return;
    }

    const id = parseInt(match[1], 10);
    setScanLoading(true);
    setScanError("");
    setPreview(null);

    try {
      const { data } = await api.get(`/usuarios/${id}`);
      if (data.rol !== "alumno") {
        setScanError(`El usuario escaneado es ${data.rol}, no alumno. Solo se registran alumnos.`);
        setScanInput("");
        return;
      }
      if (!data.ubicacion) {
        setScanError("El alumno no tiene curso asignado. Edita el usuario antes de registrarlo.");
        setScanInput("");
        return;
      }
      setPreview(data);
      setScanInput("");
    } catch {
      setScanError("Usuario no encontrado.");
      setScanInput("");
    } finally {
      setScanLoading(false);
    }
  };

  const handleAnadir = async () => {
    setError("");
    try {
      const nombre = `${preview.nombre} ${preview.apellidos}`;
      await api.post("/registro", { nombre, codigo_usuario: preview.codigo, curso: preview.ubicacion, fecha });
      resetScan();
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleManualSearch = (val) => {
    setManualSearch(val);
    setManualPreview(null);
    setManualError("");
  };

  const manualResultados = manualSearch.trim().length >= 2
    ? alumnos.filter((u) => {
        const q = manualSearch.toLowerCase();
        return (
          u.nombre?.toLowerCase().includes(q) ||
          u.apellidos?.toLowerCase().includes(q) ||
          u.codigo?.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  const handleAnadirManual = async () => {
    if (!manualPreview) return;
    setManualError("");
    try {
      await api.post("/registro", {
        nombre: `${manualPreview.nombre} ${manualPreview.apellidos}`,
        codigo_usuario: manualPreview.codigo,
        curso: manualPreview.ubicacion,
        fecha,
      });
      setManualSearch("");
      setManualPreview(null);
      load();
    } catch (err) {
      setManualError(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta entrada?")) return;
    await api.delete(`/registro/${id}`);
    load();
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
      <span className="inline-flex items-center gap-1">
        {children}
        {sortCol === col
          ? sortDir === "asc"
            ? <ChevronUp size={14} className="text-brand-600" />
            : <ChevronDown size={14} className="text-brand-600" />
          : <ChevronsUpDown size={14} className="text-gray-300" />
        }
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

        {/* Panel izquierdo — escaneo / manual */}
        <div className="bg-white rounded-xl shadow p-6 self-start space-y-4">

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setModoManual(false); resetScan(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!modoManual ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <ScanLine size={15} /> Escanear QR
            </button>
            <button
              onClick={() => setModoManual(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modoManual ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <PenLine size={15} /> Manual
            </button>
          </div>

          {/* Modo QR */}
          {!modoManual && (
            <div className="space-y-4">
              {/* Input oculto pero activo para el escáner */}
              <div
                onClick={() => scanRef.current?.focus()}
                className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                  scanLoading ? 'border-brand-300 bg-brand-50' :
                  scanError   ? 'border-red-300 bg-red-50' :
                  preview     ? 'border-green-300 bg-green-50' :
                                'border-gray-300 hover:border-brand-400 hover:bg-brand-50/40'
                }`}
              >
                <input
                  ref={scanRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  onBlur={(e) => {
                    const next = e.relatedTarget;
                    const esInputUsuario = next && (next.tagName === 'INPUT' || next.tagName === 'SELECT' || next.tagName === 'BUTTON' || next.tagName === 'TEXTAREA');
                    if (!esInputUsuario) setTimeout(() => scanRef.current?.focus(), 200);
                  }}
                  className="absolute opacity-0 w-0 h-0"
                  inputMode="none"
                  autoFocus
                />
                {scanLoading ? (
                  <p className="text-brand-600 text-sm font-medium">Buscando usuario...</p>
                ) : preview ? (
                  <>
                    <UserCheck size={32} className="text-green-500" />
                    <div className="text-center">
                      <p className="font-bold text-gray-800">{preview.nombre} {preview.apellidos}</p>
                      <p className="text-sm text-gray-500">{preview.ubicacion}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{preview.codigo}</p>
                    </div>
                  </>
                ) : scanError ? (
                  <>
                    <AlertCircle size={32} className="text-red-400" />
                    <p className="text-red-600 text-sm text-center">{scanError}</p>
                    <p className="text-xs text-gray-400">Escanea de nuevo para reintentar</p>
                  </>
                ) : (
                  <>
                    <ScanLine size={32} className="text-gray-300" />
                    <p className="text-gray-400 text-sm text-center">
                      Apunta el escáner al QR del usuario
                    </p>
                    <p className="text-xs text-gray-300">El campo está listo para recibir el código</p>
                  </>
                )}
              </div>

              {preview && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAnadir}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Añadir entrada
                  </button>
                  <button
                    onClick={resetScan}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}

          {/* Modo manual */}
          {modoManual && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  autoFocus
                  value={manualSearch}
                  onChange={(e) => handleManualSearch(e.target.value)}
                  placeholder="Nombre, apellidos o código U_1..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {manualSearch && (
                  <button
                    onClick={() => { setManualSearch(""); setManualPreview(null); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                  >×</button>
                )}
              </div>

              {/* Resultados */}
              {!manualPreview && manualSearch.trim().length >= 2 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {manualResultados.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No se encontró ningún alumno</p>
                  ) : (
                    manualResultados.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setManualPreview(u); setManualSearch(""); }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-50 transition-colors text-left border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.nombre} {u.apellidos}</p>
                          <p className="text-xs text-gray-400">{u.ubicacion || '—'}</p>
                        </div>
                        <span className="text-xs font-mono text-gray-400">{u.codigo}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Preview seleccionado */}
              {manualPreview && (
                <div className="border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{manualPreview.nombre} {manualPreview.apellidos}</p>
                    <p className="text-xs text-gray-500">{manualPreview.ubicacion}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400">{manualPreview.codigo}</span>
                </div>
              )}

              {manualError && <p className="text-red-500 text-sm">{manualError}</p>}

              {manualPreview && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAnadirManual}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Añadir entrada
                  </button>
                  <button
                    onClick={() => setManualPreview(null)}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel derecho — tabla */}
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
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

          {/* Tabla */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <Th col="codigo_usuario">Código</Th>
                  <Th col="nombre">Nombre</Th>
                  <Th col="curso">Curso</Th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagina.map((e, i) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{e.codigo_usuario || '—'}</td>
                    <td className="px-4 py-3 font-medium">{e.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{e.curso}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(e.id)}
                        title="Eliminar entrada"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!pagina.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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

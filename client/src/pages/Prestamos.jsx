import { useEffect, useState } from "react";
import api from "../services/api";

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [filtro, setFiltro] = useState("0");
  const [modal, setModal] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [libros, setLibros] = useState([]);
  const [form, setForm] = useState({
    id_usuario: "",
    id_libro: "",
    fecha_inicio: "",
    fecha_devolucion_prevista: "",
  });
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    const { data } = await api.get(`/prestamos?devuelto=${filtro}`);
    setPrestamos(data);
  };

  useEffect(() => {
    load();
  }, [filtro]);

  const openModal = async () => {
    const [u, l] = await Promise.all([
      api.get("/usuarios"),
      api.get("/libros?estado=disponible"),
    ]);
    setUsuarios(u.data);
    setLibros(l.data);
    setForm({
      id_usuario: "",
      id_libro: "",
      fecha_inicio: today,
      fecha_devolucion_prevista: "",
    });
    setError("");
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/prestamos", form);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear préstamo");
    }
  };

  const handleDevolver = async (id) => {
    if (!confirm("¿Registrar devolución?")) return;
    await api.put(`/prestamos/${id}/devolver`, {
      fecha_devolucion_real: today,
    });
    load();
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const vencido = (p) =>
    p.fecha_devolucion_prevista &&
    p.fecha_devolucion_prevista < today &&
    !p.devuelto;

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

      <div className="flex gap-2 mb-4">
        {[
          ["0", "Activos"],
          ["1", "Devueltos"],
          ["", "Todos"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFiltro(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtro === v ? "bg-brand-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Libro</th>
              <th className="px-4 py-3 text-left">Inicio</th>
              <th className="px-4 py-3 text-left">Dev. prevista</th>
              <th className="px-4 py-3 text-left">Dev. real</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prestamos.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-gray-50 ${vencido(p) ? "bg-red-50" : ""}`}
              >
                <td className="px-4 py-3">
                  {p.usuario_nombre} {p.usuario_apellidos}
                </td>
                <td className="px-4 py-3">{p.libro_titulo}</td>
                <td className="px-4 py-3">{p.fecha_inicio}</td>
                <td className="px-4 py-3">
                  {p.fecha_devolucion_prevista ? (
                    <span
                      className={vencido(p) ? "text-red-600 font-semibold" : ""}
                    >
                      {p.fecha_devolucion_prevista}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{p.fecha_devolucion_real || "—"}</td>
                <td className="px-4 py-3">
                  {!p.devuelto && (
                    <button
                      onClick={() => handleDevolver(p.id)}
                      className="text-green-600 hover:underline text-xs"
                    >
                      Devolver
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!prestamos.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Sin préstamos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                  onChange={(e) => set("id_usuario", e.target.value)}
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
                  onChange={(e) => set("id_libro", e.target.value)}
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
                    onChange={(e) => set("fecha_inicio", e.target.value)}
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
                      set("fecha_devolucion_prevista", e.target.value)
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
    </div>
  );
}

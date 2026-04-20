import { useEffect, useState } from 'react';
import api from '../services/api';
import { fmt } from '../utils/dates';

function StatCard({ label, value, color }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${color}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  const finDeSemana = (() => {
    const d = new Date();
    const diff = 7 - (d.getDay() === 0 ? 7 : d.getDay()); // días hasta domingo
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    const fetchData = async () => {
      const [libros, activos, registro] = await Promise.all([
        api.get('/libros'),
        api.get('/prestamos?devuelto=0'),
        api.get(`/registro?fecha=${today}`),
      ]);
      const ls = libros.data;
      setStats({
        no_dispo: ls.filter((l) => l.estado === 'no disponible').length,
        disponibles: ls.filter((l) => l.estado === 'disponible').length,
        prestados: ls.filter((l) => l.estado === 'prestado').length,
        extraviados: ls.filter((l) => l.estado === 'extraviado').length,
        prestamosActivos: activos.data.length,
        registroHoy: registro.data.length,
      });
      const estaSemana = activos.data
        .filter(
          (p) =>
            p.fecha_devolucion_prevista >= today &&
            p.fecha_devolucion_prevista <= finDeSemana
        )
        .sort((a, b) =>
          a.fecha_devolucion_prevista.localeCompare(b.fecha_devolucion_prevista)
        );
      setPrestamos(estaSemana);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Libros Disponibles"
          value={stats?.disponibles}
          color="border-brand-500"
        />
        <StatCard
          label="Libros Prestados"
          value={stats?.prestados}
          color="border-yellow-500"
        />
        <StatCard
          label="Libros Extraviados"
          value={stats?.extraviados}
          color="border-red-500"
        />
        <StatCard
          label="Libros no dispo"
          value={stats?.no_dispo}
          color="border-grey-900"
        />
        <StatCard
          label="Préstamos activos"
          value={stats?.prestamosActivos}
          color="border-purple-500"
        />
        <StatCard
          label="Registro hoy"
          value={stats?.registroHoy}
          color="border-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-700">
            Devoluciones esta semana
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Alumno / Profesor</th>
                <th className="px-6 py-3 text-left">Libro</th>
                <th className="px-6 py-3 text-left">F. inicio</th>
                <th className="px-6 py-3 text-left">Dev. prevista</th>
                <th className="px-6 py-3 text-left">Dev. real</th>
                <th className="px-6 py-3 text-left">Devuelto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    {p.usuario_nombre} {p.usuario_apellidos}
                  </td>
                  <td className="px-6 py-3">{p.libro_titulo}</td>
                  <td className="px-6 py-3">{fmt(p.fecha_inicio)}</td>
                  <td className="px-6 py-3">
                    {fmt(p.fecha_devolucion_prevista)}
                  </td>
                  <td className="px-6 py-3">{fmt(p.fecha_devolucion_real)}</td>
                  <td className="px-6 py-3">
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
                </tr>
              ))}
              {!prestamos.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-gray-400"
                  >
                    Ninguna devolución prevista esta semana
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../services/api';

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

  useEffect(() => {
    const fetchData = async () => {
      const [libros, activos, registro] = await Promise.all([
        api.get('/libros'),
        api.get('/prestamos?devuelto=0'),
        api.get(`/registro?fecha=${today}`),
      ]);
      const ls = libros.data;
      setStats({
        total:        ls.length,
        disponibles:  ls.filter(l => l.estado === 'disponible').length,
        prestados:    ls.filter(l => l.estado === 'prestado').length,
        extraviados:  ls.filter(l => l.estado === 'extraviado').length,
        prestamosActivos: activos.data.length,
        registroHoy: registro.data.length,
      });
      setPrestamos(activos.data.slice(0, 8));
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total libros"       value={stats?.total}           color="border-brand-500" />
        <StatCard label="Disponibles"        value={stats?.disponibles}     color="border-green-500" />
        <StatCard label="Prestados"          value={stats?.prestados}       color="border-yellow-500" />
        <StatCard label="Extraviados"        value={stats?.extraviados}     color="border-red-500" />
        <StatCard label="Préstamos activos"  value={stats?.prestamosActivos} color="border-purple-500" />
        <StatCard label="Registro hoy"       value={stats?.registroHoy}    color="border-indigo-500" />
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-700">Préstamos activos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Alumno / Profesor</th>
                <th className="px-6 py-3 text-left">Libro</th>
                <th className="px-6 py-3 text-left">F. inicio</th>
                <th className="px-6 py-3 text-left">Devolución prevista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamos.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{p.usuario_nombre} {p.usuario_apellidos}</td>
                  <td className="px-6 py-3">{p.libro_titulo}</td>
                  <td className="px-6 py-3">{p.fecha_inicio}</td>
                  <td className="px-6 py-3">{p.fecha_devolucion_prevista || '—'}</td>
                </tr>
              ))}
              {!prestamos.length && (
                <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-400">Sin préstamos activos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

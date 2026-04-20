import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';
import { fmt } from '../utils/dates';

export default function MisPrestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get('/prestamos/mis').then((r) => setPrestamos(r.data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const vencido = (p) =>
    p.fecha_devolucion_prevista &&
    p.fecha_devolucion_prevista < today &&
    !p.devuelto;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-300">Biblioteca Juan de Lanuza</p>
          <p className="font-bold">
            Mis préstamos — {user?.nombre} {user?.apellidos}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-brand-200 hover:text-white"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Libro</th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Inicio</th>
                <th className="px-4 py-3 text-left">Dev. prevista</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prestamos.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-gray-50 ${vencido(p) ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{p.libro_titulo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.libro_codigo}
                  </td>
                  <td className="px-4 py-3">{fmt(p.fecha_inicio)}</td>
                  <td className="px-4 py-3">
                    {p.fecha_devolucion_prevista ? (
                      <span className={vencido(p) ? 'text-red-600 font-semibold' : ''}>
                        {fmt(p.fecha_devolucion_prevista)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.devuelto ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        Devuelto
                      </span>
                    ) : vencido(p) ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                        Vencido
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        Activo
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!prestamos.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Sin préstamos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}

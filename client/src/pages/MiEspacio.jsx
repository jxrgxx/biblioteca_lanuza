import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';
import { fmt } from '../utils/dates';

const today = new Date().toISOString().split('T')[0];

const vencido = (p) =>
  p.fecha_devolucion_prevista && p.fecha_devolucion_prevista < today && !p.devuelto;

export default function MiEspacio() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prestamos, setPrestamos] = useState([]);
  const [tab, setTab] = useState('perfil');

  useEffect(() => {
    api.get('/prestamos/mis').then((r) => setPrestamos(r.data));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const activos = prestamos.filter((p) => !p.devuelto);
  const devueltos = prestamos.filter((p) => p.devuelto);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-brand-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-300">Biblioteca Juan de Lanuza</p>
          <p className="font-bold">Mi espacio — {user?.nombre} {user?.apellidos}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-sm text-brand-200 hover:text-white">
            ← Catálogo
          </button>
          <button onClick={handleLogout} className="text-sm text-brand-200 hover:text-white">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto max-w-3xl mx-auto w-full p-6 space-y-6">

        {/* Tabs */}
        <div className="flex gap-2">
          {[['perfil', 'Mi perfil'], ['prestamos', 'Mis préstamos']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Perfil */}
        {tab === 'perfil' && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="font-semibold text-gray-700 text-lg">Información de perfil</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Nombre</p>
                <p className="font-medium text-gray-800">{user?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Apellidos</p>
                <p className="font-medium text-gray-800">{user?.apellidos}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Rol</p>
                <p className="font-medium text-gray-800 capitalize">{user?.rol}</p>
              </div>
              {user?.ubicacion && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Curso / Ubicación</p>
                  <p className="font-medium text-gray-800">{user.ubicacion}</p>
                </div>
              )}
            </div>
            <hr />
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-600">{activos.length}</p>
                <p className="text-gray-500">Préstamos activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{devueltos.length}</p>
                <p className="text-gray-500">Devueltos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  {activos.filter(vencido).length}
                </p>
                <p className="text-gray-500">Vencidos</p>
              </div>
            </div>
          </div>
        )}

        {/* Préstamos */}
        {tab === 'prestamos' && (
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
                  <tr key={p.id} className={`hover:bg-gray-50 ${vencido(p) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{p.libro_titulo}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.libro_codigo}</td>
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
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Devuelto</span>
                      ) : vencido(p) ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Vencido</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Activo</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!prestamos.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin préstamos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

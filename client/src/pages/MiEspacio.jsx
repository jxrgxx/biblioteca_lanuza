import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';
import { fmt } from '../utils/dates';

const today = new Date().toISOString().split('T')[0];
const vencido = (p) =>
  p.fecha_devolucion_prevista &&
  p.fecha_devolucion_prevista < today &&
  !p.devuelto;

const NAV = [
  { id: 'perfil', label: 'Mi perfil', icon: '👤' },
  { id: 'prestamos', label: 'Mis préstamos', icon: '📚' },
];

export default function MiEspacio() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prestamos, setPrestamos] = useState([]);
  const [seccion, setSeccion] = useState('perfil');
  const [sortCol, setSortCol] = useState('fecha_inicio');
  const [sortDir, setSortDir] = useState('desc');

  // Cambio de contraseña
  const [passForm, setPassForm] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  });
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [passMsg, setPassMsg] = useState(null); // { ok, text }
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    api.get('/prestamos/mis').then((r) => setPrestamos(r.data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activos = prestamos.filter((p) => !p.devuelto);
  const devueltos = prestamos.filter((p) => p.devuelto);

  const handleCambiarPass = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (passForm.nueva !== passForm.confirmar) {
      setPassMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    setPassLoading(true);
    try {
      await api.put('/auth/cambiar-password', {
        passwordActual: passForm.actual,
        passwordNueva: passForm.nueva,
      });
      setPassMsg({ ok: true, text: 'Contraseña actualizada correctamente' });
      setPassForm({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      setPassMsg({
        ok: false,
        text: err.response?.data?.error || 'Error al cambiar la contraseña',
      });
    } finally {
      setPassLoading(false);
    }
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortedPrestamos = [...prestamos].sort((a, b) => {
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    const cmp = String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const Th = ({ col, children }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
    >
      {children}
      <span className={`ml-1 ${sortCol === col ? 'text-brand-600' : 'text-gray-300'}`}>
        {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );

  const qrValue = `USR-${String(user?.id).padStart(4, '0')}`;

  const imprimirTarjeta = () => {
    const iframe = document.getElementById('iframe-tarjeta');
    const qrHtml = document.getElementById('tarjeta-qr').innerHTML;
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Tarjeta_${user.apellidos}_${user.nombre}</title>
          <style>
            @font-face { font-family: 'Essai'; src: url('/fonts/Essai.ttf') format('truetype'); }
            @page { size: 85.6mm 54mm; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: Essai, sans-serif;
              width: 85.6mm; height: 54mm;
              display: flex; align-items: stretch;
              background: #fff;
            }
            .franja {
              width: 14mm; background: #7F252E;
              display: flex; align-items: center; justify-content: center;
            }
            .franja span {
              color: white; font-size: 7px; font-weight: bold;
              text-transform: uppercase; letter-spacing: 1px;
              writing-mode: vertical-rl; transform: rotate(180deg);
            }
            .body { flex: 1; padding: 5mm; display: flex; gap: 4mm; align-items: center; }
            .info { flex: 1; }
            .colegio { font-size: 6px; text-transform: uppercase; color: #7F252E; font-weight: bold; letter-spacing: 1px; margin-bottom: 2mm; }
            .nombre { font-size: 13px; font-weight: bold; color: #1e293b; line-height: 1.2; }
            .rol { font-size: 8px; color: #64748b; text-transform: capitalize; margin-top: 1mm; }
            .ubicacion { font-size: 8px; color: #64748b; margin-top: 0.5mm; }
            .email { font-size: 7px; color: #94a3b8; margin-top: 2mm; }
            .codigo { font-size: 8px; font-family: monospace; color: #7F252E; font-weight: bold; margin-top: 1mm; }
            .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 1mm; }
            .qr-wrap svg { width: 22mm !important; height: 22mm !important; }
            .qr-label { font-size: 6px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <div class="franja"><span>Biblioteca Juan de Lanuza</span></div>
          <div class="body">
            <div class="info">
              <div class="colegio">Colegio Juan de Lanuza</div>
              <div class="nombre">${user.nombre}<br>${user.apellidos}</div>
              <div class="rol">${user.rol}</div>
              ${user.ubicacion ? `<div class="ubicacion">${user.ubicacion}</div>` : ''}
              <div class="email">${user.email}</div>
              <div class="codigo">${qrValue}</div>
            </div>
            <div class="qr-wrap">
              ${qrHtml}
              <div class="qr-label">ID usuario</div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-brand-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs text-brand-300">Biblioteca Juan de Lanuza</p>
          <p className="font-bold">
            Mi espacio — {user?.nombre} {user?.apellidos}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-brand-200 hover:text-white transition-colors"
        >
          ← Catálogo
        </button>
      </header>

      {/* BODY */}
      <div className="flex flex-1 min-h-0">
        {/* SIDEBAR */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
          <nav className="flex-1 p-4 space-y-1">
            {NAV.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setSeccion(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  seccion === id
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <span>🚪</span> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-auto p-8">
          {/* ── PERFIL ── */}
          {seccion === 'perfil' && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Mi perfil</h2>

              {/* Datos */}
              <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Nombre', user?.nombre],
                    ['Apellidos', user?.apellidos],
                    ['Email', user?.email],
                    ['Rol', user?.rol],
                    ...(user?.ubicacion
                      ? [['Curso / Ubicación', user.ubicacion]]
                      : []),
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 uppercase mb-1">
                        {label}
                      </p>
                      <p className="font-medium text-gray-800 capitalize">
                        {val}
                      </p>
                    </div>
                  ))}
                </div>
                <hr />
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-600">
                      {activos.length}
                    </p>
                    <p className="text-gray-500">Activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">
                      {devueltos.length}
                    </p>
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

              {/* Tarjeta de usuario */}
              <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-600">
                    Tarjeta de usuario
                  </h3>
                  <button
                    onClick={imprimirTarjeta}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
                  >
                    🖨️ Imprimir tarjeta
                  </button>
                </div>

                {/* Tarjeta visual */}
                <div
                  className="rounded-2xl overflow-hidden border border-slate-200 shadow-md flex"
                  style={{ maxWidth: 380 }}
                >
                  <div className="w-10 bg-brand-600 flex items-center justify-center shrink-0">
                    <span
                      className="text-white text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      Biblioteca Juan de Lanuza
                    </span>
                  </div>
                  <div className="flex-1 p-4 flex gap-4 items-center bg-white">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">
                        Colegio Juan de Lanuza
                      </p>
                      <p className="text-lg font-black text-slate-800 leading-tight">
                        {user?.nombre}
                      </p>
                      <p className="text-lg font-black text-slate-800 leading-tight">
                        {user?.apellidos}
                      </p>
                      <p className="text-xs text-slate-500 capitalize pt-1">
                        {user?.rol}
                      </p>
                      {user?.ubicacion && (
                        <p className="text-xs text-slate-400">
                          {user.ubicacion}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs font-mono font-bold text-brand-600 pt-1">
                        {qrValue}
                      </p>
                    </div>
                    <div
                      id="tarjeta-qr"
                      className="shrink-0 bg-white p-2 rounded-xl border border-slate-100 shadow-sm"
                    >
                      <QRCodeSVG
                        value={qrValue}
                        size={80}
                        level="H"
                        fgColor="#1e293b"
                      />
                    </div>
                  </div>
                </div>

                <iframe id="iframe-tarjeta" style={{ display: 'none' }} />
              </div>

              {/* Cambiar contraseña */}
              <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <h3 className="font-semibold text-gray-600">
                  Cambiar contraseña
                </h3>
                <form onSubmit={handleCambiarPass} className="space-y-3">
                  {[
                    {
                      key: 'actual',
                      label: 'Contraseña actual',
                      show: showActual,
                      toggle: () => setShowActual((v) => !v),
                    },
                    {
                      key: 'nueva',
                      label: 'Nueva contraseña',
                      show: showNueva,
                      toggle: () => setShowNueva((v) => !v),
                    },
                    {
                      key: 'confirmar',
                      label: 'Confirmar nueva',
                      show: showNueva,
                      toggle: null,
                    },
                  ].map(({ key, label, show, toggle }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={show ? 'text' : 'password'}
                          required
                          value={passForm[key]}
                          onChange={(e) =>
                            setPassForm((f) => ({
                              ...f,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        {toggle && (
                          <button
                            type="button"
                            onClick={toggle}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {passMsg && (
                    <p
                      className={`text-sm ${passMsg.ok ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {passMsg.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={passLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-600 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    {passLoading ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── PRÉSTAMOS ── */}
          {seccion === 'prestamos' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Mis préstamos
              </h2>
              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <Th col="libro_titulo">Libro</Th>
                      <Th col="libro_codigo">Código</Th>
                      <Th col="fecha_inicio">Inicio</Th>
                      <Th col="fecha_devolucion_prevista">Dev. prevista</Th>
                      <Th col="devuelto">Estado</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedPrestamos.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50 ${vencido(p) ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {p.libro_titulo}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                          {p.libro_codigo}
                        </td>
                        <td className="px-4 py-3">{fmt(p.fecha_inicio)}</td>
                        <td className="px-4 py-3">
                          {p.fecha_devolucion_prevista ? (
                            <span
                              className={
                                vencido(p) ? 'text-red-600 font-semibold' : ''
                              }
                            >
                              {fmt(p.fecha_devolucion_prevista)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {p.devuelto ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                              Devuelto
                            </span>
                          ) : vencido(p) ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                              Vencido
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs">
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
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

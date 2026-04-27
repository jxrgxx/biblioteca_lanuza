import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Users, BarChart2, CalendarDays, TrendingUp } from 'lucide-react';
import api from '../services/api';

const hoy = new Date();
const fmt = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('es', { month: 'short', year: 'numeric' });
};

const RANGOS = [
  { label: 'Este mes',        desde: () => hoy.toISOString().slice(0, 7) + '-01',        hasta: () => hoy.toISOString().slice(0, 10) },
  { label: 'Este trimestre',  desde: () => trimestreDesde(),                              hasta: () => hoy.toISOString().slice(0, 10) },
  { label: 'Este año',        desde: () => `${hoy.getFullYear()}-01-01`,                  hasta: () => hoy.toISOString().slice(0, 10) },
  { label: 'Curso escolar',   desde: () => cursoDesde(),                                  hasta: () => cursoHasta() },
  { label: 'Todo',            desde: () => '',                                             hasta: () => '' },
  { label: 'Personalizado',   desde: null,                                                 hasta: null },
];

function trimestreDesde() {
  const m = hoy.getMonth();
  const t = Math.floor(m / 3) * 3;
  return `${hoy.getFullYear()}-${String(t + 1).padStart(2, '0')}-01`;
}

function cursoDesde() {
  const y = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${y}-09-01`;
}

function cursoHasta() {
  const y = hoy.getMonth() >= 8 ? hoy.getFullYear() + 1 : hoy.getFullYear();
  return `${y}-06-30`;
}

function Bar({ value, max, color = 'bg-brand-600' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-6 text-right">{value}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-brand-600" />
        <h2 className="font-semibold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Estadisticas() {
  const [rangoIdx, setRangoIdx] = useState(2); // Este año por defecto
  const [desde, setDesde] = useState(RANGOS[2].desde());
  const [hasta, setHasta] = useState(RANGOS[2].hasta());

  const [resumen, setResumen]       = useState(null);
  const [librosTop, setLibrosTop]   = useState([]);
  const [alumnosTop, setAlumnosTop] = useState([]);
  const [presMes, setPresMes]       = useState([]);
  const [regMes, setRegMes]         = useState([]);
  const [cursosTop, setCursosTop]   = useState([]);
  const [loading, setLoading]       = useState(false);

  const qs = useCallback(() => {
    const p = new URLSearchParams();
    if (desde) p.set('desde', desde);
    if (hasta) p.set('hasta', hasta);
    return p.toString();
  }, [desde, hasta]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = qs();
      const [r, l, a, pm, rm, c] = await Promise.all([
        api.get(`/estadisticas/resumen?${q}`),
        api.get(`/estadisticas/libros-top?${q}&limit=10`),
        api.get(`/estadisticas/alumnos-top?${q}&limit=10`),
        api.get(`/estadisticas/prestamos-por-mes?${q}`),
        api.get(`/estadisticas/registro-por-mes?${q}`),
        api.get(`/estadisticas/cursos-top?${q}&limit=12`),
      ]);
      setResumen(r.data);
      setLibrosTop(l.data);
      setAlumnosTop(a.data);
      setPresMes(pm.data);
      setRegMes(rm.data);
      setCursosTop(c.data);
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => { load(); }, [load]);

  const handleRango = (idx) => {
    setRangoIdx(idx);
    const r = RANGOS[idx];
    if (r.desde !== null) {
      setDesde(r.desde());
      setHasta(r.hasta());
    }
  };

  const maxLibros  = librosTop[0]?.total  ?? 1;
  const maxAlumnos = alumnosTop[0]?.total ?? 1;
  const maxCursos  = cursosTop[0]?.total  ?? 1;
  const maxPresMes = Math.max(...presMes.map((m) => m.total), 1);
  const maxRegMes  = Math.max(...regMes.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Estadísticas</h1>
        {loading && <span className="text-xs text-gray-400">Cargando...</span>}
      </div>

      {/* Selector de rango */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {RANGOS.map((r, i) => (
            <button
              key={r.label}
              onClick={() => handleRango(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                rangoIdx === i
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {rangoIdx === 5 && (
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              onClick={load}
              className="px-4 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
            >
              Aplicar
            </button>
          </div>
        )}
        {(desde || hasta) && rangoIdx !== 5 && (
          <p className="text-xs text-gray-400">
            {desde ? desde : '—'} → {hasta ? hasta : hoy.toISOString().slice(0, 10)}
          </p>
        )}
      </div>

      {/* ── PRÉSTAMOS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-brand-600" />
          <h2 className="text-lg font-bold text-gray-700">Préstamos</h2>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {resumen && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Totales',  value: resumen.total,    color: 'text-brand-600' },
              { label: 'Activos',  value: resumen.activos,  color: 'text-blue-600'  },
              { label: 'Devueltos',value: resumen.devueltos,color: 'text-green-600' },
              { label: 'Vencidos', value: resumen.vencidos, color: 'text-red-500'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl shadow p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Libros más prestados" icon={BookOpen}>
            {librosTop.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
            ) : (
              <ol className="space-y-3">
                {librosTop.map((l, i) => (
                  <li key={l.codigo} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{l.titulo}</p>
                      <p className="text-xs text-gray-400 truncate">{l.autor} · <span className="font-mono">{l.codigo}</span></p>
                    </div>
                    <Bar value={l.total} max={maxLibros} />
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Alumnos más activos" icon={Users}>
            {alumnosTop.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
            ) : (
              <ol className="space-y-3">
                {alumnosTop.map((u, i) => (
                  <li key={u.codigo} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.nombre} {u.apellidos}</p>
                      <p className="text-xs text-gray-400">{u.ubicacion || '—'} · <span className="font-mono">{u.codigo}</span></p>
                    </div>
                    <Bar value={u.total} max={maxAlumnos} color="bg-blue-500" />
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Préstamos por mes" icon={TrendingUp} className="xl:col-span-2">
            {presMes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {presMes.map((m) => (
                  <div key={m.mes} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{fmt(m.mes)}</span>
                    <Bar value={m.total} max={maxPresMes} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── REGISTRO DIARIO ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-purple-600" />
          <h2 className="text-lg font-bold text-gray-700">Registro diario</h2>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {resumen && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{resumen.visitas}</p>
              <p className="text-xs text-gray-400 mt-1">Visitas totales</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Visitas por mes" icon={CalendarDays}>
            {regMes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
            ) : (
              <div className="space-y-2">
                {regMes.map((m) => (
                  <div key={m.mes} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 shrink-0">{fmt(m.mes)}</span>
                    <Bar value={m.total} max={maxRegMes} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Cursos con más visitas" icon={BarChart2}>
            {cursosTop.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin datos en este período</p>
            ) : (
              <div className="space-y-3">
                {cursosTop.map((c, i) => (
                  <div key={c.curso} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <span className="text-sm text-gray-700 w-24 shrink-0">{c.curso}</span>
                    <Bar value={c.total} max={maxCursos} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

    </div>
  );
}

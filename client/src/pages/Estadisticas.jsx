import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  BookX,
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarDays,
  BarChart2,
} from 'lucide-react';
import api from '../services/api';

/* ── helpers de fecha ── */
const hoy = new Date();
const fmtMes = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleString('es', {
    month: 'short',
    year: 'numeric',
  });
};
function trimestreDesde() {
  const t = Math.floor(hoy.getMonth() / 3) * 3;
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

const RANGOS = [
  {
    label: 'Este mes',
    desde: () => hoy.toISOString().slice(0, 7) + '-01',
    hasta: () => hoy.toISOString().slice(0, 10),
  },
  {
    label: 'Trimestre',
    desde: trimestreDesde,
    hasta: () => hoy.toISOString().slice(0, 10),
  },
  {
    label: 'Este año',
    desde: () => `${hoy.getFullYear()}-01-01`,
    hasta: () => hoy.toISOString().slice(0, 10),
  },
  { label: 'Curso escolar', desde: cursoDesde, hasta: cursoHasta },
  { label: 'Todo', desde: () => '', hasta: () => '' },
  { label: 'Personalizado', desde: null, hasta: null },
];

/* ── catálogo de estadísticas ── */
const STATS = [
  {
    id: 'libros-top',
    group: 'Préstamos',
    label: 'Libros más prestados',
    icon: BookOpen,
    filters: ['periodo', 'limit'],
    color: 'text-brand-600',
  },
  {
    id: 'alumnos-top',
    group: 'Préstamos',
    label: 'Alumnos más activos',
    icon: Users,
    filters: ['periodo', 'limit'],
    color: 'text-blue-600',
  },
  {
    id: 'prestamos-por-mes',
    group: 'Préstamos',
    label: 'Préstamos por mes',
    icon: TrendingUp,
    filters: ['periodo'],
    color: 'text-brand-600',
  },
  {
    id: 'prestamos-por-curso',
    group: 'Préstamos',
    label: 'Préstamos por curso',
    icon: GraduationCap,
    filters: ['periodo'],
    color: 'text-indigo-600',
  },
  {
    id: 'libros-nunca',
    group: 'Préstamos',
    label: 'Libros nunca prestados',
    icon: BookX,
    filters: [],
    color: 'text-gray-500',
  },
  {
    id: 'tasa-devolucion',
    group: 'Préstamos',
    label: 'Tasa de devolución',
    icon: CheckCircle,
    filters: ['periodo'],
    color: 'text-green-600',
  },
  {
    id: 'tiempo-medio',
    group: 'Préstamos',
    label: 'Tiempo medio de préstamo',
    icon: Clock,
    filters: ['periodo'],
    color: 'text-orange-500',
  },
  {
    id: 'alumnos-morosos',
    group: 'Préstamos',
    label: 'Alumnos con más retrasos',
    icon: AlertCircle,
    filters: ['periodo', 'limit'],
    color: 'text-red-500',
  },
  {
    id: 'registro-por-mes',
    group: 'Registro diario',
    label: 'Visitas por mes',
    icon: CalendarDays,
    filters: ['periodo'],
    color: 'text-purple-600',
  },
  {
    id: 'cursos-top',
    group: 'Registro diario',
    label: 'Cursos con más visitas',
    icon: BarChart2,
    filters: ['periodo', 'limit'],
    color: 'text-purple-600',
  },
  {
    id: 'dia-semana',
    group: 'Registro diario',
    label: 'Visitas por día de semana',
    icon: CalendarDays,
    filters: ['periodo'],
    color: 'text-purple-600',
  },
];

const GROUPS = [...new Set(STATS.map((s) => s.group))];
const LIMITS = [5, 10, 20, 50];

/* ── componentes visuales ── */
function Bar({ value, max, color = 'bg-brand-600' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-7 text-right shrink-0">
        {value}
      </span>
    </div>
  );
}

function KPI({ label, value, color = 'text-brand-600', sub }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-gray-400 text-center py-8">
      Sin datos para este período
    </p>
  );
}

/* ── filtros compartidos ── */
function FiltrosPeriodo({
  rangoIdx,
  setRangoIdx,
  desde,
  setDesde,
  hasta,
  setHasta,
  onAplicar,
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Período
      </p>
      <div className="flex flex-wrap gap-1.5">
        {RANGOS.map((r, i) => (
          <button
            key={r.label}
            onClick={() => {
              setRangoIdx(i);
              if (r.desde !== null) {
                setDesde(r.desde());
                setHasta(r.hasta());
              }
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
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
        <div className="flex flex-wrap gap-2 items-center pt-1">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={onAplicar}
            className="px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}

function FiltroLimit({ value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Mostrar
      </p>
      <div className="flex gap-1.5">
        {LIMITS.map((l) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              value === l
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Top {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── renderizadores por estadística ── */
function RenderLibrosTop({ data }) {
  if (!Array.isArray(data)) return null;
  if (!data.length) return <Empty />;
  const max = data[0].total;
  return (
    <ol className="space-y-3">
      {data.map((l, i) => (
        <li key={l.codigo ?? i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-300 w-5 shrink-0">
            {i + 1}
          </span>
          <div className="min-w-0 w-48">
            <p className="text-sm font-medium text-gray-800 truncate">
              {l.titulo}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {l.autor} · <span className="font-mono">{l.codigo}</span>
            </p>
          </div>
          <Bar value={l.total} max={max} />
        </li>
      ))}
    </ol>
  );
}

function RenderAlumnosTop({ data, color = 'bg-blue-500' }) {
  if (!Array.isArray(data)) return null;
  if (!data.length) return <Empty />;
  const max = data[0].total;
  return (
    <ol className="space-y-3">
      {data.map((u, i) => (
        <li key={u.codigo ?? i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-300 w-5 shrink-0">
            {i + 1}
          </span>
          <div className="min-w-0 w-48">
            <p className="text-sm font-medium text-gray-800 truncate">
              {u.nombre} {u.apellidos}
            </p>
            <p className="text-xs text-gray-400">
              {u.ubicacion || '—'} ·{' '}
              <span className="font-mono">{u.codigo}</span>
            </p>
          </div>
          <Bar value={u.total} max={max} color={color} />
        </li>
      ))}
    </ol>
  );
}

function RenderPorMes({ data, color = 'bg-brand-600' }) {
  if (!Array.isArray(data)) return null;
  const rows = data.filter((m) => m.mes);
  if (!rows.length) return <Empty />;
  const max = Math.max(...rows.map((m) => m.total));
  return (
    <div className="space-y-2">
      {rows.map((m, i) => (
        <div key={m.mes ?? i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 shrink-0">
            {fmtMes(m.mes)}
          </span>
          <Bar value={m.total} max={max} color={color} />
        </div>
      ))}
    </div>
  );
}

function RenderPorCurso({ data, color = 'bg-indigo-500' }) {
  if (!Array.isArray(data)) return null;
  if (!data.length) return <Empty />;
  const max = data[0].total;
  return (
    <div className="space-y-2">
      {data.map((c, i) => (
        <div key={c.curso ?? i} className="flex items-center gap-3">
          <span className="text-xs text-gray-700 w-28 shrink-0">{c.curso}</span>
          <Bar value={c.total} max={max} color={color} />
        </div>
      ))}
    </div>
  );
}

function RenderLibrosNunca({ data }) {
  if (!Array.isArray(data)) return null;
  if (!data.length)
    return (
      <p className="text-sm text-green-600 text-center py-8">
        ¡Todos los libros han sido prestados alguna vez!
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-400 mb-3">
        {data.length} libro{data.length !== 1 ? 's' : ''} sin préstamos
      </p>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Código</th>
            <th className="px-3 py-2 text-left">Título</th>
            <th className="px-3 py-2 text-left">Autor</th>
            <th className="px-3 py-2 text-left">Estantería</th>
            <th className="px-3 py-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((l, i) => (
            <tr key={l.codigo ?? i} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-xs text-gray-500">
                {l.codigo}
              </td>
              <td className="px-3 py-2 font-medium">{l.titulo}</td>
              <td className="px-3 py-2 text-gray-600">{l.autor}</td>
              <td className="px-3 py-2 text-gray-500">{l.estanteria || '—'}</td>
              <td className="px-3 py-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    l.estado === 'disponible'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {l.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderTasa({ data }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KPI label="Préstamos totales" value={data.total} />
        <KPI
          label="Devueltos a tiempo"
          value={data.a_tiempo}
          color="text-green-600"
        />
        <KPI
          label="Devueltos tarde"
          value={data.tarde}
          color="text-orange-500"
        />
        <KPI label="Activos" value={data.activos} color="text-blue-600" />
        <KPI label="Vencidos" value={data.vencidos} color="text-red-500" />
        <KPI
          label="Tasa de puntualidad"
          value={data.tasa !== null ? `${data.tasa}%` : '—'}
          color="text-green-600"
          sub={
            data.tasa !== null ? `de ${data.devueltos} devueltos` : undefined
          }
        />
      </div>
      {data.tasa !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>A tiempo</span>
            <span>{data.tasa}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${data.tasa}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RenderTiempoMedio({ data }) {
  if (!data) return <Empty />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <KPI
          label="Media de días por préstamo"
          value={data.media_dias ? `${data.media_dias} días` : '—'}
          color="text-orange-500"
        />
        <KPI
          label="Media de días de retraso"
          value={data.media_retraso ? `${data.media_retraso} días` : '—'}
          color="text-red-500"
          sub="en préstamos devueltos tarde"
        />
      </div>
      {data.por_curso?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Por curso
          </p>
          <div className="space-y-2">
            {data.por_curso.map((c, i) => {
              const max = Math.max(...data.por_curso.map((x) => x.media_dias));
              return (
                <div key={c.curso ?? i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-28 shrink-0">
                    {c.curso}
                  </span>
                  <Bar value={c.media_dias} max={max} color="bg-orange-400" />
                  <span className="text-xs text-gray-400 shrink-0">
                    ({c.total} prést.)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RenderMorosos({ data }) {
  if (!Array.isArray(data)) return null;
  if (!data.length) return <Empty />;
  const max = data[0].total_vencidos;
  return (
    <ol className="space-y-3">
      {data.map((u, i) => (
        <li key={u.codigo ?? i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-300 w-5 shrink-0">
            {i + 1}
          </span>
          <div className="min-w-0 w-48">
            <p className="text-sm font-medium text-gray-800 truncate">
              {u.nombre} {u.apellidos}
            </p>
            <p className="text-xs text-gray-400">
              {u.ubicacion || '—'} ·{' '}
              <span className="font-mono">{u.codigo}</span>
            </p>
          </div>
          <Bar value={u.total_vencidos} max={max} color="bg-red-400" />
        </li>
      ))}
    </ol>
  );
}

function RenderDiaSemana({ data }) {
  if (!Array.isArray(data)) return null;
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((d) => d.total));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.dia ?? i} className="flex items-center gap-3">
          <span className="text-xs text-gray-700 w-20 shrink-0">{d.dia}</span>
          <Bar value={d.total} max={max} color="bg-purple-500" />
        </div>
      ))}
    </div>
  );
}

/* ── página principal ── */
export default function Estadisticas() {
  const [selected, setSelected] = useState(STATS[0].id);
  const [rangoIdx, setRangoIdx] = useState(2);
  const [desde, setDesde] = useState(RANGOS[2].desde());
  const [hasta, setHasta] = useState(RANGOS[2].hasta());
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadRef = useRef(0);

  const stat = STATS.find((s) => s.id === selected);

  const load = useCallback(async () => {
    const tick = ++loadRef.current;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const p = new URLSearchParams();
      if (desde) p.set('desde', desde);
      if (hasta) p.set('hasta', hasta);
      if (stat.filters.includes('limit')) p.set('limit', limit);

      const endpoint =
        selected === 'libros-nunca'
          ? '/estadisticas/libros-nunca-prestados'
          : `/estadisticas/${selected}`;
      const { data: d } = await api.get(`${endpoint}?${p}`);
      if (tick === loadRef.current) setData(d);
    } catch (err) {
      if (tick === loadRef.current)
        setError(err.response?.data?.error || 'Error al cargar');
    } finally {
      if (tick === loadRef.current) setLoading(false);
    }
  }, [selected, desde, hasta, limit, stat]);

  useEffect(() => {
    if (rangoIdx !== 5) load();
  }, [load]);

  const renderResult = () => {
    if (loading)
      return (
        <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
      );
    if (error)
      return <p className="text-sm text-red-500 text-center py-8">{error}</p>;
    if (!data) return null;
    switch (selected) {
      case 'libros-top':
        return <RenderLibrosTop data={data} />;
      case 'alumnos-top':
        return <RenderAlumnosTop data={data} />;
      case 'prestamos-por-mes':
        return <RenderPorMes data={data} />;
      case 'prestamos-por-curso':
        return <RenderPorCurso data={data} />;
      case 'libros-nunca':
        return <RenderLibrosNunca data={data} />;
      case 'tasa-devolucion':
        return <RenderTasa data={data} />;
      case 'tiempo-medio':
        return <RenderTiempoMedio data={data} />;
      case 'alumnos-morosos':
        return <RenderMorosos data={data} />;
      case 'registro-por-mes':
        return <RenderPorMes data={data} color="bg-purple-500" />;
      case 'cursos-top':
        return <RenderPorCurso data={data} color="bg-purple-500" />;
      case 'dia-semana':
        return <RenderDiaSemana data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Panel izquierdo — lista de estadísticas */}
      <aside className="w-56 shrink-0 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Estadísticas</h1>
        {GROUPS.map((group) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
              {group}
            </p>
            <div className="space-y-0.5">
              {STATS.filter((s) => s.group === group).map((s) => {
                const Icon = s.icon;
                const active = selected === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      active
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon
                      size={15}
                      className={active ? 'text-brand-600' : 'text-gray-400'}
                    />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </aside>

      {/* Panel derecho — filtros + resultado */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = stat.icon;
            return <Icon size={20} className={stat.color} />;
          })()}
          <h2 className="text-xl font-bold text-gray-800">{stat.label}</h2>
        </div>

        {/* Filtros */}
        {stat.filters.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            {stat.filters.includes('periodo') && (
              <FiltrosPeriodo
                rangoIdx={rangoIdx}
                setRangoIdx={setRangoIdx}
                desde={desde}
                setDesde={setDesde}
                hasta={hasta}
                setHasta={setHasta}
                onAplicar={load}
              />
            )}
            {stat.filters.includes('limit') && (
              <FiltroLimit value={limit} onChange={setLimit} />
            )}
          </div>
        )}

        {/* Resultado */}
        <div className="bg-white rounded-xl shadow p-6">{renderResult()}</div>
      </div>
    </div>
  );
}

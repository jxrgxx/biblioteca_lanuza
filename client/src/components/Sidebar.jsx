import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Bookmark,
  Users,
  ClipboardList,
  BarChart2,
  UserCircle,
  LogOut,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/libros', label: 'Libros', icon: BookOpen },
  { to: '/prestamos', label: 'Préstamos', icon: Bookmark },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/registro', label: 'Registro', icon: ClipboardList },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
];

const MIN_WIDTH = 160;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 224;

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() =>
    JSON.parse(localStorage.getItem('sidebar_collapsed') ?? 'false')
  );
  const [width, setWidth] = useState(() =>
    parseInt(localStorage.getItem('sidebar_width') ?? DEFAULT_WIDTH, 10)
  );

  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed);
  }, [collapsed]);
  useEffect(() => {
    localStorage.setItem('sidebar_width', width);
  }, [width]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const next = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startW.current + e.clientX - startX.current)
      );
      setWidth(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDragStart = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const sidebarWidth = collapsed ? 52 : width;

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        transition: dragging.current ? 'none' : 'width 0.2s ease',
      }}
      className="relative h-full bg-brand-700 text-white flex flex-col flex-shrink-0"
    >
      {/* Header */}
      <div
        className={`border-b border-brand-600 flex items-center ${collapsed ? 'justify-center py-4' : 'px-5 py-5'}`}
      >
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-brand-300 uppercase tracking-wider">
              Biblioteca
            </p>
            <p className="font-medium text-lg leading-tight truncate">
              Juan de Lanuza
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className="text-brand-200 hover:text-white transition-colors text-lg leading-none flex-shrink-0"
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center py-3 text-sm transition-colors overflow-hidden whitespace-nowrap
               ${collapsed ? 'justify-center px-0' : 'gap-3 px-5'}
               ${isActive ? 'bg-brand-600 font-semibold' : 'hover:bg-brand-600/60'}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-brand-600 py-3 ${collapsed ? 'flex flex-col items-center gap-2 px-2' : 'px-3 space-y-1.5'}`}
      >
        {!collapsed && (
          <p className="text-xs text-brand-300 truncate px-2 mb-1">
            {user?.nombre} {user?.apellidos}
          </p>
        )}
        <button
          onClick={() => navigate('/mi-espacio')}
          title="Mi espacio"
          className={`w-full flex items-center gap-2.5 rounded-lg text-sm font-medium text-brand-100 hover:text-white hover:bg-white/10 transition-all
            ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
        >
          <UserCircle size={18} className="flex-shrink-0" />
          {!collapsed && 'Mi espacio'}
        </button>
      </div>

      {/* Drag handle */}
      {!collapsed && (
        <div
          onMouseDown={onDragStart}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-brand-400/50 active:bg-brand-300/70 transition-colors"
        />
      )}
    </aside>
  );
}

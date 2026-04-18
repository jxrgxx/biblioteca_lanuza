import { Mail, Clock, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="w-full px-6 md:px-10 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* COLUMNA 1: INFO COLEGIO */}
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="font-bold text-[#7F252E] uppercase tracking-wider text-xs">
              Lanuza Libros
            </span>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="text-xs text-slate-400 hidden md:inline">
              Sistema de gestión bibliotecaria — Colegio Juan de Lanuza
            </span>
          </div>

          {/* COLUMNA 2: HORARIO + UBICACIÓN */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-[#7F252E]" />
              Lun–Vie: 09:00–17:00
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[#7F252E]" />
              2ª Planta
            </span>
            <a
              href="mailto:informatica@juandelanuza.org"
              className="flex items-center gap-1 text-[#7F252E] hover:underline"
            >
              <Mail size={13} />
              informatica@juandelanuza.org
            </a>
          </div>

          {/* COLUMNA 3: CRÉDITOS */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>v1.0.0</span>
            <span className="text-slate-300">|</span>
            <span>
              © {new Date().getFullYear()} Desarrollado por{' '}
              <span className="text-[#7F252E] font-medium">Jorge Lei</span>
            </span>
          </div>

        </div>
      </div>
    </footer>
  );
}

export default Footer;

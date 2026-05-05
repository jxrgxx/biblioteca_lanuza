import { Mail, Clock, MapPin, BookOpen } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="w-full px-6 md:px-10 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* COLUMNA 1: INFO COLEGIO */}
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#7F252E]" />
            <span className="font-bold text-[#7F252E] uppercase tracking-wider text-xs">
              Lanuza Libros
            </span>
            <span className="text-slate-300 hidden md:inline">|</span>
            <span className="text-xs text-slate-400 hidden md:inline">
              Sistema de gestión bibliotecaria - Colegio Juan de Lanuza
            </span>
          </div>

          {/* COLUMNA 2: HORARIO + UBICACIÓN */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-[#7F252E]" />
              Lunes a Viernes
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-[#7F252E]" />
              2ª Planta enfrente de 1º Bach B
            </span>
            <a
              href="mailto:biblioteca@juandelanuza.org"
              className="flex items-center gap-1 text-[#7F252E] hover:underline"
            >
              <Mail size={13} />
              biblioteca@juandelanuza.org
            </a>
          </div>

          {/* COLUMNA 3: CRÉDITOS */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>v1.0.0</span>
            <span className="text-slate-300">|</span>
            <span>
              © {new Date().getFullYear()} Desarrollado por{' '}
              <a
                href="https://www.instagram.com/jorgeee.lp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7F252E] font-medium hover:underline"
              >
                Jorge Lei
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

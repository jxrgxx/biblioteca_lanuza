import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  BookOpen,
  Hash,
  Layers,
  User as UserIcon,
  Building2,
  Globe,
  BookMarked,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import api from '../services/api';

const estadoConfig = {
  disponible: {
    label: 'Disponible',
    icon: CheckCircle2,
    cls: 'bg-green-100 text-green-700 border-green-200',
  },
  prestado: {
    label: 'Prestado',
    icon: XCircle,
    cls: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  extraviado: {
    label: 'Extraviado',
    icon: AlertTriangle,
    cls: 'bg-red-100 text-red-700 border-red-200',
  },
  'no disponible': {
    label: 'No disponible',
    icon: Ban,
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

export default function LibroDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [libro, setLibro] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/libros/${id}`)
      .then((r) => setLibro(r.data))
      .catch(() => setLibro(null))
      .finally(() => setLoading(false));
  }, [id]);

  const imprimirEtiqueta = () => {
    const iframe = document.getElementById('iframe-impresion');
    const contenidoQR = document.getElementById('contenedor-qr').innerHTML;
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Etiqueta_${libro.codigo}</title>
          <style>
            @font-face { font-family: 'Essai'; src: url('/fonts/Essai.ttf') format('truetype'); }
            @page { size: 50mm 50mm; margin: 0; }
            body { font-family: Essai, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .colegio { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #7F252E; }
            .titulo { font-size: 10px; font-weight: bold; margin: 2px 0; max-width: 90%; }
            .codigo { font-size: 9px; font-family: monospace; }
            svg { width: 120px !important; height: 120px !important; }
          </style>
        </head>
        <body>
          <div class="colegio">Colegio Juan de Lanuza</div><br>
          ${contenidoQR}<br>
          <div class="titulo">${libro.titulo}</div>
          <div class="codigo">${libro.codigo}</div>
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 800);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-700 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Cargando ficha...
          </p>
        </div>
      </div>
    );

  if (!libro)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Libro no encontrado</p>
      </div>
    );

  const estado = estadoConfig[libro.estado] ?? estadoConfig['no disponible'];
  const IconEstado = estado.icon;

  const campos = [
    { icon: UserIcon, label: 'Autor', value: libro.autor },
    { icon: Building2, label: 'Editorial', value: libro.editorial },
    { icon: Layers, label: 'Género', value: libro.genero },
    { icon: Globe, label: 'Idioma', value: libro.idioma },
    { icon: BookMarked, label: 'Estantería', value: libro.estanteria },
    {
      icon: BookOpen,
      label: 'Volumen',
      value: libro.volumen ? `Vol. ${libro.volumen}` : null,
    },
    {
      icon: Hash,
      label: 'Código',
      value: libro.codigo,
      mono: true,
      full: true,
    },
  ].filter((c) => c.value);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      {/* NAVBAR */}
      <nav className="bg-brand-600 border-b border-slate-200 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/arbol_logo_transparente.png"
              alt="Logo"
              className="h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-medium text-white uppercase tracking-tighter leading-none">
                Biblioteca
              </h1>
              <p className="text-[10px] text-brand-300 uppercase tracking-widest">
                Juan de Lanuza
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-brand-600 font-medium transition-all px-4 py-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Volver al catálogo</span>
          </button>
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="px-6 py-6 md:px-12 md:py-10 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[480px]">
            {/* PORTADA */}
            <div className="md:w-2/5 lg:w-1/3 bg-slate-100 relative">
              <img
                src={
                  libro.nombre_foto
                    ? `/uploads/${libro.nombre_foto}`
                    : '/portada-default.png'
                }
                onError={(e) => {
                  e.target.src = '/portada-default.png';
                }}
                alt={libro.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* DETALLES */}
            <div className="p-8 md:p-12 md:w-3/5 lg:w-2/3 flex flex-col">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 flex-grow">
                {/* TEXTO */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 leading-[1.1] mb-4">
                      {libro.titulo}
                      {libro.volumen ? ` (Vol. ${libro.volumen})` : ''}
                    </h2>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-medium text-xs uppercase tracking-widest border ${estado.cls}`}
                    >
                      <IconEstado size={14} />
                      {estado.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 border-t border-slate-100 pt-6 text-sm">
                    {campos.map(({ icon: Icon, label, value, mono, full }) => (
                      <p
                        key={label}
                        className={`flex items-center gap-3 text-slate-500 ${full ? 'col-span-full' : ''}`}
                      >
                        <Icon
                          size={18}
                          className="text-brand-700 opacity-80 shrink-0"
                        />
                        <span className="font-bold text-black uppercase text-[11px] tracking-wider w-20 shrink-0">
                          {label}
                        </span>
                        <span className={`flex-1 ${mono ? 'font-mono' : ''}`}>
                          {value}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* QR */}
                <div className="w-full lg:w-52 flex flex-col items-center shrink-0">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center w-full shadow-inner">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      Etiqueta
                    </span>
                    <div
                      id="contenedor-qr"
                      className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 mb-4"
                    >
                      <QRCodeSVG
                        value={libro.codigo}
                        size={130}
                        level="H"
                        fgColor="#1e293b"
                      />
                    </div>
                    <button
                      onClick={imprimirEtiqueta}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-700 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-all active:scale-95"
                    >
                      🖨️ Imprimir etiqueta
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-slate-400 text-[10px] italic">
                * Los préstamos tienen una duración de 15 días naturales.
              </div>
              <iframe id="iframe-impresion" style={{ display: 'none' }} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

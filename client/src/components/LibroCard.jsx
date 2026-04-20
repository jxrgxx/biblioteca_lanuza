import { Link } from 'react-router-dom';

const estadoStyles = {
  disponible: 'bg-green-100 text-green-700 border-green-200',
  prestado: 'bg-orange-100 text-orange-700 border-orange-200',
  extraviado: 'bg-red-100 text-red-700 border-red-200',
  'no disponible': 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function LibroCard({ libro }) {
  const imgSrc = libro.nombre_foto
    ? `/uploads/${libro.nombre_foto}`
    : '/portada-default.png';

  return (
    <Link to={`/libros/${libro.id}`} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer">
      {/* Portada */}
      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
        <img
          src={imgSrc}
          alt={libro.titulo}
          onError={(e) => { e.target.src = '/portada-default.png'; }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`text-[9px] font-medium px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${estadoStyles[libro.estado] ?? estadoStyles['no disponible']}`}
          >
            {libro.estado?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-base text-slate-800 leading-tight mb-3 min-h-[2.8rem] line-clamp-2">
          {libro.titulo}
          {libro.volumen ? ` (Vol. ${libro.volumen})` : ''}
        </h3>

        <div className="text-xs space-y-1.5 text-slate-500 flex-1">
          {libro.autor && (
            <p><span className="font-semibold text-slate-700">Autor: </span>{libro.autor}</p>
          )}
          {libro.genero && (
            <p><span className="font-semibold text-slate-700">Género: </span>{libro.genero}</p>
          )}
          {libro.editorial && (
            <p><span className="font-semibold text-slate-700">Editorial: </span>{libro.editorial}</p>
          )}
          {libro.idioma && (
            <p><span className="font-semibold text-slate-700">Idioma: </span>{libro.idioma}</p>
          )}
          {libro.estanteria && (
            <p><span className="font-semibold text-slate-700">Estantería: </span>{libro.estanteria}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TopBar({ dark = true }) {
  return (
    <header
      className={`absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-6 py-3 ${dark ? "bg-white border-b border-gray-200" : ""}`}
    >
      <img
        src="/arbol_logo_transparente.png"
        alt="Logo"
        className="h-12 object-contain"
      />
      <div>
        <p
          className={`font-bold text-lg leading-tight ${dark ? "text-brand-600" : "text-white"}`}
        >
          Biblioteca
        </p>
        <p
          className={`text-sm leading-tight ${dark ? "text-gray-500" : "text-white/80"}`}
        >
          Lanuza
        </p>
      </div>
    </header>
  );
}

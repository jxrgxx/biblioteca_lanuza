import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CURSOS = [
  '1º Primaria',
  '2º Primaria',
  '3º Primaria',
  '4º Primaria',
  '5º Primaria',
  '6º Primaria',
  '1º ESO',
  '2º ESO',
  '3º ESO',
  '4º ESO',
  '1º Bach',
  '2º Bach',
];

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    rol: 'alumno',
    ubicacion: '',
    codigoRegistro: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.toLowerCase().endsWith('@juandelanuza.org')) {
      setError('El email debe ser del dominio @juandelanuza.org');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        ubicacion: form.rol === 'personal' ? null : form.ubicacion || null,
      };
      const { data } = await api.post('/auth/register', payload);
      login(data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-brand-600">
      {/* Panel izquierdo — foto con semicírculo */}
      <div
        className="hidden xl:flex flex-col items-center justify-center px-16 flex-shrink-0"
        style={{
          width: '52%',
          clipPath: 'circle(100% at 3% 50%)',
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: '75% center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center bg-brand-600 px-8 py-12">
        <div className="w-full max-w-lg bg-white rounded-xl shadow p-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Link to="/">
              <img
                src="/arbol_logo_transparente.png"
                alt="Logo Juan de Lanuza"
                className="h-20 object-contain mb-3"
              />
            </Link>
            <h1 className="text-brand-600 font-bold text-xl leading-tight">
              Biblioteca
            </h1>
            <p className="text-gray-400 text-sm">Juan de Lanuza</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Crear cuenta
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Rellena tus datos para registrarte
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombre
                </label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Apellidos
                </label>
                <input
                  required
                  value={form.apellidos}
                  onChange={(e) => set('apellidos', e.target.value)}
                  className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                  placeholder="Apellidos"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                placeholder="tucorreo@juandelanuza.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Rol
              </label>
              <select
                value={form.rol}
                onChange={(e) => set('rol', e.target.value)}
                className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
              >
                <option value="alumno">Alumno</option>
                <option value="profesorado">Profesorado</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            {form.rol !== 'personal' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Curso / Clase
                </label>
                <select
                  value={form.ubicacion}
                  onChange={(e) => set('ubicacion', e.target.value)}
                  className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                >
                  <option value="">— Selecciona —</option>
                  {CURSOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(form.rol === 'profesorado' || form.rol === 'personal') && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Código de registro *
                </label>
                <input
                  required
                  value={form.codigoRegistro}
                  onChange={(e) =>
                    set('codigoRegistro', e.target.value.toUpperCase())
                  }
                  maxLength={6}
                  placeholder="XXXXXX"
                  className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent font-mono tracking-widest uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Solicita este código al bibliotecario del centro.
                </p>
              </div>
            )}

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-full text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-brand-600 font-medium hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

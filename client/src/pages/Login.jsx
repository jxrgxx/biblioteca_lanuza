import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 429) {
        setError(
          'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.'
        );
      } else {
        setError('Email o contraseña incorrectos');
      }
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
          {/* Logo siempre visible en el formulario */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/arbol_logo_transparente_bordes.png"
              alt="Logo Juan de Lanuza"
              className="h-24 object-contain mb-3"
            />
            <h1 className="text-brand-600 font-bold text-xl leading-tight">
              Biblioteca
            </h1>
            <p className="text-gray-400 text-sm">Juan de Lanuza</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Introduce tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                placeholder="tucorreo@juandelanuza.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 pr-8 text-sm outline-none transition-colors bg-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {error && <p className="mt-5 text-red-500 text-xs">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-full text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-400">
              <Link to="/olvide-password" className="text-brand-600 font-medium hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-sm text-gray-400">
              ¿Sin cuenta?{' '}
              <Link to="/register" className="text-brand-600 font-medium hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

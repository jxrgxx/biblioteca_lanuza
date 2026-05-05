import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function OlvidePassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEnviado(true);
    } catch {
      setError('Error al procesar la solicitud. Inténtalo de nuevo.');
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
        <div className="w-full max-w-lg bg-white rounded-xl shadow p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/">
              <img
                src="/arbol_logo_transparente_bordes.png"
                alt="Logo Juan de Lanuza"
                className="h-24 object-contain mb-3"
              />
            </Link>
            <h1 className="text-brand-600 font-bold text-xl leading-tight">Biblioteca</h1>
            <p className="text-gray-400 text-sm">Juan de Lanuza</p>
          </div>

          {enviado ? (
            /* Estado: email enviado */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Revisa tu correo</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
                El enlace caduca en <strong>1 hora</strong>.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-sm text-brand-600 font-medium hover:underline"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* Formulario */
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">¿Olvidaste tu contraseña?</h2>
              <p className="text-gray-400 text-sm mb-8">
                Escribe tu email y te mandaremos un enlace para crear una nueva.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-b-2 border-gray-200 focus:border-brand-600 px-0 py-2 text-sm outline-none transition-colors bg-transparent"
                    placeholder="tucorreo@juandelanuza.org"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-full text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400">
                <Link to="/login" className="text-brand-600 font-medium hover:underline">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

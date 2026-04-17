import { useEffect, useState } from 'react';
import api from '../services/api';

const CURSOS = ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];

export default function Registro() {
  const today = new Date().toISOString().split('T')[0];
  const [fecha, setFecha]       = useState(today);
  const [entradas, setEntradas] = useState([]);
  const [form, setForm]         = useState({ nombre:'', curso: CURSOS[0], fecha: today });
  const [error, setError]       = useState('');

  const load = async () => {
    const { data } = await api.get(`/registro?fecha=${fecha}`);
    setEntradas(data);
  };

  useEffect(() => { load(); }, [fecha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/registro', { ...form, fecha });
      setForm(f => ({ ...f, nombre: '' }));
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/registro/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Registro diario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Añadir entrada</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
              <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre del alumno"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Curso *</label>
              <select value={form.curso} onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit"
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium">
              Añadir
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">
              Entradas — <span className="text-brand-600">{entradas.length}</span>
            </h2>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entradas.map((e, i) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{e.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{e.curso}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                ))}
                {!entradas.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin entradas para esta fecha</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

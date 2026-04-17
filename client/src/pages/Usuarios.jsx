import { useEffect, useState } from 'react';
import api from '../services/api';

const CURSOS = ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];
const EMPTY  = { nombre:'', apellidos:'', email:'', password:'', rol:'alumno', ubicacion:'' };

const rolBadge = { personal:'bg-purple-100 text-purple-700', profesorado:'bg-brand-100 text-brand-700', alumno:'bg-green-100 text-green-700' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState('');

  const load = async () => { const { data } = await api.get('/usuarios'); setUsuarios(data); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setError(''); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ ...u, password:'' }); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, ubicacion: form.rol === 'personal' ? null : form.ubicacion || null };
      if (editing) await api.put(`/usuarios/${editing.id}`, payload);
      else         await api.post('/usuarios', payload);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Añadir usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.apellidos}, {u.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolBadge[u.rol]}`}>{u.rol}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.ubicacion || '—'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-brand-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {!usuarios.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apellidos *</label>
                  <input required value={form.apellidos} onChange={e => set('apellidos', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contraseña {editing && '(dejar vacío para no cambiar)'}
                </label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  required={!editing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
                  <select value={form.rol} onChange={e => set('rol', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="alumno">Alumno</option>
                    <option value="profesorado">Profesorado</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                {form.rol !== 'personal' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Ubicación</label>
                    <select value={form.ubicacion} onChange={e => set('ubicacion', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— Selecciona —</option>
                      {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg">
                  {editing ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

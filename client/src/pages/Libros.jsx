import { useEffect, useState } from 'react';
import api from '../services/api';

const ESTADOS  = ['disponible','prestado','extraviado','no disponible'];
const CURSOS   = ['1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
                  '1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];
const EMPTY    = { codigo:'', titulo:'', autor:'', editorial:'', volumen:'', idioma:'', genero:'', estanteria:'', estado:'disponible' };

const estadoBadge = { disponible:'bg-green-100 text-green-700', prestado:'bg-yellow-100 text-yellow-700',
                       extraviado:'bg-red-100 text-red-700', 'no disponible':'bg-gray-100 text-gray-600' };

export default function Libros() {
  const [libros, setLibros]   = useState([]);
  const [search, setSearch]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [fotoFile, setFotoFile] = useState(null);
  const [error, setError]     = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (search)      params.set('search', search);
    if (filtroEstado) params.set('estado', filtroEstado);
    const { data } = await api.get(`/libros?${params}`);
    setLibros(data);
  };

  useEffect(() => { load(); }, [search, filtroEstado]);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setFotoFile(null); setError(''); setModal(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...l, volumen: l.volumen ?? '' }); setFotoFile(null); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let libro;
      if (editing) {
        const { data } = await api.put(`/libros/${editing.id}`, form);
        libro = data;
      } else {
        const { data } = await api.post('/libros', form);
        libro = data;
      }
      if (fotoFile) {
        const fd = new FormData();
        fd.append('foto', fotoFile);
        await api.post(`/libros/${libro.id}/foto`, fd);
      }
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este libro?')) return;
    await api.delete(`/libros/${id}`);
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Libros</h1>
        <button onClick={openNew} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Añadir libro
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input placeholder="Buscar por título, autor o código..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Autor</th>
              <th className="px-4 py-3 text-left">Editorial</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Estantería</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {libros.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{l.codigo}</td>
                <td className="px-4 py-3 font-medium">{l.titulo}{l.volumen ? ` (Vol. ${l.volumen})` : ''}</td>
                <td className="px-4 py-3 text-gray-600">{l.autor || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{l.editorial || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[l.estado]}`}>{l.estado}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.estanteria || '—'}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(l)} className="text-brand-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => handleDelete(l.id)} className="text-red-500 hover:underline text-xs">Eliminar</button>
                </td>
              </tr>
            ))}
            {!libros.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar libro' : 'Nuevo libro'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Código *</label>
                  <input required value={form.codigo} onChange={e => set('codigo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Volumen</label>
                  <input type="number" value={form.volumen} onChange={e => set('volumen', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
                <input required value={form.titulo} onChange={e => set('titulo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Autor</label>
                  <input value={form.autor} onChange={e => set('autor', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Editorial</label>
                  <input value={form.editorial} onChange={e => set('editorial', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Idioma</label>
                  <input value={form.idioma} onChange={e => set('idioma', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Género</label>
                  <input value={form.genero} onChange={e => set('genero', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estantería</label>
                  <input value={form.estanteria} onChange={e => set('estanteria', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Foto de portada</label>
                <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg">
                  {editing ? 'Guardar cambios' : 'Crear libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

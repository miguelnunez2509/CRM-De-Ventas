import React, { useEffect, useState, useCallback } from 'react';
import { leadsAPI } from '../api';
import Modal from '../components/Modal';

const STATUS_BADGE = {
  nuevo: 'bg-indigo-100 text-indigo-700',
  contactado: 'bg-amber-100 text-amber-700',
  calificado: 'bg-blue-100 text-blue-700',
  propuesta: 'bg-purple-100 text-purple-700',
  ganado: 'bg-green-100 text-green-700',
  perdido: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', position: '', status: 'nuevo', source: 'manual', value: '', notes: '' };

function LeadForm({ initial = EMPTY_FORM, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Nombre *</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="label">Empresa</label>
          <input className="input" value={form.company} onChange={set('company')} />
        </div>
        <div>
          <label className="label">Cargo</label>
          <input className="input" value={form.position} onChange={set('position')} />
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Fuente</label>
          <select className="input" value={form.source} onChange={set('source')}>
            {['manual', 'web', 'referido', 'linkedin', 'email', 'otro'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Valor estimado ($)</label>
          <input className="input" type="number" min="0" value={form.value} onChange={set('value')} />
        </div>
        <div className="col-span-2">
          <label className="label">Notas</label>
          <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', source: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    leadsAPI.getAll({ ...filters, page, limit: 20 }).then(r => {
      setLeads(r.data.leads);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setSaving(true);
    await leadsAPI.create(form);
    setSaving(false);
    setModal(null);
    load();
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    await leadsAPI.update(selected.id, form);
    setSaving(false);
    setModal(null);
    setSelected(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este lead?')) return;
    await leadsAPI.delete(id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} leads en total</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">+ Nuevo Lead</button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input className="input w-56" placeholder="Buscar por nombre, email..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          <select className="input w-40" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">Todos los estados</option>
            {['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select className="input w-40" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
            <option value="">Todas las fuentes</option>
            {['manual', 'web', 'referido', 'linkedin', 'email', 'otro'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Nombre', 'Empresa', 'Email', 'Estado', 'Fuente', 'Valor', 'Creado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Cargando...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">No hay leads. ¡Crea el primero!</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-3 text-gray-600">{lead.company || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{lead.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[lead.status]}`}>{lead.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{lead.source}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{lead.value ? `$${Number(lead.value).toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(lead.created_at).toLocaleDateString('es')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setSelected(lead); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Editar">✏️</button>
                    <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>Página {page} de {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button className="btn-secondary py-1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
              <button className="btn-secondary py-1" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nuevo Lead">
        <LeadForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={saving} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => { setModal(null); setSelected(null); }} title="Editar Lead">
        {selected && <LeadForm initial={selected} onSubmit={handleUpdate} onCancel={() => { setModal(null); setSelected(null); }} loading={saving} />}
      </Modal>
    </div>
  );
}

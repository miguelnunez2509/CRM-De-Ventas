import React, { useEffect, useState, useCallback } from 'react';
import { activitiesAPI, leadsAPI } from '../api';
import Modal from '../components/Modal';

const TYPE_ICON = { llamada: '📞', email: '📧', reunion: '🤝', tarea: '✅', nota: '📝' };
const TYPE_COLOR = { llamada: 'bg-blue-100 text-blue-700', email: 'bg-purple-100 text-purple-700', reunion: 'bg-amber-100 text-amber-700', tarea: 'bg-indigo-100 text-indigo-700', nota: 'bg-gray-100 text-gray-700' };

const EMPTY = { lead_id: '', type: 'tarea', title: '', description: '', scheduled_at: '' };

function ActivityForm({ initial = EMPTY, onSubmit, onCancel, loading, leads }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <label className="label">Título *</label>
        <input className="input" value={form.title} onChange={set('title')} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {['llamada', 'email', 'reunion', 'tarea', 'nota'].map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Lead asociado</label>
          <select className="input" value={form.lead_id} onChange={set('lead_id')}>
            <option value="">Sin asociar</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Fecha programada</label>
        <input className="input" type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input" rows={3} value={form.description} onChange={set('description')} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ type: '', completed: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      activitiesAPI.getAll(filters),
      leadsAPI.getAll({ limit: 200 }),
    ]).then(([a, l]) => {
      setActivities(a.data.activities);
      setTotal(a.data.total);
      setLeads(l.data.leads);
    }).finally(() => setLoading(false));
  }, [filters]);

  useEffect(load, [load]);

  const handleCreate = async (form) => {
    setSaving(true);
    await activitiesAPI.create({ ...form, lead_id: form.lead_id || null });
    setSaving(false);
    setModal(null);
    load();
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    await activitiesAPI.update(selected.id, form);
    setSaving(false);
    setModal(null);
    setSelected(null);
    load();
  };

  const handleToggle = async (id) => {
    await activitiesAPI.toggleComplete(id);
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: a.completed ? 0 : 1 } : a));
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    await activitiesAPI.delete(id);
    load();
  };

  const pending = activities.filter(a => !a.completed).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pending} pendientes de {total}</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">+ Nueva Actividad</button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select className="input w-44" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">Todos los tipos</option>
            {['llamada', 'email', 'reunion', 'tarea', 'nota'].map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t}</option>)}
          </select>
          <select className="input w-44" value={filters.completed} onChange={e => setFilters(f => ({ ...f, completed: e.target.value }))}>
            <option value="">Todos</option>
            <option value="0">Pendientes</option>
            <option value="1">Completadas</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="card text-center py-12 text-gray-400">Cargando...</div>
        ) : activities.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">Sin actividades. ¡Crea la primera!</div>
        ) : activities.map(activity => (
          <div key={activity.id} className={`card flex items-start gap-3 ${activity.completed ? 'opacity-60' : ''}`}>
            <button onClick={() => handleToggle(activity.id)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${activity.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}>
              {activity.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ${TYPE_COLOR[activity.type]}`}>{TYPE_ICON[activity.type]} {activity.type}</span>
                <p className={`font-medium text-gray-900 text-sm ${activity.completed ? 'line-through' : ''}`}>{activity.title}</p>
              </div>
              {activity.lead_name && <p className="text-xs text-gray-500 mt-0.5">Lead: {activity.lead_name}{activity.lead_company ? ` · ${activity.lead_company}` : ''}</p>}
              {activity.description && <p className="text-xs text-gray-400 mt-1">{activity.description}</p>}
              {activity.scheduled_at && <p className="text-xs text-gray-400 mt-1">📅 {new Date(activity.scheduled_at).toLocaleString('es')}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setSelected(activity); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">✏️</button>
              <button onClick={() => handleDelete(activity.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nueva Actividad">
        <ActivityForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={saving} leads={leads} />
      </Modal>
      <Modal open={modal === 'edit'} onClose={() => { setModal(null); setSelected(null); }} title="Editar Actividad">
        {selected && <ActivityForm initial={{ ...selected, lead_id: selected.lead_id || '' }} onSubmit={handleUpdate} onCancel={() => { setModal(null); setSelected(null); }} loading={saving} leads={leads} />}
      </Modal>
    </div>
  );
}

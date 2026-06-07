import React, { useEffect, useState } from 'react';
import { pipelineAPI, leadsAPI } from '../api';
import Modal from '../components/Modal';

function DealCard({ deal, onMove, onEdit, onDelete, stages }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{deal.lead_name}</p>
          {deal.lead_company && <p className="text-xs text-gray-500 truncate">{deal.lead_company}</p>}
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => onEdit(deal)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Editar">✏️</button>
          <button onClick={() => onDelete(deal.id)} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Eliminar">🗑️</button>
        </div>
      </div>
      {deal.value > 0 && (
        <p className="text-sm font-semibold text-green-600 mt-2">${Number(deal.value).toLocaleString()}</p>
      )}
      {deal.expected_close && (
        <p className="text-xs text-gray-400 mt-1">Cierre: {new Date(deal.expected_close).toLocaleDateString('es')}</p>
      )}
      <div className="mt-2">
        <select
          className="w-full text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 bg-gray-50"
          value={deal.stage_id}
          onChange={(e) => onMove(deal.id, Number(e.target.value))}
        >
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  );
}

const EMPTY_DEAL = { lead_id: '', stage_id: '', value: '', probability: 50, expected_close: '', notes: '' };

export default function Pipeline() {
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_DEAL);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([pipelineAPI.getStages(), pipelineAPI.getDeals(), leadsAPI.getAll({ limit: 200 })]).then(([s, d, l]) => {
      setStages(s.data);
      setDeals(d.data);
      setLeads(l.data.leads);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleMove = async (dealId, stageId) => {
    await pipelineAPI.moveDeal(dealId, stageId);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d));
  };

  const handleCreate = async () => {
    setSaving(true);
    await pipelineAPI.createDeal({ ...form, lead_id: Number(form.lead_id), stage_id: Number(form.stage_id) });
    setSaving(false);
    setModal(null);
    setForm(EMPTY_DEAL);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este deal?')) return;
    await pipelineAPI.deleteDeal(id);
    load();
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const totalValue = deals.reduce((s, d) => s + (d.value || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{deals.length} deals · Valor total: ${totalValue.toLocaleString()}</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">+ Nuevo Deal</button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map(stage => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
            return (
              <div key={stage.id} className="w-64 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-sm font-semibold text-gray-700">{stage.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{stageDeals.length}</span>
                </div>
                {stageValue > 0 && <p className="text-xs text-gray-400 px-1 mb-2">${stageValue.toLocaleString()}</p>}
                <div className="space-y-2 min-h-24 bg-gray-100/60 rounded-xl p-2">
                  {stageDeals.map(deal => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stages={stages}
                      onMove={handleMove}
                      onEdit={(d) => { setForm({ ...d, lead_id: String(d.lead_id), stage_id: String(d.stage_id) }); setModal('edit'); }}
                      onDelete={handleDelete}
                    />
                  ))}
                  {stageDeals.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Sin deals</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => { setModal(null); setForm(EMPTY_DEAL); }} title={modal === 'create' ? 'Nuevo Deal' : 'Editar Deal'}>
        <div className="space-y-4">
          <div>
            <label className="label">Lead *</label>
            <select className="input" value={form.lead_id} onChange={set('lead_id')} required>
              <option value="">Seleccionar lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Etapa *</label>
            <select className="input" value={form.stage_id} onChange={set('stage_id')} required>
              <option value="">Seleccionar etapa...</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor ($)</label>
              <input className="input" type="number" min="0" value={form.value} onChange={set('value')} />
            </div>
            <div>
              <label className="label">Probabilidad (%)</label>
              <input className="input" type="number" min="0" max="100" value={form.probability} onChange={set('probability')} />
            </div>
          </div>
          <div>
            <label className="label">Fecha estimada de cierre</label>
            <input className="input" type="date" value={form.expected_close} onChange={set('expected_close')} />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setModal(null); setForm(EMPTY_DEAL); }} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={saving || !form.lead_id || !form.stage_id} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

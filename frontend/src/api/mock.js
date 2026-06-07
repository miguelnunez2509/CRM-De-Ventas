const KEYS = { leads: 'crm_leads', activities: 'crm_activities', pipeline_stages: 'crm_stages', pipeline_deals: 'crm_deals' };

let _id = Number(localStorage.getItem('crm_next_id') || 1);
function nextId() { const id = _id++; localStorage.setItem('crm_next_id', _id); return id; }

function getAll(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function saveAll(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function now() { return new Date().toISOString(); }

function seedIfEmpty() {
  if (getAll(KEYS.pipeline_stages).length === 0) {
    saveAll(KEYS.pipeline_stages, [
      { id: 1, name: 'Prospecto', color: '#6366f1', order_index: 1 },
      { id: 2, name: 'Contactado', color: '#f59e0b', order_index: 2 },
      { id: 3, name: 'Propuesta Enviada', color: '#3b82f6', order_index: 3 },
      { id: 4, name: 'Negociación', color: '#8b5cf6', order_index: 4 },
      { id: 5, name: 'Cerrado Ganado', color: '#10b981', order_index: 5 },
      { id: 6, name: 'Cerrado Perdido', color: '#ef4444', order_index: 6 },
    ]);
  }
}
seedIfEmpty();

function ok(data) { return Promise.resolve({ data }); }

export const mockLeadsAPI = {
  getAll({ search = '', status = '', source = '', page = 1, limit = 20 } = {}) {
    let leads = getAll(KEYS.leads);
    if (status) leads = leads.filter(l => l.status === status);
    if (source) leads = leads.filter(l => l.source === source);
    if (search) leads = leads.filter(l => [l.name, l.email, l.company].some(f => f?.toLowerCase().includes(search.toLowerCase())));
    const total = leads.length;
    leads = leads.slice((page - 1) * limit, page * limit);
    return ok({ leads, total, page, pages: Math.ceil(total / limit) });
  },
  getById(id) {
    const lead = getAll(KEYS.leads).find(l => l.id === Number(id));
    const activities = getAll(KEYS.activities).filter(a => a.lead_id === Number(id));
    const deals = getAll(KEYS.pipeline_deals).filter(d => d.lead_id === Number(id));
    return ok({ ...lead, activities, deals });
  },
  create(data) {
    const leads = getAll(KEYS.leads);
    const lead = { ...data, id: nextId(), created_at: now(), updated_at: now(), value: data.value || 0 };
    leads.unshift(lead);
    saveAll(KEYS.leads, leads);
    return ok(lead);
  },
  update(id, data) {
    const leads = getAll(KEYS.leads).map(l => l.id === Number(id) ? { ...l, ...data, updated_at: now() } : l);
    saveAll(KEYS.leads, leads);
    return ok(leads.find(l => l.id === Number(id)));
  },
  delete(id) {
    saveAll(KEYS.leads, getAll(KEYS.leads).filter(l => l.id !== Number(id)));
    return ok({ success: true });
  },
};

export const mockActivitiesAPI = {
  getAll({ type = '', completed = '', lead_id = '' } = {}) {
    const leads = getAll(KEYS.leads);
    let acts = getAll(KEYS.activities).map(a => {
      const lead = leads.find(l => l.id === a.lead_id);
      return { ...a, lead_name: lead?.name, lead_company: lead?.company };
    });
    if (type) acts = acts.filter(a => a.type === type);
    if (completed !== '') acts = acts.filter(a => a.completed === Number(completed));
    if (lead_id) acts = acts.filter(a => a.lead_id === Number(lead_id));
    return ok({ activities: acts, total: acts.length });
  },
  create(data) {
    const acts = getAll(KEYS.activities);
    const act = { ...data, id: nextId(), completed: 0, created_at: now() };
    acts.unshift(act);
    saveAll(KEYS.activities, acts);
    return ok(act);
  },
  update(id, data) {
    const acts = getAll(KEYS.activities).map(a => a.id === Number(id) ? { ...a, ...data } : a);
    saveAll(KEYS.activities, acts);
    return ok(acts.find(a => a.id === Number(id)));
  },
  toggleComplete(id) {
    const acts = getAll(KEYS.activities).map(a => a.id === Number(id) ? { ...a, completed: a.completed ? 0 : 1 } : a);
    saveAll(KEYS.activities, acts);
    return ok(acts.find(a => a.id === Number(id)));
  },
  delete(id) {
    saveAll(KEYS.activities, getAll(KEYS.activities).filter(a => a.id !== Number(id)));
    return ok({ success: true });
  },
};

export const mockPipelineAPI = {
  getStages() { return ok(getAll(KEYS.pipeline_stages).sort((a, b) => a.order_index - b.order_index)); },
  createStage(data) {
    const stages = getAll(KEYS.pipeline_stages);
    const stage = { ...data, id: nextId(), order_index: stages.length + 1 };
    stages.push(stage); saveAll(KEYS.pipeline_stages, stages);
    return ok(stage);
  },
  getDeals() {
    const leads = getAll(KEYS.leads);
    const stages = getAll(KEYS.pipeline_stages);
    return ok(getAll(KEYS.pipeline_deals).map(d => {
      const lead = leads.find(l => l.id === d.lead_id) || {};
      const stage = stages.find(s => s.id === d.stage_id) || {};
      return { ...d, lead_name: lead.name, lead_email: lead.email, lead_company: lead.company, lead_phone: lead.phone, stage_name: stage.name, stage_color: stage.color };
    }));
  },
  createDeal(data) {
    const deals = getAll(KEYS.pipeline_deals);
    const deal = { ...data, id: nextId(), created_at: now(), updated_at: now() };
    deals.unshift(deal); saveAll(KEYS.pipeline_deals, deals);
    return ok(deal);
  },
  moveDeal(id, stage_id) {
    const deals = getAll(KEYS.pipeline_deals).map(d => d.id === Number(id) ? { ...d, stage_id: Number(stage_id), updated_at: now() } : d);
    saveAll(KEYS.pipeline_deals, deals);
    return ok(deals.find(d => d.id === Number(id)));
  },
  updateDeal(id, data) {
    const deals = getAll(KEYS.pipeline_deals).map(d => d.id === Number(id) ? { ...d, ...data, updated_at: now() } : d);
    saveAll(KEYS.pipeline_deals, deals);
    return ok(deals.find(d => d.id === Number(id)));
  },
  deleteDeal(id) {
    saveAll(KEYS.pipeline_deals, getAll(KEYS.pipeline_deals).filter(d => d.id !== Number(id)));
    return ok({ success: true });
  },
};

export const mockReportsAPI = {
  getSummary() {
    const leads = getAll(KEYS.leads);
    const acts = getAll(KEYS.activities);
    const deals = getAll(KEYS.pipeline_deals);
    const stages = getAll(KEYS.pipeline_stages);
    const wonStage = stages.find(s => s.name === 'Cerrado Ganado');
    const byStatus = Object.entries(leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {})).map(([status, count]) => ({ status, count }));
    const bySource = Object.entries(leads.reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc; }, {})).map(([source, count]) => ({ source, count }));
    const byType = Object.entries(acts.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {})).map(([type, count]) => ({ type, count }));
    return ok({
      totalLeads: leads.length,
      leadsByStatus: byStatus,
      leadsBySource: bySource,
      totalDealsValue: deals.reduce((s, d) => s + (d.value || 0), 0),
      wonDealsValue: deals.filter(d => d.stage_id === wonStage?.id).reduce((s, d) => s + (d.value || 0), 0),
      activitiesTotal: acts.length,
      activitiesPending: acts.filter(a => !a.completed).length,
      activitiesByType: byType,
    });
  },
  getPipeline() {
    const stages = getAll(KEYS.pipeline_stages);
    const deals = getAll(KEYS.pipeline_deals);
    return ok(stages.map(s => {
      const sd = deals.filter(d => d.stage_id === s.id);
      return { ...s, deals_count: sd.length, total_value: sd.reduce((sum, d) => sum + (d.value || 0), 0), avg_probability: sd.length ? sd.reduce((sum, d) => sum + (d.probability || 0), 0) / sd.length : 0 };
    }));
  },
  getLeadsOverTime(period = 30) {
    const leads = getAll(KEYS.leads);
    const cutoff = new Date(Date.now() - period * 86400000);
    const grouped = leads.filter(l => new Date(l.created_at) >= cutoff).reduce((acc, l) => {
      const date = l.created_at.slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    return ok(Object.entries(grouped).sort().map(([date, count]) => ({ date, count })));
  },
  getConversion() {
    const leads = getAll(KEYS.leads);
    const won = leads.filter(l => l.status === 'ganado').length;
    const lost = leads.filter(l => l.status === 'perdido').length;
    return ok({ total: leads.length, won, lost, inProgress: leads.length - won - lost, conversionRate: leads.length ? ((won / leads.length) * 100).toFixed(1) : 0 });
  },
};

export const mockDataAPI = {
  exportLeads() {
    const leads = getAll(KEYS.leads);
    const headers = ['id','name','email','phone','company','position','status','source','value','notes','created_at'];
    const rows = [headers.join(','), ...leads.map(l => headers.map(h => `"${(l[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads.csv'; a.click();
  },
  exportActivities() {
    const acts = getAll(KEYS.activities);
    const headers = ['id','lead_id','type','title','description','scheduled_at','completed','created_at'];
    const rows = [headers.join(','), ...acts.map(a => headers.map(h => `"${(a[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'activities.csv'; a.click();
  },
  downloadTemplate() {
    const csv = 'name,email,phone,company,position,status,source,value,notes\n"Ejemplo Lead","ejemplo@empresa.com","+1234567890","Empresa SA","Gerente","nuevo","web","5000","Nota de ejemplo"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'template_leads.csv'; a.click();
  },
  importLeads(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const lines = e.target.result.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const leads = getAll(KEYS.leads);
          let imported = 0;
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
            const row = Object.fromEntries(headers.map((h, j) => [h, vals[j] || '']));
            if (!row.name) continue;
            leads.unshift({ ...row, id: nextId(), value: parseFloat(row.value) || 0, created_at: now(), updated_at: now() });
            imported++;
          }
          saveAll(KEYS.leads, leads);
          resolve({ data: { success: true, imported, total: lines.length - 1 } });
        } catch (err) { reject({ response: { data: { error: err.message } } }); }
      };
      reader.readAsText(file);
    });
  },
};

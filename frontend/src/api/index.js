import axios from 'axios';
import { mockLeadsAPI, mockActivitiesAPI, mockPipelineAPI, mockReportsAPI, mockDataAPI } from './mock';

const USE_MOCK = import.meta.env.VITE_MOCK === 'true' || import.meta.env.MODE === 'ghpages';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const leadsAPI = USE_MOCK ? mockLeadsAPI : {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

export const activitiesAPI = USE_MOCK ? mockActivitiesAPI : {
  getAll: (params) => api.get('/activities', { params }),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  toggleComplete: (id) => api.patch(`/activities/${id}/complete`),
  delete: (id) => api.delete(`/activities/${id}`),
};

export const pipelineAPI = USE_MOCK ? mockPipelineAPI : {
  getStages: () => api.get('/pipeline/stages'),
  createStage: (data) => api.post('/pipeline/stages', data),
  getDeals: () => api.get('/pipeline/deals'),
  createDeal: (data) => api.post('/pipeline/deals', data),
  moveDeal: (id, stage_id) => api.patch(`/pipeline/deals/${id}/stage`, { stage_id }),
  updateDeal: (id, data) => api.put(`/pipeline/deals/${id}`, data),
  deleteDeal: (id) => api.delete(`/pipeline/deals/${id}`),
};

export const reportsAPI = USE_MOCK ? mockReportsAPI : {
  getSummary: () => api.get('/reports/summary'),
  getPipeline: () => api.get('/reports/pipeline'),
  getLeadsOverTime: (period) => api.get('/reports/leads-over-time', { params: { period } }),
  getConversion: () => api.get('/reports/conversion'),
};

export const dataAPI = USE_MOCK ? mockDataAPI : {
  exportLeads: () => window.open('/api/data/leads', '_blank'),
  exportActivities: () => window.open('/api/data/activities', '_blank'),
  downloadTemplate: () => window.open('/api/data/template', '_blank'),
  importLeads: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/data/leads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export default api;

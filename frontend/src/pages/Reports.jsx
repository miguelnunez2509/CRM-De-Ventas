import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
const STATUS_COLORS = { nuevo: '#6366f1', contactado: '#f59e0b', calificado: '#3b82f6', propuesta: '#8b5cf6', ganado: '#10b981', perdido: '#ef4444' };

function Section({ title, children }) {
  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [leadsTime, setLeadsTime] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      reportsAPI.getSummary(),
      reportsAPI.getPipeline(),
      reportsAPI.getLeadsOverTime(period),
      reportsAPI.getConversion(),
    ]).then(([s, p, lt, c]) => {
      setSummary(s.data);
      setPipeline(p.data);
      setLeadsTime(lt.data);
      setConversion(c.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [period]);

  const handleExportReport = () => {
    if (!summary || !conversion) return;
    const lines = [
      'REPORTE CRM DE VENTAS',
      `Generado: ${new Date().toLocaleString('es')}`,
      '',
      '=== RESUMEN GENERAL ===',
      `Total Leads: ${summary.totalLeads}`,
      `Tasa de Conversión: ${conversion.conversionRate}%`,
      `Leads Ganados: ${conversion.won}`,
      `Leads Perdidos: ${conversion.lost}`,
      `Leads en Proceso: ${conversion.inProgress}`,
      '',
      '=== PIPELINE ===',
      `Valor Total Pipeline: $${summary.totalDealsValue?.toLocaleString()}`,
      `Valor Ganado: $${summary.wonDealsValue?.toLocaleString()}`,
      '',
      '=== ACTIVIDADES ===',
      `Total Actividades: ${summary.activitiesTotal}`,
      `Pendientes: ${summary.activitiesPending}`,
      `Completadas: ${summary.activitiesTotal - summary.activitiesPending}`,
      '',
      '=== LEADS POR ESTADO ===',
      ...(summary.leadsByStatus?.map(s => `  ${s.status}: ${s.count}`) || []),
      '',
      '=== LEADS POR FUENTE ===',
      ...(summary.leadsBySource?.map(s => `  ${s.source}: ${s.count}`) || []),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reporte-crm-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const pieStatus = summary?.leadsByStatus?.map(s => ({ name: s.status, value: s.count })) || [];
  const pieSource = summary?.leadsBySource?.map(s => ({ name: s.source, value: s.count })) || [];
  const activitiesByType = summary?.activitiesByType || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis detallado del CRM</p>
        </div>
        <button onClick={handleExportReport} className="btn-secondary">⬇️ Exportar Reporte</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: summary?.totalLeads ?? 0, color: 'text-indigo-600' },
          { label: 'Conversión', value: `${conversion?.conversionRate ?? 0}%`, color: 'text-green-600' },
          { label: 'Valor Pipeline', value: `$${(summary?.totalDealsValue ?? 0).toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Actividades Pendientes', value: summary?.activitiesPending ?? 0, color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Leads Ganados</p>
          <p className="text-3xl font-bold text-green-600">{conversion?.won ?? 0}</p>
          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${conversion?.conversionRate ?? 0}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{conversion?.conversionRate}% del total</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Leads Perdidos</p>
          <p className="text-3xl font-bold text-red-500">{conversion?.lost ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">En Proceso</p>
          <p className="text-3xl font-bold text-blue-500">{conversion?.inProgress ?? 0}</p>
        </div>
      </div>

      <Section title="Pipeline por Etapa — Valor acumulado">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pipeline}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
            <Bar dataKey="total_value" name="Valor" radius={[4,4,0,0]}>
              {pipeline.map(e => <Cell key={e.id} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <div className="flex items-center gap-3 mb-2">
        <label className="label mb-0 text-sm text-gray-600">Período:</label>
        <select className="input w-32" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">7 días</option>
          <option value="30">30 días</option>
          <option value="90">90 días</option>
          <option value="365">1 año</option>
        </select>
      </div>

      <Section title={`Leads creados en los últimos ${period} días`}>
        {leadsTime.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Leads" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Distribución por Estado">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieStatus.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#94a3b8'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Distribución por Fuente">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieSource} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieSource.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>

      <Section title="Actividades por Tipo">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activitiesByType} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={60} />
            <Tooltip />
            <Bar dataKey="count" name="Actividades" fill="#6366f1" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

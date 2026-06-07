import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = { nuevo: '#6366f1', contactado: '#f59e0b', calificado: '#3b82f6', propuesta: '#8b5cf6', ganado: '#10b981', perdido: '#ef4444' };
const RADIAN = Math.PI / 180;

function StatCard({ label, value, sub, color = 'text-primary-600' }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [leadsTime, setLeadsTime] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getSummary(),
      reportsAPI.getPipeline(),
      reportsAPI.getLeadsOverTime(30),
      reportsAPI.getConversion(),
    ]).then(([s, p, lt, c]) => {
      setSummary(s.data);
      setPipeline(p.data);
      setLeadsTime(lt.data);
      setConversion(c.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const pieData = summary?.leadsByStatus?.map(s => ({ name: s.status, value: s.count })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del CRM</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={summary?.totalLeads ?? 0} />
        <StatCard label="Valor Pipeline" value={`$${(summary?.totalDealsValue ?? 0).toLocaleString()}`} color="text-green-600" />
        <StatCard label="Deals Ganados" value={`$${(summary?.wonDealsValue ?? 0).toLocaleString()}`} color="text-emerald-600" sub="Valor acumulado" />
        <StatCard label="Tasa Conversión" value={`${conversion?.conversionRate ?? 0}%`} color="text-blue-600" sub={`${conversion?.won ?? 0} ganados de ${conversion?.total ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por Estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pipeline por Etapa</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipeline} margin={{ left: 0, right: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
              <Bar dataKey="total_value" name="Valor" radius={[4, 4, 0, 0]}>
                {pipeline.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads creados (últimos 30 días)</h3>
        {leadsTime.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin datos para mostrar aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leadsTime}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actividades</h3>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{summary?.activitiesTotal ?? 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{summary?.activitiesPending ?? 0}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{(summary?.activitiesTotal ?? 0) - (summary?.activitiesPending ?? 0)}</p>
              <p className="text-xs text-gray-500">Completadas</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Leads por Fuente</h3>
          <div className="space-y-2">
            {(summary?.leadsBySource || []).map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 capitalize">{s.source}</span>
                <span className="font-medium text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

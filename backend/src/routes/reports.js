const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/summary', (req, res) => {
  const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const leadsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
  const leadsBySource = db.prepare('SELECT source, COUNT(*) as count FROM leads GROUP BY source').all();
  const totalDealsValue = db.prepare('SELECT COALESCE(SUM(value), 0) as total FROM pipeline_deals').get().total;
  const wonDealsValue = db.prepare(`
    SELECT COALESCE(SUM(pd.value), 0) as total FROM pipeline_deals pd
    JOIN pipeline_stages ps ON pd.stage_id = ps.id WHERE ps.name = 'Cerrado Ganado'
  `).get().total;
  const activitiesTotal = db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
  const activitiesPending = db.prepare('SELECT COUNT(*) as count FROM activities WHERE completed = 0').get().count;
  const activitiesByType = db.prepare('SELECT type, COUNT(*) as count FROM activities GROUP BY type').all();

  res.json({
    totalLeads,
    leadsByStatus,
    leadsBySource,
    totalDealsValue,
    wonDealsValue,
    activitiesTotal,
    activitiesPending,
    activitiesByType,
  });
});

router.get('/pipeline', (req, res) => {
  const stagesData = db.prepare(`
    SELECT ps.id, ps.name, ps.color, ps.order_index,
           COUNT(pd.id) as deals_count,
           COALESCE(SUM(pd.value), 0) as total_value,
           COALESCE(AVG(pd.probability), 0) as avg_probability
    FROM pipeline_stages ps
    LEFT JOIN pipeline_deals pd ON ps.id = pd.stage_id
    GROUP BY ps.id ORDER BY ps.order_index
  `).all();
  res.json(stagesData);
});

router.get('/leads-over-time', (req, res) => {
  const { period = '30' } = req.query;
  const data = db.prepare(`
    SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count
    FROM leads
    WHERE created_at >= datetime('now', '-${Number(period)} days')
    GROUP BY strftime('%Y-%m-%d', created_at)
    ORDER BY date ASC
  `).all();
  res.json(data);
});

router.get('/activities-over-time', (req, res) => {
  const { period = '30' } = req.query;
  const data = db.prepare(`
    SELECT strftime('%Y-%m-%d', created_at) as date, type, COUNT(*) as count
    FROM activities
    WHERE created_at >= datetime('now', '-${Number(period)} days')
    GROUP BY strftime('%Y-%m-%d', created_at), type
    ORDER BY date ASC
  `).all();
  res.json(data);
});

router.get('/conversion', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
  const won = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'ganado'").get().count;
  const lost = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'perdido'").get().count;
  const inProgress = total - won - lost;
  const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
  res.json({ total, won, lost, inProgress, conversionRate });
});

module.exports = router;

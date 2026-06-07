const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/stages', (req, res) => {
  const stages = db.prepare('SELECT * FROM pipeline_stages ORDER BY order_index').all();
  res.json(stages);
});

router.post('/stages', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const max = db.prepare('SELECT MAX(order_index) as m FROM pipeline_stages').get();
  const result = db.prepare('INSERT INTO pipeline_stages (name, color, order_index) VALUES (?, ?, ?)').run(name, color || '#6366f1', (max.m || 0) + 1);
  res.status(201).json(db.prepare('SELECT * FROM pipeline_stages WHERE id = ?').get(result.lastInsertRowid));
});

router.get('/deals', (req, res) => {
  const deals = db.prepare(`
    SELECT pd.*, l.name as lead_name, l.email as lead_email, l.company as lead_company,
           l.phone as lead_phone, ps.name as stage_name, ps.color as stage_color
    FROM pipeline_deals pd
    JOIN leads l ON pd.lead_id = l.id
    JOIN pipeline_stages ps ON pd.stage_id = ps.id
    ORDER BY pd.created_at DESC
  `).all();
  res.json(deals);
});

router.post('/deals', (req, res) => {
  const { lead_id, stage_id, value, probability, expected_close, notes } = req.body;
  if (!lead_id || !stage_id) return res.status(400).json({ error: 'lead_id y stage_id son requeridos' });
  const result = db.prepare(`
    INSERT INTO pipeline_deals (lead_id, stage_id, value, probability, expected_close, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(lead_id, stage_id, value || 0, probability || 50, expected_close, notes);
  res.status(201).json(db.prepare(`
    SELECT pd.*, l.name as lead_name, ps.name as stage_name, ps.color as stage_color
    FROM pipeline_deals pd JOIN leads l ON pd.lead_id = l.id JOIN pipeline_stages ps ON pd.stage_id = ps.id
    WHERE pd.id = ?
  `).get(result.lastInsertRowid));
});

router.patch('/deals/:id/stage', (req, res) => {
  const { stage_id } = req.body;
  const existing = db.prepare('SELECT id FROM pipeline_deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal no encontrado' });
  db.prepare("UPDATE pipeline_deals SET stage_id = ?, updated_at = datetime('now') WHERE id = ?").run(stage_id, req.params.id);
  res.json(db.prepare(`
    SELECT pd.*, l.name as lead_name, ps.name as stage_name, ps.color as stage_color
    FROM pipeline_deals pd JOIN leads l ON pd.lead_id = l.id JOIN pipeline_stages ps ON pd.stage_id = ps.id
    WHERE pd.id = ?
  `).get(req.params.id));
});

router.put('/deals/:id', (req, res) => {
  const { stage_id, value, probability, expected_close, notes } = req.body;
  const existing = db.prepare('SELECT id FROM pipeline_deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal no encontrado' });
  db.prepare("UPDATE pipeline_deals SET stage_id=?, value=?, probability=?, expected_close=?, notes=?, updated_at=datetime('now') WHERE id=?")
    .run(stage_id, value, probability, expected_close, notes, req.params.id);
  res.json(db.prepare(`
    SELECT pd.*, l.name as lead_name, ps.name as stage_name, ps.color as stage_color
    FROM pipeline_deals pd JOIN leads l ON pd.lead_id = l.id JOIN pipeline_stages ps ON pd.stage_id = ps.id
    WHERE pd.id = ?
  `).get(req.params.id));
});

router.delete('/deals/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM pipeline_deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal no encontrado' });
  db.prepare('DELETE FROM pipeline_deals WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

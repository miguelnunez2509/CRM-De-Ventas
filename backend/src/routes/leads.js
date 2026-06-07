const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const { status, source, search, page = 1, limit = 50 } = req.query;
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (source) { query += ' AND source = ?'; params.push(source); }
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const leads = db.prepare(query).all(...params);
  res.json({ leads, total, page: Number(page), pages: Math.ceil(total / limit) });
});

router.get('/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });
  const activities = db.prepare('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC').all(req.params.id);
  const deals = db.prepare(`
    SELECT pd.*, ps.name as stage_name, ps.color as stage_color
    FROM pipeline_deals pd JOIN pipeline_stages ps ON pd.stage_id = ps.id
    WHERE pd.lead_id = ?
  `).all(req.params.id);
  res.json({ ...lead, activities, deals });
});

router.post('/', (req, res) => {
  const { name, email, phone, company, position, status, source, value, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const result = db.prepare(`
    INSERT INTO leads (name, email, phone, company, position, status, source, value, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, email, phone, company, position, status || 'nuevo', source || 'manual', value || 0, notes);
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(lead);
});

router.put('/:id', (req, res) => {
  const { name, email, phone, company, position, status, source, value, notes } = req.body;
  const existing = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lead no encontrado' });
  db.prepare(`
    UPDATE leads SET name=?, email=?, phone=?, company=?, position=?, status=?, source=?, value=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, email, phone, company, position, status, source, value, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Lead no encontrado' });
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  const { lead_id, type, completed, page = 1, limit = 50 } = req.query;
  let query = `
    SELECT a.*, l.name as lead_name, l.company as lead_company
    FROM activities a LEFT JOIN leads l ON a.lead_id = l.id
    WHERE 1=1
  `;
  const params = [];
  if (lead_id) { query += ' AND a.lead_id = ?'; params.push(lead_id); }
  if (type) { query += ' AND a.type = ?'; params.push(type); }
  if (completed !== undefined) { query += ' AND a.completed = ?'; params.push(Number(completed)); }

  const total = db.prepare(query.replace('SELECT a.*, l.name as lead_name, l.company as lead_company', 'SELECT COUNT(*) as count')).get(...params).count;
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const activities = db.prepare(query).all(...params);
  res.json({ activities, total });
});

router.post('/', (req, res) => {
  const { lead_id, type, title, description, scheduled_at } = req.body;
  if (!title) return res.status(400).json({ error: 'El título es requerido' });
  const result = db.prepare(`
    INSERT INTO activities (lead_id, type, title, description, scheduled_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(lead_id || null, type || 'tarea', title, description, scheduled_at);
  res.status(201).json(db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { type, title, description, scheduled_at, completed } = req.body;
  const existing = db.prepare('SELECT id FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Actividad no encontrada' });
  db.prepare(`
    UPDATE activities SET type=?, title=?, description=?, scheduled_at=?, completed=? WHERE id=?
  `).run(type, title, description, scheduled_at, completed ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id));
});

router.patch('/:id/complete', (req, res) => {
  const existing = db.prepare('SELECT id, completed FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Actividad no encontrada' });
  db.prepare('UPDATE activities SET completed = ? WHERE id = ?').run(existing.completed ? 0 : 1, req.params.id);
  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Actividad no encontrada' });
  db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

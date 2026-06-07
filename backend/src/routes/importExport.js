const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  const csv = stringify(leads, {
    header: true,
    columns: ['id', 'name', 'email', 'phone', 'company', 'position', 'status', 'source', 'value', 'notes', 'created_at', 'updated_at'],
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
  res.send(csv);
});

router.get('/activities', (req, res) => {
  const activities = db.prepare(`
    SELECT a.*, l.name as lead_name FROM activities a LEFT JOIN leads l ON a.lead_id = l.id ORDER BY a.created_at DESC
  `).all();
  const csv = stringify(activities, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="activities.csv"');
  res.send(csv);
});

router.post('/leads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió archivo' });
  try {
    const records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true });
    const insert = db.prepare(`
      INSERT INTO leads (name, email, phone, company, position, status, source, value, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((rows) => {
      let imported = 0;
      for (const row of rows) {
        if (!row.name) continue;
        const validStatuses = ['nuevo', 'contactado', 'calificado', 'propuesta', 'ganado', 'perdido'];
        const validSources = ['manual', 'web', 'referido', 'linkedin', 'email', 'otro'];
        insert.run(
          row.name, row.email || null, row.phone || null, row.company || null, row.position || null,
          validStatuses.includes(row.status) ? row.status : 'nuevo',
          validSources.includes(row.source) ? row.source : 'manual',
          parseFloat(row.value) || 0, row.notes || null
        );
        imported++;
      }
      return imported;
    });
    const imported = insertMany(records);
    res.json({ success: true, imported, total: records.length });
  } catch (err) {
    res.status(400).json({ error: 'Error procesando CSV: ' + err.message });
  }
});

router.get('/template', (req, res) => {
  const template = stringify([{ name: 'Ejemplo Lead', email: 'ejemplo@empresa.com', phone: '+1234567890', company: 'Empresa S.A.', position: 'Gerente', status: 'nuevo', source: 'web', value: '5000', notes: 'Nota de ejemplo' }], { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="template_leads.csv"');
  res.send(template);
});

module.exports = router;

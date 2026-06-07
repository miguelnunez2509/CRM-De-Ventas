const express = require('express');
const cors = require('cors');
const path = require('path');

const leadsRouter = require('./routes/leads');
const activitiesRouter = require('./routes/activities');
const pipelineRouter = require('./routes/pipeline');
const reportsRouter = require('./routes/reports');
const importExportRouter = require('./routes/importExport');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/data', importExportRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

if (IS_PROD) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`CRM Backend corriendo en http://localhost:${PORT}`);
});

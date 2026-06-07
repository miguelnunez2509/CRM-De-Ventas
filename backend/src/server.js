const express = require('express');
const cors = require('cors');

const leadsRouter = require('./routes/leads');
const activitiesRouter = require('./routes/activities');
const pipelineRouter = require('./routes/pipeline');
const reportsRouter = require('./routes/reports');
const importExportRouter = require('./routes/importExport');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/data', importExportRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`CRM Backend corriendo en http://localhost:${PORT}`);
});

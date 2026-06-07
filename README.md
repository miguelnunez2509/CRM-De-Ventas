# CRM de Ventas

CRM completo para prospección y seguimiento de ventas.

## Stack

- **Frontend:** React + Vite + TailwindCSS + Recharts
- **Backend:** Node.js + Express
- **Base de datos:** SQLite (better-sqlite3)

## Módulos

- **Dashboard** — KPIs, gráficos de estado, pipeline y tendencias
- **Leads** — Gestión completa con filtros, búsqueda y paginación
- **Pipeline** — Vista Kanban por etapas con drag de estado
- **Actividades** — Seguimiento de llamadas, emails, reuniones y tareas
- **Reportes** — Gráficos detallados, conversión y exportación de reportes
- **Import/Export** — CSV bidireccional con plantilla descargable

## Instalación y uso

### Backend

```bash
cd backend
npm install
npm run dev      # Puerto 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Puerto 5173
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

## Estructura

```
crm-de-ventas/
├── backend/
│   └── src/
│       ├── database/db.js        # SQLite + schema
│       ├── routes/
│       │   ├── leads.js
│       │   ├── activities.js
│       │   ├── pipeline.js
│       │   ├── reports.js
│       │   └── importExport.js
│       └── server.js
└── frontend/
    └── src/
        ├── api/index.js
        ├── components/
        │   ├── Layout.jsx
        │   └── Modal.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Leads.jsx
            ├── Pipeline.jsx
            ├── Activities.jsx
            ├── Reports.jsx
            └── ImportExport.jsx
```

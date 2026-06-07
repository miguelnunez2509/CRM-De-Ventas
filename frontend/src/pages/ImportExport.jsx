import React, { useState, useRef } from 'react';
import { dataAPI } from '../api';

function Card({ icon, title, description, children }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const res = await dataAPI.importLeads(file);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al importar el archivo');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import / Export</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestiona tus datos en formato CSV</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Exportar datos</h2>

        <Card icon="👥" title="Exportar Leads" description="Descarga todos tus leads en formato CSV, incluyendo estado, fuente, valor y notas.">
          <button onClick={() => dataAPI.exportLeads()} className="btn-primary w-full">⬇️ Descargar leads.csv</button>
        </Card>

        <Card icon="✅" title="Exportar Actividades" description="Descarga el historial completo de actividades con sus leads asociados.">
          <button onClick={() => dataAPI.exportActivities()} className="btn-primary w-full">⬇️ Descargar activities.csv</button>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Importar datos</h2>

        <Card icon="📤" title="Importar Leads desde CSV" description="Sube un archivo CSV con tus leads. Las columnas requeridas: name. Opcionales: email, phone, company, position, status, source, value, notes.">
          <div className="space-y-3">
            <button onClick={() => dataAPI.downloadTemplate()} className="btn-secondary w-full">📄 Descargar plantilla CSV</button>
            <div className="relative">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  importing ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                {importing ? (
                  <div className="flex items-center gap-2 text-primary-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                    <span className="text-sm">Procesando...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-3xl mb-1">📂</span>
                    <span className="text-sm text-gray-600">Arrastra un CSV o haz clic para seleccionar</span>
                    <span className="text-xs text-gray-400 mt-0.5">Máximo 5 MB</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </Card>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-semibold text-sm">Importación exitosa</p>
                <p className="text-xs mt-0.5">{result.imported} leads importados de {result.total} filas procesadas.</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-lg">❌</span>
              <div>
                <p className="font-semibold text-sm">Error en la importación</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card bg-blue-50 border-blue-100">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Formato del CSV para importar</h3>
        <div className="font-mono text-xs text-blue-700 bg-blue-100 rounded-lg p-3 overflow-x-auto">
          name,email,phone,company,position,status,source,value,notes<br/>
          "Juan García","juan@empresa.com","+123456","Empresa SA","Gerente","nuevo","web","5000","Cliente potencial"
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-blue-700"><strong>status</strong> válidos: nuevo, contactado, calificado, propuesta, ganado, perdido</p>
          <p className="text-xs text-blue-700"><strong>source</strong> válidos: manual, web, referido, linkedin, email, otro</p>
        </div>
      </div>
    </div>
  );
}

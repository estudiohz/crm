'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

const SaludSitioPage = () => {
  const [user, setUser] = useState(null);
  const [formularios, setFormularios] = useState([]);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [listening, setListening] = useState(false);
  const [testForm, setTestForm] = useState({
    nombre: '',
    apellido: '',
    webhookUrl: '',
    webhookSecret: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchFormularios = async () => {
      try {
        const response = await fetch(`/api/formularios?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setFormularios(data);
        } else {
          console.error('Error fetching formularios');
        }
      } catch (error) {
        console.error('Error fetching formularios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormularios();
  }, [user]);

  const refreshLogs = () => {
    // In a real app, fetch latest logs from server
    setWebhookLogs(prev => [...prev, {
      id: prev.length + 1,
      timestamp: new Date().toISOString(),
      formularioId: 1,
      data: { refreshed: true, timestamp: new Date().toISOString() }
    }]);
  };

  const toggleListening = () => {
    setListening(!listening);
  };

  const handleTestChange = (e) => {
    const { name, value } = e.target;
    setTestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(testForm.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          nombre: testForm.nombre,
          apellidos: testForm.apellido,
          webhook_secret: testForm.webhookSecret
        }).toString()
      });
      if (response.ok) {
        setWebhookLogs(prev => [...prev, {
          id: prev.length + 1,
          timestamp: new Date().toISOString(),
          formularioId: 'test',
          data: { test: true, nombre: testForm.nombre, apellidos: testForm.apellido }
        }]);
        alert('Test enviado correctamente');
      } else {
        alert('Error en el test: ' + response.status);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Salud del sitio</h1>
        </div>

        <div className="space-y-6">
          {/* Webhooks Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Webhooks</h2>
            <div className="space-y-4">
              {formularios.filter(f => f.webhookUrl).map(formulario => (
                <div key={formulario.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{formulario.nombre}</p>
                    <p className="text-sm text-slate-600">{formulario.webhookUrl}</p>
                    <p className="text-sm text-slate-500">Secret: {formulario.webhookSecret}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      formulario.estado === 'activado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {formulario.estado}
                    </span>
                  </div>
                </div>
              ))}
              {formularios.filter(f => f.webhookUrl).length === 0 && (
                <p className="text-slate-500">No hay webhooks configurados.</p>
              )}
            </div>
          </div>

          {/* Console Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Consola de Webhooks</h2>
              <div className="flex space-x-2">
                <button
                  onClick={toggleListening}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    listening ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  } hover:opacity-80`}
                >
                  <Icon icon="heroicons:play" className="w-4 h-4" />
                  <span>{listening ? 'Escuchando' : 'Play'}</span>
                </button>
                <button
                  onClick={refreshLogs}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
                  <span>Refrescar</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm h-24 overflow-y-auto">
              {webhookLogs.length > 0 ? (
                webhookLogs.map(log => (
                  <div key={log.id} className="mb-4">
                    <div className="text-yellow-400">[{new Date(log.timestamp).toLocaleString()}] Webhook recibido para formulario {log.formularioId}:</div>
                    <pre className="text-green-300">{JSON.stringify(log.data, null, 2)}</pre>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">No hay logs disponibles.</div>
              )}
            </div>
          </div>

          {/* Test Form Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Probar Webhook</h2>
            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={testForm.nombre}
                    onChange={handleTestChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                  />
                </div>
                <div>
                  <label htmlFor="apellido" className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={testForm.apellido}
                    onChange={handleTestChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  id="webhookUrl"
                  name="webhookUrl"
                  value={testForm.webhookUrl}
                  onChange={handleTestChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="webhookSecret" className="block text-sm font-medium text-slate-700 mb-1">Webhook Secret</label>
                <input
                  type="text"
                  id="webhookSecret"
                  name="webhookSecret"
                  value={testForm.webhookSecret}
                  onChange={handleTestChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Probar
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SaludSitioPage;
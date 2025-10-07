'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const ConexionPage = () => {
  const [user, setUser] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setWebhookUrl(`https://crm-panel.g0ncz4.easypanel.host/api/webhooks/${parsedUser.id}`);
      if (parsedUser.webhookSecret) {
        setWebhookSecret(parsedUser.webhookSecret);
        setLoading(false);
      } else {
        // Fetch webhook secret from API
        fetch(`/api/user/webhook-secret?userId=${parsedUser.id}`)
          .then(res => res.json())
          .then(data => {
            setWebhookSecret(data.webhookSecret || '');
            // Update localStorage
            const updatedUser = { ...parsedUser, webhookSecret: data.webhookSecret };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          })
          .catch(err => console.error('Error fetching webhook secret:', err))
          .finally(() => setLoading(false));
      }
    } else {
      setLoading(false);
    }
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  const regenerateSecret = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/regenerate-webhook-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhookSecret(data.newSecret);
        // Update localStorage
        const updatedUser = { ...user, webhookSecret: data.newSecret };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert('Clave secreta regenerada');
      } else {
        alert('Error al regenerar la clave secreta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al regenerar la clave secreta');
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
      <div className="w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Conexión</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#555' }}>
              URL Única del Webhook
            </label>
            <div className="flex">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-800 text-gray-900"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Icon icon="heroicons:clipboard" className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clave Secreta de Autenticación <span className="text-red-500 font-bold">¡IMPORTANTE!</span>
            </label>
            <div className="flex">
              <input
                type="text"
                value={webhookSecret}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#555] text-white"
              />
              <button
                onClick={() => copyToClipboard(webhookSecret)}
                className="px-4 py-2 bg-blue-500 text-white border-l border-gray-300 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Icon icon="heroicons:clipboard" className="w-5 h-5" />
              </button>
              <button
                onClick={regenerateSecret}
                className="px-4 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Icon icon="heroicons:arrow-path" className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones para Elementor</h2>
            <div className="text-sm text-gray-700 space-y-2">
              <p>En tu formulario de Elementor, ve a <strong>Acciones después de enviar</strong> y selecciona <strong>Webhook</strong>.</p>
              <p>Pega la <strong>URL Única del Webhook</strong> (Paso 1) en el campo URL.</p>
              <p>Agrega un nuevo campo de formulario con el tipo <strong>Oculto (Hidden)</strong>.</p>
              <p>En la pestaña <strong>Avanzado</strong> de ese campo oculto, configura el <strong>ID</strong> como <code>webhook_secret</code>.</p>
              <p>Pega la <strong>Clave Secreta de Autenticación</strong> (Paso 2) en el campo <strong>Valor por Defecto (Default Value)</strong> del campo oculto.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConexionPage;
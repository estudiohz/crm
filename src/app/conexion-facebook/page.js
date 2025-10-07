'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const ConexionFacebookPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookPages, setFacebookPages] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // Check if Facebook is connected
      checkFacebookConnection(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const checkFacebookConnection = async (userId) => {
    try {
      const response = await fetch(`/api/facebook/connect?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setFacebookConnected(data.connected || false);
        if (data.pages) {
          setFacebookPages(data.pages);
        }
      }
    } catch (error) {
      console.error('Error checking Facebook connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    // Redirect to Facebook OAuth
    window.location.href = '/api/facebook/connect';
  };

  const handleDisconnectFacebook = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/facebook/connect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setFacebookConnected(false);
        setFacebookPages([]);
        alert('Facebook desconectado exitosamente');
      } else {
        alert('Error al desconectar Facebook');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al desconectar Facebook');
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
        <h1 className="text-xl font-bold text-gray-900 mb-4">Conexión Facebook</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <Icon icon="logos:facebook" className="w-8 h-8 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Estado de la Conexión</h2>
            </div>

            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full mr-3 ${facebookConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {facebookConnected ? 'Conectado a Facebook' : 'No conectado a Facebook'}
              </span>
            </div>

            {!facebookConnected ? (
              <button
                onClick={handleConnectFacebook}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              >
                <Icon icon="logos:facebook" className="w-5 h-5 mr-2" />
                Conectar con Facebook
              </button>
            ) : (
              <div>
                <button
                  onClick={handleDisconnectFacebook}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center mb-4"
                >
                  <Icon icon="heroicons:arrow-right-on-rectangle" className="w-5 h-5 mr-2" />
                  Desconectar Facebook
                </button>

                {facebookPages.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-2">Páginas de Facebook conectadas:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {facebookPages.map((page, index) => (
                        <li key={index}>{page.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones</h2>
            <div className="text-sm text-gray-700 space-y-2">
              <p>1. Haz clic en "Conectar con Facebook" para autorizar la aplicación.</p>
              <p>2. Selecciona las páginas de Facebook que deseas conectar.</p>
              <p>3. Una vez conectado, podrás importar formularios de Facebook Lead Ads.</p>
              <p>4. Los leads generados se sincronizarán automáticamente con tu CRM.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConexionFacebookPage;
'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';

const ConexionFacebookPage = () => {
  const [user, setUser] = useState(null);
  const [connection, setConnection] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchConnection(parsedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchConnection = async (userId) => {
    try {
      const response = await fetch(`/api/facebook/connection?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
        if (data.connection) {
          fetchPages(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (userId) => {
    try {
      const response = await fetch(`/api/facebook/pages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Pages data:', data);
        setPages(Array.isArray(data.pages) ? data.pages : []);
      } else {
        console.error('Response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/auth/facebook/connect?userId=${user.id}`);
      const data = await response.json();
      if (data.authUrl) {
        const popup = window.open(data.authUrl, 'facebook-auth', 'width=600,height=600');
        // Listen for popup close
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            fetchConnection(user.id);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting to Facebook:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/facebook/connection?userId=${user.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConnection(null);
        setPages([]);
      } else {
        alert('Error al desconectar');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Error al desconectar');
    }
  };

  const handleSelectPage = async (pageId) => {
    if (!user) return;

    try {
      const response = await fetch('/api/facebook/select-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, pageId }),
      });
      if (response.ok) {
        const data = await response.json();
        // Update connection
        setConnection(prev => ({
          ...prev,
          selectedPageId: pageId,
          selectedPageToken: data.selectedPage.accessToken,
        }));
      } else {
        alert('Error al seleccionar página');
      }
    } catch (error) {
      console.error('Error selecting page:', error);
      alert('Error al seleccionar página');
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
          {!connection ? (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Conectar con Facebook
            </button>
          ) : (
            <div>
              <p className="text-green-600 mb-4">Conexión establecida</p>
              {connection.facebookPageId ? (
                <div className="mb-4">
                  <p>Nombre pagina: {pages.find(p => p.id === connection.facebookPageId)?.name}</p>
                  <p>ID: {connection.facebookPageId}</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p style={{ color: '#555' }}>Selecciona una página:</p>
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una página</option>
                    {console.log('Pages:', pages)}
                    {pages.map(page => (
                      <option key={page.id} value={page.id}>
                        {page.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSelectPage(selectedPageId)}
                    disabled={!selectedPageId}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                  >
                    Guardar
                  </button>
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reconectar
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Desconectar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConexionFacebookPage;
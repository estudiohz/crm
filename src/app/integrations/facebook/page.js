"use client";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

function FacebookIntegrationContent() {
  const [connection, setConnection] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [forms, setForms] = useState([]);
  const [savedForms, setSavedForms] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Load user from localStorage on client side
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserId(parsedUser.id);
    }

    // Listen for messages from popup
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
        console.log('Facebook authentication successful');
        // Refresh connection data
        setTimeout(() => {
          fetchConnection();
        }, 500);
      } else if (event.data && event.data.type === 'FACEBOOK_AUTH_ERROR') {
        console.error('Facebook authentication failed:', event.data.error);
        alert('Error de autenticación: ' + event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Check if we just came back from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      fetchConnection();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      fetchConnection();
    }
  }, [userId]);

  const fetchConnection = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/facebook/connection?userId=${userId}`);
      const data = await res.json();
      setConnection(data.connection);
      if (data.connection && data.connection.pagesData && data.connection.pagesData.length > 0) {
        setPages(data.connection.pagesData);
      } else if (data.connection && data.connection.accessToken) {
        // Fetch pages from Facebook if not stored
        try {
          const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${data.connection.accessToken}`);
          const pagesData = await pagesRes.json();
          if (pagesData.data) {
            setPages(pagesData.data);
            // Optionally update the database
            await fetch('/api/facebook/connection', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                facebookUserId: data.connection.facebookUserId,
                accessToken: data.connection.accessToken,
                tokenExpiresAt: data.connection.tokenExpiresAt,
                pagesData: pagesData.data
              })
            });
          } else {
            setPages([]);
          }
        } catch (pagesError) {
          console.error("Error fetching pages from Facebook:", pagesError);
          setPages([]);
        }
      } else {
        setPages([]);
      }
      // Also fetch saved forms
      fetchSavedForms();
    } catch (error) {
      console.error("Error fetching connection:", error);
    }
  };

  const fetchSavedForms = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/facebook/saved-forms?userId=${userId}`);
      const data = await res.json();
      setSavedForms(data.forms || []);
    } catch (error) {
      console.error("Error fetching saved forms:", error);
    }
  };


  const handleConnect = async () => {
    if (!userId) {
      alert("Usuario no autenticado");
      return;
    }

    try {
      // Get the auth URL
      const response = await fetch(`/api/auth/facebook/connect?userId=${userId}`);
      const data = await response.json();

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      // Open Facebook auth in popup
      const popup = window.open(
        data.authUrl,
        'facebook-auth',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        alert("Popup blocked! Please allow popups for this site.");
        return;
      }

      // Check if popup is closed and refresh data
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Refresh the connection data after popup closes
          setTimeout(() => {
            fetchConnection();
          }, 1000); // Small delay to allow callback to complete
        }
      }, 1000);

    } catch (error) {
      console.error("Error opening Facebook auth:", error);
      alert("Error al conectar con Facebook");
    }
  };

  const fetchForms = async (pageId) => {
    if (!pageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/facebook/forms?userId=${userId}&pageId=${pageId}`);
      const data = await res.json();
      setForms(data.data || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
    setLoading(false);
  };

  const handlePageSelect = (pageId) => {
    setSelectedPage(pageId);
    fetchForms(pageId);
  };

  const handleFormSelect = async (form) => {
    if (!userId) {
      alert("Usuario no autenticado");
      return;
    }
    // Save form to database
    try {
      await fetch("/api/facebook/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          formId: form.id,
          formName: form.name,
          pageId: selectedPage
        }),
      });
      // Refresh saved forms
      fetchSavedForms();
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  const viewLeads = async (formId) => {
    if (!userId) {
      alert("Usuario no autenticado");
      return;
    }
    try {
      const res = await fetch(`/api/facebook/leads?form_id=${formId}&userId=${userId}`);
      const data = await res.json();
      setLeads(data.data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const viewLeadsFromDB = async (formId) => {
    if (!userId) {
      alert("Usuario no autenticado");
      return;
    }
    try {
      const res = await fetch(`/api/facebook/leads-db?formId=${formId}&userId=${userId}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error("Error fetching leads from DB:", error);
    }
  };

  const handleDisconnect = async () => {
    if (!userId) {
      alert("Usuario no autenticado");
      return;
    }

    if (!confirm("¿Estás seguro de que quieres desconectar tu cuenta de Facebook? Se perderán todas las configuraciones de formularios.")) {
      return;
    }

    try {
      const res = await fetch(`/api/facebook/connection?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConnection(null);
        setPages([]);
        setForms([]);
        setSavedForms([]);
        setLeads([]);
        alert("Cuenta desconectada exitosamente");
      } else {
        alert("Error al desconectar la cuenta");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Error al desconectar la cuenta");
    }
  };

  const isConnected = connection && connection.accessToken;

  if (!user) {
    return (
      <div className="text-center">
        <p>Cargando...</p>
      </div>
    );
  }

  console.log('Rendering integration page', {isConnected, pages});

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Integración Facebook Lead Ads</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-500">Estado de Conexión</h2>
        {isConnected ? (
          <div className="text-green-600">
            ✓ Conexión establecida con Facebook
          </div>
        ) : (
          <div className="text-red-600">✗ No conectado</div>
        )}
        {isConnected && pages.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-md mt-4">
            <div className="text-gray-700">
              <strong>Nombre:</strong> {pages[0].name}
            </div>
          </div>
        )}
        <hr className="my-4 border-gray-300" />
        {isConnected ? (
          <div className="space-x-2">
            <button
              onClick={handleConnect}
              className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md"
            >
              Reconectar
            </button>
            <button
              onClick={handleDisconnect}
              className="btn bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md"
            >
              Desconectar cuenta
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md"
          >
            Conectar con Facebook
          </button>
        )}
      </div>

      {isConnected && pages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Páginas de Facebook</h2>
          <div className="space-y-2">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="page"
                  value={page.id}
                  onChange={() => handlePageSelect(page.id)}
                  className="form-radio"
                />
                <label>{page.name}</label>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPage && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Formularios de la Página</h2>
          {loading ? (
            <p>Cargando formularios...</p>
          ) : (
            <ul className="space-y-2">
              {forms.map((form) => (
                <li key={form.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{form.name}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleFormSelect(form)}
                      className="btn bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Activar
                    </button>
                    <button
                      onClick={() => viewLeads(form.id)}
                      className="btn bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Ver Leads
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {savedForms.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Formularios Configurados</h2>
          <div className="space-y-2">
            {savedForms.map((form) => (
              <div key={form.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{form.formName}</h3>
                  <p className="text-sm text-gray-600">Leads: {form._count.leads}</p>
                </div>
                <button
                  onClick={() => viewLeadsFromDB(form.id)}
                  className="btn bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Ver Leads
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {leads.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Leads Recibidos</h2>
          <div className="space-y-2">
            {leads.map((lead, index) => (
              <div key={index} className="p-4 border rounded">
                <pre className="text-sm">{JSON.stringify(lead.leadData, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacebookIntegration() {
  return (
    <DashboardLayout>
      <FacebookIntegrationContent />
    </DashboardLayout>
  );
}
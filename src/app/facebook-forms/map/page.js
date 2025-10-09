'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const FacebookFormsMapPage = () => {
  const [formFields, setFormFields] = useState([]);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get('formId');
  const fbFormId = searchParams.get('fbFormId');

  const crmFields = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'localidad', label: 'Localidad' },
    { key: 'comunidad', label: 'Comunidad' },
    { key: 'pais', label: 'País' },
    { key: 'cp', label: 'Código Postal' },
    { key: 'fechaCumpleanos', label: 'Fecha de Cumpleaños' },
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user && formId && fbFormId) {
      fetchFormData();
    }
  }, [user, formId, fbFormId]);

  const fetchFormData = async () => {
    if (!user || !formId || !fbFormId) return;

    try {
      setLoading(true);

      // First get the form details from our DB
      const formResponse = await fetch(`/api/formularios/${formId}`);
      const formData = await formResponse.json();

      if (formData) {
        setFormData(formData);

        // Get the Facebook form fields
        const connectionResponse = await fetch(`/api/facebook/connection?userId=${user.id}`);
        const connectionData = await connectionResponse.json();

        if (connectionData.connection && connectionData.connection.pagesData) {
          // Find the page that contains this form
          let pageWithForm = null;
          let pageAccessToken = null;

          for (const page of connectionData.connection.pagesData) {
            if (page && page.accessToken) {
              try {
                const fieldsResponse = await fetch(
                  `https://graph.facebook.com/v20.0/${fbFormId}?fields=questions&access_token=${page.accessToken}`
                );
                if (fieldsResponse.ok) {
                  const fieldsData = await fieldsResponse.json();
                  if (fieldsData.questions) {
                    pageWithForm = page;
                    pageAccessToken = page.accessToken;
                    setFormFields(fieldsData.questions);
                    // Initialize mappings
                    const initialMappings = {};
                    fieldsData.questions.forEach(field => {
                      initialMappings[field.key] = '';
                    });
                    setMappings(initialMappings);
                    break;
                  }
                }
              } catch (error) {
                console.error(`Error checking page ${page.id}:`, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (fieldKey, crmField) => {
    setMappings(prev => ({
      ...prev,
      [fieldKey]: crmField
    }));
  };

  const handleSave = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/formularios/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mappings: mappings
        }),
      });

      if (response.ok) {
        alert('Mapeo guardado exitosamente');
        router.push('/facebook-forms');
      } else {
        alert('Error al guardar el mapeo');
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      alert('Error al guardar el mapeo');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Mapear Campos del Formulario
        </h1>

        {formData && (
          <div className="mb-6">
            <p className="text-gray-700">
              <strong>Formulario:</strong> {formData.nombre}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center p-8">Cargando...</div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Campos del Formulario de Facebook</h2>
            {formFields.map((field) => (
              <div key={field.key} className="flex items-center space-x-4 p-4 border rounded-md">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <p className="text-sm text-gray-500">Tipo: {field.type}</p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mapear a:
                  </label>
                  <select
                    value={mappings[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{color: '#555'}}
                  >
                    <option value="">No mapear</option>
                    {crmFields.map((crmField) => (
                      <option key={crmField.key} value={crmField.key}>
                        {crmField.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={() => router.push('/facebook-forms')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Mapeo
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacebookFormsMapPage;
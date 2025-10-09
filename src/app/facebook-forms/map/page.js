'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';

const FacebookFormsMapPageContent = () => {
  const [formFields, setFormFields] = useState([]);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // Nuevo estado para mensajes de usuario

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
    // ⚠️ Nota: Usar localStorage para la autenticación es inseguro. 
    // Considera usar cookies HTTP-only o tokens en el lado del servidor.
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Opcional: Redirigir si no hay usuario
      // router.push('/login'); 
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
      setStatusMessage(null);

      // 1. Obtener los detalles del formulario desde nuestro DB
      const formResponse = await fetch(`/api/formularios/${formId}`);
      const formDataDB = await formResponse.json();

      if (formDataDB) {
        setFormData(formDataDB);
        
        // 2. Obtener la conexión de Facebook del usuario
        const connectionResponse = await fetch(`/api/facebook/connection?userId=${user.id}`);
        const connectionData = await connectionResponse.json();

        if (connectionData.connection && connectionData.connection.pagesData) {
          // 3. Iterar sobre los tokens de página para encontrar el correcto
          let found = false;
          for (const page of connectionData.connection.pagesData) {
            if (page && page.accessToken) {
              try {
                // Hacemos la llamada a la API de Facebook con el token de la página
                const fieldsResponse = await fetch(
                  `https://graph.facebook.com/v20.0/${fbFormId}?fields=questions&access_token=${page.accessToken}`
                );
                
                if (fieldsResponse.ok) {
                  const fieldsData = await fieldsResponse.json();
                  if (fieldsData.questions) {
                    
                    // Inicializar mapeos con los valores guardados o vacíos
                    const existingMappings = formDataDB.mappings || {}; 
                    const initialMappings = {};
                    
                    fieldsData.questions.forEach(field => {
                      // Usar el mapeo existente si está disponible, si no, vacío
                      initialMappings[field.key] = existingMappings[field.key] || '';
                    });
                    
                    setFormFields(fieldsData.questions);
                    setMappings(initialMappings);
                    found = true;
                    break; // Token encontrado y campos cargados, salimos del bucle
                  }
                }
                // Si fieldsResponse no está OK, el token no es válido o no tiene permiso para este formulario
              } catch (error) {
                console.error(`Error checking page ${page.id}:`, error);
              }
            }
          }
          
          if (!found) {
              setStatusMessage({ type: 'error', text: 'No se pudo obtener el formulario de Facebook. Verifique los permisos de la página.' });
          }
        } else {
            setStatusMessage({ type: 'error', text: 'No hay páginas de Facebook conectadas.' });
        }
      } else {
          setStatusMessage({ type: 'error', text: 'No se encontró el formulario en su CRM.' });
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      setStatusMessage({ type: 'error', text: 'Error al cargar los datos del formulario.' });
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
      setStatusMessage(null); 
      
      const response = await fetch(`/api/formularios/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mappings: mappings,
          fbFormId: fbFormId, // Guardar fbFormId para futuras referencias
        }),
      });

      if (response.ok) {
        setStatusMessage({ type: 'success', text: 'Mapeo guardado exitosamente.' });
        // Redirigir después de un breve retraso para que el usuario vea el mensaje
        setTimeout(() => router.push('/facebook-forms'), 1500); 
      } else {
        const errorData = await response.json();
        setStatusMessage({ type: 'error', text: `Error al guardar el mapeo: ${errorData.message || response.statusText}` });
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      setStatusMessage({ type: 'error', text: 'Error de conexión al guardar el mapeo.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center p-8 text-gray-600">Verificando sesión...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-6 border-b pb-3">
          Mapear Campos del Formulario
        </h1>

        {/* Mensaje de estado (éxito/error) */}
        {statusMessage && (
          <div 
            className={`p-4 rounded-md mb-6 ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-400' : 'bg-red-100 text-red-800 border border-red-400'}`}
          >
            {statusMessage.text}
          </div>
        )}

        {formData && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
            <p className="text-gray-700 text-lg">
              <strong>Formulario CRM:</strong> {formData.nombre}
            </p>
            <p className="text-sm text-gray-500">
              ID de Facebook: {fbFormId}
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center p-8 text-blue-600 font-semibold">Cargando campos de Facebook...</div>
        ) : formFields.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Campos de Facebook a Mapear</h2>
            
            <div className="bg-gray-100 p-3 rounded-t-md grid grid-cols-2 gap-4 font-bold text-gray-700 border-b border-gray-300">
                <span>Campo de Facebook</span>
                <span>Campo de tu CRM</span>
            </div>

            {formFields.map((field) => (
              <div key={field.key} className="grid grid-cols-2 gap-4 items-center p-3 border-b hover:bg-blue-50 transition duration-150 rounded-md">
                <div className="flex-1">
                  <label className="block text-base font-medium text-gray-700">
                    {field.label}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                      Clave de API: <code className="bg-gray-200 px-1 rounded text-xs">{field.key}</code>
                  </p>
                </div>
                <div className="flex-1">
                  <select
                    value={mappings[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150"
                    style={{color: '#555', backgroundColor: 'white'}}
                  >
                    <option value="">-- No mapear (Ignorar) --</option>
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
        ) : (
            statusMessage ? null : ( // Solo mostramos este mensaje si no hay un mensaje de error activo
                <div className="text-center p-8 text-red-600 border border-red-300 bg-red-50 rounded-md">
                    No se pudieron cargar los campos de Facebook. Verifique la conexión y los permisos.
                </div>
            )
        )}

        <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
          <button
            onClick={() => router.push('/facebook-forms')}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || formFields.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-md"
          >
            {loading ? 'Guardando...' : 'Guardar Mapeo'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

const FacebookFormsMapPage = () => {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="text-center p-8 text-gray-600">Cargando...</div>
      </DashboardLayout>
    }>
      <FacebookFormsMapPageContent />
    </Suspense>
  );
};

export default FacebookFormsMapPage;

export const dynamic = 'force-dynamic';

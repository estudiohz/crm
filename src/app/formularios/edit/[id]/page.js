'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

const contactFields = [
  'nombre', 'apellidos', 'email', 'telefono', 'empresa', 'estado',
  'fechaCreacion', 'origen', 'direccion', 'localidad', 'comunidad', 'pais', 'cp'
];

const initialFormData = {
  nombre: '',
  url: '',
  email: '',
  estado: 'activado',
  etiquetas: [],
  mappings: []
};

const EditFormularioPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [testKeys, setTestKeys] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchEtiquetas = async () => {
      try {
        const response = await fetch(`/api/etiquetas?userId=${user.id}`);
        if (response.ok) {
          const etiquetasData = await response.json();
          setEtiquetas(etiquetasData);
          setAvailableTags(etiquetasData.map(etiqueta => etiqueta.nombre));
        }
      } catch (error) {
        console.error('Error fetching etiquetas:', error);
      }
    };

    const fetchFormulario = async () => {
      try {
        const response = await fetch(`/api/formularios/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el formulario');
        }
        const formularioData = await response.json();
        setFormData({
          nombre: formularioData.nombre || '',
          url: formularioData.url || '',
          email: formularioData.email || '',
          estado: formularioData.estado || 'activado',
          etiquetas: formularioData.etiquetas || [],
          mappings: formularioData.mappings || []
        });
        setWebhookInfo({
          url: formularioData.webhookUrl,
          secret: formularioData.webhookSecret
        });
      } catch (error) {
        console.error('Error fetching formulario:', error);
        setMessage('Error al cargar el formulario.');
      } finally {
        setLoading(false);
      }
    };

    fetchEtiquetas();
    fetchFormulario();
  }, [user, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const addMapping = () => {
    setFormData((prevData) => ({
      ...prevData,
      mappings: [...prevData.mappings, { contactField: '', formField: '' }]
    }));
  };

  const updateMapping = (index, field, value) => {
    setFormData((prevData) => ({
      ...prevData,
      mappings: prevData.mappings.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const removeMapping = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      mappings: prevData.mappings.filter((_, i) => i !== index)
    }));
  };

  const selectTag = (tag) => {
    if (!formData.etiquetas.includes(tag)) {
      setFormData((prevData) => ({
        ...prevData,
        etiquetas: [...prevData.etiquetas, tag]
      }));
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const removeTag = (tag) => {
    setFormData((prevData) => ({
      ...prevData,
      etiquetas: prevData.etiquetas.filter(t => t !== tag)
    }));
  };

  const addTag = async (tag) => {
    if (!formData.etiquetas.includes(tag)) {
      const existingEtiqueta = etiquetas.find(etiqueta => etiqueta.nombre === tag);

      if (!existingEtiqueta) {
        try {
          const response = await fetch('/api/etiquetas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nombre: tag,
              color: '#efefef',
              descripcion: '',
              userId: user.id
            }),
          });

          if (response.ok) {
            const newEtiqueta = await response.json();
            setEtiquetas([...etiquetas, newEtiqueta]);
            setAvailableTags([...availableTags, tag]);
          }
        } catch (error) {
          console.error('Error creating new etiqueta:', error);
        }
      }

      setFormData((prevData) => ({
        ...prevData,
        etiquetas: [...prevData.etiquetas, tag]
      }));
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const regenerateWebhook = async () => {
    if (!user) return;

    try {
      const webhookSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const response = await fetch(`/api/formularios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookSecret
        }),
      });

      if (response.ok) {
        setWebhookInfo(prev => ({
          ...prev,
          secret: webhookSecret
        }));
        setMessage('Clave secreta del webhook regenerada exitosamente.');
      } else {
        setMessage('Error al regenerar la clave secreta.');
      }
    } catch (error) {
      console.error('Error regenerating webhook:', error);
      setMessage('Error al regenerar la clave secreta.');
    }
  };

  const detectTestKeys = async () => {
    if (!webhookInfo?.url) {
      setMessage('No hay webhook configurado.');
      return;
    }

    setIsDetecting(true);
    setTestKeys([]);
    setMessage('Envía un formulario de prueba a la URL mostrada. Esperando datos...');

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/formularios/${id}/test-keys`);
        if (response.ok) {
          const data = await response.json();
          if (data.payloadKeys && data.payloadKeys.length > 0) {
            setTestKeys(data.payloadKeys);
            setIsDetecting(false);
            setMessage('Claves detectadas exitosamente. Ahora puedes seleccionar campos del formulario.');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling test keys:', error);
      }
    }, 3000);

    // Stop polling after 2 minutes
    setTimeout(() => {
      if (isDetecting) {
        setIsDetecting(false);
        setMessage('Tiempo agotado. No se detectaron claves de prueba.');
        clearInterval(pollInterval);
      }
    }, 120000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (!user) {
      setMessage('Usuario no encontrado.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/formularios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el formulario');
      }

      const updatedFormulario = await response.json();
      console.log('Formulario actualizado con éxito:', updatedFormulario);

      setMessage('¡Formulario actualizado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/formularios');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar el formulario. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/formularios"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Formularios</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando formulario...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6 flex justify-between items-center w-[90%] mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Editar Formulario</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre de formulario</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Nombre del formulario"
                />
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                >
                  <option value="activado">Activado</option>
                  <option value="desactivado">Desactivado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-slate-700 mb-1">URL del Formulario</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="etiquetas" className="block text-sm font-medium text-slate-700 mb-1">Etiquetas</label>
              <div className="relative">
                <input
                  type="text"
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onFocus={() => setShowTagDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Buscar o añadir etiqueta..."
                />
                {showTagDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {etiquetas.filter(etiqueta => (tagInput === '' || etiqueta.nombre.toLowerCase().includes(tagInput.toLowerCase())) && !formData.etiquetas.includes(etiqueta.nombre)).map(etiqueta => (
                      <div
                        key={etiqueta.id}
                        onClick={() => selectTag(etiqueta.nombre)}
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 flex items-center space-x-2"
                      >
                        <div
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: etiqueta.color,
                            display: 'inline-block'
                          }}
                        ></div>
                        <span>{etiqueta.nombre}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.etiquetas.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Mapeo de Campos Personalizados</h2>
              <p className="text-sm text-slate-600 mb-4">Añade aquí cualquier campo adicional que tu formulario capture.</p>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={detectTestKeys}
                  disabled={isDetecting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Icon icon="heroicons:magnifying-glass" className="w-5 h-5" />
                  <span>{isDetecting ? 'Detectando...' : 'Detectar Claves de Prueba'}</span>
                </button>
                {isDetecting && webhookInfo && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Envía un formulario de prueba a esta URL:
                    </p>
                    <code className="block mt-1 p-2 bg-blue-100 text-blue-900 rounded text-xs break-all">
                      {webhookInfo.url}?mode=test
                    </code>
                  </div>
                )}
              </div>

              {formData.mappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 mb-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Campo de Contacto</label>
                    <select
                      value={mapping.contactField}
                      onChange={(e) => updateMapping(index, 'contactField', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                    >
                      <option value="">Seleccionar campo</option>
                      {contactFields.filter(field => !formData.mappings.some((m, i) => i !== index && m.contactField === field)).map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Campo del Formulario</label>
                      {testKeys.length > 0 ? (
                        <select
                          value={mapping.formField}
                          onChange={(e) => updateMapping(index, 'formField', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                        >
                          <option value="">Seleccionar campo</option>
                          {testKeys.map(key => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={mapping.formField}
                          onChange={(e) => updateMapping(index, 'formField', e.target.value)}
                          placeholder="ID del campo en el formulario"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMapping(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <Icon icon="heroicons:trash" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addMapping}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <Icon icon="heroicons:plus" className="w-5 h-5" />
                <span>Añadir campo extra</span>
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${message.includes('éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}

            {webhookInfo && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Webhook Configurado</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-green-700">URL del Webhook</label>
                    <input
                      type="text"
                      value={webhookInfo.url}
                      readOnly
                      className="w-full px-3 py-2 border border-green-300 rounded bg-green-50 text-green-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700">Clave Secreta</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={webhookInfo.secret}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded bg-green-50 text-green-800"
                      />
                      <button
                        type="button"
                        onClick={regenerateWebhook}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Regenerar
                      </button>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Añade un campo hidden en tu formulario con el id &apos;webhook_secret&apos;</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setFormData(initialFormData)}
                className="btn px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md flex items-center space-x-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="heroicons:check-circle" className="w-5 h-5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditFormularioPage;
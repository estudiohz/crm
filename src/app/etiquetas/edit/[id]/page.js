'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

// Valores iniciales del formulario (vacíos, se llenarán con datos de la etiqueta)
const initialFormData = {
  nombre: '',
  color: '#3b82f6',
  descripcion: '',
};

const EditEtiquetaPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
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

    const fetchEtiqueta = async () => {
      try {
        const response = await fetch(`/api/etiquetas/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener la etiqueta');
        }
        const etiquetaData = await response.json();
        setFormData(etiquetaData);
      } catch (error) {
        console.error('Error fetching etiqueta:', error);
        setMessage('Error al cargar la etiqueta.');
      } finally {
        setLoading(false);
      }
    };

    fetchEtiqueta();
  }, [user, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/etiquetas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(id),
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la etiqueta');
      }

      const updatedEtiqueta = await response.json();
      console.log('Etiqueta actualizada con éxito:', updatedEtiqueta);

      setMessage('¡Etiqueta actualizada con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/etiquetas');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar la etiqueta. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/etiquetas"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Etiquetas</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando etiqueta...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6 flex justify-between items-center w-[90%] mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Editar Etiqueta</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Line 1: Nombre and Color */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Ej. Cliente VIP"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={handleChange}
                    name="color"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {/* Line 2: Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                placeholder="Descripción opcional de la etiqueta..."
              />
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${message.includes('éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message}
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

export default EditEtiquetaPage;
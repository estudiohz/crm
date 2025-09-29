'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

// Valores iniciales del formulario (vacíos, se llenarán con datos del contacto)
const initialFormData = {
  id: '',
  nombre: '',
  apellidos: '',
  email: '',
  telefono: '',
  empresa: '',
  estado: 'Activo',
  fechaCreacion: '',
  origen: '',
};

const EditContactoPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    async function fetchContacto() {
      try {
        const response = await fetch(`/api/contactos/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el contacto');
        }
        const contactoData = await response.json();

        // Formatear fechaCreacion para mostrar
        const fecha = new Date(contactoData.fechaCreacion);
        const formattedFecha = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        setFormData({
          ...contactoData,
          fechaCreacion: formattedFecha,
        });
      } catch (error) {
        console.error('Error fetching contacto:', error);
        setMessage('Error al cargar el contacto.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchContacto();
    }
  }, [id]);

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
      const response = await fetch('/api/contactos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el contacto');
      }

      const updatedContacto = await response.json();
      console.log('Contacto actualizado con éxito:', updatedContacto);

      setMessage('¡Contacto actualizado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/contactos');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar el contacto. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/contactos"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Contactos</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando contacto...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Editar Contacto</h1>
          <p className="text-slate-600">Edita la información del contacto.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Ana" />
              </div>
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input type="text" id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. García" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="ejemplo@acme.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 111 222" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Acme Corp." />
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Lead">Lead</option>
                  <option value="Potencial">Potencial</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="origen" className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
                <input type="text" id="origen" name="origen" value={formData.origen} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Web, Referido" />
              </div>
              <div>
                <label htmlFor="fechaCreacion" className="block text-sm font-medium text-slate-700 mb-1">Fecha de creación</label>
                <input type="text" id="fechaCreacion" name="fechaCreacion" value={formData.fechaCreacion} readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed" />
              </div>
            </div>
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${message.includes('éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setFormData(initialFormData)} className="btn px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 font-semibold text-sm">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md flex items-center space-x-1 disabled:opacity-50">
                {isSubmitting ? (<><Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" /><span>Guardando...</span></>) : (<><Icon icon="heroicons:check-circle" className="w-5 h-5" /><span>Guardar</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditContactoPage;
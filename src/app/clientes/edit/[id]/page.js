'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

// Valores iniciales del formulario (vacíos, se llenarán con datos del cliente)
const initialFormData = {
  id: '',
  cliente: '',
  empresa: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=CL',
  estado: 'Activo',
  fechaAlta: '',
  modulo: [],
};

const EditClientePage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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

    async function fetchCliente() {
      try {
        const response = await fetch(`/api/clientes/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el cliente');
        }
        const clienteData = await response.json();

        // Check permissions
        if (user.role !== 'superadmin' && clienteData.partnerRecordId !== user.partner?.id) {
          router.push('/clientes');
          return;
        }

        // Formatear fechaAlta para mostrar
        const fecha = new Date(clienteData.fechaAlta);
        const formattedFecha = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        setFormData({
          ...clienteData,
          fechaAlta: formattedFecha,
          modulo: clienteData.modulo || [],
        });
      } catch (error) {
        console.error('Error fetching cliente:', error);
        setMessage('Error al cargar el cliente.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchCliente();
    }
  }, [id, user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      modulo: checked
        ? [...prevData.modulo, value]
        : prevData.modulo.filter((mod) => mod !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/clientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el cliente');
      }

      const updatedCliente = await response.json();
      console.log('Cliente actualizado con éxito:', updatedCliente);

      setMessage('¡Cliente actualizado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/clientes');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar el cliente. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/clientes"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Clientes</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando cliente...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Editar Cliente</h1>
          <p className="text-slate-600">Edita la información del cliente.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cliente" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
                <input type="text" id="cliente" name="cliente" value={formData.cliente} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Ana García" />
              </div>
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Acme Corp." />
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
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña (opcional)</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 pr-20 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="••••••••" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-slate-700 mr-2">
                      <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={() => navigator.clipboard.writeText(formData.password)} className="text-slate-500 hover:text-slate-700">
                      <Icon icon="heroicons:clipboard-document" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="••••••••" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Lead">Lead</option>
                  <option value="Potencial">Potencial</option>
                </select>
              </div>
              <div>
                <label htmlFor="imagen" className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen (Perfil)</label>
                <input type="url" id="imagen" name="imagen" value={formData.imagen} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Módulos</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" value="Crm" checked={formData.modulo.includes('Crm')} onChange={handleCheckboxChange} className="mr-2" />
                  Crm
                </label>
                <label className="flex items-center">
                  <input type="checkbox" value="invoices" checked={formData.modulo.includes('invoices')} onChange={handleCheckboxChange} className="mr-2" />
                  Invoices
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="fechaAlta" className="block text-sm font-medium text-slate-700 mb-1">Fecha de alta</label>
              <input type="text" id="fechaAlta" name="fechaAlta" value={formData.fechaAlta} readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed" />
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

export default EditClientePage;
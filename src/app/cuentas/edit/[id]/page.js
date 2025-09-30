'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

// Valores iniciales del formulario (vacíos, se llenarán con datos del cuenta)
const initialFormData = {
  id: '',
  cuenta: '',
  nombre: '',
  apellidos: '',
  empresa: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  imagen: 'https://placehold.co/50x50/3b82f6/FFFFFF?text=CU',
  estado: 'Activo',
  fechaAlta: '',
  modulo: [],
};

const EditCuentaPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [emailError, setEmailError] = useState('');
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

    async function fetchCuenta() {
      try {
        const response = await fetch(`/api/cuentas/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el cuenta');
        }
        const cuentaData = await response.json();

        // Check permissions
        if (user.role !== 'superadmin' && cuentaData.partnerRecordId !== user.partner?.id) {
          router.push('/cuentas');
          return;
        }

        // Formatear fechaAlta para mostrar
        const fecha = new Date(cuentaData.fechaAlta);
        const formattedFecha = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        setFormData({
          ...cuentaData,
          fechaAlta: formattedFecha,
          modulo: cuentaData.modulo || [],
        });
      } catch (error) {
        console.error('Error fetching cuenta:', error);
        setMessage('Error al cargar el cuenta.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchCuenta();
    }
  }, [id, user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (name === 'email') {
      setEmailError('');
    }
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
      const response = await fetch('/api/cuentas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message.includes('email')) {
          setEmailError(errorData.message);
          setIsSubmitting(false);
          return;
        }
        throw new Error(errorData.message || 'Error al actualizar el cuenta');
      }

      const updatedCuenta = await response.json();
      console.log('Cuenta actualizado con éxito:', updatedCuenta);

      setMessage('¡Cuenta actualizado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/cuentas');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar el cuenta. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/cuentas"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Cuentas</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando cuenta...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6 flex justify-between items-center w-[90%] mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Editar Cuenta</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 w-[90%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre de la Cuenta */}
            <div>
              <label htmlFor="cuenta" className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Cuenta</label>
              <input type="text" id="cuenta" name="cuenta" value={formData.cuenta} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Ana García" />
            </div>

            {/* Nombre y Apellidos */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ana" />
              </div>
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input type="text" id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="García López" />
              </div>
            </div>

            {/* Empresa y Estado */}
            <div className="grid grid-cols-2 gap-6">
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

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="ejemplo@acme.com" />
                {emailError && <span className="text-red-500 text-sm mt-1 block">{emailError}</span>}
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 111 222" />
              </div>
            </div>

            {/* Contraseña y Confirmar Contraseña */}
            <div className="grid grid-cols-2 gap-6">
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

            {/* URL de Imagen y Fecha de Alta */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="imagen" className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen de Perfil</label>
                <input type="url" id="imagen" name="imagen" value={formData.imagen} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="https://..." />
              </div>
              <div>
                <label htmlFor="fechaAlta" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Alta</label>
                <input type="text" id="fechaAlta" name="fechaAlta" value={formData.fechaAlta} readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed" />
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

export default EditCuentaPage;
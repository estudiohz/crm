'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/navigation';

// Valores iniciales del formulario
const initialFormData = {
  empresa: '',
  cifNie: '',
  email: '',
  telefono: '',
  estado: 'Activo',
  fechaCreacion: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  direccion: '',
  cp: '',
  comunidad: '',
  pais: 'España',
};

const AddEmpresaPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

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

    if (!user) {
      setMessage('Usuario no autenticado. Por favor, inicia sesión.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user?.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al añadir la empresa');
      }

      const newEmpresa = await response.json();
      console.log('Empresa añadida con éxito:', newEmpresa);

      setMessage('¡Empresa añadida con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/empresas');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al añadir la empresa. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/empresas"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Empresas</span>
    </a>
  );

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Añadir Nueva Empresa</h1>
          <p className="text-slate-600">Completa la información para registrar una nueva empresa.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Nombre empresa</label>
                <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Acme Corp." />
              </div>
              <div>
                <label htmlFor="cifNie" className="block text-sm font-medium text-slate-700 mb-1">CIF ó NIE</label>
                <input type="text" id="cifNie" name="cifNie" value={formData.cifNie} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. B12345678" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="empresa@acme.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 111 222" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label htmlFor="fechaCreacion" className="block text-sm font-medium text-slate-700 mb-1">Fecha de creación</label>
                <input type="text" id="fechaCreacion" name="fechaCreacion" value={formData.fechaCreacion} readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Calle Mayor 123" />
              </div>
              <div>
                <label htmlFor="cp" className="block text-sm font-medium text-slate-700 mb-1">CP</label>
                <input type="text" id="cp" name="cp" value={formData.cp} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. 28001" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="comunidad" className="block text-sm font-medium text-slate-700 mb-1">Comunidad</label>
                <select id="comunidad" name="comunidad" value={formData.comunidad} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="">Seleccionar</option>
                  <option value="Andalucía">Andalucía</option>
                  <option value="Aragón">Aragón</option>
                  <option value="Asturias">Asturias</option>
                  <option value="Cantabria">Cantabria</option>
                  <option value="Castilla-La Mancha">Castilla-La Mancha</option>
                  <option value="Castilla y León">Castilla y León</option>
                  <option value="Cataluña">Cataluña</option>
                  <option value="Comunidad Valenciana">Comunidad Valenciana</option>
                  <option value="Extremadura">Extremadura</option>
                  <option value="Galicia">Galicia</option>
                  <option value="Comunidad de Madrid">Comunidad de Madrid</option>
                  <option value="Murcia">Murcia</option>
                  <option value="Navarra">Navarra</option>
                  <option value="País Vasco">País Vasco</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Canarias">Canarias</option>
                  <option value="Baleares">Baleares</option>
                  <option value="Ceuta">Ceuta</option>
                  <option value="Melilla">Melilla</option>
                </select>
              </div>
              <div>
                <label htmlFor="pais" className="block text-sm font-medium text-slate-700 mb-1">País</label>
                <select id="pais" name="pais" value={formData.pais} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="España">España</option>
                  <option value="Francia">Francia</option>
                  <option value="EEUU">EEUU</option>
                  <option value="UK">UK</option>
                  <option value="Italia">Italia</option>
                </select>
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
                {isSubmitting ? (<><Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" /><span>Guardando...</span></>) : (<><Icon icon="heroicons:check-circle" className="w-5 h-5" /><span>Guardar Empresa</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddEmpresaPage;
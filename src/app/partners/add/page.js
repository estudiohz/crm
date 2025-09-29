'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../components/DashboardLayout'; 
import { useRouter } from 'next/navigation';

// Valores iniciales del formulario - Adaptados para Partner
const initialFormData = {
  partner: '', // Nombre del Partner
  empresa: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  imagen: 'https://placehold.co/50x50/1e40af/FFFFFF?text=PR', // Placeholder diferente para Partner
  estado: 'Activo',
  fechaAlta: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  clients: [], // IDs de clientes asociados
};

const AddPartnerPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clients, setClients] = useState([]);
  const router = useRouter();

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('partnerFormData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clientes');
        if (response.ok) {
          const clientsData = await response.json();
          setClients(clientsData);
        } else {
          console.error('Error fetching clients');
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    let finalValue = value;
    if (name === 'clients') {
      finalValue = Array.from(selectedOptions, option => parseInt(option.value));
    }
    setFormData((prevData) => {
      const newData = {
        ...prevData,
        [name]: finalValue,
      };
      // Save to localStorage
      localStorage.setItem('partnerFormData', JSON.stringify(newData));
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setIsSubmitting(false);
      return;
    }

    try {
      // CAMBIO CLAVE: Endpoint de API para Partners
      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al añadir el partner');
      }

      const newPartner = await response.json();
      console.log('Partner añadido con éxito:', newPartner);

      // Clear localStorage on success
      localStorage.removeItem('partnerFormData');

      setMessage('¡Partner añadido con éxito! Redireccionando...');
      setTimeout(() => {
        // CAMBIO CLAVE: Redirección a la tabla de Partners
        router.push('/partners');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al añadir el partner. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      // CAMBIO CLAVE: Enlace de vuelta a la lista de Partners
      href="/partners" 
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      {/* CAMBIO CLAVE: Texto del botón */}
      <span>Volver a Partners</span>
    </a>
  );

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <BackButton />
          {/* CAMBIO CLAVE: Título de la página */}
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Añadir Nuevo Partner</h1>
          <p className="text-slate-600">Completa la información para registrar un nuevo partner.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {/* CAMBIO CLAVE: Etiqueta del campo */}
                <label htmlFor="partner" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Partner</label>
                <input type="text" id="partner" name="partner" value={formData.partner} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Javier Gómez" />
              </div>
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Synergy Hub" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="contacto@synergy.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 333 444" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 pr-20 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="••••••••" />
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirmar Contraseña</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="••••••••" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Potencial">Potencial</option>
                </select>
              </div>
              <div>
                <label htmlFor="imagen" className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen (Logo/Perfil)</label>
                <input type="url" id="imagen" name="imagen" value={formData.imagen} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label htmlFor="clients" className="block text-sm font-medium text-slate-700 mb-1">Clientes Asociados</label>
              <select id="clients" name="clients" multiple value={formData.clients.map(String)} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.cliente} - {client.empresa}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples clientes.</p>
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
              <button type="button" onClick={() => {
                setFormData(initialFormData);
                localStorage.removeItem('partnerFormData');
              }} className="btn px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 font-semibold text-sm">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md flex items-center space-x-1 disabled:opacity-50">
                {isSubmitting ? (<><Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" /><span>Guardando...</span></>) : (<><Icon icon="heroicons:check-circle" className="w-5 h-5" /><span>Guardar Partner</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddPartnerPage;

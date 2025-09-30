'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';

// Valores iniciales del formulario (vacíos, se llenarán con datos del partner)
const initialFormData = {
  id: '',
  partner: '',
  empresa: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
  imagen: '',
  estado: 'Activo',
  fechaAlta: '',
  clients: [],
};

const EditPartnerPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [user, setUser] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmpresaData, setNewEmpresaData] = useState({ empresa: '', email: '', telefono: '', estado: 'Activo' });
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

    const fetchEmpresas = async () => {
      try {
        const response = await fetch(`/api/empresas?userId=${user.id}`);
        if (response.ok) {
          const empresasData = await response.json();
          setEmpresas(empresasData);
        } else {
          console.error('Error fetching empresas');
        }
      } catch (error) {
        console.error('Error fetching empresas:', error);
      }
    };
    fetchEmpresas();
  }, [user]);

  useEffect(() => {
    async function fetchPartner() {
      try {
        const response = await fetch(`/api/partner/${id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener el partner');
        }
        const partnerData = await response.json();

        // Formatear fechaAlta para mostrar
        const fecha = new Date(partnerData.fechaAlta);
        const formattedFecha = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

        setFormData({
          ...partnerData,
          fechaAlta: formattedFecha,
          clients: partnerData.cuentas ? partnerData.cuentas.map(c => c.id) : [],
        });
        setEmpresaSearch(partnerData.empresa || '');
      } catch (error) {
        console.error('Error fetching partner:', error);
        setMessage('Error al cargar el partner.');
      } finally {
        setLoading(false);
      }
    }

    // Fetch cuentas
    const fetchCuentas = async () => {
      try {
        const response = await fetch('/api/cuentas');
        if (response.ok) {
          const cuentasData = await response.json();
          setCuentas(cuentasData);
        } else {
          console.error('Error fetching cuentas');
        }
      } catch (error) {
        console.error('Error fetching cuentas:', error);
      }
    };

    if (id) {
      fetchPartner();
      fetchCuentas();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    let finalValue = value;
    if (name === 'clients') {
      finalValue = Array.from(selectedOptions, option => parseInt(option.value));
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: finalValue,
    }));
  };

  const handleEmpresaSearch = (e) => {
    const value = e.target.value;
    setEmpresaSearch(value);
    setFormData((prevData) => ({
      ...prevData,
      empresa: value,
    }));
    const filtered = empresas.filter(emp => emp.empresa.toLowerCase().includes(value.toLowerCase()));
    setFilteredEmpresas(filtered);
    setShowDropdown(true);
  };

  const selectEmpresa = (empresa) => {
    setEmpresaSearch(empresa.empresa);
    setFormData((prevData) => ({
      ...prevData,
      empresa: empresa.empresa,
    }));
    setShowDropdown(false);
  };

  const handleNewEmpresaChange = (e) => {
    const { name, value } = e.target;
    setNewEmpresaData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const saveNewEmpresa = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEmpresaData, userId: user.id }),
      });
      if (response.ok) {
        const newEmp = await response.json();
        setEmpresas([...empresas, newEmp]);
        selectEmpresa(newEmp);
        setShowNewForm(false);
        setNewEmpresaData({ empresa: '', email: '', telefono: '', estado: 'Activo' });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al crear empresa');
      }
    } catch (error) {
      console.error('Error saving new empresa:', error);
    }
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
      const response = await fetch('/api/partner', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el partner');
      }

      const updatedPartner = await response.json();
      console.log('Partner actualizado con éxito:', updatedPartner);

      setMessage('¡Partner actualizado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/partners');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage('Error al actualizar el partner. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/partners"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Partners</span>
    </a>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando partner...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6 flex justify-between items-center w-[90%] mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Editar Partner</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 w-[90%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="contacto@synergy.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 333 444" />
              </div>
            </div>

            {/* Nueva Contraseña y Confirmar Nueva Contraseña */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="partner" className="block text-sm font-medium text-slate-700 mb-1">Nombre del Partner</label>
                <input type="text" id="partner" name="partner" value={formData.partner} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Javier Gómez" />
              </div>
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={empresaSearch}
                  onChange={handleEmpresaSearch}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Buscar empresa..."
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {filteredEmpresas.map(empresa => (
                      <div
                        key={empresa.id}
                        onClick={() => selectEmpresa(empresa)}
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                      >
                        {empresa.empresa}
                      </div>
                    ))}
                    {empresaSearch && !filteredEmpresas.find(e => e.empresa.toLowerCase() === empresaSearch.toLowerCase()) && (
                      <div
                        onClick={() => { setNewEmpresaData({ ...newEmpresaData, empresa: empresaSearch }); setShowNewForm(true); setShowDropdown(false); }}
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-blue-600 flex justify-between items-center"
                      >
                        <span>Crear nueva empresa: {empresaSearch}</span>
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Nuevo</span>
                      </div>
                    )}
                  </div>
                )}
                {showNewForm && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-lg">
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Crear Nueva Empresa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        name="empresa"
                        value={newEmpresaData.empresa}
                        onChange={handleNewEmpresaChange}
                        placeholder="Nombre empresa"
                        className="px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="email"
                        name="email"
                        value={newEmpresaData.email}
                        onChange={handleNewEmpresaChange}
                        placeholder="Email"
                        className="px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="tel"
                        name="telefono"
                        value={newEmpresaData.telefono}
                        onChange={handleNewEmpresaChange}
                        placeholder="Teléfono"
                        className="px-3 py-2 border border-slate-300 rounded text-sm"
                      />
                      <select
                        name="estado"
                        value={newEmpresaData.estado}
                        onChange={handleNewEmpresaChange}
                        className="px-3 py-2 border border-slate-300 rounded text-sm"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowNewForm(false)}
                        className="px-3 py-1 border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveNewEmpresa}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
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
              <label htmlFor="clients" className="block text-sm font-medium text-slate-700 mb-1">Cuentas Asociadas</label>
              <select id="clients" name="clients" multiple value={formData.clients.map(String)} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                {cuentas.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.id}>{cuenta.cuenta} - {cuenta.empresa}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples cuentas.</p>
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

export default EditPartnerPage;
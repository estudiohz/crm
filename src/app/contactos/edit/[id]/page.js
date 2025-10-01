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
  direccion: '',
  localidad: '',
  comunidad: '',
  pais: 'España',
  cp: '',
  fechaCumpleanos: '',
  etiquetas: [],
};

const EditContactoPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSearch, setEmpresaSearch] = useState('');
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmpresaData, setNewEmpresaData] = useState({ empresa: '', email: '', telefono: '', estado: 'Activo' });
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
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

    const fetchEtiquetas = async () => {
      try {
        const response = await fetch(`/api/etiquetas?userId=${user.id}`);
        if (response.ok) {
          const etiquetasData = await response.json();
          setEtiquetas(etiquetasData);
          // Set available tags from etiquetas
          setAvailableTags(etiquetasData.map(etiqueta => etiqueta.nombre));
        } else {
          console.error('Error fetching etiquetas');
        }
      } catch (error) {
        console.error('Error fetching etiquetas:', error);
      }
    };

    fetchEmpresas();
    fetchEtiquetas();
  }, [user]);

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

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagDropdown(value.length > 0);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = async (tag) => {
    if (!formData.etiquetas.includes(tag)) {
      // Check if tag already exists in etiquetas
      const existingEtiqueta = etiquetas.find(etiqueta => etiqueta.nombre === tag);

      if (!existingEtiqueta) {
        // Create new etiqueta with default color
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

  const removeTag = (tagToRemove) => {
    setFormData((prevData) => ({
      ...prevData,
      etiquetas: prevData.etiquetas.filter(tag => tag !== tagToRemove)
    }));
  };

  const selectTag = (tag) => {
    addTag(tag);
  };

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

        // Formatear fechaCumpleanos si existe
        let formattedCumpleanos = '';
        if (contactoData.fechaCumpleanos) {
          const cumpleanos = new Date(contactoData.fechaCumpleanos);
          formattedCumpleanos = cumpleanos.toISOString().split('T')[0]; // YYYY-MM-DD format for input
        }

        setFormData({
          ...initialFormData,
          ...contactoData,
          fechaCreacion: formattedFecha,
          fechaCumpleanos: formattedCumpleanos,
          etiquetas: contactoData.etiquetas || [],
        });
        setEmpresaSearch(contactoData.empresa || '');
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

    if (!user || !user.id) {
      setMessage('Usuario no encontrado. Inicia sesión nuevamente.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contactos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user?.id }),
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
        <div className="mb-6 flex justify-between items-center w-[90%] mx-auto">
          <h1 className="text-xl font-bold text-slate-900">Editar Contacto</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 w-[90%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Line 1: Nombre and Apellidos */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="Ej. Ana" />
              </div>
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input type="text" id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. García" />
              </div>
            </div>

            {/* Line 2: Email and Teléfono */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="ejemplo@acme.com" />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" placeholder="+34 900 111 222" />
              </div>
            </div>

            {/* Line 3: Dirección, Ciudad, CP, Comunidad */}
            <div className="grid grid-cols-10 gap-6">
              <div className="col-span-4">
                <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Calle Mayor 123" />
              </div>
              <div className="col-span-2">
                <label htmlFor="localidad" className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                <input type="text" id="localidad" name="localidad" value={formData.localidad} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. Madrid" />
              </div>
              <div className="col-span-2">
                <label htmlFor="cp" className="block text-sm font-medium text-slate-700 mb-1">CP</label>
                <input type="number" id="cp" name="cp" value={formData.cp} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" placeholder="Ej. 28001" />
              </div>
              <div className="col-span-2">
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
            </div>

            {/* Line 4: Fecha de cumpleaños */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="fechaCumpleanos" className="block text-sm font-medium text-slate-700 mb-1">Fecha de cumpleaños</label>
                <input type="date" id="fechaCumpleanos" name="fechaCumpleanos" value={formData.fechaCumpleanos} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 text-slate-700 focus:border-blue-500 transition duration-150" />
              </div>
              <div></div>
            </div>

            {/* Line 5: Empresa and Estado */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
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
                  <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg text-slate-700">
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
                        className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                      />
                      <input
                        type="email"
                        name="email"
                        value={newEmpresaData.email}
                        onChange={handleNewEmpresaChange}
                        placeholder="Email"
                        className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                      />
                      <input
                        type="tel"
                        name="telefono"
                        value={newEmpresaData.telefono}
                        onChange={handleNewEmpresaChange}
                        placeholder="Teléfono"
                        className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
                      />
                      <select
                        name="estado"
                        value={newEmpresaData.estado}
                        onChange={handleNewEmpresaChange}
                        className="px-3 py-2 border border-slate-300 rounded text-sm text-slate-700"
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

            {/* Line 6: Etiquetas */}
            <div>
              <label htmlFor="etiquetas" className="block text-sm font-medium text-slate-700 mb-1">Etiquetas</label>
              <div className="relative">
                <input
                  type="text"
                  id="etiquetas"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  onFocus={() => setShowTagDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Escribe una etiqueta y presiona Enter..."
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

            {/* Line 7: Origen and Fecha de creación */}
            <div className="grid grid-cols-2 gap-6">
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
                {isSubmitting ? (<><Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" /><span>Guardando...</span></>) : (<><Icon icon="heroicons:check-circle" className="w-5 h-5" /><span>Guardar Contacto</span></>)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditContactoPage;
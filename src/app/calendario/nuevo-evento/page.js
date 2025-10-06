'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/navigation';

const initialFormData = {
  nombre: '',
  categoria: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  descripcion: '',
};

const categorias = [
  { value: 'reunion', label: 'Reunión', color: 'purple' },
  { value: 'tarea', label: 'Tarea', color: 'yellow' },
  { value: 'llamada', label: 'Llamada', color: 'orange' },
];

const NuevoEventoPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

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
      const eventData = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage
      const existingEvents = JSON.parse(localStorage.getItem('calendario_events') || '[]');
      existingEvents.push(eventData);
      localStorage.setItem('calendario_events', JSON.stringify(existingEvents));

      setMessage('¡Evento creado con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/calendario');
      }, 1500);
    } catch (error) {
      console.error('Error creating event:', error);
      setMessage('Error al crear el evento. Inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/calendario"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver al Calendario</span>
    </a>
  );

  const generateHourOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      options.push(
        <option key={i} value={i.toString().padStart(2, '0')}>
          {i.toString().padStart(2, '0')}:00
        </option>
      );
    }
    return options;
  };

  const generateMinuteOptions = () => {
    const minutes = ['00', '15', '30', '45'];
    return minutes.map(min => (
      <option key={min} value={min}>
        :{min}
      </option>
    ));
  };

  return (
    <DashboardLayout>
      <div className="min-h-full">
        <div className="mb-6">
          <BackButton />
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Añadir Nuevo Evento</h1>
          <p className="text-slate-600">Completa la información para crear un nuevo evento en el calendario.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Line 1: Nombre and Categoria */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre del evento</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  placeholder="Ej. Reunión de equipo"
                />
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                <select
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        {cat.label}
                      </div>
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line 2: Fecha, Hora Inicio, Hora Fin */}
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-2">
                <label htmlFor="fecha" className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                />
              </div>
              <div>
                <label htmlFor="horaInicio" className="block text-sm font-medium text-slate-700 mb-1">Hora inicio</label>
                <div className="flex space-x-2">
                  <select
                    name="horaInicioHora"
                    value={formData.horaInicio.split(':')[0] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: `${e.target.value}:${prev.horaInicio.split(':')[1] || '00'}` }))}
                    required
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  >
                    <option value="">HH</option>
                    {generateHourOptions()}
                  </select>
                  <select
                    name="horaInicioMin"
                    value={formData.horaInicio.split(':')[1] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: `${prev.horaInicio.split(':')[0] || '00'}:${e.target.value}` }))}
                    required
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  >
                    <option value="">MM</option>
                    {generateMinuteOptions()}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="horaFin" className="block text-sm font-medium text-slate-700 mb-1">Hora fin</label>
                <div className="flex space-x-2">
                  <select
                    name="horaFinHora"
                    value={formData.horaFin.split(':')[0] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaFin: `${e.target.value}:${prev.horaFin.split(':')[1] || '00'}` }))}
                    required
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  >
                    <option value="">HH</option>
                    {generateHourOptions()}
                  </select>
                  <select
                    name="horaFinMin"
                    value={formData.horaFin.split(':')[1] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaFin: `${prev.horaFin.split(':')[0] || '00'}:${e.target.value}` }))}
                    required
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                  >
                    <option value="">MM</option>
                    {generateMinuteOptions()}
                  </select>
                </div>
              </div>
            </div>

            {/* Line 3: Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                placeholder="Describe el evento..."
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
                    <span>Crear Evento</span>
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

export default NuevoEventoPage;
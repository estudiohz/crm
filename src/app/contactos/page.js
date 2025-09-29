'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // 1. Importar el componente del botón
import { useState, useEffect } from 'react';

// Encabezados de la tabla para los Contactos
const contactosHeaders = [
  { label: 'ID', key: 'id' },
  { label: 'Nombre', key: 'nombre' },
  { label: 'Apellidos', key: 'apellidos' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Empresa', key: 'empresa' },
  { label: 'Estado', key: 'estado' },
  { label: 'Fecha creación', key: 'fechaCreacion' },
  { label: 'Origen', key: 'origen' },
];

const ContactosPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContactos() {
      try {
        // Fetch a la API para obtener datos de contactos
        const response = await fetch('/api/contactos');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de contactos');
        }
        const contactosData = await response.json();
        // Format fechaCreacion to DD-MM-YYYY, email to lowercase
        const formattedData = contactosData.map(contacto => ({
          ...contacto,
          email: contacto.email.toLowerCase(),
          fechaCreacion: contacto.fechaCreacion ? (() => {
            const date = new Date(contacto.fechaCreacion);
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          })() : contacto.fechaCreacion,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchContactos();
  }, []); // El array vacío asegura que se ejecute solo una vez al cargar el componente

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando contactos...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Contactos</h1>
        {/* 2. Pasamos AddButton como prop actionButton a AdvancedTable */}
        <AdvancedTable
          title="Tabla de Contactos"
          headers={contactosHeaders}
          data={data}
          actionButton={<AddButton />} // El botón dinámico se inyecta aquí
          editPath="/contactos/edit"
        />
      </div>
    </DashboardLayout>
  );
};

export default ContactosPage;
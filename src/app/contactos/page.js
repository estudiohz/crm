'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // 1. Importar el componente del botón
import RefreshButton from '../../components/RefreshButton'; // Importar el botón de refrescar
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Encabezados de la tabla para los Contactos
const contactosHeaders = [
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchContactos() {
      try {
        // Fetch a la API para obtener datos de contactos
        const response = await fetch(`/api/contactos?userId=${user.id}`);
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
  }, [refreshTrigger, user]); // Depend on refreshTrigger and user

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/contactos/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/contactos/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar contacto ${id}`);
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting contactos:', error);
      alert('Error al eliminar los contactos seleccionados');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando contactos...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Contactos <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        {/* 2. Pasamos AddButton como prop actionButton a AdvancedTable */}
        <AdvancedTable
          title=""
          headers={contactosHeaders}
          data={data}
          actionButton={null}
          editPath="/contactos/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default ContactosPage;
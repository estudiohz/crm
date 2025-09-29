'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // 1. Importar el componente del botón
import RefreshButton from '../../components/RefreshButton'; // Importar el botón de refrescar
import { useState, useEffect } from 'react';

// Encabezados de la tabla para los Clientes (sin cambios)
const clientesHeaders = [
  { label: 'ID', key: 'id' },
  { label: 'Imagen', key: 'imagen' },
  { label: 'Cliente', key: 'cliente' },
  { label: 'Empresa', key: 'empresa' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Fecha de alta', key: 'fechaAlta' },
  { label: 'Estado', key: 'estado' },
  { label: 'Servicios', key: 'modulo' },
];

const ClientesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchClientes() {
      try {
        // Simulación de fetch a una API para obtener datos de clientes
        const response = await fetch('/api/clientes');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de clientes');
        }
        const clientesData = await response.json();
        // Filter based on user role
        let filteredData = clientesData;
        if (user.role === 'partner') {
          filteredData = clientesData.filter(cliente => cliente.partnerRecordId === user.partner?.id);
        }
        // Format fechaAlta to DD-MM-YYYY and modulo to string, email to lowercase
        const formattedData = filteredData.map(cliente => ({
          ...cliente,
          email: cliente.email.toLowerCase(),
          fechaAlta: cliente.fechaAlta ? (() => {
            const date = new Date(cliente.fechaAlta);
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          })() : cliente.fechaAlta,
          modulo: cliente.modulo || []
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, [user, refreshTrigger]); // Depend on user and refreshTrigger

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando clientes...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Clientes</h1>
        {/* 2. Pasamos AddButton como prop actionButton a AdvancedTable */}
        <AdvancedTable
          title=""
          headers={clientesHeaders}
          data={data}
          actionButton={
            <div className="flex space-x-3">
              <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
              <AddButton />
            </div>
          }
          editPath="/clientes/edit" // Partners pueden editar sus clientes
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientesPage;

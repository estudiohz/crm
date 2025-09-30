'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';

// Encabezados de la tabla para las Empresas
const empresasHeaders = [
  { label: 'ID', key: 'id' },
  { label: 'Empresa', key: 'empresa' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Estado', key: 'estado' },
  { label: 'Fecha creación', key: 'fechaCreacion' },
  { label: 'Comunidad', key: 'comunidad' },
];

const EmpresasPage = () => {
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

    async function fetchEmpresas() {
      try {
        // Fetch a la API para obtener datos de empresas
        const response = await fetch(`/api/empresas?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de empresas');
        }
        const empresasData = await response.json();
        // Format fechaCreacion to DD-MM-YYYY
        const formattedData = empresasData.map(empresa => ({
          ...empresa,
          fechaCreacion: empresa.fechaCreacion ? (() => {
            const date = new Date(empresa.fechaCreacion);
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          })() : empresa.fechaCreacion,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEmpresas();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando empresas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Empresas</h1>
        <AdvancedTable
          title=""
          headers={empresasHeaders}
          data={data}
          actionButton={
            <div className="flex space-x-3">
              <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
              <AddButton />
            </div>
          }
          editPath="/empresas/edit"
        />
      </div>
    </DashboardLayout>
  );
};

export default EmpresasPage;
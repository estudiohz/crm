'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para las Empresas
const empresasHeaders = [
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
  const router = useRouter();

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

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/empresas/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/empresas/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar empresa ${id}`);
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting empresas:', error);
      alert('Error al eliminar las empresas seleccionadas');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/empresas?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      const formattedExportData = exportData.map(empresa => ({
        ...empresa,
        fechaCreacion: empresa.fechaCreacion ? (() => {
          const date = new Date(empresa.fechaCreacion);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        })() : empresa.fechaCreacion,
      }));

      exportToCSV(formattedExportData, empresasHeaders, 'empresas.csv');
    } catch (error) {
      console.error('Error exporting empresas:', error);
      alert('Error al exportar las empresas');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando empresas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Empresas <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        <AdvancedTable
          title=""
          headers={empresasHeaders}
          data={data}
          actionButton={null}
          editPath="/empresas/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      </div>
    </DashboardLayout>
  );
};

export default EmpresasPage;
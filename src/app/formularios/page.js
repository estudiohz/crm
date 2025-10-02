'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // Componente dinámico para Añadir Formulario
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para los Formularios
const formulariosHeaders = [
  { label: 'Nombre', key: 'nombre' },
  { label: 'URL', key: 'url' },
  { label: 'Email', key: 'email' },
  { label: 'Estado', key: 'estado' },
  { label: 'Leads', key: 'leads' },
];

const FormulariosPage = () => {
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

    const fetchFormularios = async () => {
      try {
        console.log('Starting fetch for formularios from /api/formularios');
        const response = await fetch(`/api/formularios?userId=${user.id}`);
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de formularios');
        }
        const formulariosData = await response.json();
        console.log('Fetched formularios data:', formulariosData);
        console.log('Sample formulario object:', formulariosData[0] || 'No data');
        setData(formulariosData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFormularios();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando formularios...</div>
      </DashboardLayout>
    );
  }

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/formularios/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/formularios/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar formulario ${id}`);
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting formularios:', error);
      alert('Error al eliminar los formularios seleccionados');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/formularios?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      exportToCSV(exportData, formulariosHeaders, 'formularios.csv');
    } catch (error) {
      console.error('Error exporting formularios:', error);
      alert('Error al exportar los formularios');
    }
  };

  console.log('Rendering table with headers:', formulariosHeaders);
  console.log('Rendering table with data:', data);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Formularios <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        {/* Usamos AdvancedTable y le pasamos el botón dinámico AddButton como prop */}
        <AdvancedTable
          title=""
          headers={formulariosHeaders}
          data={data}
          actionButton={null} // No button in table header
          editPath="/formularios/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      </div>
    </DashboardLayout>
  );
};

export default FormulariosPage;
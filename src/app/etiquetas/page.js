'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Encabezados de la tabla para las Etiquetas
const etiquetasHeaders = [
  { label: 'Color', key: 'color' },
  { label: 'Nombre', key: 'nombre' },
  { label: 'Descripción', key: 'descripcion' },
];

const EtiquetasPage = () => {
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

    const fetchEtiquetas = async () => {
      try {
        console.log('Starting fetch for etiquetas from /api/etiquetas');
        const response = await fetch(`/api/etiquetas?userId=${user.id}`);
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de etiquetas');
        }
        const etiquetasData = await response.json();
        console.log('Fetched etiquetas data:', etiquetasData);
        console.log('Sample etiqueta object:', etiquetasData[0] || 'No data');

        // Transform data to show color circles
        const transformedData = etiquetasData.map(etiqueta => ({
          ...etiqueta,
          color: `<div style="width: 15px; height: 15px; border-radius: 50%; background-color: ${etiqueta.color}; display: inline-block;"></div>`
        }));

        setData(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEtiquetas();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando etiquetas...</div>
      </DashboardLayout>
    );
  }

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/etiquetas/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/etiquetas/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar etiqueta ${id}`);
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting etiquetas:', error);
      alert('Error al eliminar las etiquetas seleccionadas');
    }
  };

  console.log('Rendering table with headers:', etiquetasHeaders);
  console.log('Rendering table with data:', data);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Etiquetas <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <AddButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        <AdvancedTable
          title=""
          headers={etiquetasHeaders}
          data={data}
          actionButton={null}
          editPath="/etiquetas/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default EtiquetasPage;
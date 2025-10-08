'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para los Formularios FB
const formulariosFBHeaders = [
  { label: 'Nombre', key: 'name' },
  { label: 'ID', key: 'id' },
  { label: 'Estado', key: 'status' },
  { label: 'Fecha de creación', key: 'created_time' },
];

const FormulariosFacebookPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchFormulariosFB = async () => {
    try {
      // Assuming API endpoint for Facebook forms
      const response = await fetch('/api/formularios');
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de formularios FB');
      }
      const formulariosData = await response.json();
      // Format created_time if needed
      const formattedData = formulariosData.map(form => ({
        ...form,
        created_time: form.created_time ? new Date(form.created_time).toLocaleDateString('es-ES') : form.created_time
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormulariosFB();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando formularios FB...</div>
      </DashboardLayout>
    );
  }

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/formularios-facebook/edit/${ids[0]}`);
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
      // Refresh data
      fetchFormulariosFB();
    } catch (error) {
      console.error('Error deleting formularios:', error);
      alert('Error al eliminar los formularios seleccionados');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/formularios');
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      const formattedExportData = exportData.map(form => ({
        ...form,
        created_time: form.created_time ? new Date(form.created_time).toLocaleDateString('es-ES') : form.created_time,
      }));

      exportToCSV(formattedExportData, formulariosFBHeaders, 'formularios_fb.csv');
    } catch (error) {
      console.error('Error exporting formularios:', error);
      alert('Error al exportar los formularios');
    }
  };

  const handleImport = () => {
    // Navigate to import page or open modal
    router.push('/facebook-forms/import');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Formularios FB <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Importar Formularios FB
        </button>
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        <AdvancedTable
          title=""
          headers={formulariosFBHeaders}
          data={data}
          actionButton={null}
          editPath="/formularios-facebook/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      </div>
    </DashboardLayout>
  );
};

export default FormulariosFacebookPage;
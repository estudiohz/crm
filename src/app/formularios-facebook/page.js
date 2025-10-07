'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // Componente dinámico para Añadir Formulario Facebook
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para los Formularios FACEBOOK
const facebookFormsHeaders = [
  { label: 'Nombre', key: 'name' },
  { label: 'Página de Facebook', key: 'pageName' },
  { label: 'Estado', key: 'status' },
  { label: 'Leads', key: 'leadsCount' },
  { label: 'Última actualización', key: 'lastUpdated' },
];

const FormulariosFacebookPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchFacebookForms = async () => {
    try {
      console.log('Starting fetch for Facebook forms');
      const response = await fetch('/api/facebook/forms');
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de formularios de Facebook');
      }
      const formsData = await response.json();
      console.log('Fetched Facebook forms data:', formsData);

      // Format lastUpdated to DD-MM-YYYY
      const formattedData = formsData.map(form => ({
        ...form,
        lastUpdated: form.lastUpdated ? (() => {
          const date = new Date(form.lastUpdated);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        })() : form.lastUpdated
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacebookForms();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando formularios de Facebook...</div>
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
        const response = await fetch(`/api/facebook/forms/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar formulario ${id}`);
        }
      }
      // Refresh data
      fetchFacebookForms();
    } catch (error) {
      console.error('Error deleting Facebook forms:', error);
      alert('Error al eliminar los formularios seleccionados');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/facebook/forms');
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      const formattedExportData = exportData.map(form => ({
        ...form,
        lastUpdated: form.lastUpdated ? (() => {
          const date = new Date(form.lastUpdated);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        })() : form.lastUpdated,
      }));

      exportToCSV(formattedExportData, facebookFormsHeaders, 'formularios-facebook.csv');
    } catch (error) {
      console.error('Error exporting Facebook forms:', error);
      alert('Error al exportar los formularios de Facebook');
    }
  };

  console.log('Rendering table with headers:', facebookFormsHeaders);
  console.log('Rendering table with data:', data);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Formularios FACEBOOK <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <AddButton />
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        {/* Usamos AdvancedTable y le pasamos el botón dinámico AddButton como prop */}
        <AdvancedTable
          title=""
          headers={facebookFormsHeaders}
          data={data}
          actionButton={null} // No button in table header
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
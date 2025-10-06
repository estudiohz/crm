'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import FacebookFormsImportModal from '../../components/FacebookFormsImportModal';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para los Formularios Facebook
const facebookFormsHeaders = [
  { label: 'Nombre', key: 'formName' },
  { label: 'Página', key: 'pageName' },
  { label: 'Estado', key: 'isActive' },
  { label: 'Leads', key: 'leadsCount' },
];

const FacebookFormsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for import modal events
    const handleOpenImportModal = () => {
      setShowImportModal(true);
    };

    window.addEventListener('openFacebookFormsImport', handleOpenImportModal);

    return () => {
      window.removeEventListener('openFacebookFormsImport', handleOpenImportModal);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchFacebookForms = async () => {
      try {
        console.log('Starting fetch for Facebook forms');
        const response = await fetch(`/api/facebook/saved-forms?userId=${user.id}`);
        console.log('Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de formularios de Facebook');
        }
        const formsData = await response.json();
        console.log('Fetched Facebook forms data:', formsData);

        // Transform data to match table format
        const transformedData = formsData.forms?.map(form => ({
          id: form.id,
          formName: form.formName,
          pageName: form.page?.name || 'N/A',
          isActive: form.isActive ? 'Activo' : 'Inactivo',
          leadsCount: form._count?.leads || 0
        })) || [];

        setData(transformedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacebookForms();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando formularios de Facebook...</div>
      </DashboardLayout>
    );
  }

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/facebook-forms/edit/${ids[0]}`);
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
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting Facebook forms:', error);
      alert('Error al eliminar los formularios seleccionados');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/facebook/saved-forms?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      const transformedData = exportData.forms?.map(form => ({
        id: form.id,
        formName: form.formName,
        pageName: form.page?.name || 'N/A',
        isActive: form.isActive ? 'Activo' : 'Inactivo',
        leadsCount: form._count?.leads || 0
      })) || [];

      exportToCSV(transformedData, facebookFormsHeaders, 'formularios-facebook.csv');
    } catch (error) {
      console.error('Error exporting Facebook forms:', error);
      alert('Error al exportar los formularios');
    }
  };

  const handleImportForm = async (importData) => {
    if (!user) return;

    try {
      const response = await fetch('/api/facebook/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          formId: importData.form.id,
          formName: importData.form.name,
          pageId: importData.page.id,
          pageName: importData.page.name
        }),
      });

      if (response.ok) {
        alert('Formulario importado exitosamente');
        setRefreshTrigger(prev => prev + 1); // Refresh the table
      } else {
        const errorData = await response.json();
        alert('Error al importar formulario: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error importing form:', error);
      alert('Error al importar el formulario');
    }
  };

  console.log('Rendering table with headers:', facebookFormsHeaders);
  console.log('Rendering table with data:', data);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Formularios Facebook <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        <AdvancedTable
          title=""
          headers={facebookFormsHeaders}
          data={data}
          actionButton={null}
          editPath="/facebook-forms/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      </div>

      <FacebookFormsImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportForm}
      />
    </DashboardLayout>
  );
};

export default FacebookFormsPage;
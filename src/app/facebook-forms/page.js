'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
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
  const [connection, setConnection] = useState(null);
  const [pages, setPages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchConnection = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/facebook/connection?userId=${user.id}`);
      const data = await res.json();
      setConnection(data.connection);
      if (data.connection && data.connection.pagesData) {
        setPages(data.connection.pagesData);
      }
    } catch (error) {
      console.error("Error fetching connection:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

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
          pageName: `${form.pageName} (ID: ${form.pageId})`,
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
        pageName: `${form.pageName} (ID: ${form.pageId})`,
        isActive: form.isActive ? 'Activo' : 'Inactivo',
        leadsCount: form._count?.leads || 0
      })) || [];

      exportToCSV(transformedData, facebookFormsHeaders, 'formularios-facebook.csv');
    } catch (error) {
      console.error('Error exporting Facebook forms:', error);
      alert('Error al exportar los formularios');
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
      {pages.length > 0 && (
        <div className="mb-4 w-[96%] mx-auto">
          <div className="text-gray-700 mb-2">
            <strong>Páginas Conectadas:</strong>
          </div>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {pages.map((page) => (
              <li key={page.id}>
                {page.name} - ID: {page.id}
              </li>
            ))}
          </ul>
        </div>
      )}
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

    </DashboardLayout>
  );
};

export default FacebookFormsPage;
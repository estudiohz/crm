'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FacebookFormsImportPage = () => {
  console.log('FacebookFormsImportPage rendering');
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  const fetchPages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/facebook/connection?userId=${user.id}`);
      const data = await response.json();

      if (data.connection && data.connection.pagesData) {
        setPages(data.connection.pagesData);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async (pageId) => {
    if (!pageId) return;

    const selectedPageData = pages.find(page => page.id === pageId);
    console.log('Selected page data:', selectedPageData);
    if (!selectedPageData || !selectedPageData.access_token) {
      console.log('No access token for page');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching forms for page:', pageId);
      const response = await fetch(
        `https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?fields=id,name,created_time,leads_count,status&limit=100&access_token=${selectedPageData.access_token}`
      );
      console.log('Forms response status:', response.status);
      const data = await response.json();
      console.log('Forms data:', data);
      setForms(data.data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (pageId) => {
    setSelectedPage(pageId);
    setSelectedForm('');
    setForms([]);
    if (pageId) {
      fetchForms(pageId);
    }
  };

  const handleImport = async () => {
    if (selectedForm && selectedPage && user) {
      const selectedFormData = forms.find(form => form.id === selectedForm);
      const selectedPageData = pages.find(page => page.id === selectedPage);

      try {
        const response = await fetch('/api/facebook/forms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            formId: selectedFormData.id,
            formName: selectedFormData.name,
            pageId: selectedPage,
            pageName: selectedPageData.name
          }),
        });

        if (response.ok) {
          alert('Formulario importado exitosamente');
          router.push('/facebook-forms');
        } else {
          const errorData = await response.json();
          alert('Error al importar formulario: ' + (errorData.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error importing form:', error);
        alert('Error al importar el formulario');
      }
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar Formulario de Facebook</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Formulario
            </label>
            <select
              value={selectedPage}
              onChange={(e) => handlePageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar página...</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name} - ID: {page.id}
                </option>
              ))}
            </select>
          </div>

          {selectedPage && (
            <div className="mb-4">
              <p className="text-gray-700">
                <strong>Nombre de la página conectada:</strong> {pages.find(p => p.id === selectedPage)?.name || 'N/A'}
              </p>
            </div>
          )}
          {selectedPage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Formulario
              </label>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Cargando formularios...' : 'Seleccionar formulario...'}
                </option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={() => router.push('/facebook-forms')}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedForm || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importar
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacebookFormsImportPage;
'use client';

import { useState, useEffect } from 'react';

export default function FacebookFormsImportModal({ isOpen, onClose, onImport }) {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      fetchPages();
    }
  }, [isOpen, user]);

  const fetchPages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/facebook/connection?userId=${user.id}`);
      const data = await response.json();

      if (data.pagesData) {
        setPages(data.pagesData);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async (pageId) => {
    if (!user || !pageId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/facebook/forms?userId=${user.id}&pageId=${pageId}`);
      const data = await response.json();

      if (data.data) {
        setForms(data.data);
      }
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

  const handleImport = () => {
    if (selectedForm && selectedPage) {
      const selectedFormData = forms.find(form => form.id === selectedForm);
      const selectedPageData = pages.find(page => page.id === selectedPage);

      onImport({
        form: selectedFormData,
        page: selectedPageData
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Importar Formulario de Facebook</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Página
            </label>
            <select
              value={selectedPage}
              onChange={(e) => handlePageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar página...</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>

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

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
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
    </div>
  );
}
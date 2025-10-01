'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // Componente dinámico para Añadir Partner
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportToCSV } from '../../utils/csvExport';

// Encabezados de la tabla para los Partners
const partnersHeaders = [
  { label: 'Imagen', key: 'imagen' },
  { label: 'Partner', key: 'partner' },
  { label: 'Empresa', key: 'empresa' },
  { label: 'Cuentas', key: 'numCuentas' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Fecha de alta', key: 'fechaAlta' },
  { label: 'Estado', key: 'estado' },
];

const PartnersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPartners = async () => {
    try {
      // CORRECCIÓN: La ruta de la API debe ser '/api/partner' (singular), ya que el Route Handler está en src/app/api/partner/route.js
      console.log('Starting fetch for partners from /api/partner');
      const response = await fetch('/api/partner');
      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de partners');
      }
      const partnersData = await response.json();
      console.log('Fetched partners data:', partnersData);
      console.log('Sample partner object:', partnersData[0] || 'No data');
      // Format fechaAlta to DD-MM-YYYY
      const formattedData = partnersData.map(partner => ({
        ...partner,
        fechaAlta: partner.fechaAlta ? (() => {
          const date = new Date(partner.fechaAlta);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        })() : partner.fechaAlta
      }));
      setData(formattedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando partners...</div>
      </DashboardLayout>
    );
  }

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/partners/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/partner/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar partner ${id}`);
        }
      }
      // Refresh data
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partners:', error);
      alert('Error al eliminar los partners seleccionados');
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/partner');
      if (!response.ok) {
        throw new Error('Error al obtener datos para exportar');
      }
      const exportData = await response.json();

      const formattedExportData = exportData.map(partner => ({
        ...partner,
        fechaAlta: partner.fechaAlta ? (() => {
          const date = new Date(partner.fechaAlta);
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        })() : partner.fechaAlta,
      }));

      exportToCSV(formattedExportData, partnersHeaders, 'partners.csv');
    } catch (error) {
      console.error('Error exporting partners:', error);
      alert('Error al exportar los partners');
    }
  };

  console.log('Rendering table with headers:', partnersHeaders);
  console.log('Rendering table with data:', data);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Partners <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <AddButton />
      </div>
      <div id="main-container" className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        {/* Usamos AdvancedTable y le pasamos el botón dinámico AddButton como prop */}
        <AdvancedTable
          title=""
          // CORRECCIÓN CLAVE: Cambiado 'headers' a 'partnersHeaders'
          headers={partnersHeaders}
          data={data}
          actionButton={null} // No button in table header
          editPath="/partners/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      </div>
    </DashboardLayout>
  );
};

export default PartnersPage;

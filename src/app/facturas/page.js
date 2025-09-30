'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Encabezados de la tabla para las Facturas
const facturasHeaders = [
  { label: 'Nº Factura', key: 'numeroFactura' },
  { label: 'Cliente', key: 'cliente' },
  { label: 'NIF', key: 'nif' },
  { label: 'Vencimiento', key: 'vencimiento' },
  { label: 'Total', key: 'total' },
  { label: 'Estado', key: 'estado' },
];

const FacturasPage = () => {
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

    async function fetchFacturas() {
      try {
        const response = await fetch(`/api/facturas?userId=${user.id}&t=${Date.now()}`);
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de facturas');
        }
        const facturasData = await response.json();
        // Format data
        const formattedData = facturasData.map(factura => ({
          ...factura,
          numeroFactura: `${factura.serie}${factura.numero}`,
          cliente: `${factura.contacto?.nombre || ''} ${factura.contacto?.apellidos || ''}`.trim(),
          nif: factura.contacto?.nif || '',
          vencimiento: factura.vencimiento ? new Date(factura.vencimiento).toLocaleDateString('es-ES') : '',
          total: `${factura.total}€`,
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFacturas();
  }, [user, refreshTrigger]);

  const handleEdit = (ids) => {
    if (ids.length === 1) {
      router.push(`/facturas/edit/${ids[0]}`);
    }
  };

  const handleDelete = async (ids) => {
    try {
      for (const id of ids) {
        const response = await fetch(`/api/facturas/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Error al eliminar factura ${id}`);
        }
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting facturas:', error);
      alert('Error al eliminar las facturas seleccionadas');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando facturas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Facturas <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        <AdvancedTable
          title=""
          headers={facturasHeaders}
          data={data}
          actionButton={null}
          editPath="/facturas/edit"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default FacturasPage;
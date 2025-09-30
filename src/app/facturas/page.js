'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';

// Encabezados de la tabla para las Facturas
const facturasHeaders = [
  { label: 'ID', key: 'id' },
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando facturas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Facturas</h1>
        <AdvancedTable
          title=""
          headers={facturasHeaders}
          data={data}
          actionButton={
            <div className="flex space-x-3">
              <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
              <AddButton />
            </div>
          }
          editPath="/facturas/edit"
        />
      </div>
    </DashboardLayout>
  );
};

export default FacturasPage;
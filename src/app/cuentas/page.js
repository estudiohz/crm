'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton'; // 1. Importar el componente del botón
import RefreshButton from '../../components/RefreshButton'; // Importar el botón de refrescar
import { useState, useEffect } from 'react';

// Encabezados de la tabla para los Cuentas
const cuentasHeaders = [
  { label: 'Imagen', key: 'imagen' },
  { label: 'Cuenta', key: 'cuenta' },
  { label: 'Empresa', key: 'empresa' },
  { label: 'Email', key: 'email' },
  { label: 'Teléfono', key: 'telefono' },
  { label: 'Fecha de alta', key: 'fechaAlta' },
  { label: 'Estado', key: 'estado' },
  { label: 'Servicios', key: 'modulo' },
];

const CuentasPage = () => {
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

    async function fetchCuentas() {
      try {
        // Simulación de fetch a una API para obtener datos de cuentas
        const response = await fetch('/api/cuentas');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de cuentas');
        }
        const cuentasData = await response.json();
        // Filter based on user role
        let filteredData = cuentasData;
        if (user.role === 'partner') {
          filteredData = cuentasData.filter(cuenta => cuenta.partnerRecordId === user.partner?.id);
        }
        // Format fechaAlta to DD-MM-YYYY and modulo to string, email to lowercase
        const formattedData = filteredData.map(cuenta => ({
          ...cuenta,
          email: cuenta.email.toLowerCase(),
          fechaAlta: cuenta.fechaAlta ? (() => {
            const date = new Date(cuenta.fechaAlta);
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          })() : cuenta.fechaAlta,
          modulo: cuenta.modulo || []
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCuentas();
  }, [user, refreshTrigger]); // Depend on user and refreshTrigger

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center p-8">Cargando cuentas...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
        <h1 className="text-xl font-bold text-gray-900">Cuentas <span className="text-sm text-gray-600 ml-2">{data.length} registros</span></h1>
        <div className="flex space-x-3">
          <RefreshButton onClick={() => setRefreshTrigger(prev => prev + 1)} />
          <AddButton />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
        {/* 2. Pasamos AddButton como prop actionButton a AdvancedTable */}
        <AdvancedTable
          title=""
          headers={cuentasHeaders}
          data={data}
          actionButton={null}
          editPath="/cuentas/edit" // Partners pueden editar sus cuentas
        />
      </div>
    </DashboardLayout>
  );
};

export default CuentasPage;

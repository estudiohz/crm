'use client';

import DashboardLayout from '../../components/DashboardLayout';
import AdvancedTable from '../../components/AdvancedTable';
import AddButton from '../../components/AddButton';
import RefreshButton from '../../components/RefreshButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Encabezados de la tabla para las Facturas
const facturasHeaders = [
  { label: 'Número', key: 'numeroFactura' },
  { label: 'Contacto', key: 'cliente' },
  { label: 'Fecha', key: 'fecha' },
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
  const [stats, setStats] = useState({ totalFacturado: 0, totalCobrado: 0, totalNoCobrado: 0, monthlyFacturado: 0, monthlyCobrado: 0, monthlyNoCobrado: 0, monthlyData: [], dailyData: [], last4MonthsFacturado: [], last4MonthsCobrado: [], last4MonthsNoCobrado: [] });
  const [chartView, setChartView] = useState('year');
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

        // Compute stats from raw data
        const totalFacturado = facturasData.reduce((sum, f) => sum + f.total, 0);
        const totalCobrado = facturasData.filter(f => f.estado === 'abonada').reduce((sum, f) => sum + f.total, 0);
        const totalNoCobrado = totalFacturado - totalCobrado;

        const currentYear = new Date().getFullYear();
        const monthlyData = Array.from({length: 12}, (_, i) => ({ month: i+1, total: 0 }));

        facturasData.forEach(f => {
          const date = new Date(f.fecha);
          if (date.getFullYear() === currentYear) {
            const monthIndex = date.getMonth();
            monthlyData[monthIndex].total += f.total;
          }
        });

        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const chartData = monthlyData.map((d, i) => ({ month: monthNames[i], total: d.total }));

        const currentMonth = new Date().getMonth();
        let monthlyFacturado = 0, monthlyCobrado = 0;
        const dailyData = Array.from({length: 31}, (_, i) => ({ day: i+1, total: 0 }));

        const last4MonthsFacturado = [];
        const last4MonthsCobrado = [];
        const last4MonthsNoCobrado = [];
        for (let i = 4; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const monthInvoices = facturasData.filter(f => {
            const date = new Date(f.fecha);
            return date.getFullYear() === currentYear && date.getMonth() === monthIndex;
          });
          const monthTotal = monthInvoices.reduce((sum, f) => sum + f.total, 0);
          const monthCobrado = monthInvoices.filter(f => f.estado === 'abonada').reduce((sum, f) => sum + f.total, 0);
          const monthNoCobrado = monthTotal - monthCobrado;
          last4MonthsFacturado.push(monthTotal);
          last4MonthsCobrado.push(monthCobrado);
          last4MonthsNoCobrado.push(monthNoCobrado);
        }

        facturasData.forEach(f => {
          const date = new Date(f.fecha);
          if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
            monthlyFacturado += f.total;
            if (f.estado === 'abonada') {
              monthlyCobrado += f.total;
            }
            const dayIndex = date.getDate() - 1;
            dailyData[dayIndex].total += f.total;
          }
        });

        const monthlyNoCobrado = monthlyFacturado - monthlyCobrado;

        setStats({ totalFacturado, totalCobrado, totalNoCobrado, monthlyFacturado, monthlyCobrado, monthlyNoCobrado, monthlyData: chartData, dailyData, last4MonthsFacturado, last4MonthsCobrado, last4MonthsNoCobrado });

        // Format data
        const formattedData = facturasData.map(factura => ({
          ...factura,
          numeroFactura: `${factura.serie}/${factura.numero}`,
          cliente: `${factura.contacto?.nombre || ''} ${factura.contacto?.apellidos || ''}`.trim(),
          fecha: factura.fecha ? new Date(factura.fecha).toLocaleDateString('es-ES') : '',
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
        {/* Charts and Cards */}
        <div className="flex gap-4 mb-6">
          {/* Switch Buttons */}
          <div className="w-[10%] flex flex-col items-center gap-2">
            <button
              onClick={() => setChartView('year')}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${chartView === 'year' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}
            >
              2025
            </button>
            <button
              onClick={() => setChartView('month')}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${chartView === 'month' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][new Date().getMonth()]}
            </button>
          </div>

          {/* Facturado Card */}
          <div className="w-[17%] border border-gray-300 p-2 pb-[8.5px] rounded h-32 flex flex-col justify-between">
            <div>
              <h4 className="text-right text-sm font-semibold mb-1 text-gray-600 uppercase">Facturado</h4>
              <p className="text-right text-sm font-bold text-gray-400">{(chartView === 'year' ? stats.totalFacturado : stats.monthlyFacturado).toFixed(2)}€</p>
            </div>
            <ResponsiveContainer width="100%" height={40}>
              <BarChart data={stats.last4MonthsFacturado.map((value, i) => ({ name: i, value }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="value" fill="#9ba8b7" radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cobrado Card */}
          <div className="w-[17%] border border-gray-300 p-2 pb-[8.5px] rounded h-32 flex flex-col justify-between">
            <div>
              <h4 className="text-right text-sm font-semibold mb-1 text-gray-600 uppercase">Cobrado</h4>
              <p className="text-right text-sm font-bold text-gray-400">{(chartView === 'year' ? stats.totalCobrado : stats.monthlyCobrado).toFixed(2)}€</p>
            </div>
            <ResponsiveContainer width="100%" height={40}>
              <BarChart data={stats.last4MonthsCobrado.map((value, i) => ({ name: i, value }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="value" fill="#79c370" radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Vencido Card */}
          <div className="w-[17%] border border-gray-300 p-2 pb-[8.5px] rounded h-32 flex flex-col justify-between">
            <div>
              <h4 className="text-right text-sm font-semibold mb-1 text-gray-600 uppercase">Vencido</h4>
              <p className="text-right text-sm font-bold text-gray-400">{(chartView === 'year' ? stats.totalNoCobrado : stats.monthlyNoCobrado).toFixed(2)}€</p>
            </div>
            <ResponsiveContainer width="100%" height={40}>
              <BarChart data={stats.last4MonthsNoCobrado.map((value, i) => ({ name: i, value }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="value" fill="#c39470" radius={[4,4,0,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="w-[39%] border border-gray-300 p-2 pb-[8.5px] rounded-lg h-32 flex flex-col justify-center">
            <h3 className="text-center text-[10px] font-semibold text-gray-600 uppercase mb-2">
              Facturación del último año
            </h3>
            <ResponsiveContainer width="100%" height={105} style={{ position: 'static' }}>
              <BarChart data={stats.monthlyData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barCategoryGap={8}>
                <XAxis dataKey="month" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 10, textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} tick={false} />
                <Tooltip formatter={(value) => [`${value.toFixed(2)}€`, 'Total']} />
                <Bar dataKey="total" fill="#9ba8b7" barSize={36} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

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
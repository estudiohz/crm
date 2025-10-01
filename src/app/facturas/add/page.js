'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

// Valores iniciales del formulario
const initialFormData = {
  serie: 'F',
  numero: 1,
  fecha: new Date().toISOString().split('T')[0],
  formaCobro: 'contado',
  vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
  contactoId: '',
  clienteSearch: '',
  estado: 'pendiente',
  items: [{ descripcion: '', cantidad: 1, precio: 0, descuento: 0, iva: 21, total: 0, retencion: 0 }],
};

const AddFacturaPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [filteredContactos, setFilteredContactos] = useState([]);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchContactos = async () => {
      try {
        const response = await fetch(`/api/contactos?userId=${user.id}`);
        if (response.ok) {
          const contactosData = await response.json();
          setContactos(contactosData);
        }
      } catch (error) {
        console.error('Error fetching contactos:', error);
      }
    };

    const fetchLastNumero = async () => {
      try {
        const response = await fetch(`/api/facturas?userId=${user.id}`);
        if (response.ok) {
          const facturas = await response.json();
          const lastFactura = facturas.sort((a, b) => b.numero - a.numero)[0];
          const nextNumero = lastFactura ? lastFactura.numero + 1 : 1;
          setFormData(prev => ({ ...prev, numero: nextNumero }));
        }
      } catch (error) {
        console.error('Error fetching last numero:', error);
      }
    };

    fetchContactos();
    fetchLastNumero();
  }, [user]);

  const handleClienteSearch = (e) => {
    const value = e.target.value;
    setClienteSearch(value);
    setFormData((prevData) => ({
      ...prevData,
      clienteSearch: value,
    }));
    const filtered = contactos.filter(con => (con.nombre + ' ' + (con.apellidos || '')).toLowerCase().includes(value.toLowerCase()));
    setFilteredContactos(filtered);
    setShowClienteDropdown(true);
  };

  const selectContacto = (contacto) => {
    setClienteSearch(contacto.nombre + ' ' + (contacto.apellidos || ''));
    setFormData((prevData) => ({
      ...prevData,
      contactoId: contacto.id,
      clienteSearch: contacto.nombre + ' ' + (contacto.apellidos || ''),
    }));
    setShowClienteDropdown(false);
  };

  const handleClienteFocus = () => {
    setFilteredContactos(contactos);
    setShowClienteDropdown(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Calculate total for item
    if (field === 'cantidad' || field === 'precio' || field === 'descuento') {
      const cantidad = parseFloat(newItems[index].cantidad) || 0;
      const precio = parseFloat(newItems[index].precio) || 0;
      const descuento = parseFloat(newItems[index].descuento) || 0;
      newItems[index].total = cantidad * precio * (1 - descuento / 100);
    }

    setFormData((prevData) => ({
      ...prevData,
      items: newItems,
    }));

    // Add new row if descripcion is filled and it's the last row
    if (field === 'descripcion' && value && index === formData.items.length - 1) {
      setFormData((prevData) => ({
        ...prevData,
        items: [...newItems, { descripcion: '', cantidad: 1, precio: 0, descuento: 0, iva: 21, total: 0, retencion: 0 }],
      }));
    }
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      newItems.push({ descripcion: '', cantidad: 1, precio: 0, descuento: 0, iva: 21, total: 0, retencion: 0 });
    }
    setFormData((prevData) => ({
      ...prevData,
      items: newItems,
    }));
  };

  const baseImponible = formData.items.reduce((sum, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const descuento = parseFloat(item.descuento) || 0;
    return sum + (cantidad * precio * (1 - descuento / 100));
  }, 0);
  const totalIVA = formData.items.reduce((sum, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const descuento = parseFloat(item.descuento) || 0;
    const iva = parseFloat(item.iva) || 0;
    const base = cantidad * precio * (1 - descuento / 100);
    return sum + (base * iva / 100);
  }, 0);
  const totalIRPF = formData.items.reduce((sum, item) => {
    const cantidad = parseFloat(item.cantidad) || 0;
    const precio = parseFloat(item.precio) || 0;
    const descuento = parseFloat(item.descuento) || 0;
    const base = cantidad * precio * (1 - descuento / 100);
    return sum + (base * (parseFloat(item.retencion) || 0) / 100);
  }, 0);
  const totalFactura = baseImponible + totalIVA;
  const finalTotal = totalFactura - totalIRPF;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Factura', 20, 20);
    doc.setFontSize(12);
    doc.text(`Serie: ${formData.serie}`, 20, 40);
    doc.text(`Número: ${formData.numero}`, 20, 50);
    doc.text(`Fecha: ${formData.fecha}`, 20, 60);
    doc.text(`Contacto: ${clienteSearch}`, 20, 70);
    doc.text(`Forma de cobro: ${formData.formaCobro}`, 20, 80);
    doc.text(`Vencimiento: ${formData.vencimiento}`, 20, 90);
    doc.text(`Información fiscal: ${formData.informacionFiscal || ''}`, 20, 100);

    let y = 120;
    doc.text('Líneas de Factura:', 20, y);
    y += 10;
    formData.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.descripcion} - Cant: ${item.cantidad} - Precio: ${item.precio}€ - Desc: ${item.descuento}% - IVA: ${item.iva}% - Total: ${item.total.toFixed(2)}€`, 20, y);
      y += 10;
    });

    y += 10;
    doc.text(`Base imponible: ${baseImponible.toFixed(2)}€`, 20, y);
    y += 10;
    doc.text(`IVA: ${totalIVA.toFixed(2)}€`, 20, y);
    y += 10;
    doc.text(`IRPF: ${totalIRPF.toFixed(2)}€`, 20, y);
    y += 10;
    doc.text(`Total: ${finalTotal.toFixed(2)}€`, 20, y);

    doc.save(`Factura_${formData.serie}${formData.numero}.pdf`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId: user?.id, contactoId: formData.contactoId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al añadir la factura');
      }

      const newFactura = await response.json();
      console.log('Factura añadida con éxito:', newFactura);

      setMessage('¡Factura añadida con éxito! Redireccionando...');
      setTimeout(() => {
        router.push('/facturas');
      }, 1500);

    } catch (error) {
      console.error('Error en el envío del formulario:', error);
      setMessage(error.message);
      setIsSubmitting(false);
    }
  };

  const BackButton = () => (
    <a
      href="/facturas"
      className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-150"
    >
      <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
      <span>Volver a Facturas</span>
    </a>
  );

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-4 w-[96%] mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Añadir Nueva Factura</h1>
          <BackButton />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-[96%] mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-6">
              <div className="relative w-1/2">
                <label htmlFor="clienteSearch" className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                <div className="relative">
                  <input
                    type="text"
                    id="clienteSearch"
                    name="clienteSearch"
                    value={clienteSearch}
                    onChange={handleClienteSearch}
                    onFocus={handleClienteFocus}
                    onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700"
                    placeholder="Buscar contacto..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => { setFilteredContactos(contactos); setShowClienteDropdown(!showClienteDropdown); }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                  >
                    <Icon icon="heroicons:chevron-down" className="w-5 h-5" />
                  </button>
                </div>
                {showClienteDropdown && (
                  <div className="absolute z-50 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {filteredContactos.map(contacto => (
                      <div
                        key={contacto.id}
                        onClick={() => selectContacto(contacto)}
                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                        style={{ color: '#666' }}
                      >
                        {contacto.nombre} {contacto.apellidos}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-1/2">
                <label htmlFor="estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="pendiente">Pendiente</option>
                  <option value="abonada">Abonada</option>
                  <option value="devuelta">Devuelta</option>
                </select>
              </div>
            </div>
            <hr className="my-4" />
            <div className="flex gap-4">
              <div className="flex-1" style={{ flexBasis: '15%' }}>
                <label htmlFor="serie" className="block text-sm font-medium text-slate-700 mb-1">Serie</label>
                <input type="text" id="serie" name="serie" value={formData.serie} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" />
              </div>
              <div className="flex-1" style={{ flexBasis: '15%' }}>
                <label htmlFor="numero" className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input type="number" id="numero" name="numero" value={formData.numero} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" />
              </div>
              <div className="flex-1" style={{ flexBasis: '25%' }}>
                <label htmlFor="fecha" className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" />
              </div>
              <div className="flex-1" style={{ flexBasis: '20%' }}>
                <label htmlFor="formaCobro" className="block text-sm font-medium text-slate-700 mb-1">Forma de cobro</label>
                <select id="formaCobro" name="formaCobro" value={formData.formaCobro} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="contado">Contado</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="domiciliacion">Domiciliación</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="recibo_30_dias">Recibo a 30 días</option>
                </select>
              </div>
              <div className="flex-1" style={{ flexBasis: '25%' }}>
                <label htmlFor="vencimiento" className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                <input type="date" id="vencimiento" name="vencimiento" value={formData.vencimiento} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700" />
              </div>
            </div>
            <hr className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="informacionFiscal" className="block text-sm font-medium text-slate-700 mb-1">Información fiscal</label>
                <select id="informacionFiscal" name="informacionFiscal" value={formData.informacionFiscal || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-slate-700">
                  <option value="">Seleccionar</option>
                  <option value="Ventas con IVA">Ventas con IVA</option>
                  <option value="Ventas Exentas de IVA">Ventas Exentas de IVA</option>
                  <option value="Ventas intracomunitarias">Ventas intracomunitarias</option>
                  <option value="Exportaciones">Exportaciones</option>
                  <option value="Sin Impuestos">Sin Impuestos</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-700 mb-4">Líneas de Factura</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '25%' }}>Descripción</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '8%' }}>Cantidad</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '12%' }}>Precio</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '12%' }}>% Descuento</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '10%' }}>IVA (%)</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '10%' }}>Total</th>
                      <th className="px-4 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '12%' }}>Retención (%)</th>
                      <th className="px-2 py-2 border border-slate-300 text-left" style={{ color: '#777', width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="Descripción"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            min="0"
                            step="0.01"
                            placeholder="1"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.precio}
                            onChange={(e) => handleItemChange(index, 'precio', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.descuento}
                            onChange={(e) => handleItemChange(index, 'descuento', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.iva}
                            onChange={(e) => handleItemChange(index, 'iva', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="21"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.total.toFixed(2)}
                            readOnly
                            className="w-full px-2 py-1 border border-slate-300 rounded bg-slate-50 font-bold text-slate-700"
                          />
                        </td>
                        <td className="px-4 py-2 border border-slate-300">
                          <input
                            type="number"
                            value={item.retencion}
                            onChange={(e) => handleItemChange(index, 'retencion', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            style={{ color: '#555' }}
                          />
                        </td>
                        <td className="px-2 py-2 border border-slate-300">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="w-5 h-5 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-gray-500"
                          >
                            <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <div className="flex justify-end space-x-4 text-red-800">
                  <span>Base imponible: {baseImponible.toFixed(2)}€</span>
                </div>
                <div className="flex justify-end space-x-4 text-red-800">
                  <span>IVA: {totalIVA.toFixed(2)}€</span>
                </div>
                <div className="flex justify-end space-x-4 text-red-800">
                  <span>IRPF: {totalIRPF.toFixed(2)}€</span>
                </div>
                <div className="flex justify-end space-x-4 font-bold text-red-800">
                  <span>Total: {finalTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${message.includes('éxito') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <button type="button" onClick={generatePDF} className="btn px-4 py-2 bg-red-200 text-red-800 rounded-md hover:bg-red-300 transition-colors duration-200 font-semibold text-sm flex items-center space-x-1">
                <Icon icon="heroicons:arrow-down-tray" className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setFormData(initialFormData)} className="btn px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors duration-200 font-semibold text-sm">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 shadow-md flex items-center space-x-1 disabled:opacity-50">
                  {isSubmitting ? (<><Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" /><span>Guardando...</span></>) : (<><Icon icon="heroicons:check-circle" className="w-5 h-5" /><span>Guardar Factura</span></>)}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddFacturaPage;
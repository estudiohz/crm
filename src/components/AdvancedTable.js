'use client';

import { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react'; // Mantenemos la importación de Icon para las flechas de ordenación
import Link from 'next/link';

// NOTA IMPORTANTE: La importación de AddButton ha sido eliminada de aquí.
// Ahora AdvancedTable recibe el botón de acción principal como una prop.

const AdvancedTable = ({ headers, data, title, actionButton, editPath, pageTitle, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Se elimina el estado 'showAddForm' y 'handleFormSubmit' ya que ahora usamos navegación de página.

  useEffect(() => {
    setSelectedRows([]);
  }, [currentPage]);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return data;
    }
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(currentItems.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleEdit = () => {
    if (onEdit && selectedRows.length === 1) {
      onEdit(selectedRows);
    }
  };

  const handleDelete = () => {
    if (onDelete && selectedRows.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (parseInt(deleteInput) === selectedRows.length) {
      await onDelete(selectedRows);
      setSelectedRows([]);
      setShowDeleteModal(false);
      setDeleteInput('');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteInput('');
  };

  const getArrowIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 'heroicons:arrow-up' : 'heroicons:arrow-down';
  };

  return (
    <div className="card">
      <header className="card-header noborder">
        <h4 className="card-title">{title}</h4>
        
        {/* Header with conditional layout */}
        {(pageTitle || actionButton) ? (
          <div className="grid grid-cols-12 mb-6 gap-5 px-6 mt-6">
            {/* Columna del título (3/12) */}
            <div className="col-span-3">
              {pageTitle && (
                <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              )}
            </div>

            {/* Columna de búsqueda (3/12) */}
            <div className="col-span-3">
              {/* Casilla de búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="py-2 pl-8 pr-4 text-sm bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
            </div>

            {/* Columna del botón (6/12) - Alineado a la derecha */}
            <div className="col-span-6 flex justify-end items-center">
              {selectedRows.length > 0 ? (
                <>
                  <button
                    onClick={handleEdit}
                    disabled={selectedRows.length !== 1}
                    className="px-3 py-2 text-xs text-gray-700 border border-gray-600 rounded-lg hover:bg-gray-50 transition-colors mr-2.5 flex items-center"
                  >
                    <Icon icon="heroicons:pencil" className="w-4 h-4 mr-1" />
                    Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 text-xs text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center"
                  >
                    <Icon icon="heroicons:trash" className="w-4 h-4 mr-1" />
                    Eliminar
                  </button>
                </>
              ) : (
                /* RENDERIZAMOS EL BOTÓN PASADO COMO PROP */
                actionButton
              )}
            </div>
          </div>
        ) : (
          <div className="mb-6 px-1 mt-6 flex justify-between items-center">
            {/* Casilla de búsqueda alineada a la izquierda */}
            <div className="relative w-fit">
              <input
                type="text"
                placeholder="Buscar..."
                className="py-2 pl-8 pr-4 text-sm text-gray-600 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>
            {selectedRows.length > 0 ? (
              <>
                <button
                  onClick={handleEdit}
                  disabled={selectedRows.length !== 1}
                  className="px-3 py-2 text-xs text-gray-700 border border-gray-600 rounded-lg hover:bg-gray-50 transition-colors mr-2.5 flex items-center"
                >
                  <Icon icon="heroicons:pencil" className="w-4 h-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 text-xs text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center"
                >
                  <Icon icon="heroicons:trash" className="w-4 h-4 mr-1" />
                  Eliminar
                </button>
              </>
            ) : (
              /* Botón de exportar alineado a la derecha */
              <button className="px-3 py-2 text-xs text-gray-700 border border-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                Exportar
              </button>
            )}
          </div>
        )}
      </header>
      
      <div className="card-body px-6 pb-6">
        <div className="overflow-x-auto -mx-6 dashcode-data-table">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                <thead className="border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:bg-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === currentItems.length && currentItems.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    {headers.map((header, index) => (
                      <th
                        key={header.key}
                        scope="col"
                        className={`px-3 py-2 cursor-pointer border-r border-slate-300 border-b border-white ${header.key === 'imagen' ? 'w-8' : ''} ${header.key === 'total' ? 'text-right' : 'text-left'} ${index === headers.length - 1 ? 'border-r-0' : ''}`}
                        onClick={() => requestSort(header.key)}
                      >
                        {header.key === 'imagen' ? '' : header.label}
                        {header.key !== 'imagen' && (
                          <Icon
                            icon={getArrowIcon(header.key) || 'heroicons:chevron-down'}
                            className="ml-1 inline-block text-slate-400"
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {currentItems.map((row) => (
                    <tr key={row.id} className="border border-gray-200">
                      <td className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                        />
                      </td>
                      {headers.map((header) => {
                        let cellContent;
                        if (header.key === 'imagen') {
                          cellContent = (
                            <span className="flex items-center">
                              <span className="w-7 h-7 rounded-full ltr:mr-3 rtl:ml-3 flex-none">
                                <img
                                  src={row[header.key]}
                                  alt={row.partner || row.cliente || 'Image'}
                                  className="object-cover w-full h-full rounded-full"
                                />
                              </span>
                            </span>
                          );
                        } else if (header.key === 'estado') {
                          let bgClass = 'bg-gray-200 text-gray-800';
                          if (row[header.key] === 'abonada') {
                            bgClass = 'bg-green-200 text-green-800';
                          } else if (row[header.key] === 'devuelta') {
                            bgClass = 'bg-yellow-200 text-yellow-800';
                          } else if (row[header.key] === 'Activo') {
                            bgClass = 'bg-green-200 text-green-800';
                          } else if (row[header.key] === 'Inactivo') {
                            bgClass = 'bg-red-500 text-white';
                          }
                          cellContent = (
                            <div
                              className={`inline-block px-2 min-w-[70px] text-center mx-auto py-0.5 text-xs rounded-[999px] ${bgClass}`}
                            >
                              {row[header.key]}
                            </div>
                          );
                        } else if (header.key === 'modulo') {
                          cellContent = (
                            <div className="flex space-x-2">
                              {row[header.key] && row[header.key].map((mod) => {
                                let iconName;
                                if (mod === 'Crm') iconName = 'heroicons:clipboard-document';
                                else if (mod === 'invoices') iconName = 'heroicons:currency-dollar';
                                return (
                                  <Icon key={mod} icon={iconName} className="w-5 h-5 text-slate-700" />
                                );
                              })}
                            </div>
                          );
                        } else {
                          cellContent = (
                            <span className="text-sm text-slate-700 dark:text-slate-700 ">
                              {row[header.key]}
                            </span>
                          );
                        }
                        // Make name columns clickable
                        if (header.key === 'partner' || header.key === 'cuenta' || header.key === 'empresa' || header.key === 'nombre' || header.key === 'numeroFactura') {
                          cellContent = (
                            <Link href={`${editPath}/${row.id}`} className={header.key === 'numeroFactura' ? 'underline' : ''} style={header.key === 'numeroFactura' ? { textDecorationColor: '#555' } : {}}>
                              {cellContent}
                            </Link>
                          );
                        }
                        return (
                          <td key={header.key} className={`px-3 py-2 ${header.key === 'total' ? 'text-right pr-5' : ''}`}>
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Paginación y Registros por Página */}
        <div className="md:flex justify-between items-center mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-900 dark:text-slate-900">Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="form-control border border-slate-300 rounded-md p-1 text-sm text-gray-600"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-slate-900 dark:text-slate-900">entradas</span>
          </div>

          <ul className="flex flex-wrap items-center space-x-2 mt-4 md:mt-0">
            <li>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm border border-slate-300 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-100"
              >
                Anterior
              </button>
            </li>
            {[...Array(totalPages)].map((_, index) => (
              <li key={index}>
                <button
                  onClick={() => paginate(index + 1)}
                  className={`btn btn-sm px-3 py-1 rounded-md ${
                    currentPage === index + 1 ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm border border-slate-300 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-100"
              >
                Siguiente
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(20,20,20,0.46)] backdrop-blur flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#555]">¿Eliminar {selectedRows.length} registros?</h3>
            <p className="mb-4 text-[#555]">Escribe a continuación el número de registros que quieres eliminar (debe coincidir con los registros seleccionados):</p>
            <input
              type="number"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md mb-4 placeholder-[#efefef] ${deleteInput ? 'text-red-600 font-bold' : ''}`}
              placeholder="Número de registros"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={parseInt(deleteInput) !== selectedRows.length}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El modal/formulario lateral ha sido eliminado de aquí */}
    </div>
  );
};

export default AdvancedTable;

'use client';

import React, { createContext, useState, useContext } from 'react';

// Datos de prueba iniciales
const initialClientesData = [
  { id: 1, imagen: '/images/clientes/cliente-1.png', cliente: 'María López', empresa: 'Tech Innovate', email: 'maria.l@email.com', telefono: '555-1234', fechaAlta: '2023-01-15', estado: 'Activo' },
  { id: 2, imagen: '/images/clientes/cliente-2.png', cliente: 'Juan Pérez', empresa: 'Global Solutions', email: 'juan.p@email.com', telefono: '555-5678', fechaAlta: '2022-09-20', estado: 'Inactivo' },
];

const ClientesContext = createContext();

export const ClientesProvider = ({ children }) => {
  const [clientes, setClientes] = useState(initialClientesData);

  const addCliente = (newCliente) => {
    // Genera un ID simple para el nuevo cliente
    const newId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1;
    const clienteConId = { ...newCliente, id: newId };
    setClientes((prevClientes) => [...prevClientes, clienteConId]);
  };

  return (
    <ClientesContext.Provider value={{ clientes, addCliente }}>
      {children}
    </ClientesContext.Provider>
  );
};

export const useClientes = () => useContext(ClientesContext);
'use client';

import React, { createContext, useState, useContext } from 'react';

// Datos de prueba iniciales
const initialCuentasData = [
  { id: 1, imagen: '/images/cuentas/cuenta-1.png', cuenta: 'María López', empresa: 'Tech Innovate', email: 'maria.l@email.com', telefono: '555-1234', fechaAlta: '2023-01-15', estado: 'Activo' },
  { id: 2, imagen: '/images/cuentas/cuenta-2.png', cuenta: 'Juan Pérez', empresa: 'Global Solutions', email: 'juan.p@email.com', telefono: '555-5678', fechaAlta: '2022-09-20', estado: 'Inactivo' },
];

const CuentasContext = createContext();

export const CuentasProvider = ({ children }) => {
  const [cuentas, setCuentas] = useState(initialCuentasData);

  const addCuenta = (newCuenta) => {
    // Genera un ID simple para el nuevo cuenta
    const newId = cuentas.length > 0 ? Math.max(...cuentas.map(c => c.id)) + 1 : 1;
    const cuentaConId = { ...newCuenta, id: newId };
    setCuentas((prevCuentas) => [...prevCuentas, cuentaConId]);
  };

  return (
    <CuentasContext.Provider value={{ cuentas, addCuenta }}>
      {children}
    </CuentasContext.Provider>
  );
};

export const useCuentas = () => useContext(CuentasContext);
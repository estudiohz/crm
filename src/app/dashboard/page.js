// src/app/dashboard/page.js

import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ¡Bienvenido a tu CRM 2!
        </h1>
        <p className="text-gray-600">
          Usa el menú de la izquierda para navegar por las diferentes secciones de tu panel de control.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
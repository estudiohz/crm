// src/components/DashboardLayout.js

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
//import MainContent from './MainContent';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {children} {/* Aquí se renderizará el contenido específico de cada página */}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
// src/components/Sidebar.js
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const Sidebar = ({ collapsed, onToggle }) => {
  const [user, setUser] = useState(null);
  const [modulosOpen, setModulosOpen] = useState(true);
  const [integracionesOpen, setIntegracionesOpen] = useState(true);
  const [partnerOpen, setPartnerOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isPartnerActive = pathname.startsWith('/cuentas') || pathname.startsWith('/partners');
  const isModulosActive = pathname.startsWith('/facturas') || pathname.startsWith('/salud-sitio') || pathname.startsWith('/calendario');
  const isIntegracionesActive = pathname.startsWith('/conexion') || pathname.startsWith('/formularios');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }

    // Listen for sidebar toggle events from Topbar
    const handleToggleEvent = () => {
      toggleSidebar();
    };

    window.addEventListener('toggleSidebar', handleToggleEvent);

    return () => {
      window.removeEventListener('toggleSidebar', handleToggleEvent);
    };
  }, []);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsed));
    if (onToggle) {
      onToggle();
    }
  };

  const renderMenu = () => {
    if (!user) return null;

    const { role, cuenta } = user;

    if (role === 'superadmin') {
      return (
        <ul>
          <li className="mb-2">
            <Link href="/dashboard" className={`flex items-center p-2 rounded hover:bg-gray-700 ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
              {!collapsed && <span className="ml-2">Dashboard</span>}
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/partners" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/partners') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:building-office" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Partners</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/cuentas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/cuentas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:users" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Cuentas</span>}
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/contactos" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/contactos') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:user-group" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Contactos</span>}
               
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/empresas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:building-office-2" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Empresas</span>}
              
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/etiquetas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/etiquetas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:tag" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Etiquetas</span>}
               
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/formularios" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/formularios') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:clipboard-document-list" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Formularios</span>}
              
            </Link>
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isModulosActive ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}
              onClick={() => !collapsed && setModulosOpen(!modulosOpen)}
            >
              <Icon icon="heroicons:cube" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && (
                <>
                  <span className="ml-2">Módulos</span>
                  <Icon
                    icon={modulosOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                    className="w-4 h-4 ml-auto"
                  />
                </>
              )}
            </div>
            {modulosOpen && !collapsed && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/facturas" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:document-text" className="w-6 h-6 mr-2 text-white" />
                    <span className="ml-2">Facturas</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/calendario" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:calendar-days" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Calendario</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/salud-sitio" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:heart" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Salud del sitio</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/calendario" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:calendar-days" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Calendario</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isIntegracionesActive ? 'bg-gray-600' : ''} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => !isCollapsed && setIntegracionesOpen(!integracionesOpen)}
            >
              <Icon icon="heroicons:bolt" className="w-6 h-6 mr-2 text-white" />
              {!isCollapsed && (
                <>
                  <span className="ml-2">Integraciones</span>
                  <Icon
                    icon={integracionesOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                    className="w-4 h-4 ml-auto"
                  />
                </>
              )}
            </div>
            {integracionesOpen && !isCollapsed && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:cloud-arrow-up" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Conexión</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/formularios" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Formularios</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      );
    } else if (role === 'cuenta') {
      return (
        <ul>
          <li className="mb-2">
            <Link href="/dashboard" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname === '/dashboard' ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:home" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Dashboard</span>}
            </Link>
          </li>
          {!collapsed && (
            <li className="mb-2">
              <hr className="border-gray-600" />
            </li>
          )}
          <li className="mb-2">
            <Link href="/contactos" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/contactos') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:user-group" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Contactos</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/empresas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:building-office-2" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Empresas</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/etiquetas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/etiquetas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:tag" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Etiquetas</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/facturas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/facturas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:document-text" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Facturas</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/calendario" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/calendario') ? 'bg-gray-600' : ''} ${isCollapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:calendar-days" className="w-6 h-6 mr-2 text-white" />
              {!isCollapsed && <span className="ml-2">Calendario</span>}
            </Link>
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isIntegracionesActive ? 'bg-gray-600' : ''} ${isCollapsed ? 'justify-center' : ''}`}
              onClick={() => !isCollapsed && setIntegracionesOpen(!integracionesOpen)}
            >
              <Icon icon="heroicons:bolt" className="w-6 h-6 mr-2 text-white" />
              {!isCollapsed && (
                <>
                  <span className="ml-2">Integraciones</span>
                  <Icon
                    icon={integracionesOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                    className="w-4 h-4 ml-auto"
                  />
                </>
              )}
            </div>
            {integracionesOpen && !isCollapsed && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:cloud-arrow-up" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Conexión</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/formularios" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Formularios</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      );
    } else if (role === 'partner') {
      return (
        <ul>
          <li className="mb-2">
            <Link href="/dashboard" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname === '/dashboard' ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:home" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Dashboard</span>}
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isPartnerActive ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}
              onClick={() => !collapsed && setPartnerOpen(!partnerOpen)}
            >
              <Icon icon="heroicons:building-office" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && (
                <>
                  <span className="ml-2">Partner</span>
                  <Icon
                    icon={partnerOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                    className="w-4 h-4 ml-auto"
                  />
                </>
              )}
            </div>
            {partnerOpen && !collapsed && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/cuentas" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:users" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Cuentas</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/contactos" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/contactos') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:user-group" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Contactos</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/empresas') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:building-office-2" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Empresas</span>}
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/formularios" className={`flex items-center p-2 rounded hover:bg-gray-700 ${pathname.startsWith('/formularios') ? 'bg-gray-600' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Icon icon="heroicons:clipboard-document-list" className="w-6 h-6 mr-2 text-white" />
              {!collapsed && <span className="ml-2">Formularios</span>}
            </Link>
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isModulosActive ? 'bg-gray-600' : ''}`}
              onClick={() => setModulosOpen(!modulosOpen)}
            >
              <Icon icon="heroicons:cube" className="w-5 h-5 mr-2" />
              Módulos
              <Icon
                icon={modulosOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                className="w-4 h-4 ml-auto"
              />
            </div>
            {modulosOpen && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/facturacion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:document-text" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Facturación</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isIntegracionesActive ? 'bg-gray-600' : ''}`}
              onClick={() => setIntegracionesOpen(!integracionesOpen)}
            >
              <Icon icon="heroicons:bolt" className="w-5 h-5 mr-2" />
              Integraciones
              <Icon
                icon={integracionesOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                className="w-4 h-4 ml-auto"
              />
            </div>
            {integracionesOpen && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:cloud-arrow-up" className="w-5 h-5 mr-2 text-white" />
                    <span className="ml-2">Conexión</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      );
    }
    return null;
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#3b497e] text-white flex-shrink-0 transition-all duration-300`}>
      <div className={`p-4 text-center font-bold text-2xl border-b border-gray-700 ${isCollapsed ? 'text-sm' : ''}`}>
        {isCollapsed ? 'C' : 'CRM'}
      </div>
      <nav className="p-4">
        {renderMenu()}
      </nav>
    </aside>
  );
};

export default Sidebar;
// src/components/Sidebar.js
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [modulosOpen, setModulosOpen] = useState(true);
  const [partnerOpen, setPartnerOpen] = useState(true);
  const pathname = usePathname();

  const isPartnerActive = pathname.startsWith('/cuentas') || pathname.startsWith('/partners');
  const isModulosActive = pathname.startsWith('/facturas') || pathname.startsWith('/conexion');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const renderMenu = () => {
    if (!user) return null;

    const { role, cuenta } = user;

    if (role === 'superadmin') {
      return (
        <ul>
          <li className="mb-2">
            <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/partners" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:building-office" className="w-5 h-5 mr-2" />
              Partners
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/cuentas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:users" className="w-5 h-5 mr-2" />
              Cuentas
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/contactos" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:user-group" className="w-5 h-5 mr-2" />
              Contactos
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:building-office-2" className="w-5 h-5 mr-2" />
              Empresas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/etiquetas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:tag" className="w-5 h-5 mr-2" />
              Etiquetas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/formularios" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5 mr-2" />
              Formularios
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
                  <Link href="/facturas" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                    Facturas
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:cloud-arrow-up" className="w-4 h-4 mr-2" />
                    Conexión
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
            <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/contactos" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:user-group" className="w-5 h-5 mr-2" />
              Contactos
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:building-office-2" className="w-5 h-5 mr-2" />
              Empresas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/etiquetas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:tag" className="w-5 h-5 mr-2" />
              Etiquetas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/formularios" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5 mr-2" />
              Formularios
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/facturas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:document-text" className="w-5 h-5 mr-2" />
              Facturas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:cloud-arrow-up" className="w-5 h-5 mr-2" />
              Conexión
            </Link>
          </li>
        </ul>
      );
    } else if (role === 'partner') {
      return (
        <ul>
          <li className="mb-2">
            <Link href="/dashboard" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <div
              className={`flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer ${isPartnerActive ? 'bg-gray-600' : ''}`}
              onClick={() => setPartnerOpen(!partnerOpen)}
            >
              <Icon icon="heroicons:building-office" className="w-5 h-5 mr-2" />
              Partner
              <Icon
                icon={partnerOpen ? "heroicons:chevron-down" : "heroicons:chevron-right"}
                className="w-4 h-4 ml-auto"
              />
            </div>
            {partnerOpen && (
              <ul className="ml-6 mt-2">
                <li className="mb-2">
                  <Link href="/cuentas" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:users" className="w-4 h-4 mr-2" />
                    Cuentas
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="mb-2">
            <hr className="border-gray-600" />
          </li>
          <li className="mb-2">
            <Link href="/contactos" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:user-group" className="w-5 h-5 mr-2" />
              Contactos
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/empresas" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:building-office-2" className="w-5 h-5 mr-2" />
              Empresas
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/formularios" className="flex items-center p-2 rounded hover:bg-gray-700">
              <Icon icon="heroicons:clipboard-document-list" className="w-5 h-5 mr-2" />
              Formularios
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
                    <Icon icon="heroicons:document-text" className="w-4 h-4 mr-2" />
                    Facturación
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/conexion" className="flex items-center p-2 rounded hover:bg-gray-700">
                    <Icon icon="heroicons:cloud-arrow-up" className="w-4 h-4 mr-2" />
                    Conexión
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
    <aside className="w-64 bg-[#3b497e] text-white flex-shrink-0">
      <div className="p-4 text-center font-bold text-2xl border-b border-gray-700">
        CRM
      </div>
      <nav className="p-4">
        {renderMenu()}
      </nav>
    </aside>
  );
};

export default Sidebar;
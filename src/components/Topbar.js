// src/components/Topbar.js
'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

const Topbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for user updates
    const handleUserUpdate = (event) => {
      setUser(event.detail);
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center relative">
      <div className="text-xl font-semibold">
        {/* Puedes añadir un título o barra de búsqueda */}
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-2 relative">
            <span className="w-7 h-7 rounded-full flex-none">
              <img
                src={user.imagen || user.cuenta?.imagen || user.partner?.imagen || 'https://placehold.co/50x50/3b82f6/FFFFFF?text=U'}
                alt={user.name}
                className="object-cover w-full h-full rounded-full"
              />
            </span>
            <span className="text-black font-medium">{user.name}</span>
            <button onClick={toggleDropdown} className="flex items-center">
              <Icon icon="heroicons:chevron-down" className="w-5 h-5 text-black" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link href="/facturacion" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Invoices
                </Link>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Your Plan
                </a>
                <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Setting
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
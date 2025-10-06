'use client'; // ¡Importante!

import { useState } from 'react';
import LoginForm from '../components/LoginForm'; // Ruta relativa
import RegistrationForm from '../components/RegistrationForm'; // Ruta relativa

// ... el resto de tu código

export default function Home() {
  const [isLoginView, setIsLoginView] = useState(true);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Columna Izquierda (Formulario) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="max-w-md w-full">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
            {isLoginView ? 'Iniciar Sesión' : 'Registro'}
          </h2>
          {isLoginView ? (
            <LoginForm />
          ) : (
            <RegistrationForm />
          )}
          <div className="text-center mt-4">
            <button onClick={toggleView} className="text-sm text-blue-600 hover:text-blue-500">
              {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* Columna Derecha (Información de Prueba) */}
      <div className="w-full md:w-1/2 bg-blue-600 flex flex-col items-center justify-center p-8 text-white">
        <h1 className="text-4xl font-extrabold text-center mb-6">
          Bienvenido a tu CRM
        </h1>
        <div className="bg-blue-700 p-6 rounded-lg shadow-lg max-w-sm w-full">
          <h3 className="text-2xl font-semibold mb-4">Usuarios de Prueba</h3>
          <ul className="space-y-4">
            <li>
              <span className="font-bold block">Superadmin</span>
              <span className="block">Email: `superadmin@test.com`</span>
              <span className="block">Contraseña: `password123`</span>
            </li>
            <li>
              <span className="font-bold block">Partner</span>
              <span className="block">Email: `partner@test.com`</span>
              <span className="block">Contraseña: `password123`</span>
            </li>
            <li>
              <span className="font-bold block">Cliente</span>
              <span className="block">Email: `cliente1@test.com`</span>
              <span className="block">Contraseña: `password123`</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
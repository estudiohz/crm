// src/components/LoginForm.js
'use client';

import { useState, useEffect } from 'react';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('loginEmail');
    const savedPassword = localStorage.getItem('loginPassword');
    const savedRemember = localStorage.getItem('loginRemember') === 'true';

    if (savedRemember) {
      setFormData({
        email: savedEmail || '',
        password: savedPassword || '',
      });
      setRemember(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el inicio de sesión.');
      }

      // Si el login es exitoso, guardar los datos del usuario y redirigir al dashboard
      console.log('Login successful:', data);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Guardar datos de login si se marca recordar
      if (remember) {
        localStorage.setItem('loginEmail', formData.email);
        localStorage.setItem('loginPassword', formData.password);
        localStorage.setItem('loginRemember', 'true');
      } else {
        localStorage.removeItem('loginEmail');
        localStorage.removeItem('loginPassword');
        localStorage.removeItem('loginRemember');
      }

      window.location.href = '/dashboard'; // Redirige al dashboard

    } catch (err) {
      setError(err.message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Campo de Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[#888]"
            placeholder="tu@email.com"
          />
        </div>
        {/* Campo de Contraseña */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-[#888]"
            placeholder="••••••••"
          />
        </div>
        {/* Checkbox Recordar datos */}
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
            Recordar datos
          </label>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loading ? 'Cargando...' : 'Entrar'}
      </button>
    </form>
  );
}
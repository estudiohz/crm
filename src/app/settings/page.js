'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

const SettingsPage = () => {
  const inputStyle = { color: '#555' };
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    cuenta: '',
    nombre: '',
    apellidos: '',
    empresa: '',
    telefono: '',
    imagen: '',
    estado: '',
  });
  const [originalEmail, setOriginalEmail] = useState('');
  const [emailSettings, setEmailSettings] = useState({
    provider: 'servidor-propio',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: '',
    authType: 'ninguna',
    appPassword: '',
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        cuenta: parsedUser.cuenta || '',
        nombre: parsedUser.nombre || '',
        apellidos: parsedUser.apellidos || '',
        empresa: parsedUser.empresa || '',
        telefono: parsedUser.telefono || '',
        imagen: parsedUser.imagen || '',
        estado: parsedUser.estado || '',
      });
      setOriginalEmail(parsedUser.email || '');
    }

    // Load email settings from localStorage
    const emailData = localStorage.getItem('emailSettings');
    if (emailData) {
      setEmailSettings(JSON.parse(emailData));
    }
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleProviderChange = (e) => {
    const provider = e.target.value;
    let newSettings = { ...emailSettings, provider };

    if (provider === 'gmail') {
      newSettings = {
        ...newSettings,
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587',
        authType: 'starttls',
      };
    } else if (provider === 'microsoft-365') {
      newSettings = {
        ...newSettings,
        smtpHost: 'smtp.office365.com',
        smtpPort: '587',
        authType: 'starttls',
      };
    } else {
      // servidor-propio, reset to empty
      newSettings = {
        ...newSettings,
        smtpHost: '',
        smtpPort: '',
        authType: 'ninguna',
      };
    }

    setEmailSettings(newSettings);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const updateProfile = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, originalEmail }),
      });
      if (response.ok) {
        setMessage('Perfil actualizado exitosamente');
        // Update localStorage
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      } else {
        setMessage('Error al actualizar perfil');
      }
    } catch (error) {
      setMessage('Error al actualizar perfil');
    }
    setIsSubmitting(false);
  };

  const updatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...passwordData, email: user.email }),
      });
      if (response.ok) {
        setMessage('Contraseña actualizada exitosamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Error al actualizar contraseña');
      }
    } catch (error) {
      setMessage('Error al actualizar contraseña');
    }
    setIsSubmitting(false);
  };

  const saveEmailSettings = () => {
    localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
    setMessage('Configuración de email guardada exitosamente');
  };

  const testEmailServer = async () => {
    if (!testEmail) {
      setMessage('Por favor ingresa un email de prueba');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emailSettings, testEmail }),
      });
      if (response.ok) {
        setMessage('Email de prueba enviado exitosamente');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Error al enviar email de prueba');
      }
    } catch (error) {
      setMessage('Error al enviar email de prueba');
    }
    setIsSubmitting(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        setProfileData(prev => ({ ...prev, imagen: imageUrl }));
        // Auto-save the profile after image upload
        updateProfile();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    setProfileData(prev => ({ ...prev, imagen: '' }));
    updateProfile();
  };

  const menuItems = [
    { id: 'profile', label: 'Perfil', icon: 'heroicons:user' },
    { id: 'account', label: 'Ajustes de cuenta', icon: 'heroicons:cog-6-tooth' },
    { id: 'emails', label: 'Emails', icon: 'heroicons:envelope' },
    { id: 'notifications', label: 'Notificaciones', icon: 'heroicons:bell' },
    { id: 'security', label: 'Seguridad', icon: 'heroicons:shield-check' },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex">
            {/* Left Sidebar */}
            <div className="w-80 bg-white rounded-lg shadow p-6 mr-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-8">
                <img
                  src={profileData.imagen || 'https://placehold.co/100x100/3b82f6/FFFFFF?text=U'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={handleDeleteImage}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon icon={item.icon} className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Right Content */}
            <div className="flex-1 bg-white rounded-lg shadow p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfil</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de cuenta</label>
                      <input
                        type="text"
                        name="cuenta"
                        value={profileData.cuenta}
                        onChange={handleProfileChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        name="nombre"
                        value={profileData.nombre}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={{ color: '#555' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={profileData.apellidos}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                      <input
                        type="text"
                        name="empresa"
                        value={profileData.empresa}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={profileData.telefono}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={updateProfile}
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajustes de cuenta</h2>
                  <p className="text-gray-600">Esta sección está en desarrollo.</p>
                </div>
              )}

              {activeTab === 'emails' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración de Email</h2>
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                       <select
                         name="provider"
                         value={emailSettings.provider}
                         onChange={handleProviderChange}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                         style={inputStyle}
                       >
                         <option value="gmail">Gmail</option>
                         <option value="microsoft-365">Microsoft 365</option>
                         <option value="servidor-propio">Servidor Propio</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        name="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                      <input
                        type="number"
                        name="smtpPort"
                        value={emailSettings.smtpPort}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Autenticación</label>
                      <select
                        name="authType"
                        value={emailSettings.authType}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      >
                        <option value="ninguna">Ninguna</option>
                        <option value="tls">TLS</option>
                        <option value="starttls">STARTTLS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
                      <input
                        type="text"
                        name="smtpUser"
                        value={emailSettings.smtpUser}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                      <div className="relative">
                        <input
                          type={showSmtpPassword ? "text" : "password"}
                          name="smtpPass"
                          value={emailSettings.smtpPass}
                          onChange={handleEmailChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <Icon icon={showSmtpPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {emailSettings.provider === 'gmail' && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña de Aplicación de Gmail</label>
                        <input
                          type="password"
                          name="appPassword"
                          value={emailSettings.appPassword}
                          onChange={handleEmailChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          style={inputStyle}
                          placeholder="Ingresa la contraseña de aplicación"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                      <input
                        type="email"
                        name="fromEmail"
                        value={emailSettings.fromEmail}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                      <input
                        type="text"
                        name="fromName"
                        value={emailSettings.fromName}
                        onChange={handleEmailChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={saveEmailSettings}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Guardar Configuración
                    </button>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Probar Configuración</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de Prueba</label>
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          style={inputStyle}
                          placeholder="test@example.com"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={testEmailServer}
                          disabled={isSubmitting}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Enviando...' : 'Test Servidor'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notificaciones</h2>
                  <p className="text-gray-600">Esta sección está en desarrollo.</p>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Seguridad</h2>
                  <div className="max-w-md">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        style={inputStyle}
                      />
                    </div>
                    <button
                      onClick={updatePassword}
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                  </div>
                </div>
              )}

              {message && (
                <div className={`mt-4 p-3 rounded-lg ${message.includes('exitosamente') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
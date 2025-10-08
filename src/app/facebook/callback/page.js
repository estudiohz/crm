'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Componente Cliente (Usa useSearchParams)
function CallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    // Si el estado es 'success', cerramos la ventana después de 3 segundos
    if (status === 'success') {
      setTimeout(() => {
        // Esta función solo funciona porque la ventana fue abierta con window.open()
        window.close();
      }, 3000);
    }
  }, [status]);

  if (status === 'success') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'green' }}>Conexión exitosa</h1>
        <p>Tu cuenta de Facebook ha sido conectada correctamente.</p>
        <p>Esta ventana se cerrará automáticamente en 3 segundos.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: 'red' }}>Error en la Conexión</h1>
        <p>Ha ocurrido un error durante la autenticación.</p>
        <p>Mensaje de Meta/Servidor: <strong>{message}</strong></p>
      </div>
    );
  }

  // Estado de carga inicial
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', textAlign: 'center' }}>
      <h1>Procesando Conexión...</h1>
      <p>Espere un momento mientras verificamos los datos.</p>
    </div>
  );
}

// Componente principal de la página.
// Usamos Suspense para evitar el error de prerendering de Next.js.
export default function FacebookCallbackPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <CallbackContent />
        </Suspense>
    );
}

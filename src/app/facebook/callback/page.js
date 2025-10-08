'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => {
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
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1 style={{ color: 'red' }}>Error</h1>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Procesando...</h1>
    </div>
  );
}
'use client';

// Importaciones de Next.js (se asume que están disponibles en el proyecto real)
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Componente dinámico para el botón "Añadir".
 *
 * Utiliza `usePathname` para determinar si el usuario está en la ruta /partners
 * o /clientes y ajusta el texto del botón y el enlace de destino.
 */
export default function AddButton() {
  // Obtiene la ruta actual (e.g., '/clientes', '/partners', '/partners/add')
  const pathname = usePathname(); 

  // Determinar el modo basado en la ruta
  const lowerPathname = pathname.toLowerCase();
  const isPartnerMode = lowerPathname.includes('/partners');
  const isCuentasMode = lowerPathname.includes('/cuentas');
  const isContactosMode = lowerPathname.includes('/contactos');
  const isEmpresasMode = lowerPathname.includes('/empresas');
  const isFacturasMode = lowerPathname.includes('/facturas');
  const isFormulariosMode = lowerPathname.includes('/formularios');

  // 1. Definir el texto del botón
  let buttonText = 'Añadir Cuenta';
  if (isPartnerMode) {
    buttonText = 'Añadir Partner';
  } else if (isCuentasMode) {
    buttonText = 'Añadir Cuenta';
  } else if (isContactosMode) {
    buttonText = 'Añadir Contacto';
  } else if (isEmpresasMode) {
    buttonText = 'Añadir Empresa';
  } else if (isFacturasMode) {
    buttonText = 'Añadir Factura';
  } else if (isFormulariosMode) {
    buttonText = 'Añadir Formulario';
  }

  // 2. Definir el enlace de destino.
  let targetLink = '/cuentas/add';
  if (isPartnerMode) {
    targetLink = '/partners/add';
  } else if (isCuentasMode) {
    targetLink = '/cuentas/add';
  } else if (isContactosMode) {
    targetLink = '/contactos/add';
  } else if (isEmpresasMode) {
    targetLink = '/empresas/add';
  } else if (isFacturasMode) {
    targetLink = '/facturas/add';
  } else if (isFormulariosMode) {
    targetLink = '/formularios/add';
  }

  return (
    <div className="flex justify-end">
      {/* Usamos Link para la navegación en Next.js. */}
      <Link href={targetLink}>
        <button className="px-4 py-2 text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50" style={{backgroundColor: '#23232b'}}>
          {buttonText}
        </button>
      </Link>
    </div>
  );
}

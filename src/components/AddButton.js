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
  const isContactosMode = lowerPathname.includes('/contactos');

  // 1. Definir el texto del botón
  let buttonText = 'Añadir Cliente';
  if (isPartnerMode) {
    buttonText = 'Añadir Partner';
  } else if (isContactosMode) {
    buttonText = 'Añadir Contacto';
  }

  // 2. Definir el enlace de destino.
  let targetLink = '/clientes/add';
  if (isPartnerMode) {
    targetLink = '/partners/add';
  } else if (isContactosMode) {
    targetLink = '/contactos/add';
  }

  return (
    <div className="flex justify-end py-4">
      {/* Usamos Link para la navegación en Next.js. */}
      <Link href={targetLink}>
        <button className="px-6 py-3 text-white font-semibold bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
          {buttonText}
        </button>
      </Link>
    </div>
  );
}

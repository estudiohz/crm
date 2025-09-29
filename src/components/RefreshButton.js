'use client';

import { Icon } from '@iconify/react';

export default function RefreshButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-3 text-gray-700 bg-gray-200 rounded-lg shadow-lg hover:bg-gray-300 transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
      title="Refrescar tabla"
    >
      <Icon icon="heroicons:arrow-path" className="w-5 h-5" />
    </button>
  );
}
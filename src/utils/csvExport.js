// Utility function to export data to CSV
export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Create CSV content
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header.key];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  const csvContent = [csvHeaders, ...csvRows].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
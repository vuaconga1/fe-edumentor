import React, { useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiChevronUp, HiChevronDown } from 'react-icons/hi';

const DataTable = ({ 
  columns, 
  data, 
  onRowClick,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search...",
  emptyMessage = "No data found"
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-6 py-4 text-left text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide ${
                    col.sortable !== false ? 'cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' 
                        ? <HiChevronUp className="w-4 h-4" />
                        : <HiChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr 
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`bg-white dark:bg-neutral-900 ${onRowClick ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50' : ''} transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-sm ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-neutral-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

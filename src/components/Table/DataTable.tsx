import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  title: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
  currentPage?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyText = '暂无数据',
  currentPage,
  total,
  pageSize = 10,
  onPageChange,
}: Props<T>) {
  const totalPages = total ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={rowKey(row)} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`table-cell ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total !== undefined && total > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-700">{total}</span> 条数据
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={!currentPage || currentPage <= 1}
              onClick={() => onPageChange?.(Math.max(1, (currentPage || 1) - 1))}
              className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 4, (currentPage || 1) - 2));
              const page = start + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange?.(page)}
                  className={`w-8 h-8 rounded text-sm transition-colors ${
                    currentPage === page
                      ? 'bg-accent-500 text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              disabled={!currentPage || currentPage >= totalPages}
              onClick={() => onPageChange?.(Math.min(totalPages, (currentPage || 1) + 1))}
              className="p-1.5 text-gray-500 hover:bg-gray-200 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

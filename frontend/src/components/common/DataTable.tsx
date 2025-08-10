export type Column<T> = {
  header: string
  accessor: keyof T | ((row: T, index: number) => React.ReactNode)
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  error,
  emptyMessage = 'Ingen data fundet.',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return <p className="p-4 text-gray-500">Indlæser...</p>
  }

  if (error) {
    return <p className="p-4 text-red-500">Fejl: {error}</p>
  }

  if (data.length === 0) {
    return <p className="p-4 text-gray-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto rounded-md border shadow">
      <table className="min-w-full table-auto bg-white text-sm">
        <thead className="bg-gray-100 text-left font-medium text-gray-700">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={`border-b px-4 py-2 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {data.map((row, rowIndex) => (
            <tr key={rowKey(row)} onClick={() => onRowClick?.(row)} className="even:bg-gray-50 hover:bg-gray-100">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="border px-4 py-2">
                  {typeof col.accessor === 'function'
                    ? col.accessor(row, rowIndex)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

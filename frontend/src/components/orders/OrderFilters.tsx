import { Filter, SortAsc, SortDesc } from 'lucide-react'

interface OrderFiltersProps {
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export default function OrderFilters({
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: OrderFiltersProps) {
  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELED', label: 'Canceled' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'REFUNDED', label: 'Refunded' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      {/* Status Filter */}
      <div className="flex items-center space-x-2">
        <Filter size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Order */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() =>
            onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')
          }
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {sortOrder === 'desc' ? (
            <SortDesc size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <SortAsc size={14} className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          )}
          <span className="hidden sm:inline">
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </span>
          <span className="sm:hidden">
            {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
          </span>
        </button>
      </div>
    </div>
  )
}

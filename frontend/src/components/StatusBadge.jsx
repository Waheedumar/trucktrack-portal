const STATUS_CONFIG = {
  pending:    { label: 'Pending',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  assigned:   { label: 'Assigned',   cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_transit: { label: 'In Transit', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered:  { label: 'Delivered',  cls: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-800 border-red-200' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

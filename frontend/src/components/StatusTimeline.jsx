import { MessageSquare } from 'lucide-react'

function fmt(dateStr) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(dateStr))
}

export default function StatusTimeline({ updates = [] }) {
  if (!updates.length) {
    return (
      <div className="flex flex-col items-center py-6 text-gray-400 gap-2">
        <MessageSquare className="w-6 h-6" />
        <p className="text-sm">No updates yet</p>
      </div>
    )
  }

  const sorted = [...updates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <ul className="space-y-1">
      {sorted.map((u, i) => (
        <li key={u.id} className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1a3a5c] ring-2 ring-white flex-shrink-0" />
            {i !== sorted.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-4 min-w-0">
            <p className="text-sm text-gray-800 leading-snug">{u.message}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {u.author?.name || 'System'} · {fmt(u.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

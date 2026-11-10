import { Droplet } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({ tone = 'dark' }) {
  const light = tone === 'light'

  return (
    <Link
      to="/"
      aria-label="Sweety home"
      className={`inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-ink'}`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${
          light ? 'bg-white/15' : 'bg-teal-600 text-white'
        }`}
      >
        <Droplet size={16} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="font-display text-xl tracking-tight">Sweety</span>
    </Link>
  )
}

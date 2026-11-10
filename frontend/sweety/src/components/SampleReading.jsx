const points = [
  { time: '7:10', value: '112' },
  { time: '12:40', value: '164' },
  { time: '18:15', value: '98' },
]

export default function SampleReading() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0">
      <aside className="absolute -left-10 top-16 hidden w-44 rounded-2xl bg-teal-700 p-4 text-teal-50 shadow-lg xl:block">
        <p className="text-[11px] font-medium tracking-[0.16em] text-teal-100/80 uppercase">
          This week
        </p>
        <p className="mt-2 font-display text-4xl leading-none">6 of 7</p>
        <p className="mt-2 text-sm leading-5 text-teal-50/80">
          example days mostly inside 70–180
        </p>
      </aside>

      <article className="relative rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(27,36,48,0.55)] ring-1 ring-ink/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-teal-700 uppercase">
              Sample reading
            </p>
            <p className="mt-3 font-display text-6xl leading-none tracking-tight text-ink">
              112
            </p>
            <p className="mt-2 text-sm text-ink/60">mg/dL · today, 7:10</p>
          </div>
          <p className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            In range
          </p>
        </div>

        <svg viewBox="0 0 320 128" className="mt-6 w-full" aria-hidden="true">
          <rect x="0" y="38" width="320" height="46" rx="8" fill="#EEF7F6" />
          <path
            d="M8 78 C 48 76, 70 46, 108 58 S 168 96, 208 64 S 268 36, 312 52"
            fill="none"
            stroke="#2C7A8B"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <circle cx="208" cy="64" r="5" fill="#1E5758" />
        </svg>

        <ul className="mt-2 grid grid-cols-3 gap-2 border-t border-ink/8 pt-4">
          {points.map((point) => (
            <li key={point.time}>
              <p className="text-xs text-ink/50">{point.time}</p>
              <p className="font-display text-xl text-ink">{point.value}</p>
            </li>
          ))}
        </ul>
      </article>
      <p className="mt-3 text-center text-xs text-ink/50 lg:text-left">
        Illustrative numbers, not a real log. The band shows an example range of 70–180 mg/dL.
      </p>
    </div>
  )
}

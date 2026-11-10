export default function ScreenStatus({ label = 'Loading Sweety' }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-stone px-6 text-ink">
      <p className="font-display text-2xl" role="status">
        {label}
      </p>
    </div>
  )
}

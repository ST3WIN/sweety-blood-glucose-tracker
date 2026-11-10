import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-teal-700',
  secondary:
    'bg-transparent text-ink hover:bg-ink/5 focus-visible:outline-teal-600',
  inverse:
    'bg-white text-teal-700 hover:bg-teal-50 focus-visible:outline-white',
}

const base =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function ButtonLink({ variant = 'primary', className = '', ...props }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />
}

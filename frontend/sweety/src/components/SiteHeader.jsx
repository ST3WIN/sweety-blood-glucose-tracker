import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button, ButtonLink } from './Buttons'
import Logo from './Logo'

export default function SiteHeader({ onLogout }) {
  const { user, loading } = useAuth()

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
      <Logo />
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
        <Link
          to="/#how-it-works"
          className="hidden rounded-full px-3 py-2 text-sm text-ink/80 hover:bg-ink/5 sm:inline-flex"
        >
          How it works
        </Link>
        {loading ? (
          <span className="inline-block h-9 w-28" aria-hidden="true" />
        ) : user ? (
          <>
            <span className="hidden px-2 text-sm text-ink/70 sm:inline">
              {user.first_name}
            </span>
            <ButtonLink to="/home" variant="secondary">
              Your log
            </ButtonLink>
            <Button type="button" variant="primary" onClick={onLogout}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <ButtonLink to="/login" variant="secondary">
              Sign in
            </ButtonLink>
            <ButtonLink to="/login?mode=register">Create a log</ButtonLink>
          </>
        )}
      </nav>
    </header>
  )
}

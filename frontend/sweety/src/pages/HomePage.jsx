import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Droplet,
  User,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './HomePage.css'

const NAV_ITEMS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'readings', label: 'Readings', icon: ClipboardList },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

function DetailRow({ label, children }) {
  return (
    <div className="home-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ComingSoon({ icon: Icon, title }) {
  return (
    <div className="home-empty">
      <div className="home-empty-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>This section is not built yet.</p>
    </div>
  )
}

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('account')
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = 'Sweety'
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function selectTab(id) {
    setActiveTab(id)
    setMenuOpen(false)
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }

  const firstName = user?.first_name || ''
  const lastName = user?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim() || 'User'
  const email = user?.email || ''
  const role = user?.role || 'patient'
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U'
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab)

  return (
    <div className="home">
      {menuOpen && (
        <div className="home-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`home-sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div>
          <div className="home-brand">
            <div className="home-brand-left">
              <span className="home-logo">
                <Droplet size={19} strokeWidth={2.3} />
              </span>
              <span className="home-brand-name">Sweety</span>
            </div>
            <button
              type="button"
              className="home-icon-btn home-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="home-nav" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = item.id === activeTab
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`home-nav-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => selectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="home-sidebar-bottom">
          <button type="button" className="home-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <div className="home-main">
        <header className="home-topbar">
          <button
            type="button"
            className="home-icon-btn home-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h2 className="home-topbar-title">{activeItem.label}</h2>
        </header>

        <main className="home-content">
          <div className="home-panel" key={activeTab}>
            {activeTab === 'account' && (
              <>
                <h1 className="home-heading">Your account</h1>

                <section className="home-card">
                  <div className="home-profile">
                    <div className="home-avatar">{initials}</div>
                    <div className="home-profile-text">
                      <p className="home-name">{fullName}</p>
                      <p className="home-email-line">{email}</p>
                    </div>
                  </div>

                  <dl className="home-details">
                    <DetailRow label="First name">{firstName || '—'}</DetailRow>
                    <DetailRow label="Last name">{lastName || '—'}</DetailRow>
                    <DetailRow label="Email">
                      <span>{email || '—'}</span>
                      {email && (
                        <button
                          type="button"
                          className={`home-copy ${copied ? 'is-copied' : ''}`}
                          onClick={copyEmail}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </DetailRow>
                    <DetailRow label="Role">
                      <span className="home-badge">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </DetailRow>
                    <DetailRow label="Member since">{memberSince}</DetailRow>
                  </dl>
                </section>
              </>
            )}

            {activeTab === 'readings' && (
              <ComingSoon icon={ClipboardList} title="Readings" />
            )}
            {activeTab === 'reports' && (
              <ComingSoon icon={BarChart3} title="Reports" />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
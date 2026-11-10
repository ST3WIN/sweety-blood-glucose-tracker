import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ButtonLink } from '../components/Buttons'
import SampleReading from '../components/SampleReading'
import SiteHeader from '../components/SiteHeader'
import { useAuth } from '../hooks/useAuth'

const steps = [
  {
    n: '01',
    title: 'Record',
    body: 'Write down the number, the time, and a short note. A meal, a walk, a late night.',
  },
  {
    n: '02',
    title: 'Review',
    body: 'Each day sits against the range you care about, so one reading has some company.',
  },
  {
    n: '03',
    title: 'Recognize',
    body: 'A week of readings makes a pattern easier to see than a single number on its own.',
  },
]

export default function LandingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Sweety — blood glucose log'
  }, [])

  async function onLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-stone text-ink">
      <SiteHeader onLogout={onLogout} />

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-8 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-28">
          <div>
            <p className="text-sm font-medium tracking-[0.16em] text-teal-700 uppercase">
              Everyday glucose tracking
            </p>
            <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Know your numbers without the clutter.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-ink/75">
              Sweety is a personal log for blood glucose. Record a reading, see the day,
              and notice when you drift — without a dashboard full of noise.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <ButtonLink to="/home">Open your log</ButtonLink>
              ) : (
                <ButtonLink to="/login?mode=register">Start a log</ButtonLink>
              )}
              {!user && (
                <ButtonLink to="/login" variant="secondary">
                  I already have one
                </ButtonLink>
              )}
            </div>
          </div>
          <SampleReading />
        </section>

        <section id="how-it-works" className="border-t border-ink/10">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
            <h2 className="max-w-md font-display text-3xl tracking-tight sm:text-4xl">
              Three quiet steps. Then the log does the remembering.
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {steps.map((step) => (
                <li key={step.n}>
                  <p className="font-display text-3xl text-teal-600">{step.n}</p>
                  <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-ink/75">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="rounded-[28px] bg-teal-700 px-6 py-10 text-white sm:px-10 sm:py-12">
            <h2 className="max-w-lg font-display text-3xl tracking-tight sm:text-4xl">
              A record you can open later, not a verdict on the day.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80">
              Sweety keeps the readings you enter. It does not diagnose, dose, or replace
              advice from your clinician. Targets such as 70–180 mg/dL on this site are
              examples only.
            </p>
            <div className="mt-8">
              {user ? (
                <ButtonLink to="/home" variant="inverse">
                  Open your log
                </ButtonLink>
              ) : (
                <ButtonLink to="/login?mode=register" variant="inverse">
                  Create your log
                </ButtonLink>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg text-ink">Sweety</p>
          <p>A personal blood glucose log. Not a medical device.</p>
        </div>
      </footer>
    </div>
  )
}

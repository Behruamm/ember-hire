import Link from 'next/link'
import EmberHeader from '@/components/layout/EmberHeader'
import FAQAccordion from '@/components/layout/FAQAccordion'
import { Button, EmberLogo } from '@/components/ui'

// ── Icons ─────────────────────────────────────────────────────────────────

function IconTarget() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function IconBolt() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function IconPerson() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function IconLock() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
function IconSeat() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────

const PRICING_CARDS = [
  {
    title: "The school sports match that's just an hour away",
    price: '£510',
    bg: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&q=80',
    alt: 'School sports team',
  },
  {
    title: "A distillery tour that's not quite planned yet",
    price: '£780',
    bg: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=800&q=80',
    alt: 'Whisky distillery barrels',
  },
  {
    title: 'A weekend match-day return',
    price: '£1,020',
    bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    alt: 'Scottish Highlands road',
  },
]

const FEATURES = [
  { icon: <IconTarget />, title: 'Live Tracking', desc: 'Second-by-second tracking so you always know where your coach is' },
  { icon: <IconShield />, title: 'Simple Pricing', desc: 'Affordable, predictable rates you can see before you book' },
  { icon: <IconBolt />, title: '100% Electric', desc: 'State-of-the-art electric coaches for a quiet, zero-emissions ride' },
  { icon: <IconPerson />, title: 'Friendly Drivers', desc: "Whether it's bags or a change of plan, we're happy to help" },
  { icon: <IconLock />, title: 'Reliable', desc: 'Ember has a Scotland-wide network of drivers and coaches' },
  { icon: <IconSeat />, title: 'Comfortable Ride', desc: 'Extra-legroom, free 5G Wi-Fi and USB points at every seat' },
]

// ── Page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <EmberHeader transparent />

      {/* Hero — negative margin pulls it behind the sticky nav */}
      <section className="hero-section">
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <p className="text-[var(--color-nav-dark-text)] text-sm sm:text-[15px] font-medium mb-3">
            Reliable. Clear pricing. 100% electric.
          </p>
          <h1 className="text-white font-semibold text-4xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6 max-w-3xl">
            Coach hire. But better.
          </h1>
          <Link href="/book">
            <Button size="md">Get a Quote</Button>
          </Link>
        </div>
      </section>

      {/* Simple */}
      <section className="py-14 lg:py-28 border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-5">
                We&apos;ve made it simple
              </h2>
              <p className="text-slate-11 leading-relaxed">
                Coach hire can be a guessing game — hidden fees, confusing bookings and no idea if
                your coach will even show up. With Ember, it&apos;s easier. Our electric coaches give
                quiet rides, prices are fair and transparent, drivers smile and live tracking keeps
                you informed from pickup to drop-off.
              </p>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-56 sm:w-64 bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-black">
                <div className="bg-surface-light h-80 sm:h-96 flex flex-col">
                  <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />
                      <span className="text-xs font-medium text-ink">Arriving in 6 minutes</span>
                    </div>
                    <span className="text-xs font-bold bg-yellow-300 px-1.5 py-0.5 rounded text-ink">
                      SG25 HYK
                    </span>
                  </div>
                  <div className="flex-1 bg-brand-green-muted/40 relative overflow-hidden">
                    <svg viewBox="0 0 200 280" className="absolute inset-0 w-full h-full">
                      <rect width="200" height="280" fill="#dde8e3" />
                      <path d="M0 80 Q200 75 200 90" stroke="#c5d5ce" strokeWidth="20" fill="none" />
                      <path d="M0 140 Q200 135 200 150" stroke="#c5d5ce" strokeWidth="20" fill="none" />
                      <path d="M0 200 Q200 195 200 210" stroke="#c5d5ce" strokeWidth="20" fill="none" />
                      <path d="M60 0 Q70 70 60 140 Q50 200 70 280" stroke="#4f917a" strokeWidth="5" fill="none" strokeLinecap="round" />
                      <circle cx="63" cy="160" r="7" fill="#252a31" />
                      <circle cx="63" cy="160" r="4" fill="white" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Affordable */}
      <section className="py-14 lg:py-28 border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-4">
              We&apos;ve made it affordable
            </h2>
            <p className="text-slate-11 max-w-xl mx-auto leading-relaxed">
              A £300 fee per journey, covering the cost of getting the coach to you.
              <br className="hidden sm:block" />
              Then £60 per hour of driving or boarding, and £20 per hour waiting.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {PRICING_CARDS.map((card) => (
              <div
                key={card.title}
                className="relative rounded-md overflow-hidden h-56 sm:h-80 group cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.bg}
                  alt={card.alt}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <h3 className="text-white font-semibold text-base leading-snug max-w-[85%]">
                    {card.title}
                  </h3>
                  <div className="flex items-end justify-between">
                    <span className="text-white font-bold text-xl">{card.price}</span>
                    <Link
                      href="/book"
                      className="text-white text-sm underline underline-offset-2 hover:text-white/80 transition-colors"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enjoyable */}
      <section className="py-14 lg:py-28 border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-12 text-center">
            We&apos;ve made it enjoyable
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="text-brand-green shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <h3 className="font-semibold text-ink mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-11 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 lg:py-28 border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <FAQAccordion />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-[--spacing-container-x]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <EmberLogo width={72} />
            <p className="text-xs text-slate-11">
              © {new Date().getFullYear()} Ember. All rights reserved.
            </p>
            <div className="flex gap-5">
              {['Privacy', 'Terms'].map((link) => (
                <Link key={link} href="#" className="text-xs text-slate-11 hover:text-ink transition-colors">
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

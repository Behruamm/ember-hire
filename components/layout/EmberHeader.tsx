'use client'

import type React from 'react'
import Link from 'next/link'
import { useState } from 'react'
import EmberLogo from '@/components/ui/EmberLogo'

const NAV_LINKS = [
  { label: 'Live Map', href: '#' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Hire', href: '/' },
  { label: 'Contact', href: '#contact' },
] as const

interface EmberHeaderProps {
  /** When true the header overlays a dark hero — transparent bg, white text */
  transparent?: boolean
  /** Optional element rendered as a thin progress line at the bottom of the header */
  progressLine?: React.ReactNode
}

export default function EmberHeader({ transparent = false, progressLine }: EmberHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      data-transparent={String(transparent)}
      className={[
        'relative z-50',
        transparent ? '' : 'sticky top-0',
      ].join(' ')}
    >
      <div className="nav-inner">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" aria-label="Ember home" className="nav-logo min-h-11 inline-flex items-center">
            <EmberLogo
              width={100}
              textColor={menuOpen ? 'var(--color-ink)' : transparent ? '#ffffff' : 'var(--color-ink)'}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="nav-link">
                {label}
              </Link>
            ))}
            <Link href="#" className="nav-login">
              Log in
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className={`md:hidden min-h-11 min-w-11 p-2 rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${menuOpen ? 'text-[var(--color-ink)]' : 'nav-hamburger'}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen ? 'true' : 'false'}
          >
            <div className="w-5 flex flex-col gap-[5px]">
              <span className={`h-px bg-current transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
              <span className={`h-px bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-px bg-current transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu overlay — sits on top, doesn't shift content */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-white flex flex-col"
          aria-label="Mobile navigation"
        >
          {/* Top bar mirrors the header */}
          <div className="flex items-center justify-between h-[var(--nav-height)] px-[var(--spacing-container-x)] shrink-0">
            <Link href="/" aria-label="Ember home" className="min-h-11 inline-flex items-center" onClick={() => setMenuOpen(false)}>
              <EmberLogo width={100} textColor="var(--color-ink)" />
            </Link>
            <button
              type="button"
              className="min-h-11 min-w-11 p-2 rounded-[var(--radius-sm)] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <div className="w-5 flex flex-col gap-[5px]">
                <span className="h-px bg-current rotate-45 translate-y-[6px]" />
                <span className="h-px bg-current opacity-0" />
                <span className="h-px bg-current -rotate-45 -translate-y-[6px]" />
              </div>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col px-[var(--spacing-container-x)] pt-2 pb-8 gap-1 border-t border-[var(--color-border-subtle)]">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="py-3 text-base font-medium text-[var(--color-ink)] hover:text-[var(--color-brand-green)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="#"
              onClick={() => setMenuOpen(false)}
              className="mt-4 nav-login text-center border-[var(--color-ink)] text-[var(--color-ink)]"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}

      {progressLine}
    </header>
  )
}

import Link from 'next/link'
import type { Company } from '@/payload-types'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/process', label: 'Process' },
  { href: '/brands', label: 'Brands' },
  { href: '/contact', label: 'Contact' },
]

export function Header({ company }: { company: Company | null }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-name">{company?.name ?? 'Global Auto Export'}</span>
          {company?.tagline ? <span className="brand-tagline">{company.tagline}</span> : null}
        </Link>
        <nav className="nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="nav-cta">
            Get a Quote
          </Link>
        </nav>
      </div>
    </header>
  )
}

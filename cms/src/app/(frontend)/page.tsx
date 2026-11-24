import Link from 'next/link'
import { getBrands, getCompany } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [company, brands] = await Promise.all([getCompany(), getBrands(true)])
  const featuredBrands = brands.slice(0, 6)

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{company?.heroTitle ?? 'Your Gateway to Premium Vehicle Export'}</h1>
          <p className="hero-subtitle">
            {company?.heroSubtitle ??
              'From sourcing and inspection to shipping and customs clearance, we handle the entire export journey.'}
          </p>
          <div className="hero-actions">
            <Link href="/brands" className="btn btn-primary">
              Browse Brands
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {company?.stats?.length ? (
        <section className="stats">
          <div className="container stats-grid">
            {company.stats.map((stat) => (
              <div key={stat.id ?? stat.label} className="stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <h2>{company?.aboutTitle ?? 'Who We Are'}</h2>
          {company?.about ? <p>{company.about}</p> : null}
          <Link href="/about" className="text-link">
            Learn more about us →
          </Link>
        </div>
      </section>

      {company?.strengths?.length ? (
        <section className="section section-alt">
          <div className="container">
            <h2>Why Choose Us</h2>
            <div className="grid strengths-grid">
              {company.strengths.map((strength) => (
                <div key={strength.id ?? strength.title} className="card">
                  <h3>{strength.title}</h3>
                  {strength.description ? <p>{strength.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featuredBrands.length ? (
        <section className="section">
          <div className="container">
            <h2>Our Brands</h2>
            <div className="grid brands-grid">
              {featuredBrands.map((brand) => (
                <div key={brand.id} className="card brand-card">
                  <h3>{brand.name}</h3>
                  {brand.origin ? <span className="badge">{brand.origin}</span> : null}
                  {brand.description ? <p>{brand.description}</p> : null}
                </div>
              ))}
            </div>
            <Link href="/brands" className="text-link">
              View all brands →
            </Link>
          </div>
        </section>
      ) : null}

      {company?.processSteps?.length ? (
        <section className="section section-alt">
          <div className="container">
            <h2>How It Works</h2>
            <div className="grid process-grid">
              {company.processSteps.slice(0, 3).map((step, index) => (
                <div key={step.id ?? step.title} className="card">
                  <span className="step-number">{index + 1}</span>
                  <h3>{step.title}</h3>
                  {step.description ? <p>{step.description}</p> : null}
                </div>
              ))}
            </div>
            <Link href="/process" className="text-link">
              See the full process →
            </Link>
          </div>
        </section>
      ) : null}

      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Ready to start your order?</h2>
          <p>Get in touch with our export team today.</p>
          <Link href="/contact" className="btn btn-primary">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  )
}

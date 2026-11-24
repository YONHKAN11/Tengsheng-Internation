import type { Metadata } from 'next'
import { getCompany } from '@/lib/site'

export const metadata: Metadata = { title: 'About Us' }

export default async function AboutPage() {
  const company = await getCompany()

  return (
    <div className="page container">
      <h1>{company?.aboutTitle ?? 'About Us'}</h1>
      {company?.about ? <p className="lead">{company.about}</p> : null}

      {company?.mission ? (
        <section>
          <h2>{company?.missionTitle ?? 'Our Mission'}</h2>
          <p>{company.mission}</p>
        </section>
      ) : null}

      {company?.strengths?.length ? (
        <section>
          <h2>Why Choose Us</h2>
          <div className="grid strengths-grid">
            {company.strengths.map((strength) => (
              <div key={strength.id ?? strength.title} className="card">
                <h3>{strength.title}</h3>
                {strength.description ? <p>{strength.description}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {company?.stats?.length ? (
        <section>
          <h2>By the Numbers</h2>
          <div className="stats-grid">
            {company.stats.map((stat) => (
              <div key={stat.id ?? stat.label} className="stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

import type { Metadata } from 'next'
import { getCompany } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Our Process' }

export default async function ProcessPage() {
  const company = await getCompany()
  const steps = company?.processSteps ?? []

  return (
    <div className="page container">
      <h1>Our Export Process</h1>
      <p className="lead">A transparent, step-by-step journey from inquiry to delivery.</p>

      {steps.length ? (
        <ol className="process-list">
          {steps.map((step, index) => (
            <li key={step.id ?? step.title} className="process-item">
              <span className="step-number">{index + 1}</span>
              <div>
                <h2>{step.title}</h2>
                {step.description ? <p>{step.description}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p>Process details will be added soon. Please check back later.</p>
      )}
    </div>
  )
}

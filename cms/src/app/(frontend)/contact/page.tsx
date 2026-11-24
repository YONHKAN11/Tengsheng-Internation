import type { Metadata } from 'next'
import { getCompany } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Contact' }

export default async function ContactPage() {
  const company = await getCompany()
  const contact = company?.contact

  return (
    <div className="page container">
      <h1>Contact Us</h1>
      <p className="lead">
        Our export team is ready to help you source and ship your next vehicle.
      </p>

      <div className="grid contact-grid">
        <div className="contact-cards">
          {contact?.email ? (
            <a className="card contact-card" href={`mailto:${contact.email}`}>
              <h2>Email</h2>
              <p>{contact.email}</p>
            </a>
          ) : null}
          {contact?.phone ? (
            <a className="card contact-card" href={`tel:${contact.phone}`}>
              <h2>Phone</h2>
              <p>{contact.phone}</p>
            </a>
          ) : null}
          {contact?.whatsapp ? (
            <a
              className="card contact-card"
              href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <h2>WhatsApp</h2>
              <p>{contact.whatsapp}</p>
            </a>
          ) : null}
        </div>

        <div className="contact-info">
          {contact?.address ? (
            <div>
              <h2>Office</h2>
              <p>{contact.address}</p>
            </div>
          ) : null}
          {contact?.hours ? (
            <div>
              <h2>Business Hours</h2>
              <p>{contact.hours}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

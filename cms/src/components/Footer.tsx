import type { Company } from '@/payload-types'

export function Footer({ company }: { company: Company | null }) {
  const contact = company?.contact
  const name = company?.name ?? 'Global Auto Export'

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <p className="footer-name">{name}</p>
          {company?.tagline ? <p className="footer-tagline">{company.tagline}</p> : null}
        </div>
        <div className="footer-contact">
          {contact?.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : null}
          {contact?.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : null}
          {contact?.whatsapp ? (
            <a
              href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
          ) : null}
          {contact?.address ? <p>{contact.address}</p> : null}
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} {name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

import React from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { getCompany } from '@/lib/site'
import './styles.css'

export async function generateMetadata() {
  const company = await getCompany()
  const name = company?.name ?? 'Global Auto Export'
  return {
    title: {
      default: `${name} — Premium Vehicle Export`,
      template: `%s | ${name}`,
    },
    description:
      company?.tagline ??
      'International vehicle export: sourcing, inspection, shipping and delivery of quality vehicles worldwide.',
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const company = await getCompany()

  return (
    <html lang="en">
      <body>
        <Header company={company} />
        <main>{children}</main>
        <Footer company={company} />
      </body>
    </html>
  )
}

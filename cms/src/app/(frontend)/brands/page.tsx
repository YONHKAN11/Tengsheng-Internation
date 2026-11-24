import type { Metadata } from 'next'
import { getBrands } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Brands' }

export default async function BrandsPage() {
  const brands = await getBrands()

  return (
    <div className="page container">
      <h1>Brands We Export</h1>
      <p className="lead">
        Quality vehicles from the world&apos;s leading manufacturers.
      </p>

      {brands.length ? (
        <div className="grid brands-grid">
          {brands.map((brand) => (
            <div key={brand.id} className="card brand-card">
              <h2>{brand.name}</h2>
              {brand.origin ? <span className="badge">{brand.origin}</span> : null}
              {brand.description ? <p>{brand.description}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p>No brands added yet. Please add brands in the admin panel.</p>
      )}
    </div>
  )
}

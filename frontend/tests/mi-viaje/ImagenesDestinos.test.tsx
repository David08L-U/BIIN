import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { detalleIzamalPrototipo } from '../../src/features/transporte/data/detalleIzamalPrototipo'
import { detalleValladolidPrototipo } from '../../src/features/transporte/data/detalleValladolidPrototipo'
import { detalleTekitPrototipo } from '../../src/features/transporte/data/detalleTekitPrototipo'
import { detalleHomunPrototipo } from '../../src/features/transporte/data/detalleHomunPrototipo'
import { detalleTiculPrototipo } from '../../src/features/transporte/data/detalleTiculPrototipo'
import { imagenesItinerarioIzamal } from '../../src/features/mi-viaje/data/imagenesItinerarioIzamal'
import { lugaresHomun } from '../../src/features/mi-viaje/data/lugaresHomun'
import { lugaresTicul } from '../../src/features/mi-viaje/data/lugaresTicul'
import { lugaresValladolid } from '../../src/features/mi-viaje/data/lugaresValladolid'
import ImagenItinerario from '../../src/features/mi-viaje/components/ImagenItinerario'

describe('fotografías de destinos', () => {
  it.each([
    [detalleIzamalPrototipo, 'izamal-convento'],
    [detalleValladolidPrototipo, 'valladolid-convento'],
    [detalleTekitPrototipo, 'tekit-guayaberas'],
    [detalleHomunPrototipo, 'homun-cenote'],
    [detalleTiculPrototipo, 'ticul-alfareria'],
  ])('empaqueta el recurso cultural %s %s', (detalle, archivo) => {
    expect(detalle.imagenCultural).toContain(`/assets/destinos/${archivo}.jpg`)
  })

  it('usa recursos locales distintos para lugares distintos', () => {
    const recursos = [
      imagenesItinerarioIzamal.convento.src,
      ...[...lugaresHomun, ...lugaresTicul, ...lugaresValladolid]
        .flatMap(lugar => 'imagen' in lugar ? [lugar.imagen.src] : []),
    ]
    expect(recursos).toHaveLength(11)
    expect(new Set(recursos).size).toBe(recursos.length)
    for (const src of recursos) expect(src).toMatch(/\/assets\/destinos\/.*\.jpg$/)
    expect(detalleIzamalPrototipo.imagenCultural).toBe(imagenesItinerarioIzamal.convento.src)
  })

  it('mantiene el nombre del lugar si falta la foto o falla la carga', () => {
    render(<>
      <ImagenItinerario {...imagenesItinerarioIzamal.piramide} />
      <ImagenItinerario {...imagenesItinerarioIzamal.convento} />
    </>)
    expect(screen.getByRole('img', { name: /Pirámide Kinich Kakmó/ })).not.toHaveAttribute('src')
    fireEvent.error(screen.getByRole('img', { name: /arcadas amarillas/ }))
    expect(screen.getByRole('img', { name: /arcadas amarillas/ })).toHaveTextContent('no disponible')
    expect(screen.getByRole('img', { name: /arcadas amarillas/ })).toHaveAccessibleDescription('Imagen no disponible')
  })
})

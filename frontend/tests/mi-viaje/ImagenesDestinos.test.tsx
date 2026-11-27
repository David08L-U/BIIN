import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { detalleIzamalPrototipo } from '../../src/features/transporte/data/detalleIzamalPrototipo'
import { detalleValladolidPrototipo } from '../../src/features/transporte/data/detalleValladolidPrototipo'
import { detalleTekitPrototipo } from '../../src/features/transporte/data/detalleTekitPrototipo'
import { detalleHomunPrototipo } from '../../src/features/transporte/data/detalleHomunPrototipo'
import { detalleTiculPrototipo } from '../../src/features/transporte/data/detalleTiculPrototipo'
import { fotografiaLugar, fotografiasRepresentativasDestino, lugaresExplorar } from '../../src/features/explorar/data/lugaresExplorar'
import ImagenItinerario from '../../src/features/mi-viaje/components/ImagenItinerario'
import FotografiaDestino from '../../src/components/ui/FotografiaDestino'

describe('fotografías de destinos y lugares', () => {
  it('usa fotos Commons verificadas para sitios concretos en los detalles', () => {
    expect(detalleIzamalPrototipo.imagenCultural).toContain('/assets/explorar/izamal-convento.jpg')
    expect(detalleValladolidPrototipo.imagenCultural).toContain('/assets/explorar/valladolid-san-bernardino.jpg')
    expect(detalleTiculPrototipo.imagenCultural).toContain('/assets/explorar/ticul-iglesia-san-antonio.jpg')
    expect(detalleHomunPrototipo.imagenCultural).toBeUndefined()
    expect(detalleTekitPrototipo.imagenCultural).toBeUndefined()
  })

  it('reutiliza una foto de destino solo para ese destino en las tarjetas', () => {
    expect(fotografiasRepresentativasDestino.izamal?.alt).toMatch(/convento de San Antonio/)
    expect(fotografiasRepresentativasDestino.valladolid?.alt).toMatch(/San Bernardino/)
    expect(fotografiasRepresentativasDestino.ticul?.alt).toMatch(/Parroquia de San Antonio/)
    expect(fotografiasRepresentativasDestino.homun).toBeUndefined()
    expect(fotografiasRepresentativasDestino.tekit).toBeUndefined()
  })

  it('mantiene foto, texto alternativo, crédito y fuente específicos de cada lugar', () => {
    const mercado = fotografiaLugar('izamal', 'mercado')!
    const kinich = fotografiaLugar('izamal', 'kinich')!
    const calzada = fotografiaLugar('valladolid', 'calzada-frailes')!
    const iglesia = fotografiaLugar('ticul', 'iglesia-san-antonio')!
    expect(mercado.alt).toMatch(/Mercado Municipal de Izamal/)
    expect(kinich.alt).toMatch(/restaurante Kinich/)
    expect(calzada.alt).toMatch(/Calzada de los Frailes/)
    expect(iglesia.alt).toMatch(/Parroquia.*Ticul/)
    for (const foto of [mercado, kinich, calzada, iglesia]) {
      expect(foto.src).toMatch(/\/assets\/explorar\/.*\.jpg$/)
      expect(foto.credito).toMatch(/Commons/)
      expect(foto.fuente).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
    }
    const fotos = lugaresExplorar.flatMap(lugar => lugar.imagen ? [`${lugar.destino}:${lugar.id}:${lugar.imagen.src}`] : [])
    expect(fotos).toHaveLength(9)
    expect(new Set(fotos.map(foto => foto.split(':').slice(2).join(':'))).size).toBe(9)
  })

  it('muestra una alternativa accesible si falta la fotografía o falla su carga', () => {
    const convento = fotografiaLugar('izamal', 'convento')!
    const vista = render(<>
      <ImagenItinerario alt="Fotografía de Pirámide Kabul pendiente de verificar" />
      <ImagenItinerario src={convento.src} alt={convento.alt} />
    </>)
    expect(screen.getByRole('img', { name: /Pirámide Kabul/ })).toHaveTextContent('pendiente de verificación')
    fireEvent.error(screen.getByRole('img', { name: /Arcadas del convento/ }))
    expect(screen.getByRole('img', { name: /Arcadas del convento/ })).toHaveTextContent('no disponible')
    expect(screen.getByRole('img', { name: /Arcadas del convento/ })).toHaveAccessibleDescription('Imagen no disponible')
    vista.unmount()
    render(<FotografiaDestino foto={convento} destino="Izamal" className="miniatura" />)
    fireEvent.error(screen.getByRole('img', { name: /Arcadas del convento/ }))
    expect(screen.getByRole('img', { name: 'Fotografía no disponible de Izamal' })).toBeInTheDocument()
  })
})

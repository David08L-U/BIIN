import { fotografiaLugar } from '../../explorar/data/lugaresExplorar'

/** Fotografías verificadas y mapa ilustrativo del prototipo de Izamal. */
const convento = fotografiaLugar('izamal', 'convento')!
const piramide = fotografiaLugar('izamal', 'piramide')!
export const imagenesItinerarioIzamal: Record<string, { src?: string; alt: string; recorte?: string }> = {
  mapa: { alt: 'Mapa ilustrativo de Izamal; no representa ubicación en tiempo real', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0boOaeVmBiJa0OtzrcMOHGaKeoVoznd6OXQzuQLt7GGlwDoctpK8SCfbH3CNp_IUFe4qdf1KFss01y0Nq3BT3ybBWPBIw9YBOQPQOniKlduJvtk8Tu0Hyk58WtWmuAqASEkzkWFqdMkKvi_jI-WjBQsXVbiWqS3aI0wn46RYw9aDZpX13P4KPX7XapW6WgS_SGAjS5POrP2Ap4tN9hqBgXJ3QYl3PPGcF9Wxz-kNl' },
  convento: { src: convento.src, alt: convento.alt, recorte: 'inset(6% 0 0)' },
  piramide: { src: piramide.src, alt: piramide.alt },
}
import MapaBase from '../../../maps/MapaBase'

/** Pantalla inicial: búsqueda de rutas por origen y destino (CU-02) sobre el mapa. */
export default function InicioPage() {
  return (
    <section className="pagina">
      <h1>¿A dónde vas?</h1>
      <p>Busca rutas de combi entre municipios de Yucatán.</p>
      {/* El buscador de origen y destino se conecta en el módulo de transporte */}
      <MapaBase />
    </section>
  )
}

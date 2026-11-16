/** Marcador temporal de un módulo que aún no se programa. */
export default function PaginaEnConstruccion({ titulo, casos }: { titulo: string; casos: string }) {
  return (
    <section className="pagina">
      <h1>{titulo}</h1>
      <p>Este módulo está en desarrollo ({casos}).</p>
    </section>
  )
}

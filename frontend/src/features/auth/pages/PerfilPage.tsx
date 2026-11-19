import { Link, useNavigate } from 'react-router'
import { useAuth } from '../useAuth'
import { usePlanes } from '../../mi-viaje/usePlanes'
import { useFavoritos } from '../../mi-viaje/useFavoritos'
import { buscarDestino } from '../../../services/catalogo'
import CabeceraPagina from '../../../components/ui/CabeceraPagina'
import Icono from '../../../components/ui/Icono'
export default function PerfilPage() {
  const { usuario, cerrarSesion } = useAuth(),
    { planes } = usePlanes(),
    { favoritos } = useFavoritos(),
    navegar = useNavigate()
  return (
    <section className="pagina perfil-page">
      <CabeceraPagina titulo="Mi perfil" />
      <p className="eyebrow texto-ambar">
        {usuario ? 'SESIÓN ACTIVA' : 'MODO VISITANTE'}
      </p>
      <div className="tarjeta perfil-usuario">
        <span className="avatar grande">
          {usuario?.nombre?.slice(0, 1).toUpperCase() ?? (
            <Icono nombre="persona" />
          )}
        </span>
        <div>
          <h2>{usuario?.nombre ?? 'Hola, viajero'}</h2>
          <span className="texto-ambar">
            {usuario ? 'Cuenta BIIN' : 'Yucatán te espera'}
          </span>
          <p className="muted">
            {usuario?.correo ?? 'Inicia sesión para acceder a tu cuenta.'}
          </p>
        </div>
      </div>
      {!usuario && (
        <Link className="boton boton--primario" to="/login">
          Iniciar sesión / Crear cuenta
        </Link>
      )}
      <div className="fila perfil-seccion">
        <span className="eyebrow">TU PLANEACIÓN LOCAL</span>
        <Link to="/mi-viaje">Ver planes</Link>
      </div>
      <div className="metricas-perfil">
        {(
          [
            [planes.length, 'Borradores', 'calendario'],
            [favoritos.length, 'Favoritos', 'ruta'],
            [
              new Set(planes.map((p) => p.destinoId)).size,
              'Destinos planeados',
              'templo',
            ],
          ] as const
        ).map(([n, t, i]) => (
          <div className="tarjeta" key={t}>
            <span className="icono-caja">
              <Icono nombre={i} />
            </span>
            <strong>{n}</strong>
            <p>{t}</p>
          </div>
        ))}
      </div>
      <p className="muted">
        Estos contadores reflejan lo guardado en este navegador; no representan
        viajes realizados.
      </p>
      <div className="fila perfil-seccion">
        <h2>Itinerarios guardados</h2>
        <Link to="/mi-viaje">Gestionar</Link>
      </div>
      {planes.length ? (
        <div className="planes-perfil">
          {planes.slice(0, 2).map((p) => (
            <div className="tarjeta" key={p.id}>
              <Icono nombre="calendario" />
              <h3>{buscarDestino(p.destinoId)?.nombre ?? 'Destino'}</h3>
              <p>
                {p.actividades.length} paradas · {p.fecha}
              </p>
              <Link
                className="boton boton--secundario"
                to={`/itinerario/${p.destinoId}?plan=${p.id}`}
              >
                Ver itinerario
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="tarjeta">
          <p>Aún no guardas un itinerario.</p>
          <Link to="/rutas">Planear mi primera visita</Link>
        </div>
      )}
      <div className="perfil-enlaces">
        <Link to="/favoritos">
          <Icono nombre="guardar" />
          Destinos favoritos
          <Icono nombre="flecha" />
        </Link>
        <Link to="/ayuda">
          <Icono nombre="ajustes" />
          Preferencias y accesibilidad
          <Icono nombre="flecha" />
        </Link>
        <Link to="/ayuda">
          <Icono nombre="ayuda" />
          Centro de ayuda
          <Icono nombre="flecha" />
        </Link>
      </div>
      {usuario && (
        <button
          className="boton-salir"
          onClick={() => {
            cerrarSesion()
            navegar('/login')
          }}
        >
          <Icono nombre="salir" />
          Cerrar sesión / Cambiar cuenta
        </button>
      )}
      <p className="pie-marca">BIIN · Movilidad regional</p>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router'
import '../../../styles/perfil.css'

export interface ItinerarioPerfil {
  id: string
  nombre: string
  paradas: number
  url: string
  icono: string
  guardadoEn?: string
}

export interface DatosPerfil {
  nombre: string
  correo: string
  telefono?: string
  foto?: string
  periodo: string
  movilidad: [number | null, number | null, number | null]
  ultimoTrayecto?: {
    codigo: string
    servicio: string
    tarifa: string
    origen: string
    destino: string
    salida: string
    llegada: string
  }
  itinerarios: ItinerarioPerfil[]
  errorItinerarios?: string | null
}

interface Props {
  datos: DatosPerfil
  demostracion?: boolean
  onCerrarSesion?: () => void
}

function Icono({ nombre }: { nombre: string }) {
  return <span className="biin-icon" aria-hidden="true">{nombre}</span>
}

/** Vista del prototipo; recibe datos sin modificar cuentas ni crear sesiones. */
export default function PerfilVista({ datos, demostracion = false, onCerrarSesion }: Props) {
  const [aviso, setAviso] = useState('')
  const [fotoFallida, setFotoFallida] = useState(false)
  const iniciales = datos.nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('es') || 'BI'
  const metricas = [
    { etiqueta: 'Viajes hechos', icono: 'airport_shuttle' },
    { etiqueta: 'Rutas fijas', icono: 'alt_route' },
    { etiqueta: 'Pueblos Mágicos', icono: 'temple_hindu' },
  ]

  function cerrarSesion() {
    if (demostracion || !onCerrarSesion) {
      setAviso('Esta vista previa no tiene una sesión real que cerrar.')
      return
    }
    onCerrarSesion()
  }

  return <section className="perfil" aria-labelledby="perfil-titulo">
    <header className="perfil-cabecera">
      <Link to="/" className="perfil-volver" aria-label="Volver al inicio"><Icono nombre="arrow_back" /></Link>
      <h1 id="perfil-titulo">Mi perfil</h1>
    </header>

    <div className="perfil-cuerpo">
      {demostracion && <p className="perfil-demostracion">Vista previa · Datos de demostración. No representa una sesión ni actividad real.</p>}

      <div className="perfil-acciones-superiores">
        <span className="perfil-sesion"><i aria-hidden="true" />{demostracion ? 'Vista previa' : 'Sesión activa'}</span>
        <button type="button" className="perfil-editar" onClick={() => setAviso('La edición del perfil estará disponible cuando se integre el servicio de cuentas. No se ha modificado ningún dato.')}>
          <Icono nombre="edit" />Editar perfil
        </button>
      </div>

      <div className="perfil-mensaje" role="status" aria-live="polite">{aviso}</div>

      <div className="perfil-identidad perfil-tarjeta">
        <div className="perfil-avatar">
          {datos.foto && !fotoFallida
            ? <img src={datos.foto} alt="" onError={() => setFotoFallida(true)} />
            : <span aria-hidden="true">{iniciales}</span>}
        </div>
        <div className="perfil-identidad-texto">
          <h2>{datos.nombre}</h2>
          <p className="perfil-cuenta"><Icono nombre="person" />{demostracion ? 'Cuenta de ejemplo' : 'Cuenta BIIN'}</p>
          <p className="perfil-contacto"><Icono nombre="mail" /><span>{datos.correo}</span></p>
          <p className="perfil-contacto"><Icono nombre="call" /><span>{datos.telefono ?? 'Teléfono no disponible'}</span></p>
        </div>
      </div>

      <section aria-labelledby="perfil-movilidad-titulo">
        <div className="perfil-seccion-cabecera">
          <h2 id="perfil-movilidad-titulo">Movilidad del mes · {datos.periodo}</h2>
          <button type="button" className="perfil-enlace" onClick={() => setAviso('El historial de viajes todavía no está disponible. Los itinerarios guardados no acreditan viajes realizados.')}>Ver historial</button>
        </div>
        <div className="perfil-metricas">
          {metricas.map((metrica, indice) => <div className="perfil-metrica perfil-tarjeta" key={metrica.etiqueta}>
            <span className="perfil-icono-cuadro"><Icono nombre={metrica.icono} /></span>
            <strong aria-label={datos.movilidad[indice] === null ? 'Sin datos disponibles' : undefined}>{datos.movilidad[indice] ?? '—'}</strong>
            <span>{metrica.etiqueta}</span>
          </div>)}
        </div>
        {!demostracion && <p className="perfil-nota">Historial de movilidad pendiente de integrar.</p>}
      </section>

      <section aria-labelledby="perfil-trayecto-titulo">
        <div className="perfil-seccion-cabecera"><h2 id="perfil-trayecto-titulo">Último trayecto</h2></div>
        <div className="perfil-tarjeta perfil-trayecto">
          {datos.ultimoTrayecto ? <>
            <div className="perfil-trayecto-resumen">
              <span className="perfil-codigo">{datos.ultimoTrayecto.codigo}</span>
              <span>{datos.ultimoTrayecto.servicio}</span>
              <strong>{datos.ultimoTrayecto.tarifa}</strong>
            </div>
            <div className="perfil-recorrido">
              <div className="perfil-recorrido-puntos" aria-hidden="true"><i /><span /><i /></div>
              <div className="perfil-recorrido-texto">
                <p><strong>{datos.ultimoTrayecto.origen}</strong><span>{datos.ultimoTrayecto.salida}</span></p>
                <p><strong>{datos.ultimoTrayecto.destino}</strong><span>{datos.ultimoTrayecto.llegada}</span></p>
              </div>
            </div>
          </> : <>
            <p>Todavía no hay un historial de trayectos disponible.</p>
            <Link className="perfil-enlace" to="/rutas">Consultar rutas</Link>
          </>}
        </div>
      </section>

      <section aria-labelledby="perfil-itinerarios-titulo">
        <div className="perfil-seccion-cabecera">
          <h2 id="perfil-itinerarios-titulo">Itinerarios guardados</h2>
          <Link className="perfil-enlace" to="/mi-viaje">Gestionar</Link>
        </div>
        {datos.errorItinerarios && <p className="perfil-error" role="alert">{datos.errorItinerarios}</p>}
        {datos.itinerarios.length ? <ul className="perfil-itinerarios">
          {datos.itinerarios.slice(0, 2).map(item => <li className="perfil-tarjeta perfil-itinerario" key={item.id}>
            <div className="perfil-itinerario-iconos"><span className="perfil-icono-cuadro"><Icono nombre={item.icono} /></span><Icono nombre="bookmark" /></div>
            <h3>{item.nombre}</h3>
            <p><Icono nombre="pin_drop" />{item.paradas} {item.paradas === 1 ? 'parada' : 'paradas'}</p>
            {item.guardadoEn && <p className="perfil-fecha">Guardado: {new Date(item.guardadoEn).toLocaleString('es-MX')}</p>}
            <Link to={item.url} className="perfil-ver-ruta" aria-label={`Ver ruta de ${item.nombre}`}>Ver ruta</Link>
          </li>)}
        </ul> : <div className="perfil-tarjeta perfil-vacio"><p>{datos.errorItinerarios ? 'No se pueden mostrar los itinerarios en este momento.' : 'No hay itinerarios guardados para esta cuenta en este navegador.'}</p><Link className="perfil-enlace" to="/rutas">Explorar destinos</Link></div>}
        <p className="perfil-nota">{demostracion ? 'Las tarjetas son ejemplos del prototipo.' : 'Guardados solo en este navegador. Sin sincronización con el servidor.'}</p>
      </section>

      <div className="perfil-acciones-cuenta">
        <button type="button" className="perfil-accion" onClick={() => setAviso('Las preferencias de viaje y accesibilidad estarán disponibles en una próxima etapa. No se han cambiado tus ajustes.')}>
          <Icono nombre="tune" /><span>Preferencias de viaje y accesibilidad</span><Icono nombre="chevron_right" />
        </button>
        <button type="button" className="perfil-accion" onClick={() => setAviso('El centro de asistencia todavía no está integrado. No se ha enviado ninguna solicitud.')}>
          <Icono nombre="help_center" /><span>Centro de Asistencia Ciudadana</span><Icono nombre="chevron_right" />
        </button>
        <button type="button" className="perfil-cerrar-sesion" onClick={cerrarSesion}><Icono nombre="logout" />Cerrar sesión / Cambiar cuenta</button>
      </div>
      <p className="perfil-pie">BIIN · Movilidad Regional</p>
    </div>
  </section>
}

import type { DestinoId } from '../../destinos/contratos'
import { adaptarPlanificador, aplicarPlanSecuencial, cambiarSeleccionSecuencial, jornadasSecuenciales, seleccionSecuencial, type Planificador } from './adaptarPlanificador'
import { resumirRecorrido } from './recorridoSecuencial'
import { ventanasJornadas } from './recorridoJornadas'
import { descargarTextoPlan, textoJornadas } from './accionesPlan'
import { horaLocal } from './tiempoLocal'
import { duracionPlan } from './duracion'
import ConfiguracionViaje from '../components/ConfiguracionViaje'
import { leerBorradorIzamal, parametrosBorrador, urlBorrador } from './borradorIzamal'
import { categoriasIzamal, lugaresIzamal, filtrosRecorridoIzamal, TRASLADO_FINAL_MINUTOS, MARGEN_FINAL_MINUTOS } from '../data/lugaresIzamal'
import { calcularPlan, estanciasIzamal, type BorradorIzamal, type PlanIzamal } from './itinerarioIzamal'
import ConfiguracionValladolid from '../components/ConfiguracionValladolid'
import { leerBorradorValladolid, parametrosBorradorValladolid, urlBorradorValladolid } from './borradorValladolid'
import { categoriasValladolid, lugaresValladolid } from '../data/lugaresValladolid'
import { calcularPlanValladolid, estanciasValladolid, type BorradorValladolid, type PlanValladolid, resumirJornadaValladolid, ventanasValladolid } from './itinerarioValladolid'
import { descargarValladolid } from './accionesValladolid'
import ConfiguracionTekit from '../components/ConfiguracionTekit'
import { leerBorradorTekit, parametrosBorradorTekit, urlBorradorTekit } from './borradorTekit'
import { categoriasTekit, lugaresTekit, REGRESO_TEKIT, MARGEN_TEKIT } from '../data/lugaresTekit'
import { calcularPlanTekit, modalidadesTekit, type BorradorTekit, type PlanTekit } from './itinerarioTekit'
import { descargarTekit } from './accionesTekit'
import ConfiguracionHomun from '../components/ConfiguracionHomun'
import { leerBorradorHomun, parametrosBorradorHomun, urlBorradorHomun } from './borradorHomun'
import { categoriasHomun, lugaresHomun, nombreTrasladoHomun } from '../data/lugaresHomun'
import { calcularPlanHomun, estanciasHomun, type BorradorHomun, type PlanHomun, resumirJornadaHomun, ventanasHomun } from './itinerarioHomun'
import { descargarHomun } from './accionesHomun'
import ConfiguracionTicul from '../components/ConfiguracionTicul'
import { leerBorradorTicul, parametrosBorradorTicul, urlBorradorTicul } from './borradorTicul'
import { categoriasTicul, lugaresTicul, nombreTrasladoTicul, REGRESO_TICUL, MARGEN_TICUL, avisoTrasladoComidaTicul } from '../data/lugaresTicul'
import { calcularPlanTicul, modalidadesTicul, type BorradorTicul, type PlanTicul } from './itinerarioTicul'
import { descargarTicul } from './accionesTicul'

function nombreEstancia(opciones: Readonly<Record<string, { nombre: string }>>, id: string) {
  return Object.hasOwn(opciones, id) ? opciones[id].nombre : 'Estancia sin validar'
}

export const planificadores: Record<DestinoId, Planificador> = {
  izamal: adaptarPlanificador<BorradorIzamal, PlanIzamal>({
    nombre: 'Izamal',
    subtitulo: 'Izamal · Pueblo Mágico',
    contexto: 'Elige tus paradas en Izamal',
    nota: 'Información demostrativa. Aperturas, tarifas y transporte por confirmar; traslados estimados.',
    icono: 'schedule',
    categoriaInicial: 'gastronomia',
    categorias: categoriasIzamal,
    filtros: filtrosRecorridoIzamal,
    lugares: lugaresIzamal.map(lugar => ({ ...lugar, icono: categoriasIzamal.find(categoria => categoria.id === lugar.categoria)?.icono ?? 'place' })),
    consejos: [{ icono: 'wb_sunny', titulo: 'Protección solar', descripcion: 'Usa sombrero y mantén agua fresca en mano.' }, { icono: 'payments', titulo: 'Efectivo en mano', descripcion: 'Consulta los medios de pago, precios y horarios con cada lugar antes de visitarlo.' }],
    recorrido: 'Paso a paso a pie',
    inicio: 'Izamal Centro',
    enlaceManual: true,
    etiquetaTraslados: 'desplazamientos con regreso',
    estancia: id => nombreEstancia(estanciasIzamal, id),
    guardar: 'Guardar en este navegador',
  }, {
    leer: (parametros, modo) => {
      const borrador = leerBorradorIzamal(parametros)
      return modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado') ? { ...borrador, modo } : borrador
    },
    serializar: parametrosBorrador,
    url: urlBorrador,
    calcular: calcularPlan,
    conservarSeleccionRecomendada: true,
    Configuracion: ({ borrador, onChange }) => <ConfiguracionViaje configuracion={borrador.configuracion} onChange={configuracion => onChange({ ...borrador, configuracion, seleccionDia2: configuracion.estancia === 'fin-de-semana' ? borrador.seleccionDia2 : [] })} />,
    seleccion: seleccionSecuencial,
    cambiarSeleccion: cambiarSeleccionSecuencial,
    ventanas: borrador => ventanasJornadas({ ...borrador.configuracion, horaInicioDia2: borrador.configuracion.horaInicioDia2 ?? '', minutosDia2: borrador.configuracion.minutosDia2 ?? '' }),
    resumen: (ids, regreso) => resumirRecorrido(lugaresIzamal, ids, regreso ? TRASLADO_FINAL_MINUTOS : 0, MARGEN_FINAL_MINUTOS),
    jornadas: jornadasSecuenciales,
    aplicar: aplicarPlanSecuencial,
    descargar: (borrador, plan) => {
      const config = borrador.configuracion
      const lineas = plan.jornadas ? textoJornadas(plan.jornadas) : plan.bloques.map(bloque =>
        `${horaLocal(config, bloque.inicio)} – ${horaLocal(config, bloque.fin)} · ${bloque.titulo} · ${duracionPlan(bloque.fin - bloque.inicio)}`)
      descargarTextoPlan(['Tu Itinerario BIIN en Izamal', config.fecha, ...lineas].join('\n'), `biin-izamal-${config.fecha}.txt`)
    },
  }),
  valladolid: adaptarPlanificador<BorradorValladolid, PlanValladolid>({
    nombre: 'Valladolid',
    subtitulo: 'Valladolid · La Sultana del Oriente',
    contexto: 'Elige tus paradas en Valladolid',
    nota: 'Información demostrativa. Aperturas, tarifas y transporte por confirmar; traslados estimados.',
    icono: 'schedule',
    categoriaInicial: 'gastronomia',
    categorias: categoriasValladolid,
    filtros: [{ id: 'cultural-cenotes', nombre: 'Cultural & Cenotes' }, { id: 'gastronomia', nombre: 'Gastronomía' }],
    lugares: lugaresValladolid,
    categoriaRecorrido: lugar => lugar.categoria === 'gastronomia' ? 'gastronomia' : 'cultural-cenotes',
    consejos: [{ icono: 'footprint', titulo: 'Calzado cómodo', descripcion: 'Camina sobre adoquín colonial y aceras de piedra.' }, { icono: 'pool', titulo: 'Traje de baño y toalla', descripcion: 'Consulta las condiciones y aperturas antes de visitar el Cenote Zací.' }],
    recorrido: 'Paso a paso a pie',
    inicio: 'Valladolid Centro · Parque Principal Francisco Cantón',
    mostrarDia: true,
    cierreEnLista: true,
    etiquetaTraslados: 'traslados estimados y traslado final',
    estancia: id => nombreEstancia(estanciasValladolid, id),
    guardar: 'Guardar en este navegador',
  }, {
    leer: (parametros, modo) => {
      const borrador = leerBorradorValladolid(parametros, modo)
      return modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado') ? { ...borrador, modo } : borrador
    },
    serializar: parametrosBorradorValladolid,
    url: urlBorradorValladolid,
    calcular: calcularPlanValladolid,
    Configuracion: ConfiguracionValladolid,
    seleccion: borrador => borrador.seleccion,
    cambiarSeleccion: (borrador, seleccion) => ({ ...borrador, seleccion }),
    ventanas: borrador => ventanasValladolid(borrador.configuracion),
    resumen: resumirJornadaValladolid,
    jornadas: (_, plan) => plan.jornadas,
    aplicar: (borrador, plan) => ({ ...borrador, seleccion: plan.seleccion }),
    descargar: (borrador, plan) => descargarValladolid(borrador, plan),
  }),
  tekit: adaptarPlanificador<BorradorTekit, PlanTekit>({
    nombre: 'Tekit',
    subtitulo: 'Tekit · Tradición textil',
    contexto: 'Teje tu recorrido por Tekit',
    nota: 'Información demostrativa. Aperturas, tarifas y transporte por confirmar; traslados estimados.',
    icono: 'styler',
    categoriaInicial: 'textil',
    categorias: categoriasTekit,
    filtros: categoriasTekit.filter(categoria => categoria.id !== 'patrimonio'),
    lugares: lugaresTekit,
    consejos: [{ icono: 'straighten', titulo: 'Medidas para prendas', descripcion: 'Conoce tus tallas de hombro y pecho y consulta si ofrecen ajustes.' }, { icono: 'payments', titulo: 'Prepara tus compras', descripcion: 'Confirma precios, medios de pago y condiciones con cada taller.' }],
    recorrido: 'Paso a paso a pie',
    inicio: 'Tekit Centro · Parroquia de San Antonio',
    lista: 'Visitas de Tekit',
    etiquetaTraslados: 'desplazamientos con regreso',
    estancia: id => nombreEstancia(modalidadesTekit, id),
    tituloEstancia: 'Ruta Textil y Artesanal',
    guardar: 'Guardar en Mi viaje',
  }, {
    leer: (parametros, modo) => {
      const borrador = leerBorradorTekit(parametros, modo)
      return modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado') ? { ...borrador, modo } : borrador
    },
    serializar: parametrosBorradorTekit,
    url: urlBorradorTekit,
    calcular: calcularPlanTekit,
    Configuracion: ConfiguracionTekit,
    seleccion: seleccionSecuencial,
    cambiarSeleccion: cambiarSeleccionSecuencial,
    ventanas: borrador => ventanasJornadas({ ...borrador.configuracion, horaInicioDia2: borrador.configuracion.horaInicioDia2 ?? '', minutosDia2: borrador.configuracion.minutosDia2 ?? '' }),
    resumen: (ids, regreso) => resumirRecorrido(lugaresTekit, ids, regreso ? REGRESO_TEKIT : 0, MARGEN_TEKIT),
    jornadas: jornadasSecuenciales,
    aplicar: aplicarPlanSecuencial,
    descargar: (borrador, plan) => descargarTekit(borrador, plan),
  }),
  homun: adaptarPlanificador<BorradorHomun, PlanHomun>({
    nombre: 'Homún',
    subtitulo: 'Homún · Anillo de Cenotes',
    contexto: 'Elige tu circuito en Homún',
    nota: 'Información demostrativa. Aperturas, tarifas y transporte por confirmar; traslados estimados.',
    icono: 'water_drop',
    categoriaInicial: 'cenotes',
    categorias: categoriasHomun,
    filtros: categoriasHomun,
    lugares: lugaresHomun.map(lugar => ({ ...lugar, trasladoTexto: nombreTrasladoHomun(lugar), trasladoIcono: lugar.traslado.icono })),
    consejos: [{ icono: 'safety_check', titulo: 'Consulta requisitos y servicios', descripcion: 'Confirma condiciones de acceso, uso de chaleco y qué incluye cada establecimiento.' }, { icono: 'eco', titulo: 'Conservación del agua', descripcion: 'Consulta y respeta las normas de cada cenote sobre productos, ducha y cuidado del entorno.' }],
    recorrido: 'Paso a paso en mototaxi y a pie',
    inicio: 'Homún Centro',
    mostrarDia: true,
    etiquetaTraslados: 'traslados con regreso',
    estancia: id => nombreEstancia(estanciasHomun, id),
    tituloEstancia: 'Circuito de Cenotes y Aguas Sagradas',
    guardar: 'Guardar en Mi viaje',
  }, {
    leer: (parametros, modo) => {
      const borrador = leerBorradorHomun(parametros, modo)
      return modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado') ? { ...borrador, modo } : borrador
    },
    serializar: parametrosBorradorHomun,
    url: urlBorradorHomun,
    calcular: calcularPlanHomun,
    Configuracion: ConfiguracionHomun,
    seleccion: borrador => borrador.seleccion,
    cambiarSeleccion: (borrador, seleccion) => ({ ...borrador, seleccion }),
    ventanas: borrador => ventanasHomun(borrador.configuracion),
    resumen: resumirJornadaHomun,
    jornadas: (_, plan) => plan.jornadas,
    aplicar: (borrador, plan) => ({ ...borrador, seleccion: plan.seleccion }),
    descargar: (borrador, plan) => descargarHomun(borrador, plan),
  }),
  ticul: adaptarPlanificador<BorradorTicul, PlanTicul>({
    nombre: 'Ticul',
    subtitulo: 'Ticul · La Perla del Sur',
    contexto: 'Elige tus paradas en Ticul',
    nota: 'Información demostrativa. Aperturas, tarifas y transporte por confirmar; traslados estimados.' + ' ' + avisoTrasladoComidaTicul,
    icono: 'palette',
    categoriaInicial: 'artesanias',
    categorias: categoriasTicul,
    filtros: categoriasTicul.filter(categoria => categoria.id !== 'patrimonio'),
    lugares: lugaresTicul.map(lugar => ({ ...lugar, trasladoTexto: nombreTrasladoTicul(lugar), trasladoIcono: lugar.traslado.icono })),
    consejos: [{ icono: 'inventory_2', titulo: 'Empaque para cerámica', descripcion: 'Consulta si ofrecen empaque y cuáles son las condiciones para transportar piezas delicadas en la van.' }, { icono: 'handshake', titulo: 'Regateo justo', descripcion: 'Valora el trabajo artesanal y consulta precios y condiciones directamente en cada taller.' }],
    recorrido: 'Paso a paso a pie & mototaxi',
    inicio: 'Ticul Centro',
    lista: 'Recorrido de Ticul',
    cierreEnLista: true,
    etiquetaCompartir: 'Compartir itinerario',
    etiquetaTraslados: 'traslados con regreso',
    estancia: id => nombreEstancia(modalidadesTicul, id),
    tituloEstancia: 'Alfarería y Calzado Tradicional',
    guardar: 'Guardar en Mi viaje',
  }, {
    leer: (parametros, modo) => {
      const borrador = leerBorradorTicul(parametros, modo)
      return modo && (borrador.modo === 'recomendado' || borrador.modo === 'personalizado') ? { ...borrador, modo } : borrador
    },
    serializar: parametrosBorradorTicul,
    url: urlBorradorTicul,
    calcular: calcularPlanTicul,
    Configuracion: ConfiguracionTicul,
    seleccion: seleccionSecuencial,
    cambiarSeleccion: cambiarSeleccionSecuencial,
    ventanas: borrador => ventanasJornadas({ ...borrador.configuracion, horaInicioDia2: borrador.configuracion.horaInicioDia2 ?? '', minutosDia2: borrador.configuracion.minutosDia2 ?? '' }),
    resumen: (ids, regreso) => resumirRecorrido(lugaresTicul, ids, regreso ? REGRESO_TICUL : 0, MARGEN_TICUL),
    jornadas: jornadasSecuenciales,
    aplicar: aplicarPlanSecuencial,
    descargar: (borrador, plan) => descargarTicul(borrador, plan),
  }),
}

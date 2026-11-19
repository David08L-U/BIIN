import type { NombreIcono } from '../components/ui/Icono'
export type Interes = 'Cultura' | 'Gastronomía' | 'Cenotes' | 'Talleres'
export interface Parada { nombre: string; referencia: string; coordenadas: [number, number] }
export interface Destino {
 id: string; nombre: string; lema: string; etiqueta: string; icono: NombreIcono;
 precio: number; duracion: number; frecuencia: number; directo: boolean; cenotes: boolean;
 terminal: string; salida: string; llegada: string; regreso: string; coordenadas: [number,number]; paradas: Parada[]; foto?: string;
}
export interface Actividad {
 id: string; destinoId: string; titulo: string; descripcion: string; categoria: Interes;
 minutos: number; traslado: number; acceso: string; foto?: string;
}
export interface Plan {
 id: string; destinoId: string; fecha: string; inicio: string; limite: number; actividades: string[]; actualizadoEn: string;
}

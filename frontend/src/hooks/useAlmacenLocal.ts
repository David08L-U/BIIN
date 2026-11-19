import { useState } from 'react'
import type { SetStateAction } from 'react'
export function useAlmacenLocal<T>(clave:string, inicial:T, validar:(dato:unknown)=>dato is T) {
 const [error,setError]=useState('')
 const [valor,actualizar]=useState<T>(()=>{
  try {const dato=JSON.parse(localStorage.getItem(clave)??'null');return validar(dato)?dato:inicial} catch {return inicial}
 })
 const guardar=(nuevo:SetStateAction<T>):boolean=>{
  const dato=typeof nuevo==='function'?(nuevo as (prev:T)=>T)(valor):nuevo
  try {localStorage.setItem(clave,JSON.stringify(dato));setError('');actualizar(dato);return true}
  catch {setError('No se pudo guardar en este dispositivo. Revisa el espacio o los permisos de almacenamiento.');return false}
 }
 return [valor,guardar,error] as const
}

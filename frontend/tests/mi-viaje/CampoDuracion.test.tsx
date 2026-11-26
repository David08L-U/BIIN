import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CampoDuracion from '../../src/features/mi-viaje/components/CampoDuracion'

function Formulario({ inicial = '270' }: { inicial?: string }) {
  const [valor, cambiar] = useState(inicial)
  return <>
    <CampoDuracion valor={valor} onChange={cambiar} />
    <output aria-label="Minutos internos">{valor}</output>
  </>
}

function escribir(campo: string, value: string) {
  fireEvent.change(screen.getByRole('spinbutton', { name: campo }), { target: { value } })
}

describe('captura de la duración', () => {
  it('divide los minutos de un borrador anterior y recompone el nuevo total', () => {
    render(<Formulario />)
    expect(screen.getByRole('spinbutton', { name: 'Horas' })).toHaveValue(4)
    expect(screen.getByRole('spinbutton', { name: 'Minutos' })).toHaveValue(30)
    escribir('Minutos', '45')
    expect(screen.getByLabelText('Minutos internos')).toHaveTextContent('285')
  })

  it('conserva los campos vacíos y el otro valor mientras se escribe', () => {
    render(<Formulario inicial="" />)
    escribir('Horas', '4')
    expect(screen.getByRole('spinbutton', { name: 'Minutos' })).toHaveValue(null)
    expect(screen.getByLabelText('Minutos internos')).toBeEmptyDOMElement()
    escribir('Minutos', '0')
    expect(screen.getByLabelText('Minutos internos')).toHaveTextContent('240')
    escribir('Horas', '')
    expect(screen.getByRole('spinbutton', { name: 'Horas' })).toHaveValue(null)
    expect(screen.getByRole('spinbutton', { name: 'Minutos' })).toHaveValue(0)
    expect(screen.getByLabelText('Minutos internos')).toBeEmptyDOMElement()
  })

  it.each([
    ['-1', '30'], ['1.5', '30'], ['4', '60'], ['4', '-1'], ['4', '5.5'],
    ['0', '14'], ['12', '1'],
  ])('rechaza %s horas y %s minutos y describe el error', (horas, minutos) => {
    render(<Formulario />)
    escribir('Horas', horas)
    escribir('Minutos', minutos)
    expect(screen.getByLabelText('Minutos internos')).toBeEmptyDOMElement()
    expect(screen.getByRole('spinbutton', { name: 'Minutos' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('spinbutton', { name: 'Minutos' })).toHaveAccessibleDescription(/entero|entre 15 min y 12 h/)
  })

  it.each([['0', '15', '15'], ['12', '0', '720']])('acepta %s horas y %s minutos en el límite', (horas, minutos, total) => {
    render(<Formulario />)
    escribir('Horas', horas)
    escribir('Minutos', minutos)
    expect(screen.getByLabelText('Minutos internos')).toHaveTextContent(total)
    expect(screen.getByRole('spinbutton', { name: 'Horas' })).toHaveAttribute('aria-invalid', 'false')
  })
})

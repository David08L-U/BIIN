import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HorariosRuta from '../../src/features/transporte/components/HorariosRuta'
import type { HorarioRuta } from '../../src/features/transporte/types'
import { diasSemana } from '../../src/utils/formatoDatos'

/** Horarios ficticios exclusivos de pruebas. */
const horarios: HorarioRuta[] = [
  { idHorario: 101, diaSemana: 1, horaSalida: '18:45:00', vigenteDesde: '2020-01-01', vigenteHasta: '2020-12-31' },
  { idHorario: 102, diaSemana: 1, horaSalida: '07:15:00', vigenteDesde: '2026-01-01', vigenteHasta: null },
  { idHorario: 103, diaSemana: 1, horaSalida: '07:15:00', vigenteDesde: '2027-01-01', vigenteHasta: '2027-12-31' },
  { idHorario: 104, diaSemana: 5, horaSalida: '12:30:00', vigenteDesde: '2026-11-27', vigenteHasta: '2026-11-27' },
]

afterEach(() => vi.useRealTimers())

describe('horarios de ruta por día (RF03 / CU-03)', () => {
  it('inicia en el día de Yucatán, aunque en UTC ya sea el siguiente', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-28T03:00:00Z'))
    render(<HorariosRuta horarios={horarios} />)

    expect(screen.getByRole('combobox', { name: 'Día de la semana' })).toHaveValue('5')
    expect(screen.getByRole('list', { name: 'Salidas: Viernes' })).toHaveTextContent('12:30')
    expect(screen.queryByText('07:15')).not.toBeInTheDocument()
    expect(screen.getAllByText('Hora de Yucatán')).toHaveLength(1)
  })

  it('conserva cada salida y su vigencia, incluidas pasadas, futuras y horas repetidas', () => {
    const originales = structuredClone(horarios)
    render(<HorariosRuta horarios={horarios} />)
    fireEvent.change(screen.getByLabelText('Día de la semana'), { target: { value: '1' } })

    const filas = within(screen.getByRole('list', { name: 'Salidas: Lunes' })).getAllByRole('listitem')
    expect(filas).toHaveLength(3)
    expect(within(filas[0]).getByText('07:15')).toBeInTheDocument()
    expect(filas[0]).toHaveTextContent('Vigencia: desde 2026-01-01 · sin fecha de fin')
    expect(within(filas[1]).getByText('07:15')).toBeInTheDocument()
    expect(filas[1]).toHaveTextContent('Vigencia: desde 2027-01-01 hasta 2027-12-31')
    expect(within(filas[2]).getByText('18:45')).toBeInTheDocument()
    expect(filas[2]).toHaveTextContent('Vigencia: desde 2020-01-01 hasta 2020-12-31')
    expect(screen.queryByText('12:30')).not.toBeInTheDocument()
    expect(horarios).toEqual(originales)
  })

  it('permite consultar los siete días y volver a uno anterior con el teclado', async () => {
    const usuario = userEvent.setup()
    const semana = diasSemana.map((_, diaSemana) => ({ ...horarios[1], idHorario: 200 + diaSemana, diaSemana }))
    render(<HorariosRuta horarios={semana} />)
    await usuario.tab()
    const selector = screen.getByRole('combobox', { name: 'Día de la semana' })
    expect(selector).toHaveFocus()
    expect(within(selector).getAllByRole('option')).toHaveLength(7)

    for (const dia of [0, 1, 2, 3, 4, 5, 6, 1]) {
      await usuario.selectOptions(selector, String(dia))
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
      expect(screen.getByRole('list', { name: `Salidas: ${diasSemana[dia]}` })).toHaveTextContent('07:15')
      expect(screen.getAllByText('Hora de Yucatán')).toHaveLength(1)
    }
  })

  it('informa días sin horarios sin agregar salidas y admite una respuesta vacía', () => {
    const { rerender } = render(<HorariosRuta horarios={horarios} />)
    const selector = screen.getByLabelText('Día de la semana')
    fireEvent.change(selector, { target: { value: '2' } })
    expect(screen.getByRole('status')).toHaveTextContent('No hay horarios publicados para martes.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    fireEvent.change(selector, { target: { value: '1' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    rerender(<HorariosRuta horarios={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('No hay horarios publicados para lunes.')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

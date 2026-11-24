import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfiguracionHomun from '../../src/features/mi-viaje/components/ConfiguracionHomun'
import { crearBorradorHomun } from '../../src/features/mi-viaje/plan/borradorHomun'

function visita(fecha: string) {
  const b = crearBorradorHomun('fin-de-semana')
  return { ...b, configuracion: { ...b.configuracion, fecha } }
}

describe('Fecha automática accesible de Homún', () => {
  it('asocia la etiqueta exacta y mantiene la ayuda como descripción de un único campo de solo lectura', () => {
    render(<ConfiguracionHomun borrador={visita('2026-11-30')} onChange={vi.fn()} />)
    const fecha = screen.getByLabelText('Fecha del Día 2')
    expect(screen.getAllByLabelText('Fecha del Día 2')).toHaveLength(1)
    expect(fecha).toBeVisible()
    expect(fecha).toHaveValue('2026-12-01')
    expect(fecha).toHaveAttribute('type', 'date')
    expect(fecha).toHaveAttribute('readonly')
    expect(fecha).toHaveAccessibleName('Fecha del Día 2')
    expect(fecha).toHaveAccessibleDescription('Fecha consecutiva calculada por calendario local.')
  })

  it('actualiza la fecha derivada al cambiar la fecha inicial, sin crear otro campo', () => {
    const onChange = vi.fn()
    const vista = render(<ConfiguracionHomun borrador={visita('2026-11-30')} onChange={onChange} />)
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('2026-12-01')
    vista.rerender(<ConfiguracionHomun borrador={visita('2026-12-31')} onChange={onChange} />)
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('2027-01-01')
    expect(screen.getAllByLabelText('Fecha del Día 2')).toHaveLength(1)
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each(['', '2026-02-30', '2026-13-01'])('deja la segunda fecha vacía si la inicial es inválida: %s', fecha => {
    render(<ConfiguracionHomun borrador={visita(fecha)} onChange={vi.fn()} />)
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveValue('')
    expect(screen.getByLabelText('Fecha del Día 2')).toHaveAttribute('readonly')
  })

  it('genera asociaciones distintas si existen dos instancias del componente', () => {
    render(<><ConfiguracionHomun borrador={visita('2026-11-30')} onChange={vi.fn()} /><ConfiguracionHomun borrador={visita('2026-12-31')} onChange={vi.fn()} /></>)
    const fechas = screen.getAllByLabelText('Fecha del Día 2') as HTMLInputElement[]
    expect(fechas).toHaveLength(2)
    expect(fechas[0].id).not.toBe(fechas[1].id)
    expect(fechas[0].getAttribute('aria-describedby')).not.toBe(fechas[1].getAttribute('aria-describedby'))
    for (const fecha of fechas) expect(fecha).toHaveAccessibleName('Fecha del Día 2')
  })

  it('no muestra una segunda fecha en estancias de una sola jornada', () => {
    render(<ConfiguracionHomun borrador={crearBorradorHomun('medio-dia')} onChange={vi.fn()} />)
    expect(screen.queryByLabelText('Fecha del Día 2')).not.toBeInTheDocument()
  })
})

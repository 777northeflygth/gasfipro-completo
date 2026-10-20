// src/jsx/admin.test.js
import { describe, it, expect } from 'vitest';
import { formatCurrency, safeFormatDate, statusLabels } from './admin';

describe('formatCurrency', () => {
  it('formatea enteros con separador de miles', () => {
    expect(formatCurrency(80000)).toBe('$80.000');
    expect(formatCurrency(1500)).toBe('$1.500');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('acepta strings numéricos', () => {
    expect(formatCurrency('15000')).toBe('$15.000');
  });

  it('devuelve $0 para valores inválidos', () => {
    expect(formatCurrency('abc')).toBe('$0');
    expect(formatCurrency(undefined)).toBe('$0');
    expect(formatCurrency(NaN)).toBe('$0');
  });
});

describe('safeFormatDate', () => {
  it('formatea una fecha ISO con el patrón por defecto', () => {
    expect(safeFormatDate('2026-10-19')).toBe('19/10/2026');
  });

  it('acepta un patrón personalizado', () => {
    expect(safeFormatDate('2026-10-19', 'yyyy-MM-dd')).toBe('2026-10-19');
  });

  it('devuelve em dash si la fecha está vacía', () => {
    expect(safeFormatDate(null)).toBe('—');
    expect(safeFormatDate('')).toBe('—');
    expect(safeFormatDate(undefined)).toBe('—');
  });

  it('devuelve em dash si la fecha es inválida', () => {
    expect(safeFormatDate('no-es-fecha')).toBe('—');
  });
});

describe('statusLabels', () => {
  it('define las cuatro etiquetas de estado', () => {
    expect(statusLabels).toEqual({
      pendiente: 'Pendiente',
      agendado: 'Agendado',
      en_proceso: 'En proceso',
      resuelto: 'Resuelto',
    });
  });
});
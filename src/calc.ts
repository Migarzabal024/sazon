// Lógica pura de costeo y cotización. Sin dependencias del DOM: fácil de
// testear y de auditar, que es justo lo que importa en una app de plata.

import type {
  Ingrediente, Receta, CostoIndirecto, CostosReceta, ResultadoCotizacion,
  UnidadMedida, FamiliaUnidad, ModoMargen,
} from './types';

/** La unidad más chica y práctica para cargar una cantidad de este ingrediente (ej: "kg" -> "g"). */
export function defaultUnitFor(ingrediente: Ingrediente | undefined): UnidadMedida {
  if (!ingrediente) return 'unidad';
  const family = UNIT_FAMILY[ingrediente.unidadCompra];
  const opts = FAMILY_UNITS[family];
  return opts[opts.length - 1];
}

export const UNIT_TO_BASE: Record<UnidadMedida, number> = { kg: 1000, g: 1, l: 1000, ml: 1, unidad: 1 };
export const UNIT_FAMILY: Record<UnidadMedida, FamiliaUnidad> = {
  kg: 'peso', g: 'peso', l: 'volumen', ml: 'volumen', unidad: 'unidad',
};
export const FAMILY_UNITS: Record<FamiliaUnidad, UnidadMedida[]> = {
  peso: ['kg', 'g'], volumen: ['l', 'ml'], unidad: ['unidad'],
};
export const UNIT_LABEL: Record<UnidadMedida, string> = {
  kg: 'kg', g: 'g', l: 'l', ml: 'ml', unidad: 'unidad',
};

export function ingredienteCostoBase(ing: Ingrediente): number {
  const cant = ing.cantidadCompra * (UNIT_TO_BASE[ing.unidadCompra] || 1);
  if (!cant) return 0;
  return ing.precioCompra / cant;
}

function mapById<T extends { id: string }>(list: T[]): Record<string, T> {
  const m: Record<string, T> = {};
  for (const item of list) m[item.id] = item;
  return m;
}

export function recetaCostoDirectoTotal(receta: Receta, ingMap: Record<string, Ingrediente>): number {
  return (receta.ingredientes || []).reduce((sum, line) => {
    const ing = ingMap[line.ingredienteId];
    if (!ing) return sum;
    const costoBase = ingredienteCostoBase(ing);
    const cantidadEnBase = (line.cantidad || 0) * (UNIT_TO_BASE[line.unidad] || 1);
    return sum + cantidadEnBase * costoBase;
  }, 0);
}

export function recetaCostoIndirectoPorUnidad(receta: Receta, ciMap: Record<string, CostoIndirecto>): number {
  return (receta.indirectos || []).reduce((sum, id) => {
    const ci = ciMap[id];
    if (!ci) return sum;
    if (ci.modo === 'porLote') return sum + ci.monto / (receta.rendimientoCantidad || 1);
    return sum + ci.monto;
  }, 0);
}

export function recetaCostos(
  receta: Receta,
  ingredientes: Ingrediente[],
  costosIndirectos: CostoIndirecto[],
): CostosReceta {
  const ingMap = mapById(ingredientes);
  const ciMap = mapById(costosIndirectos);
  const directoTotal = recetaCostoDirectoTotal(receta, ingMap);
  const directoPorUnidad = directoTotal / (receta.rendimientoCantidad || 1);
  const indirectoPorUnidad = recetaCostoIndirectoPorUnidad(receta, ciMap);
  return {
    directoTotal,
    directoPorUnidad,
    indirectoPorUnidad,
    costoPorUnidad: directoPorUnidad + indirectoPorUnidad,
  };
}

export interface CotizacionInput {
  costoPorUnidad: number;
  margenPct: number;
  modoMargen: ModoMargen;
  impuestoPct: number;
  comisionPct: number;
  precioManual: number | null;
}

export function calcularCotizacion(input: CotizacionInput): ResultadoCotizacion {
  const C = input.costoPorUnidad || 0;
  const m = (input.margenPct || 0) / 100;
  const t = (input.impuestoPct || 0) / 100;
  const c = (input.comisionPct || 0) / 100;
  let precioFinal: number;

  if (input.precioManual !== null && input.precioManual !== undefined && !isNaN(input.precioManual)) {
    precioFinal = input.precioManual;
  } else if (input.modoMargen === 'venta') {
    const denom = 1 - t - c - m;
    precioFinal = denom > 0 ? C / denom : NaN;
  } else {
    const denom = 1 - t - c;
    precioFinal = denom > 0 ? (C + C * m) / denom : NaN;
  }

  const netoRecibido = precioFinal * (1 - t - c);
  const gananciaNeta = netoRecibido - C;
  const margenSobreCosto = C > 0 ? gananciaNeta / C : 0;
  const margenSobreVenta = precioFinal > 0 ? gananciaNeta / precioFinal : 0;

  return { precioFinal, netoRecibido, gananciaNeta, margenSobreCosto, margenSobreVenta };
}

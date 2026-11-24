// Tipos de dominio de Sazón.
// Todo el estado de un usuario vive en un único objeto `User` (ver storage.ts).

export type UnidadMedida = 'kg' | 'g' | 'l' | 'ml' | 'unidad';
export type FamiliaUnidad = 'peso' | 'volumen' | 'unidad';
export type ModoMargen = 'costo' | 'venta';
export type ModoAsignacionCosto = 'porLote' | 'porUnidad';

export interface Ingrediente {
  id: string;
  nombre: string;
  unidadCompra: UnidadMedida;
  cantidadCompra: number;
  precioCompra: number;
}

export interface RecetaIngredienteLinea {
  ingredienteId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

export interface Receta {
  id: string;
  nombre: string;
  categoria: string;
  fotoDataUrl: string;
  tiempoPrep: string;
  rendimientoCantidad: number;
  rendimientoUnidad: string;
  ingredientes: RecetaIngredienteLinea[];
  indirectos: string[]; // ids de CostoIndirecto asignados
  pasos: string[];
  notas: string;
}

export interface CostoIndirecto {
  id: string;
  nombre: string;
  monto: number;
  modo: ModoAsignacionCosto;
}

export interface CanalVenta {
  id: string;
  nombre: string;
  comision: number; // %
}

export interface UserConfig {
  monedaCode: string;
  monedaSimboloCustom: string;
  impuestoDefault: number;
  margenDefault: number;
  modoMargenDefault: ModoMargen;
  margenMinimo: number;
  canales: CanalVenta[];
}

export interface UserMeta {
  lastSavedAt?: number;
}

export interface User {
  password: string;
  config: UserConfig;
  ingredientes: Ingrediente[];
  recetas: Receta[];
  costosIndirectos: CostoIndirecto[];
  meta?: UserMeta;
}

export interface Database {
  users: Record<string, User>;
}

export interface CostosReceta {
  directoTotal: number;
  directoPorUnidad: number;
  indirectoPorUnidad: number;
  costoPorUnidad: number;
}

export interface ResultadoCotizacion {
  precioFinal: number;
  netoRecibido: number;
  gananciaNeta: number;
  margenSobreCosto: number;
  margenSobreVenta: number;
}

/** Borrador en edición: una receta, un ingrediente o un costo indirecto nuevo/existente. */
export type DraftKind = 'receta' | 'ingrediente' | 'costo';

export interface RecetaDraft extends Receta { type: 'receta'; }
export interface IngredienteDraft extends Ingrediente { type: 'ingrediente'; }
export interface CostoDraft extends CostoIndirecto { type: 'costo'; }

export type Draft = RecetaDraft | IngredienteDraft | CostoDraft | null;

export interface ConfirmDeleteInfo {
  kind: DraftKind;
  id: string;
  title: string;
  body: string;
}

export type ViewName =
  | 'inicio' | 'recetario' | 'ingredientes' | 'costos'
  | 'cotizador' | 'rentabilidad' | 'config';

export interface ViewState {
  name: ViewName;
}

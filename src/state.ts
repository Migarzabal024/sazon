import type { Database, User, Draft, ViewName, Receta, Ingrediente, CostoIndirecto, ConfirmDeleteInfo } from './types';
import { loadDB, loadSession } from './storage';
import { CURRENCIES, uid as makeUid } from './utils';

export const ONBOARDING_SLIDES: { icon: string; title: string; body: string }[] = [
  { icon: 'bi-stars', title: 'Bienvenido/a a Sazón', body: 'Tu recetario y el costeo de tu producción, en un solo lugar. Te mostramos rápido cómo funciona antes de empezar.' },
  { icon: 'bi-egg-fried', title: 'Cargá tus ingredientes', body: 'Registrá lo que compraste (ej. harina, 1 kg, $1.200) y Sazón calcula solo el costo por gramo, mililitro o unidad.' },
  { icon: 'bi-journal-richtext', title: 'Armá tu recetario', body: 'Cada receta guarda sus ingredientes, pasos, foto, tiempo de preparación y rendimiento — y calcula sola su costo de producción.' },
  { icon: 'bi-credit-card-2-front', title: 'Sumá tus costos indirectos', body: 'Packaging, gas, mano de obra… asignalos a cada receta para conocer el costo real y completo de cada producto.' },
  { icon: 'bi-receipt-cutoff', title: 'Cotizá tu precio de venta', body: 'Elegí cuánto querés ganar y el canal de venta: Sazón te sugiere el precio, ya descontando impuestos y comisiones.' },
  { icon: 'bi-bar-chart-line', title: 'Mirá qué tan rentable es cada receta', body: 'El panel de Rentabilidad compara todas tus recetas y te avisa cuáles quedaron por debajo del margen que definiste.' },
  { icon: 'bi-shield-check', title: 'Todo tuyo, siempre guardado', body: 'Creá tu cuenta con usuario y contraseña. La próxima vez que entres con ese mismo usuario en este navegador, vas a encontrar tu recetario tal como lo dejaste.' },
];

export type AuthScreen = 'onboarding' | 'auth';
export type AuthMode = 'login' | 'registro';

class AppState {
  db: Database = loadDB();
  session: string | null = loadSession();

  // Solo se consulta una vez que hay sesión iniciada (ver render() en main.ts).
  view: ViewName = 'inicio';
  authMode: AuthMode = 'login';
  authError = '';
  drawerOpen = false;
  draft: Draft = null;
  confirmDelete: ConfirmDeleteInfo | null = null;
  toastMsg: string | null = null;
  toastTimer: ReturnType<typeof setTimeout> | null = null;

  authScreen: AuthScreen = !this.session ? 'onboarding' : 'auth';
  onboardStep = 0;
  tourModalOpen = false;

  cotizador = {
    recetaId: null as string | null,
    margen: null as number | null,
    modoMargen: null as 'costo' | 'venta' | null,
    canalId: null as string | null,
    impuesto: null as number | null,
    precioManual: '' as string,
  };
}

export const state = new AppState();

export function uid(): string {
  return makeUid();
}

export function currentUser(): User | null {
  return state.session ? state.db.users[state.session] ?? null : null;
}

export function currencySymbol(): string {
  const u = currentUser();
  if (!u) return '$';
  if (u.config.monedaCode === 'OTRA') return u.config.monedaSimboloCustom || '$';
  const c = CURRENCIES.find((c) => c.code === u.config.monedaCode);
  return c ? c.symbol : '$';
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return currencySymbol() + ' —';
  const formatted = Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? '-' : '') + currencySymbol() + ' ' + formatted;
}

export function userRecetas(): Receta[] { return currentUser()?.recetas ?? []; }
export function userIngredientes(): Ingrediente[] { return currentUser()?.ingredientes ?? []; }
export function userCostos(): CostoIndirecto[] { return currentUser()?.costosIndirectos ?? []; }

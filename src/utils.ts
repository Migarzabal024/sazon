export interface Currency {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$U' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$' },
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'BOB', label: 'Boliviano', symbol: 'Bs' },
  { code: 'OTRA', label: 'Otra moneda', symbol: '' },
];

export const CATEGORIAS = ['Panadería', 'Pastelería', 'Repostería', 'Viandas', 'Bebidas', 'Conservas', 'Snacks', 'Otro'];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}

export function clampNum(v: unknown, def: number): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? def : n;
}

export function pct(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return (n * 100).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

export function timeAgo(ts: number | undefined): string {
  if (!ts) return 'hace instantes';
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace instantes';
  if (min < 60) return `hace ${min} minuto${min === 1 ? '' : 's'}`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} hora${hrs === 1 ? '' : 's'}`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} día${days === 1 ? '' : 's'}`;
}

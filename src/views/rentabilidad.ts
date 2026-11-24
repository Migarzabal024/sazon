import { currentUser, money } from '../state';
import { recetaCostos, calcularCotizacion } from '../calc';
import { esc, pct } from '../utils';
import { emptyState } from './shared';

export function renderRentabilidad(): string {
  const u = currentUser();
  if (!u) return '';

  if (u.recetas.length === 0) {
    return `<h1 class="h3 mb-3">Rentabilidad</h1>${emptyState('bi-bar-chart-line', 'Cargá recetas para ver el panel de rentabilidad.')}`;
  }

  const filas = u.recetas.map((r) => {
    const costos = recetaCostos(r, u.ingredientes, u.costosIndirectos);
    const resultado = calcularCotizacion({
      costoPorUnidad: costos.costoPorUnidad,
      margenPct: u.config.margenDefault,
      modoMargen: u.config.modoMargenDefault,
      impuestoPct: u.config.impuestoDefault,
      comisionPct: 0,
      precioManual: null,
    });
    return { receta: r, costos, resultado };
  }).sort((a, b) => a.resultado.margenSobreCosto - b.resultado.margenSobreCosto);

  const margenMinimo = u.config.margenMinimo / 100;

  return `
    <h1 class="h3 mb-1">Rentabilidad</h1>
    <p class="text-muted">Ranking de tus recetas según el margen que obtendrías vendiendo al precio sugerido con tu margen por defecto (${u.config.margenDefault}%), sin descontar comisión de canal. Las que están por debajo de tu margen mínimo (${u.config.margenMinimo}%) se marcan en rojo.</p>
    <div class="row g-3">
      ${filas.map(({ receta, costos, resultado }) => {
        const bajoMinimo = resultado.margenSobreCosto < margenMinimo;
        const barColor = bajoMinimo ? 'bg-danger' : (resultado.margenSobreCosto < margenMinimo * 1.5 ? 'bg-warning' : 'bg-success');
        const widthPct = Math.max(2, Math.min(100, resultado.margenSobreCosto * 100));
        return `
        <div class="col-12">
          <div class="card shadow-sm ${bajoMinimo ? 'border-danger' : ''}">
            <div class="card-body">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div>
                  <h2 class="h6 mb-0">${esc(receta.nombre)}</h2>
                  <span class="badge text-bg-light">${esc(receta.categoria || 'Sin categoría')}</span>
                </div>
                <div class="text-end">
                  <div class="small text-muted">Margen sobre costo</div>
                  <strong class="${bajoMinimo ? 'text-danger' : 'text-success'}">${pct(resultado.margenSobreCosto)}</strong>
                </div>
              </div>
              <div class="progress margen-bar mb-2">
                <div class="progress-bar ${barColor}" style="width:${widthPct}%"></div>
              </div>
              <div class="d-flex flex-wrap gap-3 small text-muted">
                <span>Costo/unidad: <strong class="text-body">${money(costos.costoPorUnidad)}</strong></span>
                <span>Precio sugerido: <strong class="text-body">${money(resultado.precioFinal)}</strong></span>
                <span>Ganancia/unidad: <strong class="text-body">${money(resultado.gananciaNeta)}</strong></span>
              </div>
              ${bajoMinimo ? `<div class="alert alert-danger mt-2 mb-0 py-1 px-2 small d-inline-block"><i class="bi bi-exclamation-triangle me-1"></i>Por debajo del margen mínimo configurado.</div>` : ''}
            </div>
            <div class="card-footer bg-white text-end">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-action="receta-edit" data-id="${receta.id}">Ver receta</button>
            </div>
          </div>
        </div>
      `;}).join('')}
    </div>
  `;
}

import { state, currentUser, money } from '../state';
import { recetaCostos, calcularCotizacion } from '../calc';
import { esc, pct, clampNum } from '../utils';
import { emptyState } from './shared';

export function renderCotizador(): string {
  const u = currentUser();
  if (!u) return '';

  if (u.recetas.length === 0) {
    return `<h1 class="h3 mb-3">Cotizador</h1>${emptyState('bi-journal-plus', 'Cargá al menos una receta para poder cotizarla.')}`;
  }

  if (!state.cotizador.recetaId || !u.recetas.some((r) => r.id === state.cotizador.recetaId)) {
    state.cotizador.recetaId = u.recetas[0].id;
  }
  const receta = u.recetas.find((r) => r.id === state.cotizador.recetaId)!;
  const costos = recetaCostos(receta, u.ingredientes, u.costosIndirectos);

  const margen = state.cotizador.margen ?? u.config.margenDefault;
  const modoMargen = state.cotizador.modoMargen ?? u.config.modoMargenDefault;
  const impuesto = state.cotizador.impuesto ?? u.config.impuestoDefault;
  const canal = u.config.canales.find((c) => c.id === state.cotizador.canalId) ?? u.config.canales[0];
  const comision = canal ? canal.comision : 0;
  const precioManual = state.cotizador.precioManual.trim() === '' ? null : clampNum(state.cotizador.precioManual, 0);

  const resultado = calcularCotizacion({
    costoPorUnidad: costos.costoPorUnidad,
    margenPct: margen,
    modoMargen,
    impuestoPct: impuesto,
    comisionPct: comision,
    precioManual,
  });

  const bajoMinimo = resultado.margenSobreCosto * 100 < u.config.margenMinimo;

  return `
    <h1 class="h3 mb-3">Cotizador</h1>
    <div class="row g-3" data-bind-root="cotizador">
      <div class="col-lg-6">
        <div class="card shadow-sm mb-3">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Receta</label>
                <select class="form-select" data-bind="recetaId">
                  ${u.recetas.map((r) => `<option value="${r.id}" ${r.id === receta.id ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Margen deseado (%)</label>
                <input type="number" step="any" class="form-control" data-bind="margen" data-bind-type="number" value="${margen}">
              </div>
              <div class="col-6">
                <label class="form-label">Margen sobre</label>
                <select class="form-select" data-bind="modoMargen">
                  <option value="costo" ${modoMargen === 'costo' ? 'selected' : ''}>el costo</option>
                  <option value="venta" ${modoMargen === 'venta' ? 'selected' : ''}>el precio de venta</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Canal de venta</label>
                <select class="form-select" data-bind="canalId">
                  ${u.config.canales.map((c) => `<option value="${c.id}" ${canal && c.id === canal.id ? 'selected' : ''}>${esc(c.nombre)} (${c.comision}%)</option>`).join('')}
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Impuesto (%)</label>
                <input type="number" step="any" class="form-control" data-bind="impuesto" data-bind-type="number" value="${impuesto}">
              </div>
              <div class="col-12">
                <label class="form-label">Precio manual (opcional)</label>
                <input type="number" step="any" class="form-control" data-bind="precioManual" placeholder="Dejalo vacío para que Sazón lo sugiera" value="${esc(state.cotizador.precioManual)}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card shadow-sm border-0 ${bajoMinimo ? 'border border-danger' : ''}">
          <div class="card-body">
            <div class="text-center mb-3">
              <div class="text-muted small">Precio de venta sugerido</div>
              <div class="display-6 fw-bold text-success">${money(resultado.precioFinal)}</div>
            </div>
            <div class="d-flex justify-content-between small mb-1"><span>Costo por unidad</span><strong>${money(costos.costoPorUnidad)}</strong></div>
            <div class="d-flex justify-content-between small mb-1"><span>Neto recibido (tras impuesto y comisión)</span><strong>${money(resultado.netoRecibido)}</strong></div>
            <div class="d-flex justify-content-between small mb-2"><span>Ganancia neta por unidad</span><strong class="text-success">${money(resultado.gananciaNeta)}</strong></div>
            <hr>
            <div class="d-flex justify-content-between small mb-1"><span>Margen sobre costo</span><strong>${pct(resultado.margenSobreCosto)}</strong></div>
            <div class="d-flex justify-content-between small"><span>Margen sobre precio de venta</span><strong>${pct(resultado.margenSobreVenta)}</strong></div>
            ${bajoMinimo ? `<div class="alert alert-danger mt-3 mb-0 py-2 small"><i class="bi bi-exclamation-triangle me-1"></i>Este margen quedó por debajo del mínimo que configuraste (${u.config.margenMinimo}%).</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

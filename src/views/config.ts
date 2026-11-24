import { currentUser } from '../state';
import { CURRENCIES, esc } from '../utils';

export function renderConfig(): string {
  const u = currentUser();
  if (!u) return '';
  const cfg = u.config;

  return `
    <h1 class="h3 mb-3">Configuración</h1>
    <div class="row g-3" data-bind-root="config">
      <div class="col-lg-6">
        <div class="card shadow-sm mb-3">
          <div class="card-header bg-white fw-semibold">Moneda</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-7">
                <label class="form-label">Moneda</label>
                <select class="form-select" data-bind="monedaCode">
                  ${CURRENCIES.map((c) => `<option value="${c.code}" ${c.code === cfg.monedaCode ? 'selected' : ''}>${c.label}${c.symbol ? ' (' + c.symbol + ')' : ''}</option>`).join('')}
                </select>
              </div>
              ${cfg.monedaCode === 'OTRA' ? `
                <div class="col-md-5">
                  <label class="form-label">Símbolo</label>
                  <input type="text" class="form-control" data-bind="monedaSimboloCustom" value="${esc(cfg.monedaSimboloCustom)}" placeholder="Ej: Gs.">
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="card shadow-sm mb-3">
          <div class="card-header bg-white fw-semibold">Valores por defecto</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Margen por defecto (%)</label>
                <input type="number" step="any" class="form-control" data-bind="margenDefault" data-bind-type="number" value="${cfg.margenDefault}">
              </div>
              <div class="col-6">
                <label class="form-label">Margen sobre</label>
                <select class="form-select" data-bind="modoMargenDefault">
                  <option value="costo" ${cfg.modoMargenDefault === 'costo' ? 'selected' : ''}>el costo</option>
                  <option value="venta" ${cfg.modoMargenDefault === 'venta' ? 'selected' : ''}>el precio de venta</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label">Impuesto por defecto (%)</label>
                <input type="number" step="any" class="form-control" data-bind="impuestoDefault" data-bind-type="number" value="${cfg.impuestoDefault}">
              </div>
              <div class="col-6">
                <label class="form-label">Margen mínimo aceptable (%)</label>
                <input type="number" step="any" class="form-control" data-bind="margenMinimo" data-bind-type="number" value="${cfg.margenMinimo}">
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline-secondary" data-action="open-tour"><i class="bi bi-play-circle me-1"></i>Ver el instructivo de nuevo</button>
      </div>

      <div class="col-lg-6">
        <div class="card shadow-sm mb-3">
          <div class="card-header bg-white fw-semibold d-flex align-items-center justify-content-between">
            Canales de venta
            <button type="button" class="btn btn-sm btn-outline-success" data-action="config-add-canal"><i class="bi bi-plus-lg me-1"></i>Agregar</button>
          </div>
          <div class="card-body">
            ${cfg.canales.length === 0 ? '<p class="text-muted mb-0">No tenés canales cargados.</p>' : cfg.canales.map((c, i) => `
              <div class="row g-2 align-items-center mb-2">
                <div class="col-7">
                  <input type="text" class="form-control form-control-sm" data-bind="canales[${i}].nombre" value="${esc(c.nombre)}" placeholder="Nombre del canal">
                </div>
                <div class="col-3">
                  <div class="input-group input-group-sm">
                    <input type="number" step="any" min="0" class="form-control" data-bind="canales[${i}].comision" data-bind-type="number" value="${c.comision}">
                    <span class="input-group-text">%</span>
                  </div>
                </div>
                <div class="col-2 text-end">
                  <button type="button" class="btn btn-sm btn-outline-danger" data-action="config-remove-canal" data-index="${i}"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

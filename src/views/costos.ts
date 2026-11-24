import { state, currentUser, money, uid } from '../state';
import type { CostoDraft } from '../types';
import { esc } from '../utils';
import { emptyState } from './shared';

export function blankCosto(): CostoDraft {
  return { type: 'costo', id: uid(), nombre: '', monto: 0, modo: 'porLote' };
}

export function renderCostos(): string {
  const u = currentUser();
  if (!u) return '';

  if (state.draft && state.draft.type === 'costo') {
    return renderCostoForm(state.draft);
  }

  const list = u.costosIndirectos;
  return `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h3 mb-0">Costos indirectos</h1>
      <button type="button" class="btn btn-success" data-action="costo-new"><i class="bi bi-plus-lg me-1"></i>Nuevo costo</button>
    </div>
    <p class="text-muted">Packaging, gas, alquiler, mano de obra... cosas que no son un ingrediente de la receta pero que también forman parte de lo que cuesta producirla.</p>
    ${list.length === 0 ? emptyState('bi-credit-card-2-front', 'Todavía no cargaste ningún costo indirecto.') : `
      <div class="table-responsive">
        <table class="table table-hover align-middle bg-white">
          <thead><tr>
            <th>Nombre</th><th>Monto</th><th>Cómo se asigna</th><th class="text-end">Acciones</th>
          </tr></thead>
          <tbody>
            ${list.map((c) => `
              <tr>
                <td>${esc(c.nombre)}</td>
                <td>${money(c.monto)}</td>
                <td>${c.modo === 'porLote' ? 'Por lote (se divide por el rendimiento de la receta)' : 'Por unidad producida'}</td>
                <td class="text-end">
                  <button type="button" class="btn btn-sm btn-outline-secondary" data-action="costo-edit" data-id="${c.id}"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="btn btn-sm btn-outline-danger" data-action="costo-delete" data-id="${c.id}"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

export function renderCostoForm(draft: CostoDraft): string {
  const esEdicion = currentUser()!.costosIndirectos.some((c) => c.id === draft.id);
  return `
    <h1 class="h4 mb-3">${esEdicion ? 'Editar costo indirecto' : 'Nuevo costo indirecto'}</h1>
    <div class="card shadow-sm" data-bind-root="draft">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" data-bind="nombre" value="${esc(draft.nombre)}" placeholder="Ej: Packaging">
          </div>
          <div class="col-md-6">
            <label class="form-label">Monto</label>
            <input type="number" min="0" step="any" class="form-control" data-bind="monto" data-bind-type="number" value="${draft.monto}">
          </div>
          <div class="col-12">
            <label class="form-label d-block">¿Cómo se asigna a una receta?</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="modo" id="modo-lote" data-bind="modo" value="porLote" ${draft.modo === 'porLote' ? 'checked' : ''}>
              <label class="form-check-label" for="modo-lote">Por lote: el monto se divide por el rendimiento de cada receta que lo use.</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" name="modo" id="modo-unidad" data-bind="modo" value="porUnidad" ${draft.modo === 'porUnidad' ? 'checked' : ''}>
              <label class="form-check-label" for="modo-unidad">Por unidad: el monto completo se suma a cada unidad producida.</label>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer bg-white d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-outline-secondary" data-action="costo-cancel">Cancelar</button>
        <button type="button" class="btn btn-success" data-action="costo-save">Guardar</button>
      </div>
    </div>
  `;
}

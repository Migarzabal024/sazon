import { state, currentUser, money, uid } from '../state';
import type { Ingrediente, IngredienteDraft } from '../types';
import { ingredienteCostoBase, UNIT_LABEL } from '../calc';
import { esc } from '../utils';
import { emptyState } from './shared';

export function blankIngrediente(): IngredienteDraft {
  return { type: 'ingrediente', id: uid(), nombre: '', unidadCompra: 'kg', cantidadCompra: 1, precioCompra: 0 };
}

function costoBaseLabel(ing: Ingrediente): string {
  const fam = ing.unidadCompra === 'unidad' ? 'unidad' : (ing.unidadCompra === 'l' || ing.unidadCompra === 'ml' ? 'ml' : 'g');
  return `${money(ingredienteCostoBase(ing))} / ${fam}`;
}

export function renderIngredientes(): string {
  const u = currentUser();
  if (!u) return '';

  if (state.draft && state.draft.type === 'ingrediente') {
    return renderIngredienteForm(state.draft);
  }

  const list = u.ingredientes;
  return `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h3 mb-0">Ingredientes</h1>
      <button type="button" class="btn btn-success" data-action="ingrediente-new"><i class="bi bi-plus-lg me-1"></i>Nuevo ingrediente</button>
    </div>
    ${list.length === 0 ? emptyState('bi-egg', 'Todavía no cargaste ningún ingrediente.') : `
      <div class="table-responsive">
        <table class="table table-hover align-middle bg-white">
          <thead><tr>
            <th>Nombre</th><th>Presentación</th><th>Precio de compra</th><th>Costo base</th><th class="text-end">Acciones</th>
          </tr></thead>
          <tbody>
            ${list.map((ing) => `
              <tr>
                <td>${esc(ing.nombre)}</td>
                <td>${ing.cantidadCompra} ${UNIT_LABEL[ing.unidadCompra]}</td>
                <td>${money(ing.precioCompra)}</td>
                <td>${costoBaseLabel(ing)}</td>
                <td class="text-end">
                  <button type="button" class="btn btn-sm btn-outline-secondary" data-action="ingrediente-edit" data-id="${ing.id}"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="btn btn-sm btn-outline-danger" data-action="ingrediente-delete" data-id="${ing.id}"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

export function renderIngredienteForm(draft: IngredienteDraft): string {
  const esUnidad = draft.unidadCompra === 'unidad';
  const esEdicion = currentUser()!.ingredientes.some((i) => i.id === draft.id);
  return `
    <h1 class="h4 mb-3">${esEdicion ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h1>
    <div class="card shadow-sm" data-bind-root="draft">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nombre</label>
            <input type="text" class="form-control" data-bind="nombre" value="${esc(draft.nombre)}" placeholder="Ej: Harina 0000">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Cantidad comprada</label>
            <input type="number" min="0" step="any" class="form-control" data-bind="cantidadCompra" data-bind-type="number" value="${draft.cantidadCompra}">
          </div>
          <div class="col-6 col-md-3">
            <label class="form-label">Unidad</label>
            <select class="form-select" data-bind="unidadCompra">
              <option value="kg" ${draft.unidadCompra === 'kg' ? 'selected' : ''}>kg</option>
              <option value="g" ${draft.unidadCompra === 'g' ? 'selected' : ''}>g</option>
              <option value="l" ${draft.unidadCompra === 'l' ? 'selected' : ''}>l</option>
              <option value="ml" ${draft.unidadCompra === 'ml' ? 'selected' : ''}>ml</option>
              <option value="unidad" ${esUnidad ? 'selected' : ''}>unidad</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Precio pagado por esa cantidad</label>
            <input type="number" min="0" step="any" class="form-control" data-bind="precioCompra" data-bind-type="number" value="${draft.precioCompra}">
          </div>
          <div class="col-md-6 d-flex align-items-end">
            <div class="alert alert-light border mb-0 py-2 w-100">
              Costo base: <strong>${costoBaseLabel(draft)}</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer bg-white d-flex gap-2 justify-content-end">
        <button type="button" class="btn btn-outline-secondary" data-action="ingrediente-cancel">Cancelar</button>
        <button type="button" class="btn btn-success" data-action="ingrediente-save">Guardar</button>
      </div>
    </div>
  `;
}

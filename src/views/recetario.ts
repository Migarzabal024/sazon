import { state, currentUser, money, uid } from '../state';
import type { RecetaDraft } from '../types';
import { recetaCostos, FAMILY_UNITS, UNIT_FAMILY, UNIT_LABEL } from '../calc';
import { CATEGORIAS, esc } from '../utils';
import { emptyState } from './shared';

export function blankReceta(): RecetaDraft {
  return {
    type: 'receta',
    id: uid(),
    nombre: '',
    categoria: CATEGORIAS[0],
    fotoDataUrl: '',
    tiempoPrep: '',
    rendimientoCantidad: 1,
    rendimientoUnidad: 'unidades',
    ingredientes: [],
    indirectos: [],
    pasos: [''],
    notas: '',
  };
}

export function renderRecetario(): string {
  const u = currentUser();
  if (!u) return '';

  if (state.draft && state.draft.type === 'receta') {
    return renderRecetaForm(state.draft);
  }

  const list = u.recetas;
  return `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h1 class="h3 mb-0">Recetario</h1>
      <button type="button" class="btn btn-success" data-action="receta-new"><i class="bi bi-plus-lg me-1"></i>Nueva receta</button>
    </div>
    ${list.length === 0 ? emptyState('bi-journal-plus', 'Todavía no cargaste ninguna receta. ¡Empezá con la primera!') : `
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-xl-4 g-3">
        ${list.map((r) => {
          const costos = recetaCostos(r, u.ingredientes, u.costosIndirectos);
          return `
          <div class="col">
            <div class="card h-100 shadow-sm">
              ${r.fotoDataUrl ? `<img src="${r.fotoDataUrl}" class="receta-photo" alt="${esc(r.nombre)}">` : `<div class="receta-photo-placeholder"><i class="bi bi-image"></i></div>`}
              <div class="card-body">
                <h3 class="h6 mb-1">${esc(r.nombre)}</h3>
                <span class="badge text-bg-light mb-2">${esc(r.categoria || 'Sin categoría')}</span>
                <div class="small text-muted">Costo por unidad: <strong class="text-body">${money(costos.costoPorUnidad)}</strong></div>
                <div class="small text-muted">Rinde ${r.rendimientoCantidad} ${esc(r.rendimientoUnidad)}</div>
              </div>
              <div class="card-footer bg-white d-flex gap-2 justify-content-end">
                <button type="button" class="btn btn-sm btn-outline-secondary" data-action="receta-edit" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
                <button type="button" class="btn btn-sm btn-outline-danger" data-action="receta-delete" data-id="${r.id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        `;}).join('')}
      </div>
    `}
  `;
}

function ingredienteLineaRow(draft: RecetaDraft, index: number): string {
  const u = currentUser()!;
  const line = draft.ingredientes[index];
  const ing = u.ingredientes.find((i) => i.id === line.ingredienteId);
  const family = ing ? UNIT_FAMILY[ing.unidadCompra] : 'peso';
  const unitOptions = FAMILY_UNITS[family];
  return `
    <div class="row g-2 align-items-center mb-2">
      <div class="col-12 col-md-5">
        <select class="form-select form-select-sm" data-bind="ingredientes[${index}].ingredienteId" data-autounit-path="ingredientes[${index}].unidad">
          <option value="">Elegí un ingrediente...</option>
          ${u.ingredientes.map((i) => `<option value="${i.id}" ${i.id === line.ingredienteId ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}
        </select>
      </div>
      <div class="col-5 col-md-3">
        <input type="number" min="0" step="any" class="form-control form-control-sm" data-bind="ingredientes[${index}].cantidad" data-bind-type="number" value="${line.cantidad}" placeholder="Cantidad">
      </div>
      <div class="col-5 col-md-3">
        <select class="form-select form-select-sm" data-bind="ingredientes[${index}].unidad">
          ${unitOptions.map((o) => `<option value="${o}" ${o === line.unidad ? 'selected' : ''}>${UNIT_LABEL[o]}</option>`).join('')}
        </select>
      </div>
      <div class="col-2 col-md-1 text-end">
        <button type="button" class="btn btn-sm btn-outline-danger" data-action="receta-remove-ingrediente-linea" data-index="${index}"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>
  `;
}

export function renderRecetaForm(draft: RecetaDraft): string {
  const u = currentUser()!;
  const costos = recetaCostos(draft, u.ingredientes, u.costosIndirectos);
  const esEdicion = u.recetas.some((r) => r.id === draft.id);

  return `
    <h1 class="h4 mb-3">${esEdicion ? 'Editar receta' : 'Nueva receta'}</h1>
    <div data-bind-root="draft">
      <div class="row g-3">
        <div class="col-lg-8">
          <div class="card shadow-sm mb-3">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-8">
                  <label class="form-label">Nombre de la receta</label>
                  <input type="text" class="form-control" data-bind="nombre" value="${esc(draft.nombre)}" placeholder="Ej: Medialunas de manteca">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Categoría</label>
                  <select class="form-select" data-bind="categoria">
                    ${CATEGORIAS.map((c) => `<option value="${c}" ${c === draft.categoria ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label">Rendimiento</label>
                  <input type="number" min="0" step="any" class="form-control" data-bind="rendimientoCantidad" data-bind-type="number" value="${draft.rendimientoCantidad}">
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label">Unidad de rendimiento</label>
                  <input type="text" class="form-control" data-bind="rendimientoUnidad" value="${esc(draft.rendimientoUnidad)}" placeholder="unidades, porciones, docenas...">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tiempo de preparación</label>
                  <input type="text" class="form-control" data-bind="tiempoPrep" value="${esc(draft.tiempoPrep)}" placeholder="Ej: 45 min">
                </div>
                <div class="col-12">
                  <label class="form-label">Foto</label>
                  <input type="file" accept="image/*" class="form-control" data-action="receta-photo-input">
                  ${draft.fotoDataUrl ? `<img src="${draft.fotoDataUrl}" class="receta-photo mt-2 rounded" style="max-width:220px" alt="">` : ''}
                </div>
              </div>
            </div>
          </div>

          <div class="card shadow-sm mb-3">
            <div class="card-header bg-white fw-semibold">Ingredientes</div>
            <div class="card-body">
              ${draft.ingredientes.length === 0 ? '<p class="text-muted mb-2">Todavía no agregaste ingredientes.</p>' : draft.ingredientes.map((_, i) => ingredienteLineaRow(draft, i)).join('')}
              <button type="button" class="btn btn-sm btn-outline-success mt-1" data-action="receta-add-ingrediente-linea"><i class="bi bi-plus-lg me-1"></i>Agregar ingrediente</button>
            </div>
          </div>

          <div class="card shadow-sm mb-3">
            <div class="card-header bg-white fw-semibold">Costos indirectos asignados</div>
            <div class="card-body">
              ${u.costosIndirectos.length === 0 ? '<p class="text-muted mb-0">No cargaste costos indirectos todavía (los podés sumar desde "Costos indirectos").</p>' : u.costosIndirectos.map((c) => `
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="ci-${c.id}" data-action="toggle-indirecto" data-id="${c.id}" ${draft.indirectos.includes(c.id) ? 'checked' : ''}>
                  <label class="form-check-label" for="ci-${c.id}">${esc(c.nombre)} — ${money(c.monto)} (${c.modo === 'porLote' ? 'por lote' : 'por unidad'})</label>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card shadow-sm mb-3">
            <div class="card-header bg-white fw-semibold">Pasos de preparación</div>
            <div class="card-body">
              ${draft.pasos.map((p, i) => `
                <div class="input-group mb-2">
                  <span class="input-group-text">${i + 1}</span>
                  <textarea class="form-control" rows="1" data-bind="pasos[${i}]" placeholder="Describí este paso...">${esc(p)}</textarea>
                  <button type="button" class="btn btn-outline-danger" data-action="receta-remove-paso" data-index="${i}"><i class="bi bi-x-lg"></i></button>
                </div>
              `).join('')}
              <button type="button" class="btn btn-sm btn-outline-success" data-action="receta-add-paso"><i class="bi bi-plus-lg me-1"></i>Agregar paso</button>
            </div>
          </div>

          <div class="card shadow-sm mb-3">
            <div class="card-header bg-white fw-semibold">Notas</div>
            <div class="card-body">
              <textarea class="form-control" rows="2" data-bind="notas" placeholder="Notas, variantes, tips...">${esc(draft.notas)}</textarea>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm" style="position:sticky; top:1rem;">
            <div class="card-header bg-white fw-semibold">Costo de producción</div>
            <div class="card-body">
              <div class="d-flex justify-content-between small mb-1"><span>Directo (ingredientes) total</span><strong>${money(costos.directoTotal)}</strong></div>
              <div class="d-flex justify-content-between small mb-1"><span>Directo por unidad</span><strong>${money(costos.directoPorUnidad)}</strong></div>
              <div class="d-flex justify-content-between small mb-2"><span>Indirecto por unidad</span><strong>${money(costos.indirectoPorUnidad)}</strong></div>
              <hr>
              <div class="d-flex justify-content-between"><span>Costo total por unidad</span><strong class="text-success">${money(costos.costoPorUnidad)}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex gap-2 justify-content-end mt-3 mb-5">
        <button type="button" class="btn btn-outline-secondary" data-action="receta-cancel">Cancelar</button>
        <button type="button" class="btn btn-success" data-action="receta-save">Guardar receta</button>
      </div>
    </div>
  `;
}

import { currentUser, money, state } from '../state';
import { recetaCostos } from '../calc';
import { esc, timeAgo } from '../utils';
import { emptyState } from './shared';

export function renderInicio(): string {
  const u = currentUser();
  if (!u) return '';

  const nRecetas = u.recetas.length;
  const nIngredientes = u.ingredientes.length;
  const nCostos = u.costosIndirectos.length;

  const costosPromedio = u.recetas.length
    ? u.recetas.reduce((sum, r) => sum + recetaCostos(r, u.ingredientes, u.costosIndirectos).costoPorUnidad, 0) / u.recetas.length
    : 0;

  const savedLine = (u.meta && u.meta.lastSavedAt)
    ? `Guardado ${timeAgo(u.meta.lastSavedAt)} en este navegador.`
    : `Todavía no guardaste nada en este navegador. En cuanto cargues un ingrediente o una receta, va a quedar guardado acá.`;

  const recientes = [...u.recetas].slice(-3).reverse();

  return `
    <h1 class="h3 mb-1">¡Hola, ${esc(state.session)}!</h1>
    <div class="alert alert-light border small mb-4"><i class="bi bi-cloud-check me-1"></i>${savedLine}</div>

    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-journal-richtext fs-3 text-success"></i>
          <div class="h3 mb-0 mt-1">${nRecetas}</div>
          <div class="text-muted small">Recetas</div>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-egg-fried fs-3 text-success"></i>
          <div class="h3 mb-0 mt-1">${nIngredientes}</div>
          <div class="text-muted small">Ingredientes</div>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-credit-card-2-front fs-3 text-success"></i>
          <div class="h3 mb-0 mt-1">${nCostos}</div>
          <div class="text-muted small">Costos indirectos</div>
        </div></div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card border-0 shadow-sm h-100"><div class="card-body text-center">
          <i class="bi bi-cash-coin fs-3 text-success"></i>
          <div class="h3 mb-0 mt-1">${money(costosPromedio)}</div>
          <div class="text-muted small">Costo prom. / unidad</div>
        </div></div>
      </div>
    </div>

    <div class="d-flex align-items-center justify-content-between mb-2">
      <h2 class="h5 mb-0">Recetas recientes</h2>
      <button type="button" class="btn btn-sm btn-success" data-action="receta-new"><i class="bi bi-plus-lg me-1"></i>Nueva receta</button>
    </div>
    ${recientes.length === 0 ? emptyState('bi-journal-plus', 'Todavía no cargaste ninguna receta.') : `
      <div class="row row-cols-1 row-cols-md-3 g-3">
        ${recientes.map((r) => `
          <div class="col">
            <div class="card h-100 shadow-sm cursor-pointer" data-action="receta-edit" data-id="${r.id}">
              ${r.fotoDataUrl ? `<img src="${r.fotoDataUrl}" class="receta-photo" alt="${esc(r.nombre)}">` : `<div class="receta-photo-placeholder"><i class="bi bi-image"></i></div>`}
              <div class="card-body">
                <h3 class="h6 mb-1">${esc(r.nombre)}</h3>
                <span class="badge text-bg-light">${esc(r.categoria || 'Sin categoría')}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

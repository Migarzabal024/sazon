import { state } from '../state';
import type { ViewName } from '../types';
import { esc } from '../utils';
import { storageAvailable } from '../storage';

export const NAV_ITEMS: { view: ViewName; label: string; icon: string }[] = [
  { view: 'inicio', label: 'Inicio', icon: 'bi-house-door' },
  { view: 'recetario', label: 'Recetario', icon: 'bi-journal-richtext' },
  { view: 'ingredientes', label: 'Ingredientes', icon: 'bi-egg-fried' },
  { view: 'costos', label: 'Costos indirectos', icon: 'bi-credit-card-2-front' },
  { view: 'cotizador', label: 'Cotizador', icon: 'bi-receipt-cutoff' },
  { view: 'rentabilidad', label: 'Rentabilidad', icon: 'bi-bar-chart-line' },
  { view: 'config', label: 'Configuración', icon: 'bi-gear' },
];

function navLinksHtml(extraClass = ''): string {
  return NAV_ITEMS.map((item) => `
    <li class="nav-item">
      <button type="button" class="nav-link w-100 text-start d-flex align-items-center gap-2 ${extraClass} ${state.view === item.view ? 'active' : ''}" data-action="nav" data-view="${item.view}">
        <i class="bi ${item.icon}"></i> <span>${item.label}</span>
      </button>
    </li>
  `).join('');
}

export function pageTitle(): string {
  return NAV_ITEMS.find((i) => i.view === state.view)?.label ?? 'Sazón';
}

export function renderShellChrome(contentHtml: string): string {
  return `
    <div class="d-flex" style="min-height:100vh">
      <aside class="app-sidebar d-none d-lg-flex flex-column flex-shrink-0 p-3">
        <div class="brand-logo text-white h4 mb-4 px-2"><i class="bi bi-egg-fried me-1"></i>Sazón</div>
        <ul class="nav nav-pills flex-column gap-1 mb-auto">${navLinksHtml()}</ul>
        <div class="px-2 pt-3 border-top border-light border-opacity-25">
          <div class="text-white-50 small mb-2 text-truncate"><i class="bi bi-person-circle me-1"></i>${esc(state.session)}</div>
          <button type="button" class="btn btn-sm btn-outline-light w-100" data-action="logout"><i class="bi bi-box-arrow-right me-1"></i>Salir</button>
        </div>
      </aside>

      <div class="flex-grow-1 d-flex flex-column" style="min-width:0">
        <nav class="navbar navbar-dark bg-dark d-lg-none px-3">
          <button type="button" class="btn btn-outline-light btn-sm" data-action="toggle-drawer" aria-label="Abrir menú">
            <i class="bi bi-list fs-5"></i>
          </button>
          <span class="navbar-brand brand-logo mb-0 h6">${pageTitle()}</span>
          <button type="button" class="btn btn-outline-light btn-sm" data-action="logout" aria-label="Salir">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </nav>

        ${!storageAvailable ? `
          <div class="alert alert-warning rounded-0 mb-0 py-2 px-3 storage-banner text-center" role="alert">
            <i class="bi bi-exclamation-triangle me-1"></i>
            Este navegador bloquea el almacenamiento local: lo que cargues no va a quedar guardado al cerrar la pestaña.
          </div>
        ` : ''}

        <main class="flex-grow-1 p-3 p-md-4">
          ${contentHtml}
        </main>
      </div>
    </div>

    <div class="offcanvas offcanvas-start text-bg-dark ${state.drawerOpen ? 'manual-show' : ''}" tabindex="-1">
      <div class="offcanvas-header">
        <span class="brand-logo h5 mb-0"><i class="bi bi-egg-fried me-1"></i>Sazón</span>
        <button type="button" class="btn-close btn-close-white" data-action="close-drawer" aria-label="Cerrar"></button>
      </div>
      <div class="offcanvas-body">
        <ul class="nav nav-pills flex-column gap-1">${navLinksHtml()}</ul>
        <div class="pt-3 mt-3 border-top border-light border-opacity-25">
          <div class="text-white-50 small mb-2 text-truncate"><i class="bi bi-person-circle me-1"></i>${esc(state.session)}</div>
        </div>
      </div>
    </div>
    ${state.drawerOpen ? `<div class="offcanvas-manual-backdrop manual-show" data-action="close-drawer"></div>` : ''}
  `;
}

import { state } from '../state';
import { esc } from '../utils';

export function renderConfirmModal(): string {
  if (!state.confirmDelete) return '';
  const { title, body } = state.confirmDelete;
  return `
    <div class="modal manual-show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-exclamation-triangle text-danger me-2"></i>${esc(title)}</h5>
            <button type="button" class="btn-close" data-action="cancel-delete" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body"><p class="mb-0">${esc(body)}</p></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-action="cancel-delete">Cancelar</button>
            <button type="button" class="btn btn-danger" data-action="confirm-delete">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop manual-show"></div>
  `;
}

export function renderToast(): string {
  if (!state.toastMsg) return '';
  return `
    <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3">
      <div class="toast show text-bg-dark border-0">
        <div class="d-flex">
          <div class="toast-body">${esc(state.toastMsg)}</div>
        </div>
      </div>
    </div>
  `;
}

export function emptyState(icon: string, text: string): string {
  return `
    <div class="text-center text-muted py-5">
      <i class="bi ${icon} d-block mb-2" style="font-size:2.5rem"></i>
      <p class="mb-0">${esc(text)}</p>
    </div>
  `;
}

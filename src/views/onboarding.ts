import { state, ONBOARDING_SLIDES } from '../state';
import { esc } from '../utils';
import { storageAvailable } from '../storage';

export function onboardSlidesTrackHtml(): string {
  const slides = ONBOARDING_SLIDES.map((s) => `
    <div class="onboard-slide text-center text-white">
      <div class="onboard-icon"><i class="bi ${s.icon}"></i></div>
      <h2 class="h3 text-white">${esc(s.title)}</h2>
      <p class="text-white-50 mb-0">${esc(s.body)}</p>
    </div>
  `).join('');
  return `<div class="onboard-track" style="transform:translateX(-${state.onboardStep * 100}%)">${slides}</div>`;
}

export function onboardDotsHtml(): string {
  const dots = ONBOARDING_SLIDES.map((_, i) => `
    <span class="onboard-dot ${i === state.onboardStep ? 'active' : ''}" data-action="onboard-dot" data-index="${i}" role="button"></span>
  `).join('');
  return `<div class="d-flex justify-content-center onboard-dots">${dots}</div>`;
}

/** Controles compartidos entre la pantalla completa y el modal de "ver instructivo de nuevo". */
function onboardControlsHtml(finishAction: string, finishLabel: string, showSkip: boolean): string {
  const last = state.onboardStep === ONBOARDING_SLIDES.length - 1;
  return `
    <div class="d-flex align-items-center justify-content-center gap-3">
      <button type="button" class="btn btn-outline-light onboard-arrow" data-action="onboard-prev" ${state.onboardStep === 0 ? 'disabled' : ''} aria-label="Anterior">
        <i class="bi bi-arrow-left"></i>
      </button>
      <button type="button"
        class="btn btn-warning px-4 fw-semibold onboard-main-btn"
        data-action="${last ? finishAction : 'onboard-next'}"
        data-finish-action="${finishAction}"
        data-finish-label="${esc(finishLabel)}"
        data-next-label="Continuar">${last ? finishLabel : 'Continuar'}</button>
      <button type="button" class="btn btn-outline-light onboard-arrow" data-action="onboard-next" ${last ? 'disabled' : ''} aria-label="Siguiente">
        <i class="bi bi-arrow-right"></i>
      </button>
    </div>
    ${showSkip ? `<button type="button" class="btn btn-link text-white-50 mt-3 onboard-skip-btn" style="display:${last ? 'none' : 'inline-block'}" data-action="onboard-skip">Omitir</button>` : ''}
  `;
}

export function renderOnboarding(): string {
  return `
    <div class="onboard-wrap d-flex flex-column align-items-center justify-content-center p-4">
      <div class="onboard-viewport mb-4">${onboardSlidesTrackHtml()}</div>
      <div class="mb-4">${onboardDotsHtml()}</div>
      ${onboardControlsHtml('onboard-finish', 'Confirmar', true)}
      ${!storageAvailable ? `<p class="text-white-50 small mt-4 text-center" style="max-width:420px">Este navegador bloquea el almacenamiento local: vas a poder usar Sazón igual, pero nada quedará guardado al cerrar la pestaña.</p>` : ''}
    </div>
  `;
}

export function renderTourModal(): string {
  if (!state.tourModalOpen) return '';
  return `
    <div class="modal manual-show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-transparent border-0">
          <div class="onboard-wrap rounded-4 p-4 position-relative">
            <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3" data-action="close-tour" aria-label="Cerrar"></button>
            <div class="onboard-viewport mx-auto mb-4">${onboardSlidesTrackHtml()}</div>
            <div class="mb-4">${onboardDotsHtml()}</div>
            ${onboardControlsHtml('close-tour', 'Listo', false)}
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop manual-show" data-action="close-tour"></div>
  `;
}

/**
 * Avanza/retrocede el carousel de onboarding mutando el DOM existente en vez
 * de volver a renderizar todo: así la transición CSS del track sí se anima
 * (si se recrea el nodo, el navegador no tiene un frame anterior del que partir).
 */
export function updateOnboardDOM(): void {
  const last = state.onboardStep === ONBOARDING_SLIDES.length - 1;

  document.querySelectorAll<HTMLElement>('.onboard-track').forEach((track) => {
    track.style.transform = `translateX(-${state.onboardStep * 100}%)`;
  });

  document.querySelectorAll<HTMLElement>('.onboard-dots').forEach((dots) => {
    dots.querySelectorAll<HTMLElement>('.onboard-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === state.onboardStep);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-action="onboard-prev"]').forEach((btn) => {
    btn.disabled = state.onboardStep === 0;
  });
  document.querySelectorAll<HTMLButtonElement>('.onboard-arrow[data-action="onboard-next"]').forEach((btn) => {
    btn.disabled = last;
  });
  document.querySelectorAll<HTMLButtonElement>('.onboard-main-btn').forEach((btn) => {
    const finishAction = btn.dataset.finishAction || 'onboard-finish';
    const finishLabel = btn.dataset.finishLabel || 'Confirmar';
    const nextLabel = btn.dataset.nextLabel || 'Continuar';
    btn.dataset.action = last ? finishAction : 'onboard-next';
    btn.textContent = last ? finishLabel : nextLabel;
  });
  document.querySelectorAll<HTMLElement>('.onboard-skip-btn').forEach((btn) => {
    btn.style.display = last ? 'none' : 'inline-block';
  });
}

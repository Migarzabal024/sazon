import { state } from './state';
import type { ViewName } from './types';
import { saveDB } from './storage';
import { renderOnboarding, renderTourModal } from './views/onboarding';
import { renderAuth } from './views/auth';
import { renderShellChrome } from './views/shell';
import { renderConfirmModal, renderToast } from './views/shared';
import { renderInicio } from './views/inicio';
import { renderRecetario } from './views/recetario';
import { renderIngredientes } from './views/ingredientes';
import { renderCostos } from './views/costos';
import { renderCotizador } from './views/cotizador';
import { renderRentabilidad } from './views/rentabilidad';
import { renderConfig } from './views/config';

function appEl(): HTMLElement {
  return document.getElementById('app')!;
}

function renderPage(): string {
  switch (state.view) {
    case 'inicio': return renderInicio();
    case 'recetario': return renderRecetario();
    case 'ingredientes': return renderIngredientes();
    case 'costos': return renderCostos();
    case 'cotizador': return renderCotizador();
    case 'rentabilidad': return renderRentabilidad();
    case 'config': return renderConfig();
    default: return renderInicio();
  }
}

interface FocusInfo {
  path: string;
  root: string | null;
  selStart: number | null;
  selEnd: number | null;
}

function captureFocus(): FocusInfo | null {
  const el = document.activeElement;
  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement) && !(el instanceof HTMLSelectElement)) {
    return null;
  }
  const path = el.getAttribute('data-bind');
  if (!path) return null;
  const rootEl = el.closest('[data-bind-root]');
  const root = rootEl ? rootEl.getAttribute('data-bind-root') : null;
  let selStart: number | null = null;
  let selEnd: number | null = null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    try { selStart = el.selectionStart; selEnd = el.selectionEnd; } catch { /* algunos tipos de input no soportan selección */ }
  }
  return { path, root, selStart, selEnd };
}

function restoreFocus(info: FocusInfo | null): void {
  if (!info) return;
  const selector = info.root
    ? `[data-bind-root="${info.root}"] [data-bind="${info.path}"]`
    : `[data-bind="${info.path}"]`;
  const el = document.querySelector(selector);
  if (!el || !(el instanceof HTMLElement)) return;
  el.focus();
  if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && info.selStart !== null) {
    try { el.setSelectionRange(info.selStart, info.selEnd ?? info.selStart); } catch { /* tipos como number/email no soportan rango de selección */ }
  }
}

export function render(): void {
  const focus = captureFocus();
  let html: string;
  if (!state.session) {
    html = state.authScreen === 'onboarding' ? renderOnboarding() : renderAuth();
  } else {
    html = renderShellChrome(renderPage()) + renderTourModal();
  }
  html += renderConfirmModal() + renderToast();
  appEl().innerHTML = html;
  restoreFocus(focus);
}

export function goto(view: ViewName): void {
  state.view = view;
  state.draft = null;
  state.drawerOpen = false;
  render();
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(msg: string): void {
  state.toastMsg = msg;
  render();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toastMsg = null;
    render();
  }, 2600);
}

export function persist(): void {
  saveDB(state.db, state.session);
}

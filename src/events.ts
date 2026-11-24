import { state, currentUser, uid, ONBOARDING_SLIDES } from './state';
import type { Receta, ConfirmDeleteInfo, ViewName } from './types';
import { createUser, saveSession } from './storage';
import { setPath } from './path';
import { clampNum } from './utils';
import { defaultUnitFor } from './calc';
import { handlePhoto } from './photo';
import { render, goto, showToast, persist } from './render';
import { updateOnboardDOM } from './views/onboarding';
import { blankReceta } from './views/recetario';
import { blankIngrediente } from './views/ingredientes';
import { blankCosto } from './views/costos';

function appEl(): HTMLElement {
  return document.getElementById('app')!;
}

function resolveRoot(name: string | null | undefined): Record<string, unknown> | null {
  if (name === 'draft') return state.draft as unknown as Record<string, unknown>;
  if (name === 'config') return (currentUser()?.config ?? null) as unknown as Record<string, unknown>;
  if (name === 'cotizador') return state.cotizador as unknown as Record<string, unknown>;
  return null;
}

// ---------------------------------------------------------------------
// Input / binding genérico (data-bind + data-bind-root)
// ---------------------------------------------------------------------

function onInput(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const bindEl = target.closest('[data-bind]');
  if (!bindEl || !(bindEl instanceof HTMLElement)) return;

  const path = bindEl.getAttribute('data-bind')!;
  const rootName = bindEl.closest('[data-bind-root]')?.getAttribute('data-bind-root') ?? null;
  const root = resolveRoot(rootName);
  if (!root) return;

  let value: unknown;
  if (bindEl instanceof HTMLInputElement && bindEl.type === 'checkbox') {
    value = bindEl.checked;
  } else if (bindEl.getAttribute('data-bind-type') === 'number') {
    value = clampNum((bindEl as HTMLInputElement).value, 0);
  } else {
    value = (bindEl as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }
  setPath(root, path, value);

  const autoUnitPath = bindEl.getAttribute('data-autounit-path');
  if (autoUnitPath) {
    const ing = currentUser()?.ingredientes.find((i) => i.id === value);
    setPath(root, autoUnitPath, defaultUnitFor(ing));
  }

  render();
  if (rootName === 'config') persist();
}

function onFileChange(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'file') return;
  if (target.getAttribute('data-action') !== 'receta-photo-input') return;
  const file = target.files?.[0];
  if (!file) return;
  handlePhoto(file)
    .then((dataUrl) => {
      if (state.draft && state.draft.type === 'receta') {
        state.draft.fotoDataUrl = dataUrl;
        render();
      }
    })
    .catch((err: Error) => showToast(err.message || 'No se pudo cargar la imagen.'));
}

// ---------------------------------------------------------------------
// Formularios (submit)
// ---------------------------------------------------------------------

function onSubmit(e: Event): void {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  const action = form.getAttribute('data-submit-action');
  if (!action) return;
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  if (action === 'auth-submit') handleAuthSubmit(form);
}

function handleAuthSubmit(form: HTMLFormElement): void {
  const fd = new FormData(form);
  const username = String(fd.get('username') || '').trim();
  const password = String(fd.get('password') || '');

  if (!username) { state.authError = 'Ingresá un usuario.'; render(); return; }

  if (state.authMode === 'registro') {
    const password2 = String(fd.get('password2') || '');
    if (password !== password2) { state.authError = 'Las contraseñas no coinciden.'; render(); return; }
    if (state.db.users[username]) { state.authError = 'Ese usuario ya existe. Probá iniciar sesión.'; render(); return; }
    createUser(state.db, username, password, uid);
    logIn(username);
    return;
  }

  const user = state.db.users[username];
  if (!user || user.password !== password) {
    state.authError = 'Usuario o contraseña incorrectos.';
    render();
    return;
  }
  logIn(username);
}

function logIn(username: string): void {
  state.session = username;
  saveSession(username);
  state.authError = '';
  state.view = 'inicio';
  render();
}

// ---------------------------------------------------------------------
// Borrado con confirmación (compartido por recetas/ingredientes/costos)
// ---------------------------------------------------------------------

function askDelete(info: ConfirmDeleteInfo): void {
  state.confirmDelete = info;
  render();
}

function performDelete(): void {
  const info = state.confirmDelete;
  const u = currentUser();
  if (!info || !u) return;
  if (info.kind === 'receta') u.recetas = u.recetas.filter((r) => r.id !== info.id);
  if (info.kind === 'ingrediente') u.ingredientes = u.ingredientes.filter((i) => i.id !== info.id);
  if (info.kind === 'costo') u.costosIndirectos = u.costosIndirectos.filter((c) => c.id !== info.id);
  persist();
  state.confirmDelete = null;
  render();
  showToast('Eliminado.');
}

// ---------------------------------------------------------------------
// Click (data-action)
// ---------------------------------------------------------------------

function onClick(e: Event): void {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const actionEl = target.closest<HTMLElement>('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action!;
  const id = actionEl.dataset.id;
  const index = actionEl.dataset.index !== undefined ? parseInt(actionEl.dataset.index, 10) : undefined;
  const u = currentUser();

  switch (action) {
    // --- Auth ---------------------------------------------------------
    case 'auth-tab-login':
      state.authMode = 'login'; state.authError = ''; render(); break;
    case 'auth-tab-registro':
      state.authMode = 'registro'; state.authError = ''; render(); break;
    case 'reopen-onboarding':
      state.authScreen = 'onboarding'; state.onboardStep = 0; render(); break;

    // --- Onboarding (pantalla completa) --------------------------------
    case 'onboard-next':
      state.onboardStep = Math.min(state.onboardStep + 1, ONBOARDING_SLIDES.length - 1);
      updateOnboardDOM(); break;
    case 'onboard-prev':
      state.onboardStep = Math.max(state.onboardStep - 1, 0);
      updateOnboardDOM(); break;
    case 'onboard-dot':
      state.onboardStep = index ?? 0;
      updateOnboardDOM(); break;
    case 'onboard-skip':
    case 'onboard-finish':
      state.authScreen = 'auth'; state.onboardStep = 0; render(); break;

    // --- Tour (modal dentro de la app) ---------------------------------
    case 'open-tour':
      state.tourModalOpen = true; state.onboardStep = 0; render(); break;
    case 'close-tour':
      state.tourModalOpen = false; render(); break;

    // --- Navegación / shell --------------------------------------------
    case 'nav':
      goto(actionEl.dataset.view as ViewName); break;
    case 'toggle-drawer':
      state.drawerOpen = !state.drawerOpen; render(); break;
    case 'close-drawer':
      state.drawerOpen = false; render(); break;
    case 'logout':
      state.session = null;
      saveSession(null);
      state.authMode = 'login';
      state.authError = '';
      state.authScreen = 'auth';
      state.view = 'inicio';
      state.draft = null;
      state.drawerOpen = false;
      render();
      break;

    // --- Recetas ---------------------------------------------------------
    case 'receta-new':
      state.view = 'recetario'; state.draft = blankReceta(); render(); break;
    case 'receta-edit': {
      const r = u?.recetas.find((x) => x.id === id);
      if (r) {
        state.view = 'recetario';
        state.draft = {
          ...structuredCloneReceta(r),
          type: 'receta',
        };
        render();
      }
      break;
    }
    case 'receta-cancel':
      state.draft = null; render(); break;
    case 'receta-save': {
      const draft = state.draft;
      if (!u || !draft || draft.type !== 'receta') break;
      const { type: _t, ...receta } = draft;
      void _t;
      if (!receta.nombre.trim()) { showToast('Ponele un nombre a la receta.'); break; }
      const i = u.recetas.findIndex((x) => x.id === receta.id);
      if (i >= 0) u.recetas[i] = receta; else u.recetas.push(receta);
      persist();
      state.draft = null;
      showToast('Receta guardada.');
      break;
    }
    case 'receta-delete': {
      const r = u?.recetas.find((x) => x.id === id);
      if (r) askDelete({ kind: 'receta', id: r.id, title: 'Eliminar receta', body: `¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.` });
      break;
    }
    case 'receta-add-ingrediente-linea': {
      const draft = state.draft;
      if (draft?.type === 'receta') {
        draft.ingredientes.push({ ingredienteId: '', cantidad: 0, unidad: 'g' });
        render();
      }
      break;
    }
    case 'receta-remove-ingrediente-linea': {
      const draft = state.draft;
      if (draft?.type === 'receta' && index !== undefined) {
        draft.ingredientes.splice(index, 1);
        render();
      }
      break;
    }
    case 'receta-add-paso': {
      const draft = state.draft;
      if (draft?.type === 'receta') { draft.pasos.push(''); render(); }
      break;
    }
    case 'receta-remove-paso': {
      const draft = state.draft;
      if (draft?.type === 'receta' && index !== undefined) {
        draft.pasos.splice(index, 1);
        render();
      }
      break;
    }
    case 'toggle-indirecto': {
      const draft = state.draft;
      if (draft?.type === 'receta' && id) {
        const checked = (actionEl as HTMLInputElement).checked;
        const list = draft.indirectos;
        const pos = list.indexOf(id);
        if (checked && pos === -1) list.push(id);
        if (!checked && pos !== -1) list.splice(pos, 1);
      }
      break;
    }

    // --- Ingredientes -------------------------------------------------
    case 'ingrediente-new':
      state.view = 'ingredientes'; state.draft = blankIngrediente(); render(); break;
    case 'ingrediente-edit': {
      const ing = u?.ingredientes.find((x) => x.id === id);
      if (ing) { state.view = 'ingredientes'; state.draft = { ...ing, type: 'ingrediente' }; render(); }
      break;
    }
    case 'ingrediente-cancel':
      state.draft = null; render(); break;
    case 'ingrediente-save': {
      const draft = state.draft;
      if (!u || !draft || draft.type !== 'ingrediente') break;
      const { type: _t, ...ing } = draft;
      void _t;
      if (!ing.nombre.trim()) { showToast('Ponele un nombre al ingrediente.'); break; }
      const i = u.ingredientes.findIndex((x) => x.id === ing.id);
      if (i >= 0) u.ingredientes[i] = ing; else u.ingredientes.push(ing);
      persist();
      state.draft = null;
      showToast('Ingrediente guardado.');
      break;
    }
    case 'ingrediente-delete': {
      const ing = u?.ingredientes.find((x) => x.id === id);
      if (ing) askDelete({ kind: 'ingrediente', id: ing.id, title: 'Eliminar ingrediente', body: `¿Eliminar "${ing.nombre}"? Las recetas que lo usan quedarán sin ese ingrediente.` });
      break;
    }

    // --- Costos indirectos ----------------------------------------------
    case 'costo-new':
      state.view = 'costos'; state.draft = blankCosto(); render(); break;
    case 'costo-edit': {
      const c = u?.costosIndirectos.find((x) => x.id === id);
      if (c) { state.view = 'costos'; state.draft = { ...c, type: 'costo' }; render(); }
      break;
    }
    case 'costo-cancel':
      state.draft = null; render(); break;
    case 'costo-save': {
      const draft = state.draft;
      if (!u || !draft || draft.type !== 'costo') break;
      const { type: _t, ...costo } = draft;
      void _t;
      if (!costo.nombre.trim()) { showToast('Ponele un nombre al costo.'); break; }
      const i = u.costosIndirectos.findIndex((x) => x.id === costo.id);
      if (i >= 0) u.costosIndirectos[i] = costo; else u.costosIndirectos.push(costo);
      persist();
      state.draft = null;
      showToast('Costo guardado.');
      break;
    }
    case 'costo-delete': {
      const c = u?.costosIndirectos.find((x) => x.id === id);
      if (c) askDelete({ kind: 'costo', id: c.id, title: 'Eliminar costo indirecto', body: `¿Eliminar "${c.nombre}"? Las recetas que lo tengan asignado dejarán de calcularlo.` });
      break;
    }

    // --- Borrado compartido -----------------------------------------------
    case 'cancel-delete':
      state.confirmDelete = null; render(); break;
    case 'confirm-delete':
      performDelete(); break;

    // --- Configuración --------------------------------------------------
    case 'config-add-canal':
      if (u) { u.config.canales.push({ id: uid(), nombre: 'Nuevo canal', comision: 0 }); persist(); render(); }
      break;
    case 'config-remove-canal':
      if (u && index !== undefined) { u.config.canales.splice(index, 1); persist(); render(); }
      break;

    default:
      break;
  }
}

function structuredCloneReceta(r: Receta): Receta {
  return {
    ...r,
    ingredientes: r.ingredientes.map((l) => ({ ...l })),
    indirectos: [...r.indirectos],
    pasos: [...r.pasos],
  };
}

// ---------------------------------------------------------------------

export function wireEvents(): void {
  const root = appEl();
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onFileChange);
  root.addEventListener('submit', onSubmit);
}

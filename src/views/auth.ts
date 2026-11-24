import { state } from '../state';
import { esc } from '../utils';
import { storageAvailable } from '../storage';

export function renderAuth(): string {
  const isLogin = state.authMode === 'login';
  return `
    <div class="auth-wrap d-flex align-items-center justify-content-center p-3">
      <div class="auth-card card shadow-sm border-0">
        <div class="card-body p-4 p-md-5">
          <div class="text-center mb-4">
            <div class="onboard-icon mx-auto" style="background:rgba(47,75,60,.1);color:#2F4B3C;"><i class="bi bi-egg-fried"></i></div>
            <h1 class="brand-logo h3 mb-1">Sazón</h1>
            <p class="text-muted small mb-0">Tu recetario y el costeo de tu producción</p>
          </div>

          ${!storageAvailable ? `
            <div class="alert alert-warning auth-storage-warning" role="alert">
              <i class="bi bi-exclamation-triangle me-1"></i>
              Este navegador bloquea el almacenamiento local (modo privado o configuración restringida). Podés usar Sazón, pero nada va a quedar guardado al cerrar la pestaña.
            </div>
          ` : ''}

          <ul class="nav nav-pills nav-fill mb-4" role="tablist">
            <li class="nav-item"><button type="button" class="nav-link ${isLogin ? 'active' : ''}" data-action="auth-tab-login">Iniciar sesión</button></li>
            <li class="nav-item"><button type="button" class="nav-link ${!isLogin ? 'active' : ''}" data-action="auth-tab-registro">Crear cuenta</button></li>
          </ul>

          ${state.authError ? `<div class="alert alert-danger py-2" role="alert">${esc(state.authError)}</div>` : ''}

          <form data-submit-action="auth-submit">
            <div class="mb-3">
              <label class="form-label" for="auth-username">Usuario</label>
              <input id="auth-username" name="username" type="text" class="form-control" autocomplete="username" required>
            </div>
            <div class="mb-3">
              <label class="form-label" for="auth-password">Contraseña</label>
              <input id="auth-password" name="password" type="password" class="form-control" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="4">
            </div>
            ${!isLogin ? `
              <div class="mb-3">
                <label class="form-label" for="auth-password2">Repetir contraseña</label>
                <input id="auth-password2" name="password2" type="password" class="form-control" autocomplete="new-password" required minlength="4">
              </div>
            ` : ''}
            <button type="submit" class="btn btn-success w-100 fw-semibold py-2">
              ${isLogin ? 'Entrar' : 'Crear mi cuenta'}
            </button>
          </form>

          <button type="button" class="btn btn-link btn-sm text-muted d-block mx-auto mt-3" data-action="reopen-onboarding">
            <i class="bi bi-play-circle me-1"></i>Ver el instructivo de nuevo
          </button>
        </div>
      </div>
    </div>
  `;
}

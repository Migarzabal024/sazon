// Persistencia en localStorage, con manejo defensivo para navegadores que
// bloquean el almacenamiento (modo privado, vistas restringidas, etc.).

import type { Database, User, UserConfig } from './types';

const DB_KEY = 'sazon_db_v1';
const SESSION_KEY = 'sazon_session_v1';

export let storageAvailable = true;

export function checkStorageAvailable(): boolean {
  try {
    const k = '__sazon_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function loadDB(): Database {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { users: {} };
    const parsed = JSON.parse(raw);
    if (!parsed.users) return { users: {} };
    return parsed as Database;
  } catch {
    return { users: {} };
  }
}

export function saveDB(db: Database, session: string | null): void {
  try {
    if (session && db.users[session]) {
      db.users[session].meta = { ...(db.users[session].meta || {}), lastSavedAt: Date.now() };
    }
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    storageAvailable = false;
  }
}

export function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch {
    return null;
  }
}

export function saveSession(username: string | null): void {
  try {
    if (username) localStorage.setItem(SESSION_KEY, username);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    storageAvailable = false;
  }
}

export function defaultConfig(uid: () => string): UserConfig {
  return {
    monedaCode: 'ARS',
    monedaSimboloCustom: '',
    impuestoDefault: 0,
    margenDefault: 40,
    modoMargenDefault: 'costo',
    margenMinimo: 20,
    canales: [
      { id: uid(), nombre: 'Venta directa / efectivo', comision: 0 },
      { id: uid(), nombre: 'Mercado Pago', comision: 6 },
      { id: uid(), nombre: 'App de delivery', comision: 25 },
    ],
  };
}

export function createUser(db: Database, username: string, password: string, uid: () => string): void {
  const user: User = {
    password,
    config: defaultConfig(uid),
    ingredientes: [],
    recetas: [],
    costosIndirectos: [],
  };
  db.users[username] = user;
  saveDB(db, username);
}

storageAvailable = checkStorageAvailable();

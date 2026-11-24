// Helpers genéricos para leer/escribir una ruta tipo "canales[1].comision"
// dentro de un objeto cualquiera. Usados por el binding de formularios.

function parts(path: string): (string)[] {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
}

export function getPath(obj: unknown, path: string): unknown {
  return parts(path).reduce<unknown>((o, k) => {
    if (o == null) return undefined;
    return (o as Record<string, unknown>)[k];
  }, obj);
}

export function setPath(obj: unknown, path: string, value: unknown): void {
  const ps = parts(path);
  let o = obj as Record<string, unknown>;
  for (let i = 0; i < ps.length - 1; i++) {
    o = o[ps[i]] as Record<string, unknown>;
  }
  o[ps[ps.length - 1]] = value;
}

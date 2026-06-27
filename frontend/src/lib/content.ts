/* eslint-disable @typescript-eslint/no-explicit-any */

/** Flattens a nested translation subtree into { 'dotted.path': string } for
 *  every string leaf (arrays use numeric segments, e.g. faq.items.0.q). */
export function flattenStrings(obj: any, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (obj == null) return out;
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') out[path] = val;
    else if (val && typeof val === 'object') flattenStrings(val, path, out);
  }
  return out;
}

/** Rebuilds a nested object (with arrays for numeric segments) from a flat map. */
export function unflatten(map: Record<string, string>): any {
  const root: any = {};
  for (const [path, val] of Object.entries(map)) {
    const keys = path.split('.');
    let cur = root;
    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) { cur[k] = val; return; }
      if (cur[k] == null) cur[k] = /^\d+$/.test(keys[idx + 1]) ? [] : {};
      cur = cur[k];
    });
  }
  return root;
}

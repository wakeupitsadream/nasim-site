import { readFileSync } from 'node:fs';

type Tree = { [key: string]: string | Tree };
const cache = new Map<string, Tree>();

/** A UI string from messages/{locale}.json by dotted path, e.g. msg('en', 'Header.openMenu'). */
export function msg(locale: string, path: string): string {
  let tree = cache.get(locale);
  if (!tree) {
    tree = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Tree;
    cache.set(locale, tree);
  }
  const value = path
    .split('.')
    .reduce<string | Tree | undefined>(
      (node, key) => (typeof node === 'object' ? node[key] : undefined),
      tree,
    );
  if (typeof value !== 'string') throw new Error(`messages/${locale}.json: no string at ${path}`);
  return value;
}

export const MOBILE = { width: 390, height: 844 };
export const DESKTOP = { width: 1280, height: 800 };

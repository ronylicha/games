// Resolveur ESM minimal pour exécuter les tests TypeScript du moteur via le
// lanceur natif `node --test` (Node 24 strippe les types nativement).
//
// Node, en ESM, exige des spécificateurs complets : les imports relatifs sans
// extension du moteur (`import './types'`) et l'alias `@/*` du tsconfig ne sont
// pas résolus par défaut. Ce hook les complète sans aucune dépendance externe :
//  - `@/assets/x` → ./assets/x  et  `@/x` → ./src/x ;
//  - extension manquante → essaie .ts, .tsx, .js, .mjs puis /index.* .
//
// Le chargement/transpilation reste assuré par Node (type stripping natif) ;
// ce hook n'intervient que sur la résolution des chemins.
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json'];

// On transpile via le paquet `typescript` déjà installé (devDependency). À la
// différence du type stripping natif de Node, `transpileModule` élide les
// imports purement typés (`import { TarotCard } from './types'`) — ce que le
// code du moteur utilise au lieu de `import type`.
const require = createRequire(import.meta.url);
const ts = require('typescript');

/** Vrai si `path` désigne un fichier régulier existant. */
function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Renvoie l'URL d'un fichier existant pour un chemin éventuellement sans extension. */
function resolveWithExtensions(absolutePath) {
  if (isFile(absolutePath)) {
    return pathToFileURL(absolutePath).href;
  }
  for (const ext of EXTENSIONS) {
    const candidate = absolutePath + ext;
    if (isFile(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  for (const ext of EXTENSIONS) {
    const candidate = resolvePath(absolutePath, `index${ext}`);
    if (isFile(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // Alias tsconfig : @/assets/* puis @/*.
  if (specifier.startsWith('@/assets/')) {
    const url = resolveWithExtensions(resolvePath(ROOT, 'assets', specifier.slice('@/assets/'.length)));
    if (url) return { url, shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const url = resolveWithExtensions(resolvePath(ROOT, 'src', specifier.slice(2)));
    if (url) return { url, shortCircuit: true };
  }

  // Imports relatifs : laisser Node tenter, puis compléter l'extension manquante.
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    try {
      return await nextResolve(specifier, context);
    } catch (error) {
      const parentURL = context.parentURL ?? pathToFileURL(`${ROOT}/`).href;
      const absolutePath = fileURLToPath(new URL(specifier, parentURL));
      const url = resolveWithExtensions(absolutePath);
      if (url) return { url, shortCircuit: true };
      throw error;
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const source = readFileSync(fileURLToPath(url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        verbatimModuleSyntax: false,
        sourceMap: false,
      },
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}

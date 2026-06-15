// Enregistre le resolveur ESM des tests TypeScript (cf. ts-test-loader.mjs).
// Utilisé via `node --import ./scripts/test-register.mjs --test ...`.
import { register } from 'node:module';

register('./ts-test-loader.mjs', import.meta.url);

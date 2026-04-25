import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { BackendGenerator } from '../../../../../commands/gen2-migration/generate/amplify/backend.generator';

jest.unmock('fs-extra');

describe('BackendGenerator', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backend-gen-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  async function verifyBackendTs(gen: BackendGenerator, assertion: (content: string) => void): Promise<void> {
    const ops = await gen.plan();
    await ops[0].execute();
    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    assertion(content);
  }

  describe('addNamespaceImport', () => {
    it('allows duplicate imports for the same alias', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addNamespaceImport('auth', './auth/resource');

      return verifyBackendTs(gen, (content) => {
        const importLines = content.split('\n').filter((l) => l.includes("from './auth/resource'"));
        expect(importLines).toHaveLength(2);
      });
    });

    it('adds multiple namespace imports for different aliases', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addNamespaceImport('data', './data/resource');

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain("import * as auth from './auth/resource'");
        expect(content).toContain("import * as data from './data/resource'");
      });
    });
  });

  describe('addDefineBackendEntry', () => {
    it('emits entries in insertion order', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('storage', './storage/resource');
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addDefineBackendEntry('storage', 'storage', 'storage');
      gen.addDefineBackendEntry('auth', 'auth', 'auth');

      return verifyBackendTs(gen, (content) => {
        const storageIdx = content.indexOf('storage: storage.storage');
        const authIdx = content.indexOf('auth: auth.auth');
        expect(storageIdx).toBeLessThan(authIdx);
      });
    });
  });

  describe('import ordering', () => {
    it('emits imports in insertion order', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('myFunc', './function/myFunc/resource');
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addDefineBackendEntry('myFunc', 'myFunc', 'myFunc');
      gen.addDefineBackendEntry('auth', 'auth', 'auth');

      return verifyBackendTs(gen, (content) => {
        const funcImportIdx = content.indexOf("from './function/myFunc/resource'");
        const authImportIdx = content.indexOf("from './auth/resource'");
        expect(funcImportIdx).toBeLessThan(authImportIdx);
      });
    });
  });

  describe('plan', () => {
    it('returns exactly one operation', async () => {
      const gen = new BackendGenerator(outputDir);
      const ops = await gen.plan();
      expect(ops).toHaveLength(1);
    });

    it('describes the backend.ts file path', async () => {
      const gen = new BackendGenerator(outputDir);
      const ops = await gen.plan();
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toBe('Generate amplify/backend.ts');
    });

    it('writes backend.ts with defineBackend call', () => {
      const gen = new BackendGenerator(outputDir);
      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('defineBackend');
      });
    });
  });
});

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

  describe('addNamespaceImport', () => {
    it('does not duplicate imports for the same alias', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addNamespaceImport('auth', './auth/resource');

      return verifyBackendTs(gen, (content) => {
        const importLines = content.split('\n').filter((l) => l.includes("from './auth/resource'"));
        expect(importLines).toHaveLength(1);
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
    it('sorts entries: auth, data, storage, then others', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('storage', './storage/resource');
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addNamespaceImport('data', './data/resource');
      gen.addNamespaceImport('myFunc', './function/myFunc/resource');
      gen.addDefineBackendEntry('storage', 'storage', 'storage');
      gen.addDefineBackendEntry('auth', 'auth', 'auth');
      gen.addDefineBackendEntry('data', 'data', 'data');
      gen.addDefineBackendEntry('myFunc', 'myFunc', 'myFunc');

      return verifyBackendTs(gen, (content) => {
        const authIdx = content.indexOf('auth: auth.auth');
        const dataIdx = content.indexOf('data: data.data');
        const storageIdx = content.indexOf('storage: storage.storage');
        const funcIdx = content.indexOf('myFunc: myFunc.myFunc');
        expect(authIdx).toBeLessThan(dataIdx);
        expect(dataIdx).toBeLessThan(storageIdx);
        expect(storageIdx).toBeLessThan(funcIdx);
      });
    });
  });

  describe('import sorting', () => {
    it('sorts resource imports: auth before data before storage before functions', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('myFunc', './function/myFunc/resource');
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addNamespaceImport('data', './data/resource');
      gen.addDefineBackendEntry('auth', 'auth', 'auth');
      gen.addDefineBackendEntry('data', 'data', 'data');
      gen.addDefineBackendEntry('myFunc', 'myFunc', 'myFunc');

      return verifyBackendTs(gen, (content) => {
        const authImportIdx = content.indexOf("from './auth/resource'");
        const dataImportIdx = content.indexOf("from './data/resource'");
        const funcImportIdx = content.indexOf("from './function/myFunc/resource'");

        expect(authImportIdx).toBeLessThan(dataImportIdx);
        expect(dataImportIdx).toBeLessThan(funcImportIdx);
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

    it('inserts a blank line between imports and defineBackend', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addNamespaceImport('auth', './auth/resource');
      gen.addDefineBackendEntry('auth', 'auth', 'auth');

      return verifyBackendTs(gen, (content) => {
        const lines = content.split('\n');
        const lastImportLine = lines.findIndex((l) => l.includes("from '@aws-amplify/backend'"));
        expect(lastImportLine).toBeGreaterThan(-1);
        expect(lines[lastImportLine + 1]).toBe('');
      });
    });
  });

  async function verifyBackendTs(gen: BackendGenerator, assertion: (content: string) => void): Promise<void> {
    const ops = await gen.plan();
    await ops[0].execute();
    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    assertion(content);
  }
});

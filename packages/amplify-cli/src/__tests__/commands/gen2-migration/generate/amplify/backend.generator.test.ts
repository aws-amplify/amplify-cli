import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { BackendGenerator } from '../../../../../commands/gen2-migration/generate/amplify/backend.generator';

jest.unmock('fs-extra');

const factory = ts.factory;

describe('BackendGenerator', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backend-gen-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  describe('addImport', () => {
    it('merges identifiers for the same source module', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addImport('@aws-amplify/backend', ['defineBackend']);
      gen.addImport('@aws-amplify/backend', ['secret']);

      // Verify via plan() output
      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('defineBackend');
        expect(content).toContain('secret');
        // Should appear in a single import, not two separate ones
        const importCount = (content.match(/from '@aws-amplify\/backend'/g) || []).length;
        expect(importCount).toBe(1);
      });
    });

    it('does not duplicate identifiers', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addImport('./auth/resource', ['auth']);
      gen.addImport('./auth/resource', ['auth']);

      return verifyBackendTs(gen, (content) => {
        // Should have exactly one import from './auth/resource'
        const importLines = content.split('\n').filter((l) => l.includes("from './auth/resource'"));
        expect(importLines).toHaveLength(1);
        // The import specifier list should contain 'auth' only once
        const specifierMatch = importLines[0].match(/\{([^}]+)\}/);
        expect(specifierMatch).toBeDefined();
        const specifiers = specifierMatch![1].split(',').map((s) => s.trim());
        expect(specifiers.filter((s) => s === 'auth')).toHaveLength(1);
      });
    });
  });

  describe('addDefineBackendProperty', () => {
    it('sorts properties: auth, data, storage, then others', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('storage'));
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('auth'));
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('data'));
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('myFunc'));

      return verifyBackendTs(gen, (content) => {
        const authIdx = content.indexOf('auth');
        const dataIdx = content.indexOf('data');
        const storageIdx = content.indexOf('storage');
        const funcIdx = content.indexOf('myFunc');
        expect(authIdx).toBeLessThan(dataIdx);
        expect(dataIdx).toBeLessThan(storageIdx);
        expect(storageIdx).toBeLessThan(funcIdx);
      });
    });
  });

  describe('ensureBranchName', () => {
    it('emits branchName declaration exactly once', () => {
      const gen = new BackendGenerator(outputDir);
      gen.ensureBranchName();
      gen.ensureBranchName();

      return verifyBackendTs(gen, (content) => {
        const matches = content.match(/const branchName/g) || [];
        expect(matches).toHaveLength(1);
      });
    });
  });

  describe('ensureStorageStack', () => {
    it('emits storageStack from backend.storage.stack when S3 exists', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addImport('./storage/resource', ['storage']);
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('storage'));
      gen.ensureStorageStack(true);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('backend.storage.stack');
      });
    });

    it('emits storageStack via createStack when no S3', () => {
      const gen = new BackendGenerator(outputDir);
      gen.ensureStorageStack(false);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain("backend.createStack('storage')");
      });
    });

    it('emits storageStack exactly once', () => {
      const gen = new BackendGenerator(outputDir);
      gen.ensureStorageStack(false);
      gen.ensureStorageStack(false);

      return verifyBackendTs(gen, (content) => {
        const matches = content.match(/const storageStack/g) || [];
        expect(matches).toHaveLength(1);
      });
    });
  });

  describe('import sorting', () => {
    it('sorts resource imports before CDK imports before @aws-amplify/backend', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addImport('aws-cdk-lib', ['Stack']);
      gen.addImport('./auth/resource', ['auth']);
      gen.addImport('./data/resource', ['data']);
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('auth'));
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('data'));

      return verifyBackendTs(gen, (content) => {
        const authImportIdx = content.indexOf("from './auth/resource'");
        const dataImportIdx = content.indexOf("from './data/resource'");
        const backendImportIdx = content.indexOf("from '@aws-amplify/backend'");
        const cdkImportIdx = content.indexOf("from 'aws-cdk-lib'");

        expect(authImportIdx).toBeLessThan(dataImportIdx);
        expect(dataImportIdx).toBeLessThan(backendImportIdx);
        expect(backendImportIdx).toBeLessThan(cdkImportIdx);
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
      gen.addImport('./auth/resource', ['auth']);
      gen.addDefineBackendProperty(factory.createShorthandPropertyAssignment('auth'));

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

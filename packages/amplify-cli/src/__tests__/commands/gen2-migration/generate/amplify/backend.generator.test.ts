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
        // The commented Tags import immediately follows the last real import
        expect(lines[lastImportLine + 1]).toBe("// import { Tags } from 'aws-cdk-lib';");
        // Then a blank line separates imports from defineBackend
        expect(lines[lastImportLine + 2]).toBe('');
      });
    });
  });

  async function verifyBackendTs(gen: BackendGenerator, assertion: (content: string) => void): Promise<void> {
    const ops = await gen.plan();
    await ops[0].execute();
    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    assertion(content);
  }

  describe('addBackendStackRetentionLoop', () => {
    it('emits a retention loop with addOverride for a single type', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addBackendStackRetentionLoop('storage', ['AWS::S3::Bucket']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('backend.storage.stack.node');
        expect(content).toContain("c.cfnResourceType === 'AWS::S3::Bucket'");
        expect(content).toContain("addOverride('DeletionPolicy', 'Retain')");
        expect(content).toContain("addOverride('UpdateReplacePolicy', 'Retain')");
        expect(content).not.toContain('REFACTORED_RESOURCE_TYPES');
      });
    });

    it('emits .includes() check when multiple types are registered', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addBackendStackRetentionLoop('auth', ['AWS::Cognito::UserPool', 'AWS::Cognito::IdentityPool']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('backend.auth.stack.node');
        expect(content).toContain('.includes(');
        expect(content).toContain("'AWS::Cognito::UserPool'");
        expect(content).toContain("'AWS::Cognito::IdentityPool'");
      });
    });

    it('emits separate loops for different stacks', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addBackendStackRetentionLoop('auth', ['AWS::Cognito::UserPool']);
      gen.addBackendStackRetentionLoop('storage', ['AWS::S3::Bucket']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('backend.auth.stack.node');
        expect(content).toContain('backend.storage.stack.node');
      });
    });

    it('imports CfnResource when types are registered', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addBackendStackRetentionLoop('storage', ['AWS::S3::Bucket']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('CfnResource');
      });
    });

    it('does not emit retention block when no loops are added', () => {
      const gen = new BackendGenerator(outputDir);

      return verifyBackendTs(gen, (content) => {
        expect(content).not.toContain('CfnResource');
        expect(content).not.toContain('addOverride');
      });
    });
  });

  describe('addVariableRetentionLoop', () => {
    it('emits a retention loop referencing a variable', () => {
      const gen = new BackendGenerator(outputDir);
      const stackVar = gen.createDynamoDBStack('activity');
      gen.addVariableRetentionLoop(stackVar, ['AWS::DynamoDB::Table']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('storageActivityStack.node');
        expect(content).toContain("c.cfnResourceType === 'AWS::DynamoDB::Table'");
        expect(content).toContain("addOverride('DeletionPolicy', 'Retain')");
        expect(content).toContain("addOverride('UpdateReplacePolicy', 'Retain')");
      });
    });

    it('imports CfnResource when called', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addVariableRetentionLoop('myStack', ['AWS::DynamoDB::Table']);

      return verifyBackendTs(gen, (content) => {
        expect(content).toContain('CfnResource');
      });
    });

    it('emits retention loops after post-define statements', () => {
      const gen = new BackendGenerator(outputDir);
      gen.addStatement(factory.createExpressionStatement(factory.createIdentifier('// post-define marker')));
      gen.addVariableRetentionLoop('myStack', ['AWS::DynamoDB::Table']);

      return verifyBackendTs(gen, (content) => {
        const markerIdx = content.indexOf('post-define marker');
        const loopIdx = content.indexOf('myStack.node');
        expect(markerIdx).toBeGreaterThan(-1);
        expect(loopIdx).toBeGreaterThan(-1);
        expect(markerIdx).toBeLessThan(loopIdx);
      });
    });
  });
});

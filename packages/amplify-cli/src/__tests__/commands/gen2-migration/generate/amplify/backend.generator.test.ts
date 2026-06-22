import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { BackendGenerator } from '../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { SpinningLogger } from '../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

describe('BackendGenerator', () => {
  let outputDir: string;
  const logger = new SpinningLogger('test');

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backend-gen-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('writes empty backend.ts with no contributions', async () => {
    const gen = new BackendGenerator(outputDir, logger);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "import { defineBackend } from '@aws-amplify/backend';
      import { Tags } from 'aws-cdk-lib';

      const backend = defineBackend({});

      export type Backend = typeof backend;

      export function postRefactor() {
        Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
      }

      // Uncomment after refactor
      // postRefactor();
      "
    `);
  });

  it('writes backend.ts with multiple namespace imports and entries in insertion order', async () => {
    const gen = new BackendGenerator(outputDir, logger);
    gen.addNamespaceImport('storage', './storage/resource');
    gen.addNamespaceImport('auth', './auth/resource');
    gen.addDefineBackendEntry('storage', 'storage', 'storage');
    gen.addDefineBackendEntry('auth', 'auth', 'auth');
    gen.addApplyEscapeHatchesCall({ alias: 'auth', extraArgs: [] });
    gen.addApplyEscapeHatchesCall({ alias: 'storage', extraArgs: ['myTable'] });

    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "import * as storage from './storage/resource';
      import * as auth from './auth/resource';
      import { defineBackend } from '@aws-amplify/backend';
      import { Tags } from 'aws-cdk-lib';

      const backend = defineBackend({
        storage: storage.storage,
        auth: auth.auth,
      });

      export type Backend = typeof backend;

      auth.applyEscapeHatches(backend);
      storage.applyEscapeHatches(backend, myTable);

      export function postRefactor() {
        Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
      }

      // Uncomment after refactor
      // postRefactor();
      "
    `);
  });

  it('writes backend.ts with post-define calls and post-refactor calls', async () => {
    const gen = new BackendGenerator(outputDir, logger);
    gen.addNamespaceImport('data', './data/resource');
    gen.addDefineBackendEntry('data', 'data', 'data');
    gen.addPostDefineBackendCall('myVar', 'data.someValue');
    gen.addPostDefineBackendStatement('data.configure(backend)');
    gen.addPostRefactorCall('data.postRefactor(backend)');

    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "import * as data from './data/resource';
      import { defineBackend } from '@aws-amplify/backend';
      import { Tags } from 'aws-cdk-lib';

      const backend = defineBackend({
        data: data.data,
      });

      export type Backend = typeof backend;

      const myVar = data.someValue;
      data.configure(backend);

      export function postRefactor() {
        data.postRefactor(backend);
        Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
      }

      // Uncomment after refactor
      // postRefactor();
      "
    `);
  });

  it('deduplicates namespace aliases when two resources share a preferred name', async () => {
    const gen = new BackendGenerator(outputDir, logger);

    // Simulate: REST API "mergeStudents" and Lambda function "mergeStudents"
    const apiAlias = gen.reserveAlias('mergeStudents', 'api');
    const fnAlias = gen.reserveAlias('mergeStudents', 'function');

    expect(apiAlias).toBe('mergeStudents');
    expect(fnAlias).toBe('mergeStudentsFunction');
    expect(apiAlias).not.toBe(fnAlias);

    gen.addNamespaceImport(apiAlias, './api/mergeStudents/resource');
    gen.addPostDefineBackendStatement(`${apiAlias}.defineMergeStudentsApi(backend)`);
    gen.addNamespaceImport(fnAlias, './function/mergeStudents/resource');
    gen.addDefineBackendEntry('mergeStudents', fnAlias, 'mergeStudents');

    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'amplify', 'backend.ts'), 'utf-8');
    const importLines = content.split('\n').filter((l) => l.startsWith('import * as mergeStudents '));
    expect(importLines).toHaveLength(1);
  });
});

import { BackendRenderer, BackendRenderOptions } from '../../../../../commands/gen2-migration/generate/amplify/backend.renderer';
import { TS } from '../../../../../commands/gen2-migration/generate/ts';

/** Minimal options object; individual tests override only what they exercise. */
function baseOptions(overrides: Partial<BackendRenderOptions> = {}): BackendRenderOptions {
  return {
    namespaceImports: [{ alias: 'auth', source: './auth/resource' }],
    defineBackendEntries: [{ key: 'auth', alias: 'auth', exportName: 'auth' }],
    postDefineBackendCalls: [],
    postDefineBackendStatements: [],
    postRefactorCalls: [],
    escapeHatchCalls: [],
    ...overrides,
  };
}

function renderBackend(options: BackendRenderOptions): string {
  return TS.printNodes(new BackendRenderer().render(options));
}

describe('BackendRenderer named imports', () => {
  it('emits the aws-iam import when a storage grant contributes it', () => {
    const output = renderBackend(
      baseOptions({
        namedImports: { 'aws-cdk-lib/aws-iam': new Set(['PolicyStatement', 'Effect']) },
      }),
    );

    // The IAM symbols a storage/data function-access grant needs are present,
    // keyed by the exact source s3.generator registers (`aws-cdk-lib/aws-iam`)...
    expect(output).toContain("import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';");
  });

  it('omits the aws-iam import when no named imports are contributed', () => {
    const output = renderBackend(baseOptions({ namedImports: {} }));

    // ...and nothing emits an aws-cdk-lib/aws-iam import when no grants were contributed.
    expect(output).not.toContain('aws-cdk-lib/aws-iam');
  });

  it('merges the always-present Tags into a single aws-cdk-lib import rather than duplicating it', () => {
    // A category contributing another aws-cdk-lib symbol must NOT produce a second
    // `aws-cdk-lib` import line (which would be a duplicate-identifier compile error);
    // Tags is folded into the same deduped/sorted import.
    const output = renderBackend(
      baseOptions({
        namedImports: { 'aws-cdk-lib': new Set(['Duration']) },
      }),
    );

    const cdkImportLines = output.split('\n').filter((line) => line.includes("from 'aws-cdk-lib'"));
    expect(cdkImportLines).toHaveLength(1);
    expect(cdkImportLines[0]).toContain('Duration');
    expect(cdkImportLines[0]).toContain('Tags');
  });

  it('always emits the Tags import even when no named imports are contributed', () => {
    const output = renderBackend(baseOptions({ namedImports: {} }));

    expect(output).toContain("import { Tags } from 'aws-cdk-lib';");
  });
});

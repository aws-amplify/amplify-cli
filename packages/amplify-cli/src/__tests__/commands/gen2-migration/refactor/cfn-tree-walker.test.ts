import { walkCfnTree } from '../../../../commands/gen2-migration/refactor/resolvers/cfn-tree-walker';

describe('walkCfnTree', () => {
  it('returns primitives unchanged', () => {
    expect(walkCfnTree('hello', () => undefined)).toBe('hello');
    expect(walkCfnTree(42, () => undefined)).toBe(42);
    expect(walkCfnTree(null, () => undefined)).toBe(null);
  });

  it('replaces object nodes when visitor returns a value', () => {
    const input = { Ref: 'MyParam' };
    const result = walkCfnTree(input, (node) => {
      if ('Ref' in node && node.Ref === 'MyParam') return 'resolved-value';
      return undefined;
    });
    expect(result).toBe('resolved-value');
  });

  it('recurses into nested objects when visitor returns undefined', () => {
    const input = {
      Properties: {
        BucketName: { Ref: 'BucketParam' },
        Other: 'static',
      },
    };
    const result = walkCfnTree(input, (node) => {
      if ('Ref' in node && node.Ref === 'BucketParam') return 'my-bucket';
      return undefined;
    }) as Record<string, unknown>;

    expect((result.Properties as any).BucketName).toBe('my-bucket');
    expect((result.Properties as any).Other).toBe('static');
  });

  it('recurses into arrays', () => {
    const input = [{ Ref: 'A' }, 'literal', { Ref: 'B' }];
    const result = walkCfnTree(input, (node) => {
      if ('Ref' in node) return `resolved-${node.Ref}`;
      return undefined;
    }) as unknown[];

    expect(result).toEqual(['resolved-A', 'literal', 'resolved-B']);
  });
});

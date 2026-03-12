import { CategoryRefactorer, ResolvedStack } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';

/**
 * Tests for the R6 validateNoResourceRemoval method on CategoryRefactorer.
 * Access via a concrete test subclass since the method is private.
 */

// Minimal concrete subclass to access the private validateNoResourceRemoval
class TestRefactorer extends (CategoryRefactorer as any) {
  constructor() {
    super(null, null, null, 'us-east-1', '123');
  }
  public testValidate(stack: ResolvedStack) {
    return (this as any).validateNoResourceRemoval(stack);
  }
  protected async fetchSourceStackId() {
    return undefined;
  }
  protected async fetchDestStackId() {
    return undefined;
  }
  protected resourceTypes() {
    return [];
  }
  protected buildResourceMappings() {
    return new Map();
  }
  protected resolveSource() {
    return Promise.resolve({} as any);
  }
  protected resolveTarget() {
    return Promise.resolve({} as any);
  }
  protected beforeMovePlan() {
    return { operations: [], postTargetTemplate: {} as any };
  }
  protected async afterMovePlan() {
    return { operations: [] };
  }
}

describe('validateNoResourceRemoval (R6)', () => {
  it('throws when an unconditional resource is removed by resolution', () => {
    const original: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
        MyTable: { Type: 'AWS::DynamoDB::Table', Properties: {} },
      },
      Outputs: {},
    };
    const resolved: CFNTemplate = {
      ...original,
      Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } }, // MyTable removed
    };

    const refactorer = new TestRefactorer();
    expect(() =>
      refactorer.testValidate({
        stackId: 'test-stack',
        originalTemplate: original,
        resolvedTemplate: resolved,
        parameters: [],
        resourcesToMove: new Map(),
      }),
    ).toThrow('would remove 1 resource(s): MyTable');
  });

  it('allows conditional resource removal (condition evaluated to false)', () => {
    const original: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
        ConditionalPolicy: { Type: 'AWS::IAM::Policy', Properties: {}, Condition: 'IsEnabled' },
      },
      Outputs: {},
    };
    const resolved: CFNTemplate = {
      ...original,
      Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } }, // ConditionalPolicy removed
    };

    const refactorer = new TestRefactorer();
    // Should NOT throw — ConditionalPolicy has a Condition, so removal is expected
    expect(() =>
      refactorer.testValidate({
        stackId: 'test-stack',
        originalTemplate: original,
        resolvedTemplate: resolved,
        parameters: [],
        resourcesToMove: new Map(),
      }),
    ).not.toThrow();
  });
});

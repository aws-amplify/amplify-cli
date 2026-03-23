import {
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
  PLACEHOLDER_RESOURCE,
} from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { ResourceMapping } from '@aws-sdk/client-cloudformation';

describe('placeholder constants', () => {
  it('placeholder resource is a WaitConditionHandle', () => {
    expect(PLACEHOLDER_RESOURCE.Type).toBe('AWS::CloudFormation::WaitConditionHandle');
  });

  it('placeholder logical ID is MigrationPlaceholder', () => {
    expect(MIGRATION_PLACEHOLDER_LOGICAL_ID).toBe('MigrationPlaceholder');
  });
});

describe('ResourceMapping shape', () => {
  it('carries source and destination stack + logical ID', () => {
    const mapping: ResourceMapping = {
      Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
      Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool' },
    };
    expect(mapping.Source!.StackName).toBe('gen1-auth');
    expect(mapping.Destination!.LogicalResourceId).toBe('amplifyAuthUserPool');
  });
});

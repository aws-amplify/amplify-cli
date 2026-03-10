import { ChangeAction } from '@aws-sdk/client-cloudformation';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import type { StackDriftNode, CloudFormationDriftResults } from '../../../../commands/drift-detection/detect-stack-drift';
import type { TemplateDriftResults } from '../../../../commands/drift-detection/detect-template-drift';
import type { LocalDriftResults } from '../../../../commands/drift-detection/detect-local-drift';
import { createUnifiedCategoryView } from '../../../../commands/drift-detection/services/drift-formatter';

// Mock chalk to pass through strings without ANSI codes
jest.mock('chalk', () => {
  const passthrough = (s: string) => s;
  const chalkMock: any = passthrough;
  chalkMock.bold = passthrough;
  chalkMock.cyan = Object.assign(passthrough, { bold: passthrough });
  chalkMock.blue = passthrough;
  chalkMock.yellow = passthrough;
  chalkMock.red = passthrough;
  chalkMock.green = passthrough;
  chalkMock.gray = passthrough;
  return { __esModule: true, default: chalkMock };
});

function makeDrift(overrides: Partial<StackResourceDrift> = {}): StackResourceDrift {
  return {
    LogicalResourceId: 'TestResource',
    ResourceType: 'AWS::Lambda::Function',
    PhysicalResourceId: 'arn:aws:lambda:us-east-1:123456789012:function:test-fn',
    StackResourceDriftStatus: 'MODIFIED',
    PropertyDifferences: [],
    ...overrides,
  } as StackResourceDrift;
}

function makeNode(overrides: Partial<StackDriftNode> = {}): StackDriftNode {
  return {
    logicalId: 'testStack',
    category: 'Other',
    drifts: [],
    driftDetectionId: '',
    children: [],
    ...overrides,
  };
}

function makePhase1(overrides: Partial<CloudFormationDriftResults> = {}): CloudFormationDriftResults {
  const defaultRoot = makeNode({ logicalId: 'amplify-test-dev-12345', category: 'Core Infrastructure' });
  return {
    root: defaultRoot,
    totalDrifted: 0,
    skippedStacks: [],
    incomplete: false,
    ...overrides,
  };
}

const emptyPhase2: TemplateDriftResults = { totalDrifted: 0, changes: [], skipped: false };

const emptyPhase3: LocalDriftResults = { totalDrifted: 0, skipped: false };

describe('createUnifiedCategoryView', () => {
  it('returns undefined when no drift detected', () => {
    const phase1 = makePhase1();
    expect(createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3)).toBeUndefined();
  });

  it('shows CloudFormation drift grouped by category with ARN and property diffs', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        children: [
          makeNode({
            logicalId: 'storageTable',
            category: 'Storage',
            driftDetectionId: 'drift-id-storage',
            drifts: [
              makeDrift({
                StackResourceDriftStatus: 'MODIFIED',
                ResourceType: 'AWS::DynamoDB::Table',
                LogicalResourceId: 'MyTable',
                PhysicalResourceId: 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable',
                PropertyDifferences: [
                  {
                    PropertyPath: '/Tags/0/Value',
                    ExpectedValue: 'old-value',
                    ActualValue: 'new-value',
                    DifferenceType: 'NOT_EQUAL',
                  },
                ],
              }),
            ],
          }),
        ],
      }),
    });

    const output = createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3);

    // Category header
    expect(output).toContain('STORAGE');
    // Drift type title
    expect(output).toContain('CloudFormation Drift: Deployed resources do not match templates');
    // Resource with symbol, type, logical ID, and ARN
    expect(output).toContain('~ AWS::DynamoDB::Table  (MyTable)');
    expect(output).toContain('arn:aws:dynamodb:us-east-1:123456789012:table/MyTable');
    // Property diff
    expect(output).toContain('Property: /Tags/0/Value');
    expect(output).toContain('+ "new-value"');
    expect(output).toContain('- "old-value"');
    // Drift detection ID (uses nested stack's ID, not root)
    expect(output).toContain('Drift Id: drift-id-storage');
  });

  it('shows root stack CF drift under Core Infrastructure category', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        driftDetectionId: 'root-drift-id',
        drifts: [
          makeDrift({
            StackResourceDriftStatus: 'MODIFIED',
            ResourceType: 'AWS::IAM::Role',
            LogicalResourceId: 'DeploymentRole',
          }),
        ],
      }),
    });

    const output = createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3);

    expect(output).toContain('CORE INFRASTRUCTURE');
    expect(output).toContain('~ AWS::IAM::Role  (DeploymentRole)');
    // Root stack uses root drift detection ID
    expect(output).toContain('Drift Id: root-drift-id');
  });

  it('shows template drift with changeset changes and changeset ID', () => {
    const phase1 = makePhase1();
    const phase2: TemplateDriftResults = {
      totalDrifted: 2,
      changes: [
        {
          LogicalResourceId: 'apiMyGraphQL',
          ResourceType: 'AWS::CloudFormation::Stack',
          Action: ChangeAction.Modify,
          nestedChanges: [
            { LogicalResourceId: 'Schema', ResourceType: 'AWS::AppSync::GraphQLSchema', Action: ChangeAction.Modify },
            { LogicalResourceId: 'NewResolver', ResourceType: 'AWS::AppSync::Resolver', Action: ChangeAction.Add },
          ],
        },
      ],
      skipped: false,
      changeSetId: 'arn:aws:cloudformation:us-east-1:123:changeSet/drift-detect-123/abc',
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);

    // Category header
    expect(output).toContain('API');
    // Drift type title
    expect(output).toContain('Template Drift: S3 and deployed templates differ');
    // Resources with action symbols
    expect(output).toContain('~ AWS::AppSync::GraphQLSchema  (Schema)');
    expect(output).toContain('+ AWS::AppSync::Resolver  (NewResolver)');
    // Changeset ID
    expect(output).toContain('Changeset Id: arn:aws:cloudformation:us-east-1:123:changeSet/drift-detect-123/abc');
  });

  it('shows template drift for direct resource changes (non-nested)', () => {
    const phase1 = makePhase1();
    const phase2: TemplateDriftResults = {
      totalDrifted: 1,
      changes: [{ LogicalResourceId: 'storageS3Bucket', ResourceType: 'AWS::S3::Bucket', Action: ChangeAction.Remove }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);

    expect(output).toContain('STORAGE');
    expect(output).toContain('- AWS::S3::Bucket  (storageS3Bucket)');
  });

  it('shows local drift with correct message', () => {
    const phase1 = makePhase1();
    const phase3: LocalDriftResults = {
      totalDrifted: 1,
      resourcesToBeUpdated: [{ category: 'auth', resourceName: 'userPoolGroups', service: 'Cognito' }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, emptyPhase2, phase3);

    expect(output).toContain('AUTH');
    expect(output).toContain('Local Drift: Undeployed changes in this category');
  });

  it('groups multiple drift types under the same category', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        driftDetectionId: 'root-id',
        children: [
          makeNode({
            logicalId: 'storageTable',
            category: 'Storage',
            driftDetectionId: 'storage-drift-id',
            drifts: [
              makeDrift({ StackResourceDriftStatus: 'MODIFIED', ResourceType: 'AWS::DynamoDB::Table', LogicalResourceId: 'Table1' }),
            ],
          }),
        ],
      }),
    });
    const phase3: LocalDriftResults = {
      totalDrifted: 1,
      resourcesToBeUpdated: [{ category: 'storage', resourceName: 'myBucket', service: 'S3' }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, emptyPhase2, phase3);

    // Should only show STORAGE header once
    const storageMatches = output!.match(/STORAGE/g);
    expect(storageMatches).toHaveLength(1);

    // Should have both drift types
    expect(output).toContain('CloudFormation Drift');
    expect(output).toContain('Local Drift');
  });

  it('does not show changeset ID when none provided', () => {
    const phase1 = makePhase1();
    const phase2: TemplateDriftResults = {
      totalDrifted: 1,
      changes: [{ LogicalResourceId: 'apiEndpoint', ResourceType: 'AWS::ApiGateway::RestApi', Action: ChangeAction.Modify }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);
    expect(output).not.toContain('Changeset Id');
  });

  it('does not show drift ID when none provided', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        driftDetectionId: '',
        children: [
          makeNode({
            logicalId: 'authPool',
            category: 'Auth',
            driftDetectionId: '',
            drifts: [makeDrift({ StackResourceDriftStatus: 'MODIFIED', LogicalResourceId: 'Pool' })],
          }),
        ],
      }),
    });

    const output = createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3);
    expect(output).not.toContain('Drift Id');
  });
});

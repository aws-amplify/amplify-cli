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

// Mock terminal links to pass through text (strips OSC 8 escapes from snapshots)
jest.mock('../../../../commands/drift-detection/services/terminal-link', () => ({
  terminalLink: (text: string) => text,
}));

function makeDrift(overrides: Partial<StackResourceDrift> = {}): StackResourceDrift {
  return {
    StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/amplify-test-dev/guid',
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
    skippedStacks: [],
    incomplete: false,
    ...overrides,
  };
}

const emptyPhase2: TemplateDriftResults = { changes: [], skipped: false };

const emptyPhase3: LocalDriftResults = { skipped: false };

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
    expect(output).toMatchInlineSnapshot(`
      "
      STORAGE MyTable
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: drift-id-storage

        arn:aws:dynamodb:us-east-1:123456789012:table/MyTable
        ~ AWS::DynamoDB::Table
          Property: /Tags/0/Value
            Deployed:  "new-value"
            Expected:  "old-value"

      "
    `);
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
    expect(output).toMatchInlineSnapshot(`
      "
      CORE INFRASTRUCTURE DeploymentRole
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: root-drift-id

        arn:aws:lambda:us-east-1:123456789012:function:test-fn
        ~ AWS::IAM::Role

      "
    `);
  });

  it('shows template drift with per-resource changeset IDs', () => {
    const phase1 = makePhase1();
    const nestedChangeSetId = 'arn:aws:cloudformation:us-east-1:123:changeSet/nested-api-cs/def';
    const phase2: TemplateDriftResults = {
      changes: [
        {
          LogicalResourceId: 'apiMyGraphQL',
          ResourceType: 'AWS::CloudFormation::Stack',
          Action: ChangeAction.Modify,
          nestedChanges: [
            {
              LogicalResourceId: 'Schema',
              ResourceType: 'AWS::AppSync::GraphQLSchema',
              Action: ChangeAction.Modify,
              ChangeSetId: nestedChangeSetId,
            },
            {
              LogicalResourceId: 'NewResolver',
              ResourceType: 'AWS::AppSync::Resolver',
              Action: ChangeAction.Add,
              ChangeSetId: nestedChangeSetId,
            },
          ],
        },
      ],
      skipped: false,
      changeSetId: 'arn:aws:cloudformation:us-east-1:123:changeSet/drift-detect-123/abc',
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      API Schema
        Template Drift: S3 and deployed templates differ
        Changeset Id: arn:aws:cloudformation:us-east-1:123:changeSet/nested-api-cs/def
        ~ AWS::AppSync::GraphQLSchema

      API NewResolver
        Template Drift: S3 and deployed templates differ
        Changeset Id: arn:aws:cloudformation:us-east-1:123:changeSet/nested-api-cs/def
        + AWS::AppSync::Resolver

      "
    `);
  });

  it('shows template drift for direct resource changes (non-nested)', () => {
    const phase1 = makePhase1();
    const phase2: TemplateDriftResults = {
      changes: [{ LogicalResourceId: 'storageS3Bucket', ResourceType: 'AWS::S3::Bucket', Action: ChangeAction.Remove }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      STORAGE storageS3Bucket
        Template Drift: S3 and deployed templates differ
        - AWS::S3::Bucket

      "
    `);
  });

  it('shows local drift with correct message', () => {
    const phase1 = makePhase1();
    const phase3: LocalDriftResults = {
      resourcesToBeUpdated: [{ category: 'auth', resourceName: 'userPoolGroups', service: 'Cognito' }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, emptyPhase2, phase3);
    expect(output).toMatchInlineSnapshot(`
      "
      AUTH
        Local Drift: Undeployed changes in this category

      "
    `);
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
      resourcesToBeUpdated: [{ category: 'storage', resourceName: 'myBucket', service: 'S3' }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, emptyPhase2, phase3);
    expect(output).toMatchInlineSnapshot(`
      "
      STORAGE Table1
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: storage-drift-id

        arn:aws:lambda:us-east-1:123456789012:function:test-fn
        ~ AWS::DynamoDB::Table

      STORAGE
        Local Drift: Undeployed changes in this category

      "
    `);
  });

  it('does not show changeset ID when none provided', () => {
    const phase1 = makePhase1();
    const phase2: TemplateDriftResults = {
      changes: [{ LogicalResourceId: 'apiEndpoint', ResourceType: 'AWS::ApiGateway::RestApi', Action: ChangeAction.Modify }],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      API apiEndpoint
        Template Drift: S3 and deployed templates differ
        ~ AWS::ApiGateway::RestApi

      "
    `);
  });

  it('shows DELETED CF drift with minus symbol', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        children: [
          makeNode({
            logicalId: 'funcStack',
            category: 'Function',
            driftDetectionId: 'func-drift-id',
            drifts: [
              makeDrift({
                StackResourceDriftStatus: 'DELETED',
                ResourceType: 'AWS::Lambda::Function',
                LogicalResourceId: 'MyFunction',
              }),
            ],
          }),
        ],
      }),
    });

    const output = createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      FUNCTION MyFunction
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: func-drift-id

        arn:aws:lambda:us-east-1:123456789012:function:test-fn
        - AWS::Lambda::Function

      "
    `);
  });

  it('renders separate blocks for multiple CF drifts in same category', () => {
    const phase1 = makePhase1({
      root: makeNode({
        logicalId: 'amplify-test-dev-12345',
        category: 'Core Infrastructure',
        children: [
          makeNode({
            logicalId: 'storageStack',
            category: 'Storage',
            driftDetectionId: 'storage-drift-id',
            drifts: [
              makeDrift({
                StackResourceDriftStatus: 'MODIFIED',
                ResourceType: 'AWS::DynamoDB::Table',
                LogicalResourceId: 'Table1',
              }),
              makeDrift({
                StackResourceDriftStatus: 'MODIFIED',
                ResourceType: 'AWS::S3::Bucket',
                LogicalResourceId: 'Bucket1',
                PhysicalResourceId: 'arn:aws:s3:::my-bucket',
              }),
            ],
          }),
        ],
      }),
    });

    const output = createUnifiedCategoryView(phase1, emptyPhase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      STORAGE Table1
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: storage-drift-id

        arn:aws:lambda:us-east-1:123456789012:function:test-fn
        ~ AWS::DynamoDB::Table

      STORAGE Bucket1
        CloudFormation Drift: Deployed resources do not match templates
        Drift Id: storage-drift-id

        arn:aws:s3:::my-bucket
        ~ AWS::S3::Bucket

      "
    `);
  });

  it('flattens deeply nested template changes (3+ levels) to leaf resources', () => {
    const phase1 = makePhase1();
    const deepChangeSetId = 'arn:aws:cloudformation:us-east-1:123:changeSet/deep-cs/ghi';
    const phase2: TemplateDriftResults = {
      changes: [
        {
          LogicalResourceId: 'apiMyGraphQL',
          ResourceType: 'AWS::CloudFormation::Stack',
          Action: ChangeAction.Modify,
          nestedChanges: [
            {
              LogicalResourceId: 'apiMyGraphQLGraphQLAPI',
              ResourceType: 'AWS::CloudFormation::Stack',
              Action: ChangeAction.Modify,
              ChangeSetId: deepChangeSetId,
              nestedChanges: [
                {
                  LogicalResourceId: 'Schema',
                  ResourceType: 'AWS::AppSync::GraphQLSchema',
                  Action: ChangeAction.Modify,
                  ChangeSetId: deepChangeSetId,
                },
              ],
            },
          ],
        },
      ],
      skipped: false,
    };

    const output = createUnifiedCategoryView(phase1, phase2, emptyPhase3);
    expect(output).toMatchInlineSnapshot(`
      "
      API Schema
        Template Drift: S3 and deployed templates differ
        Changeset Id: arn:aws:cloudformation:us-east-1:123:changeSet/deep-cs/ghi
        ~ AWS::AppSync::GraphQLSchema

      "
    `);
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
    expect(output).toMatchInlineSnapshot(`
      "
      AUTH Pool
        CloudFormation Drift: Deployed resources do not match templates

        arn:aws:lambda:us-east-1:123456789012:function:test-fn
        ~ AWS::Lambda::Function

      "
    `);
  });
});

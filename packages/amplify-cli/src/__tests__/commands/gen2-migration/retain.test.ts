import { AmplifyMigrationRetainStep } from '../../../commands/gen2-migration/retain';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import {
  ExecuteChangeSetCommand,
  DescribeStacksCommand,
  DescribeChangeSetCommand,
  GetTemplateCommand,
} from '@aws-sdk/client-cloudformation';
import { SpinningLogger } from '../../../commands/gen2-migration/_common/spinning-logger';
import { Gen1App } from '../../../commands/gen2-migration/_common/gen1-app';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_common/validations';

jest.mock('@aws-sdk/client-cloudformation', () => ({
  ...jest.requireActual('@aws-sdk/client-cloudformation'),
  waitUntilChangeSetCreateComplete: jest.fn().mockResolvedValue({}),
  waitUntilStackUpdateComplete: jest.fn().mockResolvedValue({}),
  paginateListStackResources: jest.fn(),
}));

jest.mock('@aws-amplify/amplify-prompts', () => ({
  printer: { info: jest.fn(), blankLine: jest.fn(), success: jest.fn(), warn: jest.fn(), debug: jest.fn() },
  AmplifySpinner: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    resetMessage: jest.fn(),
  })),
  isDebug: false,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { paginateListStackResources } = require('@aws-sdk/client-cloudformation');

/**
 * Build a simple async iterator from a map of stackId → child stack ids.
 *
 * `paginateListStackResources` is called in `walkStackHierarchy` to find
 * `AWS::CloudFormation::Stack` entries. Only `ResourceType` and
 * `PhysicalResourceId` are inspected, so the test shape can be tiny.
 */
function mockStackHierarchy(hierarchy: Record<string, string[]>) {
  (paginateListStackResources as jest.Mock).mockImplementation((_client: unknown, input: { StackName: string }) => ({
    [Symbol.asyncIterator]: async function* () {
      const children = hierarchy[input.StackName] ?? [];
      yield {
        StackResourceSummaries: children.map((id) => ({
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: id,
        })),
      };
    },
  }));
}

describe('AmplifyMigrationRetainStep', () => {
  let retainStep: AmplifyMigrationRetainStep;
  let mockCfnSend: jest.Mock;
  let mockLogger: SpinningLogger;

  const plainTemplate = {
    Resources: {
      Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
    },
  };
  const retainedTemplate = {
    Resources: {
      Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {},
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      },
    },
  };

  beforeEach(() => {
    mockCfnSend = jest.fn();
    mockLogger = new SpinningLogger('mock');
    jest.spyOn(mockLogger, 'info').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'start').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'succeed').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'push').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'pop').mockImplementation(() => {});
    retainStep = new AmplifyMigrationRetainStep(
      mockLogger,
      {
        appId: 'test-app-id',
        appName: 'testApp',
        rootStackName: 'test-root-stack',
        region: 'us-east-1',
        envName: 'testEnv',
        discover: () => [],
        resourceMetaOutput: () => undefined,
        clients: {
          cloudFormation: { send: mockCfnSend },
          amplify: { send: jest.fn() },
          appSync: { send: jest.fn() },
          dynamoDB: { send: jest.fn() },
          s3: { send: jest.fn(), config: { region: () => 'us-east-1' } },
        },
        deploymentBucket: 'test-deployment-bucket',
      } as unknown as Gen1App,
      {} as $TSContext,
      {} as unknown as AmplifyGen2MigrationValidations,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('walkStackHierarchy', () => {
    it('returns zero operations when root has no children', async () => {
      mockStackHierarchy({ 'test-root-stack': [] });

      const plan = await retainStep.forward();
      await plan.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 0 stacks below root');
      // No fetchTemplate calls — zero operations.
      expect(mockCfnSend).not.toHaveBeenCalled();
    });

    it('walks pre-order, excludes root, includes every intermediate and leaf below', async () => {
      mockStackHierarchy({
        'test-root-stack': ['api-stack', 'auth-stack'],
        'api-stack': ['model-Board', 'model-Todo'],
        'auth-stack': [],
        'model-Board': [],
        'model-Todo': [],
      });
      // Provide retained templates so each operation short-circuits at needsChange.
      // 4 stacks below root = 4 GetTemplate calls.
      for (let i = 0; i < 4; i++) {
        mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(retainedTemplate) });
      }

      const plan = await retainStep.forward();
      await plan.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 4 stacks below root');
      const getTemplateCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof GetTemplateCommand);
      expect(getTemplateCalls).toHaveLength(4);
    });

    it('recurses to arbitrary depth and fetches templates in pre-order (3-layer hierarchy)', async () => {
      // 3-layer hierarchy:
      //   root
      //   └── api-stack
      //       └── model-Todo
      //           └── CustomResourcesjson
      mockStackHierarchy({
        'test-root-stack': ['api-stack'],
        'api-stack': ['model-Todo'],
        'model-Todo': ['CustomResourcesjson'],
        CustomResourcesjson: [],
      });
      for (let i = 0; i < 3; i++) {
        mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(retainedTemplate) });
      }

      const plan = await retainStep.forward();
      await plan.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 3 stacks below root');
      const getTemplateCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof GetTemplateCommand);
      // Pre-order: api-stack → model-Todo → CustomResourcesjson (no root)
      expect(getTemplateCalls.map((c) => (c[0] as GetTemplateCommand).input.StackName)).toEqual([
        'api-stack',
        'model-Todo',
        'CustomResourcesjson',
      ]);
    });
  });

  describe('buildRetainOperation (lazy execute)', () => {
    it('skips changeset creation when all resources (except AWS::CloudFormation::Stack) are already retained', async () => {
      mockStackHierarchy({ 'test-root-stack': ['child-stack'], 'child-stack': [] });
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(retainedTemplate) });

      const plan = await retainStep.forward();
      await plan.execute();

      // Exactly one GetTemplate call. No DescribeStacks/CreateChangeSet/ExecuteChangeSet.
      expect(mockCfnSend).toHaveBeenCalledTimes(1);
    });

    it('skips changeset creation when the stack has no resources other than AWS::CloudFormation::Stack', async () => {
      mockStackHierarchy({ 'test-root-stack': ['child-stack'], 'child-stack': [] });
      // Template contains only an AWS::CloudFormation::Stack resource → nothing to retain.
      const wrapperOnlyTemplate = {
        Resources: {
          Nested: {
            Type: 'AWS::CloudFormation::Stack',
            Properties: { TemplateURL: 'https://example' },
          },
        },
      };
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(wrapperOnlyTemplate) });

      const plan = await retainStep.forward();
      await plan.execute();

      expect(mockCfnSend).toHaveBeenCalledTimes(1);
    });

    it('creates and executes a changeset when resources need retain', async () => {
      mockStackHierarchy({ 'test-root-stack': ['child-stack'], 'child-stack': [] });
      // GetTemplate
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(plainTemplate) });
      // DescribeStacks for parameters
      mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: [{ ParameterKey: 'env', ParameterValue: 'testEnv' }] }] });
      // CreateChangeSet
      mockCfnSend.mockResolvedValueOnce({});
      // DescribeChangeSet — only retain edits
      mockCfnSend.mockResolvedValueOnce({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Details: [
                { Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } },
                { Target: { Attribute: 'UpdateReplacePolicy', AfterValue: 'Retain' } },
              ],
            },
          },
        ],
      });
      // ExecuteChangeSet
      mockCfnSend.mockResolvedValueOnce({});

      const plan = await retainStep.forward();
      await plan.execute();

      const executeCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executeCalls).toHaveLength(1);
      const describeStacksCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof DescribeStacksCommand);
      expect(describeStacksCalls).toHaveLength(1);
      const describeChangeSetCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof DescribeChangeSetCommand);
      expect(describeChangeSetCalls).toHaveLength(1);
    });

    it('treats empty changeset (no changes detected by CFN) as a no-op', async () => {
      mockStackHierarchy({ 'test-root-stack': ['child-stack'], 'child-stack': [] });
      // GetTemplate
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(plainTemplate) });
      // DescribeStacks for parameters
      mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: [] }] });
      // Cfn.createChangeSet reaches the "didn't contain changes" catch when
      // waitUntilChangeSetCreateComplete throws with that message.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cfnModule = require('@aws-sdk/client-cloudformation');
      (cfnModule.waitUntilChangeSetCreateComplete as jest.Mock).mockRejectedValueOnce(
        new Error(`Waiter ChangeSetCreateComplete failed: The submitted information didn't contain changes.`),
      );
      // CreateChangeSet + DeleteChangeSet (cleanup on the no-changes path)
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});

      const plan = await retainStep.forward();
      await plan.execute();

      const executeCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executeCalls).toHaveLength(0);
    });
  });

  describe('isAllowedRetainChangeset (called from execute)', () => {
    /**
     * Runs one leaf-stack operation against a given DescribeChangeSet
     * response and returns true if executeChangeSet was called, false if
     * the execute throw'd before that point.
     */
    async function executeWithChangeset(changeset: unknown): Promise<{ executed: boolean; error?: unknown }> {
      mockStackHierarchy({ 'test-root-stack': ['child-stack'], 'child-stack': [] });
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(plainTemplate) });
      mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: [] }] });
      mockCfnSend.mockResolvedValueOnce({}); // CreateChangeSet
      mockCfnSend.mockResolvedValueOnce(changeset); // DescribeChangeSet
      mockCfnSend.mockResolvedValueOnce({}); // ExecuteChangeSet (only reached if validator passes)

      const plan = await retainStep.forward();
      try {
        await plan.execute();
      } catch (e) {
        return { executed: false, error: e };
      }
      const executed = mockCfnSend.mock.calls.some(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      return { executed };
    }

    it('accepts a changeset with only retain edits', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Details: [
                { Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } },
                { Target: { Attribute: 'UpdateReplacePolicy', AfterValue: 'Retain' } },
              ],
            },
          },
        ],
      });
      expect(result.executed).toBe(true);
    });

    it('accepts a nested-stack Dynamic/Automatic re-evaluation alongside retain edits', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
            },
          },
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'NestedChild',
              Details: [
                {
                  Target: { Attribute: 'Properties', RequiresRecreation: 'Never' },
                  Evaluation: 'Dynamic',
                  ChangeSource: 'Automatic',
                },
              ],
            },
          },
        ],
      });
      expect(result.executed).toBe(true);
    });

    it('rejects a changeset that touches Properties on a resource other than AWS::CloudFormation::Stack', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Details: [
                { Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } },
                { Target: { Attribute: 'Properties', Name: 'VersioningConfiguration', AfterValue: 'Enabled' } },
              ],
            },
          },
        ],
      });
      expect(result.executed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects an Add action', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'NewBucket',
            },
          },
        ],
      });
      expect(result.executed).toBe(false);
    });

    it('rejects a changeset with Replacement=True', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Replacement: 'True',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
            },
          },
        ],
      });
      expect(result.executed).toBe(false);
    });

    it('rejects retain edits targeting a non-Retain AfterValue', async () => {
      const result = await executeWithChangeset({
        StackName: 'child-stack',
        ChangeSetName: 'cs',
        Changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Delete' } }],
            },
          },
        ],
      });
      expect(result.executed).toBe(false);
    });
  });
});

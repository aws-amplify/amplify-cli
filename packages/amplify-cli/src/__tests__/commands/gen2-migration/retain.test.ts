import {
  CreateChangeSetCommand,
  DescribeChangeSetOutput,
  ExecuteChangeSetCommand,
  SetStackPolicyCommand,
} from '@aws-sdk/client-cloudformation';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationRetainStep } from '../../../commands/gen2-migration/retain';
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
const { paginateListStackResources, waitUntilChangeSetCreateComplete } = require('@aws-sdk/client-cloudformation');

function pages(...resourceArrays: Array<Array<{ ResourceType?: string; PhysicalResourceId?: string }>>) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const resources of resourceArrays) {
        yield { StackResourceSummaries: resources };
      }
    },
  };
}

const stackResource = (id: string) => ({
  ResourceType: 'AWS::CloudFormation::Stack',
  PhysicalResourceId: id,
});

const retainDetails = (attribute: 'DeletionPolicy' | 'UpdateReplacePolicy' = 'DeletionPolicy') => [
  { Target: { Attribute: attribute, AfterValue: 'Retain' } },
];

function mockExecutionForStack(
  mockCfnSend: jest.Mock,
  options: {
    template?: Record<string, unknown>;
    parameters?: Array<{ ParameterKey?: string; ParameterValue?: string }>;
    changes?: DescribeChangeSetOutput['Changes'];
    noChanges?: boolean;
  },
): void {
  // GetTemplate
  mockCfnSend.mockResolvedValueOnce({
    TemplateBody: JSON.stringify(options.template ?? { Resources: { X: { Type: 'AWS::S3::Bucket', Properties: {} } } }),
  });
  // DescribeStacks
  mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: options.parameters ?? [] }] });
  // CreateChangeSet
  mockCfnSend.mockResolvedValueOnce({});
  if (options.noChanges) {
    (waitUntilChangeSetCreateComplete as jest.Mock).mockRejectedValueOnce(new Error("The submitted information didn't contain changes"));
    // DeleteChangeSet
    mockCfnSend.mockResolvedValueOnce({});
  } else {
    // DescribeChangeSet
    mockCfnSend.mockResolvedValueOnce({
      StackName: 'stack',
      ChangeSetName: 'cs',
      ChangeSetId: 'arn:aws:cloudformation:us-east-1:123:changeSet/gen2-migration-1/abc',
      StackId: 'arn:aws:cloudformation:us-east-1:123:stack/root-stack/def',
      Changes: options.changes ?? [{ ResourceChange: { Action: 'Modify', Details: retainDetails() } }],
    });
    // ExecuteChangeSet
    mockCfnSend.mockResolvedValueOnce({});
  }
}

describe('AmplifyMigrationRetainStep', () => {
  let step: AmplifyMigrationRetainStep;
  let mockCfnSend: jest.Mock;
  let mockLogger: SpinningLogger;

  beforeEach(() => {
    mockCfnSend = jest.fn();
    mockLogger = new SpinningLogger('mock');
    jest.spyOn(mockLogger, 'info').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'start').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'succeed').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'push').mockImplementation(() => {});
    jest.spyOn(mockLogger, 'pop').mockImplementation(() => {});
    step = new AmplifyMigrationRetainStep(
      mockLogger,
      {
        rootStackName: 'root-stack',
        clients: { cloudFormation: { send: mockCfnSend } },
      } as unknown as Gen1App,
      {} as $TSContext,
      {} as AmplifyGen2MigrationValidations,
    );
    (paginateListStackResources as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('executes a retain change set for the root stack when there are no nested stacks', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      // SetStackPolicy (unlock op)
      mockCfnSend.mockResolvedValueOnce({});
      mockExecutionForStack(mockCfnSend, {});

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(1);
    });

    it('executes a retain change set for every stack in the hierarchy, root first', async () => {
      // root
      // ├── api-stack
      // │   ├── ModelA
      // │   └── ModelB
      // └── aux
      (paginateListStackResources as jest.Mock)
        .mockReturnValueOnce(pages([stackResource('api-stack'), stackResource('aux')]))
        .mockReturnValueOnce(pages([stackResource('ModelA'), stackResource('ModelB')]))
        .mockReturnValueOnce(pages([])) // ModelA leaf
        .mockReturnValueOnce(pages([])) // ModelB leaf
        .mockReturnValueOnce(pages([])); // aux leaf

      // SetStackPolicy (unlock op)
      mockCfnSend.mockResolvedValueOnce({});
      for (let i = 0; i < 5; i++) mockExecutionForStack(mockCfnSend, {});

      const plan = await step.forward();
      await plan.execute();

      const createOrder = mockCfnSend.mock.calls
        .filter(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand)
        .map(([cmd]) => (cmd as CreateChangeSetCommand).input.StackName);

      expect(createOrder).toEqual(['root-stack', 'api-stack', 'ModelA', 'ModelB', 'aux']);

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(5);
    });

    it('submits a template with retain policies on every existing resource', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, {
        template: {
          Resources: {
            Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
            Table: { Type: 'AWS::DynamoDB::Table', Properties: {} },
          },
        },
      });

      const plan = await step.forward();
      await plan.execute();

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();
      const submitted = JSON.parse(createCall![0].input.TemplateBody);

      expect(submitted.Resources.Bucket.DeletionPolicy).toBe('Retain');
      expect(submitted.Resources.Bucket.UpdateReplacePolicy).toBe('Retain');
      expect(submitted.Resources.Table.DeletionPolicy).toBe('Retain');
      expect(submitted.Resources.Table.UpdateReplacePolicy).toBe('Retain');
    });

    it('does not apply retain to AWS::CloudFormation::Stack resources', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, {
        template: {
          Resources: {
            Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
            NestedAuth: { Type: 'AWS::CloudFormation::Stack', Properties: { TemplateURL: 'https://s3/x.yaml' } },
          },
        },
      });

      const plan = await step.forward();
      await plan.execute();

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();
      const submitted = JSON.parse(createCall![0].input.TemplateBody);

      expect(submitted.Resources.Bucket.DeletionPolicy).toBe('Retain');
      expect(submitted.Resources.Bucket.UpdateReplacePolicy).toBe('Retain');
      expect(submitted.Resources.NestedAuth.DeletionPolicy).toBeUndefined();
      expect(submitted.Resources.NestedAuth.UpdateReplacePolicy).toBeUndefined();
    });

    it('forwards existing parameters to CreateChangeSet as UsePreviousValue', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, {
        parameters: [
          { ParameterKey: 'env', ParameterValue: 'dev' },
          { ParameterKey: 'appId', ParameterValue: 'abc' },
        ],
      });

      const plan = await step.forward();
      await plan.execute();

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();
      expect(createCall![0].input.Parameters).toEqual([
        { ParameterKey: 'env', UsePreviousValue: true },
        { ParameterKey: 'appId', UsePreviousValue: true },
      ]);
    });

    it('skips ExecuteChangeSet when the changeset reports no changes', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, { noChanges: true });

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(0);
    });

    it('overwrites the root stack policy with a permissive one before retain operations', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, {});

      const plan = await step.forward();
      await plan.execute();

      const setPolicyCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof SetStackPolicyCommand);
      expect(setPolicyCalls).toHaveLength(1);
      const input = (setPolicyCalls[0][0] as SetStackPolicyCommand).input;
      expect(input.StackName).toBe('root-stack');
      expect(JSON.parse(input.StackPolicyBody!)).toEqual({
        Statement: [{ Effect: 'Allow', Action: 'Update:*', Principal: '*', Resource: '*' }],
      });
    });
  });

  describe('validation during execute', () => {
    const runWithChanges = async (changes: DescribeChangeSetOutput['Changes']): Promise<Error | undefined> => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockCfnSend.mockResolvedValueOnce({}); // SetStackPolicy
      mockExecutionForStack(mockCfnSend, { changes });

      const plan = await step.forward();
      try {
        await plan.execute();
        return undefined;
      } catch (err) {
        return err as Error;
      }
    };

    it('accepts a changeset with only retain-policy modifications', async () => {
      const err = await runWithChanges([
        { ResourceChange: { Action: 'Modify', Details: retainDetails('DeletionPolicy') } },
        { ResourceChange: { Action: 'Modify', Details: retainDetails('UpdateReplacePolicy') } },
      ]);
      expect(err).toBeUndefined();
    });

    it('rejects a changeset that uses Add', async () => {
      const err = await runWithChanges([
        { ResourceChange: { Action: 'Add', LogicalResourceId: 'SomeResource' } },
        { ResourceChange: { Action: 'Modify', Details: retainDetails() } },
      ]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });

    it('rejects a changeset that uses Remove', async () => {
      const err = await runWithChanges([{ ResourceChange: { Action: 'Remove', Details: retainDetails() } }]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });

    it('rejects a changeset where a Modify would replace the resource', async () => {
      const err = await runWithChanges([{ ResourceChange: { Action: 'Modify', Replacement: 'True', Details: retainDetails() } }]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });

    it('rejects a changeset where a Modify has no Details', async () => {
      const err = await runWithChanges([{ ResourceChange: { Action: 'Modify', Details: [] } }]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });

    it('rejects a changeset targeting an attribute other than DeletionPolicy or UpdateReplacePolicy', async () => {
      const err = await runWithChanges([
        {
          ResourceChange: {
            Action: 'Modify',
            Details: [{ Target: { Attribute: 'Properties', AfterValue: 'whatever' } }],
          },
        },
      ]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });

    it('rejects a changeset where DeletionPolicy is being set to a value other than Retain', async () => {
      const err = await runWithChanges([
        {
          ResourceChange: {
            Action: 'Modify',
            Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Delete' } }],
          },
        },
      ]);
      expect(err?.message).toMatch(/Retain changeset for root-stack contains unexpected changes/);
    });
  });

  describe('rollback', () => {
    it('throws NotImplementedFault', () => {
      expect(() => step.rollback()).toThrow('Rollback is not supported for the retain step');
    });
  });
});

import { CreateChangeSetCommand, DescribeChangeSetOutput, ExecuteChangeSetCommand } from '@aws-sdk/client-cloudformation';
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

/** Builds an async iterable of paginator-shaped pages from a list of resource arrays. */
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

/** Stubs the per-stack planning calls sent through `Cfn`: GetTemplate, DescribeStacks, CreateChangeSet, DescribeChangeSet. */
function mockPlanningForStack(
  mockCfnSend: jest.Mock,
  options: {
    template?: Record<string, unknown>;
    parameters?: Array<{ ParameterKey?: string; ParameterValue?: string }>;
    changes?: DescribeChangeSetOutput['Changes'];
    noChanges?: boolean;
  },
): void {
  mockCfnSend.mockResolvedValueOnce({
    TemplateBody: JSON.stringify(options.template ?? { Resources: { X: { Type: 'AWS::S3::Bucket', Properties: {} } } }),
  });
  mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: options.parameters ?? [] }] });
  mockCfnSend.mockResolvedValueOnce({});
  if (options.noChanges) {
    (waitUntilChangeSetCreateComplete as jest.Mock).mockRejectedValueOnce(new Error("The submitted information didn't contain changes"));
    mockCfnSend.mockResolvedValueOnce({});
  } else {
    mockCfnSend.mockResolvedValueOnce({
      StackName: 'stack',
      ChangeSetName: 'cs',
      Changes: options.changes ?? [{ ResourceChange: { Action: 'Modify', Details: retainDetails() } }],
    });
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

  describe('forward', () => {
    it('executes a retain change set for the root stack when there are no nested stacks', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {});
      mockCfnSend.mockResolvedValueOnce({}); // ExecuteChangeSetCommand

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(1);
    });

    it('executes a retain change set for every stack in the hierarchy, leaves first', async () => {
      // root -> A, B
      // A    -> A1
      (paginateListStackResources as jest.Mock)
        .mockReturnValueOnce(pages([stackResource('A'), stackResource('B')]))
        .mockReturnValueOnce(pages([stackResource('A1')]))
        .mockReturnValueOnce(pages([])) // A1 leaf
        .mockReturnValueOnce(pages([])); // B leaf

      // Planning calls fire in leaf-first order: A1, A, B, root.
      mockPlanningForStack(mockCfnSend, {});
      mockPlanningForStack(mockCfnSend, {});
      mockPlanningForStack(mockCfnSend, {});
      mockPlanningForStack(mockCfnSend, {});

      // Four ExecuteChangeSet responses.
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});
      mockCfnSend.mockResolvedValueOnce({});

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(4);
    });

    it('submits a template with DeletionPolicy and UpdateReplacePolicy set to Retain on every resource', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        template: {
          Resources: {
            Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
            Table: { Type: 'AWS::DynamoDB::Table', Properties: {} },
          },
        },
      });

      const plan = await step.forward();
      await plan.validate();

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();
      const submitted = JSON.parse(createCall![0].input.TemplateBody);
      expect(submitted.Resources.Bucket.DeletionPolicy).toBe('Retain');
      expect(submitted.Resources.Bucket.UpdateReplacePolicy).toBe('Retain');
      expect(submitted.Resources.Table.DeletionPolicy).toBe('Retain');
      expect(submitted.Resources.Table.UpdateReplacePolicy).toBe('Retain');
    });

    it('forwards existing parameters to CreateChangeSet as UsePreviousValue', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        parameters: [
          { ParameterKey: 'env', ParameterValue: 'dev' },
          { ParameterKey: 'appId', ParameterValue: 'abc' },
        ],
      });

      await step.forward();

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();
      expect(createCall![0].input.Parameters).toEqual([
        { ParameterKey: 'env', UsePreviousValue: true },
        { ParameterKey: 'appId', UsePreviousValue: true },
      ]);
    });

    it('skips ExecuteChangeSet when the stack is already fully retained', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, { noChanges: true });

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(0);
    });
  });

  describe('forward validate', () => {
    it('passes validation when every change sets DeletionPolicy or UpdateReplacePolicy to Retain', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [
          { ResourceChange: { Action: 'Modify', Details: retainDetails('DeletionPolicy') } },
          { ResourceChange: { Action: 'Modify', Details: retainDetails('UpdateReplacePolicy') } },
        ],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('fails validation when a change uses a non-Modify action', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [{ ResourceChange: { Action: 'Add', Details: retainDetails() } }],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('fails validation when a Modify would replace the resource', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [{ ResourceChange: { Action: 'Modify', Replacement: 'True', Details: retainDetails() } }],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('fails validation when a Modify has no Details', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [{ ResourceChange: { Action: 'Modify', Details: [] } }],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('fails validation when a detail targets an attribute other than DeletionPolicy or UpdateReplacePolicy', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              Details: [{ Target: { Attribute: 'Properties', AfterValue: 'whatever' } }],
            },
          },
        ],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('fails validation when DeletionPolicy is being set to a value other than Retain', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Delete' } }],
            },
          },
        ],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });
  });

  describe('rollback', () => {
    it('throws NotImplementedFault', () => {
      expect(() => step.rollback()).toThrow('Rollback is not supported for the retain step');
    });
  });
});

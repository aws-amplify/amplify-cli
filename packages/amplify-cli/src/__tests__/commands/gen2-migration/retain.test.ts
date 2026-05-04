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

function mockPlanningForStack(
  mockCfnSend: jest.Mock,
  options: {
    template?: Record<string, unknown>;
    parameters?: Array<{ ParameterKey?: string; ParameterValue?: string }>;
    changes?: DescribeChangeSetOutput['Changes'];
    noChanges?: boolean;
    changeSetId?: string;
    stackId?: string;
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
      ChangeSetId: options.changeSetId ?? 'arn:aws:cloudformation:us-east-1:123:changeSet/gen2-migration-1/abc',
      StackId: options.stackId ?? 'arn:aws:cloudformation:us-east-1:123:stack/root-stack/def',
      Changes: options.changes ?? [
        { ResourceChange: { Action: 'Add', LogicalResourceId: 'AmplifyRetainMarker' } },
        { ResourceChange: { Action: 'Modify', Details: retainDetails() } },
      ],
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
      mockCfnSend.mockResolvedValueOnce({});

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

      for (let i = 0; i < 5; i++) mockPlanningForStack(mockCfnSend, {});
      for (let i = 0; i < 5; i++) mockCfnSend.mockResolvedValueOnce({});

      // Each CreateChangeSet carries the StackName it targeted — capture that order
      // to verify the root comes before any descendant, and each intermediate comes
      // before its own children.
      const plan = await step.forward();
      await plan.execute();

      const createOrder = mockCfnSend.mock.calls
        .filter(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand)
        .map(([cmd]) => (cmd as CreateChangeSetCommand).input.StackName);

      expect(createOrder).toEqual(['root-stack', 'api-stack', 'ModelA', 'ModelB', 'aux']);

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(5);
    });

    it('submits a template with retain policies on every existing resource plus an AmplifyRetainMarker', async () => {
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

      expect(submitted.Resources.AmplifyRetainMarker).toEqual({
        Type: 'AWS::CloudFormation::WaitConditionHandle',
        Properties: {},
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      });
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

    it('skips ExecuteChangeSet when the changeset reports no changes', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, { noChanges: true });

      const plan = await step.forward();
      await plan.execute();

      const executes = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executes).toHaveLength(0);
    });
  });

  describe('forward describe', () => {
    it('renders stack name, a blank line, and a dimmed Changeset URL line for each pending stack', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {});

      const plan = await step.forward();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { printer } = require('@aws-amplify/amplify-prompts');
      await plan.describe();

      const printed = (printer.info as jest.Mock).mock.calls.map(([line]) => line as string);
      const numbered = printed.find((line) => line.startsWith('1. Apply DeletionPolicy'));

      expect(numbered).toMatch(
        /^1\. Apply DeletionPolicy and UpdateReplacePolicy: Retain to resources in root-stack\n\n {3}Changeset URL: https:\/\/[^\n]+\n?$/,
      );
    });
  });

  describe('forward validate', () => {
    it('passes validation when changes are only retain-policy modifications plus the marker Add', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [
          { ResourceChange: { Action: 'Add', LogicalResourceId: 'AmplifyRetainMarker' } },
          { ResourceChange: { Action: 'Modify', Details: retainDetails('DeletionPolicy') } },
          { ResourceChange: { Action: 'Modify', Details: retainDetails('UpdateReplacePolicy') } },
        ],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(true);
    });

    it('fails validation when an Add change targets a resource other than the marker', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [
          { ResourceChange: { Action: 'Add', LogicalResourceId: 'SomeOtherResource' } },
          { ResourceChange: { Action: 'Modify', Details: retainDetails() } },
        ],
      });

      const plan = await step.forward();
      const valid = await plan.validate();

      expect(valid).toBe(false);
    });

    it('fails validation when a change uses Remove or other non-Modify action', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {
        changes: [{ ResourceChange: { Action: 'Remove', Details: retainDetails() } }],
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

    it('uses the "Ensure retain-only changes" description', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));
      mockPlanningForStack(mockCfnSend, {});

      const plan = await step.forward();
      await plan.validate();

      expect(mockLogger.push).toHaveBeenCalledWith('Ensure retain-only changes for root-stack');
    });
  });

  describe('rollback', () => {
    it('throws NotImplementedFault', () => {
      expect(() => step.rollback()).toThrow('Rollback is not supported for the retain step');
    });
  });
});

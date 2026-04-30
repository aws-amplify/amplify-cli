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

  describe('walkStackHierarchy', () => {
    it('returns just the root when the stack has no nested children', async () => {
      (paginateListStackResources as jest.Mock).mockReturnValueOnce(pages([]));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (step as any).walkStackHierarchy('root-stack');

      expect(result).toEqual(['root-stack']);
    });

    it('returns a leaf-first ordering for a nested tree', async () => {
      // root -> A, B
      // A    -> A1, A2
      // B    -> (no children)
      (paginateListStackResources as jest.Mock)
        .mockReturnValueOnce(pages([stackResource('A'), stackResource('B')]))
        .mockReturnValueOnce(pages([stackResource('A1'), stackResource('A2')]))
        .mockReturnValueOnce(pages([])) // A1
        .mockReturnValueOnce(pages([])) // A2
        .mockReturnValueOnce(pages([])); // B

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (step as any).walkStackHierarchy('root');

      expect(result).toEqual(['A1', 'A2', 'A', 'B', 'root']);
    });

    it('collects resources across multiple paginator pages', async () => {
      (paginateListStackResources as jest.Mock)
        .mockReturnValueOnce(pages([stackResource('A')], [stackResource('B')]))
        .mockReturnValueOnce(pages([])) // A
        .mockReturnValueOnce(pages([])); // B

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (step as any).walkStackHierarchy('root');

      expect(result).toEqual(['A', 'B', 'root']);
    });
  });

  describe('buildRetainOperation', () => {
    const sampleTemplate = {
      Resources: {
        Bucket: { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'b' } },
        Table: { Type: 'AWS::DynamoDB::Table', Properties: { TableName: 't' } },
      },
    };

    /** Wires a GetTemplate, DescribeStacks, CreateChangeSet and DescribeChangeSet response in order. */
    function setupPlanningMocks(options: {
      changes?: DescribeChangeSetOutput['Changes'];
      parameters?: Array<{ ParameterKey?: string; ParameterValue?: string }>;
    }) {
      mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(sampleTemplate) });
      mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: options.parameters ?? [] }] });
      mockCfnSend.mockResolvedValueOnce({});
      if (options.changes === undefined) {
        // Simulate "no changes": waitUntilChangeSetCreateComplete rejects with the
        // message Cfn.createChangeSet looks for, and DeleteChangeSetCommand runs next.
        (waitUntilChangeSetCreateComplete as jest.Mock).mockRejectedValueOnce(
          new Error("The submitted information didn't contain changes"),
        );
        mockCfnSend.mockResolvedValueOnce({});
      } else {
        mockCfnSend.mockResolvedValueOnce({
          StackName: 'stack-name',
          ChangeSetName: 'cs',
          Changes: options.changes,
        });
      }
    }

    it('mutates the template to apply Retain on every resource and forwards parameters as UsePreviousValue', async () => {
      setupPlanningMocks({
        parameters: [{ ParameterKey: 'env', ParameterValue: 'dev' }],
        changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
            },
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (step as any).buildRetainOperation('arn:aws:cfn:us-east-1:123:stack/my-stack/xyz');

      const createCall = mockCfnSend.mock.calls.find(([cmd]: [unknown]) => cmd instanceof CreateChangeSetCommand);
      expect(createCall).toBeDefined();

      const submittedTemplate = JSON.parse(createCall![0].input.TemplateBody);
      expect(submittedTemplate.Resources.Bucket.DeletionPolicy).toBe('Retain');
      expect(submittedTemplate.Resources.Bucket.UpdateReplacePolicy).toBe('Retain');
      expect(submittedTemplate.Resources.Table.DeletionPolicy).toBe('Retain');
      expect(submittedTemplate.Resources.Table.UpdateReplacePolicy).toBe('Retain');

      expect(createCall![0].input.Parameters).toEqual([{ ParameterKey: 'env', UsePreviousValue: true }]);
    });

    it('returns a no-op operation when createChangeSet indicates no changes', async () => {
      setupPlanningMocks({ changes: undefined });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op = await (step as any).buildRetainOperation('arn:aws:cfn:us-east-1:123:stack/my-stack/xyz');

      expect(await op.describe()).toEqual(['my-stack already retained']);
      expect(op.validate()).toBeUndefined();
      await expect(op.execute()).resolves.toBeUndefined();

      const executeCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executeCalls).toHaveLength(0);
    });

    it('returns a real operation that executes the change set and passes the whitelist', async () => {
      setupPlanningMocks({
        changes: [
          {
            ResourceChange: {
              Action: 'Modify',
              Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
            },
          },
        ],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op = await (step as any).buildRetainOperation('arn:aws:cfn:us-east-1:123:stack/my-stack/xyz');

      expect(await op.describe()).toEqual(['Apply DeletionPolicy: Retain to resources in my-stack']);

      const validation = op.validate();
      expect(validation).toBeDefined();
      const result = await validation!.run();
      expect(result.valid).toBe(true);

      // Execute the change set
      mockCfnSend.mockResolvedValueOnce({}); // ExecuteChangeSetCommand
      await op.execute();

      const executeCalls = mockCfnSend.mock.calls.filter(([cmd]: [unknown]) => cmd instanceof ExecuteChangeSetCommand);
      expect(executeCalls).toHaveLength(1);
    });
  });

  describe('isAllowedRetainChangeset', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const check = (cs: DescribeChangeSetOutput): boolean => (step as any).isAllowedRetainChangeset(cs);

    it('accepts an empty change set', () => {
      expect(check({ Changes: [] })).toBe(true);
    });

    it('accepts changes that only set DeletionPolicy or UpdateReplacePolicy to Retain', () => {
      expect(
        check({
          Changes: [
            {
              ResourceChange: {
                Action: 'Modify',
                Details: [
                  { Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } },
                  { Target: { Attribute: 'UpdateReplacePolicy', AfterValue: 'Retain' } },
                ],
              },
            },
          ],
        }),
      ).toBe(true);
    });

    it('rejects non-Modify actions', () => {
      expect(
        check({
          Changes: [
            {
              ResourceChange: {
                Action: 'Add',
                Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
              },
            },
          ],
        }),
      ).toBe(false);
    });

    it('rejects Modify with Replacement: True', () => {
      expect(
        check({
          Changes: [
            {
              ResourceChange: {
                Action: 'Modify',
                Replacement: 'True',
                Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
              },
            },
          ],
        }),
      ).toBe(false);
    });

    it('rejects Modify with missing or empty Details', () => {
      expect(check({ Changes: [{ ResourceChange: { Action: 'Modify', Details: [] } }] })).toBe(false);
      expect(check({ Changes: [{ ResourceChange: { Action: 'Modify' } }] })).toBe(false);
    });

    it('rejects details with the wrong attribute or AfterValue', () => {
      expect(
        check({
          Changes: [
            {
              ResourceChange: {
                Action: 'Modify',
                Details: [
                  { Target: { Attribute: 'Properties', AfterValue: 'Retain' } },
                  { Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } },
                ],
              },
            },
          ],
        }),
      ).toBe(false);

      expect(
        check({
          Changes: [
            {
              ResourceChange: {
                Action: 'Modify',
                Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Delete' } }],
              },
            },
          ],
        }),
      ).toBe(false);
    });
  });

  describe('forward', () => {
    it('builds one operation per stack in the hierarchy and sets the expected implications', async () => {
      (paginateListStackResources as jest.Mock)
        .mockReturnValueOnce(pages([stackResource('A'), stackResource('B')]))
        .mockReturnValueOnce(pages([])) // A leaf
        .mockReturnValueOnce(pages([])); // B leaf

      const stackTemplate = { Resources: { X: { Type: 'AWS::S3::Bucket', Properties: {} } } };
      // A, B, root each need: GetTemplate + DescribeStacks + CreateChangeSet + DescribeChangeSet
      for (let i = 0; i < 3; i++) {
        mockCfnSend.mockResolvedValueOnce({ TemplateBody: JSON.stringify(stackTemplate) });
        mockCfnSend.mockResolvedValueOnce({ Stacks: [{ Parameters: [] }] });
        mockCfnSend.mockResolvedValueOnce({}); // CreateChangeSet
        mockCfnSend.mockResolvedValueOnce({
          StackName: `stack-${i}`,
          ChangeSetName: 'cs',
          Changes: [
            {
              ResourceChange: {
                Action: 'Modify',
                Details: [{ Target: { Attribute: 'DeletionPolicy', AfterValue: 'Retain' } }],
              },
            },
          ],
        });
      }

      const plan = await step.forward();

      // Plan.operations is private; assert indirectly through a describe pass.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operations = (plan as any).operations as Array<{ describe(): Promise<string[]> }>;
      expect(operations).toHaveLength(3);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const implications = (plan as any).implications as string[];
      expect(implications).toEqual([
        'DeletionPolicy and UpdateReplacePolicy will be set to Retain on every resource in Gen1 CloudFormation stacks',
        'This protects your Gen2 environment from unintended impact caused by changes to Gen1 stacks',
      ]);
    });
  });

  describe('rollback', () => {
    it('throws NotImplementedFault', () => {
      expect(() => step.rollback()).toThrow('Rollback is not supported for the retain step');
    });
  });
});

import { mockClient } from 'aws-sdk-client-mock';
import * as cloudformation from '@aws-sdk/client-cloudformation';
import { MigrationApp } from '../app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';

/**
 * Mock for the AWS CloudFormation service client (`@aws-sdk/client-cloudformation`).
 *
 * This is the most complex mock because CloudFormation is the backbone of Amplify's
 * infrastructure. The migration codegen traverses the stack hierarchy to discover
 * resources, read parameters, and fetch templates. This mock simulates all of that
 * using local template files.
 *
 * Mocks five commands:
 *
 * - `DescribeStackResourcesCommand`: Lists resources in a stack by parsing the
 *   `Resources` section of the corresponding local CloudFormation template.
 *
 * - `DescribeStacksCommand`: Returns stack parameters and outputs for a nested stack.
 *
 * - `GetTemplateCommand`: Returns the raw template body by reading the local
 *   template file identified by `MigrationApp.templatePathForStack()`.
 *
 * - `CreateStackRefactorCommand`: Returns a synthetic refactor ID.
 *
 * - `DescribeStackRefactorCommand`: Returns a completed refactor status.
 *
 * Source files:
 * - CloudFormation templates via `MigrationApp.templatePathForStack()`
 * - `amplify-meta.json`: Resource outputs (via `cfnOutputsForStack()`)
 */
export class CloudFormationMock {
  public readonly mock;

  private readonly _stackNameForResource: Map<string, string> = new Map<string, string>();

  private readonly _describeStackCounter: Map<string, number> = new Map<string, number>();

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cloudformation.CloudFormationClient);
    this.mockDescribeStackResources();
    this.mockDescribeStacks();
    this.mockGetTemplate();
    this.mockCreateStackRefactor();
    this.mockDescribeStackRefactor();
  }

  public stackNameForResource(physicalId: string) {
    const stackName = this._stackNameForResource.get(physicalId);
    if (!stackName) {
      throw new Error(`Unable to find stack name for resource: ${physicalId}`);
    }
    return stackName;
  }

  /**
   * Pre-registers a physical resource ID → stack name mapping.
   * Used when the new Gen1App code path bypasses DescribeStackResources.
   */
  public registerResource(physicalId: string, stackName: string): void {
    this._stackNameForResource.set(physicalId, stackName);
  }

  private mockDescribeStackResources() {
    this.mock
      .on(cloudformation.DescribeStackResourcesCommand)
      .callsFake(async (input: cloudformation.DescribeStackResourcesInput): Promise<cloudformation.DescribeStackResourcesOutput> => {
        const templatePath = this.app.templatePathForStack(input.StackName!);
        const template: any = JSONUtilities.readJson<any>(templatePath);
        const stackResources: cloudformation.StackResource[] = [];
        for (const logicalId of Object.keys(template.Resources)) {
          if (input.LogicalResourceId && logicalId !== input.LogicalResourceId) {
            continue;
          }
          const resource = template.Resources[logicalId];
          const physicalId =
            resource.Type === 'AWS::CloudFormation::Stack'
              ? this.app.nestedStackName(input.StackName!, logicalId)
              : this.app.physicalId(input.StackName!, logicalId) ?? `${input.StackName}/${logicalId}`;
          stackResources.push({
            LogicalResourceId: logicalId,
            PhysicalResourceId: physicalId,
            ResourceType: resource.Type,
            Timestamp: undefined,
            ResourceStatus: undefined,
          });

          // remember which stack has the resource because we are going to get
          // asked later on.
          this._stackNameForResource.set(physicalId, input.StackName!);
        }

        return { StackResources: stackResources };
      });
  }

  private mockDescribeStacks() {
    this.mock
      .on(cloudformation.DescribeStacksCommand)
      .callsFake(async (input: cloudformation.DescribeStacksInput): Promise<cloudformation.DescribeStacksOutput> => {
        const invocationCount = this._describeStackCounter.get(input.StackName!) ?? 0;
        this._describeStackCounter.set(input.StackName!, invocationCount + 1);
        if (input.StackName!.endsWith('-holding')) {
          switch (invocationCount) {
            case 0:
              // first time is before executing refactor when we check if it already
              // exists. simulate a standard pre-refactor state where it doesn't.
              throw new cloudformation.CloudFormationServiceException({
                name: 'ValidationError',
                message: `stack ${input.StackName} does not exist`,
                $fault: 'client',
                $metadata: {},
              });
            case 1:
              // second time is after we execute the refactor and CloudFormation is supposed
              // to create the stack for us. all we need is a completion status here.
              return {
                Stacks: [
                  {
                    StackName: input.StackName,
                    StackStatus: 'UPDATE_COMPLETE',
                    CreationTime: undefined,
                  },
                ],
              };
            default:
              throw new Error(`Unexpected invocation of DescribeStacks with input: ${JSON.stringify(input)}`);
          }
        }
        const parameters = this.app.cfnParametersForStack(input.StackName!);
        const outputs = this.app.cfnOutputsForStack(input.StackName!);
        const description = this.app.cfnDescriptionForStack(input.StackName!);
        return {
          Stacks: [
            {
              StackName: input.StackName!,
              Parameters: parameters,
              CreationTime: undefined,
              StackStatus: 'UPDATE_COMPLETE',
              Description: description,
              Outputs: outputs,
            },
          ],
        };
      });
  }

  private mockGetTemplate() {
    this.mock
      .on(cloudformation.GetTemplateCommand)
      .callsFake(async (input: cloudformation.GetTemplateCommandInput): Promise<cloudformation.GetTemplateCommandOutput> => {
        const templatePath = this.app.templatePathForStack(input.StackName!);
        return {
          TemplateBody: fs.readFileSync(templatePath, { encoding: 'utf-8' }),
          $metadata: {},
        };
      });
  }

  private mockCreateStackRefactor() {
    this.mock.on(cloudformation.CreateStackRefactorCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (input: cloudformation.CreateStackRefactorCommandInput): Promise<cloudformation.CreateStackRefactorCommandOutput> => {
        return { StackRefactorId: `${Date.now()}`, $metadata: {} };
      },
    );
  }

  private mockDescribeStackRefactor() {
    this.mock.on(cloudformation.DescribeStackRefactorCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (input: cloudformation.DescribeStackRefactorCommandInput): Promise<cloudformation.DescribeStackRefactorCommandOutput> => {
        return { Status: 'CREATE_COMPLETE', ExecutionStatus: 'EXECUTE_COMPLETE', $metadata: {} };
      },
    );
  }
}

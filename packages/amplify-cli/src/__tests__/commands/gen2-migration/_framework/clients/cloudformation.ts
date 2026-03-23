import { mockClient } from 'aws-sdk-client-mock';
import * as cloudformation from '@aws-sdk/client-cloudformation';
import { MigrationApp } from '../app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';

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
  private readonly _templateForStack: Map<string, string> = new Map<string, string>();

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cloudformation.CloudFormationClient);

    const refactorInputPath = this.app.snapshots.refactor.props.inputPath;
    for (const stackFile of fs.readdirSync(refactorInputPath).filter((f) => f.endsWith('.template.json'))) {
      const stackName = stackFile.replace('.template.json', '');
      this._templateForStack.set(stackName, fs.readFileSync(path.join(refactorInputPath, stackFile), { encoding: 'utf-8' }));
    }

    this.mockDescribeStackResources();
    this.mockDescribeStacks();
    this.mockGetTemplate();
    this.mockCreateStackRefactor();
    this.mockDescribeStackRefactor();
    this.mockCreateChangeSet();
    this.mockDescribeChangeSet();
    this.mockUpdateStack();
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
        const template = this._templateForStack.get(input.StackName!);
        if (!template) {
          throw new cloudformation.CloudFormationServiceException({
            name: 'ValidationError',
            message: `stack ${input.StackName} does not exist`,
            $fault: 'client',
            $metadata: {},
          });
        }

        const preExistingStack = fs.existsSync(this.app.templatePathForStack(input.StackName!));
        return {
          Stacks: [
            {
              StackName: input.StackName!,
              CreationTime: new Date(),
              StackStatus: cloudformation.StackStatus.UPDATE_COMPLETE,
              Parameters: preExistingStack ? this.app.cfnParametersForStack(input.StackName!) : undefined,
              Description: preExistingStack ? this.app.cfnDescriptionForStack(input.StackName!) : undefined,
              Outputs: preExistingStack ? this.app.cfnOutputsForStack(input.StackName!) : undefined,
            },
          ],
        };
      });
  }

  private mockGetTemplate() {
    this.mock
      .on(cloudformation.GetTemplateCommand)
      .callsFake(async (input: cloudformation.GetTemplateCommandInput): Promise<cloudformation.GetTemplateCommandOutput> => {
        return {
          TemplateBody: this._templateForStack.get(input.StackName!),
          $metadata: {},
        };
      });
  }

  private mockCreateStackRefactor() {
    this.mock.on(cloudformation.CreateStackRefactorCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (input: cloudformation.CreateStackRefactorCommandInput): Promise<cloudformation.CreateStackRefactorCommandOutput> => {
        const source = input.StackDefinitions![0];
        const target = input.StackDefinitions![1];
        this._templateForStack.set(source.StackName!, source.TemplateBody!);
        this._templateForStack.set(target.StackName!, target.TemplateBody!);
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

  private mockCreateChangeSet() {
    this.mock.on(cloudformation.CreateChangeSetCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (_input: cloudformation.CreateChangeSetCommandInput): Promise<cloudformation.CreateChangeSetCommandOutput> => {
        return { $metadata: {} };
      },
    );
  }

  private mockDescribeChangeSet() {
    this.mock.on(cloudformation.DescribeChangeSetCommand).callsFake(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (_input: cloudformation.DescribeChangeSetCommandInput): Promise<cloudformation.DescribeChangeSetCommandOutput> => {
        return { Status: 'CREATE_COMPLETE', Changes: [], $metadata: {} };
      },
    );
  }

  private mockUpdateStack() {
    this.mock
      .on(cloudformation.UpdateStackCommand)
      .callsFake(async (input: cloudformation.UpdateStackCommandInput): Promise<cloudformation.UpdateStackCommandOutput> => {
        this._templateForStack.set(input.StackName!, input.TemplateBody!);
        return { StackId: input.StackName, $metadata: {} };
      });
  }
}

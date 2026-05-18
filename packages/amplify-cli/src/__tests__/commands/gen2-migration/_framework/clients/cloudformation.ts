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
 * - `ListStackResourcesCommand`: Lists resources in a stack by parsing the
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
  private readonly _pendingChangeSets: Map<string, cloudformation.CreateChangeSetCommandInput> = new Map();

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cloudformation.CloudFormationClient);

    const refactorInputPath = this.app.snapshots.refactor.props.inputPath;
    for (const stackFile of fs.readdirSync(refactorInputPath).filter((f) => f.endsWith('.template.json'))) {
      const stackName = stackFile.replace('.template.json', '');
      this._templateForStack.set(stackName, fs.readFileSync(path.join(refactorInputPath, stackFile), { encoding: 'utf-8' }));
    }

    this.mockListStackResources();
    this.mockDescribeStacks();
    this.mockGetTemplate();
    this.mockCreateStackRefactor();
    this.mockDescribeStackRefactor();
    this.mockCreateChangeSet();
    this.mockDescribeChangeSet();
    this.mockExecuteChangeSet();
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
   * Used when the new Gen1App code path bypasses ListStackResources.
   */
  public registerResource(physicalId: string, stackName: string): void {
    this._stackNameForResource.set(physicalId, stackName);
  }

  private mockListStackResources() {
    this.mock
      .on(cloudformation.ListStackResourcesCommand)
      .callsFake(async (input: cloudformation.ListStackResourcesInput): Promise<cloudformation.ListStackResourcesOutput> => {
        const templatePath = this.app.templatePathForStack(input.StackName!);
        const template: any = JSONUtilities.readJson<any>(templatePath);
        const stackResourceSummaries: cloudformation.StackResourceSummary[] = [];
        for (const logicalId of Object.keys(template.Resources)) {
          const resource = template.Resources[logicalId];
          const physicalId =
            resource.Type === 'AWS::CloudFormation::Stack'
              ? this.app.nestedStackName(input.StackName!, logicalId)
              : this.app.physicalId(input.StackName!, logicalId) ?? `${input.StackName}/${logicalId}`;
          stackResourceSummaries.push({
            LogicalResourceId: logicalId,
            PhysicalResourceId: physicalId,
            ResourceType: resource.Type,
            LastUpdatedTimestamp: new Date(),
            ResourceStatus: cloudformation.ResourceStatus.CREATE_COMPLETE,
          });

          // remember which stack has the resource because we are going to get
          // asked later on.
          this._stackNameForResource.set(physicalId, input.StackName!);
        }

        return { StackResourceSummaries: stackResourceSummaries };
      });
  }

  private mockDescribeStacks() {
    this.mock
      .on(cloudformation.DescribeStacksCommand)
      .callsFake(async (input: cloudformation.DescribeStacksInput): Promise<cloudformation.DescribeStacksOutput> => {
        if (!this._templateForStack.has(input.StackName!)) {
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
        const templateBody = this._templateForStack.get(input.StackName!);
        if (!templateBody) {
          throw new Error(`Unable to find template for stack ${input.StackName}`);
        }
        return {
          // create a clone so our code doesn't mutate the inner objects.
          TemplateBody: JSON.stringify(JSON.parse(templateBody)),
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
        const sourceBody = source.TemplateBody ?? this.resolveTemplateUrl(source.TemplateURL);
        const targetBody = target.TemplateBody ?? this.resolveTemplateUrl(target.TemplateURL);
        if (sourceBody) this._setTemplate(source.StackName!, sourceBody);
        if (targetBody) this._setTemplate(target.StackName!, targetBody);
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
    this.mock
      .on(cloudformation.CreateChangeSetCommand)
      .callsFake(async (input: cloudformation.CreateChangeSetCommandInput): Promise<cloudformation.CreateChangeSetCommandOutput> => {
        if (input.StackName) {
          this._pendingChangeSets.set(input.StackName, input);
        }
        return { $metadata: {} };
      });
  }

  private mockDescribeChangeSet() {
    this.mock
      .on(cloudformation.DescribeChangeSetCommand)
      .callsFake(async (input: cloudformation.DescribeChangeSetCommandInput): Promise<cloudformation.DescribeChangeSetCommandOutput> => {
        const pending = this._pendingChangeSets.get(input.StackName!);
        return {
          Status: 'CREATE_COMPLETE',
          StackName: input.StackName,
          Parameters: pending?.Parameters as cloudformation.Parameter[],
          Changes: [],
          $metadata: {},
        };
      });
  }

  private mockExecuteChangeSet() {
    this.mock
      .on(cloudformation.ExecuteChangeSetCommand)
      .callsFake(async (input: cloudformation.ExecuteChangeSetCommandInput): Promise<cloudformation.ExecuteChangeSetCommandOutput> => {
        const pending = this._pendingChangeSets.get(input.StackName!);
        const body = pending?.TemplateBody ?? this.resolveTemplateUrl(pending?.TemplateURL);
        if (body) {
          this._setTemplate(input.StackName!, body);
        }
        this._pendingChangeSets.delete(input.StackName!);
        return { $metadata: {} };
      });
  }

  private mockUpdateStack() {
    this.mock
      .on(cloudformation.UpdateStackCommand)
      .callsFake(async (input: cloudformation.UpdateStackCommandInput): Promise<cloudformation.UpdateStackCommandOutput> => {
        const body = input.TemplateBody ?? this.resolveTemplateUrl(input.TemplateURL);
        if (body) {
          this._setTemplate(input.StackName!, body);
        }
        return { StackId: input.StackName, $metadata: {} };
      });
  }

  private _setTemplate(stackName: string, templateBody: string) {
    this._templateForStack.set(stackName, templateBody);
  }

  private resolveTemplateUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    return this.app.clients.s3.resolveTemplateUrl(url);
  }
}

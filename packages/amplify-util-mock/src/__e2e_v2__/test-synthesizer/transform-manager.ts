import { App, CfnParameter, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { AssetProvider, NestedStackProvider, S3Asset, AssetProps, SynthParameters } from '@aws-amplify/graphql-transformer-interfaces';
import { DeploymentResources, Template } from './deployment-resources';
import { TransformerStackSynthesizer } from './stack-synthesizer';
import { TransformerNestedStack } from './nested-stack';
import { TransformerRootStack } from './root-stack';
import { FileAsset } from './file-asset';

/**
 * Stack Manager plugin which supports the Amplify CLI transformer behavior today. Manages Transformer stacks, nested stacks,
 * and synthesizers, then provides mechanisms for synthesis.
 */
export class TransformManager {
  private readonly app: App = new App();
  public readonly rootStack: TransformerRootStack;
  private readonly stackSynthesizer = new TransformerStackSynthesizer();
  private readonly childStackSynthesizers: Map<string, TransformerStackSynthesizer> = new Map();

  constructor() {
    this.rootStack = new TransformerRootStack(this.app, 'transformer-root-stack', {
      synthesizer: this.stackSynthesizer,
    });
  }

  getTransformScope(): Construct {
    return this.rootStack;
  }

  /**
   * Retrieve the nestedStackProvider for a Transformer Managed Stack
   */
  getNestedStackProvider(): NestedStackProvider {
    return {
      provide: (scope: Construct, name: string): Stack => {
        const synthesizer = new TransformerStackSynthesizer();
        const newStack = new TransformerNestedStack(scope, name, {
          synthesizer,
        });
        this.childStackSynthesizers.set(name, synthesizer);
        return newStack;
      },
    };
  }

  getAssetProvider(): AssetProvider {
    return {
      provide: (scope: Construct, id: string, props: AssetProps): S3Asset => new FileAsset(scope, id, props),
    };
  }

  getSynthParameters(hasIamAuth: boolean, hasUserPoolAuth: boolean): SynthParameters {
    const envParameter = new CfnParameter(this.rootStack, 'env', {
      default: 'NONE',
      type: 'String',
    });
    const apiNameParameter = new CfnParameter(this.rootStack, 'AppSyncApiName', {
      default: 'AppSyncSimpleTransform',
      type: 'String',
    });
    const synthParameters: SynthParameters = {
      amplifyEnvironmentName: envParameter.valueAsString,
      apiName: apiNameParameter.valueAsString,
    };
    if (hasIamAuth) {
      synthParameters.authenticatedUserRoleName = new CfnParameter(this.rootStack, 'authRoleName', { type: 'String' }).valueAsString;
      synthParameters.unauthenticatedUserRoleName = new CfnParameter(this.rootStack, 'unauthRoleName', { type: 'String' }).valueAsString;
    }
    if (hasUserPoolAuth) {
      synthParameters.userPoolId = new CfnParameter(this.rootStack, 'AuthCognitoUserPoolId', { type: 'String' }).valueAsString;
    }
    return synthParameters;
  }

  generateDeploymentResources(): DeploymentResources {
    this.app.synth({ force: true, skipValidation: true });

    const templates = this.getCloudFormationTemplates();
    const rootStackTemplate = templates.get('transformer-root-stack');
    const childStacks: Record<string, Template> = {};
    for (const [templateName, template] of templates.entries()) {
      if (templateName !== 'transformer-root-stack') {
        childStacks[templateName] = template;
      }
    }

    const fileAssets = this.getMappingTemplates();
    const pipelineFunctions: Record<string, string> = {};
    const resolvers: Record<string, string> = {};
    const functions: Record<string, string> = {};
    for (const [templateName, template] of fileAssets) {
      if (templateName.startsWith('pipelineFunctions/')) {
        pipelineFunctions[templateName.replace('pipelineFunctions/', '')] = template;
      } else if (templateName.startsWith('resolvers/')) {
        resolvers[templateName.replace('resolvers/', '')] = template;
      } else if (templateName.startsWith('functions/')) {
        functions[templateName.replace('functions/', '')] = template;
      }
    }
    const schema = fileAssets.get('schema.graphql') || '';

    return {
      functions,
      pipelineFunctions,
      resolvers,
      schema,
      stacks: childStacks,
      rootStack: rootStackTemplate,
      stackMapping: {},
      userOverriddenSlots: [],
    };
  }

  private getCloudFormationTemplates = (): Map<string, Template> => {
    let stacks = this.stackSynthesizer.collectStacks();
    this.childStackSynthesizers.forEach((synthesizer) => {
      stacks = new Map([...stacks.entries(), ...synthesizer.collectStacks()]);
    });
    return stacks;
  };

  private getMappingTemplates = (): Map<string, string> => this.stackSynthesizer.collectMappingTemplates();
}

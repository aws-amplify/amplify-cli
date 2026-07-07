import * as crypto from 'crypto';
import {
  Aws,
  CfnResource,
  CfnStack,
  FileAssetPackaging,
  Fn,
  IResolveContext,
  IStackSynthesizer,
  Lazy,
  NestedStackProps,
  Stack,
  Token,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TransformerRootStack } from './root-stack';
import { TransformerStackSynthesizer } from './stack-synthesizer';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

export type TransformerNestedStackProps = NestedStackProps & {
  synthesizer?: IStackSynthesizer;
};
export class TransformerNestedStack extends TransformerRootStack {
  public readonly templateFile: string;

  public readonly nestedStackResource?: CfnResource;

  private readonly parameters: { [name: string]: string };

  private readonly resource: CfnStack;

  private readonly _contextualStackId: string;

  private readonly _contextualStackName: string;

  private _templateUrl?: string;

  private _rootStack: Stack;

  constructor(scope: Construct, id: string, props: TransformerNestedStackProps = {}) {
    const rootStack = findRootStack(scope);
    const synthesizer = props.synthesizer || new TransformerStackSynthesizer();
    super(scope, id, {
      env: { account: rootStack.account, region: rootStack.region },
      ...props,
      synthesizer,
    });

    this._rootStack = rootStack;

    const parentScope = new Construct(scope, `${id}.NestedStack`);
    // Transformer synthesizes the stack in memory and stack names are going to be unique
    this.templateFile = `stacks/${id}.json`;

    this.parameters = props.parameters || {};

    this.resource = new CfnStack(parentScope, `${id}.NestedStackResource`, {
      // eslint-disable-next-line spellcheck/spell-checker
      templateUrl: Lazy.uncachedString({
        produce: () => {
          return this._templateUrl || '<unresolved>';
        },
      }),
      parameters: Lazy.any({
        produce: () => (Object.keys(this.parameters).length > 0 ? this.parameters : undefined),
      }),
      notificationArns: props.notificationArns,
      timeoutInMinutes: props.timeout ? props.timeout.toMinutes() : undefined,
    });

    this.nestedStackResource = this.resource;

    // context-aware stack name: if resolved from within this stack, return AWS::StackName
    // if resolved from the outer stack, use the { Ref } of the AWS::CloudFormation::Stack resource
    // which resolves the ARN of the stack. We need to extract the stack name, which is the second
    // component after splitting by "/"
    this._contextualStackName = this.contextualAttribute(Aws.STACK_NAME, Fn.select(1, Fn.split('/', this.resource.ref)));
    this._contextualStackId = this.contextualAttribute(Aws.STACK_ID, this.resource.ref);
  }

  // eslint-disable-next-line spellcheck/spell-checker
  /**
   * An attribute that represents the name of the nested stack.
   *
   * This is a context aware attribute:
   * - If this is referenced from the parent stack, it will return a token that parses the name from the stack ID.
   * - If this is referenced from the context of the nested stack, it will return `{ "Ref": "AWS::StackName" }`
   *
   * @attribute
   * @example mystack-mynestedstack-sggfrhxhum7w
   */
  public get stackName() {
    return this._contextualStackName;
  }

  // eslint-disable-next-line spellcheck/spell-checker
  /**
   * An attribute that represents the ID of the stack.
   *
   * This is a context aware attribute:
   * - If this is referenced from the parent stack, it will return `{ "Ref": "LogicalIdOfNestedStackResource" }`.
   * - If this is referenced from the context of the nested stack, it will return `{ "Ref": "AWS::StackId" }`
   *
   * @attribute
   * @example "arn:aws:cloudformation:us-east-2:123456789012:stack/mystack-mynestedstack-sggfrhxhum7w/f449b250-b969-11e0-a185-5081d0136786"
   */
  public get stackId() {
    return this._contextualStackId;
  }

  /**
   * Assign a value to one of the nested stack parameters.
   * @param name The parameter name (ID)
   * @param value The value to assign
   */
  public setParameter(name: string, value: string) {
    this.parameters[name] = value;
  }

  /**
   * Defines an asset at the parent stack which represents the template of this
   * nested stack.
   *
   * This private API is used by `App.prepare()` within a loop that rectifies
   * references every time an asset is added. This is because (at the moment)
   * assets are addressed using CloudFormation parameters.
   *
   * @returns `true` if a new asset was added or `false` if an asset was
   * previously added. When this returns `true`, App will do another reference
   * rectification cycle.
   *
   * @internal
   */
  public _prepareTemplateAsset() {
    if (this._templateUrl) {
      return false;
    }

    const cfn = JSON.stringify((this as $TSAny)._toCloudFormation());
    const templateHash = crypto.createHash('sha256').update(cfn).digest('hex');

    const templateLocation = this._rootStack.synthesizer.addFileAsset({
      packaging: FileAssetPackaging.FILE,
      sourceHash: templateHash,
      fileName: this.templateFile,
    });

    this._templateUrl = templateLocation.httpUrl;

    return true;
  }

  private contextualAttribute(innerValue: string, outerValue: string) {
    return Token.asString({
      resolve: (context: IResolveContext) => {
        if (Stack.of(context.scope) === this) {
          return innerValue;
        } else {
          return outerValue;
        }
      },
    });
  }
}
function findRootStack(scope: Construct): Stack {
  if (!scope) {
    throw new Error('Nested stacks cannot be defined as a root construct');
  }

  const rootStack = scope.node.scopes.find((p) => Stack.isStack(p));
  if (!rootStack) {
    throw new Error('Nested stacks must be defined within scope of another non-nested stack');
  }

  return rootStack as Stack;
}

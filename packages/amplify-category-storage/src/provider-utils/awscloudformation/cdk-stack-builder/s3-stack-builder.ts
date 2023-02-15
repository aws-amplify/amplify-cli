import { AmplifyS3ResourceTemplate } from '@aws-amplify/cli-extensibility-helper';
import * as iamCdk from 'aws-cdk-lib/aws-iam';
import * as lambdaCdk from 'aws-cdk-lib/aws-lambda';
import * as s3Cdk from 'aws-cdk-lib/aws-s3';
import { HttpMethods } from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  $TSAny, $TSContext, $TSObject, AmplifyCategories, stateManager,
} from 'amplify-cli-core';
import {
  defaultS3UserInputs,
  GroupAccessType,
  S3PermissionType,
  S3TriggerEventType,
  S3TriggerPrefixTransform,
  S3TriggerPrefixType,
  S3UserInputs,
  S3UserInputTriggerFunctionParams,
} from '../service-walkthrough-types/s3-user-input-types';
import * as s3AuthAPI from '../service-walkthroughs/s3-auth-api';
// eslint-disable-next-line import/no-cycle
import { S3CFNDependsOn, S3CFNPermissionType, S3InputState } from '../service-walkthroughs/s3-user-input-state';
import {
  AmplifyBuildParamsPermissions, AmplifyCfnParamType, AmplifyResourceCfnStack, AmplifyS3ResourceInputParameters,
} from './types';

/**
 * Class to generate S3 resource cloudformation stack
 */
export class AmplifyS3ResourceCfnStack extends AmplifyResourceCfnStack implements AmplifyS3ResourceTemplate {
  id: string;
  scope: Construct;
  s3Bucket!: s3Cdk.CfnBucket;
  s3BucketName: string;
  notificationConfiguration: s3Cdk.CfnBucket.NotificationConfigurationProperty = {
    lambdaConfigurations: [],
  };

  triggerLambdaPermissions?: lambdaCdk.CfnPermission;
  adminTriggerLambdaPermissions?: lambdaCdk.CfnPermission;
  authResourceName!: string;
  authIAMPolicy!: iamCdk.PolicyDocument;
  guestIAMPolicy!: iamCdk.PolicyDocument;
  groupIAMPolicy!: iamCdk.PolicyDocument;
  conditions!: AmplifyS3Conditions;
  parameters!: AmplifyS3CfnParameters;
  s3AuthPublicPolicy?: iamCdk.CfnPolicy;
  s3AuthProtectedPolicy?: iamCdk.CfnPolicy;
  s3AuthPrivatePolicy?: iamCdk.CfnPolicy;
  s3AuthUploadPolicy?: iamCdk.CfnPolicy;
  s3AuthReadPolicy?: iamCdk.CfnPolicy;
  s3GuestPublicPolicy?: iamCdk.CfnPolicy;
  s3GuestUploadPolicy?: iamCdk.CfnPolicy;
  s3GuestReadPolicy?: iamCdk.CfnPolicy;
  s3GroupPolicyList?: Array<iamCdk.CfnPolicy>;
  s3TriggerPolicy?: iamCdk.CfnPolicy;
  s3DependsOnResources: Array<S3CFNDependsOn>; // to be synced to backend-config.json

  _props: S3UserInputs = defaultS3UserInputs();
  _cfnInputParams: AmplifyS3ResourceInputParameters = {};
  constructor(scope: Construct, s3ResourceName: string, props: S3UserInputs, cfnInputParams: AmplifyS3ResourceInputParameters) {
    super(scope, s3ResourceName);
    this.scope = scope;
    this.id = s3ResourceName;
    this._props = props;
    this._cfnInputParams = cfnInputParams;
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = S3_ROOT_CFN_DESCRIPTION;
    this.s3BucketName = this.buildBucketName();
    this.s3DependsOnResources = [];
    this.notificationConfiguration = {
      lambdaConfigurations: [],
    };
  }

  private getGroupListFromProps(): Array<string> | undefined {
    const groupList = this._props.groupAccess ? Object.keys(this._props.groupAccess) : [];
    return groupList;
  }

  /**
   * get S3 Resource Friendly Name
   */
  public getS3ResourceFriendlyName(): string {
    return this.id;
  }

  /**
   * get S3 Bucket Name
   */
  public getS3BucketName(): string {
    return this.s3BucketName;
  }

  /**
   * get S3 DependsOn
   */
  public getS3DependsOn(): Array<S3CFNDependsOn> | undefined {
    return this.s3DependsOnResources;
  }

  private _addNotificationsLambdaConfigurations(newLambdaConfigurations: s3Cdk.CfnBucket.LambdaConfigurationProperty[]): void {
    const existingLambdaConfigurations = (this.notificationConfiguration as $TSAny).lambdaConfigurations;
    this.notificationConfiguration = {
      lambdaConfigurations: existingLambdaConfigurations.concat(newLambdaConfigurations),
    };
  }

  /**
   * configure trigger policy to handle triggerFunction and adminTriggerFunction (predictions)
   */
  private configureTriggerPolicy(): void {
    let s3TriggerPolicyDefinition;
    // 6.1 Configure Trigger policy group
    if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
      s3TriggerPolicyDefinition = this.createTriggerPolicyDefinition('S3TriggerBucketPolicy', this._props.triggerFunction);
    }
    // 6.2 Configure Trigger policy group with adminTrigger
    if (
      this._props.adminTriggerFunction?.triggerFunction
      && this._props.adminTriggerFunction.triggerFunction !== 'NONE'
      && this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction
    ) {
      const adminTriggerFunctionName = this._props.adminTriggerFunction.triggerFunction;
      // create/update s3TriggerPolicyGroup with [predictions] adminLambda
      s3TriggerPolicyDefinition = s3TriggerPolicyDefinition
        ? this.addFunctionToTriggerPolicyDefinition(s3TriggerPolicyDefinition, adminTriggerFunctionName)
        : this.createTriggerPolicyDefinition('S3TriggerBucketPolicy', adminTriggerFunctionName);
    }
    // 6.3 Configure Trigger policy if groups are configured
    if (s3TriggerPolicyDefinition) {
      this.s3TriggerPolicy = this.createTriggerPolicyFromPolicyDefinition(s3TriggerPolicyDefinition);
    }
  }

  /**
   * This check is required because, in legacy code S3bucket triggers are configured without prefix.
   * When adding a predictions element, we need to remove the global trigger function and apply it to a subfolder.
   */
  _conditionallyBuildTriggerLambdaParams(triggerFunction : string): S3UserInputTriggerFunctionParams {
    let triggerLambdaFunctionParams: S3UserInputTriggerFunctionParams;
    if (
      this._props.adminTriggerFunction?.triggerFunction
          && this._props.adminTriggerFunction.triggerFunction !== 'NONE'
          && this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction
    ) {
      triggerLambdaFunctionParams = {
        category: AmplifyCategories.STORAGE,
        tag: 'triggerFunction',
        triggerFunction,
        permissions: [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
        triggerEvents: [S3TriggerEventType.OBJ_PUT_POST_COPY, S3TriggerEventType.OBJ_REMOVED],
        triggerPrefix: [
          { prefix: 'protected/', prefixTransform: S3TriggerPrefixTransform.ATTACH_REGION },
          { prefix: 'private/', prefixTransform: S3TriggerPrefixTransform.ATTACH_REGION },
          { prefix: 'public/', prefixTransform: S3TriggerPrefixTransform.ATTACH_REGION },
        ],
      };
    } else {
      triggerLambdaFunctionParams = {
        category: AmplifyCategories.STORAGE,
        tag: 'triggerFunction',
        triggerFunction,
        permissions: [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE],
        triggerEvents: [S3TriggerEventType.OBJ_PUT_POST_COPY, S3TriggerEventType.OBJ_REMOVED],
      };
    }
    return triggerLambdaFunctionParams;
  }

  /**
   * Generate cloudformation stack for S3 resource
   */
  async generateCfnStackResources(context: $TSContext): Promise<void> {
    // 1. Create the S3 bucket and configure CORS
    this.s3Bucket = new s3Cdk.CfnBucket(this, 'S3Bucket', {
      bucketName: this.s3BucketName,
      corsConfiguration: this.buildCORSRules(),
    });

    this.s3Bucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);
    // 2. Configure Notifications on the S3 bucket.
    if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
      const triggerLambdaFunctionParams = this._conditionallyBuildTriggerLambdaParams(this._props.triggerFunction);
      const newLambdaConfigurations = this.buildLambdaConfigFromTriggerParams(triggerLambdaFunctionParams);
      this._addNotificationsLambdaConfigurations(newLambdaConfigurations);
      this.triggerLambdaPermissions = this.createInvokeFunctionS3Permission('TriggerPermissions', this._props.triggerFunction);
      this.s3Bucket.addDependsOn(this.triggerLambdaPermissions as lambdaCdk.CfnPermission);
      /**
       * Add Depends On: FUNCTION service
       * s3 Dependency on Lambda to Root Stack
       */
      this.s3DependsOnResources.push(this.buildS3DependsOnFunctionCfn(this._props.triggerFunction as string));
    }
    // 3. Configure (Predictions category) Admin Trigger Notifications on Bucket
    if (
      this._props.adminTriggerFunction?.triggerFunction
      && this._props.adminTriggerFunction.triggerFunction !== 'NONE'
      && this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction
    ) {
      const adminLambdaConfigurations = this.buildLambdaConfigFromTriggerParams(this._props.adminTriggerFunction);
      this._addNotificationsLambdaConfigurations(adminLambdaConfigurations);
      this.adminTriggerLambdaPermissions = this.createInvokeFunctionS3Permission(
        'AdminTriggerPermissions',
        this._props.adminTriggerFunction.triggerFunction,
      );
      this.s3Bucket.addDependsOn(this.adminTriggerLambdaPermissions);

      /**
       * Add Depends On: FUNCTION service
       * s3 Dependency on AdminLambda to Root Stack
       */
      this.s3DependsOnResources.push(this.buildS3DependsOnFunctionCfn(this._props.adminTriggerFunction.triggerFunction as string));
    }

    // Apply all Notifications configurations on S3Bucket;
    if (
      this.notificationConfiguration.lambdaConfigurations
      && (this.notificationConfiguration.lambdaConfigurations as s3Cdk.CfnBucket.LambdaConfigurationProperty[]).length > 0
    ) {
      this.s3Bucket.notificationConfiguration = this.notificationConfiguration;
    }

    // 4. Create IAM policies to control Cognito pool access to S3 bucket
    this.createAndSetIAMPolicies();

    // 5. Configure Cognito User pool policies
    const groupList = this.getGroupListFromProps();
    if (groupList && groupList.length > 0) {
      const authResourceName: string = await s3AuthAPI.getAuthResourceARN(context);
      this.authResourceName = authResourceName;
      this.s3GroupPolicyList = this.createS3AmplifyGroupPolicies(authResourceName, groupList, this._props.groupAccess as GroupAccessType);

      this.addGroupParams(authResourceName);

      /**
       * Add Depends On: AUTH
       * s3 Dependency on Cognito to Root Stack
       */
      // 1. UserPoolID
      this.s3DependsOnResources.push(this.buildS3DependsOnUserPoolIdCfn(authResourceName as string));
      // 2. User Pool Group List
      const userPoolGroupList = this.buildS3DependsOnUserPoolGroupRoleListCfn(groupList);
      this.s3DependsOnResources = this.s3DependsOnResources.concat(userPoolGroupList);
    }

    // 6. Configure Trigger Policy for trigger function and adminTriggerFunction
    this.configureTriggerPolicy();
  }

  /**
   * adds User pool group params to S3
   */
  public addGroupParams(authResourceName: string): AmplifyS3CfnParameters | undefined {
    const groupList = this.getGroupListFromProps();
    if (groupList && groupList.length > 0) {
      const s3CfnParams: Array<AmplifyCfnParamType> = [
        {
          params: [`auth${authResourceName}UserPoolId`],
          paramType: 'String',
          default: `auth${authResourceName}UserPoolId`,
        },
      ];

      for (const groupName of groupList) {
        s3CfnParams.push({
          // eslint-disable-next-line spellcheck/spell-checker
          params: [`authuserPoolGroups${this.buildGroupRoleName(groupName)}`],
          paramType: 'String',
          // eslint-disable-next-line spellcheck/spell-checker
          default: `authuserPoolGroups${this.buildGroupRoleName(groupName)}`,
        });
      }
      // insert into the stack
      s3CfnParams.map(params => this._setCFNParams(params));
    }
    return undefined;
  }

  private createTriggerLambdaCFNParams = (triggerParameterName: string, triggerFunction: string): $TSAny[] => {
    const triggerFunctionARN = `function${triggerFunction}Arn`;
    const triggerFunctionName = `function${triggerFunction}Name`;
    const triggerFunctionLambdaExecutionRole = `function${triggerFunction}LambdaExecutionRole`;
    const params = [triggerFunctionARN, triggerFunctionName, triggerFunctionLambdaExecutionRole];
    const s3CfnTriggerFunctionParams: $TSAny[] = params.map(param => ({
      params: [param],
      paramType: 'String',
      default: param,
    }));
    s3CfnTriggerFunctionParams.push({
      params: [triggerParameterName],
      paramType: 'String',
    });
    return s3CfnTriggerFunctionParams;
  }

  /**
   * adds cfn parameter to stack
   */
  public addParameters(): void {
    let s3CfnParams: Array<AmplifyCfnParamType> = [
      {
        params: ['env', 'bucketName', 'authRoleName', 'unauthRoleName', 'authPolicyName', 'unauthPolicyName'],
        paramType: 'String',
      },
      {
        params: ['s3PublicPolicy', 's3PrivatePolicy', 's3ProtectedPolicy', 's3UploadsPolicy', 's3ReadPolicy'],
        paramType: 'String',
        default: 'NONE',
      },
      {
        params: [
          's3PermissionsAuthenticatedPublic',
          's3PermissionsAuthenticatedProtected',
          's3PermissionsAuthenticatedPrivate',
          's3PermissionsAuthenticatedUploads',
          's3PermissionsGuestPublic',
          's3PermissionsGuestUploads',
          'AuthenticatedAllowList',
          'GuestAllowList',
        ],
        paramType: 'String',
        default: AmplifyBuildParamsPermissions.DISALLOW,
      },
      {
        params: ['selectedGuestPermissions', 'selectedAuthenticatedPermissions'],
        paramType: 'CommaDelimitedList',
        default: 'NONE',
      },
    ];
    if (this._props.triggerFunction && this._props.triggerFunction !== 'NONE') {
      const triggerFunctionCFNParams = this.createTriggerLambdaCFNParams('triggerFunction', this._props.triggerFunction);
      s3CfnParams = s3CfnParams.concat(triggerFunctionCFNParams);
    }

    if (
      this._props.adminTriggerFunction?.triggerFunction
      && this._props.adminTriggerFunction.triggerFunction !== 'NONE'
      && this._props.adminTriggerFunction.triggerFunction !== this._props.triggerFunction
    ) {
      const adminTriggerFunctionCFNParams = this.createTriggerLambdaCFNParams(
        'adminTriggerFunction',
        this._props.adminTriggerFunction.triggerFunction,
      );
      s3CfnParams = s3CfnParams.concat(adminTriggerFunctionCFNParams);
    }

    // insert into the stack
    s3CfnParams.map(params => this._setCFNParams(params));
  }

  /**
   * adds cfn condition to stack
   */
  public addConditions(): AmplifyS3Conditions {
    this.conditions = {
      ShouldNotCreateEnvResources: new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
        expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
      }),
      CreateAuthPublic: new cdk.CfnCondition(this, 'CreateAuthPublic', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedPublic'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),
      CreateAuthProtected: new cdk.CfnCondition(this, 'CreateAuthProtected', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedProtected'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateAuthPrivate: new cdk.CfnCondition(this, 'CreateAuthPrivate', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedPrivate'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateAuthUploads: new cdk.CfnCondition(this, 'CreateAuthUploads', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsAuthenticatedUploads'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateGuestPublic: new cdk.CfnCondition(this, 'CreateGuestPublic', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsGuestPublic'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateGuestUploads: new cdk.CfnCondition(this, 'CreateGuestUploads', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('s3PermissionsGuestUploads'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateAuthReadAndList: new cdk.CfnCondition(this, 'AuthReadAndList', {
        expression: cdk.Fn.conditionNot(
          cdk.Fn.conditionEquals(cdk.Fn.ref('AuthenticatedAllowList'), AmplifyBuildParamsPermissions.DISALLOW),
        ),
      }),

      CreateGuestReadAndList: new cdk.CfnCondition(this, 'GuestReadAndList', {
        expression: cdk.Fn.conditionNot(cdk.Fn.conditionEquals(cdk.Fn.ref('GuestAllowList'), AmplifyBuildParamsPermissions.DISALLOW)),
      }),
    };

    return this.conditions;
  }

  /**
   * adds cfn output to stack
   */
  public addOutputs(): void {
    this.addCfnOutput(
      {
        value: cdk.Fn.ref('S3Bucket'),
        description: 'Bucket name for the S3 bucket',
      },
      'BucketName',
    );
    this.addCfnOutput(
      {
        value: cdk.Fn.ref('AWS::Region'),
      },
      'Region',
    );
  }

  /**
   *  removes notifications configurations for s3 trigger
   */
  emptyNotificationsConfiguration = (): $TSAny => ({
    lambdaConfigurations: [],
  })

  /**
   * builds bucket name for s3
   */
  buildBucketName(): string {
    const bucketRef = cdk.Fn.ref('bucketName');
    const envRef = cdk.Fn.ref('env');
    const bucketNameSuffixRef = cdk.Fn.select(3, cdk.Fn.split('-', cdk.Fn.ref('AWS::StackName')));
    const bucketFinalName = this.isAmplifyStackLegacy()
      ? cdk.Fn.join('', [bucketRef, '-', envRef])
      : cdk.Fn.join('', [bucketRef, bucketNameSuffixRef, '-', envRef]);
    return cdk.Fn.conditionIf(
      'ShouldNotCreateEnvResources',
      bucketRef,
      bucketFinalName,
    ).toString();
  }

  /**
   * Legacy stack names did not start with amplify-
   * the s3bucket was constructed without resourceName
   * @returns boolean  (true if legacy stack (2019/18))
   */
  isAmplifyStackLegacy = (): boolean => {
    const amplifyMeta = stateManager.getMeta();
    const stackName :string = amplifyMeta.providers.awscloudformation.StackName;
    return !stackName.startsWith('amplify-');
  }

  /**
   * build cors rules
   */
  buildCORSRules = (): s3Cdk.CfnBucket.CorsConfigurationProperty => {
    const corsRule: s3Cdk.CfnBucket.CorsRuleProperty = {
      id: 'S3CORSRuleId1',
      maxAge: 3000,
      exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
      allowedHeaders: ['*'],
      allowedOrigins: ['*'],
      allowedMethods: [HttpMethods.GET, HttpMethods.HEAD, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE],
    };
    const corsConfig: s3Cdk.CfnBucket.CorsConfigurationProperty = {
      corsRules: [corsRule],
    };

    return corsConfig;
  }

  /**
   * builds notification configuration for s3
   */
  buildNotificationLambdaConfiguration(): s3Cdk.CfnBucket.LambdaConfigurationProperty[] {
    const triggerFunctionArnRef = cdk.Fn.ref(`function${this._props.triggerFunction}Arn`);

    const lambdaConfigurations = [
      {
        event: 's3:ObjectCreated:*',
        function: triggerFunctionArnRef,
      },
      {
        event: 's3:ObjectRemoved:*',
        function: triggerFunctionArnRef,
      },
    ];
    return lambdaConfigurations;
  }

  /**
   * filter rule append region to S3lambdatrigger prefix
   */
  filterRuleAppendRegionToLambdaTriggerPrefix = (triggerPrefix: S3TriggerPrefixType): $TSAny => {
    const regionRef = cdk.Fn.ref('AWS::Region');
    const filterRule = {
      name: 'prefix',
      value: cdk.Fn.join('', [triggerPrefix.prefix, regionRef]),
    };
    return filterRule;
  }

  /**
   * filter rule plain string lambdaTrigger Prefix
   */
  filterRulePlainStringLambdaTriggerPrefix = (triggerPrefix: S3TriggerPrefixType) : $TSAny => {
    const filterRule = {
      name: 'prefix',
      value: triggerPrefix.prefix,
    };
    return filterRule;
  }

  /**
   * builds s3 trigger prefix rule
   */
  buildTriggerPrefixRule = (triggerPrefix: S3TriggerPrefixType): $TSAny => {
    if (triggerPrefix.prefixTransform === S3TriggerPrefixTransform.ATTACH_REGION) {
      const filterRule = this.filterRuleAppendRegionToLambdaTriggerPrefix(triggerPrefix);
      return filterRule;
    }
    const filterRule = this.filterRulePlainStringLambdaTriggerPrefix(triggerPrefix);
    return filterRule;
  }

  /**
   * builds lambda config for S3 Stack
   */
  buildLambdaConfigFromTriggerParams(functionParams: S3UserInputTriggerFunctionParams): s3Cdk.CfnBucket.LambdaConfigurationProperty[] {
    const lambdaConfigurations: s3Cdk.CfnBucket.LambdaConfigurationProperty[] = [];
    const triggerFunctionArnRef = cdk.Fn.ref(`function${functionParams.triggerFunction}Arn`);
    if (functionParams.permissions) {
      for (const triggerEvent of functionParams.triggerEvents) {
        // S3ObjectCreate/Deleted
        if (functionParams.triggerPrefix) {
          // S3 folder to watch for triggers ( should be unique across trigger functions)
          for (const triggerPrefixDefinition of functionParams.triggerPrefix) {
            const lambdaConfig: $TSAny = {
              event: triggerEvent,
              function: triggerFunctionArnRef,
              filter: {
                s3Key: {
                  rules: [this.buildTriggerPrefixRule(triggerPrefixDefinition)], // single rule - only single prefix supported
                },
              },
            };
            lambdaConfigurations.push(lambdaConfig);
          }
        } else {
          const lambdaConfig: $TSAny = {
            event: triggerEvent,
            function: triggerFunctionArnRef,
          };
          lambdaConfigurations.push(lambdaConfig);
        }
      }
    }
    return lambdaConfigurations;
  }

  /**
   * create IAM policies for stack
   */
  createAndSetIAMPolicies = (): void => {
    // Create PublicPolicy
    if (this._cfnInputParams.s3PermissionsAuthenticatedPublic !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3AuthPublicPolicy = this.createS3AuthPublicPolicy();
    }
    // Create ProtectedPolicy
    if (this._cfnInputParams.s3PermissionsAuthenticatedProtected !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3AuthProtectedPolicy = this.createS3AuthProtectedPolicy();
    }
    // Create AuthPrivatePolicy
    if (this._cfnInputParams.s3PermissionsAuthenticatedPrivate !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3AuthPrivatePolicy = this.createS3AuthPrivatePolicy();
    }
    // Create Auth UploadPolicy
    if (this._cfnInputParams.s3PermissionsAuthenticatedUploads !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3AuthUploadPolicy = this.createS3AuthUploadPolicy();
    }
    // Create Guest PublicPolicy
    if (this._cfnInputParams.s3PermissionsGuestPublic !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3GuestPublicPolicy = this.createS3GuestPublicPolicy();
    }
    // Create GuestUploadsPolicy
    if (this._cfnInputParams.s3PermissionsGuestUploads !== AmplifyBuildParamsPermissions.DISALLOW) {
      this.s3GuestUploadPolicy = this.createGuestUploadsPolicy();
    }
    // Create AuthReadPolicy
    this.s3AuthReadPolicy = this.createS3AuthReadPolicy();

    // Create GuestReadPolicy
    this.s3GuestReadPolicy = this.createS3GuestReadPolicy();
  }

  /**
   * creates S3 iam policy document
   */
  createS3IAMPolicyDocument = (refStr: string, pathStr: string, actionStr: string, effect: iamCdk.Effect):iamCdk.PolicyDocument => {
    const props: iamCdk.PolicyStatementProps = {
      resources: [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(refStr), pathStr])],
      actions: cdk.Fn.split(',', cdk.Fn.ref(actionStr)),
      effect,
    };
    // policy document
    const policyDocument = new iamCdk.PolicyDocument();
    // policy statement
    const policyStatement = new iamCdk.PolicyStatement(props);
    policyDocument.addStatements(policyStatement);
    return policyDocument;
  }

  /**
   * create multi statement IAM policyDocument
   */
  createMultiStatementIAMPolicyDocument = (policyStatements: Array<IAmplifyIamPolicyStatementParams>): iamCdk.PolicyDocument => {
    const policyDocument = new iamCdk.PolicyDocument();
    policyStatements.forEach(policyStatement => {
      const props: iamCdk.PolicyStatementProps = {
        resources: policyStatement.pathStr
          ? [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(policyStatement.refStr), policyStatement.pathStr])]
          : [cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref(policyStatement.refStr)])],
        conditions: policyStatement.conditions,
        actions: policyStatement.actions,
        effect: policyStatement.effect,
      };
      const statement = new iamCdk.PolicyStatement(props);
      // Add Statement to Policy
      policyDocument.addStatements(statement);
    });
    return policyDocument;
  }

  /** *************************************************************************************************
   *  Lambda Trigger Permissions : Allow S3 to invoke the trigger function
   ***************************************************************************************************/
  createInvokeFunctionS3Permission(logicalId: string, triggerFunctionName: string): lambdaCdk.CfnPermission {
    const sourceArn = cdk.Fn.join('', ['arn:aws:s3:::', this.buildBucketName()]);

    const resourceDefinition: lambdaCdk.CfnPermissionProps = {
      action: 'lambda:InvokeFunction',
      functionName: cdk.Fn.ref(`function${triggerFunctionName}Name`),
      principal: 's3.amazonaws.com',
      sourceAccount: cdk.Fn.ref('AWS::AccountId'),
      sourceArn,
    };
    const lambdaPermission = new lambdaCdk.CfnPermission(this, logicalId, resourceDefinition);
    return lambdaPermission;
  }

  /** *************************************************************************************************
   *  IAM Policies - Control Auth and Guest access to S3 bucket using Cognito Identity Pool
   *
   * Note :- Currently S3 doesn't have direct integration with Cognito for access control to S3 bucket.
   * We need to make cognito work with S3 for App clients. The following polcies are tied to the roles
   * attached to the cognito identity pool.
   * ************************************************************************************************/
  // S3AuthPublicPolicy
  createS3AuthPublicPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3AuthPublicPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3PublicPolicy',
      roleRefs: ['authRoleName'],
      condition: this.conditions.CreateAuthPublic,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/public/*',
          actions: ['s3PermissionsAuthenticatedPublic'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  // S3AuthProtectedPolicy
  /**
   * creates IAM policy for protected Users
   */
  createS3AuthProtectedPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3AuthProtectedPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3ProtectedPolicy',
      roleRefs: ['authRoleName'],
      condition: this.conditions.CreateAuthProtected,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/protected/${cognito-identity.amazonaws.com:sub}/*',
          actions: ['s3PermissionsAuthenticatedProtected'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  /**
   * IAM policy for Auth private users
   */
  createS3AuthPrivatePolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3AuthPrivatePolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3PrivatePolicy',
      roleRefs: ['authRoleName'],
      condition: this.conditions.CreateAuthPrivate,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/private/${cognito-identity.amazonaws.com:sub}/*',
          actions: ['s3PermissionsAuthenticatedPrivate'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  /**
   * creates S3 uploads IAM policy
   */
  createS3AuthUploadPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3AuthUploadPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3UploadsPolicy',
      roleRefs: ['authRoleName'],
      condition: this.conditions.CreateAuthUploads,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/uploads/*',
          actions: ['s3PermissionsAuthenticatedUploads'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  /**
   * creates public IAM policy for guest users
   */
  createS3GuestPublicPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3GuestPublicPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3PublicPolicy',
      roleRefs: ['unauthRoleName'],
      condition: this.conditions.CreateGuestPublic,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/public/*',
          actions: ['s3PermissionsGuestPublic'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  /**
   * creates upload IAM policy for guest users
   */
  createGuestUploadsPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3GuestUploadPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3UploadsPolicy',
      roleRefs: ['unauthRoleName'],
      condition: this.conditions.CreateGuestUploads,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/uploads/*',
          actions: ['s3PermissionsGuestUploads'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy = this.createIAMPolicy(policyDefinition, true /* action is Ref*/);
    return policy;
  }

  /**
   * creates read IAM policy for Authenticated users
   */
  createS3AuthReadPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3AuthReadPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3ReadPolicy',
      roleRefs: ['authRoleName'],
      condition: this.conditions.CreateAuthReadAndList,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/protected/*',
          actions: ['s3:GetObject'],
          effect: iamCdk.Effect.ALLOW,
        },
        {
          refStr: 'S3Bucket',
          actions: ['s3:ListBucket'],
          conditions: {
            StringLike: {
              's3:prefix': [
                'public/',
                'public/*',
                'protected/',
                'protected/*',
                'private/${cognito-identity.amazonaws.com:sub}/',
                'private/${cognito-identity.amazonaws.com:sub}/*',
              ],
            },
          },
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };

    const policy: iamCdk.CfnPolicy = this.createMultiStatementIAMPolicy(policyDefinition);
    return policy;
  }

  /**
   * create read IAM policy for Guest users
   */
  createS3GuestReadPolicy = (): iamCdk.CfnPolicy => {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId: 'S3GuestReadPolicy',
      isPolicyNameAbsolute: false,
      policyNameRef: 's3ReadPolicy',
      roleRefs: ['unauthRoleName'],
      condition: this.conditions.CreateGuestReadAndList,
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '/protected/*',
          actions: ['s3:GetObject'],
          effect: iamCdk.Effect.ALLOW,
        },
        {
          refStr: 'S3Bucket',
          actions: ['s3:ListBucket'],
          conditions: {
            StringLike: {
              's3:prefix': ['public/', 'public/*', 'protected/', 'protected/*'],
            },
          },
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket], // - Not required since refStr implicitly adds this
    };
    const policy: iamCdk.CfnPolicy = this.createMultiStatementIAMPolicy(policyDefinition);
    return policy;
  }

  /**
   * Policy Definition to trigger the given function from the S3Bucket
   */
  private createTriggerPolicyDefinition(logicalId: string, triggerFunctionName: string): IAmplifyPolicyDefinition {
    const policyDefinition: IAmplifyPolicyDefinition = {
      logicalId,
      isPolicyNameAbsolute: true, // set if policyName is not a reference
      policyNameRef: 'amplify-lambda-execution-policy-storage',
      roleRefs: [`function${triggerFunctionName}LambdaExecutionRole`],
      statements: [
        {
          refStr: 'S3Bucket',
          pathStr: '',
          isActionAbsolute: true, // actions are not refs
          actions: ['s3:ListBucket'],
          effect: iamCdk.Effect.ALLOW,
        },
        {
          refStr: 'S3Bucket',
          pathStr: '/*',
          isActionAbsolute: true, // actions are not refs
          actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
          effect: iamCdk.Effect.ALLOW,
        },
      ],
      dependsOn: [this.s3Bucket],
    };
    return policyDefinition;
  }

  /**
   * adds s3 trigger IAM policy definition
   */
  addFunctionToTriggerPolicyDefinition = (policyDefinition: IAmplifyPolicyDefinition, functionName: string): IAmplifyPolicyDefinition => {
    const newRoleRef = `function${functionName}LambdaExecutionRole`;
    const newPolicyDefinition = policyDefinition;
    if (policyDefinition.roleRefs && policyDefinition.roleRefs.includes(newRoleRef)) {
      return policyDefinition;
    }
    newPolicyDefinition.roleRefs = policyDefinition.roleRefs ? policyDefinition.roleRefs.concat([newRoleRef]) : [newRoleRef];
    return newPolicyDefinition;
  }

  /**
   * S3TriggerBucketPolicy - Policy to control trigger function access to S3 bucket
   */
  createTriggerPolicyFromPolicyDefinition = (policyDefinition: IAmplifyPolicyDefinition): iamCdk.CfnPolicy => {
    const policy: iamCdk.CfnPolicy = this.createIAMPolicy(policyDefinition, false /* action is array*/);
    return policy;
  }

  /**
  *   helper: builder for policy statement resource
  */
  buildResourceFromPolicyDefinition = (policyDefinitionStatement : IAmplifyIamPolicyStatementParams): $TSAny => {
    const resourceStrArr = ['arn:aws:s3:::', { Ref: policyDefinitionStatement.refStr }];
    if (policyDefinitionStatement.pathStr && policyDefinitionStatement.pathStr.length > 0) {
      resourceStrArr.push(policyDefinitionStatement.pathStr);
    }
    return {
      'Fn::Join': [
        '',
        resourceStrArr,
      ],
    };
  }

  /**
   * build IAM action from IAM policy definition
   */
  buildActionFromPolicyDefinition = (policyDefinitionStatement : IAmplifyIamPolicyStatementParams, IsActionRef : boolean): $TSAny => {
    if (!policyDefinitionStatement.actions) {
      return [];
    }
    if (!policyDefinitionStatement.isActionAbsolute && IsActionRef === true) {
      // IsActionRef is true, when : The action provided is a Ref to concatenated string of command separated permissions
      const actionRef = policyDefinitionStatement.actions[0];
      const actions = {
        'Fn::Split': [
          ',',
          {
            Ref: actionRef,
          },
        ],
      };
      return actions;
    }
    // isActionAbsolute is true or actionRef is false, when : The action provided is an array of action strings. e.g Triggers
    return policyDefinitionStatement.actions;
  }

  /**
   * Helper:: function to create single statement IAM policy & bind to the App's stack
   */
  createIAMPolicy(policyDefinition: IAmplifyPolicyDefinition, actionRef: boolean): iamCdk.CfnPolicy {
    const policyL1: $TSObject = {};
    // Policy Properties
    policyL1.Properties = {};
    // 1. Property: PolicyName
    if (policyDefinition.isPolicyNameAbsolute) {
      policyL1.Properties.policyName = policyDefinition.policyNameRef;
    } else {
      policyL1.Properties.policyName = {
        Ref: policyDefinition.policyNameRef,
      };
    }
    // 2. Property: Roles
    policyL1.Properties.roles = policyDefinition.roleRefs.map(roleRef => ({
      Ref: roleRef,
    }));
    // 3. Property: PolicyDocument
    policyL1.Properties.policyDocument = {
      Version: '2012-10-17',
      Statement: [],
    };

    const policyStatements = []; // Build each statement from the policyDefinitionStatement
    for (const policyDefinitionStatement of policyDefinition.statements) {
      const policyStatement:$TSAny = {};
      // 3.1.0 Property: PolicyDocument.Statement.Effect
      policyStatement.Effect = policyDefinitionStatement.effect;

      // 3.1.1 Property: PolicyDocument.Statement.Action
      if (policyDefinitionStatement.actions) {
        policyStatement.Action = this.buildActionFromPolicyDefinition(policyDefinitionStatement, actionRef);
      }
      // 3.1.2 Property: PolicyDocument.Statement.Resource
      policyStatement.Resource = [this.buildResourceFromPolicyDefinition(policyDefinitionStatement)];
      policyStatements.push(policyStatement);
    } /** end build policyStatements */

    policyL1.Properties.policyDocument.Statement = policyStatements;
    const policy = new iamCdk.CfnPolicy(this, policyDefinition.logicalId, policyL1.Properties);
    if (policyDefinition.dependsOn) {
      policyDefinition.dependsOn.map(dependency => policy.addDependsOn(dependency));
    }
    if (policyDefinition.condition) {
      policy.cfnOptions.condition = policyDefinition.condition;
    }
    return policy;
  }

  /**
   * Helper:: function to create multi-statement IAM policy & bind to the App's stack
   */
  createMultiStatementIAMPolicy = (policyDefinition: IAmplifyPolicyDefinition):iamCdk.CfnPolicy => {
    const props: iamCdk.CfnPolicyProps = {
      policyName: cdk.Fn.ref(policyDefinition.policyNameRef),
      roles: policyDefinition.roleRefs.map(roleRef => cdk.Fn.ref(roleRef as string)),
      policyDocument: this.createMultiStatementIAMPolicyDocument(policyDefinition.statements),
    };
    const policy = new iamCdk.CfnPolicy(this, policyDefinition.logicalId, props); // bind policy to stack
    if (policyDefinition.dependsOn) {
      policyDefinition.dependsOn.map(dependency => policy.addDependsOn(dependency));
    }
    if (policyDefinition.condition) {
      policy.cfnOptions.condition = policyDefinition.condition;
    }
    return policy;
  }

  /**
   * Helper:: function to create Cognito Group IAM policy & bind to the App's stack
   */
  createS3AmplifyGroupPolicies(authResourceName: string, groupList: string[], groupPolicyMap: GroupAccessType): Array<iamCdk.CfnPolicy> {
    const groupPolicyList: Array<iamCdk.CfnPolicy> = [];
    // Build policy statement
    for (const groupName of groupList) {
      const logicalID = this.buildGroupPolicyLogicalID(groupName);
      const groupPolicyName = this.buildGroupPolicyName(groupName);
      const policyStatementList = this._buildCDKGroupPolicyStatements(groupPolicyMap[groupName]); // convert permissions to statements
      const props: iamCdk.CfnPolicyProps = {
        policyName: groupPolicyName,
        roles: this.buildCDKGroupRoles(groupName, authResourceName),
        policyDocument: this._buildCDKGroupPolicyDocument(policyStatementList),
      };
      const groupPolicy: iamCdk.CfnPolicy = new iamCdk.CfnPolicy(this, logicalID, props);
      groupPolicyList.push(groupPolicy);
    }
    return groupPolicyList;
  }

  /** ************************************************************************************************
   *  END IAM Policies - Control Auth and Guest access to S3 bucket using Cognito Identity Pool
   * ***********************************************************************************************/

  /**
   * Helper:: create logical ID from groupName
   */
  buildGroupPolicyLogicalID = (groupName: string): string => `${groupName}GroupPolicy`

  /**
   * Helper:: create policyName from groupName
   */
  buildGroupPolicyName = (groupName: string): string => `${groupName}-group-s3-policy`

  /**
   * Helper:: create group Role name from groupName
   */
  buildGroupRoleName = (groupName: string): string => `${groupName}GroupRole`

  /**
   * Helper:: create CDK Group-Role name from groupName and cognito ARN
   */
  public buildCDKGroupRoles = (groupName: string, authResourceName: string): string[] => {
    const roles = [cdk.Fn.join('', [cdk.Fn.ref(`auth${authResourceName}UserPoolId`), `-${this.buildGroupRoleName(groupName)}`])];
    return roles;
  }

  /**
   * Helper:: Create Group permissions into CDK policy statements
   */
  _buildCDKGroupPolicyStatements = (groupPerms: S3PermissionType[]): iamCdk.PolicyStatement[] => {
    const policyStatementList: Array<iamCdk.PolicyStatement> = [];
    const bucketArn = cdk.Fn.join('', ['arn:aws:s3:::', cdk.Fn.ref('S3Bucket')]).toString();
    const permissions: S3CFNPermissionType[] = S3InputState.getCfnPermissionsFromInputPermissions(groupPerms);
    policyStatementList.push(
      new iamCdk.PolicyStatement({
        resources: [`${bucketArn}/*`],
        actions: permissions,
        effect: iamCdk.Effect.ALLOW,
      }),
    );
    if (groupPerms.includes(S3PermissionType.READ)) {
      policyStatementList.push(
        new iamCdk.PolicyStatement({
          resources: [`${bucketArn}`],
          actions: [S3CFNPermissionType.LIST],
          effect: iamCdk.Effect.ALLOW,
        }),
      );
    }
    return policyStatementList;
  }

  /**
   * Helper:: Create PolicyDocument from policyStatement list
   */
  _buildCDKGroupPolicyDocument = (policyStatementList: iamCdk.PolicyStatement[]): iamCdk.PolicyDocument => {
    const policyDocument = new iamCdk.PolicyDocument();
    policyStatementList.forEach(policyStatement => {
      // Add Statement to Policy
      policyDocument.addStatements(policyStatement);
    });
    return policyDocument;
  }

  /**
   * Helper: Add CFN Resource Param definitions as CfnParameter
   */
  _setCFNParams = (paramDefinitions: AmplifyCfnParamType): void => {
    paramDefinitions.params.forEach(paramName => {
      // set param type
      const cfnParam: $TSAny = {
        type: paramDefinitions.paramType,
      };
      // set param default if provided
      if (paramDefinitions.default) {
        cfnParam.default = paramDefinitions.default;
      }
      // configure param in resource template object
      this.addCfnParameter(cfnParam, paramName);
    });
  }

  /**
   * Helper: Get DependsOn CFN to add Function as dependency on S3Bucket.
   */
  buildS3DependsOnFunctionCfn = (functionName: string): S3CFNDependsOn => {
    const s3DependsOnLambda: S3CFNDependsOn = {
      category: 'function',
      resourceName: functionName,
      attributes: ['Name', 'Arn', 'LambdaExecutionRole'],
    };
    return s3DependsOnLambda;
  }

  /**
   *Helper: Get DependsOn CFN to add Auth as dependency on S3Bucket
   */
  buildS3DependsOnUserPoolIdCfn = (authResourceName: string): S3CFNDependsOn => {
    const dependsOnAuth: S3CFNDependsOn = {
      category: 'auth',
      resourceName: authResourceName,
      attributes: ['UserPoolId'],
    };
    return dependsOnAuth;
  }

  /**
   * Helper: builds dependsOn CFN to add Auth userpool groups as dependency on S3Bucket
   */
  buildS3DependsOnUserPoolGroupRoleListCfn = (selectedUserPoolGroupList: Array<string>): Array<S3CFNDependsOn> => {
    if (selectedUserPoolGroupList && selectedUserPoolGroupList.length > 0) {
      const userPoolGroupRoleList = selectedUserPoolGroupList.map((groupName: string) => {
        const dependsOnAuth: S3CFNDependsOn = {
          category: 'auth',
          resourceName: 'userPoolGroups',
          attributes: [`${groupName}GroupRole`],
        };
        return dependsOnAuth;
      });
      return userPoolGroupRoleList;
    }
    return [];
  }
}

// Constants and Interfaces
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const S3_ROOT_CFN_DESCRIPTION = 'S3 Resource for AWS Amplify CLI';

/**
 * amplify IAM policy interface
 */
export interface IAmplifyIamPolicyStatementParams {
  refStr: string;
  conditions?: $TSObject;
  pathStr?: string;
  isActionAbsolute?: boolean;
  actions?: Array<string>;
  effect: iamCdk.Effect;
}

/**
 * amplify IAM policy definition interface
 */
interface IAmplifyPolicyDefinition {
  logicalId: string;
  isPolicyNameAbsolute?: boolean;
  policyNameRef: string;
  roleRefs: Array<string>;
  condition?: cdk.CfnCondition;
  statements: Array<IAmplifyIamPolicyStatementParams>;
  dependsOn?: Array<cdk.CfnResource>;
}

type AmplifyS3Conditions = Record<string, cdk.CfnCondition>;

type AmplifyS3CfnParameters = Record<string, cdk.CfnParameter>;

// force major version bump for cdk v2

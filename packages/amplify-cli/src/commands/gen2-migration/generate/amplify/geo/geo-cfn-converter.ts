import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import CFNConditionResolver from '../analytics/cfn-condition-resolver';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';

/**
 * Geo service type from Gen1 amplify-meta.json.
 */
export type GeoServiceName = 'Map' | 'PlaceIndex' | 'GeofenceCollection';

/**
 * Provider metadata for a Gen1 geo resource.
 */
export interface GeoProviderMetadata {
  readonly s3TemplateURL: string;
  readonly logicalId: string;
}

/**
 * Base fields common to all geo codegen results.
 */
interface GeoCodegenResultBase {
  readonly constructClassName: string;
  readonly constructFileName: string;
  readonly resourceName: string;
  readonly gen1ResourceName: string;
  readonly gen1Actions: readonly string[];
  readonly userPoolIdParamName: string;
  readonly groupRoles: ReadonlyArray<{ readonly paramName: string; readonly groupName: string }>;
  readonly isDefault: string;
}

export interface MapCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'Map';
  readonly mapName: string;
  readonly mapStyle: string;
}

export interface PlaceIndexCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'PlaceIndex';
  readonly indexName: string;
  readonly dataProvider: string;
  readonly dataSourceIntendedUse: string;
}

export interface GeofenceCollectionCodegenResult extends GeoCodegenResultBase {
  readonly serviceName: 'GeofenceCollection';
  readonly collectionName: string;
}

export type GeoCodegenResult = MapCodegenResult | PlaceIndexCodegenResult | GeofenceCollectionCodegenResult;

/**
 * Converts geo CloudFormation templates to CDK constructs using cdk-from-cfn.
 *
 * Handles all three geo service types (Map, PlaceIndex, GeofenceCollection).
 * Downloads the nested stack's CFN template from S3, resolves conditions,
 * fixes Fn::FindInMap dictionary lookups, and runs cdk-from-cfn to produce
 * a TypeScript CDK construct file.
 */
export class GeoCfnConverter {
  private readonly dir: string;
  private readonly fileWriter: (content: string, filePath: string) => Promise<void>;
  private readonly s3Client: S3Client;
  private readonly cfnClient?: CloudFormationClient;
  private readonly rootStackName?: string;

  public constructor(
    dir: string,
    fileWriter: (content: string, filePath: string) => Promise<void>,
    s3Client: S3Client,
    cfnClient?: CloudFormationClient,
    rootStackName?: string,
  ) {
    this.dir = dir;
    this.fileWriter = fileWriter;
    this.s3Client = s3Client;
    this.cfnClient = cfnClient;
    this.rootStackName = rootStackName;
  }

  /**
   * Converts a geo CloudFormation template to a CDK L1 construct.
   */
  public async generateGeoL1Code(
    resourceName: string,
    service: GeoServiceName,
    providerMetadata: GeoProviderMetadata,
    gen1EnvName: string,
  ): Promise<GeoCodegenResult> {
    const constructFileName = `${resourceName}-construct`;
    const filePath = path.join(this.dir, 'amplify', 'geo', resourceName, `${constructFileName}.ts`);
    const template = await getCfnTemplateFromS3(providerMetadata.s3TemplateURL, this.s3Client);
    const nestedStackLogicalId = providerMetadata.logicalId;

    const parameters = await this.getNestedStackParameters(nestedStackLogicalId);
    const finalTemplate = await this.preTransmute(template, nestedStackLogicalId);
    const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', nestedStackLogicalId, 'construct');
    const fixedTsFile = this.postTransmute(tsFile);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const prettier = await import('prettier');
    const formatted = prettier.format(fixedTsFile, {
      parser: 'typescript',
      singleQuote: true,
      tabWidth: 2,
      printWidth: 80,
    });
    await this.fileWriter(formatted, filePath);

    const classNameMatch = fixedTsFile.match(/export class (\w+) extends/);
    if (!classNameMatch) {
      throw new Error(`Failed to extract class name from generated construct for geo resource: ${resourceName}`);
    }
    const constructClassName = classNameMatch[1];

    const paramMap = new Map(
      parameters
        .filter(
          (p): p is { ParameterKey: string; ParameterValue: string } => p.ParameterKey !== undefined && p.ParameterValue !== undefined,
        )
        .map((p) => [p.ParameterKey, p.ParameterValue]),
    );

    let userPoolIdParamName = '';
    const groupRoles: Array<{ readonly paramName: string; readonly groupName: string }> = [];
    for (const [key] of paramMap) {
      if (key.startsWith('auth') && key.endsWith('UserPoolId')) {
        userPoolIdParamName = key;
      } else if (key.startsWith('authuserPoolGroups') && key.endsWith('GroupRole')) {
        const groupName = key.slice('authuserPoolGroups'.length, -'GroupRole'.length);
        groupRoles.push({ paramName: key, groupName });
      }
    }

    const base: GeoCodegenResultBase = {
      constructClassName,
      constructFileName,
      resourceName,
      gen1ResourceName: `${resourceName}-${gen1EnvName}`,
      gen1Actions: extractGen1Actions(template),
      userPoolIdParamName,
      groupRoles,
      isDefault: paramMap.get('isDefault') ?? 'false',
    };

    switch (service) {
      case 'Map':
        return {
          ...base,
          serviceName: 'Map',
          mapName: paramMap.get('mapName') ?? resourceName,
          mapStyle: paramMap.get('mapStyle') ?? '',
        };
      case 'PlaceIndex':
        return {
          ...base,
          serviceName: 'PlaceIndex',
          indexName: paramMap.get('indexName') ?? resourceName,
          dataProvider: paramMap.get('dataProvider') ?? '',
          dataSourceIntendedUse: paramMap.get('dataSourceIntendedUse') ?? '',
        };
      case 'GeofenceCollection':
        return {
          ...base,
          serviceName: 'GeofenceCollection',
          collectionName: paramMap.get('collectionName') ?? resourceName,
        };
      default: {
        const _exhaustiveCheck: never = service;
        throw new Error(`Unsupported geo service type: ${_exhaustiveCheck}`);
      }
    }
  }

  private async getNestedStackPhysicalName(logicalId: string): Promise<string | undefined> {
    if (!this.cfnClient || !this.rootStackName) return undefined;

    const response = await this.cfnClient.send(
      new DescribeStackResourcesCommand({ StackName: this.rootStackName, LogicalResourceId: logicalId }),
    );
    return response.StackResources?.[0]?.PhysicalResourceId;
  }

  private async getNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    if (!this.cfnClient || !this.rootStackName) return [];

    const nestedStackName = await this.getNestedStackPhysicalName(logicalId);
    if (!nestedStackName) return [];

    const response = await this.cfnClient.send(new DescribeStacksCommand({ StackName: nestedStackName }));
    return response.Stacks?.[0]?.Parameters ?? [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async preTransmute(template: any, logicalId: string): Promise<any> {
    const result = JSON.parse(JSON.stringify(template));

    // Rename env → branchName
    if (result.Parameters?.env) {
      result.Parameters['branchName'] = result.Parameters.env;
      delete result.Parameters.env;
    }

    const updateRefs = (obj: unknown): void => {
      if (typeof obj === 'object' && obj !== null) {
        const record = obj as Record<string, unknown>;
        if (record.Ref === 'env') {
          record.Ref = 'branchName';
        }
        Object.values(record).forEach(updateRefs);
      }
    };
    updateRefs(result.Resources);

    // Replace Fn::Join patterns that construct group role names from
    // UserPoolId + GroupRole with direct Ref to the GroupRole parameter.
    // This preserves CDK tokens for cross-stack dependency tracking.
    if (result.Parameters) {
      const groupRoleParams = Object.keys(result.Parameters).filter(
        (key: string) => key.startsWith('authuserPoolGroups') && key.endsWith('GroupRole'),
      );

      const replaceGroupRoleJoins = (obj: unknown): void => {
        if (typeof obj !== 'object' || obj === null) return;
        const record = obj as Record<string, unknown>;

        for (const [key, value] of Object.entries(record)) {
          if (typeof value === 'object' && value !== null && 'Fn::Join' in value) {
            const joinValue = value as { 'Fn::Join': [string, unknown[]] };
            const [separator, parts] = joinValue['Fn::Join'];
            if (
              separator === '-' &&
              Array.isArray(parts) &&
              parts.length === 2 &&
              typeof parts[0] === 'object' &&
              parts[0] !== null &&
              'Ref' in parts[0] &&
              typeof parts[1] === 'string' &&
              parts[1].endsWith('GroupRole')
            ) {
              const groupRoleSuffix = parts[1];
              const matchingParam = groupRoleParams.find((p) => p.endsWith(groupRoleSuffix));
              if (matchingParam) {
                record[key] = { Ref: matchingParam };
              }
            }
          } else {
            replaceGroupRoleJoins(value);
          }
        }
      };
      replaceGroupRoleJoins(result.Resources);
    }

    // Resolve CFN conditions using deployed stack parameters
    const parameters = await this.getNestedStackParameters(logicalId);
    if (parameters.length > 0) {
      const resolved = new CFNConditionResolver(result).resolve(parameters);
      delete resolved.Conditions;
      return resolved;
    }

    return result;
  }

  /**
   * Fixes Fn::FindInMap dictionary lookups generated by cdk-from-cfn.
   *
   * cdk-from-cfn translates CFN Fn::FindInMap into plain dictionary lookups
   * which fail at CDK synth time because this.region is a CDK Token.
   * This replaces them with cdk.CfnMapping + findInMap() calls.
   */
  private postTransmute(tsCode: string): string {
    const mappingVarNames: string[] = [];
    let result = tsCode.replace(
      /const (\w+):\s*Record<string,\s*Record<string,\s*string>>\s*=\s*\{([\s\S]*?)\n(\s*)\};/g,
      (_match, varName: string, mappingBody: string, indent: string) => {
        mappingVarNames.push(varName);
        const constructId = varName.charAt(0).toUpperCase() + varName.slice(1);
        return `const ${varName} = new cdk.CfnMapping(this, '${constructId}', {\n${indent}    mapping: {${mappingBody}\n${indent}    },\n${indent}});`;
      },
    );

    for (const varName of mappingVarNames) {
      const lookupRegex = new RegExp(`${varName}\\[([^\\]]+)\\]\\[(['"])([^'"]+)\\2\\]`, 'g');
      result = result.replace(lookupRegex, (_match, expr: string, quote: string, key: string) => {
        return `${varName}.findInMap(${expr}, ${quote}${key}${quote})`;
      });
    }

    return result;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCfnTemplateFromS3(s3Url: string, s3Client: S3Client): Promise<any> {
  const url = new URL(s3Url);
  let bucket: string;
  let key: string;

  const virtualHostMatch = url.hostname.match(/^(.+)\.s3[.-].*\.amazonaws\.com$/);

  if (virtualHostMatch) {
    bucket = virtualHostMatch[1];
    key = url.pathname.slice(1);
  } else {
    const splitPath = url.pathname.split('/');
    bucket = splitPath[1];
    key = splitPath.slice(2).join('/');
  }

  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error(`Failed to retrieve S3 object: ${s3Url}`);
  }
  return JSON.parse(await response.Body.transformToString());
}

/**
 * Extracts the user-facing geo IAM actions from a Gen1 CloudFormation template.
 *
 * Finds the IAM policy resource whose Statement grants access to the geo
 * resource itself (not the Lambda execution role policy). The distinguishing
 * characteristic is that the Roles array references auth/unauth/group roles
 * (i.e., the Roles contain Ref values that are not the Lambda execution role).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGen1Actions(template: any): readonly string[] {
  const resources = template?.Resources ?? {};

  for (const resource of Object.values(resources)) {
    const r = resource as Record<string, unknown>;
    if (r.Type !== 'AWS::IAM::Policy') continue;

    const props = r.Properties as Record<string, unknown> | undefined;
    if (!props) continue;

    const statements = (props.PolicyDocument as Record<string, unknown>)?.Statement;
    if (!Array.isArray(statements) || statements.length === 0) continue;

    const actions = statements[0].Action;
    if (!Array.isArray(actions)) continue;

    // The user-facing policy has geo:Get*, geo:Search*, geo:Put*, geo:List*, geo:Batch* actions
    // but NOT lifecycle actions like geo:Create*, geo:Update*, geo:Delete*
    const isUserFacing = (actions as string[]).every(
      (a: string) => a.startsWith('geo:') && !a.startsWith('geo:Create') && !a.startsWith('geo:Update') && !a.startsWith('geo:Delete'),
    );

    if (isUserFacing) {
      return actions as string[];
    }
  }

  return [];
}

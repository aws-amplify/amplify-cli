import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import CFNConditionResolver from '../analytics/cfn-condition-resolver';
import { DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { DiscoveredResource, Gen1App } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { GeoResourceRenderer } from './geo-resource.renderer';
import { GeoResourceProps, GeoGenerator } from './geo.generator';

/**
 * Base class for geo sub-resource generators.
 * Handles the common logic of converting CFN, rendering, and contributing
 * the codegen result to the GeoGenerator.
 *
 * Sub-classes implement buildCodegenResult() to produce the service-specific
 * codegen result from the base result and parameter map.
 */
export abstract class GeoResourceGenerator implements Planner {
  protected readonly gen1App: Gen1App;
  protected readonly outputDir: string;
  protected readonly resource: DiscoveredResource;
  protected readonly geoGenerator: GeoGenerator;
  private readonly renderer = new GeoResourceRenderer();

  protected constructor(gen1App: Gen1App, outputDir: string, resource: DiscoveredResource, geoGenerator: GeoGenerator) {
    this.gen1App = gen1App;
    this.outputDir = outputDir;
    this.resource = resource;
    this.geoGenerator = geoGenerator;
  }

  /**
   * Builds the service-specific codegen result from the common base
   * and the raw parameter map.
   */
  protected abstract addResource(base: GeoResourceProps, parameters: ReadonlyMap<string, string>): GeoResourceProps;

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const resourceName = this.resource.resourceName;
    const geoCategory = this.gen1App.meta('geo');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resourceMeta = geoCategory[resourceName] as any;
    const geoDir = path.join(this.outputDir, 'amplify', 'geo');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/geo/${resourceName}/resource.ts`],
        execute: async () => {
          const { props, parameters } = await this.generateBase(resourceMeta.logicalId);
          const resource = this.addResource(props, parameters);
          const nodes = this.renderer.render(resource);
          const content = TS.printNodes(nodes);

          const resourceDir = path.join(geoDir, resourceName);
          await fs.mkdir(resourceDir, { recursive: true });
          await fs.writeFile(path.join(resourceDir, 'resource.ts'), content, 'utf-8');
        },
      },
    ];
  }

  /**
   * Generates the CDK construct file and returns the common base result
   * plus the raw parameter map for service-specific extraction.
   */
  private async generateBase(
    nestedStackLogicalId: string,
  ): Promise<{ readonly props: GeoResourceProps; readonly parameters: ReadonlyMap<string, string> }> {
    const constructFileName = `${this.resource.resourceName}-construct`;
    const filePath = path.join(this.outputDir, 'amplify', 'geo', this.resource.resourceName, `${constructFileName}.ts`);
    const template = this.gen1App.json(`geo/${this.resource.resourceName}/${this.resource.resourceName}-cloudformation-template.json`);

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
    const fileWriter = async (content: string, fp: string): Promise<void> => {
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, content, 'utf-8');
    };
    await fileWriter(formatted, filePath);

    const classNameMatch = fixedTsFile.match(/export class (\w+) extends/);
    if (!classNameMatch) {
      throw new Error(`Failed to extract class name from generated construct for geo resource: ${this.resource.resourceName}`);
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

    const base: GeoResourceProps = {
      constructClassName,
      constructFileName,
      resourceName: this.resource.resourceName,
      userPoolIdParamName,
      groupRoles,
      isDefault: paramMap.get('isDefault') ?? 'false',
      needsAuthAndUnauthRoles: false,
      serviceSpecificProps: [],
    };

    return { props: base, parameters: paramMap };
  }

  private async getNestedStackPhysicalName(logicalId: string): Promise<string | undefined> {
    const cfnClient = this.gen1App.clients.cloudFormation;
    const rootStackName = this.gen1App.rootStackName;
    if (!cfnClient || !rootStackName) return undefined;

    const response = await cfnClient.send(new DescribeStackResourcesCommand({ StackName: rootStackName, LogicalResourceId: logicalId }));
    return response.StackResources?.[0]?.PhysicalResourceId;
  }

  private async getNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    const cfnClient = this.gen1App.clients.cloudFormation;
    const rootStackName = this.gen1App.rootStackName;
    if (!cfnClient || !rootStackName) return [];

    const nestedStackName = await this.getNestedStackPhysicalName(logicalId);
    if (!nestedStackName) return [];

    const response = await cfnClient.send(new DescribeStacksCommand({ StackName: nestedStackName }));
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

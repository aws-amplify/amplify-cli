import { Gen2EnvRef } from '../types/gen2-types';

export interface CDKEnvRef {
  pattern: string;
  context: string;
}

export interface AmplifyHelper {
  method: string;
  args: any[];
  context: string;
}

export interface CDKIntrinsic {
  function: string;
  parameters: any[];
  context: string;
}

export interface Gen2EnvPattern {
  pattern: string;
  replacement: string;
}

export interface Gen2ResourceRef {
  import: string;
  reference: string;
}

export interface Gen2Equivalent {
  original: string;
  gen2Code: string;
}

export interface EnvironmentMigrator {
  mapGen1EnvVars(envRefs: CDKEnvRef[]): Gen2EnvPattern[];
  mapAmplifyHelpers(helpers: AmplifyHelper[]): Gen2ResourceRef[];
  handleCDKIntrinsics(intrinsics: CDKIntrinsic[]): Gen2Equivalent[];
}

export class EnvironmentMigratorImpl implements EnvironmentMigrator {
  mapGen1EnvVars(envRefs: CDKEnvRef[]): Gen2EnvPattern[] {
    const envMappings: Record<string, string> = {
      "${cdk.Fn.ref('env')}": 'process.env.AMPLIFY_ENV',
      '${AWS::StackName}': 'process.env.AMPLIFY_ENV',
      '${AWS::Region}': 'stack.region',
      '${AWS::AccountId}': 'stack.account',
      '${env}': 'process.env.AMPLIFY_ENV',
      "cdk.Fn.ref('env')": 'process.env.AMPLIFY_ENV',
      "Fn.ref('env')": 'process.env.AMPLIFY_ENV',
    };

    return envRefs.map((envRef) => ({
      pattern: envRef.pattern,
      replacement: envMappings[envRef.pattern] || `process.env.${envRef.pattern.toUpperCase()}`,
    }));
  }

  mapAmplifyHelpers(helpers: AmplifyHelper[]): Gen2ResourceRef[] {
    return helpers.map((helper) => {
      switch (helper.method) {
        case 'getProjectInfo':
          return {
            import: '',
            reference: this.mapGetProjectInfo(helper.args),
          };

        case 'addResourceDependency':
          return {
            import: `import { ${helper.args[0]} } from './${helper.args[0]}';`,
            reference: `${helper.args[0]}.${helper.args[1] || 'outputs'}`,
          };

        case 'getResourceName':
          return {
            import: '',
            reference: `'${helper.args[0]}'`,
          };

        case 'getEnv':
          return {
            import: '',
            reference: 'process.env.AMPLIFY_ENV',
          };

        default:
          return {
            import: `// TODO: Manual migration needed for ${helper.method}`,
            reference: `/* ${helper.method}(${helper.args.join(', ')}) */`,
          };
      }
    });
  }

  handleCDKIntrinsics(intrinsics: CDKIntrinsic[]): Gen2Equivalent[] {
    return intrinsics.map((intrinsic) => {
      switch (intrinsic.function) {
        case 'Fn.ref':
          return {
            original: `cdk.Fn.ref('${intrinsic.parameters[0]}')`,
            gen2Code: this.mapFnRef(intrinsic.parameters[0]),
          };

        case 'Fn.getAtt':
          return {
            original: `cdk.Fn.getAtt('${intrinsic.parameters[0]}', '${intrinsic.parameters[1]}')`,
            gen2Code: `${intrinsic.parameters[0]}.getAtt('${intrinsic.parameters[1]}')`,
          };

        case 'Fn.join':
          return {
            original: `cdk.Fn.join('${intrinsic.parameters[0]}', ${JSON.stringify(intrinsic.parameters[1])})`,
            gen2Code: `${JSON.stringify(intrinsic.parameters[1])}.join('${intrinsic.parameters[0]}')`,
          };

        case 'Fn.sub':
          return {
            original: `cdk.Fn.sub('${intrinsic.parameters[0]}')`,
            gen2Code: this.mapFnSub(intrinsic.parameters[0]),
          };

        default:
          return {
            original: `cdk.${intrinsic.function}(${intrinsic.parameters.join(', ')})`,
            gen2Code: `// TODO: Manual migration for ${intrinsic.function}`,
          };
      }
    });
  }

  private mapGetProjectInfo(args: any[]): string {
    const infoType = args[0];

    const projectInfoMappings: Record<string, string> = {
      projectName: 'process.env.AMPLIFY_APP_NAME',
      envName: 'process.env.AMPLIFY_ENV',
      region: 'stack.region',
      accountId: 'stack.account',
    };

    return projectInfoMappings[infoType] || `process.env.AMPLIFY_${infoType.toUpperCase()}`;
  }

  private mapFnRef(parameter: string): string {
    const refMappings: Record<string, string> = {
      env: 'process.env.AMPLIFY_ENV',
      'AWS::Region': 'stack.region',
      'AWS::AccountId': 'stack.account',
      'AWS::StackName': 'process.env.AMPLIFY_ENV',
    };

    return refMappings[parameter] || `stack.${parameter}`;
  }

  private mapFnSub(template: string): string {
    let result = template;

    // Replace common substitution patterns
    const substitutions: Record<string, string> = {
      '${AWS::Region}': 'stack.region',
      '${AWS::AccountId}': 'stack.account',
      '${AWS::StackName}': 'process.env.AMPLIFY_ENV',
      '${env}': 'process.env.AMPLIFY_ENV',
    };

    Object.entries(substitutions).forEach(([pattern, replacement]) => {
      result = result.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '${' + replacement + '}');
    });

    return `\`${result}\``;
  }
}

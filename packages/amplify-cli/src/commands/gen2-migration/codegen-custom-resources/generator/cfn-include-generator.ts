import { promises as fs } from 'fs';
import * as path from 'path';

// Map Gen1 category names to Gen2 backend property names
const CATEGORY_MAP: Record<string, string> = {
  function: 'functions',
  api: 'data',
  storage: 'storage',
  auth: 'auth',
};

// Map Gen1 output attributes to Gen2 resource property paths
const ATTRIBUTE_MAP: Record<string, Record<string, string>> = {
  auth: {
    UserPoolId: 'userPool.userPoolId',
    UserPoolArn: 'userPool.userPoolArn',
    IdentityPoolId: 'identityPool.identityPoolId',
    AppClientID: 'userPoolClient.userPoolClientId',
    AppClientIDWeb: 'userPoolClient.userPoolClientId',
  },
  api: {
    GraphQLAPIIdOutput: 'cfnResources.cfnGraphqlApi.attrApiId',
    GraphQLAPIEndpointOutput: 'cfnResources.cfnGraphqlApi.attrGraphQlUrl',
    GraphQLAPIKeyOutput: 'cfnResources.cfnGraphqlApi.attrApiKey',
  },
  storage: {
    BucketName: 'bucket.bucketName',
    Arn: 'bucket.bucketArn',
  },
  function: {
    Name: 'lambda.functionName',
    Arn: 'lambda.functionArn',
    LambdaExecutionRole: 'lambda.role',
  },
};

interface ParsedParameter {
  originalName: string;
  category: string;
  gen2Category: string;
  gen2Path: string;
}

export class CfnIncludeGenerator {
  /**
   * Parses CFN parameter names to extract category and map to Gen2 paths
   * Parameter format: <category><resourceName><attribute> (e.g., storagemyBucketBucketName)
   */
  parseParameters(parameterNames: string[]): ParsedParameter[] {
    const parsed: ParsedParameter[] = [];
    const categories = Object.keys(ATTRIBUTE_MAP);

    for (const paramName of parameterNames) {
      if (paramName === 'env') continue;

      for (const category of categories) {
        if (!paramName.startsWith(category)) continue;

        const remainder = paramName.slice(category.length);
        const attributes = ATTRIBUTE_MAP[category];

        // Find matching attribute at the end of the parameter name
        for (const [attr, gen2Path] of Object.entries(attributes)) {
          if (remainder.endsWith(attr)) {
            const gen2Category = CATEGORY_MAP[category] || category;
            parsed.push({
              originalName: paramName,
              category,
              gen2Category,
              gen2Path: category === 'function' ? `resources.${gen2Path}` : `resources.${gen2Path}`,
            });
            break;
          }
        }
        break;
      }
    }

    return parsed;
  }

  /**
   * Generates resource.ts file that wraps a CloudFormation template with CfnInclude
   */
  async generateWrapper(
    resourceName: string,
    templatePath: string,
    outputDir: string,
  ): Promise<{ className: string; dependencies: string[] }> {
    const template = JSON.parse(await fs.readFile(templatePath, { encoding: 'utf-8' }));
    const parameterNames = Object.keys(template.Parameters || {});
    const parsedParams = this.parseParameters(parameterNames);

    // Get unique categories for constructor parameters
    const categories = [...new Set(parsedParams.map((p) => p.gen2Category))];

    // Generate class name
    const className = this.toPascalCase(resourceName) + 'CustomResource';

    // Generate constructor parameters
    const constructorParams = categories.map((cat) => `${cat}?: any`).join(', ');

    // Generate parameter mappings
    const paramMappings = parsedParams.map((p) => `        ${p.originalName}: ${p.gen2Category}?.${p.gen2Path},`).join('\n');

    const code = `import { Construct } from 'constructs';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import * as path from 'path';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export class ${className} extends Construct {
  public readonly template: CfnInclude;

  constructor(scope: Construct, id: string${constructorParams ? ', ' + constructorParams : ''}) {
    super(scope, id);

    this.template = new CfnInclude(this, 'Template', {
      templateFile: path.join(__dirname, 'template.json'),
      parameters: {
        env: branchName,
${paramMappings}
      },
    });
  }
}
`;

    await fs.writeFile(path.join(outputDir, 'resource.ts'), code, { encoding: 'utf-8' });

    return { className, dependencies: categories };
  }

  private toPascalCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, (_, c) => c.toUpperCase());
  }
}

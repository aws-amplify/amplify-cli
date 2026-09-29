import { Template } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { JSONUtilities } from './jsonUtilities';
import { AmplifyFault } from './errors/amplify-fault';

const defaultReadCFNTemplateOptions = { throwIfNotExist: true };

export function readCFNTemplate(filePath: string): { templateFormat: CFNTemplateFormat; cfnTemplate: Template };
export function readCFNTemplate(
  filePath: string,
  options: Partial<typeof defaultReadCFNTemplateOptions>,
): { templateFormat: CFNTemplateFormat; cfnTemplate: Template } | undefined;

/**
 * read the CloudFormation template at provided file path
 */
export function readCFNTemplate(filePath: string, options: Partial<typeof defaultReadCFNTemplateOptions> = defaultReadCFNTemplateOptions) {
  options = { ...defaultReadCFNTemplateOptions, ...options };

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile) {
    if (options.throwIfNotExist === false) {
      return undefined;
    }
    throw new AmplifyFault('CloudFormationTemplateFault', {
      message: `No CloudFormation template found at ${filePath}`,
      resolution: `Ensure the file exists and is a valid CloudFormation template.
File path should match the following pattern: '<projectRoot>/amplify/backend/<category>/<resourceName>/<resourceName>-cloudformation-template.json' where <resourceName> should match the value from <projectRoot>/amplify/team-provider-info.json.
If the resource directory was manually removed, run 'amplify remove <category>' to remove the resource from the project.`,
    });
  }
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // We use the first character to determine if the content is json or yaml because historically the CLI could
  // have emitted JSON with YML extension, so we can't rely on filename extension.
  const isJson = isJsonFileContent(fileContent);
  const cfnTemplate = isJson ? JSONUtilities.parse<Template>(fileContent) : (yaml.load(fileContent, { schema: CF_SCHEMA }) as Template);
  const templateFormat = isJson ? CFNTemplateFormat.JSON : CFNTemplateFormat.YAML;
  return { templateFormat, cfnTemplate };
}

/**
 * CloudFormation template formats
 */
export enum CFNTemplateFormat {
  JSON = 'json',
  YAML = 'yaml',
}

/**
 * options to specify how a CloudFormation template should be written
 */
export type WriteCFNTemplateOptions = {
  templateFormat?: CFNTemplateFormat;
  minify?: boolean;
};

const writeCFNTemplateDefaultOptions: Required<WriteCFNTemplateOptions> = {
  templateFormat: CFNTemplateFormat.JSON,
  minify: false,
};

/**
 * write the provided CloudFormation template to the provided file path
 */
export const writeCFNTemplate = async (template: object, filePath: string, options?: WriteCFNTemplateOptions): Promise<void> => {
  const mergedOptions = { ...writeCFNTemplateDefaultOptions, ...options };
  let serializedTemplate: string;
  switch (mergedOptions.templateFormat) {
    case CFNTemplateFormat.JSON:
      serializedTemplate = JSONUtilities.stringify(template, { minify: mergedOptions.minify });
      break;
    case CFNTemplateFormat.YAML:
      serializedTemplate = yaml.dump(template);
      break;
    default:
      throw new Error(`Unexpected CFN template format ${mergedOptions.templateFormat}`);
  }
  await fs.ensureDir(path.parse(filePath).dir);
  return fs.writeFileSync(filePath, serializedTemplate);
};

// Register custom tags for yaml parser
// Order and definition based on docs: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
const CF_SCHEMA = yaml.JSON_SCHEMA.extend([
  new yaml.Type('!Base64', {
    kind: 'scalar',
    construct(data) {
      return { 'Fn::Base64': data };
    },
  }),
  new yaml.Type('!Base64', {
    kind: 'mapping',
    construct(data) {
      return { 'Fn::Base64': data };
    },
  }),
  /* eslint-disable spellcheck/spell-checker */
  new yaml.Type('!Cidr', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Cidr': data };
    },
  }),
  new yaml.Type('!Cidr', {
    kind: 'mapping',
    construct(data) {
      return { 'Fn::Cidr': data };
    },
  }),
  /* eslint-enable spellcheck/spell-checker */
  new yaml.Type('!And', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::And': data };
    },
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Equals': data };
    },
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::If': data };
    },
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Not': data };
    },
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Or': data };
    },
  }),
  new yaml.Type('!Condition', {
    kind: 'scalar',
    construct(data) {
      return { Condition: data };
    },
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::FindInMap': data };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct(data) {
      if (Array.isArray(data)) {
        return {
          'Fn::GetAtt': data,
        };
      }
      // data is a string
      const firstPeriodIdx = data.indexOf('.');
      return {
        'Fn::GetAtt': [data.slice(0, firstPeriodIdx), data.slice(firstPeriodIdx + 1)],
      };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct(data) {
      if (Array.isArray(data)) {
        return {
          'Fn::GetAtt': data,
        };
      }
      // data is a string
      const firstPeriodIdx = data.indexOf('.');
      return {
        'Fn::GetAtt': [data.slice(0, firstPeriodIdx), data.slice(firstPeriodIdx + 1)],
      };
    },
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct(data) {
      return { 'Fn::GetAZs': data };
    },
  }),
  new yaml.Type('!GetAZs', {
    kind: 'mapping',
    construct(data) {
      return { 'Fn::GetAZs': data };
    },
  }),
  new yaml.Type('!ImportValue', {
    kind: 'scalar',
    construct(data) {
      return { 'Fn::ImportValue': data };
    },
  }),
  new yaml.Type('!ImportValue', {
    kind: 'mapping',
    construct(data) {
      return { 'Fn::ImportValue': data };
    },
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Join': data };
    },
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Select': data };
    },
  }),
  new yaml.Type('!Split', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Split': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct(data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct(data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!Transform', {
    kind: 'mapping',
    construct(data) {
      return { 'Fn::Transform': data };
    },
  }),
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct(data) {
      return { Ref: data };
    },
  }),
]);

/**
 * We use the first character to determine if the content is json or yaml because historically the CLI could
 * have emitted JSON with YML extension, so we can't rely on filename extension.
 */
const isJsonFileContent = (fileContent: string): boolean => fileContent?.trim()[0] === '{';

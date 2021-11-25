import { Template } from 'cloudform-types';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { JSONUtilities } from './jsonUtilities';

const defaultReadCFNTemplateOptions = { throwIfNotExist: true };

export function readCFNTemplate(filePath: string): { templateFormat: CFNTemplateFormat; cfnTemplate: Template };
export function readCFNTemplate(
  filePath: string,
  options: Partial<typeof defaultReadCFNTemplateOptions>,
): { templateFormat: CFNTemplateFormat; cfnTemplate: Template } | undefined;

export function readCFNTemplate(filePath: string, options: Partial<typeof defaultReadCFNTemplateOptions> = defaultReadCFNTemplateOptions) {
  options = { ...defaultReadCFNTemplateOptions, ...options };

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile) {
    if (options.throwIfNotExist === false) {
      return undefined;
    }
    throw new Error(`No CloudFormation template found at ${filePath}`);
  }
  //TODO:  somthing wrong with this call , work fine with readFileSync()
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // We use the first character to determine if the content is json or yaml because historically the CLI could
  // have emitted JSON with YML extension, so we can't rely on filename extension.
  const isJson = isJsonFileContent(fileContent);
  const cfnTemplate = isJson ? JSONUtilities.parse<Template>(fileContent) : (yaml.load(fileContent, { schema: CF_SCHEMA }) as Template);
  const templateFormat = isJson ? CFNTemplateFormat.JSON : CFNTemplateFormat.YAML;
  return { templateFormat, cfnTemplate };
}

export enum CFNTemplateFormat {
  JSON = 'json',
  YAML = 'yaml',
}

export type WriteCFNTemplateOptions = {
  templateFormat?: CFNTemplateFormat;
};

const writeCFNTemplateDefaultOptions: Required<WriteCFNTemplateOptions> = {
  templateFormat: CFNTemplateFormat.JSON,
};

export async function writeCFNTemplate(template: object, filePath: string, options?: WriteCFNTemplateOptions): Promise<void> {
  const mergedOptions = { ...writeCFNTemplateDefaultOptions, ...options };
  let serializedTemplate: string | undefined;
  switch (mergedOptions.templateFormat) {
    case CFNTemplateFormat.JSON:
      serializedTemplate = JSONUtilities.stringify(template);
      break;
    case CFNTemplateFormat.YAML:
      serializedTemplate = yaml.dump(template);
      break;
    default:
      throw new Error(`Unexpected CFN template format ${mergedOptions.templateFormat}`);
  }
  await fs.ensureDir(path.parse(filePath).dir);
  return fs.writeFileSync(filePath, serializedTemplate);
}

// Register custom tags for yaml parser
// Order and definition based on docs: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html
const CF_SCHEMA = yaml.JSON_SCHEMA.extend([
  new yaml.Type('!Base64', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::Base64': data };
    },
  }),
  new yaml.Type('!Base64', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::Base64': data };
    },
  }),
  new yaml.Type('!Cidr', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Cidr': data };
    },
  }),
  new yaml.Type('!Cidr', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::Cidr': data };
    },
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::And': data };
    },
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Equals': data };
    },
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::If': data };
    },
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Not': data };
    },
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Or': data };
    },
  }),
  new yaml.Type('!Condition', {
    kind: 'scalar',
    construct: function (data) {
      return { Condition: data };
    },
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::FindInMap': data };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: function (data) {
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
    construct: function (data) {
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
    construct: function (data) {
      return { 'Fn::GetAZs': data };
    },
  }),
  new yaml.Type('!GetAZs', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::GetAZs': data };
    },
  }),
  new yaml.Type('!ImportValue', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::ImportValue': data };
    },
  }),
  new yaml.Type('!ImportValue', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::ImportValue': data };
    },
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Join': data };
    },
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Select': data };
    },
  }),
  new yaml.Type('!Split', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Split': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: function (data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: function (data) {
      return { 'Fn::Sub': data };
    },
  }),
  new yaml.Type('!Transform', {
    kind: 'mapping',
    construct: function (data) {
      return { 'Fn::Transform': data };
    },
  }),
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: function (data) {
      return { Ref: data };
    },
  }),
]);

function isJsonFileContent(fileContent: string): boolean {
  // We use the first character to determine if the content is json or yaml because historically the CLI could
  // have emitted JSON with YML extension, so we can't rely on filename extension.
  return fileContent?.trim()[0] === '{'; // CFN templates are always objects, never arrays
}

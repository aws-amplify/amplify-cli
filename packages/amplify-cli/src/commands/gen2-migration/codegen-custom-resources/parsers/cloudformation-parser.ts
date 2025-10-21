// import * as yaml from 'js-yaml';
import { CFNTemplate, CFNResource, CFNIntrinsic, CFNRef } from '../types/cloudformation-types';

export interface CloudFormationParser {
  parseTemplate(templateContent: string): CFNTemplate;
  extractResources(template: CFNTemplate): CFNResource[];
  extractIntrinsicFunctions(template: CFNTemplate): CFNIntrinsic[];
  extractReferences(template: CFNTemplate): CFNRef[];
  detectTemplateFormat(templateContent: string): 'yaml' | 'json';
}

export class CloudFormationParserImpl implements CloudFormationParser {
  parseTemplate(templateContent: string): CFNTemplate {
    const format = this.detectTemplateFormat(templateContent);

    try {
      if (format === 'yaml') {
        return yaml.load(templateContent) as CFNTemplate;
      } else {
        return JSON.parse(templateContent) as CFNTemplate;
      }
    } catch (error) {
      throw new Error(`Failed to parse CloudFormation template: ${error}`);
    }
  }

  extractResources(template: CFNTemplate): CFNResource[] {
    if (!template.Resources) {
      return [];
    }

    return Object.entries(template.Resources).map(([logicalId, resource]) => ({
      ...resource,
      LogicalId: logicalId,
    }));
  }

  extractIntrinsicFunctions(template: CFNTemplate): CFNIntrinsic[] {
    const intrinsics: CFNIntrinsic[] = [];

    this.traverseObject(template, (key, value, path) => {
      if (this.isIntrinsicFunction(key, value)) {
        intrinsics.push({
          function: key,
          parameters: Array.isArray(value) ? value : [value],
          context: path,
        });
      }
    });

    return intrinsics;
  }

  extractReferences(template: CFNTemplate): CFNRef[] {
    const refs: CFNRef[] = [];

    this.traverseObject(template, (key, value, path) => {
      if (key === 'Ref' && typeof value === 'string') {
        refs.push({
          resourceName: value,
          intrinsicType: 'Ref',
          context: path,
        });
      } else if (key === 'Fn::GetAtt' && Array.isArray(value) && value.length === 2) {
        refs.push({
          resourceName: value[0],
          property: value[1],
          intrinsicType: 'GetAtt',
          context: path,
        });
      }
    });

    return refs;
  }

  detectTemplateFormat(templateContent: string): 'yaml' | 'json' {
    const trimmed = templateContent.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return 'json';
    }

    // Check for YAML indicators
    if (trimmed.includes('AWSTemplateFormatVersion:') || trimmed.includes('Resources:') || trimmed.match(/^\s*\w+:\s*$/m)) {
      return 'yaml';
    }

    // Default to JSON if uncertain
    return 'json';
  }

  private isIntrinsicFunction(key: string, value: any): boolean {
    const intrinsicFunctions = [
      'Ref',
      'Fn::GetAtt',
      'Fn::Sub',
      'Fn::Join',
      'Fn::Split',
      'Fn::Select',
      'Fn::Base64',
      'Fn::GetAZs',
      'Fn::ImportValue',
      'Fn::FindInMap',
      'Fn::If',
      'Fn::Not',
      'Fn::Equals',
      'Fn::And',
      'Fn::Or',
    ];

    return intrinsicFunctions.includes(key) || key.startsWith('!');
  }

  private traverseObject(obj: any, callback: (key: string, value: any, path: string) => void, path = ''): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      callback(key, value, currentPath);

      if (typeof value === 'object' && value !== null) {
        this.traverseObject(value, callback, currentPath);
      }
    }
  }
}

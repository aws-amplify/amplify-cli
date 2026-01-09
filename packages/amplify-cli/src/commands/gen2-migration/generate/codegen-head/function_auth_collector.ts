import { FunctionDefinition, AuthAccess } from '../generators/functions/index';
import { parseAuthAccessFromTemplate } from './auth_access_parser';

export function collectFunctionAuthAccess(functions: FunctionDefinition[]): Record<string, AuthAccess> {
  const functionAccess: Record<string, AuthAccess> = {};

  for (const func of functions) {
    if (func.resourceName && func.templateContent) {
      const authAccess = parseAuthAccessFromTemplate(func.templateContent);
      if (Object.keys(authAccess).length > 0) {
        functionAccess[func.resourceName] = authAccess;
      }
    }
  }

  return functionAccess;
}

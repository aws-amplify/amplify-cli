import ts, { PropertyAssignment } from 'typescript';
import { renderResourceTsFile } from '../../resource';

const factory = ts.factory;

export type ReferenceAuth = {
  readonly userPoolId?: string;
  readonly identityPoolId?: string;
  readonly authRoleArn?: string;
  readonly unauthRoleArn?: string;
  readonly userPoolClientId?: string;
  readonly groups?: Record<string, string>;
};

export class ReferenceAuthRenderer {
  public render(refAuth: ReferenceAuth): ts.NodeArray<ts.Node> {
    const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set(['referenceAuth']) };
    const properties: Array<PropertyAssignment> = [];

    const stringProps: (keyof ReferenceAuth)[] = ['userPoolId', 'identityPoolId', 'authRoleArn', 'unauthRoleArn', 'userPoolClientId'];
    for (const prop of stringProps) {
      const value = refAuth[prop];
      if (value) {
        properties.push(factory.createPropertyAssignment(factory.createIdentifier(prop), factory.createStringLiteral(value as string)));
      }
    }

    if (refAuth.groups) {
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('groups'),
          factory.createObjectLiteralExpression(
            Object.entries(refAuth.groups).map(([key, value]) =>
              factory.createPropertyAssignment(factory.createStringLiteral(key), factory.createStringLiteral(value)),
            ),
            true,
          ),
        ),
      );
    }

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(properties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'referenceAuth',
    });
  }
}

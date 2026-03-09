import ts, { ObjectLiteralElementLike } from 'typescript';
import { renderResourceTsFile } from '../resource';

const factory = ts.factory;

/**
 * Options for rendering a single defineFunction() resource file.
 */
export interface RenderDefineFunctionOptions {
  readonly resourceName: string;
  readonly entry: string;
  readonly name?: string;
  readonly timeoutSeconds?: number;
  readonly memoryMB?: number;
  readonly runtime?: string;
  readonly schedule?: string;
  readonly environment?: Record<string, string>;
  readonly appId?: string;
  readonly backendEnvironmentName?: string;
}

/**
 * Renders defineFunction() resource.ts files from Gen1 Lambda configuration.
 * Pure — no AWS calls, no side effects.
 */
export class FunctionsRenderer {
  /**
   * Produces the complete TypeScript AST for a function's resource.ts.
   */
  public render(opts: RenderDefineFunctionOptions): ts.NodeArray<ts.Node> {
    const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set(['defineFunction']) };
    const postImportStatements: ts.Node[] = [];
    const properties: ObjectLiteralElementLike[] = [];

    const branchNameStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'branchName',
            undefined,
            undefined,
            factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    postImportStatements.push(branchNameStatement);

    // entry
    properties.push(factory.createPropertyAssignment('entry', factory.createStringLiteral(opts.entry)));

    // name with branch variable
    if (opts.name) {
      properties.push(
        factory.createPropertyAssignment(
          'name',
          factory.createTemplateExpression(factory.createTemplateHead(`${opts.resourceName}-`), [
            factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
          ]),
        ),
      );
    }

    // timeoutSeconds
    if (opts.timeoutSeconds) {
      properties.push(factory.createPropertyAssignment('timeoutSeconds', factory.createNumericLiteral(opts.timeoutSeconds)));
    }

    // memoryMB
    if (opts.memoryMB) {
      properties.push(factory.createPropertyAssignment('memoryMB', factory.createNumericLiteral(opts.memoryMB)));
    }

    // environment
    this.renderEnvironment(properties, namedImports, opts);

    // runtime
    this.renderRuntime(properties, opts.runtime);

    // schedule
    this.renderSchedule(properties, opts.schedule);

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier(opts.resourceName),
      functionCallParameter: factory.createObjectLiteralExpression(properties, true),
      backendFunctionConstruct: 'defineFunction',
      additionalImportedBackendIdentifiers: namedImports,
      postImportStatements,
    });
  }

  private renderEnvironment(
    target: ObjectLiteralElementLike[],
    namedImports: Record<string, Set<string>>,
    opts: RenderDefineFunctionOptions,
  ): void {
    if (!opts.environment || Object.keys(opts.environment).length === 0) return;

    const envProps = Object.entries(opts.environment).map(([key, value]) => {
      // Handle API_KEY secrets stored in SSM Parameter Store
      if (
        key === 'API_KEY' &&
        opts.appId &&
        opts.backendEnvironmentName &&
        value.startsWith(`/amplify/${opts.appId}/${opts.backendEnvironmentName}`)
      ) {
        namedImports['@aws-amplify/backend'].add('secret');
        return factory.createPropertyAssignment(
          key,
          factory.createCallExpression(factory.createIdentifier('secret'), undefined, [factory.createStringLiteral('API_KEY')]),
        );
      }

      // Handle ENV variable — use branch name template
      if (key === 'ENV') {
        return factory.createPropertyAssignment(
          key,
          factory.createTemplateExpression(factory.createTemplateHead(''), [
            factory.createTemplateSpan(factory.createIdentifier('branchName'), factory.createTemplateTail('')),
          ]),
        );
      }

      return factory.createPropertyAssignment(key, factory.createStringLiteral(value));
    });

    target.push(factory.createPropertyAssignment('environment', factory.createObjectLiteralExpression(envProps)));
  }

  private renderRuntime(target: ObjectLiteralElementLike[], runtime?: string): void {
    if (!runtime || !runtime.includes('nodejs')) return;

    const nodeVersion = parseNodejsRuntime(runtime);
    if (nodeVersion === undefined) {
      throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }
    target.push(factory.createPropertyAssignment('runtime', factory.createNumericLiteral(nodeVersion)));
  }

  private renderSchedule(target: ObjectLiteralElementLike[], schedule?: string): void {
    if (!schedule) return;

    const converted = convertScheduleExpression(schedule);
    if (converted) {
      target.push(factory.createPropertyAssignment('schedule', factory.createStringLiteral(converted)));
    }
  }
}

/**
 * Converts a nodejs runtime string (e.g. 'nodejs18.x') to a version number.
 */
function parseNodejsRuntime(runtime: string): number | undefined {
  const match = runtime.match(/nodejs(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Converts CloudWatch schedule expressions to Gen2 format.
 * 'rate(5 minutes)' → 'every 5m'
 * 'cron(0 12 * * ? *)' → '0 12 * * ? *'
 */
function convertScheduleExpression(raw: string): string | undefined {
  const startIndex = raw.indexOf('(') + 1;
  const endIndex = raw.lastIndexOf(')');
  const inner = startIndex > 0 && endIndex > startIndex ? raw.slice(startIndex, endIndex) : undefined;

  if (raw.startsWith('rate(') && inner) {
    const [value, unit] = inner.split(' ');
    const unitMap: Record<string, string> = {
      minute: 'm',
      minutes: 'm',
      hour: 'h',
      hours: 'h',
      day: 'd',
      days: 'd',
    };
    return unitMap[unit] ? `every ${value}${unitMap[unit]}` : undefined;
  }

  if (raw.startsWith('cron(') && inner) {
    return inner;
  }

  return undefined;
}

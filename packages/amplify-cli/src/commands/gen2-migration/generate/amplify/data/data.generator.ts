import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { GraphqlApi } from '@aws-sdk/client-appsync';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import ts from 'typescript';
import { DataRenderer } from './data.renderer';

// ── Resolver Utility Types ─────────────────────────────────────────────

/** Parsed 4-segment override VTL filename. */
export interface ParsedOverride {
  readonly kind: 'override';
  readonly typeName: string;
  readonly fieldName: string;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Parsed 6-segment extended VTL filename. */
export interface ParsedExtended {
  readonly kind: 'extended';
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly templateType: 'req' | 'res';
  readonly filename: string;
}

/** Union of parsed VTL filename types. */
export type ParsedVtl = ParsedOverride | ParsedExtended;

/** Classification result from `classifyVtlFiles`. */
export interface ClassifiedVtlFiles {
  readonly overrides: readonly ParsedOverride[];
  readonly extended: readonly ParsedExtended[];
}

/** A grouped extended resolver pair (req + res for same slot/order). */
export interface ExtendedResolverGroup {
  readonly typeName: string;
  readonly fieldName: string;
  readonly slot: string;
  readonly order: number;
  readonly reqFile?: string;
  readonly resFile?: string;
}

/** A splice operation to insert a function at a pipeline index. */
export interface SpliceEntry {
  readonly group: ExtendedResolverGroup;
  readonly spliceIndex: number;
}

/** Pipeline splice result for a single typeName.fieldName. */
export interface PipelineSpliceResult {
  readonly typeName: string;
  readonly fieldName: string;
  readonly entries: readonly SpliceEntry[];
}

// ── Slot Constants ─────────────────────────────────────────────────────

/** Valid slots for Query resolvers. */
export const QUERY_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preDataLoad', 'postDataLoad', 'finish'];

/** Valid slots for Mutation resolvers. */
export const MUTATION_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preUpdate', 'postUpdate', 'finish'];

/** Valid slots for Subscription resolvers. */
export const SUBSCRIPTION_SLOTS: readonly string[] = ['init', 'preAuth', 'auth', 'postAuth', 'preSubscribe'];

/** Union of all valid slots across all operation types. */
export const ALL_SLOTS: readonly string[] = [
  'init',
  'preAuth',
  'auth',
  'postAuth',
  'preDataLoad',
  'postDataLoad',
  'preUpdate',
  'postUpdate',
  'preSubscribe',
  'finish',
];

/**
 * Maps each slot to its base pipeline index for the 3-function pipeline
 * shape (Query, Subscription, delete-Mutation): [auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_3_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 0,
  preAuth: 0,
  auth: 1,
  postAuth: 2,
  preDataLoad: 2,
  postDataLoad: 3,
  preUpdate: 2,
  postUpdate: 3,
  preSubscribe: 2,
  finish: 3,
};

/**
 * Maps each slot to its base pipeline index for the 4-function pipeline
 * shape (create/update Mutation): [init0, auth0, postAuth0, DataResolverFn].
 */
export const PIPELINE_4_SLOT_MAP: Readonly<Record<string, number>> = {
  init: 1,
  preAuth: 1,
  auth: 2,
  postAuth: 3,
  preUpdate: 3,
  postUpdate: 4,
  finish: 4,
};

// ── Resolver Utility Functions ─────────────────────────────────────────

/**
 * Parses a single VTL filename into a structured representation.
 *
 * 4 segments → ParsedOverride, 6 segments → ParsedExtended, otherwise undefined.
 */
export function parseVtlFilename(filename: string): ParsedVtl | undefined {
  const segments = filename.split('.');
  if (segments.length === 4) {
    const [typeName, fieldName, templateType] = segments;
    return {
      kind: 'override',
      typeName,
      fieldName,
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  if (segments.length === 6) {
    const [typeName, fieldName, slot, orderStr, templateType] = segments;
    return {
      kind: 'extended',
      typeName,
      fieldName,
      slot,
      order: Number(orderStr),
      templateType: templateType as 'req' | 'res',
      filename,
    };
  }
  return undefined;
}

/** Returns the valid slot set for a given typeName. */
function validSlotsForType(typeName: string): readonly string[] {
  switch (typeName) {
    case 'Query':
      return QUERY_SLOTS;
    case 'Mutation':
      return MUTATION_SLOTS;
    case 'Subscription':
      return SUBSCRIPTION_SLOTS;
    default:
      return ALL_SLOTS;
  }
}

/** Validates that a slot is valid for the given typeName. Throws on invalid slot. */
export function validateSlot(typeName: string, slot: string, filename: string): void {
  const validSlots = validSlotsForType(typeName);
  if (!validSlots.includes(slot)) {
    throw new Error(`Invalid slot '${slot}' in file '${filename}' for typeName '${typeName}'. Valid slots: ${validSlots.join(', ')}`);
  }
}

/**
 * Classifies an array of VTL filenames into overrides and extended resolvers.
 *
 * Validates slots, checks for non-numeric order segments, and detects duplicates.
 */
export function classifyVtlFiles(filenames: string[]): ClassifiedVtlFiles {
  const overrides: ParsedOverride[] = [];
  const extended: ParsedExtended[] = [];
  const seen = new Map<string, string>();

  for (const filename of filenames) {
    const parsed = parseVtlFilename(filename);
    if (!parsed) continue;

    if (parsed.kind === 'override') {
      overrides.push(parsed);
    } else {
      // Validate the order segment is a non-negative integer.
      const segments = filename.split('.');
      const orderStr = segments[3];
      if (!/^\d+$/.test(orderStr)) {
        throw new Error(`Non-numeric order '${orderStr}' in extended resolver file '${filename}'`);
      }

      validateSlot(parsed.typeName, parsed.slot, filename);

      // Detect duplicates: same typeName+fieldName+slot+order+templateType.
      const key = `${parsed.typeName}.${parsed.fieldName}.${parsed.slot}.${parsed.order}.${parsed.templateType}`;
      const existing = seen.get(key);
      if (existing) {
        throw new Error(`Duplicate extended resolver: '${existing}' and '${filename}'`);
      }
      seen.set(key, filename);

      extended.push(parsed);
    }
  }

  return { overrides, extended };
}

/** Canonical slot execution order used for sorting. */
const SLOT_ORDER: Readonly<Record<string, number>> = Object.fromEntries(ALL_SLOTS.map((slot, i) => [slot, i]));

/**
 * Groups ParsedExtended entries by typeName.fieldName, sorts by slot
 * pipeline execution order then numeric order, and pairs req/res templates.
 */
export function groupExtendedResolvers(extended: readonly ParsedExtended[]): Map<string, ExtendedResolverGroup[]> {
  // Collect entries by field key.
  const byField = new Map<string, ParsedExtended[]>();
  for (const entry of extended) {
    const key = `${entry.typeName}.${entry.fieldName}`;
    const list = byField.get(key);
    if (list) {
      list.push(entry);
    } else {
      byField.set(key, [entry]);
    }
  }

  const result = new Map<string, ExtendedResolverGroup[]>();

  for (const [key, entries] of byField) {
    // Sort by slot pipeline order, then by numeric order within the same slot.
    entries.sort((a, b) => {
      const slotDiff = (SLOT_ORDER[a.slot] ?? 0) - (SLOT_ORDER[b.slot] ?? 0);
      if (slotDiff !== 0) return slotDiff;
      return a.order - b.order;
    });

    // Pair req/res templates for the same slot+order.
    const pairMap = new Map<string, { reqFile?: string; resFile?: string }>();
    const pairOrder: string[] = [];

    for (const entry of entries) {
      const pairKey = `${entry.slot}.${entry.order}`;
      let pair = pairMap.get(pairKey);
      if (!pair) {
        pair = {};
        pairMap.set(pairKey, pair);
        pairOrder.push(pairKey);
      }
      if (entry.templateType === 'req') {
        pair.reqFile = entry.filename;
      } else {
        pair.resFile = entry.filename;
      }
    }

    // Build groups in sorted order.
    const groups: ExtendedResolverGroup[] = [];
    for (const pairKey of pairOrder) {
      const pair = pairMap.get(pairKey)!;
      const [slot, orderStr] = pairKey.split('.');
      // Use the first entry's typeName/fieldName (all entries in this key share them).
      const sample = entries[0];
      groups.push({
        typeName: sample.typeName,
        fieldName: sample.fieldName,
        slot,
        order: Number(orderStr),
        reqFile: pair.reqFile,
        resFile: pair.resFile,
      });
    }

    result.set(key, groups);
  }

  return result;
}

/**
 * Selects the pipeline slot map based on typeName and fieldName.
 *
 * Query, Subscription, and delete-Mutation use the 3-function pipeline.
 * Other Mutations and custom types use the 4-function pipeline.
 */
function selectSlotMap(typeName: string, fieldName: string): Readonly<Record<string, number>> {
  if (typeName === 'Query' || typeName === 'Subscription') {
    return PIPELINE_3_SLOT_MAP;
  }
  if (typeName === 'Mutation' && fieldName.startsWith('delete')) {
    return PIPELINE_3_SLOT_MAP;
  }
  return PIPELINE_4_SLOT_MAP;
}

/**
 * Computes splice indexes for a set of grouped extended resolvers for a single field.
 *
 * Each entry's spliceIndex = baseSlotMap[slot] + runningOffset, where
 * runningOffset increments by 1 for each preceding entry.
 */
export function computeSpliceIndexes(typeName: string, fieldName: string, groups: readonly ExtendedResolverGroup[]): PipelineSpliceResult {
  const slotMap = selectSlotMap(typeName, fieldName);
  const entries: SpliceEntry[] = [];
  let runningOffset = 0;

  for (const group of groups) {
    const baseIndex = slotMap[group.slot];
    if (baseIndex === undefined) {
      throw new Error(`Unknown slot '${group.slot}' for ${typeName}.${fieldName}`);
    }
    entries.push({
      group,
      spliceIndex: baseIndex + runningOffset,
    });
    runningOffset++;
  }

  return { typeName, fieldName, entries };
}

// ── DataGenerator ──────────────────────────────────────────────────────

/**
 * Generates the AppSync/GraphQL data resource and contributes to backend.ts.
 *
 * Reads the Gen1 AppSync configuration (schema, authorization modes,
 * logging), resolves DynamoDB table mappings, and generates
 * amplify/data/resource.ts with a defineData() call.
 *
 * REST APIs are handled by a separate RestApiGenerator.
 */
export class DataGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer: DataRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.renderer = new DataRenderer(gen1App.envName);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const schema = this.gen1App.file(path.join('api', this.resource.resourceName, 'schema.graphql'));
    const apiId = this.gen1App.resourceMetaOutput(this.resource, 'GraphQLAPIIdOutput');

    const tableMappings = this.createTableMappings(schema, apiId);

    const graphqlApi = await this.gen1App.aws.fetchGraphqlApi(apiId);
    if (!graphqlApi) {
      throw new Error(`AppSync API '${apiId}' not found`);
    }

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const hasAdditionalAuthProviders =
      graphqlApi.additionalAuthenticationProviders !== undefined && graphqlApi.additionalAuthenticationProviders.length > 0;
    const hasAuth = this.gen1App.categoryMeta('auth') !== undefined;
    const authorizationModes = this.gen1App.resourceMetaOutput(this.resource, 'authConfig');
    const hasIamAuth = this.detectIamAuth(authorizationModes, graphqlApi);
    const needsEscapeHatches = hasAdditionalAuthProviders || (hasIamAuth && hasAuth);

    const vtlFiles = this.findResolverVtlFiles(this.resource.resourceName);
    const hasResolvers = vtlFiles.length > 0;

    const operations: AmplifyMigrationOperation[] = [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/data/resource.ts'],
        execute: async () => {
          const nodes = this.renderer.render({
            schema,
            tableMappings,
            authorizationModes,
            graphqlApi,
            hasAuth,
            apiId,
          });

          const content = TS.printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('data', './data/resource');
          this.backendGenerator.addDefineBackendEntry('data', 'data', 'data');
          if (needsEscapeHatches || hasResolvers) {
            this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'data', extraArgs: [] });
          }

          if (hasResolvers) {
            this.contributeResolverCode(vtlFiles);
          }
        },
      },
    ];

    if (hasResolvers) {
      const gen1ResolversDir = path.join(this.gen1App.ccbDir, 'api', this.resource.resourceName, 'resolvers');
      const destResolversDir = path.join(dataDir, 'resolvers');

      operations.push({
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Copy VTL resolver files to amplify/data/resolvers/'],
        execute: async () => {
          await fs.mkdir(destResolversDir, { recursive: true });
          for (const file of vtlFiles) {
            await fs.copyFile(path.join(gen1ResolversDir, file), path.join(destResolversDir, file));
          }
        },
      });
    }

    return operations;
  }

  /** Discovers VTL files in the Gen1 resolvers directory. */
  private findResolverVtlFiles(apiName: string): readonly string[] {
    const resolversDir = path.join(this.gen1App.ccbDir, 'api', apiName, 'resolvers');
    if (!existsSync(resolversDir)) {
      return [];
    }
    return readdirSync(resolversDir).filter((f) => f.endsWith('.vtl'));
  }

  /** Contributes resolver-related imports, declarations, and code to BackendGenerator. */
  private contributeResolverCode(vtlFiles: readonly string[]): void {
    const classified = classifyVtlFiles([...vtlFiles]);
    const hasOverrides = classified.overrides.length > 0;
    const hasExtended = classified.extended.length > 0;

    // Common imports and declarations for all resolver types
    this.backendGenerator.addNamedImport('path', 'join', 'dirname');
    this.backendGenerator.addNamedImport('url', 'fileURLToPath');

    this.backendGenerator.addPostDefineBackendStatement(
      TS.printNode(TS.declareConst('__dirname', ts.factory.createIdentifier('dirname(fileURLToPath(import.meta.url))'))),
    );
    this.backendGenerator.addPostDefineBackendStatement(
      TS.printNode(TS.declareConst('resolversDir', ts.factory.createIdentifier('join(__dirname, "data/resolvers")'))),
    );

    if (hasOverrides) {
      this.contributeOverrideCode();
    }

    if (hasExtended) {
      this.contributeExtendedCode(classified);
    }
  }

  /** Contributes override resolver code to BackendGenerator. */
  private contributeOverrideCode(): void {
    this.backendGenerator.addNamedImport('fs', 'readdirSync');
    this.backendGenerator.addNamespaceImport('assets', 'aws-cdk-lib/aws-s3-assets');

    // const resolverFiles = readdirSync(resolversDir).filter(f => (f.endsWith(".req.vtl") || f.endsWith(".res.vtl")) && f.split(".").length === 4);
    const filterCallback = ts.factory.createArrowFunction(
      undefined,
      undefined,
      [ts.factory.createParameterDeclaration(undefined, undefined, 'f')],
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createBinaryExpression(
        ts.factory.createParenthesizedExpression(
          ts.factory.createBinaryExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('f'), 'endsWith'),
              undefined,
              [ts.factory.createStringLiteral('.req.vtl')],
            ),
            ts.SyntaxKind.BarBarToken,
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('f'), 'endsWith'),
              undefined,
              [ts.factory.createStringLiteral('.res.vtl')],
            ),
          ),
        ),
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('f'), 'split'),
              undefined,
              [ts.factory.createStringLiteral('.')],
            ),
            'length',
          ),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.factory.createNumericLiteral(4),
        ),
      ),
    );

    const resolverFilesDecl = TS.declareConst(
      'resolverFiles',
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createCallExpression(ts.factory.createIdentifier('readdirSync'), undefined, [
            ts.factory.createIdentifier('resolversDir'),
          ]),
          'filter',
        ),
        undefined,
        [filterCallback],
      ),
    );
    this.backendGenerator.addPostDefineBackendStatement(TS.printNode(resolverFilesDecl));

    // for-of loop over resolverFiles
    const loopBody = this.buildOverrideLoopBody();
    const forOfLoop = ts.factory.createForOfStatement(
      undefined,
      ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration('file')], ts.NodeFlags.Const),
      ts.factory.createIdentifier('resolverFiles'),
      ts.factory.createBlock(loopBody, true),
    );
    this.backendGenerator.addPostDefineBackendStatement(TS.printNode(forOfLoop));
  }

  /** Builds the body statements for the override resolver for-of loop. */
  private buildOverrideLoopBody(): ts.Statement[] {
    const statements: ts.Statement[] = [];

    // const [typeName, fieldName, templateType] = file.split(".");
    statements.push(
      ts.factory.createVariableStatement(
        [],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createArrayBindingPattern([
                ts.factory.createBindingElement(undefined, undefined, 'typeName'),
                ts.factory.createBindingElement(undefined, undefined, 'fieldName'),
                ts.factory.createBindingElement(undefined, undefined, 'templateType'),
              ]),
              undefined,
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('file'), 'split'),
                undefined,
                [ts.factory.createStringLiteral('.')],
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
    );

    // const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    statements.push(
      TS.declareConst(
        'capitalizedFieldName',
        ts.factory.createBinaryExpression(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('fieldName'), 'charAt'),
                undefined,
                [ts.factory.createNumericLiteral(0)],
              ),
              'toUpperCase',
            ),
            undefined,
            [],
          ),
          ts.SyntaxKind.PlusToken,
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('fieldName'), 'slice'),
            undefined,
            [ts.factory.createNumericLiteral(1)],
          ),
        ),
      ),
    );

    // const functionId = `${typeName}${capitalizedFieldName}DataResolverFn`;
    statements.push(
      TS.declareConst(
        'functionId',
        ts.factory.createTemplateExpression(ts.factory.createTemplateHead(''), [
          ts.factory.createTemplateSpan(ts.factory.createIdentifier('typeName'), ts.factory.createTemplateMiddle('')),
          ts.factory.createTemplateSpan(
            ts.factory.createIdentifier('capitalizedFieldName'),
            ts.factory.createTemplateTail('DataResolverFn'),
          ),
        ]),
      ),
    );

    // const fn = backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
    statements.push(
      TS.declareConst(
        'fn',
        ts.factory.createElementAccessExpression(
          TS.propAccess('backend', 'data', 'resources', 'cfnResources', 'cfnFunctionConfigurations') as ts.Expression,
          ts.factory.createIdentifier('functionId'),
        ),
      ),
    );

    // const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, { path: join(resolversDir, file) });
    statements.push(
      TS.declareConst(
        'vtlTemplate',
        ts.factory.createNewExpression(TS.propAccess('assets', 'Asset') as ts.Expression, undefined, [
          TS.propAccess('backend', 'data') as ts.Expression,
          ts.factory.createTemplateExpression(ts.factory.createTemplateHead('VTLTemplate-'), [
            ts.factory.createTemplateSpan(ts.factory.createIdentifier('file'), ts.factory.createTemplateTail('')),
          ]),
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                'path',
                ts.factory.createCallExpression(ts.factory.createIdentifier('join'), undefined, [
                  ts.factory.createIdentifier('resolversDir'),
                  ts.factory.createIdentifier('file'),
                ]),
              ),
            ],
            false,
          ),
        ]),
      ),
    );

    // if (templateType === "req") { fn.requestMappingTemplateS3Location = vtlTemplate.s3ObjectUrl; }
    // else { fn.responseMappingTemplateS3Location = vtlTemplate.s3ObjectUrl; }
    const s3ObjectUrl = TS.propAccess('vtlTemplate', 's3ObjectUrl') as ts.Expression;
    statements.push(
      ts.factory.createIfStatement(
        ts.factory.createBinaryExpression(
          ts.factory.createIdentifier('templateType'),
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.factory.createStringLiteral('req'),
        ),
        ts.factory.createBlock(
          [
            ts.factory.createExpressionStatement(
              ts.factory.createAssignment(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('fn'), 'requestMappingTemplateS3Location'),
                s3ObjectUrl,
              ),
            ),
          ],
          true,
        ),
        ts.factory.createBlock(
          [
            ts.factory.createExpressionStatement(
              ts.factory.createAssignment(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('fn'), 'responseMappingTemplateS3Location'),
                s3ObjectUrl,
              ),
            ),
          ],
          true,
        ),
      ),
    );

    return statements;
  }

  /** Contributes extended resolver code to BackendGenerator. */
  private contributeExtendedCode(classified: ReturnType<typeof classifyVtlFiles>): void {
    this.backendGenerator.addNamedImport('aws-cdk-lib', 'aws_appsync');
    this.backendGenerator.addNamedImport('aws-cdk-lib/aws-appsync', 'CfnResolver');

    // noneDataSource declaration
    this.backendGenerator.addPostDefineBackendStatement(TS.printNode(this.renderer.renderNoneDataSource()));

    const grouped = groupExtendedResolvers(classified.extended);

    for (const [key, groups] of grouped) {
      const [typeName, fieldName] = key.split('.');

      // Render AppsyncFunction constructs for each group entry
      for (const group of groups) {
        this.backendGenerator.addPostDefineBackendStatement(TS.printNode(this.renderer.renderAppsyncFunction(group)));
      }

      // Compute splice indexes and render splice statements
      const spliceResult = computeSpliceIndexes(typeName, fieldName, groups);
      const spliceStatements = this.renderer.renderSpliceStatements(spliceResult);
      for (const stmt of spliceStatements) {
        this.backendGenerator.addPostDefineBackendStatement(TS.printNode(stmt));
      }
    }
  }

  private createTableMappings(schema: string, apiId: string): Record<string, string> {
    const modelRegex = /type\s+(\w+)\s+@model/g;
    const mapping: Record<string, string> = {};
    let match: RegExpExecArray | null;
    while ((match = modelRegex.exec(schema)) !== null) {
      mapping[match[1]] = [match[1], apiId, this.gen1App.envName].join('-');
    }
    return mapping;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped authConfig from amplify-meta.json
  private detectIamAuth(authorizationModes: any, graphqlApi: GraphqlApi): boolean {
    const defaultAuthType = authorizationModes?.defaultAuthentication?.authenticationType;
    if (defaultAuthType === 'AWS_IAM') return true;
    return graphqlApi.additionalAuthenticationProviders?.some((p) => p.authenticationType === 'AWS_IAM') ?? false;
  }
}

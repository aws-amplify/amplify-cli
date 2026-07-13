import { GeoGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/geo/geo.generator';
import { GeoMapGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/geo/map.generator';
import { GeoPlaceIndexGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/geo/place-index.generator';
import { GeoGeofenceCollectionGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/geo/geofence-collection.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

jest.mock('cdk-from-cfn', () => ({
  transmute: jest
    .fn()
    .mockReturnValue('export class TestConstruct extends cdk.Stack {\n  constructor(scope: any, id: string) { super(scope, id); }\n}'),
}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

// Also mock fs/promises (non-prefixed) used by geo-resource.generator
jest.mock('fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

describe('GeoGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('renders geo/resource.ts with a single map', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        storeLocatorMap: {
          service: 'Map',
          providerMetadata: { logicalId: 'geoLogicalId' },
        },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Parameters: {},
      Resources: {
        UserFacingPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'] }],
            },
          },
        },
      },
      Conditions: {},
    });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'mapName', ParameterValue: 'storeLocatorMap' },
                  { ParameterKey: 'mapStyle', ParameterValue: 'VectorEsriStreets' },
                  { ParameterKey: 'isDefault', ParameterValue: 'true' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const mapGenerator = new GeoMapGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'storeLocatorMap',
        service: 'Map',
        key: 'geo:Map',
      },
      geoGenerator,
      logger,
    );

    const mapOps = await mapGenerator.plan();
    await mapOps[0].execute();
    const geoOps = await geoGenerator.plan();
    await geoOps[0].execute();

    expect(writtenFile('geo/resource.ts')).toMatchInlineSnapshot(`
      "import { defineStoreLocatorMap } from './storeLocatorMap/resource';
      import type { Backend } from '../backend';

      export function defineGeo(backend: Backend) {
        const storeLocatorMap = defineStoreLocatorMap(backend);
        backend.addOutput({
          geo: {
            aws_region: storeLocatorMap.region,
            maps: {
              items: {
                [storeLocatorMap.name]: { style: storeLocatorMap.style },
              },
              default: storeLocatorMap.name,
            },
          },
        });
      }
      "
    `);
  });

  it('renders geo/resource.ts with map and place index', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        storeLocatorMap: { service: 'Map', providerMetadata: { logicalId: 'geoLogicalId' } },
        storeLocatorIndex: { service: 'PlaceIndex', providerMetadata: { logicalId: 'geoLogicalId' } },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Parameters: {},
      Resources: {
        UserFacingPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'] }],
            },
          },
        },
      },
      Conditions: {},
    });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'mapName', ParameterValue: 'storeLocatorMap' },
                  { ParameterKey: 'mapStyle', ParameterValue: 'VectorEsriStreets' },
                  { ParameterKey: 'indexName', ParameterValue: 'storeLocatorIndex' },
                  { ParameterKey: 'dataProvider', ParameterValue: 'Esri' },
                  { ParameterKey: 'dataSourceIntendedUse', ParameterValue: 'SingleUse' },
                  { ParameterKey: 'isDefault', ParameterValue: 'true' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const mapGenerator = new GeoMapGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'storeLocatorMap',
        service: 'Map',
        key: 'geo:Map',
      },
      geoGenerator,
      logger,
    );
    const placeIndexGenerator = new GeoPlaceIndexGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'storeLocatorIndex',
        service: 'PlaceIndex',
        key: 'geo:PlaceIndex',
      },
      geoGenerator,
      logger,
    );

    const mapOps = await mapGenerator.plan();
    await mapOps[0].execute();
    const indexOps = await placeIndexGenerator.plan();
    await indexOps[0].execute();
    const geoOps = await geoGenerator.plan();
    await geoOps[0].execute();

    expect(writtenFile('geo/resource.ts')).toMatchInlineSnapshot(`
      "import { defineStoreLocatorMap } from './storeLocatorMap/resource';
      import { defineStoreLocatorIndex } from './storeLocatorIndex/resource';
      import type { Backend } from '../backend';

      export function defineGeo(backend: Backend) {
        const storeLocatorMap = defineStoreLocatorMap(backend);
        const storeLocatorIndex = defineStoreLocatorIndex(backend);
        backend.addOutput({
          geo: {
            aws_region: storeLocatorMap.region,
            maps: {
              items: {
                [storeLocatorMap.name]: { style: storeLocatorMap.style },
              },
              default: storeLocatorMap.name,
            },
            search_indices: {
              items: [storeLocatorIndex.name],
              default: storeLocatorIndex.name,
            },
          },
        });
      }
      "
    `);
  });

  it('GeoMapGenerator writes per-resource resource.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        storeLocatorMap: { service: 'Map', providerMetadata: { logicalId: 'geoLogicalId' } },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Parameters: {},
      Resources: {
        UserFacingPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'] }],
            },
          },
        },
      },
      Conditions: {},
    });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'mapName', ParameterValue: 'storeLocatorMap' },
                  { ParameterKey: 'mapStyle', ParameterValue: 'VectorEsriStreets' },
                  { ParameterKey: 'isDefault', ParameterValue: 'true' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const mapGenerator = new GeoMapGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'storeLocatorMap',
        service: 'Map',
        key: 'geo:Map',
      },
      geoGenerator,
      logger,
    );

    const ops = await mapGenerator.plan();
    await ops[0].execute();

    expect(writtenFile('storeLocatorMap/resource.ts')).toMatchInlineSnapshot(`
      "import { TestConstruct } from './storeLocatorMap-construct';
      import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineStoreLocatorMap(backend: Backend) {
        const storeLocatorMapStack = backend.createStack('geostoreLocatorMap');
        const storeLocatorMap = new TestConstruct(
          storeLocatorMapStack,
          'storeLocatorMap',
          {
            authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
            unauthRoleName:
              backend.auth.resources.unauthenticatedUserIamRole.roleName,
            authTestAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
            mapName: 'storeLocatorMap',
            mapStyle: 'VectorEsriStreets',
            branchName,
            isDefault: 'true',
          }
        );
        const policy = new Policy(storeLocatorMap, 'gen1AuthPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'],
              resources: [
                \`arn:aws:geo:\${storeLocatorMapStack.region}:\${storeLocatorMapStack.account}:map/storeLocatorMap-main\`,
              ],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(policy);
        backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(policy);
        return storeLocatorMap;
      }
      "
    `);
  });

  it('GeoPlaceIndexGenerator writes per-resource resource.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        myPlaceIndex: { service: 'PlaceIndex', providerMetadata: { logicalId: 'geoLogicalId' } },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Parameters: {},
      Resources: {
        UserFacingPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'] }],
            },
          },
        },
      },
      Conditions: {},
    });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'indexName', ParameterValue: 'myPlaceIndex' },
                  { ParameterKey: 'dataProvider', ParameterValue: 'Esri' },
                  { ParameterKey: 'dataSourceIntendedUse', ParameterValue: 'SingleUse' },
                  { ParameterKey: 'isDefault', ParameterValue: 'false' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const placeIndexGenerator = new GeoPlaceIndexGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'myPlaceIndex',
        service: 'PlaceIndex',
        key: 'geo:PlaceIndex',
      },
      geoGenerator,
      logger,
    );

    const ops = await placeIndexGenerator.plan();
    await ops[0].execute();

    expect(writtenFile('myPlaceIndex/resource.ts')).toMatchInlineSnapshot(`
      "import { TestConstruct } from './myPlaceIndex-construct';
      import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineMyPlaceIndex(backend: Backend) {
        const myPlaceIndexStack = backend.createStack('geomyPlaceIndex');
        const myPlaceIndex = new TestConstruct(myPlaceIndexStack, 'myPlaceIndex', {
          authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
          unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
          authTestAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
          indexName: 'myPlaceIndex',
          dataProvider: 'Esri',
          dataSourceIntendedUse: 'SingleUse',
          branchName,
          isDefault: 'false',
        });
        const policy = new Policy(myPlaceIndex, 'gen1AuthPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'],
              resources: [
                \`arn:aws:geo:\${myPlaceIndexStack.region}:\${myPlaceIndexStack.account}:place-index/myPlaceIndex-main\`,
              ],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(policy);
        backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(policy);
        return myPlaceIndex;
      }
      "
    `);
  });

  it('GeoGeofenceCollectionGenerator writes per-resource resource.ts', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        myGeofences: { service: 'GeofenceCollection', providerMetadata: { logicalId: 'geoLogicalId' } },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({ Parameters: {}, Resources: {}, Conditions: {} });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'collectionName', ParameterValue: 'myGeofences' },
                  { ParameterKey: 'isDefault', ParameterValue: 'true' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const geofenceGenerator = new GeoGeofenceCollectionGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'myGeofences',
        service: 'GeofenceCollection',
        key: 'geo:GeofenceCollection',
      },
      geoGenerator,
      logger,
    );

    const ops = await geofenceGenerator.plan();
    await ops[0].execute();

    expect(writtenFile('myGeofences/resource.ts')).toMatchInlineSnapshot(`
      "import { TestConstruct } from './myGeofences-construct';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineMyGeofences(backend: Backend) {
        const myGeofencesStack = backend.createStack('geomyGeofences');
        const myGeofences = new TestConstruct(myGeofencesStack, 'myGeofences', {
          authTestAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
          collectionName: 'myGeofences',
          branchName,
          isDefault: 'true',
        });
        return myGeofences;
      }
      "
    `);
  });

  it('adds namespace import and post-define statement', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      geo: {
        storeLocatorMap: { service: 'Map', providerMetadata: { logicalId: 'geoLogicalId' } },
      },
    });
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Parameters: {},
      Resources: {
        UserFacingPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['geo:GetMapTile', 'geo:GetMapStyleDescriptor'] }],
            },
          },
        },
      },
      Conditions: {},
    });
    jest.spyOn(gen1App.aws, 'findResourcePhysicalId').mockResolvedValue('nested-stack-id');
    (gen1App.clients as any).cloudFormation = {
      send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
        if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
          return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
        }
        if (cmd.constructor.name === 'DescribeStacksCommand') {
          return {
            Stacks: [
              {
                Parameters: [
                  { ParameterKey: 'mapName', ParameterValue: 'storeLocatorMap' },
                  { ParameterKey: 'mapStyle', ParameterValue: 'VectorEsriStreets' },
                  { ParameterKey: 'isDefault', ParameterValue: 'true' },
                  { ParameterKey: 'authTestAuthUserPoolId', ParameterValue: 'us-east-1_abc' },
                  { ParameterKey: 'env', ParameterValue: 'dev' },
                ],
              },
            ],
          };
        }
        return {};
      }),
    };

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineBackendStatementSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendStatement');

    const geoGenerator = new GeoGenerator(backendGenerator, outputDir, logger);
    const mapGenerator = new GeoMapGenerator(
      gen1App,
      outputDir,
      {
        category: 'geo',
        resourceName: 'storeLocatorMap',
        service: 'Map',
        key: 'geo:Map',
      },
      geoGenerator,
      logger,
    );

    const mapOps = await mapGenerator.plan();
    await mapOps[0].execute();
    const geoOps = await geoGenerator.plan();
    await geoOps[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('geo', './geo/resource');
    expect(addPostDefineBackendStatementSpy).toHaveBeenCalledWith('geo.defineGeo(backend)');
  });
});

import { pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import { ServiceName } from '../../../../provider-utils/awscloudformation/utils/constants';
import { generateLayerCfnObj } from '../../../../provider-utils/awscloudformation/utils/lambda-layer-cloudformation-template';
import { isMultiEnvLayer } from '../../../../provider-utils/awscloudformation/utils/layerHelpers';
import {
  LayerParameters,
  LayerPermission,
  LayerVersionCfnMetadata,
  PermissionEnum,
} from '../../../../provider-utils/awscloudformation/utils/layerParams';

jest.mock('@aws-amplify/amplify-cli-core');
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
pathManager_mock.getResourceDirectoryPath.mockReturnValue('fakeProject/amplify/backend/myLayer/');
stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'mock' });

jest.mock('../../../../provider-utils/awscloudformation/utils/layerHelpers');
const isMultiEnvLayer_mock = isMultiEnvLayer as jest.MockedFunction<typeof isMultiEnvLayer>;
isMultiEnvLayer_mock.mockImplementation(jest.fn(() => true));

const parameters_stub: LayerParameters = {
  build: true,
  layerName: 'myLayer',
  permissions: [{ type: PermissionEnum.Private }],
  providerContext: {
    provider: 'awscloudformation',
    projectName: 'project',
    service: ServiceName.LambdaLayer,
  },
  runtimes: [
    {
      name: 'NodeJS',
      value: 'nodejs',
      cloudTemplateValues: ['nodejs16.x'],
    },
  ],
};

// Not using a snapshot since the LogicalNames will contain random characters
function validateParameters(layerCfn) {
  expect(layerCfn.Parameters).toStrictEqual({
    env: {
      Type: 'String',
    },
    deploymentBucketName: {
      Type: 'String',
    },
    s3Key: {
      Type: 'String',
    },
    description: {
      Type: 'String',
      Default: '',
    },
    runtimes: {
      Type: 'List<String>',
    },
  });
}

function validateOutput(layerCfn) {
  expect(layerCfn.Outputs.Arn.Value).toBeDefined();
}

describe('test layer CFN generation functions', () => {
  beforeAll(() => {
    jest.mock('@aws-amplify/amplify-cli-core', () => ({
      stateManager: {
        getLocalEnvInfo: jest.fn().mockReturnValue('testenv'),
      },
      pathManager: {
        getBackendDirPath: jest.fn().mockReturnValue('..'),
      },
      JSONUtilities: {
        readJson: jest.fn().mockReturnValue([]),
      },
    }));
  });

  it('should generate the expected CFN for a newly created LL resource', () => {
    const layerCfn = generateLayerCfnObj(true, parameters_stub);
    validateParameters(layerCfn);
    validateOutput(layerCfn);
    expect(Object.keys(layerCfn.Resources).length).toBe(2); // 1 LayerVersion, 1 LayerVersionPermission
  });

  const fakeLayerCfnMeta: LayerVersionCfnMetadata = {
    CompatibleRuntimes: ['nodejs16.x'],
    Description: 'description',
    LayerVersionArn: 'fakeArn:1',
    LogicalName: 'fakeLayer12345',
    Version: 1,
    Content: {
      S3Key: 's3key',
      S3Bucket: 's3bucket',
    },
    legacyLayer: false,
    permissions: [{ type: PermissionEnum.Private }],
  };

  it('should generate the expected CFN for an existing LL resource', () => {
    const layerCfn = generateLayerCfnObj(false, parameters_stub, [fakeLayerCfnMeta]);
    validateParameters(layerCfn);
    validateOutput(layerCfn);
    expect(Object.keys(layerCfn.Resources).length).toBe(2); // 1 LayerVersion, 1 LayerVersionPermission
  });

  it('should generate the expected CFN for an existing LL resource and new version', () => {
    const layerCfn = generateLayerCfnObj(true, parameters_stub, [fakeLayerCfnMeta]);
    validateParameters(layerCfn);
    validateOutput(layerCfn);
    expect(Object.keys(layerCfn.Resources).length).toBe(4); // 2 LayerVersions, 2 LayerVersionPermissions
  });

  it('should generate the expected CFN for an existing LL version and new version with complex permissions', () => {
    const permissions: LayerPermission[] = [
      { type: PermissionEnum.Private },
      { type: PermissionEnum.AwsAccounts, accounts: ['123456789012', '098765432112'] },
      { type: PermissionEnum.AwsOrg, orgs: ['o-123456789012', 'o-098765432112'] },
    ];
    fakeLayerCfnMeta.permissions = permissions;
    parameters_stub.permissions = permissions;
    const layerCfn = generateLayerCfnObj(true, parameters_stub, [fakeLayerCfnMeta]);
    validateParameters(layerCfn);
    validateOutput(layerCfn);
    expect(Object.keys(layerCfn.Resources).length).toBe(12); // 2 LayerVersions, 10 LayerVersionPermissions
  });

  it('should generate the expected CFN for an existing LL version and new version with public permission', () => {
    // Public should override other permissions
    const permissions: LayerPermission[] = [
      { type: PermissionEnum.Private },
      { type: PermissionEnum.AwsAccounts, accounts: ['123456789012', '098765432112'] },
      { type: PermissionEnum.AwsOrg, orgs: ['o-123456789012', 'o-098765432112'] },
      { type: PermissionEnum.Public },
    ];
    fakeLayerCfnMeta.permissions = permissions;
    parameters_stub.permissions = permissions;
    const layerCfn = generateLayerCfnObj(true, parameters_stub, [fakeLayerCfnMeta]);
    validateParameters(layerCfn);
    validateOutput(layerCfn);
    expect(Object.keys(layerCfn.Resources).length).toBe(4); // 2 LayerVersions, 2 LayerVersionPermissions
  });
});

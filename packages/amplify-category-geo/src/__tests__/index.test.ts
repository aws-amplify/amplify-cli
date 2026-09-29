import { $TSContext, $TSObject, stateManager } from '@aws-amplify/amplify-cli-core';
import { getPermissionPolicies } from '../index';

jest.mock('@aws-amplify/amplify-cli-core');

describe('only grant permission policies as requested', () => {
  let mockContext: $TSContext;
  // construct mock amplify meta
  const mockAmplifyMeta: $TSObject = {
    geo: {
      map12345: {
        service: 'Map',
      },
      index12345: {
        service: 'PlaceIndex',
      },
      collection12345: {
        service: 'GeofenceCollection',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      print: {
        info: jest.fn(),
        warning: jest.fn(),
      },
      amplify: {},
    } as unknown as $TSContext;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
  });

  it('verify CRUD policies being granted', async () => {
    const crudOptions = ['create', 'read', 'update', 'delete'];
    const mockResourceOpsMapping = {
      map12345: crudOptions,
      index12345: crudOptions,
      collection12345: crudOptions,
    };

    const { permissionPolicies, resourceAttributes } = getPermissionPolicies(mockContext, mockResourceOpsMapping);
    expect(permissionPolicies).toMatchSnapshot();
    expect(resourceAttributes).toMatchSnapshot();
  });

  it('verify create policies being granted', async () => {
    const crudOptions = ['create'];
    const mockResourceOpsMapping = {
      map12345: crudOptions,
      index12345: crudOptions,
      collection12345: crudOptions,
    };

    const { permissionPolicies, resourceAttributes } = getPermissionPolicies(mockContext, mockResourceOpsMapping);
    expect(permissionPolicies).toMatchSnapshot();
    expect(resourceAttributes).toMatchSnapshot();
  });

  it('verify read policies being granted', async () => {
    const crudOptions = ['read'];
    const mockResourceOpsMapping = {
      map12345: crudOptions,
      index12345: crudOptions,
      collection12345: crudOptions,
    };

    const { permissionPolicies, resourceAttributes } = getPermissionPolicies(mockContext, mockResourceOpsMapping);
    expect(permissionPolicies).toMatchSnapshot();
    expect(resourceAttributes).toMatchSnapshot();
  });

  it('verify update policies being granted', async () => {
    const crudOptions = ['update'];
    const mockResourceOpsMapping = {
      map12345: crudOptions,
      index12345: crudOptions,
      collection12345: crudOptions,
    };

    const { permissionPolicies, resourceAttributes } = getPermissionPolicies(mockContext, mockResourceOpsMapping);
    expect(permissionPolicies).toMatchSnapshot();
    expect(resourceAttributes).toMatchSnapshot();
  });

  it('verify delete policies being granted', async () => {
    const crudOptions = ['delete'];
    const mockResourceOpsMapping = {
      map12345: crudOptions,
      index12345: crudOptions,
      collection12345: crudOptions,
    };

    const { permissionPolicies, resourceAttributes } = getPermissionPolicies(mockContext, mockResourceOpsMapping);
    expect(permissionPolicies).toMatchSnapshot();
    expect(resourceAttributes).toMatchSnapshot();
  });
});

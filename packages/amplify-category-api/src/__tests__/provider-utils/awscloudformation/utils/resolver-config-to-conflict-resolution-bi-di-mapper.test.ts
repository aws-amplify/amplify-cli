import { ConflictResolution } from 'amplify-headless-interface';
import {
  conflictResolutionToResolverConfig,
  resolverConfigToConflictResolution,
} from '../../../../provider-utils/awscloudformation/utils/resolver-config-to-conflict-resolution-bi-di-mapper';
import { ResolverConfig, ConflictHandlerType } from 'graphql-transformer-core';

describe('transform ConflictResolution to ResolverConfig', () => {
  it('maps properties correctly', () => {
    const conflictResolution: ConflictResolution = {
      defaultResolutionStrategy: {
        type: 'AUTOMERGE',
      },
      perModelResolutionStrategy: [
        {
          entityName: 'MyType',
          resolutionStrategy: {
            type: 'LAMBDA',
            resolver: {
              type: 'EXISTING',
              name: 'someLambdaName',
            },
          },
        },
      ],
    };
    expect(conflictResolutionToResolverConfig(conflictResolution)).toMatchSnapshot();
  });

  it('throws when trying to convert new lambda resolution strategy', () => {
    const conflictResolution: ConflictResolution = {
      defaultResolutionStrategy: {
        type: 'LAMBDA',
        resolver: {
          type: 'NEW',
        },
      },
    };

    expect(() => conflictResolutionToResolverConfig(conflictResolution)).toThrowErrorMatchingSnapshot();
  });

  it('returns an empty object when ConflictResolution is not present', () => {
    expect(conflictResolutionToResolverConfig(undefined)).toEqual({});
  });
});

describe('transform ResolverConfig to ConflictResolution', () => {
  it('maps properties correctly', () => {
    const resolverConfig: ResolverConfig = {
      project: {
        ConflictHandler: ConflictHandlerType.AUTOMERGE,
        ConflictDetection: 'VERSION',
      },
      models: {
        MyType: {
          ConflictHandler: ConflictHandlerType.LAMBDA,
          ConflictDetection: 'VERSION',
          LambdaConflictHandler: {
            name: 'myLambdaConflictHandler',
          },
        },
      },
    };

    expect(resolverConfigToConflictResolution(resolverConfig)).toMatchSnapshot();
  });

  it('returns an empty object when ResolverConfig is not present', () => {
    expect(resolverConfigToConflictResolution(undefined)).toEqual({});
  });
});

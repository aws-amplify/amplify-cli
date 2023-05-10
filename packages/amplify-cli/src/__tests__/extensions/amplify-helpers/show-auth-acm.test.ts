import { DEFAULT_GROUP_CLAIM } from '@aws-amplify/graphql-auth-transformer';
import { showACM } from '../../../extensions/amplify-helpers/show-auth-acm';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  FeatureFlags: {
    getBoolean: () => true,
  },
}));

describe('show-auth-acm helper: ', () => {
  let functionArguments: { sdl: string; node: 'Blog' };

  it('...the show-auth-acm helper should be exported', () => {
    expect(showACM).toBeDefined();
  });

  it('...should return a function', () => {
    expect(typeof showACM).toEqual('function');
  });

  describe('case: where identical auth rules exist with default group claim', () => {
    beforeEach(() => {
      functionArguments = {
        sdl: `type Blog 
            @model 
            @auth(rules: [
              { allow: groups, groupsField: "tenantId" }
              { allow: groups, groupsField: "tenantId" }
            ])
          {
            id: ID!
            name: String!
            tenantId: String!
          }`,
        node: 'Blog',
      };
    });

    it('...should throw a specific exception', () => {
      expect(() => showACM(functionArguments.sdl, functionArguments.node)).toThrow(
        `@auth userPools:dynamicGroup:${DEFAULT_GROUP_CLAIM}:tenantId already exists for Blog`,
      );
    });
  });

  describe('case: where identical auth rules exist with custom group claim', () => {
    beforeEach(() => {
      functionArguments = {
        sdl: `type Blog 
            @model 
            @auth(rules: [
              { allow: groups, groupsField: "tenantId", groupClaim: "custom:adminRole" }
              { allow: groups, groupsField: "tenantId", groupClaim: "custom:adminRole" }
              { allow: groups, groupsField: "tenantId", groupClaim: "custom:editorRole", operations: [read, update] }
            ])
          {
            id: ID!
            name: String!
            tenantId: String!
          }`,
        node: 'Blog',
      };
    });

    it('...should throw a specific exception', () => {
      expect(() => showACM(functionArguments.sdl, functionArguments.node)).toThrow(
        `@auth userPools:dynamicGroup:custom:adminRole:tenantId already exists for Blog`,
      );
    });
  });

  describe('case: auth rules with a custom groupField are distinguished by a custom group claim', () => {
    beforeEach(() => {
      functionArguments = {
        sdl: `type Blog 
            @model 
            @auth(rules: [
              { allow: groups, groupsField: "tenantId", groupClaim: "custom:adminRole" }
              { allow: groups, groupsField: "tenantId", groupClaim: "custom:editorRole", operations: [read, update] }
            ])
          {
            id: ID!
            name: String!
            tenantId: String!
          }`,
        node: 'Blog',
      };
    });

    it('...should complete without exception', () => {
      const callShowAcm = jest.fn(() => showACM(functionArguments.sdl, functionArguments.node));

      callShowAcm();

      expect(callShowAcm).toHaveReturned();
    });
  });
});

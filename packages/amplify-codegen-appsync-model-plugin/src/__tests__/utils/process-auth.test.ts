import {
  processAuthDirective,
  AuthRule,
  AuthStrategy,
  AuthProvider,
  AuthModelOperation,
  AuthModelMutation,
} from '../../utils/process-auth';
import { CodeGenDirectives, CodeGenDirective } from '../../visitors/appsync-visitor';
const buildAuthDirective = (authRule: AuthRule): CodeGenDirective => {
  return {
    name: 'auth',
    arguments: {
      rules: [authRule],
    },
  };
};
describe('process auth directive', () => {
  let ownerAuthRule: AuthRule;
  beforeEach(() => {
    ownerAuthRule = {
      allow: AuthStrategy.owner,
    };
  });
  describe('Owner auth', () => {
    it('should add default owner field when owner auth is missing ownerField', () => {
      ownerAuthRule.identityClaim = 'owner';
      ownerAuthRule.operations = [AuthModelOperation.read];
      ownerAuthRule.provider = AuthProvider.userPools;

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        ownerField: 'owner',
      });
    });

    it('should add default identityClaim cognito:userName if the directive is missing it', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.operations = [AuthModelOperation.read];
      ownerAuthRule.provider = AuthProvider.userPools;

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        identityClaim: 'cognito:username',
      });
    });

    it('should change identityClaim to cognito:userName when its username', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.operations = [AuthModelOperation.read];
      ownerAuthRule.provider = AuthProvider.userPools;
      ownerAuthRule.identityClaim = 'username';

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        identityClaim: 'cognito:username',
      });
    });

    it('should change identityField to identityClaim', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.operations = [AuthModelOperation.read];
      ownerAuthRule.provider = AuthProvider.userPools;
      ownerAuthRule.identityField = 'username';

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        identityClaim: 'cognito:username',
      });
    });

    it('should add operations when its missing', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.provider = AuthProvider.userPools;
      ownerAuthRule.identityClaim = 'user_name';

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        operations: [AuthModelOperation.create, AuthModelOperation.update, AuthModelOperation.delete],
      });
    });

    it('should use deprecated mutation field value for operations', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.provider = AuthProvider.userPools;
      ownerAuthRule.identityClaim = 'user_name';
      ownerAuthRule.mutations = [AuthModelMutation.delete];

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        operations: [AuthModelMutation.delete],
      });
    });

    it('should add provider when its missing', () => {
      ownerAuthRule.ownerField = 'username';
      ownerAuthRule.operations = [AuthModelOperation.create, AuthModelOperation.update, AuthModelOperation.delete];
      ownerAuthRule.identityClaim = 'user_name';

      const directives: CodeGenDirectives = [buildAuthDirective(ownerAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...ownerAuthRule,
        provider: AuthProvider.userPools,
      });
    });
  });

  describe('Group auth', () => {
    let groupsAuthRule: AuthRule;
    beforeEach(() => {
      groupsAuthRule = {
        allow: AuthStrategy.groups,
      };
    });
    it('should filter dynamic group auth rule', () => {
      groupsAuthRule.groupField = 'my-group';
      const directives: CodeGenDirectives = [buildAuthDirective(groupsAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules).toHaveLength(0);
    });

    it('should add groupClaim field when its missing', () => {
      groupsAuthRule.provider = AuthProvider.oidc;
      groupsAuthRule.groups = ['Foo'];
      groupsAuthRule.operations = [AuthModelOperation.update];
      const directives: CodeGenDirectives = [buildAuthDirective(groupsAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...groupsAuthRule,
        groupClaim: 'cognito:groups',
      });
    });

    it('should add provider field when its missing', () => {
      groupsAuthRule.groupClaim = 'my:groups';
      groupsAuthRule.groups = ['Foo'];
      groupsAuthRule.operations = [AuthModelOperation.update];
      const directives: CodeGenDirectives = [buildAuthDirective(groupsAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...groupsAuthRule,
        provider: AuthProvider.userPools,
      });
    });

    it('should add default operations when its missing', () => {
      groupsAuthRule.groupClaim = 'my:groups';
      groupsAuthRule.groups = ['Foo'];
      groupsAuthRule.provider = AuthProvider.userPools;
      const directives: CodeGenDirectives = [buildAuthDirective(groupsAuthRule)];
      const processedAuthDirective = processAuthDirective(directives);
      expect(processedAuthDirective[0].arguments.rules[0]).toEqual({
        ...groupsAuthRule,
        operations: [AuthModelOperation.create, AuthModelOperation.update, AuthModelOperation.delete],
      });
    });
  });
});

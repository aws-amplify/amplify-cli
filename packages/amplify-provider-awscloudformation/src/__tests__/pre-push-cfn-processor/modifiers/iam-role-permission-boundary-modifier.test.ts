import { getPermissionBoundaryArn } from 'amplify-cli-core';
import Role from 'cloudform-types/types/iam/role';
import _ from 'lodash';
import { iamRolePermissionBoundaryModifier } from '../../../pre-push-cfn-processor/modifiers/iam-role-permission-boundary-modifier';

jest.mock('amplify-cli-core');

const getPermissionBoundaryArn_mock = getPermissionBoundaryArn as jest.MockedFunction<typeof getPermissionBoundaryArn>;

describe('iamRolePermissionBoundaryModifier', () => {
  it('does not overwrite existing permission boundary', async () => {
    const origResource = {
      Properties: {
        PermissionsBoundary: 'something',
      },
    } as Role;
    const newResource = await iamRolePermissionBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource).toEqual(origResource);
  });

  it('does not modify the resource if no policy arn is specified', async () => {
    const origResource = {
      Type: 'something',
      Properties: {},
    } as Role;
    getPermissionBoundaryArn_mock.mockReturnValue(undefined);
    const newResource = await iamRolePermissionBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource).toEqual(origResource);
  });

  it('applies the specified policy arn', async () => {
    const origResource = {
      Type: 'something',
      Properties: {},
    } as Role;
    const testPermissionBoundaryArn = 'testPermissionBoundaryArn';
    getPermissionBoundaryArn_mock.mockReturnValue(testPermissionBoundaryArn);
    const newResource = await iamRolePermissionBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource.Properties.PermissionsBoundary).toEqual(testPermissionBoundaryArn);
  });
});

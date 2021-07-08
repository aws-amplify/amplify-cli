import { getPermissionsBoundaryArn } from 'amplify-cli-core';
import Role from 'cloudform-types/types/iam/role';
import _ from 'lodash';
import { iamRolePermissionsBoundaryModifier } from '../../../pre-push-cfn-processor/modifiers/iam-role-permissions-boundary-modifier';

jest.mock('amplify-cli-core');

const getPermissionsBoundaryArn_mock = getPermissionsBoundaryArn as jest.MockedFunction<typeof getPermissionsBoundaryArn>;

describe('iamRolePermissionsBoundaryModifier', () => {
  it('does not overwrite existing permissions boundary', async () => {
    const origResource = {
      Properties: {
        PermissionsBoundary: 'something',
      },
    } as Role;
    const newResource = await iamRolePermissionsBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource).toEqual(origResource);
  });

  it('does not modify the resource if no policy arn is specified', async () => {
    const origResource = {
      Type: 'something',
      Properties: {},
    } as Role;
    getPermissionsBoundaryArn_mock.mockReturnValue(undefined);
    const newResource = await iamRolePermissionsBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource).toEqual(origResource);
  });

  it('applies the specified policy arn', async () => {
    const origResource = {
      Type: 'something',
      Properties: {},
    } as Role;
    const testPermissionsBoundaryArn = 'testPermissionsBoundaryArn';
    getPermissionsBoundaryArn_mock.mockReturnValue(testPermissionsBoundaryArn);
    const newResource = await iamRolePermissionsBoundaryModifier(_.cloneDeep(origResource));
    expect(newResource.Properties.PermissionsBoundary).toEqual(testPermissionsBoundaryArn);
  });
});

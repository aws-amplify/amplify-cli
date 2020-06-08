import{createVersionsMap,} from '../../../../provider-utils/awscloudformation/utils/layerHelpers';
import {Permissions, LayerPermission, LayerParameters } from '../../../../provider-utils/awscloudformation/utils/layerParams';

const parameters1 : Partial<LayerParameters> = {
     layerName: "random1",
     layerPermissions: [Permissions.awsOrg,Permissions.private],
     authorizedOrgId: "o-sjdnfkjsdncjks,o-swjbnfsdjkbf"
}
const parameters2 : Partial<LayerParameters> = {
     layerName: "random2",
     layerPermissions: [Permissions.public,Permissions.private],
}

const parameters3 : Partial<LayerParameters> = {
     layerName: "random3",
     layerPermissions: [Permissions.awsOrg,Permissions.awsAccounts,Permissions.private,Permissions.public],
     authorizedOrgId: "o-sjdnfkjsdncjks,o-swjbnfsdjkbf",
     authorizedAccountIds: "111111111111,222222222222,333333333333"
}

const parameters4 : Partial<LayerParameters> = {
     layerName: "random4",
     layerPermissions: [Permissions.awsAccounts,Permissions.private],
     authorizedAccountIds: "111111111111,222222222222,333333333333"
}


describe('Create Version Map Function', () => {

     it('Case 1', () => {
          expect(createVersionsMap(parameters1,"1")).toMatchSnapshot();
     });
     it(' case 2', () => {
          expect(createVersionsMap(parameters2,"2")).toMatchSnapshot();
     });
   
     it('case3', () => {
          expect(createVersionsMap(parameters3,"3")).toMatchSnapshot();
     });
   
     it('case4', () => {
          expect(createVersionsMap(parameters4,"4")).toMatchSnapshot()
     });
   });








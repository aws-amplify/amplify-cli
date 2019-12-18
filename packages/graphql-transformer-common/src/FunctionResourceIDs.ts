import { simplifyName } from './util';
import * as shortid from 'shortid';

export class FunctionResourceIDs {
  static FunctionDataSourceID(name: string, region?: string): string {
    return `${simplifyName(name)}${simplifyName(region || '')}LambdaDataSource`;
  }

  static FunctionIAMRoleID(name: string, region?: string): string {
    return `${FunctionResourceIDs.FunctionDataSourceID(name, region)}Role`;
  }

  static FunctionIAMRoleName(name: string, withEnv: boolean = false): string {
    if (withEnv) {
      return `${simplifyName(name).slice(0, 18)}${shortid.generate()}`;
    }
    return `${simplifyName(name).slice(0, 28)}${shortid.generate()}`;
  }

  static FunctionAppSyncFunctionConfigurationID(name: string, region?: string): string {
    return `Invoke${FunctionResourceIDs.FunctionDataSourceID(name, region)}`;
  }
}

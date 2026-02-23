import { TypeRegistry } from "@smithy/core/schema";
import {
  StaticErrorSchema,
  StaticOperationSchema,
  StaticStructureSchema,
} from "@smithy/types";
export declare var SSOServiceException$: StaticErrorSchema;
export declare var InvalidRequestException$: StaticErrorSchema;
export declare var ResourceNotFoundException$: StaticErrorSchema;
export declare var TooManyRequestsException$: StaticErrorSchema;
export declare var UnauthorizedException$: StaticErrorSchema;
export declare const errorTypeRegistries: TypeRegistry[];
export declare var AccountInfo$: StaticStructureSchema;
export declare var GetRoleCredentialsRequest$: StaticStructureSchema;
export declare var GetRoleCredentialsResponse$: StaticStructureSchema;
export declare var ListAccountRolesRequest$: StaticStructureSchema;
export declare var ListAccountRolesResponse$: StaticStructureSchema;
export declare var ListAccountsRequest$: StaticStructureSchema;
export declare var ListAccountsResponse$: StaticStructureSchema;
export declare var LogoutRequest$: StaticStructureSchema;
export declare var RoleCredentials$: StaticStructureSchema;
export declare var RoleInfo$: StaticStructureSchema;
export declare var GetRoleCredentials$: StaticOperationSchema;
export declare var ListAccountRoles$: StaticOperationSchema;
export declare var ListAccounts$: StaticOperationSchema;
export declare var Logout$: StaticOperationSchema;

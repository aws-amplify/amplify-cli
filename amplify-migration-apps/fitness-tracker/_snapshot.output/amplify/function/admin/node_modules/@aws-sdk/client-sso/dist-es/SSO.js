import { createAggregatedClient } from "@smithy/smithy-client";
import { GetRoleCredentialsCommand, } from "./commands/GetRoleCredentialsCommand";
import { ListAccountRolesCommand, } from "./commands/ListAccountRolesCommand";
import { ListAccountsCommand, } from "./commands/ListAccountsCommand";
import { LogoutCommand } from "./commands/LogoutCommand";
import { paginateListAccountRoles } from "./pagination/ListAccountRolesPaginator";
import { paginateListAccounts } from "./pagination/ListAccountsPaginator";
import { SSOClient } from "./SSOClient";
const commands = {
    GetRoleCredentialsCommand,
    ListAccountRolesCommand,
    ListAccountsCommand,
    LogoutCommand,
};
const paginators = {
    paginateListAccountRoles,
    paginateListAccounts,
};
export class SSO extends SSOClient {
}
createAggregatedClient(commands, SSO, { paginators });

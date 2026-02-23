import {
  HttpHandlerOptions as __HttpHandlerOptions,
  PaginationConfiguration,
  Paginator,
} from "@smithy/types";
import {
  GetRoleCredentialsCommandInput,
  GetRoleCredentialsCommandOutput,
} from "./commands/GetRoleCredentialsCommand";
import {
  ListAccountRolesCommandInput,
  ListAccountRolesCommandOutput,
} from "./commands/ListAccountRolesCommand";
import {
  ListAccountsCommandInput,
  ListAccountsCommandOutput,
} from "./commands/ListAccountsCommand";
import {
  LogoutCommandInput,
  LogoutCommandOutput,
} from "./commands/LogoutCommand";
import { SSOClient } from "./SSOClient";
export interface SSO {
  getRoleCredentials(
    args: GetRoleCredentialsCommandInput,
    options?: __HttpHandlerOptions
  ): Promise<GetRoleCredentialsCommandOutput>;
  getRoleCredentials(
    args: GetRoleCredentialsCommandInput,
    cb: (err: any, data?: GetRoleCredentialsCommandOutput) => void
  ): void;
  getRoleCredentials(
    args: GetRoleCredentialsCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: GetRoleCredentialsCommandOutput) => void
  ): void;
  listAccountRoles(
    args: ListAccountRolesCommandInput,
    options?: __HttpHandlerOptions
  ): Promise<ListAccountRolesCommandOutput>;
  listAccountRoles(
    args: ListAccountRolesCommandInput,
    cb: (err: any, data?: ListAccountRolesCommandOutput) => void
  ): void;
  listAccountRoles(
    args: ListAccountRolesCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: ListAccountRolesCommandOutput) => void
  ): void;
  listAccounts(
    args: ListAccountsCommandInput,
    options?: __HttpHandlerOptions
  ): Promise<ListAccountsCommandOutput>;
  listAccounts(
    args: ListAccountsCommandInput,
    cb: (err: any, data?: ListAccountsCommandOutput) => void
  ): void;
  listAccounts(
    args: ListAccountsCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: ListAccountsCommandOutput) => void
  ): void;
  logout(
    args: LogoutCommandInput,
    options?: __HttpHandlerOptions
  ): Promise<LogoutCommandOutput>;
  logout(
    args: LogoutCommandInput,
    cb: (err: any, data?: LogoutCommandOutput) => void
  ): void;
  logout(
    args: LogoutCommandInput,
    options: __HttpHandlerOptions,
    cb: (err: any, data?: LogoutCommandOutput) => void
  ): void;
  paginateListAccountRoles(
    args: ListAccountRolesCommandInput,
    paginationConfig?: Pick<
      PaginationConfiguration,
      Exclude<keyof PaginationConfiguration, "client">
    >
  ): Paginator<ListAccountRolesCommandOutput>;
  paginateListAccounts(
    args: ListAccountsCommandInput,
    paginationConfig?: Pick<
      PaginationConfiguration,
      Exclude<keyof PaginationConfiguration, "client">
    >
  ): Paginator<ListAccountsCommandOutput>;
}
export declare class SSO extends SSOClient implements SSO {}

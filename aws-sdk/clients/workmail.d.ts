import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class WorkMail extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: WorkMail.Types.ClientConfiguration)
  config: Config & WorkMail.Types.ClientConfiguration;
  /**
   * Adds a member to the resource's set of delegates.
   */
  associateDelegateToResource(params: WorkMail.Types.AssociateDelegateToResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.AssociateDelegateToResourceResponse) => void): Request<WorkMail.Types.AssociateDelegateToResourceResponse, AWSError>;
  /**
   * Adds a member to the resource's set of delegates.
   */
  associateDelegateToResource(callback?: (err: AWSError, data: WorkMail.Types.AssociateDelegateToResourceResponse) => void): Request<WorkMail.Types.AssociateDelegateToResourceResponse, AWSError>;
  /**
   * Adds a member to the group's set.
   */
  associateMemberToGroup(params: WorkMail.Types.AssociateMemberToGroupRequest, callback?: (err: AWSError, data: WorkMail.Types.AssociateMemberToGroupResponse) => void): Request<WorkMail.Types.AssociateMemberToGroupResponse, AWSError>;
  /**
   * Adds a member to the group's set.
   */
  associateMemberToGroup(callback?: (err: AWSError, data: WorkMail.Types.AssociateMemberToGroupResponse) => void): Request<WorkMail.Types.AssociateMemberToGroupResponse, AWSError>;
  /**
   * Adds an alias to the set of a given member of Amazon WorkMail.
   */
  createAlias(params: WorkMail.Types.CreateAliasRequest, callback?: (err: AWSError, data: WorkMail.Types.CreateAliasResponse) => void): Request<WorkMail.Types.CreateAliasResponse, AWSError>;
  /**
   * Adds an alias to the set of a given member of Amazon WorkMail.
   */
  createAlias(callback?: (err: AWSError, data: WorkMail.Types.CreateAliasResponse) => void): Request<WorkMail.Types.CreateAliasResponse, AWSError>;
  /**
   * Creates a group that can be used in Amazon WorkMail by calling the RegisterToWorkMail operation.
   */
  createGroup(params: WorkMail.Types.CreateGroupRequest, callback?: (err: AWSError, data: WorkMail.Types.CreateGroupResponse) => void): Request<WorkMail.Types.CreateGroupResponse, AWSError>;
  /**
   * Creates a group that can be used in Amazon WorkMail by calling the RegisterToWorkMail operation.
   */
  createGroup(callback?: (err: AWSError, data: WorkMail.Types.CreateGroupResponse) => void): Request<WorkMail.Types.CreateGroupResponse, AWSError>;
  /**
   * Creates a new Amazon WorkMail resource. The available types are equipment and room.
   */
  createResource(params: WorkMail.Types.CreateResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.CreateResourceResponse) => void): Request<WorkMail.Types.CreateResourceResponse, AWSError>;
  /**
   * Creates a new Amazon WorkMail resource. The available types are equipment and room.
   */
  createResource(callback?: (err: AWSError, data: WorkMail.Types.CreateResourceResponse) => void): Request<WorkMail.Types.CreateResourceResponse, AWSError>;
  /**
   * Creates a user who can be used in Amazon WorkMail by calling the RegisterToWorkMail operation.
   */
  createUser(params: WorkMail.Types.CreateUserRequest, callback?: (err: AWSError, data: WorkMail.Types.CreateUserResponse) => void): Request<WorkMail.Types.CreateUserResponse, AWSError>;
  /**
   * Creates a user who can be used in Amazon WorkMail by calling the RegisterToWorkMail operation.
   */
  createUser(callback?: (err: AWSError, data: WorkMail.Types.CreateUserResponse) => void): Request<WorkMail.Types.CreateUserResponse, AWSError>;
  /**
   * Remove the alias from a set of aliases for a given user.
   */
  deleteAlias(params: WorkMail.Types.DeleteAliasRequest, callback?: (err: AWSError, data: WorkMail.Types.DeleteAliasResponse) => void): Request<WorkMail.Types.DeleteAliasResponse, AWSError>;
  /**
   * Remove the alias from a set of aliases for a given user.
   */
  deleteAlias(callback?: (err: AWSError, data: WorkMail.Types.DeleteAliasResponse) => void): Request<WorkMail.Types.DeleteAliasResponse, AWSError>;
  /**
   * Deletes a group from Amazon WorkMail.
   */
  deleteGroup(params: WorkMail.Types.DeleteGroupRequest, callback?: (err: AWSError, data: WorkMail.Types.DeleteGroupResponse) => void): Request<WorkMail.Types.DeleteGroupResponse, AWSError>;
  /**
   * Deletes a group from Amazon WorkMail.
   */
  deleteGroup(callback?: (err: AWSError, data: WorkMail.Types.DeleteGroupResponse) => void): Request<WorkMail.Types.DeleteGroupResponse, AWSError>;
  /**
   * Deletes permissions granted to a user or group.
   */
  deleteMailboxPermissions(params: WorkMail.Types.DeleteMailboxPermissionsRequest, callback?: (err: AWSError, data: WorkMail.Types.DeleteMailboxPermissionsResponse) => void): Request<WorkMail.Types.DeleteMailboxPermissionsResponse, AWSError>;
  /**
   * Deletes permissions granted to a user or group.
   */
  deleteMailboxPermissions(callback?: (err: AWSError, data: WorkMail.Types.DeleteMailboxPermissionsResponse) => void): Request<WorkMail.Types.DeleteMailboxPermissionsResponse, AWSError>;
  /**
   * Deletes the specified resource. 
   */
  deleteResource(params: WorkMail.Types.DeleteResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.DeleteResourceResponse) => void): Request<WorkMail.Types.DeleteResourceResponse, AWSError>;
  /**
   * Deletes the specified resource. 
   */
  deleteResource(callback?: (err: AWSError, data: WorkMail.Types.DeleteResourceResponse) => void): Request<WorkMail.Types.DeleteResourceResponse, AWSError>;
  /**
   * Deletes a user from Amazon WorkMail and all subsequent systems. The action can't be undone. The mailbox is kept as-is for a minimum of 30 days, without any means to restore it. 
   */
  deleteUser(params: WorkMail.Types.DeleteUserRequest, callback?: (err: AWSError, data: WorkMail.Types.DeleteUserResponse) => void): Request<WorkMail.Types.DeleteUserResponse, AWSError>;
  /**
   * Deletes a user from Amazon WorkMail and all subsequent systems. The action can't be undone. The mailbox is kept as-is for a minimum of 30 days, without any means to restore it. 
   */
  deleteUser(callback?: (err: AWSError, data: WorkMail.Types.DeleteUserResponse) => void): Request<WorkMail.Types.DeleteUserResponse, AWSError>;
  /**
   * Mark a user, group, or resource as no longer used in Amazon WorkMail. This action disassociates the mailbox and schedules it for clean-up. Amazon WorkMail keeps mailboxes for 30 days before they are permanently removed. The functionality in the console is Disable.
   */
  deregisterFromWorkMail(params: WorkMail.Types.DeregisterFromWorkMailRequest, callback?: (err: AWSError, data: WorkMail.Types.DeregisterFromWorkMailResponse) => void): Request<WorkMail.Types.DeregisterFromWorkMailResponse, AWSError>;
  /**
   * Mark a user, group, or resource as no longer used in Amazon WorkMail. This action disassociates the mailbox and schedules it for clean-up. Amazon WorkMail keeps mailboxes for 30 days before they are permanently removed. The functionality in the console is Disable.
   */
  deregisterFromWorkMail(callback?: (err: AWSError, data: WorkMail.Types.DeregisterFromWorkMailResponse) => void): Request<WorkMail.Types.DeregisterFromWorkMailResponse, AWSError>;
  /**
   * Returns the data available for the group.
   */
  describeGroup(params: WorkMail.Types.DescribeGroupRequest, callback?: (err: AWSError, data: WorkMail.Types.DescribeGroupResponse) => void): Request<WorkMail.Types.DescribeGroupResponse, AWSError>;
  /**
   * Returns the data available for the group.
   */
  describeGroup(callback?: (err: AWSError, data: WorkMail.Types.DescribeGroupResponse) => void): Request<WorkMail.Types.DescribeGroupResponse, AWSError>;
  /**
   * Provides more information regarding a given organization based on its identifier.
   */
  describeOrganization(params: WorkMail.Types.DescribeOrganizationRequest, callback?: (err: AWSError, data: WorkMail.Types.DescribeOrganizationResponse) => void): Request<WorkMail.Types.DescribeOrganizationResponse, AWSError>;
  /**
   * Provides more information regarding a given organization based on its identifier.
   */
  describeOrganization(callback?: (err: AWSError, data: WorkMail.Types.DescribeOrganizationResponse) => void): Request<WorkMail.Types.DescribeOrganizationResponse, AWSError>;
  /**
   * Returns the data available for the resource.
   */
  describeResource(params: WorkMail.Types.DescribeResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.DescribeResourceResponse) => void): Request<WorkMail.Types.DescribeResourceResponse, AWSError>;
  /**
   * Returns the data available for the resource.
   */
  describeResource(callback?: (err: AWSError, data: WorkMail.Types.DescribeResourceResponse) => void): Request<WorkMail.Types.DescribeResourceResponse, AWSError>;
  /**
   * Provides information regarding the user.
   */
  describeUser(params: WorkMail.Types.DescribeUserRequest, callback?: (err: AWSError, data: WorkMail.Types.DescribeUserResponse) => void): Request<WorkMail.Types.DescribeUserResponse, AWSError>;
  /**
   * Provides information regarding the user.
   */
  describeUser(callback?: (err: AWSError, data: WorkMail.Types.DescribeUserResponse) => void): Request<WorkMail.Types.DescribeUserResponse, AWSError>;
  /**
   * Removes a member from the resource's set of delegates.
   */
  disassociateDelegateFromResource(params: WorkMail.Types.DisassociateDelegateFromResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.DisassociateDelegateFromResourceResponse) => void): Request<WorkMail.Types.DisassociateDelegateFromResourceResponse, AWSError>;
  /**
   * Removes a member from the resource's set of delegates.
   */
  disassociateDelegateFromResource(callback?: (err: AWSError, data: WorkMail.Types.DisassociateDelegateFromResourceResponse) => void): Request<WorkMail.Types.DisassociateDelegateFromResourceResponse, AWSError>;
  /**
   * Removes a member from a group.
   */
  disassociateMemberFromGroup(params: WorkMail.Types.DisassociateMemberFromGroupRequest, callback?: (err: AWSError, data: WorkMail.Types.DisassociateMemberFromGroupResponse) => void): Request<WorkMail.Types.DisassociateMemberFromGroupResponse, AWSError>;
  /**
   * Removes a member from a group.
   */
  disassociateMemberFromGroup(callback?: (err: AWSError, data: WorkMail.Types.DisassociateMemberFromGroupResponse) => void): Request<WorkMail.Types.DisassociateMemberFromGroupResponse, AWSError>;
  /**
   * Creates a paginated call to list the aliases associated with a given entity.
   */
  listAliases(params: WorkMail.Types.ListAliasesRequest, callback?: (err: AWSError, data: WorkMail.Types.ListAliasesResponse) => void): Request<WorkMail.Types.ListAliasesResponse, AWSError>;
  /**
   * Creates a paginated call to list the aliases associated with a given entity.
   */
  listAliases(callback?: (err: AWSError, data: WorkMail.Types.ListAliasesResponse) => void): Request<WorkMail.Types.ListAliasesResponse, AWSError>;
  /**
   * Returns an overview of the members of a group.
   */
  listGroupMembers(params: WorkMail.Types.ListGroupMembersRequest, callback?: (err: AWSError, data: WorkMail.Types.ListGroupMembersResponse) => void): Request<WorkMail.Types.ListGroupMembersResponse, AWSError>;
  /**
   * Returns an overview of the members of a group.
   */
  listGroupMembers(callback?: (err: AWSError, data: WorkMail.Types.ListGroupMembersResponse) => void): Request<WorkMail.Types.ListGroupMembersResponse, AWSError>;
  /**
   * Returns summaries of the organization's groups.
   */
  listGroups(params: WorkMail.Types.ListGroupsRequest, callback?: (err: AWSError, data: WorkMail.Types.ListGroupsResponse) => void): Request<WorkMail.Types.ListGroupsResponse, AWSError>;
  /**
   * Returns summaries of the organization's groups.
   */
  listGroups(callback?: (err: AWSError, data: WorkMail.Types.ListGroupsResponse) => void): Request<WorkMail.Types.ListGroupsResponse, AWSError>;
  /**
   * Lists the mailbox permissions associated with a mailbox.
   */
  listMailboxPermissions(params: WorkMail.Types.ListMailboxPermissionsRequest, callback?: (err: AWSError, data: WorkMail.Types.ListMailboxPermissionsResponse) => void): Request<WorkMail.Types.ListMailboxPermissionsResponse, AWSError>;
  /**
   * Lists the mailbox permissions associated with a mailbox.
   */
  listMailboxPermissions(callback?: (err: AWSError, data: WorkMail.Types.ListMailboxPermissionsResponse) => void): Request<WorkMail.Types.ListMailboxPermissionsResponse, AWSError>;
  /**
   * Returns summaries of the customer's non-deleted organizations.
   */
  listOrganizations(params: WorkMail.Types.ListOrganizationsRequest, callback?: (err: AWSError, data: WorkMail.Types.ListOrganizationsResponse) => void): Request<WorkMail.Types.ListOrganizationsResponse, AWSError>;
  /**
   * Returns summaries of the customer's non-deleted organizations.
   */
  listOrganizations(callback?: (err: AWSError, data: WorkMail.Types.ListOrganizationsResponse) => void): Request<WorkMail.Types.ListOrganizationsResponse, AWSError>;
  /**
   * Lists the delegates associated with a resource. Users and groups can be resource delegates and answer requests on behalf of the resource.
   */
  listResourceDelegates(params: WorkMail.Types.ListResourceDelegatesRequest, callback?: (err: AWSError, data: WorkMail.Types.ListResourceDelegatesResponse) => void): Request<WorkMail.Types.ListResourceDelegatesResponse, AWSError>;
  /**
   * Lists the delegates associated with a resource. Users and groups can be resource delegates and answer requests on behalf of the resource.
   */
  listResourceDelegates(callback?: (err: AWSError, data: WorkMail.Types.ListResourceDelegatesResponse) => void): Request<WorkMail.Types.ListResourceDelegatesResponse, AWSError>;
  /**
   * Returns summaries of the organization's resources.
   */
  listResources(params: WorkMail.Types.ListResourcesRequest, callback?: (err: AWSError, data: WorkMail.Types.ListResourcesResponse) => void): Request<WorkMail.Types.ListResourcesResponse, AWSError>;
  /**
   * Returns summaries of the organization's resources.
   */
  listResources(callback?: (err: AWSError, data: WorkMail.Types.ListResourcesResponse) => void): Request<WorkMail.Types.ListResourcesResponse, AWSError>;
  /**
   * Returns summaries of the organization's users.
   */
  listUsers(params: WorkMail.Types.ListUsersRequest, callback?: (err: AWSError, data: WorkMail.Types.ListUsersResponse) => void): Request<WorkMail.Types.ListUsersResponse, AWSError>;
  /**
   * Returns summaries of the organization's users.
   */
  listUsers(callback?: (err: AWSError, data: WorkMail.Types.ListUsersResponse) => void): Request<WorkMail.Types.ListUsersResponse, AWSError>;
  /**
   * Sets permissions for a user or group. This replaces any pre-existing permissions set for the entity.
   */
  putMailboxPermissions(params: WorkMail.Types.PutMailboxPermissionsRequest, callback?: (err: AWSError, data: WorkMail.Types.PutMailboxPermissionsResponse) => void): Request<WorkMail.Types.PutMailboxPermissionsResponse, AWSError>;
  /**
   * Sets permissions for a user or group. This replaces any pre-existing permissions set for the entity.
   */
  putMailboxPermissions(callback?: (err: AWSError, data: WorkMail.Types.PutMailboxPermissionsResponse) => void): Request<WorkMail.Types.PutMailboxPermissionsResponse, AWSError>;
  /**
   * Registers an existing and disabled user, group, or resource/entity for Amazon WorkMail use by associating a mailbox and calendaring capabilities. It performs no change if the entity is enabled and fails if the entity is deleted. This operation results in the accumulation of costs. For more information, see Pricing. The equivalent console functionality for this operation is Enable. Users can either be created by calling the CreateUser API or they can be synchronized from your directory. For more information, see DeregisterFromWorkMail.
   */
  registerToWorkMail(params: WorkMail.Types.RegisterToWorkMailRequest, callback?: (err: AWSError, data: WorkMail.Types.RegisterToWorkMailResponse) => void): Request<WorkMail.Types.RegisterToWorkMailResponse, AWSError>;
  /**
   * Registers an existing and disabled user, group, or resource/entity for Amazon WorkMail use by associating a mailbox and calendaring capabilities. It performs no change if the entity is enabled and fails if the entity is deleted. This operation results in the accumulation of costs. For more information, see Pricing. The equivalent console functionality for this operation is Enable. Users can either be created by calling the CreateUser API or they can be synchronized from your directory. For more information, see DeregisterFromWorkMail.
   */
  registerToWorkMail(callback?: (err: AWSError, data: WorkMail.Types.RegisterToWorkMailResponse) => void): Request<WorkMail.Types.RegisterToWorkMailResponse, AWSError>;
  /**
   * Allows the administrator to reset the password for a user.
   */
  resetPassword(params: WorkMail.Types.ResetPasswordRequest, callback?: (err: AWSError, data: WorkMail.Types.ResetPasswordResponse) => void): Request<WorkMail.Types.ResetPasswordResponse, AWSError>;
  /**
   * Allows the administrator to reset the password for a user.
   */
  resetPassword(callback?: (err: AWSError, data: WorkMail.Types.ResetPasswordResponse) => void): Request<WorkMail.Types.ResetPasswordResponse, AWSError>;
  /**
   * Updates the primary email for an entity. The current email is moved into the list of aliases (or swapped between an existing alias and the current primary email) and the email provided in the input is promoted as the primary.
   */
  updatePrimaryEmailAddress(params: WorkMail.Types.UpdatePrimaryEmailAddressRequest, callback?: (err: AWSError, data: WorkMail.Types.UpdatePrimaryEmailAddressResponse) => void): Request<WorkMail.Types.UpdatePrimaryEmailAddressResponse, AWSError>;
  /**
   * Updates the primary email for an entity. The current email is moved into the list of aliases (or swapped between an existing alias and the current primary email) and the email provided in the input is promoted as the primary.
   */
  updatePrimaryEmailAddress(callback?: (err: AWSError, data: WorkMail.Types.UpdatePrimaryEmailAddressResponse) => void): Request<WorkMail.Types.UpdatePrimaryEmailAddressResponse, AWSError>;
  /**
   * Updates data for the resource. It must be preceded by a describe call in order to have the latest information. The dataset in the request should be the one expected when performing another describe call.
   */
  updateResource(params: WorkMail.Types.UpdateResourceRequest, callback?: (err: AWSError, data: WorkMail.Types.UpdateResourceResponse) => void): Request<WorkMail.Types.UpdateResourceResponse, AWSError>;
  /**
   * Updates data for the resource. It must be preceded by a describe call in order to have the latest information. The dataset in the request should be the one expected when performing another describe call.
   */
  updateResource(callback?: (err: AWSError, data: WorkMail.Types.UpdateResourceResponse) => void): Request<WorkMail.Types.UpdateResourceResponse, AWSError>;
}
declare namespace WorkMail {
  export type Aliases = EmailAddress[];
  export interface AssociateDelegateToResourceRequest {
    /**
     * The organization under which the resource exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The resource for which members are associated.
     */
    ResourceId: ResourceId;
    /**
     * The member (user or group) to associate to the resource.
     */
    EntityId: WorkMailIdentifier;
  }
  export interface AssociateDelegateToResourceResponse {
  }
  export interface AssociateMemberToGroupRequest {
    /**
     * The organization under which the group exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The group for which the member is associated.
     */
    GroupId: WorkMailIdentifier;
    /**
     * The member to associate to the group.
     */
    MemberId: WorkMailIdentifier;
  }
  export interface AssociateMemberToGroupResponse {
  }
  export interface BookingOptions {
    /**
     * The resource's ability to automatically reply to requests. If disabled, delegates must be associated to the resource.
     */
    AutoAcceptRequests?: Boolean;
    /**
     * The resource's ability to automatically decline any recurring requests.
     */
    AutoDeclineRecurringRequests?: Boolean;
    /**
     * The resource's ability to automatically decline any conflicting requests.
     */
    AutoDeclineConflictingRequests?: Boolean;
  }
  export type Boolean = boolean;
  export interface CreateAliasRequest {
    /**
     * The organization under which the member exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The alias is added to this Amazon WorkMail entity.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The alias to add to the user.
     */
    Alias: EmailAddress;
  }
  export interface CreateAliasResponse {
  }
  export interface CreateGroupRequest {
    /**
     * The organization under which the group is to be created.
     */
    OrganizationId: OrganizationId;
    /**
     * The name of the group.
     */
    Name: GroupName;
  }
  export interface CreateGroupResponse {
    /**
     * The ID of the group.
     */
    GroupId?: WorkMailIdentifier;
  }
  export interface CreateResourceRequest {
    /**
     * The identifier associated with the organization for which the resource is created.
     */
    OrganizationId: OrganizationId;
    /**
     * The name of the created resource.
     */
    Name: ResourceName;
    /**
     * The type of the created resource.
     */
    Type: ResourceType;
  }
  export interface CreateResourceResponse {
    /**
     * The identifier of the created resource.
     */
    ResourceId?: ResourceId;
  }
  export interface CreateUserRequest {
    /**
     * The identifier of the organization for which the user is created.
     */
    OrganizationId: OrganizationId;
    /**
     * The name for the user to be created.
     */
    Name: UserName;
    /**
     * The display name for the user to be created.
     */
    DisplayName: String;
    /**
     * The password for the user to be created.
     */
    Password: Password;
  }
  export interface CreateUserResponse {
    /**
     * The information regarding the newly created user.
     */
    UserId?: WorkMailIdentifier;
  }
  export interface Delegate {
    /**
     * The identifier for the user or group is associated as the resource's delegate.
     */
    Id: String;
    /**
     * The type of the delegate: user or group.
     */
    Type: MemberType;
  }
  export interface DeleteAliasRequest {
    /**
     * The identifier for the organization under which the user exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the Amazon WorkMail entity to have the aliases removed.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The aliases to be removed from the user's set of aliases. Duplicate entries in the list are collapsed into single entries (the list is transformed into a set).
     */
    Alias: EmailAddress;
  }
  export interface DeleteAliasResponse {
  }
  export interface DeleteGroupRequest {
    /**
     * The organization that contains the group.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the group to be deleted.
     */
    GroupId: WorkMailIdentifier;
  }
  export interface DeleteGroupResponse {
  }
  export interface DeleteMailboxPermissionsRequest {
    /**
     * The identifier of the organization under which the entity (user or group) exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the entity (user or group) for which to delete mailbox permissions.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The identifier of the entity (user or group) for which to delete granted permissions.
     */
    GranteeId: WorkMailIdentifier;
  }
  export interface DeleteMailboxPermissionsResponse {
  }
  export interface DeleteResourceRequest {
    /**
     * The identifier associated with the organization for which the resource is deleted.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the resource to be deleted.
     */
    ResourceId: ResourceId;
  }
  export interface DeleteResourceResponse {
  }
  export interface DeleteUserRequest {
    /**
     * The organization that contains the user.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the user to be deleted.
     */
    UserId: WorkMailIdentifier;
  }
  export interface DeleteUserResponse {
  }
  export interface DeregisterFromWorkMailRequest {
    /**
     * The identifier for the organization under which the Amazon WorkMail entity exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the entity to be updated.
     */
    EntityId: WorkMailIdentifier;
  }
  export interface DeregisterFromWorkMailResponse {
  }
  export interface DescribeGroupRequest {
    /**
     * The identifier for the organization under which the group exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the group to be described.
     */
    GroupId: WorkMailIdentifier;
  }
  export interface DescribeGroupResponse {
    /**
     * The identifier of the described group.
     */
    GroupId?: WorkMailIdentifier;
    /**
     * The name of the described group.
     */
    Name?: GroupName;
    /**
     * The email of the described group.
     */
    Email?: EmailAddress;
    /**
     * The state of the user: enabled (registered to Amazon WorkMail) or disabled (deregistered or never registered to Amazon WorkMail).
     */
    State?: EntityState;
    /**
     * The date and time when a user was registered to Amazon WorkMail, in UNIX epoch time format.
     */
    EnabledDate?: Timestamp;
    /**
     * The date and time when a user was deregistered from Amazon WorkMail, in UNIX epoch time format.
     */
    DisabledDate?: Timestamp;
  }
  export interface DescribeOrganizationRequest {
    /**
     * The identifier for the organization to be described.
     */
    OrganizationId: OrganizationId;
  }
  export interface DescribeOrganizationResponse {
    /**
     * The identifier of an organization.
     */
    OrganizationId?: OrganizationId;
    /**
     * The alias for an organization.
     */
    Alias?: OrganizationName;
    /**
     * The state of an organization.
     */
    State?: String;
    /**
     * The identifier for the directory associated with an Amazon WorkMail organization.
     */
    DirectoryId?: String;
    /**
     * The type of directory associated with the Amazon WorkMail organization.
     */
    DirectoryType?: String;
    /**
     * The default mail domain associated with the organization.
     */
    DefaultMailDomain?: String;
    /**
     * The date at which the organization became usable in the Amazon WorkMail context, in UNIX epoch time format.
     */
    CompletedDate?: Timestamp;
    /**
     * The (optional) error message indicating if unexpected behavior was encountered with regards to the organization.
     */
    ErrorMessage?: String;
  }
  export interface DescribeResourceRequest {
    /**
     * The identifier associated with the organization for which the resource is described.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the resource to be described.
     */
    ResourceId: ResourceId;
  }
  export interface DescribeResourceResponse {
    /**
     * The identifier of the described resource.
     */
    ResourceId?: ResourceId;
    /**
     * The email of the described resource.
     */
    Email?: EmailAddress;
    /**
     * The name of the described resource.
     */
    Name?: ResourceName;
    /**
     * The type of the described resource.
     */
    Type?: ResourceType;
    /**
     * The booking options for the described resource.
     */
    BookingOptions?: BookingOptions;
    /**
     * The state of the resource: enabled (registered to Amazon WorkMail) or disabled (deregistered or never registered to Amazon WorkMail).
     */
    State?: EntityState;
    /**
     * The date and time when a resource was registered to Amazon WorkMail, in UNIX epoch time format.
     */
    EnabledDate?: Timestamp;
    /**
     * The date and time when a resource was registered from Amazon WorkMail, in UNIX epoch time format.
     */
    DisabledDate?: Timestamp;
  }
  export interface DescribeUserRequest {
    /**
     * The identifier for the organization under which the user exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the user to be described.
     */
    UserId: WorkMailIdentifier;
  }
  export interface DescribeUserResponse {
    /**
     * The identifier for the described user.
     */
    UserId?: WorkMailIdentifier;
    /**
     * The name for the user.
     */
    Name?: UserName;
    /**
     * The email of the user.
     */
    Email?: EmailAddress;
    /**
     * The display name of the user.
     */
    DisplayName?: String;
    /**
     * The state of a user: enabled (registered to Amazon WorkMail) or disabled (deregistered or never registered to Amazon WorkMail).
     */
    State?: EntityState;
    /**
     * In certain cases other entities are modeled as users. If interoperability is enabled, resources are imported into Amazon WorkMail as users. Because different Amazon WorkMail organizations rely on different directory types, administrators can distinguish between a user that is not registered to Amazon WorkMail (is disabled and has a user role) and the administrative users of the directory. The values are USER, RESOURCE, and SYSTEM_USER.
     */
    UserRole?: UserRole;
    /**
     * The date and time at which the user was enabled for Amazon WorkMail usage, in UNIX epoch time format.
     */
    EnabledDate?: Timestamp;
    /**
     * The date and time at which the user was disabled for Amazon WorkMail usage, in UNIX epoch time format.
     */
    DisabledDate?: Timestamp;
  }
  export interface DisassociateDelegateFromResourceRequest {
    /**
     * The identifier for the organization under which the resource exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the resource from which delegates' set members are removed. 
     */
    ResourceId: ResourceId;
    /**
     * The identifier for the member (user, group) to be removed from the resource's delegates.
     */
    EntityId: WorkMailIdentifier;
  }
  export interface DisassociateDelegateFromResourceResponse {
  }
  export interface DisassociateMemberFromGroupRequest {
    /**
     * The identifier for the organization under which the group exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the group from which members are removed.
     */
    GroupId: WorkMailIdentifier;
    /**
     * The identifier for the member to be removed to the group.
     */
    MemberId: WorkMailIdentifier;
  }
  export interface DisassociateMemberFromGroupResponse {
  }
  export type EmailAddress = string;
  export type EntityState = "ENABLED"|"DISABLED"|"DELETED"|string;
  export interface Group {
    /**
     * The identifier of the group.
     */
    Id?: WorkMailIdentifier;
    /**
     * The email of the group.
     */
    Email?: EmailAddress;
    /**
     * The name of the group.
     */
    Name?: GroupName;
    /**
     * The state of the group, which can be ENABLED, DISABLED, or DELETED.
     */
    State?: EntityState;
    /**
     * The date indicating when the group was enabled for Amazon WorkMail use.
     */
    EnabledDate?: Timestamp;
    /**
     * The date indicating when the group was disabled from Amazon WorkMail use.
     */
    DisabledDate?: Timestamp;
  }
  export type GroupName = string;
  export type Groups = Group[];
  export interface ListAliasesRequest {
    /**
     * The identifier for the organization under which the entity exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the entity for which to list the aliases.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListAliasesResponse {
    /**
     * The entity's paginated aliases.
     */
    Aliases?: Aliases;
    /**
     * The token to use to retrieve the next page of results. The value is "null" when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface ListGroupMembersRequest {
    /**
     * The identifier for the organization under which the group exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the group to which the members are associated.
     */
    GroupId: WorkMailIdentifier;
    /**
     *  The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListGroupMembersResponse {
    /**
     * The members associated to the group.
     */
    Members?: Members;
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
  }
  export interface ListGroupsRequest {
    /**
     * The identifier for the organization under which the groups exist.
     */
    OrganizationId: OrganizationId;
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListGroupsResponse {
    /**
     * The overview of groups for an organization.
     */
    Groups?: Groups;
    /**
     * The token to use to retrieve the next page of results. The value is "null" when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface ListMailboxPermissionsRequest {
    /**
     * The identifier of the organization under which the entity (user or group) exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the entity (user or group) for which to list mailbox permissions.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListMailboxPermissionsResponse {
    /**
     * One page of the entity's mailbox permissions.
     */
    Permissions?: Permissions;
    /**
     * The token to use to retrieve the next page of results. The value is "null" when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface ListOrganizationsRequest {
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListOrganizationsResponse {
    /**
     * The overview of owned organizations presented as a list of organization summaries.
     */
    OrganizationSummaries?: OrganizationSummaries;
    /**
     * The token to use to retrieve the next page of results. The value is "null" when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface ListResourceDelegatesRequest {
    /**
     * The identifier for the organization that contains the resource for which delegates are listed.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the resource whose delegates are listed.
     */
    ResourceId: WorkMailIdentifier;
    /**
     * The token used to paginate through the delegates associated with a resource.
     */
    NextToken?: NextToken;
    /**
     * The number of maximum results in a page.
     */
    MaxResults?: MaxResults;
  }
  export interface ListResourceDelegatesResponse {
    /**
     * One page of the resource's delegates.
     */
    Delegates?: ResourceDelegates;
    /**
     * The token used to paginate through the delegates associated with a resource. While results are still available, it has an associated value. When the last page is reached, the token is empty. 
     */
    NextToken?: NextToken;
  }
  export interface ListResourcesRequest {
    /**
     * The identifier for the organization under which the resources exist.
     */
    OrganizationId: OrganizationId;
    /**
     * The token to use to retrieve the next page of results. The first call does not contain any tokens.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListResourcesResponse {
    /**
     * One page of the organization's resource representation.
     */
    Resources?: Resources;
    /**
     *  The token used to paginate through all the organization's resources. While results are still available, it has an associated value. When the last page is reached, the token is empty.
     */
    NextToken?: NextToken;
  }
  export interface ListUsersRequest {
    /**
     * The identifier for the organization under which the users exist.
     */
    OrganizationId: OrganizationId;
    /**
     * TBD
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface ListUsersResponse {
    /**
     * The overview of users for an organization.
     */
    Users?: Users;
    /**
     *  The token to use to retrieve the next page of results. This value is `null` when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export type MaxResults = number;
  export interface Member {
    /**
     * The identifier of the member.
     */
    Id?: String;
    /**
     * The name of the member.
     */
    Name?: String;
    /**
     * A member can be a user or group.
     */
    Type?: MemberType;
    /**
     * The state of the member, which can be ENABLED, DISABLED, or DELETED.
     */
    State?: EntityState;
    /**
     * The date indicating when the member was enabled for Amazon WorkMail use.
     */
    EnabledDate?: Timestamp;
    /**
     * The date indicating when the member was disabled from Amazon WorkMail use.
     */
    DisabledDate?: Timestamp;
  }
  export type MemberType = "GROUP"|"USER"|string;
  export type Members = Member[];
  export type NextToken = string;
  export type OrganizationId = string;
  export type OrganizationName = string;
  export type OrganizationSummaries = OrganizationSummary[];
  export interface OrganizationSummary {
    /**
     * The identifier associated with the organization.
     */
    OrganizationId?: OrganizationId;
    /**
     * The alias associated with the organization.
     */
    Alias?: OrganizationName;
    /**
     * The error message associated with the organization. It is only present if unexpected behavior has occurred with regards to the organization. It provides insight or solutions regarding unexpected behavior.
     */
    ErrorMessage?: String;
    /**
     * The state associated with the organization.
     */
    State?: String;
  }
  export type Password = string;
  export interface Permission {
    /**
     * The identifier of the entity (user or group) to which the permissions are granted.
     */
    GranteeId: WorkMailIdentifier;
    /**
     * The type of entity (user, group) of the entity referred to in GranteeId.
     */
    GranteeType: MemberType;
    /**
     * The permissions granted to the grantee. SEND_AS allows the grantee to send email as the owner of the mailbox (the grantee is not mentioned on these emails). SEND_ON_BEHALF allows the grantee to send email on behalf of the owner of the mailbox (the grantee is not mentioned as the physical sender of these emails). FULL_ACCESS allows the grantee full access to the mailbox, irrespective of other folder-level permissions set on the mailbox.
     */
    PermissionValues: PermissionValues;
  }
  export type PermissionType = "FULL_ACCESS"|"SEND_AS"|"SEND_ON_BEHALF"|string;
  export type PermissionValues = PermissionType[];
  export type Permissions = Permission[];
  export interface PutMailboxPermissionsRequest {
    /**
     * The identifier of the organization under which the entity (user or group) exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the entity (user or group) for which to update mailbox permissions.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The identifier of the entity (user or group) to which to grant the permissions.
     */
    GranteeId: WorkMailIdentifier;
    /**
     * The permissions granted to the grantee. SEND_AS allows the grantee to send email as the owner of the mailbox (the grantee is not mentioned on these emails). SEND_ON_BEHALF allows the grantee to send email on behalf of the owner of the mailbox (the grantee is not mentioned as the physical sender of these emails). FULL_ACCESS allows the grantee full access to the mailbox, irrespective of other folder-level permissions set on the mailbox.
     */
    PermissionValues: PermissionValues;
  }
  export interface PutMailboxPermissionsResponse {
  }
  export interface RegisterToWorkMailRequest {
    /**
     * The identifier for the organization under which the Amazon WorkMail entity exists.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier for the entity to be updated.
     */
    EntityId: WorkMailIdentifier;
    /**
     * The email for the entity to be updated.
     */
    Email: EmailAddress;
  }
  export interface RegisterToWorkMailResponse {
  }
  export interface ResetPasswordRequest {
    /**
     * The identifier of the organization that contains the user for which the password is reset.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the user for whom the password is reset.
     */
    UserId: WorkMailIdentifier;
    /**
     * The new password for the user.
     */
    Password: Password;
  }
  export interface ResetPasswordResponse {
  }
  export interface Resource {
    /**
     * The identifier of the resource.
     */
    Id?: WorkMailIdentifier;
    /**
     * The email of the resource.
     */
    Email?: EmailAddress;
    /**
     * The name of the resource.
     */
    Name?: ResourceName;
    /**
     * The type of the resource: equipment or room.
     */
    Type?: ResourceType;
    /**
     * The state of the resource, which can be ENABLED, DISABLED, or DELETED.
     */
    State?: EntityState;
    /**
     * The date indicating when the resource was enabled for Amazon WorkMail use.
     */
    EnabledDate?: Timestamp;
    /**
     * The date indicating when the resource was disabled from Amazon WorkMail use.
     */
    DisabledDate?: Timestamp;
  }
  export type ResourceDelegates = Delegate[];
  export type ResourceId = string;
  export type ResourceName = string;
  export type ResourceType = "ROOM"|"EQUIPMENT"|string;
  export type Resources = Resource[];
  export type String = string;
  export type Timestamp = Date;
  export interface UpdatePrimaryEmailAddressRequest {
    /**
     * The organization that contains the entity to update.
     */
    OrganizationId: OrganizationId;
    /**
     * The entity to update (user, group, or resource).
     */
    EntityId: WorkMailIdentifier;
    /**
     * The value of the email to be updated as primary.
     */
    Email: EmailAddress;
  }
  export interface UpdatePrimaryEmailAddressResponse {
  }
  export interface UpdateResourceRequest {
    /**
     * The identifier associated with the organization for which the resource is updated.
     */
    OrganizationId: OrganizationId;
    /**
     * The identifier of the resource to be updated.
     */
    ResourceId: ResourceId;
    /**
     * The name of the resource to be updated.
     */
    Name?: ResourceName;
    /**
     * The resource's booking options to be updated.
     */
    BookingOptions?: BookingOptions;
  }
  export interface UpdateResourceResponse {
  }
  export interface User {
    /**
     * The identifier of the user.
     */
    Id?: WorkMailIdentifier;
    /**
     * The email of the user.
     */
    Email?: EmailAddress;
    /**
     * The name of the user.
     */
    Name?: UserName;
    /**
     * The display name of the user.
     */
    DisplayName?: String;
    /**
     * The state of the user, which can be ENABLED, DISABLED, or DELETED.
     */
    State?: EntityState;
    /**
     * The role of the user.
     */
    UserRole?: UserRole;
    /**
     * The date indicating when the user was enabled for Amazon WorkMail use.
     */
    EnabledDate?: Timestamp;
    /**
     * The date indicating when the user was disabled from Amazon WorkMail use.
     */
    DisabledDate?: Timestamp;
  }
  export type UserName = string;
  export type UserRole = "USER"|"RESOURCE"|"SYSTEM_USER"|string;
  export type Users = User[];
  export type WorkMailIdentifier = string;
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2017-10-01"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the WorkMail client.
   */
  export import Types = WorkMail;
}
export = WorkMail;

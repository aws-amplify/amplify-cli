import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {WaiterConfiguration} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class Neptune extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: Neptune.Types.ClientConfiguration)
  config: Config & Neptune.Types.ClientConfiguration;
  /**
   * Associates an Identity and Access Management (IAM) role from an Neptune DB cluster. 
   */
  addRoleToDBCluster(params: Neptune.Types.AddRoleToDBClusterMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Associates an Identity and Access Management (IAM) role from an Neptune DB cluster. 
   */
  addRoleToDBCluster(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds a source identifier to an existing event notification subscription.
   */
  addSourceIdentifierToSubscription(params: Neptune.Types.AddSourceIdentifierToSubscriptionMessage, callback?: (err: AWSError, data: Neptune.Types.AddSourceIdentifierToSubscriptionResult) => void): Request<Neptune.Types.AddSourceIdentifierToSubscriptionResult, AWSError>;
  /**
   * Adds a source identifier to an existing event notification subscription.
   */
  addSourceIdentifierToSubscription(callback?: (err: AWSError, data: Neptune.Types.AddSourceIdentifierToSubscriptionResult) => void): Request<Neptune.Types.AddSourceIdentifierToSubscriptionResult, AWSError>;
  /**
   * Adds metadata tags to an Amazon Neptune resource. These tags can also be used with cost allocation reporting to track cost associated with Amazon Neptune resources, or used in a Condition statement in an IAM policy for Amazon Neptune.
   */
  addTagsToResource(params: Neptune.Types.AddTagsToResourceMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds metadata tags to an Amazon Neptune resource. These tags can also be used with cost allocation reporting to track cost associated with Amazon Neptune resources, or used in a Condition statement in an IAM policy for Amazon Neptune.
   */
  addTagsToResource(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Applies a pending maintenance action to a resource (for example, to a DB instance).
   */
  applyPendingMaintenanceAction(params: Neptune.Types.ApplyPendingMaintenanceActionMessage, callback?: (err: AWSError, data: Neptune.Types.ApplyPendingMaintenanceActionResult) => void): Request<Neptune.Types.ApplyPendingMaintenanceActionResult, AWSError>;
  /**
   * Applies a pending maintenance action to a resource (for example, to a DB instance).
   */
  applyPendingMaintenanceAction(callback?: (err: AWSError, data: Neptune.Types.ApplyPendingMaintenanceActionResult) => void): Request<Neptune.Types.ApplyPendingMaintenanceActionResult, AWSError>;
  /**
   * Copies the specified DB cluster parameter group.
   */
  copyDBClusterParameterGroup(params: Neptune.Types.CopyDBClusterParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.CopyDBClusterParameterGroupResult) => void): Request<Neptune.Types.CopyDBClusterParameterGroupResult, AWSError>;
  /**
   * Copies the specified DB cluster parameter group.
   */
  copyDBClusterParameterGroup(callback?: (err: AWSError, data: Neptune.Types.CopyDBClusterParameterGroupResult) => void): Request<Neptune.Types.CopyDBClusterParameterGroupResult, AWSError>;
  /**
   * Copies a snapshot of a DB cluster. To copy a DB cluster snapshot from a shared manual DB cluster snapshot, SourceDBClusterSnapshotIdentifier must be the Amazon Resource Name (ARN) of the shared DB cluster snapshot. You can copy an encrypted DB cluster snapshot from another AWS Region. In that case, the AWS Region where you call the CopyDBClusterSnapshot action is the destination AWS Region for the encrypted DB cluster snapshot to be copied to. To copy an encrypted DB cluster snapshot from another AWS Region, you must provide the following values:    KmsKeyId - The AWS Key Management System (AWS KMS) key identifier for the key to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region.    PreSignedUrl - A URL that contains a Signature Version 4 signed request for the CopyDBClusterSnapshot action to be called in the source AWS Region where the DB cluster snapshot is copied from. The pre-signed URL must be a valid request for the CopyDBClusterSnapshot API action that can be executed in the source AWS Region that contains the encrypted DB cluster snapshot to be copied. The pre-signed URL request must contain the following parameter values:    KmsKeyId - The KMS key identifier for the key to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region. This is the same identifier for both the CopyDBClusterSnapshot action that is called in the destination AWS Region, and the action contained in the pre-signed URL.    DestinationRegion - The name of the AWS Region that the DB cluster snapshot will be created in.    SourceDBClusterSnapshotIdentifier - The DB cluster snapshot identifier for the encrypted DB cluster snapshot to be copied. This identifier must be in the Amazon Resource Name (ARN) format for the source AWS Region. For example, if you are copying an encrypted DB cluster snapshot from the us-west-2 AWS Region, then your SourceDBClusterSnapshotIdentifier looks like the following example: arn:aws:rds:us-west-2:123456789012:cluster-snapshot:neptune-cluster1-snapshot-20161115.   To learn how to generate a Signature Version 4 signed request, see  Authenticating Requests: Using Query Parameters (AWS Signature Version 4) and  Signature Version 4 Signing Process.    TargetDBClusterSnapshotIdentifier - The identifier for the new copy of the DB cluster snapshot in the destination AWS Region.    SourceDBClusterSnapshotIdentifier - The DB cluster snapshot identifier for the encrypted DB cluster snapshot to be copied. This identifier must be in the ARN format for the source AWS Region and is the same value as the SourceDBClusterSnapshotIdentifier in the pre-signed URL.    To cancel the copy operation once it is in progress, delete the target DB cluster snapshot identified by TargetDBClusterSnapshotIdentifier while that DB cluster snapshot is in "copying" status.
   */
  copyDBClusterSnapshot(params: Neptune.Types.CopyDBClusterSnapshotMessage, callback?: (err: AWSError, data: Neptune.Types.CopyDBClusterSnapshotResult) => void): Request<Neptune.Types.CopyDBClusterSnapshotResult, AWSError>;
  /**
   * Copies a snapshot of a DB cluster. To copy a DB cluster snapshot from a shared manual DB cluster snapshot, SourceDBClusterSnapshotIdentifier must be the Amazon Resource Name (ARN) of the shared DB cluster snapshot. You can copy an encrypted DB cluster snapshot from another AWS Region. In that case, the AWS Region where you call the CopyDBClusterSnapshot action is the destination AWS Region for the encrypted DB cluster snapshot to be copied to. To copy an encrypted DB cluster snapshot from another AWS Region, you must provide the following values:    KmsKeyId - The AWS Key Management System (AWS KMS) key identifier for the key to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region.    PreSignedUrl - A URL that contains a Signature Version 4 signed request for the CopyDBClusterSnapshot action to be called in the source AWS Region where the DB cluster snapshot is copied from. The pre-signed URL must be a valid request for the CopyDBClusterSnapshot API action that can be executed in the source AWS Region that contains the encrypted DB cluster snapshot to be copied. The pre-signed URL request must contain the following parameter values:    KmsKeyId - The KMS key identifier for the key to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region. This is the same identifier for both the CopyDBClusterSnapshot action that is called in the destination AWS Region, and the action contained in the pre-signed URL.    DestinationRegion - The name of the AWS Region that the DB cluster snapshot will be created in.    SourceDBClusterSnapshotIdentifier - The DB cluster snapshot identifier for the encrypted DB cluster snapshot to be copied. This identifier must be in the Amazon Resource Name (ARN) format for the source AWS Region. For example, if you are copying an encrypted DB cluster snapshot from the us-west-2 AWS Region, then your SourceDBClusterSnapshotIdentifier looks like the following example: arn:aws:rds:us-west-2:123456789012:cluster-snapshot:neptune-cluster1-snapshot-20161115.   To learn how to generate a Signature Version 4 signed request, see  Authenticating Requests: Using Query Parameters (AWS Signature Version 4) and  Signature Version 4 Signing Process.    TargetDBClusterSnapshotIdentifier - The identifier for the new copy of the DB cluster snapshot in the destination AWS Region.    SourceDBClusterSnapshotIdentifier - The DB cluster snapshot identifier for the encrypted DB cluster snapshot to be copied. This identifier must be in the ARN format for the source AWS Region and is the same value as the SourceDBClusterSnapshotIdentifier in the pre-signed URL.    To cancel the copy operation once it is in progress, delete the target DB cluster snapshot identified by TargetDBClusterSnapshotIdentifier while that DB cluster snapshot is in "copying" status.
   */
  copyDBClusterSnapshot(callback?: (err: AWSError, data: Neptune.Types.CopyDBClusterSnapshotResult) => void): Request<Neptune.Types.CopyDBClusterSnapshotResult, AWSError>;
  /**
   * Copies the specified DB parameter group.
   */
  copyDBParameterGroup(params: Neptune.Types.CopyDBParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.CopyDBParameterGroupResult) => void): Request<Neptune.Types.CopyDBParameterGroupResult, AWSError>;
  /**
   * Copies the specified DB parameter group.
   */
  copyDBParameterGroup(callback?: (err: AWSError, data: Neptune.Types.CopyDBParameterGroupResult) => void): Request<Neptune.Types.CopyDBParameterGroupResult, AWSError>;
  /**
   * Creates a new Amazon Neptune DB cluster. You can use the ReplicationSourceIdentifier parameter to create the DB cluster as a Read Replica of another DB cluster or Amazon Neptune DB instance. For cross-region replication where the DB cluster identified by ReplicationSourceIdentifier is encrypted, you must also specify the PreSignedUrl parameter.
   */
  createDBCluster(params: Neptune.Types.CreateDBClusterMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterResult) => void): Request<Neptune.Types.CreateDBClusterResult, AWSError>;
  /**
   * Creates a new Amazon Neptune DB cluster. You can use the ReplicationSourceIdentifier parameter to create the DB cluster as a Read Replica of another DB cluster or Amazon Neptune DB instance. For cross-region replication where the DB cluster identified by ReplicationSourceIdentifier is encrypted, you must also specify the PreSignedUrl parameter.
   */
  createDBCluster(callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterResult) => void): Request<Neptune.Types.CreateDBClusterResult, AWSError>;
  /**
   * Creates a new DB cluster parameter group. Parameters in a DB cluster parameter group apply to all of the instances in a DB cluster.  A DB cluster parameter group is initially created with the default parameters for the database engine used by instances in the DB cluster. To provide custom values for any of the parameters, you must modify the group after creating it using ModifyDBClusterParameterGroup. Once you've created a DB cluster parameter group, you need to associate it with your DB cluster using ModifyDBCluster. When you associate a new DB cluster parameter group with a running DB cluster, you need to reboot the DB instances in the DB cluster without failover for the new DB cluster parameter group and associated settings to take effect.   After you create a DB cluster parameter group, you should wait at least 5 minutes before creating your first DB cluster that uses that DB cluster parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the DB cluster parameter group is used as the default for a new DB cluster. This is especially important for parameters that are critical when creating the default database for a DB cluster, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBClusterParameters command to verify that your DB cluster parameter group has been created or modified. 
   */
  createDBClusterParameterGroup(params: Neptune.Types.CreateDBClusterParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterParameterGroupResult) => void): Request<Neptune.Types.CreateDBClusterParameterGroupResult, AWSError>;
  /**
   * Creates a new DB cluster parameter group. Parameters in a DB cluster parameter group apply to all of the instances in a DB cluster.  A DB cluster parameter group is initially created with the default parameters for the database engine used by instances in the DB cluster. To provide custom values for any of the parameters, you must modify the group after creating it using ModifyDBClusterParameterGroup. Once you've created a DB cluster parameter group, you need to associate it with your DB cluster using ModifyDBCluster. When you associate a new DB cluster parameter group with a running DB cluster, you need to reboot the DB instances in the DB cluster without failover for the new DB cluster parameter group and associated settings to take effect.   After you create a DB cluster parameter group, you should wait at least 5 minutes before creating your first DB cluster that uses that DB cluster parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the DB cluster parameter group is used as the default for a new DB cluster. This is especially important for parameters that are critical when creating the default database for a DB cluster, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBClusterParameters command to verify that your DB cluster parameter group has been created or modified. 
   */
  createDBClusterParameterGroup(callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterParameterGroupResult) => void): Request<Neptune.Types.CreateDBClusterParameterGroupResult, AWSError>;
  /**
   * Creates a snapshot of a DB cluster. 
   */
  createDBClusterSnapshot(params: Neptune.Types.CreateDBClusterSnapshotMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterSnapshotResult) => void): Request<Neptune.Types.CreateDBClusterSnapshotResult, AWSError>;
  /**
   * Creates a snapshot of a DB cluster. 
   */
  createDBClusterSnapshot(callback?: (err: AWSError, data: Neptune.Types.CreateDBClusterSnapshotResult) => void): Request<Neptune.Types.CreateDBClusterSnapshotResult, AWSError>;
  /**
   * Creates a new DB instance.
   */
  createDBInstance(params: Neptune.Types.CreateDBInstanceMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBInstanceResult) => void): Request<Neptune.Types.CreateDBInstanceResult, AWSError>;
  /**
   * Creates a new DB instance.
   */
  createDBInstance(callback?: (err: AWSError, data: Neptune.Types.CreateDBInstanceResult) => void): Request<Neptune.Types.CreateDBInstanceResult, AWSError>;
  /**
   * Creates a new DB parameter group.  A DB parameter group is initially created with the default parameters for the database engine used by the DB instance. To provide custom values for any of the parameters, you must modify the group after creating it using ModifyDBParameterGroup. Once you've created a DB parameter group, you need to associate it with your DB instance using ModifyDBInstance. When you associate a new DB parameter group with a running DB instance, you need to reboot the DB instance without failover for the new DB parameter group and associated settings to take effect.   After you create a DB parameter group, you should wait at least 5 minutes before creating your first DB instance that uses that DB parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the parameter group is used as the default for a new DB instance. This is especially important for parameters that are critical when creating the default database for a DB instance, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBParameters command to verify that your DB parameter group has been created or modified. 
   */
  createDBParameterGroup(params: Neptune.Types.CreateDBParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBParameterGroupResult) => void): Request<Neptune.Types.CreateDBParameterGroupResult, AWSError>;
  /**
   * Creates a new DB parameter group.  A DB parameter group is initially created with the default parameters for the database engine used by the DB instance. To provide custom values for any of the parameters, you must modify the group after creating it using ModifyDBParameterGroup. Once you've created a DB parameter group, you need to associate it with your DB instance using ModifyDBInstance. When you associate a new DB parameter group with a running DB instance, you need to reboot the DB instance without failover for the new DB parameter group and associated settings to take effect.   After you create a DB parameter group, you should wait at least 5 minutes before creating your first DB instance that uses that DB parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the parameter group is used as the default for a new DB instance. This is especially important for parameters that are critical when creating the default database for a DB instance, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBParameters command to verify that your DB parameter group has been created or modified. 
   */
  createDBParameterGroup(callback?: (err: AWSError, data: Neptune.Types.CreateDBParameterGroupResult) => void): Request<Neptune.Types.CreateDBParameterGroupResult, AWSError>;
  /**
   * Creates a new DB subnet group. DB subnet groups must contain at least one subnet in at least two AZs in the AWS Region.
   */
  createDBSubnetGroup(params: Neptune.Types.CreateDBSubnetGroupMessage, callback?: (err: AWSError, data: Neptune.Types.CreateDBSubnetGroupResult) => void): Request<Neptune.Types.CreateDBSubnetGroupResult, AWSError>;
  /**
   * Creates a new DB subnet group. DB subnet groups must contain at least one subnet in at least two AZs in the AWS Region.
   */
  createDBSubnetGroup(callback?: (err: AWSError, data: Neptune.Types.CreateDBSubnetGroupResult) => void): Request<Neptune.Types.CreateDBSubnetGroupResult, AWSError>;
  /**
   * Creates an event notification subscription. This action requires a topic ARN (Amazon Resource Name) created by either the Neptune console, the SNS console, or the SNS API. To obtain an ARN with SNS, you must create a topic in Amazon SNS and subscribe to the topic. The ARN is displayed in the SNS console. You can specify the type of source (SourceType) you want to be notified of, provide a list of Neptune sources (SourceIds) that triggers the events, and provide a list of event categories (EventCategories) for events you want to be notified of. For example, you can specify SourceType = db-instance, SourceIds = mydbinstance1, mydbinstance2 and EventCategories = Availability, Backup. If you specify both the SourceType and SourceIds, such as SourceType = db-instance and SourceIdentifier = myDBInstance1, you are notified of all the db-instance events for the specified source. If you specify a SourceType but do not specify a SourceIdentifier, you receive notice of the events for that source type for all your Neptune sources. If you do not specify either the SourceType nor the SourceIdentifier, you are notified of events generated from all Neptune sources belonging to your customer account.
   */
  createEventSubscription(params: Neptune.Types.CreateEventSubscriptionMessage, callback?: (err: AWSError, data: Neptune.Types.CreateEventSubscriptionResult) => void): Request<Neptune.Types.CreateEventSubscriptionResult, AWSError>;
  /**
   * Creates an event notification subscription. This action requires a topic ARN (Amazon Resource Name) created by either the Neptune console, the SNS console, or the SNS API. To obtain an ARN with SNS, you must create a topic in Amazon SNS and subscribe to the topic. The ARN is displayed in the SNS console. You can specify the type of source (SourceType) you want to be notified of, provide a list of Neptune sources (SourceIds) that triggers the events, and provide a list of event categories (EventCategories) for events you want to be notified of. For example, you can specify SourceType = db-instance, SourceIds = mydbinstance1, mydbinstance2 and EventCategories = Availability, Backup. If you specify both the SourceType and SourceIds, such as SourceType = db-instance and SourceIdentifier = myDBInstance1, you are notified of all the db-instance events for the specified source. If you specify a SourceType but do not specify a SourceIdentifier, you receive notice of the events for that source type for all your Neptune sources. If you do not specify either the SourceType nor the SourceIdentifier, you are notified of events generated from all Neptune sources belonging to your customer account.
   */
  createEventSubscription(callback?: (err: AWSError, data: Neptune.Types.CreateEventSubscriptionResult) => void): Request<Neptune.Types.CreateEventSubscriptionResult, AWSError>;
  /**
   * The DeleteDBCluster action deletes a previously provisioned DB cluster. When you delete a DB cluster, all automated backups for that DB cluster are deleted and can't be recovered. Manual DB cluster snapshots of the specified DB cluster are not deleted. 
   */
  deleteDBCluster(params: Neptune.Types.DeleteDBClusterMessage, callback?: (err: AWSError, data: Neptune.Types.DeleteDBClusterResult) => void): Request<Neptune.Types.DeleteDBClusterResult, AWSError>;
  /**
   * The DeleteDBCluster action deletes a previously provisioned DB cluster. When you delete a DB cluster, all automated backups for that DB cluster are deleted and can't be recovered. Manual DB cluster snapshots of the specified DB cluster are not deleted. 
   */
  deleteDBCluster(callback?: (err: AWSError, data: Neptune.Types.DeleteDBClusterResult) => void): Request<Neptune.Types.DeleteDBClusterResult, AWSError>;
  /**
   * Deletes a specified DB cluster parameter group. The DB cluster parameter group to be deleted can't be associated with any DB clusters.
   */
  deleteDBClusterParameterGroup(params: Neptune.Types.DeleteDBClusterParameterGroupMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a specified DB cluster parameter group. The DB cluster parameter group to be deleted can't be associated with any DB clusters.
   */
  deleteDBClusterParameterGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a DB cluster snapshot. If the snapshot is being copied, the copy operation is terminated.  The DB cluster snapshot must be in the available state to be deleted. 
   */
  deleteDBClusterSnapshot(params: Neptune.Types.DeleteDBClusterSnapshotMessage, callback?: (err: AWSError, data: Neptune.Types.DeleteDBClusterSnapshotResult) => void): Request<Neptune.Types.DeleteDBClusterSnapshotResult, AWSError>;
  /**
   * Deletes a DB cluster snapshot. If the snapshot is being copied, the copy operation is terminated.  The DB cluster snapshot must be in the available state to be deleted. 
   */
  deleteDBClusterSnapshot(callback?: (err: AWSError, data: Neptune.Types.DeleteDBClusterSnapshotResult) => void): Request<Neptune.Types.DeleteDBClusterSnapshotResult, AWSError>;
  /**
   * The DeleteDBInstance action deletes a previously provisioned DB instance. When you delete a DB instance, all automated backups for that instance are deleted and can't be recovered. Manual DB snapshots of the DB instance to be deleted by DeleteDBInstance are not deleted.  If you request a final DB snapshot the status of the Amazon Neptune DB instance is deleting until the DB snapshot is created. The API action DescribeDBInstance is used to monitor the status of this operation. The action can't be canceled or reverted once submitted.  Note that when a DB instance is in a failure state and has a status of failed, incompatible-restore, or incompatible-network, you can only delete it when the SkipFinalSnapshot parameter is set to true. If the specified DB instance is part of a DB cluster, you can't delete the DB instance if both of the following conditions are true:   The DB cluster is a Read Replica of another DB cluster.   The DB instance is the only instance in the DB cluster.   To delete a DB instance in this case, first call the PromoteReadReplicaDBCluster API action to promote the DB cluster so it's no longer a Read Replica. After the promotion completes, then call the DeleteDBInstance API action to delete the final instance in the DB cluster.
   */
  deleteDBInstance(params: Neptune.Types.DeleteDBInstanceMessage, callback?: (err: AWSError, data: Neptune.Types.DeleteDBInstanceResult) => void): Request<Neptune.Types.DeleteDBInstanceResult, AWSError>;
  /**
   * The DeleteDBInstance action deletes a previously provisioned DB instance. When you delete a DB instance, all automated backups for that instance are deleted and can't be recovered. Manual DB snapshots of the DB instance to be deleted by DeleteDBInstance are not deleted.  If you request a final DB snapshot the status of the Amazon Neptune DB instance is deleting until the DB snapshot is created. The API action DescribeDBInstance is used to monitor the status of this operation. The action can't be canceled or reverted once submitted.  Note that when a DB instance is in a failure state and has a status of failed, incompatible-restore, or incompatible-network, you can only delete it when the SkipFinalSnapshot parameter is set to true. If the specified DB instance is part of a DB cluster, you can't delete the DB instance if both of the following conditions are true:   The DB cluster is a Read Replica of another DB cluster.   The DB instance is the only instance in the DB cluster.   To delete a DB instance in this case, first call the PromoteReadReplicaDBCluster API action to promote the DB cluster so it's no longer a Read Replica. After the promotion completes, then call the DeleteDBInstance API action to delete the final instance in the DB cluster.
   */
  deleteDBInstance(callback?: (err: AWSError, data: Neptune.Types.DeleteDBInstanceResult) => void): Request<Neptune.Types.DeleteDBInstanceResult, AWSError>;
  /**
   * Deletes a specified DBParameterGroup. The DBParameterGroup to be deleted can't be associated with any DB instances.
   */
  deleteDBParameterGroup(params: Neptune.Types.DeleteDBParameterGroupMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a specified DBParameterGroup. The DBParameterGroup to be deleted can't be associated with any DB instances.
   */
  deleteDBParameterGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a DB subnet group.  The specified database subnet group must not be associated with any DB instances. 
   */
  deleteDBSubnetGroup(params: Neptune.Types.DeleteDBSubnetGroupMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a DB subnet group.  The specified database subnet group must not be associated with any DB instances. 
   */
  deleteDBSubnetGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes an event notification subscription.
   */
  deleteEventSubscription(params: Neptune.Types.DeleteEventSubscriptionMessage, callback?: (err: AWSError, data: Neptune.Types.DeleteEventSubscriptionResult) => void): Request<Neptune.Types.DeleteEventSubscriptionResult, AWSError>;
  /**
   * Deletes an event notification subscription.
   */
  deleteEventSubscription(callback?: (err: AWSError, data: Neptune.Types.DeleteEventSubscriptionResult) => void): Request<Neptune.Types.DeleteEventSubscriptionResult, AWSError>;
  /**
   *  Returns a list of DBClusterParameterGroup descriptions. If a DBClusterParameterGroupName parameter is specified, the list will contain only the description of the specified DB cluster parameter group. 
   */
  describeDBClusterParameterGroups(params: Neptune.Types.DescribeDBClusterParameterGroupsMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupsMessage) => void): Request<Neptune.Types.DBClusterParameterGroupsMessage, AWSError>;
  /**
   *  Returns a list of DBClusterParameterGroup descriptions. If a DBClusterParameterGroupName parameter is specified, the list will contain only the description of the specified DB cluster parameter group. 
   */
  describeDBClusterParameterGroups(callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupsMessage) => void): Request<Neptune.Types.DBClusterParameterGroupsMessage, AWSError>;
  /**
   * Returns the detailed parameter list for a particular DB cluster parameter group.
   */
  describeDBClusterParameters(params: Neptune.Types.DescribeDBClusterParametersMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupDetails) => void): Request<Neptune.Types.DBClusterParameterGroupDetails, AWSError>;
  /**
   * Returns the detailed parameter list for a particular DB cluster parameter group.
   */
  describeDBClusterParameters(callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupDetails) => void): Request<Neptune.Types.DBClusterParameterGroupDetails, AWSError>;
  /**
   * Returns a list of DB cluster snapshot attribute names and values for a manual DB cluster snapshot. When sharing snapshots with other AWS accounts, DescribeDBClusterSnapshotAttributes returns the restore attribute and a list of IDs for the AWS accounts that are authorized to copy or restore the manual DB cluster snapshot. If all is included in the list of values for the restore attribute, then the manual DB cluster snapshot is public and can be copied or restored by all AWS accounts. To add or remove access for an AWS account to copy or restore a manual DB cluster snapshot, or to make the manual DB cluster snapshot public or private, use the ModifyDBClusterSnapshotAttribute API action.
   */
  describeDBClusterSnapshotAttributes(params: Neptune.Types.DescribeDBClusterSnapshotAttributesMessage, callback?: (err: AWSError, data: Neptune.Types.DescribeDBClusterSnapshotAttributesResult) => void): Request<Neptune.Types.DescribeDBClusterSnapshotAttributesResult, AWSError>;
  /**
   * Returns a list of DB cluster snapshot attribute names and values for a manual DB cluster snapshot. When sharing snapshots with other AWS accounts, DescribeDBClusterSnapshotAttributes returns the restore attribute and a list of IDs for the AWS accounts that are authorized to copy or restore the manual DB cluster snapshot. If all is included in the list of values for the restore attribute, then the manual DB cluster snapshot is public and can be copied or restored by all AWS accounts. To add or remove access for an AWS account to copy or restore a manual DB cluster snapshot, or to make the manual DB cluster snapshot public or private, use the ModifyDBClusterSnapshotAttribute API action.
   */
  describeDBClusterSnapshotAttributes(callback?: (err: AWSError, data: Neptune.Types.DescribeDBClusterSnapshotAttributesResult) => void): Request<Neptune.Types.DescribeDBClusterSnapshotAttributesResult, AWSError>;
  /**
   * Returns information about DB cluster snapshots. This API action supports pagination.
   */
  describeDBClusterSnapshots(params: Neptune.Types.DescribeDBClusterSnapshotsMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterSnapshotMessage) => void): Request<Neptune.Types.DBClusterSnapshotMessage, AWSError>;
  /**
   * Returns information about DB cluster snapshots. This API action supports pagination.
   */
  describeDBClusterSnapshots(callback?: (err: AWSError, data: Neptune.Types.DBClusterSnapshotMessage) => void): Request<Neptune.Types.DBClusterSnapshotMessage, AWSError>;
  /**
   * Returns information about provisioned DB clusters. This API supports pagination.
   */
  describeDBClusters(params: Neptune.Types.DescribeDBClustersMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterMessage) => void): Request<Neptune.Types.DBClusterMessage, AWSError>;
  /**
   * Returns information about provisioned DB clusters. This API supports pagination.
   */
  describeDBClusters(callback?: (err: AWSError, data: Neptune.Types.DBClusterMessage) => void): Request<Neptune.Types.DBClusterMessage, AWSError>;
  /**
   * Returns a list of the available DB engines.
   */
  describeDBEngineVersions(params: Neptune.Types.DescribeDBEngineVersionsMessage, callback?: (err: AWSError, data: Neptune.Types.DBEngineVersionMessage) => void): Request<Neptune.Types.DBEngineVersionMessage, AWSError>;
  /**
   * Returns a list of the available DB engines.
   */
  describeDBEngineVersions(callback?: (err: AWSError, data: Neptune.Types.DBEngineVersionMessage) => void): Request<Neptune.Types.DBEngineVersionMessage, AWSError>;
  /**
   * Returns information about provisioned instances. This API supports pagination.
   */
  describeDBInstances(params: Neptune.Types.DescribeDBInstancesMessage, callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
  /**
   * Returns information about provisioned instances. This API supports pagination.
   */
  describeDBInstances(callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
  /**
   *  Returns a list of DBParameterGroup descriptions. If a DBParameterGroupName is specified, the list will contain only the description of the specified DB parameter group. 
   */
  describeDBParameterGroups(params: Neptune.Types.DescribeDBParameterGroupsMessage, callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupsMessage) => void): Request<Neptune.Types.DBParameterGroupsMessage, AWSError>;
  /**
   *  Returns a list of DBParameterGroup descriptions. If a DBParameterGroupName is specified, the list will contain only the description of the specified DB parameter group. 
   */
  describeDBParameterGroups(callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupsMessage) => void): Request<Neptune.Types.DBParameterGroupsMessage, AWSError>;
  /**
   * Returns the detailed parameter list for a particular DB parameter group.
   */
  describeDBParameters(params: Neptune.Types.DescribeDBParametersMessage, callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupDetails) => void): Request<Neptune.Types.DBParameterGroupDetails, AWSError>;
  /**
   * Returns the detailed parameter list for a particular DB parameter group.
   */
  describeDBParameters(callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupDetails) => void): Request<Neptune.Types.DBParameterGroupDetails, AWSError>;
  /**
   * Returns a list of DBSubnetGroup descriptions. If a DBSubnetGroupName is specified, the list will contain only the descriptions of the specified DBSubnetGroup. For an overview of CIDR ranges, go to the Wikipedia Tutorial. 
   */
  describeDBSubnetGroups(params: Neptune.Types.DescribeDBSubnetGroupsMessage, callback?: (err: AWSError, data: Neptune.Types.DBSubnetGroupMessage) => void): Request<Neptune.Types.DBSubnetGroupMessage, AWSError>;
  /**
   * Returns a list of DBSubnetGroup descriptions. If a DBSubnetGroupName is specified, the list will contain only the descriptions of the specified DBSubnetGroup. For an overview of CIDR ranges, go to the Wikipedia Tutorial. 
   */
  describeDBSubnetGroups(callback?: (err: AWSError, data: Neptune.Types.DBSubnetGroupMessage) => void): Request<Neptune.Types.DBSubnetGroupMessage, AWSError>;
  /**
   * Returns the default engine and system parameter information for the cluster database engine.
   */
  describeEngineDefaultClusterParameters(params: Neptune.Types.DescribeEngineDefaultClusterParametersMessage, callback?: (err: AWSError, data: Neptune.Types.DescribeEngineDefaultClusterParametersResult) => void): Request<Neptune.Types.DescribeEngineDefaultClusterParametersResult, AWSError>;
  /**
   * Returns the default engine and system parameter information for the cluster database engine.
   */
  describeEngineDefaultClusterParameters(callback?: (err: AWSError, data: Neptune.Types.DescribeEngineDefaultClusterParametersResult) => void): Request<Neptune.Types.DescribeEngineDefaultClusterParametersResult, AWSError>;
  /**
   * Returns the default engine and system parameter information for the specified database engine.
   */
  describeEngineDefaultParameters(params: Neptune.Types.DescribeEngineDefaultParametersMessage, callback?: (err: AWSError, data: Neptune.Types.DescribeEngineDefaultParametersResult) => void): Request<Neptune.Types.DescribeEngineDefaultParametersResult, AWSError>;
  /**
   * Returns the default engine and system parameter information for the specified database engine.
   */
  describeEngineDefaultParameters(callback?: (err: AWSError, data: Neptune.Types.DescribeEngineDefaultParametersResult) => void): Request<Neptune.Types.DescribeEngineDefaultParametersResult, AWSError>;
  /**
   * Displays a list of categories for all event source types, or, if specified, for a specified source type. 
   */
  describeEventCategories(params: Neptune.Types.DescribeEventCategoriesMessage, callback?: (err: AWSError, data: Neptune.Types.EventCategoriesMessage) => void): Request<Neptune.Types.EventCategoriesMessage, AWSError>;
  /**
   * Displays a list of categories for all event source types, or, if specified, for a specified source type. 
   */
  describeEventCategories(callback?: (err: AWSError, data: Neptune.Types.EventCategoriesMessage) => void): Request<Neptune.Types.EventCategoriesMessage, AWSError>;
  /**
   * Lists all the subscription descriptions for a customer account. The description for a subscription includes SubscriptionName, SNSTopicARN, CustomerID, SourceType, SourceID, CreationTime, and Status. If you specify a SubscriptionName, lists the description for that subscription.
   */
  describeEventSubscriptions(params: Neptune.Types.DescribeEventSubscriptionsMessage, callback?: (err: AWSError, data: Neptune.Types.EventSubscriptionsMessage) => void): Request<Neptune.Types.EventSubscriptionsMessage, AWSError>;
  /**
   * Lists all the subscription descriptions for a customer account. The description for a subscription includes SubscriptionName, SNSTopicARN, CustomerID, SourceType, SourceID, CreationTime, and Status. If you specify a SubscriptionName, lists the description for that subscription.
   */
  describeEventSubscriptions(callback?: (err: AWSError, data: Neptune.Types.EventSubscriptionsMessage) => void): Request<Neptune.Types.EventSubscriptionsMessage, AWSError>;
  /**
   * Returns events related to DB instances, DB security groups, DB snapshots, and DB parameter groups for the past 14 days. Events specific to a particular DB instance, DB security group, database snapshot, or DB parameter group can be obtained by providing the name as a parameter. By default, the past hour of events are returned.
   */
  describeEvents(params: Neptune.Types.DescribeEventsMessage, callback?: (err: AWSError, data: Neptune.Types.EventsMessage) => void): Request<Neptune.Types.EventsMessage, AWSError>;
  /**
   * Returns events related to DB instances, DB security groups, DB snapshots, and DB parameter groups for the past 14 days. Events specific to a particular DB instance, DB security group, database snapshot, or DB parameter group can be obtained by providing the name as a parameter. By default, the past hour of events are returned.
   */
  describeEvents(callback?: (err: AWSError, data: Neptune.Types.EventsMessage) => void): Request<Neptune.Types.EventsMessage, AWSError>;
  /**
   * Returns a list of orderable DB instance options for the specified engine.
   */
  describeOrderableDBInstanceOptions(params: Neptune.Types.DescribeOrderableDBInstanceOptionsMessage, callback?: (err: AWSError, data: Neptune.Types.OrderableDBInstanceOptionsMessage) => void): Request<Neptune.Types.OrderableDBInstanceOptionsMessage, AWSError>;
  /**
   * Returns a list of orderable DB instance options for the specified engine.
   */
  describeOrderableDBInstanceOptions(callback?: (err: AWSError, data: Neptune.Types.OrderableDBInstanceOptionsMessage) => void): Request<Neptune.Types.OrderableDBInstanceOptionsMessage, AWSError>;
  /**
   * Returns a list of resources (for example, DB instances) that have at least one pending maintenance action.
   */
  describePendingMaintenanceActions(params: Neptune.Types.DescribePendingMaintenanceActionsMessage, callback?: (err: AWSError, data: Neptune.Types.PendingMaintenanceActionsMessage) => void): Request<Neptune.Types.PendingMaintenanceActionsMessage, AWSError>;
  /**
   * Returns a list of resources (for example, DB instances) that have at least one pending maintenance action.
   */
  describePendingMaintenanceActions(callback?: (err: AWSError, data: Neptune.Types.PendingMaintenanceActionsMessage) => void): Request<Neptune.Types.PendingMaintenanceActionsMessage, AWSError>;
  /**
   * You can call DescribeValidDBInstanceModifications to learn what modifications you can make to your DB instance. You can use this information when you call ModifyDBInstance. 
   */
  describeValidDBInstanceModifications(params: Neptune.Types.DescribeValidDBInstanceModificationsMessage, callback?: (err: AWSError, data: Neptune.Types.DescribeValidDBInstanceModificationsResult) => void): Request<Neptune.Types.DescribeValidDBInstanceModificationsResult, AWSError>;
  /**
   * You can call DescribeValidDBInstanceModifications to learn what modifications you can make to your DB instance. You can use this information when you call ModifyDBInstance. 
   */
  describeValidDBInstanceModifications(callback?: (err: AWSError, data: Neptune.Types.DescribeValidDBInstanceModificationsResult) => void): Request<Neptune.Types.DescribeValidDBInstanceModificationsResult, AWSError>;
  /**
   * Forces a failover for a DB cluster. A failover for a DB cluster promotes one of the Read Replicas (read-only instances) in the DB cluster to be the primary instance (the cluster writer). Amazon Neptune will automatically fail over to a Read Replica, if one exists, when the primary instance fails. You can force a failover when you want to simulate a failure of a primary instance for testing. Because each instance in a DB cluster has its own endpoint address, you will need to clean up and re-establish any existing connections that use those endpoint addresses when the failover is complete.
   */
  failoverDBCluster(params: Neptune.Types.FailoverDBClusterMessage, callback?: (err: AWSError, data: Neptune.Types.FailoverDBClusterResult) => void): Request<Neptune.Types.FailoverDBClusterResult, AWSError>;
  /**
   * Forces a failover for a DB cluster. A failover for a DB cluster promotes one of the Read Replicas (read-only instances) in the DB cluster to be the primary instance (the cluster writer). Amazon Neptune will automatically fail over to a Read Replica, if one exists, when the primary instance fails. You can force a failover when you want to simulate a failure of a primary instance for testing. Because each instance in a DB cluster has its own endpoint address, you will need to clean up and re-establish any existing connections that use those endpoint addresses when the failover is complete.
   */
  failoverDBCluster(callback?: (err: AWSError, data: Neptune.Types.FailoverDBClusterResult) => void): Request<Neptune.Types.FailoverDBClusterResult, AWSError>;
  /**
   * Lists all tags on an Amazon Neptune resource.
   */
  listTagsForResource(params: Neptune.Types.ListTagsForResourceMessage, callback?: (err: AWSError, data: Neptune.Types.TagListMessage) => void): Request<Neptune.Types.TagListMessage, AWSError>;
  /**
   * Lists all tags on an Amazon Neptune resource.
   */
  listTagsForResource(callback?: (err: AWSError, data: Neptune.Types.TagListMessage) => void): Request<Neptune.Types.TagListMessage, AWSError>;
  /**
   * Modify a setting for a DB cluster. You can change one or more database configuration parameters by specifying these parameters and the new values in the request. 
   */
  modifyDBCluster(params: Neptune.Types.ModifyDBClusterMessage, callback?: (err: AWSError, data: Neptune.Types.ModifyDBClusterResult) => void): Request<Neptune.Types.ModifyDBClusterResult, AWSError>;
  /**
   * Modify a setting for a DB cluster. You can change one or more database configuration parameters by specifying these parameters and the new values in the request. 
   */
  modifyDBCluster(callback?: (err: AWSError, data: Neptune.Types.ModifyDBClusterResult) => void): Request<Neptune.Types.ModifyDBClusterResult, AWSError>;
  /**
   *  Modifies the parameters of a DB cluster parameter group. To modify more than one parameter, submit a list of the following: ParameterName, ParameterValue, and ApplyMethod. A maximum of 20 parameters can be modified in a single request.   Changes to dynamic parameters are applied immediately. Changes to static parameters require a reboot without failover to the DB cluster associated with the parameter group before the change can take effect.   After you create a DB cluster parameter group, you should wait at least 5 minutes before creating your first DB cluster that uses that DB cluster parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the parameter group is used as the default for a new DB cluster. This is especially important for parameters that are critical when creating the default database for a DB cluster, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBClusterParameters command to verify that your DB cluster parameter group has been created or modified. 
   */
  modifyDBClusterParameterGroup(params: Neptune.Types.ModifyDBClusterParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupNameMessage) => void): Request<Neptune.Types.DBClusterParameterGroupNameMessage, AWSError>;
  /**
   *  Modifies the parameters of a DB cluster parameter group. To modify more than one parameter, submit a list of the following: ParameterName, ParameterValue, and ApplyMethod. A maximum of 20 parameters can be modified in a single request.   Changes to dynamic parameters are applied immediately. Changes to static parameters require a reboot without failover to the DB cluster associated with the parameter group before the change can take effect.   After you create a DB cluster parameter group, you should wait at least 5 minutes before creating your first DB cluster that uses that DB cluster parameter group as the default parameter group. This allows Amazon Neptune to fully complete the create action before the parameter group is used as the default for a new DB cluster. This is especially important for parameters that are critical when creating the default database for a DB cluster, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBClusterParameters command to verify that your DB cluster parameter group has been created or modified. 
   */
  modifyDBClusterParameterGroup(callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupNameMessage) => void): Request<Neptune.Types.DBClusterParameterGroupNameMessage, AWSError>;
  /**
   * Adds an attribute and values to, or removes an attribute and values from, a manual DB cluster snapshot. To share a manual DB cluster snapshot with other AWS accounts, specify restore as the AttributeName and use the ValuesToAdd parameter to add a list of IDs of the AWS accounts that are authorized to restore the manual DB cluster snapshot. Use the value all to make the manual DB cluster snapshot public, which means that it can be copied or restored by all AWS accounts. Do not add the all value for any manual DB cluster snapshots that contain private information that you don't want available to all AWS accounts. If a manual DB cluster snapshot is encrypted, it can be shared, but only by specifying a list of authorized AWS account IDs for the ValuesToAdd parameter. You can't use all as a value for that parameter in this case. To view which AWS accounts have access to copy or restore a manual DB cluster snapshot, or whether a manual DB cluster snapshot public or private, use the DescribeDBClusterSnapshotAttributes API action.
   */
  modifyDBClusterSnapshotAttribute(params: Neptune.Types.ModifyDBClusterSnapshotAttributeMessage, callback?: (err: AWSError, data: Neptune.Types.ModifyDBClusterSnapshotAttributeResult) => void): Request<Neptune.Types.ModifyDBClusterSnapshotAttributeResult, AWSError>;
  /**
   * Adds an attribute and values to, or removes an attribute and values from, a manual DB cluster snapshot. To share a manual DB cluster snapshot with other AWS accounts, specify restore as the AttributeName and use the ValuesToAdd parameter to add a list of IDs of the AWS accounts that are authorized to restore the manual DB cluster snapshot. Use the value all to make the manual DB cluster snapshot public, which means that it can be copied or restored by all AWS accounts. Do not add the all value for any manual DB cluster snapshots that contain private information that you don't want available to all AWS accounts. If a manual DB cluster snapshot is encrypted, it can be shared, but only by specifying a list of authorized AWS account IDs for the ValuesToAdd parameter. You can't use all as a value for that parameter in this case. To view which AWS accounts have access to copy or restore a manual DB cluster snapshot, or whether a manual DB cluster snapshot public or private, use the DescribeDBClusterSnapshotAttributes API action.
   */
  modifyDBClusterSnapshotAttribute(callback?: (err: AWSError, data: Neptune.Types.ModifyDBClusterSnapshotAttributeResult) => void): Request<Neptune.Types.ModifyDBClusterSnapshotAttributeResult, AWSError>;
  /**
   * Modifies settings for a DB instance. You can change one or more database configuration parameters by specifying these parameters and the new values in the request. To learn what modifications you can make to your DB instance, call DescribeValidDBInstanceModifications before you call ModifyDBInstance. 
   */
  modifyDBInstance(params: Neptune.Types.ModifyDBInstanceMessage, callback?: (err: AWSError, data: Neptune.Types.ModifyDBInstanceResult) => void): Request<Neptune.Types.ModifyDBInstanceResult, AWSError>;
  /**
   * Modifies settings for a DB instance. You can change one or more database configuration parameters by specifying these parameters and the new values in the request. To learn what modifications you can make to your DB instance, call DescribeValidDBInstanceModifications before you call ModifyDBInstance. 
   */
  modifyDBInstance(callback?: (err: AWSError, data: Neptune.Types.ModifyDBInstanceResult) => void): Request<Neptune.Types.ModifyDBInstanceResult, AWSError>;
  /**
   *  Modifies the parameters of a DB parameter group. To modify more than one parameter, submit a list of the following: ParameterName, ParameterValue, and ApplyMethod. A maximum of 20 parameters can be modified in a single request.   Changes to dynamic parameters are applied immediately. Changes to static parameters require a reboot without failover to the DB instance associated with the parameter group before the change can take effect.   After you modify a DB parameter group, you should wait at least 5 minutes before creating your first DB instance that uses that DB parameter group as the default parameter group. This allows Amazon Neptune to fully complete the modify action before the parameter group is used as the default for a new DB instance. This is especially important for parameters that are critical when creating the default database for a DB instance, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBParameters command to verify that your DB parameter group has been created or modified. 
   */
  modifyDBParameterGroup(params: Neptune.Types.ModifyDBParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupNameMessage) => void): Request<Neptune.Types.DBParameterGroupNameMessage, AWSError>;
  /**
   *  Modifies the parameters of a DB parameter group. To modify more than one parameter, submit a list of the following: ParameterName, ParameterValue, and ApplyMethod. A maximum of 20 parameters can be modified in a single request.   Changes to dynamic parameters are applied immediately. Changes to static parameters require a reboot without failover to the DB instance associated with the parameter group before the change can take effect.   After you modify a DB parameter group, you should wait at least 5 minutes before creating your first DB instance that uses that DB parameter group as the default parameter group. This allows Amazon Neptune to fully complete the modify action before the parameter group is used as the default for a new DB instance. This is especially important for parameters that are critical when creating the default database for a DB instance, such as the character set for the default database defined by the character_set_database parameter. You can use the Parameter Groups option of the Amazon Neptune console or the DescribeDBParameters command to verify that your DB parameter group has been created or modified. 
   */
  modifyDBParameterGroup(callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupNameMessage) => void): Request<Neptune.Types.DBParameterGroupNameMessage, AWSError>;
  /**
   * Modifies an existing DB subnet group. DB subnet groups must contain at least one subnet in at least two AZs in the AWS Region.
   */
  modifyDBSubnetGroup(params: Neptune.Types.ModifyDBSubnetGroupMessage, callback?: (err: AWSError, data: Neptune.Types.ModifyDBSubnetGroupResult) => void): Request<Neptune.Types.ModifyDBSubnetGroupResult, AWSError>;
  /**
   * Modifies an existing DB subnet group. DB subnet groups must contain at least one subnet in at least two AZs in the AWS Region.
   */
  modifyDBSubnetGroup(callback?: (err: AWSError, data: Neptune.Types.ModifyDBSubnetGroupResult) => void): Request<Neptune.Types.ModifyDBSubnetGroupResult, AWSError>;
  /**
   * Modifies an existing event notification subscription. Note that you can't modify the source identifiers using this call; to change source identifiers for a subscription, use the AddSourceIdentifierToSubscription and RemoveSourceIdentifierFromSubscription calls. You can see a list of the event categories for a given SourceType by using the DescribeEventCategories action.
   */
  modifyEventSubscription(params: Neptune.Types.ModifyEventSubscriptionMessage, callback?: (err: AWSError, data: Neptune.Types.ModifyEventSubscriptionResult) => void): Request<Neptune.Types.ModifyEventSubscriptionResult, AWSError>;
  /**
   * Modifies an existing event notification subscription. Note that you can't modify the source identifiers using this call; to change source identifiers for a subscription, use the AddSourceIdentifierToSubscription and RemoveSourceIdentifierFromSubscription calls. You can see a list of the event categories for a given SourceType by using the DescribeEventCategories action.
   */
  modifyEventSubscription(callback?: (err: AWSError, data: Neptune.Types.ModifyEventSubscriptionResult) => void): Request<Neptune.Types.ModifyEventSubscriptionResult, AWSError>;
  /**
   * Promotes a Read Replica DB cluster to a standalone DB cluster.
   */
  promoteReadReplicaDBCluster(params: Neptune.Types.PromoteReadReplicaDBClusterMessage, callback?: (err: AWSError, data: Neptune.Types.PromoteReadReplicaDBClusterResult) => void): Request<Neptune.Types.PromoteReadReplicaDBClusterResult, AWSError>;
  /**
   * Promotes a Read Replica DB cluster to a standalone DB cluster.
   */
  promoteReadReplicaDBCluster(callback?: (err: AWSError, data: Neptune.Types.PromoteReadReplicaDBClusterResult) => void): Request<Neptune.Types.PromoteReadReplicaDBClusterResult, AWSError>;
  /**
   * You might need to reboot your DB instance, usually for maintenance reasons. For example, if you make certain modifications, or if you change the DB parameter group associated with the DB instance, you must reboot the instance for the changes to take effect.  Rebooting a DB instance restarts the database engine service. Rebooting a DB instance results in a momentary outage, during which the DB instance status is set to rebooting. 
   */
  rebootDBInstance(params: Neptune.Types.RebootDBInstanceMessage, callback?: (err: AWSError, data: Neptune.Types.RebootDBInstanceResult) => void): Request<Neptune.Types.RebootDBInstanceResult, AWSError>;
  /**
   * You might need to reboot your DB instance, usually for maintenance reasons. For example, if you make certain modifications, or if you change the DB parameter group associated with the DB instance, you must reboot the instance for the changes to take effect.  Rebooting a DB instance restarts the database engine service. Rebooting a DB instance results in a momentary outage, during which the DB instance status is set to rebooting. 
   */
  rebootDBInstance(callback?: (err: AWSError, data: Neptune.Types.RebootDBInstanceResult) => void): Request<Neptune.Types.RebootDBInstanceResult, AWSError>;
  /**
   * Disassociates an Identity and Access Management (IAM) role from a DB cluster. 
   */
  removeRoleFromDBCluster(params: Neptune.Types.RemoveRoleFromDBClusterMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disassociates an Identity and Access Management (IAM) role from a DB cluster. 
   */
  removeRoleFromDBCluster(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Removes a source identifier from an existing event notification subscription.
   */
  removeSourceIdentifierFromSubscription(params: Neptune.Types.RemoveSourceIdentifierFromSubscriptionMessage, callback?: (err: AWSError, data: Neptune.Types.RemoveSourceIdentifierFromSubscriptionResult) => void): Request<Neptune.Types.RemoveSourceIdentifierFromSubscriptionResult, AWSError>;
  /**
   * Removes a source identifier from an existing event notification subscription.
   */
  removeSourceIdentifierFromSubscription(callback?: (err: AWSError, data: Neptune.Types.RemoveSourceIdentifierFromSubscriptionResult) => void): Request<Neptune.Types.RemoveSourceIdentifierFromSubscriptionResult, AWSError>;
  /**
   * Removes metadata tags from an Amazon Neptune resource.
   */
  removeTagsFromResource(params: Neptune.Types.RemoveTagsFromResourceMessage, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Removes metadata tags from an Amazon Neptune resource.
   */
  removeTagsFromResource(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   *  Modifies the parameters of a DB cluster parameter group to the default value. To reset specific parameters submit a list of the following: ParameterName and ApplyMethod. To reset the entire DB cluster parameter group, specify the DBClusterParameterGroupName and ResetAllParameters parameters.   When resetting the entire group, dynamic parameters are updated immediately and static parameters are set to pending-reboot to take effect on the next DB instance restart or RebootDBInstance request. You must call RebootDBInstance for every DB instance in your DB cluster that you want the updated static parameter to apply to.
   */
  resetDBClusterParameterGroup(params: Neptune.Types.ResetDBClusterParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupNameMessage) => void): Request<Neptune.Types.DBClusterParameterGroupNameMessage, AWSError>;
  /**
   *  Modifies the parameters of a DB cluster parameter group to the default value. To reset specific parameters submit a list of the following: ParameterName and ApplyMethod. To reset the entire DB cluster parameter group, specify the DBClusterParameterGroupName and ResetAllParameters parameters.   When resetting the entire group, dynamic parameters are updated immediately and static parameters are set to pending-reboot to take effect on the next DB instance restart or RebootDBInstance request. You must call RebootDBInstance for every DB instance in your DB cluster that you want the updated static parameter to apply to.
   */
  resetDBClusterParameterGroup(callback?: (err: AWSError, data: Neptune.Types.DBClusterParameterGroupNameMessage) => void): Request<Neptune.Types.DBClusterParameterGroupNameMessage, AWSError>;
  /**
   * Modifies the parameters of a DB parameter group to the engine/system default value. To reset specific parameters, provide a list of the following: ParameterName and ApplyMethod. To reset the entire DB parameter group, specify the DBParameterGroup name and ResetAllParameters parameters. When resetting the entire group, dynamic parameters are updated immediately and static parameters are set to pending-reboot to take effect on the next DB instance restart or RebootDBInstance request. 
   */
  resetDBParameterGroup(params: Neptune.Types.ResetDBParameterGroupMessage, callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupNameMessage) => void): Request<Neptune.Types.DBParameterGroupNameMessage, AWSError>;
  /**
   * Modifies the parameters of a DB parameter group to the engine/system default value. To reset specific parameters, provide a list of the following: ParameterName and ApplyMethod. To reset the entire DB parameter group, specify the DBParameterGroup name and ResetAllParameters parameters. When resetting the entire group, dynamic parameters are updated immediately and static parameters are set to pending-reboot to take effect on the next DB instance restart or RebootDBInstance request. 
   */
  resetDBParameterGroup(callback?: (err: AWSError, data: Neptune.Types.DBParameterGroupNameMessage) => void): Request<Neptune.Types.DBParameterGroupNameMessage, AWSError>;
  /**
   * Creates a new DB cluster from a DB snapshot or DB cluster snapshot. If a DB snapshot is specified, the target DB cluster is created from the source DB snapshot with a default configuration and default security group. If a DB cluster snapshot is specified, the target DB cluster is created from the source DB cluster restore point with the same configuration as the original source DB cluster, except that the new DB cluster is created with the default security group.
   */
  restoreDBClusterFromSnapshot(params: Neptune.Types.RestoreDBClusterFromSnapshotMessage, callback?: (err: AWSError, data: Neptune.Types.RestoreDBClusterFromSnapshotResult) => void): Request<Neptune.Types.RestoreDBClusterFromSnapshotResult, AWSError>;
  /**
   * Creates a new DB cluster from a DB snapshot or DB cluster snapshot. If a DB snapshot is specified, the target DB cluster is created from the source DB snapshot with a default configuration and default security group. If a DB cluster snapshot is specified, the target DB cluster is created from the source DB cluster restore point with the same configuration as the original source DB cluster, except that the new DB cluster is created with the default security group.
   */
  restoreDBClusterFromSnapshot(callback?: (err: AWSError, data: Neptune.Types.RestoreDBClusterFromSnapshotResult) => void): Request<Neptune.Types.RestoreDBClusterFromSnapshotResult, AWSError>;
  /**
   * Restores a DB cluster to an arbitrary point in time. Users can restore to any point in time before LatestRestorableTime for up to BackupRetentionPeriod days. The target DB cluster is created from the source DB cluster with the same configuration as the original DB cluster, except that the new DB cluster is created with the default DB security group.   This action only restores the DB cluster, not the DB instances for that DB cluster. You must invoke the CreateDBInstance action to create DB instances for the restored DB cluster, specifying the identifier of the restored DB cluster in DBClusterIdentifier. You can create DB instances only after the RestoreDBClusterToPointInTime action has completed and the DB cluster is available. 
   */
  restoreDBClusterToPointInTime(params: Neptune.Types.RestoreDBClusterToPointInTimeMessage, callback?: (err: AWSError, data: Neptune.Types.RestoreDBClusterToPointInTimeResult) => void): Request<Neptune.Types.RestoreDBClusterToPointInTimeResult, AWSError>;
  /**
   * Restores a DB cluster to an arbitrary point in time. Users can restore to any point in time before LatestRestorableTime for up to BackupRetentionPeriod days. The target DB cluster is created from the source DB cluster with the same configuration as the original DB cluster, except that the new DB cluster is created with the default DB security group.   This action only restores the DB cluster, not the DB instances for that DB cluster. You must invoke the CreateDBInstance action to create DB instances for the restored DB cluster, specifying the identifier of the restored DB cluster in DBClusterIdentifier. You can create DB instances only after the RestoreDBClusterToPointInTime action has completed and the DB cluster is available. 
   */
  restoreDBClusterToPointInTime(callback?: (err: AWSError, data: Neptune.Types.RestoreDBClusterToPointInTimeResult) => void): Request<Neptune.Types.RestoreDBClusterToPointInTimeResult, AWSError>;
  /**
   * Waits for the dBInstanceAvailable state by periodically calling the underlying Neptune.describeDBInstancesoperation every 30 seconds (at most 60 times).
   */
  waitFor(state: "dBInstanceAvailable", params: Neptune.Types.DescribeDBInstancesMessage & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
  /**
   * Waits for the dBInstanceAvailable state by periodically calling the underlying Neptune.describeDBInstancesoperation every 30 seconds (at most 60 times).
   */
  waitFor(state: "dBInstanceAvailable", callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
  /**
   * Waits for the dBInstanceDeleted state by periodically calling the underlying Neptune.describeDBInstancesoperation every 30 seconds (at most 60 times).
   */
  waitFor(state: "dBInstanceDeleted", params: Neptune.Types.DescribeDBInstancesMessage & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
  /**
   * Waits for the dBInstanceDeleted state by periodically calling the underlying Neptune.describeDBInstancesoperation every 30 seconds (at most 60 times).
   */
  waitFor(state: "dBInstanceDeleted", callback?: (err: AWSError, data: Neptune.Types.DBInstanceMessage) => void): Request<Neptune.Types.DBInstanceMessage, AWSError>;
}
declare namespace Neptune {
  export interface AddRoleToDBClusterMessage {
    /**
     * The name of the DB cluster to associate the IAM role with.
     */
    DBClusterIdentifier: String;
    /**
     * The Amazon Resource Name (ARN) of the IAM role to associate with the Neptune DB cluster, for example arn:aws:iam::123456789012:role/NeptuneAccessRole.
     */
    RoleArn: String;
  }
  export interface AddSourceIdentifierToSubscriptionMessage {
    /**
     * The name of the event notification subscription you want to add a source identifier to.
     */
    SubscriptionName: String;
    /**
     * The identifier of the event source to be added. Constraints:   If the source type is a DB instance, then a DBInstanceIdentifier must be supplied.   If the source type is a DB security group, a DBSecurityGroupName must be supplied.   If the source type is a DB parameter group, a DBParameterGroupName must be supplied.   If the source type is a DB snapshot, a DBSnapshotIdentifier must be supplied.  
     */
    SourceIdentifier: String;
  }
  export interface AddSourceIdentifierToSubscriptionResult {
    EventSubscription?: EventSubscription;
  }
  export interface AddTagsToResourceMessage {
    /**
     * The Amazon Neptune resource that the tags are added to. This value is an Amazon Resource Name (ARN). For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).
     */
    ResourceName: String;
    /**
     * The tags to be assigned to the Amazon Neptune resource.
     */
    Tags: TagList;
  }
  export type ApplyMethod = "immediate"|"pending-reboot"|string;
  export interface ApplyPendingMaintenanceActionMessage {
    /**
     * The Amazon Resource Name (ARN) of the resource that the pending maintenance action applies to. For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).
     */
    ResourceIdentifier: String;
    /**
     * The pending maintenance action to apply to this resource. Valid values: system-update, db-upgrade 
     */
    ApplyAction: String;
    /**
     * A value that specifies the type of opt-in request, or undoes an opt-in request. An opt-in request of type immediate can't be undone. Valid values:    immediate - Apply the maintenance action immediately.    next-maintenance - Apply the maintenance action during the next maintenance window for the resource.    undo-opt-in - Cancel any existing next-maintenance opt-in requests.  
     */
    OptInType: String;
  }
  export interface ApplyPendingMaintenanceActionResult {
    ResourcePendingMaintenanceActions?: ResourcePendingMaintenanceActions;
  }
  export type AttributeValueList = String[];
  export interface AvailabilityZone {
    /**
     * The name of the availability zone.
     */
    Name?: String;
  }
  export type AvailabilityZoneList = AvailabilityZone[];
  export type AvailabilityZones = String[];
  export type Boolean = boolean;
  export type BooleanOptional = boolean;
  export interface CharacterSet {
    /**
     * The name of the character set.
     */
    CharacterSetName?: String;
    /**
     * The description of the character set.
     */
    CharacterSetDescription?: String;
  }
  export interface CloudwatchLogsExportConfiguration {
    /**
     * The list of log types to enable.
     */
    EnableLogTypes?: LogTypeList;
    /**
     * The list of log types to disable.
     */
    DisableLogTypes?: LogTypeList;
  }
  export interface CopyDBClusterParameterGroupMessage {
    /**
     * The identifier or Amazon Resource Name (ARN) for the source DB cluster parameter group. For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).  Constraints:   Must specify a valid DB cluster parameter group.   If the source DB cluster parameter group is in the same AWS Region as the copy, specify a valid DB parameter group identifier, for example my-db-cluster-param-group, or a valid ARN.   If the source DB parameter group is in a different AWS Region than the copy, specify a valid DB cluster parameter group ARN, for example arn:aws:rds:us-east-1:123456789012:cluster-pg:custom-cluster-group1.  
     */
    SourceDBClusterParameterGroupIdentifier: String;
    /**
     * The identifier for the copied DB cluster parameter group. Constraints:   Cannot be null, empty, or blank   Must contain from 1 to 255 letters, numbers, or hyphens   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens   Example: my-cluster-param-group1 
     */
    TargetDBClusterParameterGroupIdentifier: String;
    /**
     * A description for the copied DB cluster parameter group.
     */
    TargetDBClusterParameterGroupDescription: String;
    Tags?: TagList;
  }
  export interface CopyDBClusterParameterGroupResult {
    DBClusterParameterGroup?: DBClusterParameterGroup;
  }
  export interface CopyDBClusterSnapshotMessage {
    /**
     * The identifier of the DB cluster snapshot to copy. This parameter is not case-sensitive. You can't copy an encrypted, shared DB cluster snapshot from one AWS Region to another. Constraints:   Must specify a valid system snapshot in the "available" state.   If the source snapshot is in the same AWS Region as the copy, specify a valid DB snapshot identifier.   If the source snapshot is in a different AWS Region than the copy, specify a valid DB cluster snapshot ARN.    Example: my-cluster-snapshot1 
     */
    SourceDBClusterSnapshotIdentifier: String;
    /**
     * The identifier of the new DB cluster snapshot to create from the source DB cluster snapshot. This parameter is not case-sensitive. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens.   First character must be a letter.   Cannot end with a hyphen or contain two consecutive hyphens.   Example: my-cluster-snapshot2 
     */
    TargetDBClusterSnapshotIdentifier: String;
    /**
     * The AWS AWS KMS key ID for an encrypted DB cluster snapshot. The KMS key ID is the Amazon Resource Name (ARN), KMS key identifier, or the KMS key alias for the KMS encryption key.  If you copy an unencrypted DB cluster snapshot and specify a value for the KmsKeyId parameter, Amazon Neptune encrypts the target DB cluster snapshot using the specified KMS encryption key.  If you copy an encrypted DB cluster snapshot from your AWS account, you can specify a value for KmsKeyId to encrypt the copy with a new KMS encryption key. If you don't specify a value for KmsKeyId, then the copy of the DB cluster snapshot is encrypted with the same KMS key as the source DB cluster snapshot.  If you copy an encrypted DB cluster snapshot that is shared from another AWS account, then you must specify a value for KmsKeyId.  To copy an encrypted DB cluster snapshot to another AWS Region, you must set KmsKeyId to the KMS key ID you want to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region. KMS encryption keys are specific to the AWS Region that they are created in, and you can't use encryption keys from one AWS Region in another AWS Region.
     */
    KmsKeyId?: String;
    /**
     * The URL that contains a Signature Version 4 signed request for the CopyDBClusterSnapshot API action in the AWS Region that contains the source DB cluster snapshot to copy. The PreSignedUrl parameter must be used when copying an encrypted DB cluster snapshot from another AWS Region. The pre-signed URL must be a valid request for the CopyDBSClusterSnapshot API action that can be executed in the source AWS Region that contains the encrypted DB cluster snapshot to be copied. The pre-signed URL request must contain the following parameter values:    KmsKeyId - The AWS KMS key identifier for the key to use to encrypt the copy of the DB cluster snapshot in the destination AWS Region. This is the same identifier for both the CopyDBClusterSnapshot action that is called in the destination AWS Region, and the action contained in the pre-signed URL.    DestinationRegion - The name of the AWS Region that the DB cluster snapshot will be created in.    SourceDBClusterSnapshotIdentifier - The DB cluster snapshot identifier for the encrypted DB cluster snapshot to be copied. This identifier must be in the Amazon Resource Name (ARN) format for the source AWS Region. For example, if you are copying an encrypted DB cluster snapshot from the us-west-2 AWS Region, then your SourceDBClusterSnapshotIdentifier looks like the following example: arn:aws:rds:us-west-2:123456789012:cluster-snapshot:neptune-cluster1-snapshot-20161115.   To learn how to generate a Signature Version 4 signed request, see  Authenticating Requests: Using Query Parameters (AWS Signature Version 4) and  Signature Version 4 Signing Process.
     */
    PreSignedUrl?: String;
    /**
     * True to copy all tags from the source DB cluster snapshot to the target DB cluster snapshot, and otherwise false. The default is false.
     */
    CopyTags?: BooleanOptional;
    Tags?: TagList;
  }
  export interface CopyDBClusterSnapshotResult {
    DBClusterSnapshot?: DBClusterSnapshot;
  }
  export interface CopyDBParameterGroupMessage {
    /**
     *  The identifier or ARN for the source DB parameter group. For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).  Constraints:   Must specify a valid DB parameter group.   Must specify a valid DB parameter group identifier, for example my-db-param-group, or a valid ARN.  
     */
    SourceDBParameterGroupIdentifier: String;
    /**
     * The identifier for the copied DB parameter group. Constraints:   Cannot be null, empty, or blank   Must contain from 1 to 255 letters, numbers, or hyphens   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens   Example: my-db-parameter-group 
     */
    TargetDBParameterGroupIdentifier: String;
    /**
     * A description for the copied DB parameter group.
     */
    TargetDBParameterGroupDescription: String;
    Tags?: TagList;
  }
  export interface CopyDBParameterGroupResult {
    DBParameterGroup?: DBParameterGroup;
  }
  export interface CreateDBClusterMessage {
    /**
     * A list of EC2 Availability Zones that instances in the DB cluster can be created in. 
     */
    AvailabilityZones?: AvailabilityZones;
    /**
     * The number of days for which automated backups are retained. You must specify a minimum value of 1. Default: 1 Constraints:   Must be a value from 1 to 35  
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     * A value that indicates that the DB cluster should be associated with the specified CharacterSet.
     */
    CharacterSetName?: String;
    /**
     * The name for your database of up to 64 alpha-numeric characters. If you do not provide a name, Amazon Neptune will not create a database in the DB cluster you are creating.
     */
    DatabaseName?: String;
    /**
     * The DB cluster identifier. This parameter is stored as a lowercase string. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens.   First character must be a letter.   Cannot end with a hyphen or contain two consecutive hyphens.   Example: my-cluster1 
     */
    DBClusterIdentifier: String;
    /**
     *  The name of the DB cluster parameter group to associate with this DB cluster. If this argument is omitted, the default is used.  Constraints:   If supplied, must match the name of an existing DBClusterParameterGroup.  
     */
    DBClusterParameterGroupName?: String;
    /**
     * A list of EC2 VPC security groups to associate with this DB cluster.
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    /**
     * A DB subnet group to associate with this DB cluster. Constraints: Must match the name of an existing DBSubnetGroup. Must not be default. Example: mySubnetgroup 
     */
    DBSubnetGroupName?: String;
    /**
     * The name of the database engine to be used for this DB cluster. Valid Values: neptune 
     */
    Engine: String;
    /**
     * The version number of the database engine to use. Example: 1.0.1 
     */
    EngineVersion?: String;
    /**
     * The port number on which the instances in the DB cluster accept connections.  Default: 8182 
     */
    Port?: IntegerOptional;
    /**
     * The name of the master user for the DB cluster. Constraints:   Must be 1 to 16 letters or numbers.   First character must be a letter.   Cannot be a reserved word for the chosen database engine.  
     */
    MasterUsername?: String;
    /**
     * The password for the master database user. This password can contain any printable ASCII character except "/", """, or "@". Constraints: Must contain from 8 to 41 characters.
     */
    MasterUserPassword?: String;
    /**
     * A value that indicates that the DB cluster should be associated with the specified option group. Permanent options can't be removed from an option group. The option group can't be removed from a DB cluster once it is associated with a DB cluster.
     */
    OptionGroupName?: String;
    /**
     * The daily time range during which automated backups are created if automated backups are enabled using the BackupRetentionPeriod parameter.  The default is a 30-minute window selected at random from an 8-hour block of time for each AWS Region. To see the time blocks available, see  Adjusting the Preferred Maintenance Window in the Amazon Neptune User Guide.  Constraints:   Must be in the format hh24:mi-hh24:mi.   Must be in Universal Coordinated Time (UTC).   Must not conflict with the preferred maintenance window.   Must be at least 30 minutes.  
     */
    PreferredBackupWindow?: String;
    /**
     * The weekly time range during which system maintenance can occur, in Universal Coordinated Time (UTC). Format: ddd:hh24:mi-ddd:hh24:mi  The default is a 30-minute window selected at random from an 8-hour block of time for each AWS Region, occurring on a random day of the week. To see the time blocks available, see  Adjusting the Preferred Maintenance Window in the Amazon Neptune User Guide.  Valid Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun. Constraints: Minimum 30-minute window.
     */
    PreferredMaintenanceWindow?: String;
    /**
     * The Amazon Resource Name (ARN) of the source DB instance or DB cluster if this DB cluster is created as a Read Replica.
     */
    ReplicationSourceIdentifier?: String;
    Tags?: TagList;
    /**
     * Specifies whether the DB cluster is encrypted.
     */
    StorageEncrypted?: BooleanOptional;
    /**
     * The AWS KMS key identifier for an encrypted DB cluster. The KMS key identifier is the Amazon Resource Name (ARN) for the KMS encryption key. If you are creating a DB cluster with the same AWS account that owns the KMS encryption key used to encrypt the new DB cluster, then you can use the KMS key alias instead of the ARN for the KMS encryption key. If an encryption key is not specified in KmsKeyId:   If ReplicationSourceIdentifier identifies an encrypted source, then Amazon Neptune will use the encryption key used to encrypt the source. Otherwise, Amazon Neptune will use your default encryption key.    If the StorageEncrypted parameter is true and ReplicationSourceIdentifier is not specified, then Amazon Neptune will use your default encryption key.   AWS KMS creates the default encryption key for your AWS account. Your AWS account has a different default encryption key for each AWS Region. If you create a Read Replica of an encrypted DB cluster in another AWS Region, you must set KmsKeyId to a KMS key ID that is valid in the destination AWS Region. This key is used to encrypt the Read Replica in that AWS Region.
     */
    KmsKeyId?: String;
    /**
     * A URL that contains a Signature Version 4 signed request for the CreateDBCluster action to be called in the source AWS Region where the DB cluster is replicated from. You only need to specify PreSignedUrl when you are performing cross-region replication from an encrypted DB cluster. The pre-signed URL must be a valid request for the CreateDBCluster API action that can be executed in the source AWS Region that contains the encrypted DB cluster to be copied. The pre-signed URL request must contain the following parameter values:    KmsKeyId - The AWS KMS key identifier for the key to use to encrypt the copy of the DB cluster in the destination AWS Region. This should refer to the same KMS key for both the CreateDBCluster action that is called in the destination AWS Region, and the action contained in the pre-signed URL.    DestinationRegion - The name of the AWS Region that Read Replica will be created in.    ReplicationSourceIdentifier - The DB cluster identifier for the encrypted DB cluster to be copied. This identifier must be in the Amazon Resource Name (ARN) format for the source AWS Region. For example, if you are copying an encrypted DB cluster from the us-west-2 AWS Region, then your ReplicationSourceIdentifier would look like Example: arn:aws:rds:us-west-2:123456789012:cluster:neptune-cluster1.   To learn how to generate a Signature Version 4 signed request, see  Authenticating Requests: Using Query Parameters (AWS Signature Version 4) and  Signature Version 4 Signing Process.
     */
    PreSignedUrl?: String;
    /**
     * True to enable mapping of AWS Identity and Access Management (IAM) accounts to database accounts, and otherwise false. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
  }
  export interface CreateDBClusterParameterGroupMessage {
    /**
     * The name of the DB cluster parameter group. Constraints:   Must match the name of an existing DBClusterParameterGroup.    This value is stored as a lowercase string. 
     */
    DBClusterParameterGroupName: String;
    /**
     * The DB cluster parameter group family name. A DB cluster parameter group can be associated with one and only one DB cluster parameter group family, and can be applied only to a DB cluster running a database engine and engine version compatible with that DB cluster parameter group family.
     */
    DBParameterGroupFamily: String;
    /**
     * The description for the DB cluster parameter group.
     */
    Description: String;
    Tags?: TagList;
  }
  export interface CreateDBClusterParameterGroupResult {
    DBClusterParameterGroup?: DBClusterParameterGroup;
  }
  export interface CreateDBClusterResult {
    DBCluster?: DBCluster;
  }
  export interface CreateDBClusterSnapshotMessage {
    /**
     * The identifier of the DB cluster snapshot. This parameter is stored as a lowercase string. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens.   First character must be a letter.   Cannot end with a hyphen or contain two consecutive hyphens.   Example: my-cluster1-snapshot1 
     */
    DBClusterSnapshotIdentifier: String;
    /**
     * The identifier of the DB cluster to create a snapshot for. This parameter is not case-sensitive. Constraints:   Must match the identifier of an existing DBCluster.   Example: my-cluster1 
     */
    DBClusterIdentifier: String;
    /**
     * The tags to be assigned to the DB cluster snapshot.
     */
    Tags?: TagList;
  }
  export interface CreateDBClusterSnapshotResult {
    DBClusterSnapshot?: DBClusterSnapshot;
  }
  export interface CreateDBInstanceMessage {
    /**
     * The database name.  Type: String
     */
    DBName?: String;
    /**
     * The DB instance identifier. This parameter is stored as a lowercase string. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens.   First character must be a letter.   Cannot end with a hyphen or contain two consecutive hyphens.   Example: mydbinstance 
     */
    DBInstanceIdentifier: String;
    /**
     * The amount of storage (in gibibytes) to allocate for the DB instance. Type: Integer Not applicable. Neptune cluster volumes automatically grow as the amount of data in your database increases, though you are only charged for the space that you use in a Neptune cluster volume.
     */
    AllocatedStorage?: IntegerOptional;
    /**
     * The compute and memory capacity of the DB instance, for example, db.m4.large. Not all DB instance classes are available in all AWS Regions. 
     */
    DBInstanceClass: String;
    /**
     * The name of the database engine to be used for this instance.  Valid Values: neptune 
     */
    Engine: String;
    /**
     * The name for the master user. Not used.
     */
    MasterUsername?: String;
    /**
     * The password for the master user. The password can include any printable ASCII character except "/", """, or "@".  Not used. 
     */
    MasterUserPassword?: String;
    /**
     * A list of DB security groups to associate with this DB instance. Default: The default DB security group for the database engine.
     */
    DBSecurityGroups?: DBSecurityGroupNameList;
    /**
     * A list of EC2 VPC security groups to associate with this DB instance. Not applicable. The associated list of EC2 VPC security groups is managed by the DB cluster. For more information, see CreateDBCluster. Default: The default EC2 VPC security group for the DB subnet group's VPC.
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    /**
     *  The EC2 Availability Zone that the DB instance is created in.  Default: A random, system-chosen Availability Zone in the endpoint's AWS Region.  Example: us-east-1d   Constraint: The AvailabilityZone parameter can't be specified if the MultiAZ parameter is set to true. The specified Availability Zone must be in the same AWS Region as the current endpoint. 
     */
    AvailabilityZone?: String;
    /**
     * A DB subnet group to associate with this DB instance. If there is no DB subnet group, then it is a non-VPC DB instance.
     */
    DBSubnetGroupName?: String;
    /**
     * The time range each week during which system maintenance can occur, in Universal Coordinated Time (UTC).   Format: ddd:hh24:mi-ddd:hh24:mi  The default is a 30-minute window selected at random from an 8-hour block of time for each AWS Region, occurring on a random day of the week.  Valid Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun. Constraints: Minimum 30-minute window.
     */
    PreferredMaintenanceWindow?: String;
    /**
     * The name of the DB parameter group to associate with this DB instance. If this argument is omitted, the default DBParameterGroup for the specified engine is used. Constraints:   Must be 1 to 255 letters, numbers, or hyphens.   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens  
     */
    DBParameterGroupName?: String;
    /**
     * The number of days for which automated backups are retained. Not applicable. The retention period for automated backups is managed by the DB cluster. For more information, see CreateDBCluster. Default: 1 Constraints:   Must be a value from 0 to 35   Cannot be set to 0 if the DB instance is a source to Read Replicas  
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     *  The daily time range during which automated backups are created.  Not applicable. The daily time range for creating automated backups is managed by the DB cluster. For more information, see CreateDBCluster.
     */
    PreferredBackupWindow?: String;
    /**
     * The port number on which the database accepts connections. Not applicable. The port is managed by the DB cluster. For more information, see CreateDBCluster.  Default: 8182  Type: Integer
     */
    Port?: IntegerOptional;
    /**
     * Specifies if the DB instance is a Multi-AZ deployment. You can't set the AvailabilityZone parameter if the MultiAZ parameter is set to true.
     */
    MultiAZ?: BooleanOptional;
    /**
     * The version number of the database engine to use.
     */
    EngineVersion?: String;
    /**
     * Indicates that minor engine upgrades are applied automatically to the DB instance during the maintenance window. Default: true 
     */
    AutoMinorVersionUpgrade?: BooleanOptional;
    /**
     * License model information for this DB instance.  Valid values: license-included | bring-your-own-license | general-public-license 
     */
    LicenseModel?: String;
    /**
     * The amount of Provisioned IOPS (input/output operations per second) to be initially allocated for the DB instance. 
     */
    Iops?: IntegerOptional;
    /**
     * Indicates that the DB instance should be associated with the specified option group. Permanent options, such as the TDE option for Oracle Advanced Security TDE, can't be removed from an option group, and that option group can't be removed from a DB instance once it is associated with a DB instance
     */
    OptionGroupName?: String;
    /**
     * Indicates that the DB instance should be associated with the specified CharacterSet. Not applicable. The character set is managed by the DB cluster. For more information, see CreateDBCluster.
     */
    CharacterSetName?: String;
    /**
     * This parameter is not supported.
     */
    PubliclyAccessible?: BooleanOptional;
    Tags?: TagList;
    /**
     * The identifier of the DB cluster that the instance will belong to. For information on creating a DB cluster, see CreateDBCluster. Type: String
     */
    DBClusterIdentifier?: String;
    /**
     * Specifies the storage type to be associated with the DB instance. Not applicable. Storage is managed by the DB Cluster.
     */
    StorageType?: String;
    /**
     * The ARN from the key store with which to associate the instance for TDE encryption.
     */
    TdeCredentialArn?: String;
    /**
     * The password for the given ARN from the key store in order to access the device.
     */
    TdeCredentialPassword?: String;
    /**
     * Specifies whether the DB instance is encrypted. Not applicable. The encryption for DB instances is managed by the DB cluster. For more information, see CreateDBCluster. Default: false
     */
    StorageEncrypted?: BooleanOptional;
    /**
     * The AWS KMS key identifier for an encrypted DB instance. The KMS key identifier is the Amazon Resource Name (ARN) for the KMS encryption key. If you are creating a DB instance with the same AWS account that owns the KMS encryption key used to encrypt the new DB instance, then you can use the KMS key alias instead of the ARN for the KM encryption key. Not applicable. The KMS key identifier is managed by the DB cluster. For more information, see CreateDBCluster. If the StorageEncrypted parameter is true, and you do not specify a value for the KmsKeyId parameter, then Amazon Neptune will use your default encryption key. AWS KMS creates the default encryption key for your AWS account. Your AWS account has a different default encryption key for each AWS Region.
     */
    KmsKeyId?: String;
    /**
     * Specify the Active Directory Domain to create the instance in.
     */
    Domain?: String;
    /**
     * True to copy all tags from the DB instance to snapshots of the DB instance, and otherwise false. The default is false.
     */
    CopyTagsToSnapshot?: BooleanOptional;
    /**
     * The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0. The default is 0. If MonitoringRoleArn is specified, then you must also set MonitoringInterval to a value other than 0. Valid Values: 0, 1, 5, 10, 15, 30, 60 
     */
    MonitoringInterval?: IntegerOptional;
    /**
     * The ARN for the IAM role that permits Neptune to send enhanced monitoring metrics to Amazon CloudWatch Logs. For example, arn:aws:iam:123456789012:role/emaccess. If MonitoringInterval is set to a value other than 0, then you must supply a MonitoringRoleArn value.
     */
    MonitoringRoleArn?: String;
    /**
     * Specify the name of the IAM role to be used when making API calls to the Directory Service.
     */
    DomainIAMRoleName?: String;
    /**
     * A value that specifies the order in which an Read Replica is promoted to the primary instance after a failure of the existing primary instance.  Default: 1 Valid Values: 0 - 15
     */
    PromotionTier?: IntegerOptional;
    /**
     * The time zone of the DB instance. 
     */
    Timezone?: String;
    /**
     * True to enable AWS Identity and Access Management (IAM) authentication for Neptune. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
    /**
     * True to enable Performance Insights for the DB instance, and otherwise false. 
     */
    EnablePerformanceInsights?: BooleanOptional;
    /**
     * The AWS KMS key identifier for encryption of Performance Insights data. The KMS key ID is the Amazon Resource Name (ARN), KMS key identifier, or the KMS key alias for the KMS encryption key.
     */
    PerformanceInsightsKMSKeyId?: String;
    /**
     * The list of log types that need to be enabled for exporting to CloudWatch Logs.
     */
    EnableCloudwatchLogsExports?: LogTypeList;
  }
  export interface CreateDBInstanceResult {
    DBInstance?: DBInstance;
  }
  export interface CreateDBParameterGroupMessage {
    /**
     * The name of the DB parameter group. Constraints:   Must be 1 to 255 letters, numbers, or hyphens.   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens    This value is stored as a lowercase string. 
     */
    DBParameterGroupName: String;
    /**
     * The DB parameter group family name. A DB parameter group can be associated with one and only one DB parameter group family, and can be applied only to a DB instance running a database engine and engine version compatible with that DB parameter group family.
     */
    DBParameterGroupFamily: String;
    /**
     * The description for the DB parameter group.
     */
    Description: String;
    Tags?: TagList;
  }
  export interface CreateDBParameterGroupResult {
    DBParameterGroup?: DBParameterGroup;
  }
  export interface CreateDBSubnetGroupMessage {
    /**
     * The name for the DB subnet group. This value is stored as a lowercase string. Constraints: Must contain no more than 255 letters, numbers, periods, underscores, spaces, or hyphens. Must not be default. Example: mySubnetgroup 
     */
    DBSubnetGroupName: String;
    /**
     * The description for the DB subnet group.
     */
    DBSubnetGroupDescription: String;
    /**
     * The EC2 Subnet IDs for the DB subnet group.
     */
    SubnetIds: SubnetIdentifierList;
    Tags?: TagList;
  }
  export interface CreateDBSubnetGroupResult {
    DBSubnetGroup?: DBSubnetGroup;
  }
  export interface CreateEventSubscriptionMessage {
    /**
     * The name of the subscription. Constraints: The name must be less than 255 characters.
     */
    SubscriptionName: String;
    /**
     * The Amazon Resource Name (ARN) of the SNS topic created for event notification. The ARN is created by Amazon SNS when you create a topic and subscribe to it.
     */
    SnsTopicArn: String;
    /**
     * The type of source that is generating the events. For example, if you want to be notified of events generated by a DB instance, you would set this parameter to db-instance. if this value is not specified, all events are returned. Valid values: db-instance | db-cluster | db-parameter-group | db-security-group | db-snapshot | db-cluster-snapshot 
     */
    SourceType?: String;
    /**
     *  A list of event categories for a SourceType that you want to subscribe to. You can see a list of the categories for a given SourceType by using the DescribeEventCategories action. 
     */
    EventCategories?: EventCategoriesList;
    /**
     * The list of identifiers of the event sources for which events are returned. If not specified, then all sources are included in the response. An identifier must begin with a letter and must contain only ASCII letters, digits, and hyphens; it can't end with a hyphen or contain two consecutive hyphens. Constraints:   If SourceIds are supplied, SourceType must also be provided.   If the source type is a DB instance, then a DBInstanceIdentifier must be supplied.   If the source type is a DB security group, a DBSecurityGroupName must be supplied.   If the source type is a DB parameter group, a DBParameterGroupName must be supplied.   If the source type is a DB snapshot, a DBSnapshotIdentifier must be supplied.  
     */
    SourceIds?: SourceIdsList;
    /**
     *  A Boolean value; set to true to activate the subscription, set to false to create the subscription but not active it. 
     */
    Enabled?: BooleanOptional;
    Tags?: TagList;
  }
  export interface CreateEventSubscriptionResult {
    EventSubscription?: EventSubscription;
  }
  export interface DBCluster {
    /**
     *  AllocatedStorage always returns 1, because Neptune DB cluster storage size is not fixed, but instead automatically adjusts as needed.
     */
    AllocatedStorage?: IntegerOptional;
    /**
     * Provides the list of EC2 Availability Zones that instances in the DB cluster can be created in.
     */
    AvailabilityZones?: AvailabilityZones;
    /**
     * Specifies the number of days for which automatic DB snapshots are retained.
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     * If present, specifies the name of the character set that this cluster is associated with.
     */
    CharacterSetName?: String;
    /**
     * Contains the name of the initial database of this DB cluster that was provided at create time, if one was specified when the DB cluster was created. This same name is returned for the life of the DB cluster.
     */
    DatabaseName?: String;
    /**
     * Contains a user-supplied DB cluster identifier. This identifier is the unique key that identifies a DB cluster.
     */
    DBClusterIdentifier?: String;
    /**
     * Specifies the name of the DB cluster parameter group for the DB cluster.
     */
    DBClusterParameterGroup?: String;
    /**
     * Specifies information on the subnet group associated with the DB cluster, including the name, description, and subnets in the subnet group.
     */
    DBSubnetGroup?: String;
    /**
     * Specifies the current state of this DB cluster.
     */
    Status?: String;
    /**
     * Specifies the progress of the operation as a percentage.
     */
    PercentProgress?: String;
    /**
     * Specifies the earliest time to which a database can be restored with point-in-time restore.
     */
    EarliestRestorableTime?: TStamp;
    /**
     * Specifies the connection endpoint for the primary instance of the DB cluster.
     */
    Endpoint?: String;
    /**
     * The reader endpoint for the DB cluster. The reader endpoint for a DB cluster load-balances connections across the Read Replicas that are available in a DB cluster. As clients request new connections to the reader endpoint, Neptune distributes the connection requests among the Read Replicas in the DB cluster. This functionality can help balance your read workload across multiple Read Replicas in your DB cluster.  If a failover occurs, and the Read Replica that you are connected to is promoted to be the primary instance, your connection is dropped. To continue sending your read workload to other Read Replicas in the cluster, you can then reconnect to the reader endpoint.
     */
    ReaderEndpoint?: String;
    /**
     * Specifies whether the DB cluster has instances in multiple Availability Zones.
     */
    MultiAZ?: Boolean;
    /**
     * Provides the name of the database engine to be used for this DB cluster.
     */
    Engine?: String;
    /**
     * Indicates the database engine version.
     */
    EngineVersion?: String;
    /**
     * Specifies the latest time to which a database can be restored with point-in-time restore.
     */
    LatestRestorableTime?: TStamp;
    /**
     * Specifies the port that the database engine is listening on.
     */
    Port?: IntegerOptional;
    /**
     * Contains the master username for the DB cluster.
     */
    MasterUsername?: String;
    /**
     * Provides the list of option group memberships for this DB cluster.
     */
    DBClusterOptionGroupMemberships?: DBClusterOptionGroupMemberships;
    /**
     * Specifies the daily time range during which automated backups are created if automated backups are enabled, as determined by the BackupRetentionPeriod. 
     */
    PreferredBackupWindow?: String;
    /**
     * Specifies the weekly time range during which system maintenance can occur, in Universal Coordinated Time (UTC).
     */
    PreferredMaintenanceWindow?: String;
    /**
     * Contains the identifier of the source DB cluster if this DB cluster is a Read Replica.
     */
    ReplicationSourceIdentifier?: String;
    /**
     * Contains one or more identifiers of the Read Replicas associated with this DB cluster.
     */
    ReadReplicaIdentifiers?: ReadReplicaIdentifierList;
    /**
     * Provides the list of instances that make up the DB cluster.
     */
    DBClusterMembers?: DBClusterMemberList;
    /**
     * Provides a list of VPC security groups that the DB cluster belongs to.
     */
    VpcSecurityGroups?: VpcSecurityGroupMembershipList;
    /**
     * Specifies the ID that Amazon Route 53 assigns when you create a hosted zone.
     */
    HostedZoneId?: String;
    /**
     * Specifies whether the DB cluster is encrypted.
     */
    StorageEncrypted?: Boolean;
    /**
     * If StorageEncrypted is true, the AWS KMS key identifier for the encrypted DB cluster.
     */
    KmsKeyId?: String;
    /**
     * The AWS Region-unique, immutable identifier for the DB cluster. This identifier is found in AWS CloudTrail log entries whenever the AWS KMS key for the DB cluster is accessed.
     */
    DbClusterResourceId?: String;
    /**
     * The Amazon Resource Name (ARN) for the DB cluster.
     */
    DBClusterArn?: String;
    /**
     * Provides a list of the AWS Identity and Access Management (IAM) roles that are associated with the DB cluster. IAM roles that are associated with a DB cluster grant permission for the DB cluster to access other AWS services on your behalf.
     */
    AssociatedRoles?: DBClusterRoles;
    /**
     * True if mapping of AWS Identity and Access Management (IAM) accounts to database accounts is enabled, and otherwise false.
     */
    IAMDatabaseAuthenticationEnabled?: Boolean;
    /**
     * Identifies the clone group to which the DB cluster is associated.
     */
    CloneGroupId?: String;
    /**
     * Specifies the time when the DB cluster was created, in Universal Coordinated Time (UTC).
     */
    ClusterCreateTime?: TStamp;
  }
  export type DBClusterList = DBCluster[];
  export interface DBClusterMember {
    /**
     * Specifies the instance identifier for this member of the DB cluster.
     */
    DBInstanceIdentifier?: String;
    /**
     * Value that is true if the cluster member is the primary instance for the DB cluster and false otherwise.
     */
    IsClusterWriter?: Boolean;
    /**
     * Specifies the status of the DB cluster parameter group for this member of the DB cluster.
     */
    DBClusterParameterGroupStatus?: String;
    /**
     * A value that specifies the order in which a Read Replica is promoted to the primary instance after a failure of the existing primary instance. 
     */
    PromotionTier?: IntegerOptional;
  }
  export type DBClusterMemberList = DBClusterMember[];
  export interface DBClusterMessage {
    /**
     * A pagination token that can be used in a subsequent DescribeDBClusters request.
     */
    Marker?: String;
    /**
     * Contains a list of DB clusters for the user.
     */
    DBClusters?: DBClusterList;
  }
  export type DBClusterOptionGroupMemberships = DBClusterOptionGroupStatus[];
  export interface DBClusterOptionGroupStatus {
    /**
     * Specifies the name of the DB cluster option group.
     */
    DBClusterOptionGroupName?: String;
    /**
     * Specifies the status of the DB cluster option group.
     */
    Status?: String;
  }
  export interface DBClusterParameterGroup {
    /**
     * Provides the name of the DB cluster parameter group.
     */
    DBClusterParameterGroupName?: String;
    /**
     * Provides the name of the DB parameter group family that this DB cluster parameter group is compatible with.
     */
    DBParameterGroupFamily?: String;
    /**
     * Provides the customer-specified description for this DB cluster parameter group.
     */
    Description?: String;
    /**
     * The Amazon Resource Name (ARN) for the DB cluster parameter group.
     */
    DBClusterParameterGroupArn?: String;
  }
  export interface DBClusterParameterGroupDetails {
    /**
     * Provides a list of parameters for the DB cluster parameter group.
     */
    Parameters?: ParametersList;
    /**
     *  An optional pagination token provided by a previous DescribeDBClusterParameters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
  }
  export type DBClusterParameterGroupList = DBClusterParameterGroup[];
  export interface DBClusterParameterGroupNameMessage {
    /**
     * The name of the DB cluster parameter group. Constraints:   Must be 1 to 255 letters or numbers.   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens    This value is stored as a lowercase string. 
     */
    DBClusterParameterGroupName?: String;
  }
  export interface DBClusterParameterGroupsMessage {
    /**
     *  An optional pagination token provided by a previous DescribeDBClusterParameterGroups request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     * A list of DB cluster parameter groups.
     */
    DBClusterParameterGroups?: DBClusterParameterGroupList;
  }
  export interface DBClusterRole {
    /**
     * The Amazon Resource Name (ARN) of the IAM role that is associated with the DB cluster.
     */
    RoleArn?: String;
    /**
     * Describes the state of association between the IAM role and the DB cluster. The Status property returns one of the following values:    ACTIVE - the IAM role ARN is associated with the DB cluster and can be used to access other AWS services on your behalf.    PENDING - the IAM role ARN is being associated with the DB cluster.    INVALID - the IAM role ARN is associated with the DB cluster, but the DB cluster is unable to assume the IAM role in order to access other AWS services on your behalf.  
     */
    Status?: String;
  }
  export type DBClusterRoles = DBClusterRole[];
  export interface DBClusterSnapshot {
    /**
     * Provides the list of EC2 Availability Zones that instances in the DB cluster snapshot can be restored in.
     */
    AvailabilityZones?: AvailabilityZones;
    /**
     * Specifies the identifier for the DB cluster snapshot.
     */
    DBClusterSnapshotIdentifier?: String;
    /**
     * Specifies the DB cluster identifier of the DB cluster that this DB cluster snapshot was created from.
     */
    DBClusterIdentifier?: String;
    /**
     * Provides the time when the snapshot was taken, in Universal Coordinated Time (UTC).
     */
    SnapshotCreateTime?: TStamp;
    /**
     * Specifies the name of the database engine.
     */
    Engine?: String;
    /**
     * Specifies the allocated storage size in gibibytes (GiB).
     */
    AllocatedStorage?: Integer;
    /**
     * Specifies the status of this DB cluster snapshot.
     */
    Status?: String;
    /**
     * Specifies the port that the DB cluster was listening on at the time of the snapshot.
     */
    Port?: Integer;
    /**
     * Provides the VPC ID associated with the DB cluster snapshot.
     */
    VpcId?: String;
    /**
     * Specifies the time when the DB cluster was created, in Universal Coordinated Time (UTC).
     */
    ClusterCreateTime?: TStamp;
    /**
     * Provides the master username for the DB cluster snapshot.
     */
    MasterUsername?: String;
    /**
     * Provides the version of the database engine for this DB cluster snapshot.
     */
    EngineVersion?: String;
    /**
     * Provides the license model information for this DB cluster snapshot.
     */
    LicenseModel?: String;
    /**
     * Provides the type of the DB cluster snapshot.
     */
    SnapshotType?: String;
    /**
     * Specifies the percentage of the estimated data that has been transferred.
     */
    PercentProgress?: Integer;
    /**
     * Specifies whether the DB cluster snapshot is encrypted.
     */
    StorageEncrypted?: Boolean;
    /**
     * If StorageEncrypted is true, the AWS KMS key identifier for the encrypted DB cluster snapshot.
     */
    KmsKeyId?: String;
    /**
     * The Amazon Resource Name (ARN) for the DB cluster snapshot.
     */
    DBClusterSnapshotArn?: String;
    /**
     * If the DB cluster snapshot was copied from a source DB cluster snapshot, the Amazon Resource Name (ARN) for the source DB cluster snapshot, otherwise, a null value.
     */
    SourceDBClusterSnapshotArn?: String;
    /**
     * True if mapping of AWS Identity and Access Management (IAM) accounts to database accounts is enabled, and otherwise false.
     */
    IAMDatabaseAuthenticationEnabled?: Boolean;
  }
  export interface DBClusterSnapshotAttribute {
    /**
     * The name of the manual DB cluster snapshot attribute. The attribute named restore refers to the list of AWS accounts that have permission to copy or restore the manual DB cluster snapshot. For more information, see the ModifyDBClusterSnapshotAttribute API action.
     */
    AttributeName?: String;
    /**
     * The value(s) for the manual DB cluster snapshot attribute. If the AttributeName field is set to restore, then this element returns a list of IDs of the AWS accounts that are authorized to copy or restore the manual DB cluster snapshot. If a value of all is in the list, then the manual DB cluster snapshot is public and available for any AWS account to copy or restore.
     */
    AttributeValues?: AttributeValueList;
  }
  export type DBClusterSnapshotAttributeList = DBClusterSnapshotAttribute[];
  export interface DBClusterSnapshotAttributesResult {
    /**
     * The identifier of the manual DB cluster snapshot that the attributes apply to.
     */
    DBClusterSnapshotIdentifier?: String;
    /**
     * The list of attributes and values for the manual DB cluster snapshot.
     */
    DBClusterSnapshotAttributes?: DBClusterSnapshotAttributeList;
  }
  export type DBClusterSnapshotList = DBClusterSnapshot[];
  export interface DBClusterSnapshotMessage {
    /**
     *  An optional pagination token provided by a previous DescribeDBClusterSnapshots request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     * Provides a list of DB cluster snapshots for the user.
     */
    DBClusterSnapshots?: DBClusterSnapshotList;
  }
  export interface DBEngineVersion {
    /**
     * The name of the database engine.
     */
    Engine?: String;
    /**
     * The version number of the database engine.
     */
    EngineVersion?: String;
    /**
     * The name of the DB parameter group family for the database engine.
     */
    DBParameterGroupFamily?: String;
    /**
     * The description of the database engine.
     */
    DBEngineDescription?: String;
    /**
     * The description of the database engine version.
     */
    DBEngineVersionDescription?: String;
    /**
     *  The default character set for new instances of this engine version, if the CharacterSetName parameter of the CreateDBInstance API is not specified. 
     */
    DefaultCharacterSet?: CharacterSet;
    /**
     *  A list of the character sets supported by this engine for the CharacterSetName parameter of the CreateDBInstance action. 
     */
    SupportedCharacterSets?: SupportedCharacterSetsList;
    /**
     * A list of engine versions that this database engine version can be upgraded to.
     */
    ValidUpgradeTarget?: ValidUpgradeTargetList;
    /**
     * A list of the time zones supported by this engine for the Timezone parameter of the CreateDBInstance action. 
     */
    SupportedTimezones?: SupportedTimezonesList;
    /**
     * The types of logs that the database engine has available for export to CloudWatch Logs.
     */
    ExportableLogTypes?: LogTypeList;
    /**
     * A value that indicates whether the engine version supports exporting the log types specified by ExportableLogTypes to CloudWatch Logs.
     */
    SupportsLogExportsToCloudwatchLogs?: Boolean;
    /**
     * Indicates whether the database engine version supports read replicas.
     */
    SupportsReadReplica?: Boolean;
  }
  export type DBEngineVersionList = DBEngineVersion[];
  export interface DBEngineVersionMessage {
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     *  A list of DBEngineVersion elements. 
     */
    DBEngineVersions?: DBEngineVersionList;
  }
  export interface DBInstance {
    /**
     * Contains a user-supplied database identifier. This identifier is the unique key that identifies a DB instance.
     */
    DBInstanceIdentifier?: String;
    /**
     * Contains the name of the compute and memory capacity class of the DB instance.
     */
    DBInstanceClass?: String;
    /**
     * Provides the name of the database engine to be used for this DB instance.
     */
    Engine?: String;
    /**
     * Specifies the current state of this database.
     */
    DBInstanceStatus?: String;
    /**
     * Contains the master username for the DB instance.
     */
    MasterUsername?: String;
    /**
     * The database name.
     */
    DBName?: String;
    /**
     * Specifies the connection endpoint.
     */
    Endpoint?: Endpoint;
    /**
     * Specifies the allocated storage size specified in gibibytes.
     */
    AllocatedStorage?: Integer;
    /**
     * Provides the date and time the DB instance was created.
     */
    InstanceCreateTime?: TStamp;
    /**
     *  Specifies the daily time range during which automated backups are created if automated backups are enabled, as determined by the BackupRetentionPeriod. 
     */
    PreferredBackupWindow?: String;
    /**
     * Specifies the number of days for which automatic DB snapshots are retained.
     */
    BackupRetentionPeriod?: Integer;
    /**
     *  Provides List of DB security group elements containing only DBSecurityGroup.Name and DBSecurityGroup.Status subelements. 
     */
    DBSecurityGroups?: DBSecurityGroupMembershipList;
    /**
     * Provides a list of VPC security group elements that the DB instance belongs to.
     */
    VpcSecurityGroups?: VpcSecurityGroupMembershipList;
    /**
     * Provides the list of DB parameter groups applied to this DB instance.
     */
    DBParameterGroups?: DBParameterGroupStatusList;
    /**
     * Specifies the name of the Availability Zone the DB instance is located in.
     */
    AvailabilityZone?: String;
    /**
     * Specifies information on the subnet group associated with the DB instance, including the name, description, and subnets in the subnet group.
     */
    DBSubnetGroup?: DBSubnetGroup;
    /**
     * Specifies the weekly time range during which system maintenance can occur, in Universal Coordinated Time (UTC).
     */
    PreferredMaintenanceWindow?: String;
    /**
     * Specifies that changes to the DB instance are pending. This element is only included when changes are pending. Specific changes are identified by subelements.
     */
    PendingModifiedValues?: PendingModifiedValues;
    /**
     * Specifies the latest time to which a database can be restored with point-in-time restore.
     */
    LatestRestorableTime?: TStamp;
    /**
     * Specifies if the DB instance is a Multi-AZ deployment.
     */
    MultiAZ?: Boolean;
    /**
     * Indicates the database engine version.
     */
    EngineVersion?: String;
    /**
     * Indicates that minor version patches are applied automatically.
     */
    AutoMinorVersionUpgrade?: Boolean;
    /**
     * Contains the identifier of the source DB instance if this DB instance is a Read Replica.
     */
    ReadReplicaSourceDBInstanceIdentifier?: String;
    /**
     * Contains one or more identifiers of the Read Replicas associated with this DB instance.
     */
    ReadReplicaDBInstanceIdentifiers?: ReadReplicaDBInstanceIdentifierList;
    /**
     * Contains one or more identifiers of DB clusters that are Read Replicas of this DB instance.
     */
    ReadReplicaDBClusterIdentifiers?: ReadReplicaDBClusterIdentifierList;
    /**
     * License model information for this DB instance.
     */
    LicenseModel?: String;
    /**
     * Specifies the Provisioned IOPS (I/O operations per second) value.
     */
    Iops?: IntegerOptional;
    /**
     * Provides the list of option group memberships for this DB instance.
     */
    OptionGroupMemberships?: OptionGroupMembershipList;
    /**
     * If present, specifies the name of the character set that this instance is associated with.
     */
    CharacterSetName?: String;
    /**
     * If present, specifies the name of the secondary Availability Zone for a DB instance with multi-AZ support.
     */
    SecondaryAvailabilityZone?: String;
    /**
     * This parameter is not supported.
     */
    PubliclyAccessible?: Boolean;
    /**
     * The status of a Read Replica. If the instance is not a Read Replica, this is blank.
     */
    StatusInfos?: DBInstanceStatusInfoList;
    /**
     * Specifies the storage type associated with DB instance.
     */
    StorageType?: String;
    /**
     * The ARN from the key store with which the instance is associated for TDE encryption.
     */
    TdeCredentialArn?: String;
    /**
     * Specifies the port that the DB instance listens on. If the DB instance is part of a DB cluster, this can be a different port than the DB cluster port.
     */
    DbInstancePort?: Integer;
    /**
     * If the DB instance is a member of a DB cluster, contains the name of the DB cluster that the DB instance is a member of.
     */
    DBClusterIdentifier?: String;
    /**
     * Specifies whether the DB instance is encrypted.
     */
    StorageEncrypted?: Boolean;
    /**
     *  If StorageEncrypted is true, the AWS KMS key identifier for the encrypted DB instance. 
     */
    KmsKeyId?: String;
    /**
     * The AWS Region-unique, immutable identifier for the DB instance. This identifier is found in AWS CloudTrail log entries whenever the AWS KMS key for the DB instance is accessed.
     */
    DbiResourceId?: String;
    /**
     * The identifier of the CA certificate for this DB instance.
     */
    CACertificateIdentifier?: String;
    /**
     * Not supported
     */
    DomainMemberships?: DomainMembershipList;
    /**
     * Specifies whether tags are copied from the DB instance to snapshots of the DB instance.
     */
    CopyTagsToSnapshot?: Boolean;
    /**
     * The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance.
     */
    MonitoringInterval?: IntegerOptional;
    /**
     * The Amazon Resource Name (ARN) of the Amazon CloudWatch Logs log stream that receives the Enhanced Monitoring metrics data for the DB instance.
     */
    EnhancedMonitoringResourceArn?: String;
    /**
     * The ARN for the IAM role that permits Neptune to send Enhanced Monitoring metrics to Amazon CloudWatch Logs.
     */
    MonitoringRoleArn?: String;
    /**
     * A value that specifies the order in which a Read Replica is promoted to the primary instance after a failure of the existing primary instance. 
     */
    PromotionTier?: IntegerOptional;
    /**
     * The Amazon Resource Name (ARN) for the DB instance.
     */
    DBInstanceArn?: String;
    /**
     * Not supported. 
     */
    Timezone?: String;
    /**
     * True if AWS Identity and Access Management (IAM) authentication is enabled, and otherwise false.
     */
    IAMDatabaseAuthenticationEnabled?: Boolean;
    /**
     * True if Performance Insights is enabled for the DB instance, and otherwise false.
     */
    PerformanceInsightsEnabled?: BooleanOptional;
    /**
     * The AWS KMS key identifier for encryption of Performance Insights data. The KMS key ID is the Amazon Resource Name (ARN), KMS key identifier, or the KMS key alias for the KMS encryption key.
     */
    PerformanceInsightsKMSKeyId?: String;
    /**
     * A list of log types that this DB instance is configured to export to CloudWatch Logs.
     */
    EnabledCloudwatchLogsExports?: LogTypeList;
  }
  export type DBInstanceList = DBInstance[];
  export interface DBInstanceMessage {
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
    /**
     *  A list of DBInstance instances. 
     */
    DBInstances?: DBInstanceList;
  }
  export interface DBInstanceStatusInfo {
    /**
     * This value is currently "read replication."
     */
    StatusType?: String;
    /**
     * Boolean value that is true if the instance is operating normally, or false if the instance is in an error state.
     */
    Normal?: Boolean;
    /**
     * Status of the DB instance. For a StatusType of read replica, the values can be replicating, error, stopped, or terminated.
     */
    Status?: String;
    /**
     * Details of the error if there is an error for the instance. If the instance is not in an error state, this value is blank.
     */
    Message?: String;
  }
  export type DBInstanceStatusInfoList = DBInstanceStatusInfo[];
  export interface DBParameterGroup {
    /**
     * Provides the name of the DB parameter group.
     */
    DBParameterGroupName?: String;
    /**
     * Provides the name of the DB parameter group family that this DB parameter group is compatible with.
     */
    DBParameterGroupFamily?: String;
    /**
     * Provides the customer-specified description for this DB parameter group.
     */
    Description?: String;
    /**
     * The Amazon Resource Name (ARN) for the DB parameter group.
     */
    DBParameterGroupArn?: String;
  }
  export interface DBParameterGroupDetails {
    /**
     *  A list of Parameter values. 
     */
    Parameters?: ParametersList;
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export type DBParameterGroupList = DBParameterGroup[];
  export interface DBParameterGroupNameMessage {
    /**
     * Provides the name of the DB parameter group.
     */
    DBParameterGroupName?: String;
  }
  export interface DBParameterGroupStatus {
    /**
     * The name of the DP parameter group.
     */
    DBParameterGroupName?: String;
    /**
     * The status of parameter updates.
     */
    ParameterApplyStatus?: String;
  }
  export type DBParameterGroupStatusList = DBParameterGroupStatus[];
  export interface DBParameterGroupsMessage {
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     *  A list of DBParameterGroup instances. 
     */
    DBParameterGroups?: DBParameterGroupList;
  }
  export interface DBSecurityGroupMembership {
    /**
     * The name of the DB security group.
     */
    DBSecurityGroupName?: String;
    /**
     * The status of the DB security group.
     */
    Status?: String;
  }
  export type DBSecurityGroupMembershipList = DBSecurityGroupMembership[];
  export type DBSecurityGroupNameList = String[];
  export interface DBSubnetGroup {
    /**
     * The name of the DB subnet group.
     */
    DBSubnetGroupName?: String;
    /**
     * Provides the description of the DB subnet group.
     */
    DBSubnetGroupDescription?: String;
    /**
     * Provides the VpcId of the DB subnet group.
     */
    VpcId?: String;
    /**
     * Provides the status of the DB subnet group.
     */
    SubnetGroupStatus?: String;
    /**
     *  Contains a list of Subnet elements. 
     */
    Subnets?: SubnetList;
    /**
     * The Amazon Resource Name (ARN) for the DB subnet group.
     */
    DBSubnetGroupArn?: String;
  }
  export interface DBSubnetGroupMessage {
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     *  A list of DBSubnetGroup instances. 
     */
    DBSubnetGroups?: DBSubnetGroups;
  }
  export type DBSubnetGroups = DBSubnetGroup[];
  export interface DeleteDBClusterMessage {
    /**
     * The DB cluster identifier for the DB cluster to be deleted. This parameter isn't case-sensitive. Constraints:   Must match an existing DBClusterIdentifier.  
     */
    DBClusterIdentifier: String;
    /**
     *  Determines whether a final DB cluster snapshot is created before the DB cluster is deleted. If true is specified, no DB cluster snapshot is created. If false is specified, a DB cluster snapshot is created before the DB cluster is deleted.   You must specify a FinalDBSnapshotIdentifier parameter if SkipFinalSnapshot is false.  Default: false 
     */
    SkipFinalSnapshot?: Boolean;
    /**
     *  The DB cluster snapshot identifier of the new DB cluster snapshot created when SkipFinalSnapshot is set to false.    Specifying this parameter and also setting the SkipFinalShapshot parameter to true results in an error.   Constraints:   Must be 1 to 255 letters, numbers, or hyphens.   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens  
     */
    FinalDBSnapshotIdentifier?: String;
  }
  export interface DeleteDBClusterParameterGroupMessage {
    /**
     * The name of the DB cluster parameter group. Constraints:   Must be the name of an existing DB cluster parameter group.   You can't delete a default DB cluster parameter group.   Cannot be associated with any DB clusters.  
     */
    DBClusterParameterGroupName: String;
  }
  export interface DeleteDBClusterResult {
    DBCluster?: DBCluster;
  }
  export interface DeleteDBClusterSnapshotMessage {
    /**
     * The identifier of the DB cluster snapshot to delete. Constraints: Must be the name of an existing DB cluster snapshot in the available state.
     */
    DBClusterSnapshotIdentifier: String;
  }
  export interface DeleteDBClusterSnapshotResult {
    DBClusterSnapshot?: DBClusterSnapshot;
  }
  export interface DeleteDBInstanceMessage {
    /**
     * The DB instance identifier for the DB instance to be deleted. This parameter isn't case-sensitive. Constraints:   Must match the name of an existing DB instance.  
     */
    DBInstanceIdentifier: String;
    /**
     *  Determines whether a final DB snapshot is created before the DB instance is deleted. If true is specified, no DBSnapshot is created. If false is specified, a DB snapshot is created before the DB instance is deleted.  Note that when a DB instance is in a failure state and has a status of 'failed', 'incompatible-restore', or 'incompatible-network', it can only be deleted when the SkipFinalSnapshot parameter is set to "true". Specify true when deleting a Read Replica.  The FinalDBSnapshotIdentifier parameter must be specified if SkipFinalSnapshot is false.  Default: false 
     */
    SkipFinalSnapshot?: Boolean;
    /**
     *  The DBSnapshotIdentifier of the new DBSnapshot created when SkipFinalSnapshot is set to false.   Specifying this parameter and also setting the SkipFinalShapshot parameter to true results in an error.  Constraints:   Must be 1 to 255 letters or numbers.   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens   Cannot be specified when deleting a Read Replica.  
     */
    FinalDBSnapshotIdentifier?: String;
  }
  export interface DeleteDBInstanceResult {
    DBInstance?: DBInstance;
  }
  export interface DeleteDBParameterGroupMessage {
    /**
     * The name of the DB parameter group. Constraints:   Must be the name of an existing DB parameter group   You can't delete a default DB parameter group   Cannot be associated with any DB instances  
     */
    DBParameterGroupName: String;
  }
  export interface DeleteDBSubnetGroupMessage {
    /**
     * The name of the database subnet group to delete.  You can't delete the default subnet group.  Constraints: Constraints: Must match the name of an existing DBSubnetGroup. Must not be default. Example: mySubnetgroup 
     */
    DBSubnetGroupName: String;
  }
  export interface DeleteEventSubscriptionMessage {
    /**
     * The name of the event notification subscription you want to delete.
     */
    SubscriptionName: String;
  }
  export interface DeleteEventSubscriptionResult {
    EventSubscription?: EventSubscription;
  }
  export interface DescribeDBClusterParameterGroupsMessage {
    /**
     * The name of a specific DB cluster parameter group to return details for. Constraints:   If supplied, must match the name of an existing DBClusterParameterGroup.  
     */
    DBClusterParameterGroupName?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBClusterParameterGroups request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBClusterParametersMessage {
    /**
     * The name of a specific DB cluster parameter group to return parameter details for. Constraints:   If supplied, must match the name of an existing DBClusterParameterGroup.  
     */
    DBClusterParameterGroupName: String;
    /**
     *  A value that indicates to return only parameters for a specific source. Parameter sources can be engine, service, or customer. 
     */
    Source?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBClusterParameters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBClusterSnapshotAttributesMessage {
    /**
     * The identifier for the DB cluster snapshot to describe the attributes for.
     */
    DBClusterSnapshotIdentifier: String;
  }
  export interface DescribeDBClusterSnapshotAttributesResult {
    DBClusterSnapshotAttributesResult?: DBClusterSnapshotAttributesResult;
  }
  export interface DescribeDBClusterSnapshotsMessage {
    /**
     * The ID of the DB cluster to retrieve the list of DB cluster snapshots for. This parameter can't be used in conjunction with the DBClusterSnapshotIdentifier parameter. This parameter is not case-sensitive.  Constraints:   If supplied, must match the identifier of an existing DBCluster.  
     */
    DBClusterIdentifier?: String;
    /**
     * A specific DB cluster snapshot identifier to describe. This parameter can't be used in conjunction with the DBClusterIdentifier parameter. This value is stored as a lowercase string.  Constraints:   If supplied, must match the identifier of an existing DBClusterSnapshot.   If this identifier is for an automated snapshot, the SnapshotType parameter must also be specified.  
     */
    DBClusterSnapshotIdentifier?: String;
    /**
     * The type of DB cluster snapshots to be returned. You can specify one of the following values:    automated - Return all DB cluster snapshots that have been automatically taken by Amazon Neptune for my AWS account.    manual - Return all DB cluster snapshots that have been taken by my AWS account.    shared - Return all manual DB cluster snapshots that have been shared to my AWS account.    public - Return all DB cluster snapshots that have been marked as public.   If you don't specify a SnapshotType value, then both automated and manual DB cluster snapshots are returned. You can include shared DB cluster snapshots with these results by setting the IncludeShared parameter to true. You can include public DB cluster snapshots with these results by setting the IncludePublic parameter to true. The IncludeShared and IncludePublic parameters don't apply for SnapshotType values of manual or automated. The IncludePublic parameter doesn't apply when SnapshotType is set to shared. The IncludeShared parameter doesn't apply when SnapshotType is set to public.
     */
    SnapshotType?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     * The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     * An optional pagination token provided by a previous DescribeDBClusterSnapshots request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     * True to include shared manual DB cluster snapshots from other AWS accounts that this AWS account has been given permission to copy or restore, and otherwise false. The default is false. You can give an AWS account permission to restore a manual DB cluster snapshot from another AWS account by the ModifyDBClusterSnapshotAttribute API action.
     */
    IncludeShared?: Boolean;
    /**
     * True to include manual DB cluster snapshots that are public and can be copied or restored by any AWS account, and otherwise false. The default is false. The default is false. You can share a manual DB cluster snapshot as public by using the ModifyDBClusterSnapshotAttribute API action.
     */
    IncludePublic?: Boolean;
  }
  export interface DescribeDBClustersMessage {
    /**
     * The user-supplied DB cluster identifier. If this parameter is specified, information from only the specific DB cluster is returned. This parameter isn't case-sensitive. Constraints:   If supplied, must match an existing DBClusterIdentifier.  
     */
    DBClusterIdentifier?: String;
    /**
     * A filter that specifies one or more DB clusters to describe. Supported filters:    db-cluster-id - Accepts DB cluster identifiers and DB cluster Amazon Resource Names (ARNs). The results list will only include information about the DB clusters identified by these ARNs.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     * An optional pagination token provided by a previous DescribeDBClusters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBEngineVersionsMessage {
    /**
     * The database engine to return.
     */
    Engine?: String;
    /**
     * The database engine version to return. Example: 5.1.49 
     */
    EngineVersion?: String;
    /**
     * The name of a specific DB parameter group family to return details for. Constraints:   If supplied, must match an existing DBParameterGroupFamily.  
     */
    DBParameterGroupFamily?: String;
    /**
     * Not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more than the MaxRecords value is available, a pagination token called a marker is included in the response so that the following results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     * Indicates that only the default version of the specified engine or engine and major version combination is returned.
     */
    DefaultOnly?: Boolean;
    /**
     * If this parameter is specified and the requested engine supports the CharacterSetName parameter for CreateDBInstance, the response includes a list of supported character sets for each engine version. 
     */
    ListSupportedCharacterSets?: BooleanOptional;
    /**
     * If this parameter is specified and the requested engine supports the TimeZone parameter for CreateDBInstance, the response includes a list of supported time zones for each engine version. 
     */
    ListSupportedTimezones?: BooleanOptional;
  }
  export interface DescribeDBInstancesMessage {
    /**
     * The user-supplied instance identifier. If this parameter is specified, information from only the specific DB instance is returned. This parameter isn't case-sensitive. Constraints:   If supplied, must match the identifier of an existing DBInstance.  
     */
    DBInstanceIdentifier?: String;
    /**
     * A filter that specifies one or more DB instances to describe. Supported filters:    db-cluster-id - Accepts DB cluster identifiers and DB cluster Amazon Resource Names (ARNs). The results list will only include information about the DB instances associated with the DB clusters identified by these ARNs.    db-instance-id - Accepts DB instance identifiers and DB instance Amazon Resource Names (ARNs). The results list will only include information about the DB instances identified by these ARNs.  
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBInstances request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBParameterGroupsMessage {
    /**
     * The name of a specific DB parameter group to return details for. Constraints:   If supplied, must match the name of an existing DBClusterParameterGroup.  
     */
    DBParameterGroupName?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBParameterGroups request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBParametersMessage {
    /**
     * The name of a specific DB parameter group to return details for. Constraints:   If supplied, must match the name of an existing DBParameterGroup.  
     */
    DBParameterGroupName: String;
    /**
     * The parameter types to return. Default: All parameter types returned Valid Values: user | system | engine-default 
     */
    Source?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBParameters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeDBSubnetGroupsMessage {
    /**
     * The name of the DB subnet group to return details for.
     */
    DBSubnetGroupName?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeDBSubnetGroups request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeEngineDefaultClusterParametersMessage {
    /**
     * The name of the DB cluster parameter group family to return engine parameter information for.
     */
    DBParameterGroupFamily: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeEngineDefaultClusterParameters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeEngineDefaultClusterParametersResult {
    EngineDefaults?: EngineDefaults;
  }
  export interface DescribeEngineDefaultParametersMessage {
    /**
     * The name of the DB parameter group family.
     */
    DBParameterGroupFamily: String;
    /**
     * Not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeEngineDefaultParameters request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeEngineDefaultParametersResult {
    EngineDefaults?: EngineDefaults;
  }
  export interface DescribeEventCategoriesMessage {
    /**
     * The type of source that is generating the events. Valid values: db-instance | db-parameter-group | db-security-group | db-snapshot
     */
    SourceType?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
  }
  export interface DescribeEventSubscriptionsMessage {
    /**
     * The name of the event notification subscription you want to describe.
     */
    SubscriptionName?: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeOrderableDBInstanceOptions request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
  }
  export interface DescribeEventsMessage {
    /**
     * The identifier of the event source for which events are returned. If not specified, then all sources are included in the response. Constraints:   If SourceIdentifier is supplied, SourceType must also be provided.   If the source type is DBInstance, then a DBInstanceIdentifier must be supplied.   If the source type is DBSecurityGroup, a DBSecurityGroupName must be supplied.   If the source type is DBParameterGroup, a DBParameterGroupName must be supplied.   If the source type is DBSnapshot, a DBSnapshotIdentifier must be supplied.   Cannot end with a hyphen or contain two consecutive hyphens.  
     */
    SourceIdentifier?: String;
    /**
     * The event source to retrieve events for. If no value is specified, all events are returned.
     */
    SourceType?: SourceType;
    /**
     *  The beginning of the time interval to retrieve events for, specified in ISO 8601 format. For more information about ISO 8601, go to the ISO8601 Wikipedia page.  Example: 2009-07-08T18:00Z
     */
    StartTime?: TStamp;
    /**
     *  The end of the time interval for which to retrieve events, specified in ISO 8601 format. For more information about ISO 8601, go to the ISO8601 Wikipedia page.  Example: 2009-07-08T18:00Z
     */
    EndTime?: TStamp;
    /**
     * The number of minutes to retrieve events for. Default: 60
     */
    Duration?: IntegerOptional;
    /**
     * A list of event categories that trigger notifications for a event notification subscription.
     */
    EventCategories?: EventCategoriesList;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeEvents request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface DescribeOrderableDBInstanceOptionsMessage {
    /**
     * The name of the engine to retrieve DB instance options for.
     */
    Engine: String;
    /**
     * The engine version filter value. Specify this parameter to show only the available offerings matching the specified engine version.
     */
    EngineVersion?: String;
    /**
     * The DB instance class filter value. Specify this parameter to show only the available offerings matching the specified DB instance class.
     */
    DBInstanceClass?: String;
    /**
     * The license model filter value. Specify this parameter to show only the available offerings matching the specified license model.
     */
    LicenseModel?: String;
    /**
     * The VPC filter value. Specify this parameter to show only the available VPC or non-VPC offerings.
     */
    Vpc?: BooleanOptional;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
    /**
     *  An optional pagination token provided by a previous DescribeOrderableDBInstanceOptions request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
  }
  export interface DescribePendingMaintenanceActionsMessage {
    /**
     * The ARN of a resource to return pending maintenance actions for.
     */
    ResourceIdentifier?: String;
    /**
     * A filter that specifies one or more resources to return pending maintenance actions for. Supported filters:    db-cluster-id - Accepts DB cluster identifiers and DB cluster Amazon Resource Names (ARNs). The results list will only include pending maintenance actions for the DB clusters identified by these ARNs.    db-instance-id - Accepts DB instance identifiers and DB instance ARNs. The results list will only include pending maintenance actions for the DB instances identified by these ARNs.  
     */
    Filters?: FilterList;
    /**
     *  An optional pagination token provided by a previous DescribePendingMaintenanceActions request. If this parameter is specified, the response includes only records beyond the marker, up to a number of records specified by MaxRecords. 
     */
    Marker?: String;
    /**
     *  The maximum number of records to include in the response. If more records exist than the specified MaxRecords value, a pagination token called a marker is included in the response so that the remaining results can be retrieved.  Default: 100 Constraints: Minimum 20, maximum 100.
     */
    MaxRecords?: IntegerOptional;
  }
  export interface DescribeValidDBInstanceModificationsMessage {
    /**
     * The customer identifier or the ARN of your DB instance. 
     */
    DBInstanceIdentifier: String;
  }
  export interface DescribeValidDBInstanceModificationsResult {
    ValidDBInstanceModificationsMessage?: ValidDBInstanceModificationsMessage;
  }
  export interface DomainMembership {
    /**
     * The identifier of the Active Directory Domain.
     */
    Domain?: String;
    /**
     * The status of the DB instance's Active Directory Domain membership, such as joined, pending-join, failed etc).
     */
    Status?: String;
    /**
     * The fully qualified domain name of the Active Directory Domain.
     */
    FQDN?: String;
    /**
     * The name of the IAM role to be used when making API calls to the Directory Service.
     */
    IAMRoleName?: String;
  }
  export type DomainMembershipList = DomainMembership[];
  export type Double = number;
  export type DoubleOptional = number;
  export interface DoubleRange {
    /**
     * The minimum value in the range.
     */
    From?: Double;
    /**
     * The maximum value in the range.
     */
    To?: Double;
  }
  export type DoubleRangeList = DoubleRange[];
  export interface Endpoint {
    /**
     * Specifies the DNS address of the DB instance.
     */
    Address?: String;
    /**
     * Specifies the port that the database engine is listening on.
     */
    Port?: Integer;
    /**
     * Specifies the ID that Amazon Route 53 assigns when you create a hosted zone.
     */
    HostedZoneId?: String;
  }
  export interface EngineDefaults {
    /**
     * Specifies the name of the DB parameter group family that the engine default parameters apply to.
     */
    DBParameterGroupFamily?: String;
    /**
     *  An optional pagination token provided by a previous EngineDefaults request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
    /**
     * Contains a list of engine default parameters.
     */
    Parameters?: ParametersList;
  }
  export interface Event {
    /**
     * Provides the identifier for the source of the event.
     */
    SourceIdentifier?: String;
    /**
     * Specifies the source type for this event.
     */
    SourceType?: SourceType;
    /**
     * Provides the text of this event.
     */
    Message?: String;
    /**
     * Specifies the category for the event.
     */
    EventCategories?: EventCategoriesList;
    /**
     * Specifies the date and time of the event.
     */
    Date?: TStamp;
    /**
     * The Amazon Resource Name (ARN) for the event.
     */
    SourceArn?: String;
  }
  export type EventCategoriesList = String[];
  export interface EventCategoriesMap {
    /**
     * The source type that the returned categories belong to
     */
    SourceType?: String;
    /**
     * The event categories for the specified source type
     */
    EventCategories?: EventCategoriesList;
  }
  export type EventCategoriesMapList = EventCategoriesMap[];
  export interface EventCategoriesMessage {
    /**
     * A list of EventCategoriesMap data types.
     */
    EventCategoriesMapList?: EventCategoriesMapList;
  }
  export type EventList = Event[];
  export interface EventSubscription {
    /**
     * The AWS customer account associated with the event notification subscription.
     */
    CustomerAwsId?: String;
    /**
     * The event notification subscription Id.
     */
    CustSubscriptionId?: String;
    /**
     * The topic ARN of the event notification subscription.
     */
    SnsTopicArn?: String;
    /**
     * The status of the event notification subscription. Constraints: Can be one of the following: creating | modifying | deleting | active | no-permission | topic-not-exist The status "no-permission" indicates that Neptune no longer has permission to post to the SNS topic. The status "topic-not-exist" indicates that the topic was deleted after the subscription was created.
     */
    Status?: String;
    /**
     * The time the event notification subscription was created.
     */
    SubscriptionCreationTime?: String;
    /**
     * The source type for the event notification subscription.
     */
    SourceType?: String;
    /**
     * A list of source IDs for the event notification subscription.
     */
    SourceIdsList?: SourceIdsList;
    /**
     * A list of event categories for the event notification subscription.
     */
    EventCategoriesList?: EventCategoriesList;
    /**
     * A Boolean value indicating if the subscription is enabled. True indicates the subscription is enabled.
     */
    Enabled?: Boolean;
    /**
     * The Amazon Resource Name (ARN) for the event subscription.
     */
    EventSubscriptionArn?: String;
  }
  export type EventSubscriptionsList = EventSubscription[];
  export interface EventSubscriptionsMessage {
    /**
     *  An optional pagination token provided by a previous DescribeOrderableDBInstanceOptions request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords. 
     */
    Marker?: String;
    /**
     * A list of EventSubscriptions data types.
     */
    EventSubscriptionsList?: EventSubscriptionsList;
  }
  export interface EventsMessage {
    /**
     *  An optional pagination token provided by a previous Events request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
    /**
     *  A list of Event instances. 
     */
    Events?: EventList;
  }
  export interface FailoverDBClusterMessage {
    /**
     * A DB cluster identifier to force a failover for. This parameter is not case-sensitive. Constraints:   Must match the identifier of an existing DBCluster.  
     */
    DBClusterIdentifier?: String;
    /**
     * The name of the instance to promote to the primary instance. You must specify the instance identifier for an Read Replica in the DB cluster. For example, mydbcluster-replica1.
     */
    TargetDBInstanceIdentifier?: String;
  }
  export interface FailoverDBClusterResult {
    DBCluster?: DBCluster;
  }
  export interface Filter {
    /**
     * This parameter is not currently supported.
     */
    Name: String;
    /**
     * This parameter is not currently supported.
     */
    Values: FilterValueList;
  }
  export type FilterList = Filter[];
  export type FilterValueList = String[];
  export type Integer = number;
  export type IntegerOptional = number;
  export type KeyList = String[];
  export interface ListTagsForResourceMessage {
    /**
     * The Amazon Neptune resource with tags to be listed. This value is an Amazon Resource Name (ARN). For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).
     */
    ResourceName: String;
    /**
     * This parameter is not currently supported.
     */
    Filters?: FilterList;
  }
  export type LogTypeList = String[];
  export interface ModifyDBClusterMessage {
    /**
     * The DB cluster identifier for the cluster being modified. This parameter is not case-sensitive. Constraints:   Must match the identifier of an existing DBCluster.  
     */
    DBClusterIdentifier: String;
    /**
     * The new DB cluster identifier for the DB cluster when renaming a DB cluster. This value is stored as a lowercase string. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens   The first character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens   Example: my-cluster2 
     */
    NewDBClusterIdentifier?: String;
    /**
     * A value that specifies whether the modifications in this request and any pending modifications are asynchronously applied as soon as possible, regardless of the PreferredMaintenanceWindow setting for the DB cluster. If this parameter is set to false, changes to the DB cluster are applied during the next maintenance window. The ApplyImmediately parameter only affects the NewDBClusterIdentifier and MasterUserPassword values. If you set the ApplyImmediately parameter value to false, then changes to the NewDBClusterIdentifier and MasterUserPassword values are applied during the next maintenance window. All other changes are applied immediately, regardless of the value of the ApplyImmediately parameter. Default: false 
     */
    ApplyImmediately?: Boolean;
    /**
     * The number of days for which automated backups are retained. You must specify a minimum value of 1. Default: 1 Constraints:   Must be a value from 1 to 35  
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     * The name of the DB cluster parameter group to use for the DB cluster.
     */
    DBClusterParameterGroupName?: String;
    /**
     * A list of VPC security groups that the DB cluster will belong to.
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    /**
     * The port number on which the DB cluster accepts connections. Constraints: Value must be 1150-65535  Default: The same port as the original DB cluster.
     */
    Port?: IntegerOptional;
    /**
     * The new password for the master database user. This password can contain any printable ASCII character except "/", """, or "@". Constraints: Must contain from 8 to 41 characters.
     */
    MasterUserPassword?: String;
    /**
     * A value that indicates that the DB cluster should be associated with the specified option group. Changing this parameter doesn't result in an outage except in the following case, and the change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true for this request. If the parameter change results in an option group that enables OEM, this change can cause a brief (sub-second) period during which new connections are rejected but existing connections are not interrupted.  Permanent options can't be removed from an option group. The option group can't be removed from a DB cluster once it is associated with a DB cluster.
     */
    OptionGroupName?: String;
    /**
     * The daily time range during which automated backups are created if automated backups are enabled, using the BackupRetentionPeriod parameter.  The default is a 30-minute window selected at random from an 8-hour block of time for each AWS Region.  Constraints:   Must be in the format hh24:mi-hh24:mi.   Must be in Universal Coordinated Time (UTC).   Must not conflict with the preferred maintenance window.   Must be at least 30 minutes.  
     */
    PreferredBackupWindow?: String;
    /**
     * The weekly time range during which system maintenance can occur, in Universal Coordinated Time (UTC). Format: ddd:hh24:mi-ddd:hh24:mi  The default is a 30-minute window selected at random from an 8-hour block of time for each AWS Region, occurring on a random day of the week.  Valid Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun. Constraints: Minimum 30-minute window.
     */
    PreferredMaintenanceWindow?: String;
    /**
     * True to enable mapping of AWS Identity and Access Management (IAM) accounts to database accounts, and otherwise false. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
    /**
     * The version number of the database engine to which you want to upgrade. Changing this parameter results in an outage. The change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true. For a list of valid engine versions, see CreateDBInstance, or call DescribeDBEngineVersions.
     */
    EngineVersion?: String;
  }
  export interface ModifyDBClusterParameterGroupMessage {
    /**
     * The name of the DB cluster parameter group to modify.
     */
    DBClusterParameterGroupName: String;
    /**
     * A list of parameters in the DB cluster parameter group to modify.
     */
    Parameters: ParametersList;
  }
  export interface ModifyDBClusterResult {
    DBCluster?: DBCluster;
  }
  export interface ModifyDBClusterSnapshotAttributeMessage {
    /**
     * The identifier for the DB cluster snapshot to modify the attributes for.
     */
    DBClusterSnapshotIdentifier: String;
    /**
     * The name of the DB cluster snapshot attribute to modify. To manage authorization for other AWS accounts to copy or restore a manual DB cluster snapshot, set this value to restore.
     */
    AttributeName: String;
    /**
     * A list of DB cluster snapshot attributes to add to the attribute specified by AttributeName. To authorize other AWS accounts to copy or restore a manual DB cluster snapshot, set this list to include one or more AWS account IDs, or all to make the manual DB cluster snapshot restorable by any AWS account. Do not add the all value for any manual DB cluster snapshots that contain private information that you don't want available to all AWS accounts.
     */
    ValuesToAdd?: AttributeValueList;
    /**
     * A list of DB cluster snapshot attributes to remove from the attribute specified by AttributeName. To remove authorization for other AWS accounts to copy or restore a manual DB cluster snapshot, set this list to include one or more AWS account identifiers, or all to remove authorization for any AWS account to copy or restore the DB cluster snapshot. If you specify all, an AWS account whose account ID is explicitly added to the restore attribute can still copy or restore a manual DB cluster snapshot.
     */
    ValuesToRemove?: AttributeValueList;
  }
  export interface ModifyDBClusterSnapshotAttributeResult {
    DBClusterSnapshotAttributesResult?: DBClusterSnapshotAttributesResult;
  }
  export interface ModifyDBInstanceMessage {
    /**
     * The DB instance identifier. This value is stored as a lowercase string. Constraints:   Must match the identifier of an existing DBInstance.  
     */
    DBInstanceIdentifier: String;
    /**
     * The new amount of storage (in gibibytes) to allocate for the DB instance.  Not applicable. Storage is managed by the DB Cluster.
     */
    AllocatedStorage?: IntegerOptional;
    /**
     * The new compute and memory capacity of the DB instance, for example, db.m4.large. Not all DB instance classes are available in all AWS Regions.  If you modify the DB instance class, an outage occurs during the change. The change is applied during the next maintenance window, unless ApplyImmediately is specified as true for this request.  Default: Uses existing setting
     */
    DBInstanceClass?: String;
    /**
     * The new DB subnet group for the DB instance. You can use this parameter to move your DB instance to a different VPC.  Changing the subnet group causes an outage during the change. The change is applied during the next maintenance window, unless you specify true for the ApplyImmediately parameter.  Constraints: If supplied, must match the name of an existing DBSubnetGroup. Example: mySubnetGroup 
     */
    DBSubnetGroupName?: String;
    /**
     * A list of DB security groups to authorize on this DB instance. Changing this setting doesn't result in an outage and the change is asynchronously applied as soon as possible. Constraints:   If supplied, must match existing DBSecurityGroups.  
     */
    DBSecurityGroups?: DBSecurityGroupNameList;
    /**
     * A list of EC2 VPC security groups to authorize on this DB instance. This change is asynchronously applied as soon as possible. Not applicable. The associated list of EC2 VPC security groups is managed by the DB cluster. For more information, see ModifyDBCluster. Constraints:   If supplied, must match existing VpcSecurityGroupIds.  
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    /**
     * Specifies whether the modifications in this request and any pending modifications are asynchronously applied as soon as possible, regardless of the PreferredMaintenanceWindow setting for the DB instance.   If this parameter is set to false, changes to the DB instance are applied during the next maintenance window. Some parameter changes can cause an outage and are applied on the next call to RebootDBInstance, or the next failure reboot.  Default: false 
     */
    ApplyImmediately?: Boolean;
    /**
     * The new password for the master user. The password can include any printable ASCII character except "/", """, or "@". Not applicable.  Default: Uses existing setting
     */
    MasterUserPassword?: String;
    /**
     * The name of the DB parameter group to apply to the DB instance. Changing this setting doesn't result in an outage. The parameter group name itself is changed immediately, but the actual parameter changes are not applied until you reboot the instance without failover. The db instance will NOT be rebooted automatically and the parameter changes will NOT be applied during the next maintenance window. Default: Uses existing setting Constraints: The DB parameter group must be in the same DB parameter group family as this DB instance.
     */
    DBParameterGroupName?: String;
    /**
     * The number of days to retain automated backups. Setting this parameter to a positive number enables backups. Setting this parameter to 0 disables automated backups. Not applicable. The retention period for automated backups is managed by the DB cluster. For more information, see ModifyDBCluster. Default: Uses existing setting
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     *  The daily time range during which automated backups are created if automated backups are enabled.  Not applicable. The daily time range for creating automated backups is managed by the DB cluster. For more information, see ModifyDBCluster. Constraints:   Must be in the format hh24:mi-hh24:mi   Must be in Universal Time Coordinated (UTC)   Must not conflict with the preferred maintenance window   Must be at least 30 minutes  
     */
    PreferredBackupWindow?: String;
    /**
     * The weekly time range (in UTC) during which system maintenance can occur, which might result in an outage. Changing this parameter doesn't result in an outage, except in the following situation, and the change is asynchronously applied as soon as possible. If there are pending actions that cause a reboot, and the maintenance window is changed to include the current time, then changing this parameter will cause a reboot of the DB instance. If moving this window to the current time, there must be at least 30 minutes between the current time and end of the window to ensure pending changes are applied. Default: Uses existing setting Format: ddd:hh24:mi-ddd:hh24:mi Valid Days: Mon | Tue | Wed | Thu | Fri | Sat | Sun Constraints: Must be at least 30 minutes
     */
    PreferredMaintenanceWindow?: String;
    /**
     * Specifies if the DB instance is a Multi-AZ deployment. Changing this parameter doesn't result in an outage and the change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true for this request. 
     */
    MultiAZ?: BooleanOptional;
    /**
     *  The version number of the database engine to upgrade to. Changing this parameter results in an outage and the change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true for this request.  For major version upgrades, if a nondefault DB parameter group is currently in use, a new DB parameter group in the DB parameter group family for the new engine version must be specified. The new DB parameter group can be the default for that DB parameter group family.
     */
    EngineVersion?: String;
    /**
     * Indicates that major version upgrades are allowed. Changing this parameter doesn't result in an outage and the change is asynchronously applied as soon as possible. Constraints: This parameter must be set to true when specifying a value for the EngineVersion parameter that is a different major version than the DB instance's current version.
     */
    AllowMajorVersionUpgrade?: Boolean;
    /**
     *  Indicates that minor version upgrades are applied automatically to the DB instance during the maintenance window. Changing this parameter doesn't result in an outage except in the following case and the change is asynchronously applied as soon as possible. An outage will result if this parameter is set to true during the maintenance window, and a newer minor version is available, and Neptune has enabled auto patching for that engine version. 
     */
    AutoMinorVersionUpgrade?: BooleanOptional;
    /**
     * The license model for the DB instance. Valid values: license-included | bring-your-own-license | general-public-license 
     */
    LicenseModel?: String;
    /**
     * The new Provisioned IOPS (I/O operations per second) value for the instance.  Changing this setting doesn't result in an outage and the change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true for this request. Default: Uses existing setting
     */
    Iops?: IntegerOptional;
    /**
     *  Indicates that the DB instance should be associated with the specified option group. Changing this parameter doesn't result in an outage except in the following case and the change is applied during the next maintenance window unless the ApplyImmediately parameter is set to true for this request. If the parameter change results in an option group that enables OEM, this change can cause a brief (sub-second) period during which new connections are rejected but existing connections are not interrupted.  Permanent options, such as the TDE option for Oracle Advanced Security TDE, can't be removed from an option group, and that option group can't be removed from a DB instance once it is associated with a DB instance
     */
    OptionGroupName?: String;
    /**
     *  The new DB instance identifier for the DB instance when renaming a DB instance. When you change the DB instance identifier, an instance reboot will occur immediately if you set Apply Immediately to true, or will occur during the next maintenance window if Apply Immediately to false. This value is stored as a lowercase string.  Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens.   The first character must be a letter.   Cannot end with a hyphen or contain two consecutive hyphens.   Example: mydbinstance 
     */
    NewDBInstanceIdentifier?: String;
    /**
     * Specifies the storage type to be associated with the DB instance.  If you specify Provisioned IOPS (io1), you must also include a value for the Iops parameter.  If you choose to migrate your DB instance from using standard storage to using Provisioned IOPS, or from using Provisioned IOPS to using standard storage, the process can take time. The duration of the migration depends on several factors such as database load, storage size, storage type (standard or Provisioned IOPS), amount of IOPS provisioned (if any), and the number of prior scale storage operations. Typical migration times are under 24 hours, but the process can take up to several days in some cases. During the migration, the DB instance is available for use, but might experience performance degradation. While the migration takes place, nightly backups for the instance are suspended. No other Amazon Neptune operations can take place for the instance, including modifying the instance, rebooting the instance, deleting the instance, creating a Read Replica for the instance, and creating a DB snapshot of the instance.   Valid values: standard | gp2 | io1  Default: io1 if the Iops parameter is specified, otherwise standard 
     */
    StorageType?: String;
    /**
     * The ARN from the key store with which to associate the instance for TDE encryption.
     */
    TdeCredentialArn?: String;
    /**
     * The password for the given ARN from the key store in order to access the device.
     */
    TdeCredentialPassword?: String;
    /**
     * Indicates the certificate that needs to be associated with the instance.
     */
    CACertificateIdentifier?: String;
    /**
     * Not supported. 
     */
    Domain?: String;
    /**
     * True to copy all tags from the DB instance to snapshots of the DB instance, and otherwise false. The default is false.
     */
    CopyTagsToSnapshot?: BooleanOptional;
    /**
     * The interval, in seconds, between points when Enhanced Monitoring metrics are collected for the DB instance. To disable collecting Enhanced Monitoring metrics, specify 0. The default is 0. If MonitoringRoleArn is specified, then you must also set MonitoringInterval to a value other than 0. Valid Values: 0, 1, 5, 10, 15, 30, 60 
     */
    MonitoringInterval?: IntegerOptional;
    /**
     * The port number on which the database accepts connections. The value of the DBPortNumber parameter must not match any of the port values specified for options in the option group for the DB instance. Your database will restart when you change the DBPortNumber value regardless of the value of the ApplyImmediately parameter.  Default: 8182 
     */
    DBPortNumber?: IntegerOptional;
    /**
     * This parameter is not supported.
     */
    PubliclyAccessible?: BooleanOptional;
    /**
     * The ARN for the IAM role that permits Neptune to send enhanced monitoring metrics to Amazon CloudWatch Logs. For example, arn:aws:iam:123456789012:role/emaccess.  If MonitoringInterval is set to a value other than 0, then you must supply a MonitoringRoleArn value.
     */
    MonitoringRoleArn?: String;
    /**
     * Not supported
     */
    DomainIAMRoleName?: String;
    /**
     * A value that specifies the order in which a Read Replica is promoted to the primary instance after a failure of the existing primary instance.  Default: 1 Valid Values: 0 - 15
     */
    PromotionTier?: IntegerOptional;
    /**
     * True to enable mapping of AWS Identity and Access Management (IAM) accounts to database accounts, and otherwise false. You can enable IAM database authentication for the following database engines Not applicable. Mapping AWS IAM accounts to database accounts is managed by the DB cluster. For more information, see ModifyDBCluster. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
    /**
     * True to enable Performance Insights for the DB instance, and otherwise false.
     */
    EnablePerformanceInsights?: BooleanOptional;
    /**
     * The AWS KMS key identifier for encryption of Performance Insights data. The KMS key ID is the Amazon Resource Name (ARN), KMS key identifier, or the KMS key alias for the KMS encryption key.
     */
    PerformanceInsightsKMSKeyId?: String;
    /**
     * The configuration setting for the log types to be enabled for export to CloudWatch Logs for a specific DB instance or DB cluster.
     */
    CloudwatchLogsExportConfiguration?: CloudwatchLogsExportConfiguration;
  }
  export interface ModifyDBInstanceResult {
    DBInstance?: DBInstance;
  }
  export interface ModifyDBParameterGroupMessage {
    /**
     * The name of the DB parameter group. Constraints:   If supplied, must match the name of an existing DBParameterGroup.  
     */
    DBParameterGroupName: String;
    /**
     * An array of parameter names, values, and the apply method for the parameter update. At least one parameter name, value, and apply method must be supplied; subsequent arguments are optional. A maximum of 20 parameters can be modified in a single request. Valid Values (for the application method): immediate | pending-reboot   You can use the immediate value with dynamic parameters only. You can use the pending-reboot value for both dynamic and static parameters, and changes are applied when you reboot the DB instance without failover. 
     */
    Parameters: ParametersList;
  }
  export interface ModifyDBSubnetGroupMessage {
    /**
     * The name for the DB subnet group. This value is stored as a lowercase string. You can't modify the default subnet group.  Constraints: Must match the name of an existing DBSubnetGroup. Must not be default. Example: mySubnetgroup 
     */
    DBSubnetGroupName: String;
    /**
     * The description for the DB subnet group.
     */
    DBSubnetGroupDescription?: String;
    /**
     * The EC2 subnet IDs for the DB subnet group.
     */
    SubnetIds: SubnetIdentifierList;
  }
  export interface ModifyDBSubnetGroupResult {
    DBSubnetGroup?: DBSubnetGroup;
  }
  export interface ModifyEventSubscriptionMessage {
    /**
     * The name of the event notification subscription.
     */
    SubscriptionName: String;
    /**
     * The Amazon Resource Name (ARN) of the SNS topic created for event notification. The ARN is created by Amazon SNS when you create a topic and subscribe to it.
     */
    SnsTopicArn?: String;
    /**
     * The type of source that is generating the events. For example, if you want to be notified of events generated by a DB instance, you would set this parameter to db-instance. if this value is not specified, all events are returned. Valid values: db-instance | db-parameter-group | db-security-group | db-snapshot
     */
    SourceType?: String;
    /**
     *  A list of event categories for a SourceType that you want to subscribe to. You can see a list of the categories for a given SourceType by using the DescribeEventCategories action. 
     */
    EventCategories?: EventCategoriesList;
    /**
     *  A Boolean value; set to true to activate the subscription. 
     */
    Enabled?: BooleanOptional;
  }
  export interface ModifyEventSubscriptionResult {
    EventSubscription?: EventSubscription;
  }
  export interface OptionGroupMembership {
    /**
     * The name of the option group that the instance belongs to.
     */
    OptionGroupName?: String;
    /**
     * The status of the DB instance's option group membership. Valid values are: in-sync, pending-apply, pending-removal, pending-maintenance-apply, pending-maintenance-removal, applying, removing, and failed. 
     */
    Status?: String;
  }
  export type OptionGroupMembershipList = OptionGroupMembership[];
  export interface OrderableDBInstanceOption {
    /**
     * The engine type of a DB instance.
     */
    Engine?: String;
    /**
     * The engine version of a DB instance.
     */
    EngineVersion?: String;
    /**
     * The DB instance class for a DB instance.
     */
    DBInstanceClass?: String;
    /**
     * The license model for a DB instance.
     */
    LicenseModel?: String;
    /**
     * A list of Availability Zones for a DB instance.
     */
    AvailabilityZones?: AvailabilityZoneList;
    /**
     * Indicates whether a DB instance is Multi-AZ capable.
     */
    MultiAZCapable?: Boolean;
    /**
     * Indicates whether a DB instance can have a Read Replica.
     */
    ReadReplicaCapable?: Boolean;
    /**
     * Indicates whether a DB instance is in a VPC.
     */
    Vpc?: Boolean;
    /**
     * Indicates whether a DB instance supports encrypted storage.
     */
    SupportsStorageEncryption?: Boolean;
    /**
     * Indicates the storage type for a DB instance.
     */
    StorageType?: String;
    /**
     * Indicates whether a DB instance supports provisioned IOPS.
     */
    SupportsIops?: Boolean;
    /**
     * Indicates whether a DB instance supports Enhanced Monitoring at intervals from 1 to 60 seconds.
     */
    SupportsEnhancedMonitoring?: Boolean;
    /**
     * Indicates whether a DB instance supports IAM database authentication.
     */
    SupportsIAMDatabaseAuthentication?: Boolean;
    /**
     * True if a DB instance supports Performance Insights, otherwise false.
     */
    SupportsPerformanceInsights?: Boolean;
    /**
     * Minimum storage size for a DB instance.
     */
    MinStorageSize?: IntegerOptional;
    /**
     * Maximum storage size for a DB instance.
     */
    MaxStorageSize?: IntegerOptional;
    /**
     * Minimum total provisioned IOPS for a DB instance.
     */
    MinIopsPerDbInstance?: IntegerOptional;
    /**
     * Maximum total provisioned IOPS for a DB instance.
     */
    MaxIopsPerDbInstance?: IntegerOptional;
    /**
     * Minimum provisioned IOPS per GiB for a DB instance.
     */
    MinIopsPerGib?: DoubleOptional;
    /**
     * Maximum provisioned IOPS per GiB for a DB instance.
     */
    MaxIopsPerGib?: DoubleOptional;
  }
  export type OrderableDBInstanceOptionsList = OrderableDBInstanceOption[];
  export interface OrderableDBInstanceOptionsMessage {
    /**
     * An OrderableDBInstanceOption structure containing information about orderable options for the DB instance.
     */
    OrderableDBInstanceOptions?: OrderableDBInstanceOptionsList;
    /**
     *  An optional pagination token provided by a previous OrderableDBInstanceOptions request. If this parameter is specified, the response includes only records beyond the marker, up to the value specified by MaxRecords . 
     */
    Marker?: String;
  }
  export interface Parameter {
    /**
     * Specifies the name of the parameter.
     */
    ParameterName?: String;
    /**
     * Specifies the value of the parameter.
     */
    ParameterValue?: String;
    /**
     * Provides a description of the parameter.
     */
    Description?: String;
    /**
     * Indicates the source of the parameter value.
     */
    Source?: String;
    /**
     * Specifies the engine specific parameters type.
     */
    ApplyType?: String;
    /**
     * Specifies the valid data type for the parameter.
     */
    DataType?: String;
    /**
     * Specifies the valid range of values for the parameter.
     */
    AllowedValues?: String;
    /**
     *  Indicates whether (true) or not (false) the parameter can be modified. Some parameters have security or operational implications that prevent them from being changed. 
     */
    IsModifiable?: Boolean;
    /**
     * The earliest engine version to which the parameter can apply.
     */
    MinimumEngineVersion?: String;
    /**
     * Indicates when to apply parameter updates.
     */
    ApplyMethod?: ApplyMethod;
  }
  export type ParametersList = Parameter[];
  export interface PendingCloudwatchLogsExports {
    /**
     * Log types that are in the process of being deactivated. After they are deactivated, these log types aren't exported to CloudWatch Logs.
     */
    LogTypesToEnable?: LogTypeList;
    /**
     * Log types that are in the process of being enabled. After they are enabled, these log types are exported to CloudWatch Logs.
     */
    LogTypesToDisable?: LogTypeList;
  }
  export interface PendingMaintenanceAction {
    /**
     * The type of pending maintenance action that is available for the resource.
     */
    Action?: String;
    /**
     * The date of the maintenance window when the action is applied. The maintenance action is applied to the resource during its first maintenance window after this date. If this date is specified, any next-maintenance opt-in requests are ignored.
     */
    AutoAppliedAfterDate?: TStamp;
    /**
     * The date when the maintenance action is automatically applied. The maintenance action is applied to the resource on this date regardless of the maintenance window for the resource. If this date is specified, any immediate opt-in requests are ignored.
     */
    ForcedApplyDate?: TStamp;
    /**
     * Indicates the type of opt-in request that has been received for the resource.
     */
    OptInStatus?: String;
    /**
     * The effective date when the pending maintenance action is applied to the resource. This date takes into account opt-in requests received from the ApplyPendingMaintenanceAction API, the AutoAppliedAfterDate, and the ForcedApplyDate. This value is blank if an opt-in request has not been received and nothing has been specified as AutoAppliedAfterDate or ForcedApplyDate.
     */
    CurrentApplyDate?: TStamp;
    /**
     * A description providing more detail about the maintenance action.
     */
    Description?: String;
  }
  export type PendingMaintenanceActionDetails = PendingMaintenanceAction[];
  export type PendingMaintenanceActions = ResourcePendingMaintenanceActions[];
  export interface PendingMaintenanceActionsMessage {
    /**
     * A list of the pending maintenance actions for the resource.
     */
    PendingMaintenanceActions?: PendingMaintenanceActions;
    /**
     *  An optional pagination token provided by a previous DescribePendingMaintenanceActions request. If this parameter is specified, the response includes only records beyond the marker, up to a number of records specified by MaxRecords. 
     */
    Marker?: String;
  }
  export interface PendingModifiedValues {
    /**
     *  Contains the new DBInstanceClass for the DB instance that will be applied or is currently being applied. 
     */
    DBInstanceClass?: String;
    /**
     *  Contains the new AllocatedStorage size for the DB instance that will be applied or is currently being applied. 
     */
    AllocatedStorage?: IntegerOptional;
    /**
     * Contains the pending or currently-in-progress change of the master credentials for the DB instance.
     */
    MasterUserPassword?: String;
    /**
     * Specifies the pending port for the DB instance.
     */
    Port?: IntegerOptional;
    /**
     * Specifies the pending number of days for which automated backups are retained.
     */
    BackupRetentionPeriod?: IntegerOptional;
    /**
     * Indicates that the Single-AZ DB instance is to change to a Multi-AZ deployment.
     */
    MultiAZ?: BooleanOptional;
    /**
     * Indicates the database engine version.
     */
    EngineVersion?: String;
    /**
     * The license model for the DB instance. Valid values: license-included | bring-your-own-license | general-public-license 
     */
    LicenseModel?: String;
    /**
     * Specifies the new Provisioned IOPS value for the DB instance that will be applied or is currently being applied.
     */
    Iops?: IntegerOptional;
    /**
     *  Contains the new DBInstanceIdentifier for the DB instance that will be applied or is currently being applied. 
     */
    DBInstanceIdentifier?: String;
    /**
     * Specifies the storage type to be associated with the DB instance.
     */
    StorageType?: String;
    /**
     * Specifies the identifier of the CA certificate for the DB instance.
     */
    CACertificateIdentifier?: String;
    /**
     * The new DB subnet group for the DB instance. 
     */
    DBSubnetGroupName?: String;
    PendingCloudwatchLogsExports?: PendingCloudwatchLogsExports;
  }
  export interface PromoteReadReplicaDBClusterMessage {
    /**
     * The identifier of the DB cluster Read Replica to promote. This parameter is not case-sensitive.  Constraints:   Must match the identifier of an existing DBCluster Read Replica.   Example: my-cluster-replica1 
     */
    DBClusterIdentifier: String;
  }
  export interface PromoteReadReplicaDBClusterResult {
    DBCluster?: DBCluster;
  }
  export interface Range {
    /**
     * The minimum value in the range.
     */
    From?: Integer;
    /**
     * The maximum value in the range.
     */
    To?: Integer;
    /**
     * The step value for the range. For example, if you have a range of 5,000 to 10,000, with a step value of 1,000, the valid values start at 5,000 and step up by 1,000. Even though 7,500 is within the range, it isn't a valid value for the range. The valid values are 5,000, 6,000, 7,000, 8,000... 
     */
    Step?: IntegerOptional;
  }
  export type RangeList = Range[];
  export type ReadReplicaDBClusterIdentifierList = String[];
  export type ReadReplicaDBInstanceIdentifierList = String[];
  export type ReadReplicaIdentifierList = String[];
  export interface RebootDBInstanceMessage {
    /**
     * The DB instance identifier. This parameter is stored as a lowercase string. Constraints:   Must match the identifier of an existing DBInstance.  
     */
    DBInstanceIdentifier: String;
    /**
     *  When true, the reboot is conducted through a MultiAZ failover.  Constraint: You can't specify true if the instance is not configured for MultiAZ.
     */
    ForceFailover?: BooleanOptional;
  }
  export interface RebootDBInstanceResult {
    DBInstance?: DBInstance;
  }
  export interface RemoveRoleFromDBClusterMessage {
    /**
     * The name of the DB cluster to disassociate the IAM role from.
     */
    DBClusterIdentifier: String;
    /**
     * The Amazon Resource Name (ARN) of the IAM role to disassociate from the DB cluster, for example arn:aws:iam::123456789012:role/NeptuneAccessRole.
     */
    RoleArn: String;
  }
  export interface RemoveSourceIdentifierFromSubscriptionMessage {
    /**
     * The name of the event notification subscription you want to remove a source identifier from.
     */
    SubscriptionName: String;
    /**
     *  The source identifier to be removed from the subscription, such as the DB instance identifier for a DB instance or the name of a security group. 
     */
    SourceIdentifier: String;
  }
  export interface RemoveSourceIdentifierFromSubscriptionResult {
    EventSubscription?: EventSubscription;
  }
  export interface RemoveTagsFromResourceMessage {
    /**
     * The Amazon Neptune resource that the tags are removed from. This value is an Amazon Resource Name (ARN). For information about creating an ARN, see  Constructing an Amazon Resource Name (ARN).
     */
    ResourceName: String;
    /**
     * The tag key (name) of the tag to be removed.
     */
    TagKeys: KeyList;
  }
  export interface ResetDBClusterParameterGroupMessage {
    /**
     * The name of the DB cluster parameter group to reset.
     */
    DBClusterParameterGroupName: String;
    /**
     * A value that is set to true to reset all parameters in the DB cluster parameter group to their default values, and false otherwise. You can't use this parameter if there is a list of parameter names specified for the Parameters parameter.
     */
    ResetAllParameters?: Boolean;
    /**
     * A list of parameter names in the DB cluster parameter group to reset to the default values. You can't use this parameter if the ResetAllParameters parameter is set to true.
     */
    Parameters?: ParametersList;
  }
  export interface ResetDBParameterGroupMessage {
    /**
     * The name of the DB parameter group. Constraints:   Must match the name of an existing DBParameterGroup.  
     */
    DBParameterGroupName: String;
    /**
     *  Specifies whether (true) or not (false) to reset all parameters in the DB parameter group to default values.  Default: true 
     */
    ResetAllParameters?: Boolean;
    /**
     * To reset the entire DB parameter group, specify the DBParameterGroup name and ResetAllParameters parameters. To reset specific parameters, provide a list of the following: ParameterName and ApplyMethod. A maximum of 20 parameters can be modified in a single request. Valid Values (for Apply method): pending-reboot 
     */
    Parameters?: ParametersList;
  }
  export interface ResourcePendingMaintenanceActions {
    /**
     * The ARN of the resource that has pending maintenance actions.
     */
    ResourceIdentifier?: String;
    /**
     * A list that provides details about the pending maintenance actions for the resource.
     */
    PendingMaintenanceActionDetails?: PendingMaintenanceActionDetails;
  }
  export interface RestoreDBClusterFromSnapshotMessage {
    /**
     * Provides the list of EC2 Availability Zones that instances in the restored DB cluster can be created in.
     */
    AvailabilityZones?: AvailabilityZones;
    /**
     * The name of the DB cluster to create from the DB snapshot or DB cluster snapshot. This parameter isn't case-sensitive. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens   Example: my-snapshot-id 
     */
    DBClusterIdentifier: String;
    /**
     * The identifier for the DB snapshot or DB cluster snapshot to restore from. You can use either the name or the Amazon Resource Name (ARN) to specify a DB cluster snapshot. However, you can use only the ARN to specify a DB snapshot. Constraints:   Must match the identifier of an existing Snapshot.  
     */
    SnapshotIdentifier: String;
    /**
     * The database engine to use for the new DB cluster. Default: The same as source Constraint: Must be compatible with the engine of the source
     */
    Engine: String;
    /**
     * The version of the database engine to use for the new DB cluster.
     */
    EngineVersion?: String;
    /**
     * The port number on which the new DB cluster accepts connections. Constraints: Value must be 1150-65535  Default: The same port as the original DB cluster.
     */
    Port?: IntegerOptional;
    /**
     * The name of the DB subnet group to use for the new DB cluster. Constraints: If supplied, must match the name of an existing DBSubnetGroup. Example: mySubnetgroup 
     */
    DBSubnetGroupName?: String;
    /**
     * The database name for the restored DB cluster.
     */
    DatabaseName?: String;
    /**
     * The name of the option group to use for the restored DB cluster.
     */
    OptionGroupName?: String;
    /**
     * A list of VPC security groups that the new DB cluster will belong to.
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    /**
     * The tags to be assigned to the restored DB cluster.
     */
    Tags?: TagList;
    /**
     * The AWS KMS key identifier to use when restoring an encrypted DB cluster from a DB snapshot or DB cluster snapshot. The KMS key identifier is the Amazon Resource Name (ARN) for the KMS encryption key. If you are restoring a DB cluster with the same AWS account that owns the KMS encryption key used to encrypt the new DB cluster, then you can use the KMS key alias instead of the ARN for the KMS encryption key. If you do not specify a value for the KmsKeyId parameter, then the following will occur:   If the DB snapshot or DB cluster snapshot in SnapshotIdentifier is encrypted, then the restored DB cluster is encrypted using the KMS key that was used to encrypt the DB snapshot or DB cluster snapshot.   If the DB snapshot or DB cluster snapshot in SnapshotIdentifier is not encrypted, then the restored DB cluster is not encrypted.  
     */
    KmsKeyId?: String;
    /**
     * True to enable mapping of AWS Identity and Access Management (IAM) accounts to database accounts, and otherwise false. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
  }
  export interface RestoreDBClusterFromSnapshotResult {
    DBCluster?: DBCluster;
  }
  export interface RestoreDBClusterToPointInTimeMessage {
    /**
     * The name of the new DB cluster to be created. Constraints:   Must contain from 1 to 63 letters, numbers, or hyphens   First character must be a letter   Cannot end with a hyphen or contain two consecutive hyphens  
     */
    DBClusterIdentifier: String;
    /**
     * The type of restore to be performed. You can specify one of the following values:    full-copy - The new DB cluster is restored as a full copy of the source DB cluster.    copy-on-write - The new DB cluster is restored as a clone of the source DB cluster.   Constraints: You can't specify copy-on-write if the engine version of the source DB cluster is earlier than 1.11. If you don't specify a RestoreType value, then the new DB cluster is restored as a full copy of the source DB cluster.
     */
    RestoreType?: String;
    /**
     * The identifier of the source DB cluster from which to restore. Constraints:   Must match the identifier of an existing DBCluster.  
     */
    SourceDBClusterIdentifier: String;
    /**
     * The date and time to restore the DB cluster to. Valid Values: Value must be a time in Universal Coordinated Time (UTC) format Constraints:   Must be before the latest restorable time for the DB instance   Must be specified if UseLatestRestorableTime parameter is not provided   Cannot be specified if UseLatestRestorableTime parameter is true   Cannot be specified if RestoreType parameter is copy-on-write    Example: 2015-03-07T23:45:00Z 
     */
    RestoreToTime?: TStamp;
    /**
     * A value that is set to true to restore the DB cluster to the latest restorable backup time, and false otherwise.  Default: false  Constraints: Cannot be specified if RestoreToTime parameter is provided.
     */
    UseLatestRestorableTime?: Boolean;
    /**
     * The port number on which the new DB cluster accepts connections. Constraints: Value must be 1150-65535  Default: The same port as the original DB cluster.
     */
    Port?: IntegerOptional;
    /**
     * The DB subnet group name to use for the new DB cluster. Constraints: If supplied, must match the name of an existing DBSubnetGroup. Example: mySubnetgroup 
     */
    DBSubnetGroupName?: String;
    /**
     * The name of the option group for the new DB cluster.
     */
    OptionGroupName?: String;
    /**
     * A list of VPC security groups that the new DB cluster belongs to.
     */
    VpcSecurityGroupIds?: VpcSecurityGroupIdList;
    Tags?: TagList;
    /**
     * The AWS KMS key identifier to use when restoring an encrypted DB cluster from an encrypted DB cluster. The KMS key identifier is the Amazon Resource Name (ARN) for the KMS encryption key. If you are restoring a DB cluster with the same AWS account that owns the KMS encryption key used to encrypt the new DB cluster, then you can use the KMS key alias instead of the ARN for the KMS encryption key. You can restore to a new DB cluster and encrypt the new DB cluster with a KMS key that is different than the KMS key used to encrypt the source DB cluster. The new DB cluster is encrypted with the KMS key identified by the KmsKeyId parameter. If you do not specify a value for the KmsKeyId parameter, then the following will occur:   If the DB cluster is encrypted, then the restored DB cluster is encrypted using the KMS key that was used to encrypt the source DB cluster.   If the DB cluster is not encrypted, then the restored DB cluster is not encrypted.   If DBClusterIdentifier refers to a DB cluster that is not encrypted, then the restore request is rejected.
     */
    KmsKeyId?: String;
    /**
     * True to enable mapping of AWS Identity and Access Management (IAM) accounts to database accounts, and otherwise false. Default: false 
     */
    EnableIAMDatabaseAuthentication?: BooleanOptional;
  }
  export interface RestoreDBClusterToPointInTimeResult {
    DBCluster?: DBCluster;
  }
  export type SourceIdsList = String[];
  export type SourceType = "db-instance"|"db-parameter-group"|"db-security-group"|"db-snapshot"|"db-cluster"|"db-cluster-snapshot"|string;
  export type String = string;
  export interface Subnet {
    /**
     * Specifies the identifier of the subnet.
     */
    SubnetIdentifier?: String;
    SubnetAvailabilityZone?: AvailabilityZone;
    /**
     * Specifies the status of the subnet.
     */
    SubnetStatus?: String;
  }
  export type SubnetIdentifierList = String[];
  export type SubnetList = Subnet[];
  export type SupportedCharacterSetsList = CharacterSet[];
  export type SupportedTimezonesList = Timezone[];
  export type TStamp = Date;
  export interface Tag {
    /**
     * A key is the required name of the tag. The string value can be from 1 to 128 Unicode characters in length and can't be prefixed with "aws:" or "rds:". The string can only contain only the set of Unicode letters, digits, white-space, '_', '.', '/', '=', '+', '-' (Java regex: "^([\\p{L}\\p{Z}\\p{N}_.:/=+\\-]*)$").
     */
    Key?: String;
    /**
     * A value is the optional value of the tag. The string value can be from 1 to 256 Unicode characters in length and can't be prefixed with "aws:" or "rds:". The string can only contain only the set of Unicode letters, digits, white-space, '_', '.', '/', '=', '+', '-' (Java regex: "^([\\p{L}\\p{Z}\\p{N}_.:/=+\\-]*)$").
     */
    Value?: String;
  }
  export type TagList = Tag[];
  export interface TagListMessage {
    /**
     * List of tags returned by the ListTagsForResource operation.
     */
    TagList?: TagList;
  }
  export interface Timezone {
    /**
     * The name of the time zone.
     */
    TimezoneName?: String;
  }
  export interface UpgradeTarget {
    /**
     * The name of the upgrade target database engine.
     */
    Engine?: String;
    /**
     * The version number of the upgrade target database engine.
     */
    EngineVersion?: String;
    /**
     * The version of the database engine that a DB instance can be upgraded to.
     */
    Description?: String;
    /**
     * A value that indicates whether the target version is applied to any source DB instances that have AutoMinorVersionUpgrade set to true.
     */
    AutoUpgrade?: Boolean;
    /**
     * A value that indicates whether a database engine is upgraded to a major version.
     */
    IsMajorVersionUpgrade?: Boolean;
  }
  export interface ValidDBInstanceModificationsMessage {
    /**
     * Valid storage options for your DB instance. 
     */
    Storage?: ValidStorageOptionsList;
  }
  export interface ValidStorageOptions {
    /**
     * The valid storage types for your DB instance. For example, gp2, io1. 
     */
    StorageType?: String;
    /**
     * The valid range of storage in gibibytes. For example, 100 to 16384. 
     */
    StorageSize?: RangeList;
    /**
     * The valid range of provisioned IOPS. For example, 1000-20000. 
     */
    ProvisionedIops?: RangeList;
    /**
     * The valid range of Provisioned IOPS to gibibytes of storage multiplier. For example, 3-10, which means that provisioned IOPS can be between 3 and 10 times storage. 
     */
    IopsToStorageRatio?: DoubleRangeList;
  }
  export type ValidStorageOptionsList = ValidStorageOptions[];
  export type ValidUpgradeTargetList = UpgradeTarget[];
  export type VpcSecurityGroupIdList = String[];
  export interface VpcSecurityGroupMembership {
    /**
     * The name of the VPC security group.
     */
    VpcSecurityGroupId?: String;
    /**
     * The status of the VPC security group.
     */
    Status?: String;
  }
  export type VpcSecurityGroupMembershipList = VpcSecurityGroupMembership[];
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2014-10-31"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the Neptune client.
   */
  export import Types = Neptune;
}
export = Neptune;

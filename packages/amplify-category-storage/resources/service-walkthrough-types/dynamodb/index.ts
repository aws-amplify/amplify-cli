
/**
 * CLI Inputs Data for S3 resource
 */
 export interface AddStorageRequest {
  version: 1;
  serviceConfiguration: DDBServiceConfiguration;
}

/**
 * Service configuration for AWS DDB through Amplify
 */
 export interface DDBServiceConfiguration {
  /**
   * Descriminant used to determine the service config type
   */
  serviceName: 'dynamodb';
  /**
   * Globally unique bucket name
   */
  tableName: string;

  /**
   * DynamoDB CLI input
   */
  cliInput : DynamoDBCLIConfig
}

/**
* DynamoDB CLI input type
*/
export interface DynamoDBCLIConfig {
   tableName : string,
   /**
   * Table keys
   */
   tableKeys : DynamoDBIndexKeyProps,
   /**
   * Optional parameter specifying table has one or more GSIs
   */
   hasIndex  : boolean,
   gsi?: GSIKeyProps[],
   /**
   * Optional parameter specifying a lambda that should run when a mutation occurs on a table
   */
   hasStream : boolean,
   streamProps? : DDBStreamLambdaTriggerConfig
}

/**
* DynamoDB GSI Props
*/
interface GSIKeyProps {
  gsiName : string,
  tabkeKeys : DynamoDBIndexKeyProps
}

/**
* DynamoDB Index Props
*/
interface DynamoDBIndexKeyProps {
  partitionKeyName : string,
  partitionKeyType : string,
  hasSortKey: boolean,
  sortKeyName? : string,
  sortKeyType? : string,
}

/**
* DynamoDB trigger stream
*/
export interface DDBStreamLambdaTriggerConfig {
  mode: 'new' | 'existing';
  name: string;
}









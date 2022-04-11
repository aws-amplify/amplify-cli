import { AuthProvider, ModelOperation } from './definitions';

export const DEFAULT_OWNER_FIELD = 'owner';
export const DEFAULT_GROUPS_FIELD = 'groups';
export const DEFAULT_IDENTITY_CLAIM = 'username';
export const DEFAULT_UNIQUE_IDENTITY_CLAIM = 'sub:username';
export const DEFAULT_COGNITO_IDENTITY_CLAIM = 'cognito:username';
export const DEFAULT_GROUP_CLAIM = 'cognito:groups';
export const ON_CREATE_FIELD = 'onCreate';
export const ON_UPDATE_FIELD = 'onUpdate';
export const ON_DELETE_FIELD = 'onDelete';
export const AUTH_NON_MODEL_TYPES = 'authNonModelTypes';
export const MODEL_OPERATIONS: ModelOperation[] = ['create', 'read', 'update', 'delete'];
export const AUTH_PROVIDER_DIRECTIVE_MAP = new Map<AuthProvider, string>([
  ['apiKey', 'aws_api_key'],
  ['iam', 'aws_iam'],
  ['oidc', 'aws_oidc'],
  ['userPools', 'aws_cognito_user_pools'],
  ['function', 'aws_lambda'],
]);
// values for $util.authType() https://docs.aws.amazon.com/appsync/latest/devguide/resolver-util-reference.html
export const COGNITO_AUTH_TYPE = 'User Pool Authorization';
export const OIDC_AUTH_TYPE = 'Open ID Connect Authorization';
export const IAM_AUTH_TYPE = 'IAM Authorization';
export const LAMBDA_AUTH_TYPE = 'Lambda Authorization';
export const API_KEY_AUTH_TYPE = 'API Key Authorization';
// resolver refs
export const IS_AUTHORIZED_FLAG = 'isAuthorized';
export const ALLOWED_FIELDS = 'allowedFields';
export const NULL_ALLOWED_FIELDS = 'nullAllowedFields';
export const DENIED_FIELDS = 'deniedFields';
// resolver
export const NONE_DS = 'NONE_DS';
// relational directives
export const RELATIONAL_DIRECTIVES = ['hasOne', 'belongsTo', 'hasMany', 'manyToMany'];
// searchable directive
export const SEARCHABLE_AGGREGATE_TYPES = [
  'SearchableAggregateResult',
  'SearchableAggregateScalarResult',
  'SearchableAggregateBucketResult',
  'SearchableAggregateBucketResultItem',
];

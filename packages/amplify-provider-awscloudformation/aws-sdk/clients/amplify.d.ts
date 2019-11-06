import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class Amplify extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: Amplify.Types.ClientConfiguration)
  config: Config & Amplify.Types.ClientConfiguration;
  /**
   * 
   */
  createApp(params: Amplify.Types.CreateAppRequest, callback?: (err: AWSError, data: Amplify.Types.CreateAppResult) => void): Request<Amplify.Types.CreateAppResult, AWSError>;
  /**
   * 
   */
  createApp(callback?: (err: AWSError, data: Amplify.Types.CreateAppResult) => void): Request<Amplify.Types.CreateAppResult, AWSError>;
  /**
   * 
   */
  createBackendEnvironment(params: Amplify.Types.CreateBackendEnvironmentRequest, callback?: (err: AWSError, data: Amplify.Types.CreateBackendEnvironmentResult) => void): Request<Amplify.Types.CreateBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  createBackendEnvironment(callback?: (err: AWSError, data: Amplify.Types.CreateBackendEnvironmentResult) => void): Request<Amplify.Types.CreateBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  createBranch(params: Amplify.Types.CreateBranchRequest, callback?: (err: AWSError, data: Amplify.Types.CreateBranchResult) => void): Request<Amplify.Types.CreateBranchResult, AWSError>;
  /**
   * 
   */
  createBranch(callback?: (err: AWSError, data: Amplify.Types.CreateBranchResult) => void): Request<Amplify.Types.CreateBranchResult, AWSError>;
  /**
   * 
   */
  createDeployment(params: Amplify.Types.CreateDeploymentRequest, callback?: (err: AWSError, data: Amplify.Types.CreateDeploymentResult) => void): Request<Amplify.Types.CreateDeploymentResult, AWSError>;
  /**
   * 
   */
  createDeployment(callback?: (err: AWSError, data: Amplify.Types.CreateDeploymentResult) => void): Request<Amplify.Types.CreateDeploymentResult, AWSError>;
  /**
   * 
   */
  createDomainAssociation(params: Amplify.Types.CreateDomainAssociationRequest, callback?: (err: AWSError, data: Amplify.Types.CreateDomainAssociationResult) => void): Request<Amplify.Types.CreateDomainAssociationResult, AWSError>;
  /**
   * 
   */
  createDomainAssociation(callback?: (err: AWSError, data: Amplify.Types.CreateDomainAssociationResult) => void): Request<Amplify.Types.CreateDomainAssociationResult, AWSError>;
  /**
   * 
   */
  createWebhook(params: Amplify.Types.CreateWebhookRequest, callback?: (err: AWSError, data: Amplify.Types.CreateWebhookResult) => void): Request<Amplify.Types.CreateWebhookResult, AWSError>;
  /**
   * 
   */
  createWebhook(callback?: (err: AWSError, data: Amplify.Types.CreateWebhookResult) => void): Request<Amplify.Types.CreateWebhookResult, AWSError>;
  /**
   * 
   */
  deleteApp(params: Amplify.Types.DeleteAppRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteAppResult) => void): Request<Amplify.Types.DeleteAppResult, AWSError>;
  /**
   * 
   */
  deleteApp(callback?: (err: AWSError, data: Amplify.Types.DeleteAppResult) => void): Request<Amplify.Types.DeleteAppResult, AWSError>;
  /**
   * 
   */
  deleteBackendEnvironment(params: Amplify.Types.DeleteBackendEnvironmentRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteBackendEnvironmentResult) => void): Request<Amplify.Types.DeleteBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  deleteBackendEnvironment(callback?: (err: AWSError, data: Amplify.Types.DeleteBackendEnvironmentResult) => void): Request<Amplify.Types.DeleteBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  deleteBranch(params: Amplify.Types.DeleteBranchRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteBranchResult) => void): Request<Amplify.Types.DeleteBranchResult, AWSError>;
  /**
   * 
   */
  deleteBranch(callback?: (err: AWSError, data: Amplify.Types.DeleteBranchResult) => void): Request<Amplify.Types.DeleteBranchResult, AWSError>;
  /**
   * 
   */
  deleteDomainAssociation(params: Amplify.Types.DeleteDomainAssociationRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteDomainAssociationResult) => void): Request<Amplify.Types.DeleteDomainAssociationResult, AWSError>;
  /**
   * 
   */
  deleteDomainAssociation(callback?: (err: AWSError, data: Amplify.Types.DeleteDomainAssociationResult) => void): Request<Amplify.Types.DeleteDomainAssociationResult, AWSError>;
  /**
   * 
   */
  deleteJob(params: Amplify.Types.DeleteJobRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteJobResult) => void): Request<Amplify.Types.DeleteJobResult, AWSError>;
  /**
   * 
   */
  deleteJob(callback?: (err: AWSError, data: Amplify.Types.DeleteJobResult) => void): Request<Amplify.Types.DeleteJobResult, AWSError>;
  /**
   * 
   */
  deleteWebhook(params: Amplify.Types.DeleteWebhookRequest, callback?: (err: AWSError, data: Amplify.Types.DeleteWebhookResult) => void): Request<Amplify.Types.DeleteWebhookResult, AWSError>;
  /**
   * 
   */
  deleteWebhook(callback?: (err: AWSError, data: Amplify.Types.DeleteWebhookResult) => void): Request<Amplify.Types.DeleteWebhookResult, AWSError>;
  /**
   * 
   */
  generateAccessLogs(params: Amplify.Types.GenerateAccessLogsRequest, callback?: (err: AWSError, data: Amplify.Types.GenerateAccessLogsResult) => void): Request<Amplify.Types.GenerateAccessLogsResult, AWSError>;
  /**
   * 
   */
  generateAccessLogs(callback?: (err: AWSError, data: Amplify.Types.GenerateAccessLogsResult) => void): Request<Amplify.Types.GenerateAccessLogsResult, AWSError>;
  /**
   * 
   */
  getApp(params: Amplify.Types.GetAppRequest, callback?: (err: AWSError, data: Amplify.Types.GetAppResult) => void): Request<Amplify.Types.GetAppResult, AWSError>;
  /**
   * 
   */
  getApp(callback?: (err: AWSError, data: Amplify.Types.GetAppResult) => void): Request<Amplify.Types.GetAppResult, AWSError>;
  /**
   * 
   */
  getArtifactUrl(params: Amplify.Types.GetArtifactUrlRequest, callback?: (err: AWSError, data: Amplify.Types.GetArtifactUrlResult) => void): Request<Amplify.Types.GetArtifactUrlResult, AWSError>;
  /**
   * 
   */
  getArtifactUrl(callback?: (err: AWSError, data: Amplify.Types.GetArtifactUrlResult) => void): Request<Amplify.Types.GetArtifactUrlResult, AWSError>;
  /**
   * 
   */
  getBackendEnvironment(params: Amplify.Types.GetBackendEnvironmentRequest, callback?: (err: AWSError, data: Amplify.Types.GetBackendEnvironmentResult) => void): Request<Amplify.Types.GetBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  getBackendEnvironment(callback?: (err: AWSError, data: Amplify.Types.GetBackendEnvironmentResult) => void): Request<Amplify.Types.GetBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  getBranch(params: Amplify.Types.GetBranchRequest, callback?: (err: AWSError, data: Amplify.Types.GetBranchResult) => void): Request<Amplify.Types.GetBranchResult, AWSError>;
  /**
   * 
   */
  getBranch(callback?: (err: AWSError, data: Amplify.Types.GetBranchResult) => void): Request<Amplify.Types.GetBranchResult, AWSError>;
  /**
   * 
   */
  getDomainAssociation(params: Amplify.Types.GetDomainAssociationRequest, callback?: (err: AWSError, data: Amplify.Types.GetDomainAssociationResult) => void): Request<Amplify.Types.GetDomainAssociationResult, AWSError>;
  /**
   * 
   */
  getDomainAssociation(callback?: (err: AWSError, data: Amplify.Types.GetDomainAssociationResult) => void): Request<Amplify.Types.GetDomainAssociationResult, AWSError>;
  /**
   * 
   */
  getJob(params: Amplify.Types.GetJobRequest, callback?: (err: AWSError, data: Amplify.Types.GetJobResult) => void): Request<Amplify.Types.GetJobResult, AWSError>;
  /**
   * 
   */
  getJob(callback?: (err: AWSError, data: Amplify.Types.GetJobResult) => void): Request<Amplify.Types.GetJobResult, AWSError>;
  /**
   * 
   */
  getWebhook(params: Amplify.Types.GetWebhookRequest, callback?: (err: AWSError, data: Amplify.Types.GetWebhookResult) => void): Request<Amplify.Types.GetWebhookResult, AWSError>;
  /**
   * 
   */
  getWebhook(callback?: (err: AWSError, data: Amplify.Types.GetWebhookResult) => void): Request<Amplify.Types.GetWebhookResult, AWSError>;
  /**
   * 
   */
  listApps(params: Amplify.Types.ListAppsRequest, callback?: (err: AWSError, data: Amplify.Types.ListAppsResult) => void): Request<Amplify.Types.ListAppsResult, AWSError>;
  /**
   * 
   */
  listApps(callback?: (err: AWSError, data: Amplify.Types.ListAppsResult) => void): Request<Amplify.Types.ListAppsResult, AWSError>;
  /**
   * 
   */
  listArtifacts(params: Amplify.Types.ListArtifactsRequest, callback?: (err: AWSError, data: Amplify.Types.ListArtifactsResult) => void): Request<Amplify.Types.ListArtifactsResult, AWSError>;
  /**
   * 
   */
  listArtifacts(callback?: (err: AWSError, data: Amplify.Types.ListArtifactsResult) => void): Request<Amplify.Types.ListArtifactsResult, AWSError>;
  /**
   * 
   */
  listBackendEnvironments(params: Amplify.Types.ListBackendEnvironmentsRequest, callback?: (err: AWSError, data: Amplify.Types.ListBackendEnvironmentsResult) => void): Request<Amplify.Types.ListBackendEnvironmentsResult, AWSError>;
  /**
   * 
   */
  listBackendEnvironments(callback?: (err: AWSError, data: Amplify.Types.ListBackendEnvironmentsResult) => void): Request<Amplify.Types.ListBackendEnvironmentsResult, AWSError>;
  /**
   * 
   */
  listBranches(params: Amplify.Types.ListBranchesRequest, callback?: (err: AWSError, data: Amplify.Types.ListBranchesResult) => void): Request<Amplify.Types.ListBranchesResult, AWSError>;
  /**
   * 
   */
  listBranches(callback?: (err: AWSError, data: Amplify.Types.ListBranchesResult) => void): Request<Amplify.Types.ListBranchesResult, AWSError>;
  /**
   * 
   */
  listDomainAssociations(params: Amplify.Types.ListDomainAssociationsRequest, callback?: (err: AWSError, data: Amplify.Types.ListDomainAssociationsResult) => void): Request<Amplify.Types.ListDomainAssociationsResult, AWSError>;
  /**
   * 
   */
  listDomainAssociations(callback?: (err: AWSError, data: Amplify.Types.ListDomainAssociationsResult) => void): Request<Amplify.Types.ListDomainAssociationsResult, AWSError>;
  /**
   * 
   */
  listJobs(params: Amplify.Types.ListJobsRequest, callback?: (err: AWSError, data: Amplify.Types.ListJobsResult) => void): Request<Amplify.Types.ListJobsResult, AWSError>;
  /**
   * 
   */
  listJobs(callback?: (err: AWSError, data: Amplify.Types.ListJobsResult) => void): Request<Amplify.Types.ListJobsResult, AWSError>;
  /**
   * 
   */
  listTagsForResource(params: Amplify.Types.ListTagsForResourceRequest, callback?: (err: AWSError, data: Amplify.Types.ListTagsForResourceResponse) => void): Request<Amplify.Types.ListTagsForResourceResponse, AWSError>;
  /**
   * 
   */
  listTagsForResource(callback?: (err: AWSError, data: Amplify.Types.ListTagsForResourceResponse) => void): Request<Amplify.Types.ListTagsForResourceResponse, AWSError>;
  /**
   * 
   */
  listWebhooks(params: Amplify.Types.ListWebhooksRequest, callback?: (err: AWSError, data: Amplify.Types.ListWebhooksResult) => void): Request<Amplify.Types.ListWebhooksResult, AWSError>;
  /**
   * 
   */
  listWebhooks(callback?: (err: AWSError, data: Amplify.Types.ListWebhooksResult) => void): Request<Amplify.Types.ListWebhooksResult, AWSError>;
  /**
   * 
   */
  startDeployment(params: Amplify.Types.StartDeploymentRequest, callback?: (err: AWSError, data: Amplify.Types.StartDeploymentResult) => void): Request<Amplify.Types.StartDeploymentResult, AWSError>;
  /**
   * 
   */
  startDeployment(callback?: (err: AWSError, data: Amplify.Types.StartDeploymentResult) => void): Request<Amplify.Types.StartDeploymentResult, AWSError>;
  /**
   * 
   */
  startJob(params: Amplify.Types.StartJobRequest, callback?: (err: AWSError, data: Amplify.Types.StartJobResult) => void): Request<Amplify.Types.StartJobResult, AWSError>;
  /**
   * 
   */
  startJob(callback?: (err: AWSError, data: Amplify.Types.StartJobResult) => void): Request<Amplify.Types.StartJobResult, AWSError>;
  /**
   * 
   */
  stopJob(params: Amplify.Types.StopJobRequest, callback?: (err: AWSError, data: Amplify.Types.StopJobResult) => void): Request<Amplify.Types.StopJobResult, AWSError>;
  /**
   * 
   */
  stopJob(callback?: (err: AWSError, data: Amplify.Types.StopJobResult) => void): Request<Amplify.Types.StopJobResult, AWSError>;
  /**
   * 
   */
  tagResource(params: Amplify.Types.TagResourceRequest, callback?: (err: AWSError, data: Amplify.Types.TagResourceResponse) => void): Request<Amplify.Types.TagResourceResponse, AWSError>;
  /**
   * 
   */
  tagResource(callback?: (err: AWSError, data: Amplify.Types.TagResourceResponse) => void): Request<Amplify.Types.TagResourceResponse, AWSError>;
  /**
   * 
   */
  untagResource(params: Amplify.Types.UntagResourceRequest, callback?: (err: AWSError, data: Amplify.Types.UntagResourceResponse) => void): Request<Amplify.Types.UntagResourceResponse, AWSError>;
  /**
   * 
   */
  untagResource(callback?: (err: AWSError, data: Amplify.Types.UntagResourceResponse) => void): Request<Amplify.Types.UntagResourceResponse, AWSError>;
  /**
   * 
   */
  updateApp(params: Amplify.Types.UpdateAppRequest, callback?: (err: AWSError, data: Amplify.Types.UpdateAppResult) => void): Request<Amplify.Types.UpdateAppResult, AWSError>;
  /**
   * 
   */
  updateApp(callback?: (err: AWSError, data: Amplify.Types.UpdateAppResult) => void): Request<Amplify.Types.UpdateAppResult, AWSError>;
  /**
   * 
   */
  updateBackendEnvironment(params: Amplify.Types.UpdateBackendEnvironmentRequest, callback?: (err: AWSError, data: Amplify.Types.UpdateBackendEnvironmentResult) => void): Request<Amplify.Types.UpdateBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  updateBackendEnvironment(callback?: (err: AWSError, data: Amplify.Types.UpdateBackendEnvironmentResult) => void): Request<Amplify.Types.UpdateBackendEnvironmentResult, AWSError>;
  /**
   * 
   */
  updateBranch(params: Amplify.Types.UpdateBranchRequest, callback?: (err: AWSError, data: Amplify.Types.UpdateBranchResult) => void): Request<Amplify.Types.UpdateBranchResult, AWSError>;
  /**
   * 
   */
  updateBranch(callback?: (err: AWSError, data: Amplify.Types.UpdateBranchResult) => void): Request<Amplify.Types.UpdateBranchResult, AWSError>;
  /**
   * 
   */
  updateDomainAssociation(params: Amplify.Types.UpdateDomainAssociationRequest, callback?: (err: AWSError, data: Amplify.Types.UpdateDomainAssociationResult) => void): Request<Amplify.Types.UpdateDomainAssociationResult, AWSError>;
  /**
   * 
   */
  updateDomainAssociation(callback?: (err: AWSError, data: Amplify.Types.UpdateDomainAssociationResult) => void): Request<Amplify.Types.UpdateDomainAssociationResult, AWSError>;
  /**
   * 
   */
  updateWebhook(params: Amplify.Types.UpdateWebhookRequest, callback?: (err: AWSError, data: Amplify.Types.UpdateWebhookResult) => void): Request<Amplify.Types.UpdateWebhookResult, AWSError>;
  /**
   * 
   */
  updateWebhook(callback?: (err: AWSError, data: Amplify.Types.UpdateWebhookResult) => void): Request<Amplify.Types.UpdateWebhookResult, AWSError>;
}
declare namespace Amplify {
  export type AccessToken = string;
  export type ActiveJobId = string;
  export interface App {
    appId: AppId;
    appArn: AppArn;
    name: Name;
    tags?: TagMap;
    description: Description;
    repository: Repository;
    platform: Platform;
    createTime: CreateTime;
    updateTime: UpdateTime;
    iamServiceRoleArn?: ServiceRoleArn;
    environmentVariables: EnvironmentVariables;
    defaultDomain: DefaultDomain;
    enableBranchAutoBuild: EnableBranchAutoBuild;
    enableBasicAuth: EnableBasicAuth;
    basicAuthCredentials?: BasicAuthCredentials;
    customRules?: CustomRules;
    productionBranch?: ProductionBranch;
    buildSpec?: BuildSpec;
    enableAutoBranchCreation?: EnableAutoBranchCreation;
    autoBranchCreationPatterns?: AutoBranchCreationPatterns;
    autoBranchCreationConfig?: AutoBranchCreationConfig;
  }
  export type AppArn = string;
  export type AppId = string;
  export type Apps = App[];
  export interface Artifact {
    artifactFileName: ArtifactFileName;
    artifactId: ArtifactId;
  }
  export type ArtifactFileName = string;
  export type ArtifactId = string;
  export type ArtifactUrl = string;
  export type Artifacts = Artifact[];
  export type ArtifactsUrl = string;
  export type AssociatedResource = string;
  export type AssociatedResources = AssociatedResource[];
  export interface AutoBranchCreationConfig {
    stage?: Stage;
    framework?: Framework;
    enableAutoBuild?: EnableAutoBuild;
    environmentVariables?: EnvironmentVariables;
    basicAuthCredentials?: BasicAuthCredentials;
    enableBasicAuth?: EnableBasicAuth;
    buildSpec?: BuildSpec;
    enablePullRequestPreview?: EnablePullRequestPreview;
    pullRequestEnvironmentName?: PullRequestEnvironmentName;
  }
  export type AutoBranchCreationPattern = string;
  export type AutoBranchCreationPatterns = AutoBranchCreationPattern[];
  export interface BackendEnvironment {
    backendEnvironmentArn: BackendEnvironmentArn;
    environmentName: EnvironmentName;
    stackName?: StackName;
    deploymentSource?: DeploymentSource;
    deploymentArtifacts?: DeploymentArtifacts;
    createTime: CreateTime;
    updateTime: UpdateTime;
  }
  export type BackendEnvironmentArn = string;
  export type BackendEnvironments = BackendEnvironment[];
  export type BasicAuthCredentials = string;
  export interface Branch {
    branchArn: BranchArn;
    branchName: BranchName;
    description: Description;
    tags?: TagMap;
    stage: Stage;
    displayName: DisplayName;
    enableNotification: EnableNotification;
    createTime: CreateTime;
    updateTime: UpdateTime;
    environmentVariables: EnvironmentVariables;
    enableAutoBuild: EnableAutoBuild;
    customDomains: CustomDomains;
    framework: Framework;
    activeJobId: ActiveJobId;
    totalNumberOfJobs: TotalNumberOfJobs;
    enableBasicAuth: EnableBasicAuth;
    thumbnailUrl?: ThumbnailUrl;
    basicAuthCredentials?: BasicAuthCredentials;
    buildSpec?: BuildSpec;
    ttl: TTL;
    associatedResources?: AssociatedResources;
    enablePullRequestPreview: EnablePullRequestPreview;
    pullRequestEnvironmentName?: PullRequestEnvironmentName;
    destinationBranch?: BranchName;
    sourceBranch?: BranchName;
    backendEnvironmentArn?: BackendEnvironmentArn;
  }
  export type BranchArn = string;
  export type BranchName = string;
  export type Branches = Branch[];
  export type BuildSpec = string;
  export type CertificateVerificationDNSRecord = string;
  export type CommitId = string;
  export type CommitMessage = string;
  export type CommitTime = Date;
  export type Condition = string;
  export type Context = string;
  export interface CreateAppRequest {
    name: Name;
    description?: Description;
    repository?: Repository;
    platform?: Platform;
    iamServiceRoleArn?: ServiceRoleArn;
    oauthToken?: OauthToken;
    accessToken?: AccessToken;
    environmentVariables?: EnvironmentVariables;
    enableBranchAutoBuild?: EnableBranchAutoBuild;
    enableBasicAuth?: EnableBasicAuth;
    basicAuthCredentials?: BasicAuthCredentials;
    customRules?: CustomRules;
    tags?: TagMap;
    buildSpec?: BuildSpec;
    enableAutoBranchCreation?: EnableAutoBranchCreation;
    autoBranchCreationPatterns?: AutoBranchCreationPatterns;
    autoBranchCreationConfig?: AutoBranchCreationConfig;
  }
  export interface CreateAppResult {
    app: App;
  }
  export interface CreateBackendEnvironmentRequest {
    appId: AppId;
    environmentName: EnvironmentName;
    stackName?: StackName;
    deploymentSource?: DeploymentSource;
    deploymentArtifacts?: DeploymentArtifacts;
  }
  export interface CreateBackendEnvironmentResult {
    backendEnvironment: BackendEnvironment;
  }
  export interface CreateBranchRequest {
    appId: AppId;
    branchName: BranchName;
    description?: Description;
    stage?: Stage;
    framework?: Framework;
    enableNotification?: EnableNotification;
    enableAutoBuild?: EnableAutoBuild;
    environmentVariables?: EnvironmentVariables;
    basicAuthCredentials?: BasicAuthCredentials;
    enableBasicAuth?: EnableBasicAuth;
    tags?: TagMap;
    buildSpec?: BuildSpec;
    ttl?: TTL;
    displayName?: DisplayName;
    enablePullRequestPreview?: EnablePullRequestPreview;
    pullRequestEnvironmentName?: PullRequestEnvironmentName;
    backendEnvironmentArn?: BackendEnvironmentArn;
  }
  export interface CreateBranchResult {
    branch: Branch;
  }
  export interface CreateDeploymentRequest {
    appId: AppId;
    branchName: BranchName;
    fileMap?: FileMap;
  }
  export interface CreateDeploymentResult {
    jobId?: JobId;
    fileUploadUrls: FileUploadUrls;
    zipUploadUrl: UploadUrl;
  }
  export interface CreateDomainAssociationRequest {
    appId: AppId;
    domainName: DomainName;
    enableAutoSubDomain?: EnableAutoSubDomain;
    subDomainSettings: SubDomainSettings;
  }
  export interface CreateDomainAssociationResult {
    domainAssociation: DomainAssociation;
  }
  export type CreateTime = Date;
  export interface CreateWebhookRequest {
    appId: AppId;
    branchName: BranchName;
    description?: Description;
  }
  export interface CreateWebhookResult {
    webhook: Webhook;
  }
  export type CustomDomain = string;
  export type CustomDomains = CustomDomain[];
  export interface CustomRule {
    source: Source;
    target: Target;
    status?: Status;
    condition?: Condition;
  }
  export type CustomRules = CustomRule[];
  export type DNSRecord = string;
  export type DefaultDomain = string;
  export interface DeleteAppRequest {
    appId: AppId;
  }
  export interface DeleteAppResult {
    app: App;
  }
  export interface DeleteBackendEnvironmentRequest {
    appId: AppId;
    environmentName: EnvironmentName;
  }
  export interface DeleteBackendEnvironmentResult {
    backendEnvironment: BackendEnvironment;
  }
  export interface DeleteBranchRequest {
    appId: AppId;
    branchName: BranchName;
  }
  export interface DeleteBranchResult {
    branch: Branch;
  }
  export interface DeleteDomainAssociationRequest {
    appId: AppId;
    domainName: DomainName;
  }
  export interface DeleteDomainAssociationResult {
    domainAssociation: DomainAssociation;
  }
  export interface DeleteJobRequest {
    appId: AppId;
    branchName: BranchName;
    jobId: JobId;
  }
  export interface DeleteJobResult {
    jobSummary: JobSummary;
  }
  export interface DeleteWebhookRequest {
    webhookId: WebhookId;
  }
  export interface DeleteWebhookResult {
    webhook: Webhook;
  }
  export type DeploymentArtifacts = string;
  export type DeploymentSource = string;
  export type Description = string;
  export type DisplayName = string;
  export interface DomainAssociation {
    domainAssociationArn: DomainAssociationArn;
    domainName: DomainName;
    enableAutoSubDomain: EnableAutoSubDomain;
    domainStatus: DomainStatus;
    statusReason: StatusReason;
    certificateVerificationDNSRecord?: CertificateVerificationDNSRecord;
    subDomains: SubDomains;
  }
  export type DomainAssociationArn = string;
  export type DomainAssociations = DomainAssociation[];
  export type DomainName = string;
  export type DomainPrefix = string;
  export type DomainStatus = "PENDING_VERIFICATION"|"IN_PROGRESS"|"AVAILABLE"|"PENDING_DEPLOYMENT"|"FAILED"|"CREATING"|"REQUESTING_CERTIFICATE"|"UPDATING"|string;
  export type EnableAutoBranchCreation = boolean;
  export type EnableAutoBuild = boolean;
  export type EnableAutoSubDomain = boolean;
  export type EnableBasicAuth = boolean;
  export type EnableBranchAutoBuild = boolean;
  export type EnableNotification = boolean;
  export type EnablePullRequestPreview = boolean;
  export type EndTime = Date;
  export type EnvKey = string;
  export type EnvValue = string;
  export type EnvironmentName = string;
  export type EnvironmentVariables = {[key: string]: EnvValue};
  export type FileMap = {[key: string]: MD5Hash};
  export type FileName = string;
  export type FileUploadUrls = {[key: string]: UploadUrl};
  export type Framework = string;
  export interface GenerateAccessLogsRequest {
    startTime?: StartTime;
    endTime?: EndTime;
    domainName: DomainName;
    appId: AppId;
  }
  export interface GenerateAccessLogsResult {
    logUrl?: LogUrl;
  }
  export interface GetAppRequest {
    appId: AppId;
  }
  export interface GetAppResult {
    app: App;
  }
  export interface GetArtifactUrlRequest {
    artifactId: ArtifactId;
  }
  export interface GetArtifactUrlResult {
    artifactId: ArtifactId;
    artifactUrl: ArtifactUrl;
  }
  export interface GetBackendEnvironmentRequest {
    appId: AppId;
    environmentName: EnvironmentName;
  }
  export interface GetBackendEnvironmentResult {
    backendEnvironment: BackendEnvironment;
  }
  export interface GetBranchRequest {
    appId: AppId;
    branchName: BranchName;
  }
  export interface GetBranchResult {
    branch: Branch;
  }
  export interface GetDomainAssociationRequest {
    appId: AppId;
    domainName: DomainName;
  }
  export interface GetDomainAssociationResult {
    domainAssociation: DomainAssociation;
  }
  export interface GetJobRequest {
    appId: AppId;
    branchName: BranchName;
    jobId: JobId;
  }
  export interface GetJobResult {
    job: Job;
  }
  export interface GetWebhookRequest {
    webhookId: WebhookId;
  }
  export interface GetWebhookResult {
    webhook: Webhook;
  }
  export interface Job {
    summary: JobSummary;
    steps: Steps;
  }
  export type JobArn = string;
  export type JobId = string;
  export type JobReason = string;
  export type JobStatus = "PENDING"|"PROVISIONING"|"RUNNING"|"FAILED"|"SUCCEED"|"CANCELLING"|"CANCELLED"|string;
  export type JobSummaries = JobSummary[];
  export interface JobSummary {
    jobArn: JobArn;
    jobId: JobId;
    commitId: CommitId;
    commitMessage: CommitMessage;
    commitTime: CommitTime;
    startTime: StartTime;
    status: JobStatus;
    endTime?: EndTime;
    jobType: JobType;
  }
  export type JobType = "RELEASE"|"RETRY"|"MANUAL"|"WEB_HOOK"|string;
  export type LastDeployTime = Date;
  export interface ListAppsRequest {
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListAppsResult {
    apps: Apps;
    nextToken?: NextToken;
  }
  export interface ListArtifactsRequest {
    appId: AppId;
    branchName: BranchName;
    jobId: JobId;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListArtifactsResult {
    artifacts: Artifacts;
    nextToken?: NextToken;
  }
  export interface ListBackendEnvironmentsRequest {
    appId: AppId;
    environmentName?: EnvironmentName;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListBackendEnvironmentsResult {
    backendEnvironments: BackendEnvironments;
    nextToken?: NextToken;
  }
  export interface ListBranchesRequest {
    appId: AppId;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListBranchesResult {
    branches: Branches;
    nextToken?: NextToken;
  }
  export interface ListDomainAssociationsRequest {
    appId: AppId;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListDomainAssociationsResult {
    domainAssociations: DomainAssociations;
    nextToken?: NextToken;
  }
  export interface ListJobsRequest {
    appId: AppId;
    branchName: BranchName;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListJobsResult {
    jobSummaries: JobSummaries;
    nextToken?: NextToken;
  }
  export interface ListTagsForResourceRequest {
    resourceArn: ResourceArn;
  }
  export interface ListTagsForResourceResponse {
    tags?: TagMap;
  }
  export interface ListWebhooksRequest {
    appId: AppId;
    nextToken?: NextToken;
    maxResults?: MaxResults;
  }
  export interface ListWebhooksResult {
    webhooks: Webhooks;
    nextToken?: NextToken;
  }
  export type LogUrl = string;
  export type MD5Hash = string;
  export type MaxResults = number;
  export type Name = string;
  export type NextToken = string;
  export type OauthToken = string;
  export type Platform = "WEB"|string;
  export interface ProductionBranch {
    lastDeployTime?: LastDeployTime;
    status?: Status;
    thumbnailUrl?: ThumbnailUrl;
    branchName?: BranchName;
  }
  export type PullRequestEnvironmentName = string;
  export type Repository = string;
  export type ResourceArn = string;
  export type Screenshots = {[key: string]: ThumbnailUrl};
  export type ServiceRoleArn = string;
  export type Source = string;
  export type SourceUrl = string;
  export type StackName = string;
  export type Stage = "PRODUCTION"|"BETA"|"DEVELOPMENT"|"EXPERIMENTAL"|"PULL_REQUEST"|string;
  export interface StartDeploymentRequest {
    appId: AppId;
    branchName: BranchName;
    jobId?: JobId;
    sourceUrl?: SourceUrl;
  }
  export interface StartDeploymentResult {
    jobSummary: JobSummary;
  }
  export interface StartJobRequest {
    appId: AppId;
    branchName: BranchName;
    jobId?: JobId;
    jobType: JobType;
    jobReason?: JobReason;
    commitId?: CommitId;
    commitMessage?: CommitMessage;
    commitTime?: CommitTime;
  }
  export interface StartJobResult {
    jobSummary: JobSummary;
  }
  export type StartTime = Date;
  export type Status = string;
  export type StatusReason = string;
  export interface Step {
    stepName: StepName;
    startTime: StartTime;
    status: JobStatus;
    endTime: EndTime;
    logUrl?: LogUrl;
    artifactsUrl?: ArtifactsUrl;
    testArtifactsUrl?: TestArtifactsUrl;
    testConfigUrl?: TestConfigUrl;
    screenshots?: Screenshots;
    statusReason?: StatusReason;
    context?: Context;
  }
  export type StepName = string;
  export type Steps = Step[];
  export interface StopJobRequest {
    appId: AppId;
    branchName: BranchName;
    jobId: JobId;
  }
  export interface StopJobResult {
    jobSummary: JobSummary;
  }
  export interface SubDomain {
    subDomainSetting: SubDomainSetting;
    verified: Verified;
    dnsRecord: DNSRecord;
  }
  export interface SubDomainSetting {
    prefix: DomainPrefix;
    branchName: BranchName;
  }
  export type SubDomainSettings = SubDomainSetting[];
  export type SubDomains = SubDomain[];
  export type TTL = string;
  export type TagKey = string;
  export type TagKeyList = TagKey[];
  export type TagMap = {[key: string]: TagValue};
  export interface TagResourceRequest {
    resourceArn: ResourceArn;
    tags: TagMap;
  }
  export interface TagResourceResponse {
  }
  export type TagValue = string;
  export type Target = string;
  export type TestArtifactsUrl = string;
  export type TestConfigUrl = string;
  export type ThumbnailName = string;
  export type ThumbnailUrl = string;
  export type TotalNumberOfJobs = string;
  export interface UntagResourceRequest {
    resourceArn: ResourceArn;
    tagKeys: TagKeyList;
  }
  export interface UntagResourceResponse {
  }
  export interface UpdateAppRequest {
    appId: AppId;
    name?: Name;
    description?: Description;
    platform?: Platform;
    iamServiceRoleArn?: ServiceRoleArn;
    environmentVariables?: EnvironmentVariables;
    enableBranchAutoBuild?: EnableAutoBuild;
    enableBasicAuth?: EnableBasicAuth;
    basicAuthCredentials?: BasicAuthCredentials;
    customRules?: CustomRules;
    buildSpec?: BuildSpec;
    enableAutoBranchCreation?: EnableAutoBranchCreation;
    autoBranchCreationPatterns?: AutoBranchCreationPatterns;
    autoBranchCreationConfig?: AutoBranchCreationConfig;
    repository?: Repository;
    oauthToken?: OauthToken;
    accessToken?: AccessToken;
  }
  export interface UpdateAppResult {
    app: App;
  }
  export interface UpdateBackendEnvironmentRequest {
    appId: AppId;
    environmentName: EnvironmentName;
    deploymentSource?: DeploymentSource;
  }
  export interface UpdateBackendEnvironmentResult {
    backendEnvironment: BackendEnvironment;
  }
  export interface UpdateBranchRequest {
    appId: AppId;
    branchName: BranchName;
    description?: Description;
    framework?: Framework;
    stage?: Stage;
    enableNotification?: EnableNotification;
    enableAutoBuild?: EnableAutoBuild;
    environmentVariables?: EnvironmentVariables;
    basicAuthCredentials?: BasicAuthCredentials;
    enableBasicAuth?: EnableBasicAuth;
    buildSpec?: BuildSpec;
    ttl?: TTL;
    displayName?: DisplayName;
    enablePullRequestPreview?: EnablePullRequestPreview;
    pullRequestEnvironmentName?: PullRequestEnvironmentName;
    backendEnvironmentArn?: BackendEnvironmentArn;
  }
  export interface UpdateBranchResult {
    branch: Branch;
  }
  export interface UpdateDomainAssociationRequest {
    appId: AppId;
    domainName: DomainName;
    enableAutoSubDomain?: EnableAutoSubDomain;
    subDomainSettings: SubDomainSettings;
  }
  export interface UpdateDomainAssociationResult {
    domainAssociation: DomainAssociation;
  }
  export type UpdateTime = Date;
  export interface UpdateWebhookRequest {
    webhookId: WebhookId;
    branchName?: BranchName;
    description?: Description;
  }
  export interface UpdateWebhookResult {
    webhook: Webhook;
  }
  export type UploadUrl = string;
  export type Verified = boolean;
  export interface Webhook {
    webhookArn: WebhookArn;
    webhookId: WebhookId;
    webhookUrl: WebhookUrl;
    branchName: BranchName;
    description: Description;
    createTime: CreateTime;
    updateTime: UpdateTime;
  }
  export type WebhookArn = string;
  export type WebhookId = string;
  export type WebhookUrl = string;
  export type Webhooks = Webhook[];
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2017-07-25"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the Amplify client.
   */
  export import Types = Amplify;
}
export = Amplify;

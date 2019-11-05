import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class ServiceDiscovery extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: ServiceDiscovery.Types.ClientConfiguration)
  config: Config & ServiceDiscovery.Types.ClientConfiguration;
  /**
   * Creates a private namespace based on DNS, which will be visible only inside a specified Amazon VPC. The namespace defines your service naming scheme. For example, if you name your namespace example.com and name your service backend, the resulting DNS name for the service will be backend.example.com. For the current limit on the number of namespaces that you can create using the same AWS account, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createPrivateDnsNamespace(params: ServiceDiscovery.Types.CreatePrivateDnsNamespaceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.CreatePrivateDnsNamespaceResponse) => void): Request<ServiceDiscovery.Types.CreatePrivateDnsNamespaceResponse, AWSError>;
  /**
   * Creates a private namespace based on DNS, which will be visible only inside a specified Amazon VPC. The namespace defines your service naming scheme. For example, if you name your namespace example.com and name your service backend, the resulting DNS name for the service will be backend.example.com. For the current limit on the number of namespaces that you can create using the same AWS account, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createPrivateDnsNamespace(callback?: (err: AWSError, data: ServiceDiscovery.Types.CreatePrivateDnsNamespaceResponse) => void): Request<ServiceDiscovery.Types.CreatePrivateDnsNamespaceResponse, AWSError>;
  /**
   * Creates a public namespace based on DNS, which will be visible on the internet. The namespace defines your service naming scheme. For example, if you name your namespace example.com and name your service backend, the resulting DNS name for the service will be backend.example.com. For the current limit on the number of namespaces that you can create using the same AWS account, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createPublicDnsNamespace(params: ServiceDiscovery.Types.CreatePublicDnsNamespaceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.CreatePublicDnsNamespaceResponse) => void): Request<ServiceDiscovery.Types.CreatePublicDnsNamespaceResponse, AWSError>;
  /**
   * Creates a public namespace based on DNS, which will be visible on the internet. The namespace defines your service naming scheme. For example, if you name your namespace example.com and name your service backend, the resulting DNS name for the service will be backend.example.com. For the current limit on the number of namespaces that you can create using the same AWS account, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createPublicDnsNamespace(callback?: (err: AWSError, data: ServiceDiscovery.Types.CreatePublicDnsNamespaceResponse) => void): Request<ServiceDiscovery.Types.CreatePublicDnsNamespaceResponse, AWSError>;
  /**
   * Creates a service, which defines the configuration for the following entities:   Up to three records (A, AAAA, and SRV) or one CNAME record   Optionally, a health check   After you create the service, you can submit a RegisterInstance request, and Amazon Route 53 uses the values in the configuration to create the specified entities. For the current limit on the number of instances that you can register using the same namespace and using the same service, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createService(params: ServiceDiscovery.Types.CreateServiceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.CreateServiceResponse) => void): Request<ServiceDiscovery.Types.CreateServiceResponse, AWSError>;
  /**
   * Creates a service, which defines the configuration for the following entities:   Up to three records (A, AAAA, and SRV) or one CNAME record   Optionally, a health check   After you create the service, you can submit a RegisterInstance request, and Amazon Route 53 uses the values in the configuration to create the specified entities. For the current limit on the number of instances that you can register using the same namespace and using the same service, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  createService(callback?: (err: AWSError, data: ServiceDiscovery.Types.CreateServiceResponse) => void): Request<ServiceDiscovery.Types.CreateServiceResponse, AWSError>;
  /**
   * Deletes a namespace from the current account. If the namespace still contains one or more services, the request fails.
   */
  deleteNamespace(params: ServiceDiscovery.Types.DeleteNamespaceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.DeleteNamespaceResponse) => void): Request<ServiceDiscovery.Types.DeleteNamespaceResponse, AWSError>;
  /**
   * Deletes a namespace from the current account. If the namespace still contains one or more services, the request fails.
   */
  deleteNamespace(callback?: (err: AWSError, data: ServiceDiscovery.Types.DeleteNamespaceResponse) => void): Request<ServiceDiscovery.Types.DeleteNamespaceResponse, AWSError>;
  /**
   * Deletes a specified service. If the service still contains one or more registered instances, the request fails.
   */
  deleteService(params: ServiceDiscovery.Types.DeleteServiceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.DeleteServiceResponse) => void): Request<ServiceDiscovery.Types.DeleteServiceResponse, AWSError>;
  /**
   * Deletes a specified service. If the service still contains one or more registered instances, the request fails.
   */
  deleteService(callback?: (err: AWSError, data: ServiceDiscovery.Types.DeleteServiceResponse) => void): Request<ServiceDiscovery.Types.DeleteServiceResponse, AWSError>;
  /**
   * Deletes the records and the health check, if any, that Amazon Route 53 created for the specified instance.
   */
  deregisterInstance(params: ServiceDiscovery.Types.DeregisterInstanceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.DeregisterInstanceResponse) => void): Request<ServiceDiscovery.Types.DeregisterInstanceResponse, AWSError>;
  /**
   * Deletes the records and the health check, if any, that Amazon Route 53 created for the specified instance.
   */
  deregisterInstance(callback?: (err: AWSError, data: ServiceDiscovery.Types.DeregisterInstanceResponse) => void): Request<ServiceDiscovery.Types.DeregisterInstanceResponse, AWSError>;
  /**
   * Gets information about a specified instance.
   */
  getInstance(params: ServiceDiscovery.Types.GetInstanceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.GetInstanceResponse) => void): Request<ServiceDiscovery.Types.GetInstanceResponse, AWSError>;
  /**
   * Gets information about a specified instance.
   */
  getInstance(callback?: (err: AWSError, data: ServiceDiscovery.Types.GetInstanceResponse) => void): Request<ServiceDiscovery.Types.GetInstanceResponse, AWSError>;
  /**
   * Gets the current health status (Healthy, Unhealthy, or Unknown) of one or more instances that are associated with a specified service.  There is a brief delay between when you register an instance and when the health status for the instance is available.  
   */
  getInstancesHealthStatus(params: ServiceDiscovery.Types.GetInstancesHealthStatusRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.GetInstancesHealthStatusResponse) => void): Request<ServiceDiscovery.Types.GetInstancesHealthStatusResponse, AWSError>;
  /**
   * Gets the current health status (Healthy, Unhealthy, or Unknown) of one or more instances that are associated with a specified service.  There is a brief delay between when you register an instance and when the health status for the instance is available.  
   */
  getInstancesHealthStatus(callback?: (err: AWSError, data: ServiceDiscovery.Types.GetInstancesHealthStatusResponse) => void): Request<ServiceDiscovery.Types.GetInstancesHealthStatusResponse, AWSError>;
  /**
   * Gets information about a namespace.
   */
  getNamespace(params: ServiceDiscovery.Types.GetNamespaceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.GetNamespaceResponse) => void): Request<ServiceDiscovery.Types.GetNamespaceResponse, AWSError>;
  /**
   * Gets information about a namespace.
   */
  getNamespace(callback?: (err: AWSError, data: ServiceDiscovery.Types.GetNamespaceResponse) => void): Request<ServiceDiscovery.Types.GetNamespaceResponse, AWSError>;
  /**
   * Gets information about any operation that returns an operation ID in the response, such as a CreateService request.  To get a list of operations that match specified criteria, see ListOperations. 
   */
  getOperation(params: ServiceDiscovery.Types.GetOperationRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.GetOperationResponse) => void): Request<ServiceDiscovery.Types.GetOperationResponse, AWSError>;
  /**
   * Gets information about any operation that returns an operation ID in the response, such as a CreateService request.  To get a list of operations that match specified criteria, see ListOperations. 
   */
  getOperation(callback?: (err: AWSError, data: ServiceDiscovery.Types.GetOperationResponse) => void): Request<ServiceDiscovery.Types.GetOperationResponse, AWSError>;
  /**
   * Gets the settings for a specified service.
   */
  getService(params: ServiceDiscovery.Types.GetServiceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.GetServiceResponse) => void): Request<ServiceDiscovery.Types.GetServiceResponse, AWSError>;
  /**
   * Gets the settings for a specified service.
   */
  getService(callback?: (err: AWSError, data: ServiceDiscovery.Types.GetServiceResponse) => void): Request<ServiceDiscovery.Types.GetServiceResponse, AWSError>;
  /**
   * Lists summary information about the instances that you registered by using a specified service.
   */
  listInstances(params: ServiceDiscovery.Types.ListInstancesRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.ListInstancesResponse) => void): Request<ServiceDiscovery.Types.ListInstancesResponse, AWSError>;
  /**
   * Lists summary information about the instances that you registered by using a specified service.
   */
  listInstances(callback?: (err: AWSError, data: ServiceDiscovery.Types.ListInstancesResponse) => void): Request<ServiceDiscovery.Types.ListInstancesResponse, AWSError>;
  /**
   * Lists summary information about the namespaces that were created by the current AWS account.
   */
  listNamespaces(params: ServiceDiscovery.Types.ListNamespacesRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.ListNamespacesResponse) => void): Request<ServiceDiscovery.Types.ListNamespacesResponse, AWSError>;
  /**
   * Lists summary information about the namespaces that were created by the current AWS account.
   */
  listNamespaces(callback?: (err: AWSError, data: ServiceDiscovery.Types.ListNamespacesResponse) => void): Request<ServiceDiscovery.Types.ListNamespacesResponse, AWSError>;
  /**
   * Lists operations that match the criteria that you specify.
   */
  listOperations(params: ServiceDiscovery.Types.ListOperationsRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.ListOperationsResponse) => void): Request<ServiceDiscovery.Types.ListOperationsResponse, AWSError>;
  /**
   * Lists operations that match the criteria that you specify.
   */
  listOperations(callback?: (err: AWSError, data: ServiceDiscovery.Types.ListOperationsResponse) => void): Request<ServiceDiscovery.Types.ListOperationsResponse, AWSError>;
  /**
   * Lists summary information for all the services that are associated with one or more specified namespaces.
   */
  listServices(params: ServiceDiscovery.Types.ListServicesRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.ListServicesResponse) => void): Request<ServiceDiscovery.Types.ListServicesResponse, AWSError>;
  /**
   * Lists summary information for all the services that are associated with one or more specified namespaces.
   */
  listServices(callback?: (err: AWSError, data: ServiceDiscovery.Types.ListServicesResponse) => void): Request<ServiceDiscovery.Types.ListServicesResponse, AWSError>;
  /**
   * Creates or updates one or more records and optionally a health check based on the settings in a specified service. When you submit a RegisterInstance request, Amazon Route 53 does the following:   For each DNS record that you define in the service specified by ServiceId, creates or updates a record in the hosted zone that is associated with the corresponding namespace   If the service includes HealthCheckConfig, creates or updates a health check based on the settings in the health check configuration   Associates the health check, if any, with each of the records    One RegisterInstance request must complete before you can submit another request and specify the same service ID and instance ID.  For more information, see CreateService. When Route 53 receives a DNS query for the specified DNS name, it returns the applicable value:    If the health check is healthy: returns all the records    If the health check is unhealthy: returns the applicable value for the last healthy instance    If you didn't specify a health check configuration: returns all the records   For the current limit on the number of instances that you can register using the same namespace and using the same service, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  registerInstance(params: ServiceDiscovery.Types.RegisterInstanceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.RegisterInstanceResponse) => void): Request<ServiceDiscovery.Types.RegisterInstanceResponse, AWSError>;
  /**
   * Creates or updates one or more records and optionally a health check based on the settings in a specified service. When you submit a RegisterInstance request, Amazon Route 53 does the following:   For each DNS record that you define in the service specified by ServiceId, creates or updates a record in the hosted zone that is associated with the corresponding namespace   If the service includes HealthCheckConfig, creates or updates a health check based on the settings in the health check configuration   Associates the health check, if any, with each of the records    One RegisterInstance request must complete before you can submit another request and specify the same service ID and instance ID.  For more information, see CreateService. When Route 53 receives a DNS query for the specified DNS name, it returns the applicable value:    If the health check is healthy: returns all the records    If the health check is unhealthy: returns the applicable value for the last healthy instance    If you didn't specify a health check configuration: returns all the records   For the current limit on the number of instances that you can register using the same namespace and using the same service, see Limits on Auto Naming in the Route 53 Developer Guide.
   */
  registerInstance(callback?: (err: AWSError, data: ServiceDiscovery.Types.RegisterInstanceResponse) => void): Request<ServiceDiscovery.Types.RegisterInstanceResponse, AWSError>;
  /**
   * 
   */
  updateInstanceCustomHealthStatus(params: ServiceDiscovery.Types.UpdateInstanceCustomHealthStatusRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * 
   */
  updateInstanceCustomHealthStatus(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Submits a request to perform the following operations:   Add or delete DnsRecords configurations   Update the TTL setting for existing DnsRecords configurations   Add, update, or delete HealthCheckConfig for a specified service   You must specify all DnsRecords configurations (and, optionally, HealthCheckConfig) that you want to appear in the updated service. Any current configurations that don't appear in an UpdateService request are deleted. When you update the TTL setting for a service, Amazon Route 53 also updates the corresponding settings in all the records and health checks that were created by using the specified service.
   */
  updateService(params: ServiceDiscovery.Types.UpdateServiceRequest, callback?: (err: AWSError, data: ServiceDiscovery.Types.UpdateServiceResponse) => void): Request<ServiceDiscovery.Types.UpdateServiceResponse, AWSError>;
  /**
   * Submits a request to perform the following operations:   Add or delete DnsRecords configurations   Update the TTL setting for existing DnsRecords configurations   Add, update, or delete HealthCheckConfig for a specified service   You must specify all DnsRecords configurations (and, optionally, HealthCheckConfig) that you want to appear in the updated service. Any current configurations that don't appear in an UpdateService request are deleted. When you update the TTL setting for a service, Amazon Route 53 also updates the corresponding settings in all the records and health checks that were created by using the specified service.
   */
  updateService(callback?: (err: AWSError, data: ServiceDiscovery.Types.UpdateServiceResponse) => void): Request<ServiceDiscovery.Types.UpdateServiceResponse, AWSError>;
}
declare namespace ServiceDiscovery {
  export type Arn = string;
  export type AttrKey = string;
  export type AttrValue = string;
  export type Attributes = {[key: string]: AttrValue};
  export type Code = string;
  export interface CreatePrivateDnsNamespaceRequest {
    /**
     * The name that you want to assign to this namespace. When you create a namespace, Amazon Route 53 automatically creates a hosted zone that has the same name as the namespace.
     */
    Name: NamespaceName;
    /**
     * A unique string that identifies the request and that allows failed CreatePrivateDnsNamespace requests to be retried without the risk of executing the operation twice. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
    /**
     * A description for the namespace.
     */
    Description?: ResourceDescription;
    /**
     * The ID of the Amazon VPC that you want to associate the namespace with.
     */
    Vpc: ResourceId;
  }
  export interface CreatePrivateDnsNamespaceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. To get the status of the operation, see GetOperation.
     */
    OperationId?: OperationId;
  }
  export interface CreatePublicDnsNamespaceRequest {
    /**
     * The name that you want to assign to this namespace.
     */
    Name: NamespaceName;
    /**
     * A unique string that identifies the request and that allows failed CreatePublicDnsNamespace requests to be retried without the risk of executing the operation twice. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
    /**
     * A description for the namespace.
     */
    Description?: ResourceDescription;
  }
  export interface CreatePublicDnsNamespaceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. To get the status of the operation, see GetOperation.
     */
    OperationId?: OperationId;
  }
  export interface CreateServiceRequest {
    /**
     * The name that you want to assign to the service.
     */
    Name: ServiceName;
    /**
     * A unique string that identifies the request and that allows failed CreateService requests to be retried without the risk of executing the operation twice. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
    /**
     * A description for the service.
     */
    Description?: ResourceDescription;
    /**
     * A complex type that contains information about the records that you want Route 53 to create when you register an instance. 
     */
    DnsConfig: DnsConfig;
    /**
     *  Public DNS namespaces only. A complex type that contains settings for an optional health check. If you specify settings for a health check, Route 53 associates the health check with all the records that you specify in DnsConfig. For information about the charges for health checks, see Route 53 Pricing.
     */
    HealthCheckConfig?: HealthCheckConfig;
    HealthCheckCustomConfig?: HealthCheckCustomConfig;
  }
  export interface CreateServiceResponse {
    /**
     * A complex type that contains information about the new service.
     */
    Service?: Service;
  }
  export type CustomHealthStatus = "HEALTHY"|"UNHEALTHY"|string;
  export interface DeleteNamespaceRequest {
    /**
     * The ID of the namespace that you want to delete.
     */
    Id: ResourceId;
  }
  export interface DeleteNamespaceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. To get the status of the operation, see GetOperation.
     */
    OperationId?: OperationId;
  }
  export interface DeleteServiceRequest {
    /**
     * The ID of the service that you want to delete.
     */
    Id: ResourceId;
  }
  export interface DeleteServiceResponse {
  }
  export interface DeregisterInstanceRequest {
    /**
     * The ID of the service that the instance is associated with.
     */
    ServiceId: ResourceId;
    /**
     * The value that you specified for Id in the RegisterInstance request.
     */
    InstanceId: ResourceId;
  }
  export interface DeregisterInstanceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. For more information, see GetOperation.
     */
    OperationId?: OperationId;
  }
  export interface DnsConfig {
    /**
     * The ID of the namespace to use for DNS configuration.
     */
    NamespaceId: ResourceId;
    /**
     * The routing policy that you want to apply to all records that Route 53 creates when you register an instance and specify this service.  If you want to use this service to register instances that create alias records, specify WEIGHTED for the routing policy.  You can specify the following values:  MULTIVALUE  If you define a health check for the service and the health check is healthy, Route 53 returns the applicable value for up to eight instances. For example, suppose the service includes configurations for one A record and a health check, and you use the service to register 10 instances. Route 53 responds to DNS queries with IP addresses for up to eight healthy instances. If fewer than eight instances are healthy, Route 53 responds to every DNS query with the IP addresses for all of the healthy instances. If you don't define a health check for the service, Route 53 assumes that all instances are healthy and returns the values for up to eight instances. For more information about the multivalue routing policy, see Multivalue Answer Routing in the Route 53 Developer Guide.  WEIGHTED  Route 53 returns the applicable value from one randomly selected instance from among the instances that you registered using the same service. Currently, all records have the same weight, so you can't route more or less traffic to any instances. For example, suppose the service includes configurations for one A record and a health check, and you use the service to register 10 instances. Route 53 responds to DNS queries with the IP address for one randomly selected instance from among the healthy instances. If no instances are healthy, Route 53 responds to DNS queries as if all of the instances were healthy. If you don't define a health check for the service, Route 53 assumes that all instances are healthy and returns the applicable value for one randomly selected instance. For more information about the weighted routing policy, see Weighted Routing in the Route 53 Developer Guide.
     */
    RoutingPolicy?: RoutingPolicy;
    /**
     * An array that contains one DnsRecord object for each record that you want Route 53 to create when you register an instance.
     */
    DnsRecords: DnsRecordList;
  }
  export interface DnsConfigChange {
    /**
     * An array that contains one DnsRecord object for each record that you want Route 53 to create when you register an instance.
     */
    DnsRecords: DnsRecordList;
  }
  export interface DnsProperties {
    /**
     * The ID for the hosted zone that Route 53 creates when you create a namespace.
     */
    HostedZoneId?: ResourceId;
  }
  export interface DnsRecord {
    /**
     * The type of the resource, which indicates the type of value that Route 53 returns in response to DNS queries. Note the following:    A, AAAA, and SRV records: You can specify settings for a maximum of one A, one AAAA, and one SRV record. You can specify them in any combination.     CNAME records: If you specify CNAME for Type, you can't define any other records. This is a limitation of DNS—you can't create a CNAME record and any other type of record that has the same name as a CNAME record.    Alias records: If you want Route 53 to create an alias record when you register an instance, specify A or AAAA for Type.    All records: You specify settings other than TTL and Type when you register an instance.   The following values are supported:  A  Route 53 returns the IP address of the resource in IPv4 format, such as 192.0.2.44.  AAAA  Route 53 returns the IP address of the resource in IPv6 format, such as 2001:0db8:85a3:0000:0000:abcd:0001:2345.  CNAME  Route 53 returns the domain name of the resource, such as www.example.com. Note the following:   You specify the domain name that you want to route traffic to when you register an instance. For more information, see RegisterInstanceRequest$Attributes.   You must specify WEIGHTED for the value of RoutingPolicy.   You can't specify both CNAME for Type and settings for HealthCheckConfig. If you do, the request will fail with an InvalidInput error.    SRV  Route 53 returns the value for an SRV record. The value for an SRV record uses the following values:  priority weight port service-hostname  Note the following about the values:   The values of priority and weight are both set to 1 and can't be changed.    The value of port comes from the value that you specify for the AWS_INSTANCE_PORT attribute when you submit a RegisterInstance request.    The value of service-hostname is a concatenation of the following values:   The value that you specify for InstanceId when you register an instance.   The name of the service.   The name of the namespace.    For example, if the value of InstanceId is test, the name of the service is backend, and the name of the namespace is example.com, the value of service-hostname is:  test.backend.example.com    If you specify settings for an SRV record and if you specify values for AWS_INSTANCE_IPV4, AWS_INSTANCE_IPV6, or both in the RegisterInstance request, Route 53 automatically creates A and/or AAAA records that have the same name as the value of service-hostname in the SRV record. You can ignore these records.
     */
    Type: RecordType;
    /**
     * The amount of time, in seconds, that you want DNS resolvers to cache the settings for this record.  Alias records don't include a TTL because Route 53 uses the TTL for the AWS resource that an alias record routes traffic to. If you include the AWS_ALIAS_DNS_NAME attribute when you submit a RegisterInstance request, the TTL value is ignored. Always specify a TTL for the service; you can use a service to register instances that create either alias or non-alias records. 
     */
    TTL: RecordTTL;
  }
  export type DnsRecordList = DnsRecord[];
  export type FailureThreshold = number;
  export type FilterCondition = "EQ"|"IN"|"BETWEEN"|string;
  export type FilterValue = string;
  export type FilterValues = FilterValue[];
  export interface GetInstanceRequest {
    /**
     * The ID of the service that the instance is associated with.
     */
    ServiceId: ResourceId;
    /**
     * The ID of the instance that you want to get information about.
     */
    InstanceId: ResourceId;
  }
  export interface GetInstanceResponse {
    /**
     * A complex type that contains information about a specified instance.
     */
    Instance?: Instance;
  }
  export interface GetInstancesHealthStatusRequest {
    /**
     * The ID of the service that the instance is associated with.
     */
    ServiceId: ResourceId;
    /**
     * An array that contains the IDs of all the instances that you want to get the health status for. If you omit Instances, Amazon Route 53 returns the health status for all the instances that are associated with the specified service.  To get the IDs for the instances that you've registered by using a specified service, submit a ListInstances request. 
     */
    Instances?: InstanceIdList;
    /**
     * The maximum number of instances that you want Route 53 to return in the response to a GetInstancesHealthStatus request. If you don't specify a value for MaxResults, Route 53 returns up to 100 instances.
     */
    MaxResults?: MaxResults;
    /**
     * For the first GetInstancesHealthStatus request, omit this value. If more than MaxResults instances match the specified criteria, you can submit another GetInstancesHealthStatus request to get the next group of results. Specify the value of NextToken from the previous response in the next request.
     */
    NextToken?: NextToken;
  }
  export interface GetInstancesHealthStatusResponse {
    /**
     * A complex type that contains the IDs and the health status of the instances that you specified in the GetInstancesHealthStatus request.
     */
    Status?: InstanceHealthStatusMap;
    /**
     * If more than MaxResults instances match the specified criteria, you can submit another GetInstancesHealthStatus request to get the next group of results. Specify the value of NextToken from the previous response in the next request.
     */
    NextToken?: NextToken;
  }
  export interface GetNamespaceRequest {
    /**
     * The ID of the namespace that you want to get information about.
     */
    Id: ResourceId;
  }
  export interface GetNamespaceResponse {
    /**
     * A complex type that contains information about the specified namespace.
     */
    Namespace?: Namespace;
  }
  export interface GetOperationRequest {
    /**
     * The ID of the operation that you want to get more information about.
     */
    OperationId: ResourceId;
  }
  export interface GetOperationResponse {
    /**
     * A complex type that contains information about the operation.
     */
    Operation?: Operation;
  }
  export interface GetServiceRequest {
    /**
     * The ID of the service that you want to get settings for.
     */
    Id: ResourceId;
  }
  export interface GetServiceResponse {
    /**
     * A complex type that contains information about the service.
     */
    Service?: Service;
  }
  export interface HealthCheckConfig {
    /**
     * The type of health check that you want to create, which indicates how Route 53 determines whether an endpoint is healthy.  You can't change the value of Type after you create a health check.  You can create the following types of health checks:    HTTP: Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTP request and waits for an HTTP status code of 200 or greater and less than 400.    HTTPS: Route 53 tries to establish a TCP connection. If successful, Route 53 submits an HTTPS request and waits for an HTTP status code of 200 or greater and less than 400.  If you specify HTTPS for the value of Type, the endpoint must support TLS v1.0 or later.     TCP: Route 53 tries to establish a TCP connection.   For more information, see How Route 53 Determines Whether an Endpoint Is Healthy in the Route 53 Developer Guide.
     */
    Type?: HealthCheckType;
    /**
     * The path that you want Route 53 to request when performing health checks. The path can be any value for which your endpoint will return an HTTP status code of 2xx or 3xx when the endpoint is healthy, such as the file /docs/route53-health-check.html. Route 53 automatically adds the DNS name for the service and a leading forward slash (/) character. 
     */
    ResourcePath?: ResourcePath;
    /**
     * The number of consecutive health checks that an endpoint must pass or fail for Route 53 to change the current status of the endpoint from unhealthy to healthy or vice versa. For more information, see How Route 53 Determines Whether an Endpoint Is Healthy in the Route 53 Developer Guide.
     */
    FailureThreshold?: FailureThreshold;
  }
  export interface HealthCheckCustomConfig {
    FailureThreshold?: FailureThreshold;
  }
  export type HealthCheckType = "HTTP"|"HTTPS"|"TCP"|string;
  export type HealthStatus = "HEALTHY"|"UNHEALTHY"|"UNKNOWN"|string;
  export interface Instance {
    /**
     * An identifier that you want to associate with the instance. Note the following:   If the service that is specified by ServiceId includes settings for an SRV record, the value of InstanceId is automatically included as part of the value for the SRV record. For more information, see DnsRecord$Type.   You can use this value to update an existing instance.   To register a new instance, you must specify a value that is unique among instances that you register by using the same service.    If you specify an existing InstanceId and ServiceId, Route 53 updates the existing records. If there's also an existing health check, Route 53 deletes the old health check and creates a new one.   The health check isn't deleted immediately, so it will still appear for a while if you submit a ListHealthChecks request, for example.   
     */
    Id: ResourceId;
    /**
     * A unique string that identifies the request and that allows failed RegisterInstance requests to be retried without the risk of executing the operation twice. You must use a unique CreatorRequestId string every time you submit a RegisterInstance request if you're registering additional instances for the same namespace and service. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
    /**
     * A string map that contains the following information for the service that you specify in ServiceId:   The attributes that apply to the records that are defined in the service.    For each attribute, the applicable value.   Supported attribute keys include the following:  AWS_ALIAS_DNS_NAME     If you want Route 53 to create an alias record that routes traffic to an Elastic Load Balancing load balancer, specify the DNS name that is associated with the load balancer. For information about how to get the DNS name, see "DNSName" in the topic AliasTarget. Note the following:   The configuration for the service that is specified by ServiceId must include settings for an A record, an AAAA record, or both.   In the service that is specified by ServiceId, the value of RoutingPolicy must be WEIGHTED.   If the service that is specified by ServiceId includes HealthCheckConfig settings, Route 53 will create the health check, but it won't associate the health check with the alias record.   Auto naming currently doesn't support creating alias records that route traffic to AWS resources other than ELB load balancers.   If you specify a value for AWS_ALIAS_DNS_NAME, don't specify values for any of the AWS_INSTANCE attributes.    AWS_INSTANCE_CNAME  If the service configuration includes a CNAME record, the domain name that you want Route 53 to return in response to DNS queries, for example, example.com. This value is required if the service specified by ServiceId includes settings for an CNAME record.  AWS_INSTANCE_IPV4  If the service configuration includes an A record, the IPv4 address that you want Route 53 to return in response to DNS queries, for example, 192.0.2.44. This value is required if the service specified by ServiceId includes settings for an A record. If the service includes settings for an SRV record, you must specify a value for AWS_INSTANCE_IPV4, AWS_INSTANCE_IPV6, or both.  AWS_INSTANCE_IPV6  If the service configuration includes an AAAA record, the IPv6 address that you want Route 53 to return in response to DNS queries, for example, 2001:0db8:85a3:0000:0000:abcd:0001:2345. This value is required if the service specified by ServiceId includes settings for an AAAA record. If the service includes settings for an SRV record, you must specify a value for AWS_INSTANCE_IPV4, AWS_INSTANCE_IPV6, or both.  AWS_INSTANCE_PORT  If the service includes an SRV record, the value that you want Route 53 to return for the port. If the service includes HealthCheckConfig, the port on the endpoint that you want Route 53 to send requests to.  This value is required if you specified settings for an SRV record when you created the service.
     */
    Attributes?: Attributes;
  }
  export type InstanceHealthStatusMap = {[key: string]: HealthStatus};
  export type InstanceIdList = ResourceId[];
  export interface InstanceSummary {
    /**
     * The ID for an instance that you created by using a specified service.
     */
    Id?: ResourceId;
    /**
     * A string map that contains the following information:   The attributes that are associate with the instance.    For each attribute, the applicable value.   Supported attribute keys include the following:    AWS_ALIAS_DNS_NAME: For an alias record that routes traffic to an Elastic Load Balancing load balancer, the DNS name that is associated with the load balancer.     AWS_INSTANCE_CNAME: For a CNAME record, the domain name that Route 53 returns in response to DNS queries, for example, example.com.    AWS_INSTANCE_IPV4: For an A record, the IPv4 address that Route 53 returns in response to DNS queries, for example, 192.0.2.44.    AWS_INSTANCE_IPV6: For an AAAA record, the IPv6 address that Route 53 returns in response to DNS queries, for example, 2001:0db8:85a3:0000:0000:abcd:0001:2345.    AWS_INSTANCE_PORT: For an SRV record, the value that Route 53 returns for the port. In addition, if the service includes HealthCheckConfig, the port on the endpoint that Route 53 sends requests to.  
     */
    Attributes?: Attributes;
  }
  export type InstanceSummaryList = InstanceSummary[];
  export interface ListInstancesRequest {
    /**
     * The ID of the service that you want to list instances for.
     */
    ServiceId: ResourceId;
    /**
     * For the first ListInstances request, omit this value. If more than MaxResults instances match the specified criteria, you can submit another ListInstances request to get the next group of results. Specify the value of NextToken from the previous response in the next request.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of instances that you want Amazon Route 53 to return in the response to a ListInstances request. If you don't specify a value for MaxResults, Route 53 returns up to 100 instances.
     */
    MaxResults?: MaxResults;
  }
  export interface ListInstancesResponse {
    /**
     * Summary information about the instances that are associated with the specified service.
     */
    Instances?: InstanceSummaryList;
    /**
     * If more than MaxResults instances match the specified criteria, you can submit another ListInstances request to get the next group of results. Specify the value of NextToken from the previous response in the next request.
     */
    NextToken?: NextToken;
  }
  export interface ListNamespacesRequest {
    /**
     * For the first ListNamespaces request, omit this value. If the response contains NextToken, submit another ListNamespaces request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults namespaces and then filters them based on the specified criteria. It's possible that no namespaces in the first MaxResults namespaces matched the specified criteria but that subsequent groups of MaxResults namespaces do contain namespaces that match the criteria. 
     */
    NextToken?: NextToken;
    /**
     * The maximum number of namespaces that you want Amazon Route 53 to return in the response to a ListNamespaces request. If you don't specify a value for MaxResults, Route 53 returns up to 100 namespaces.
     */
    MaxResults?: MaxResults;
    /**
     * A complex type that contains specifications for the namespaces that you want to list. If you specify more than one filter, a namespace must match all filters to be returned by ListNamespaces.
     */
    Filters?: NamespaceFilters;
  }
  export interface ListNamespacesResponse {
    /**
     * An array that contains one NamespaceSummary object for each namespace that matches the specified filter criteria.
     */
    Namespaces?: NamespaceSummariesList;
    /**
     * If the response contains NextToken, submit another ListNamespaces request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults namespaces and then filters them based on the specified criteria. It's possible that no namespaces in the first MaxResults namespaces matched the specified criteria but that subsequent groups of MaxResults namespaces do contain namespaces that match the criteria. 
     */
    NextToken?: NextToken;
  }
  export interface ListOperationsRequest {
    /**
     * For the first ListOperations request, omit this value. If the response contains NextToken, submit another ListOperations request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults operations and then filters them based on the specified criteria. It's possible that no operations in the first MaxResults operations matched the specified criteria but that subsequent groups of MaxResults operations do contain operations that match the criteria. 
     */
    NextToken?: NextToken;
    /**
     * The maximum number of items that you want Amazon Route 53 to return in the response to a ListOperations request. If you don't specify a value for MaxResults, Route 53 returns up to 100 operations.
     */
    MaxResults?: MaxResults;
    /**
     * A complex type that contains specifications for the operations that you want to list, for example, operations that you started between a specified start date and end date. If you specify more than one filter, an operation must match all filters to be returned by ListOperations.
     */
    Filters?: OperationFilters;
  }
  export interface ListOperationsResponse {
    /**
     * Summary information about the operations that match the specified criteria.
     */
    Operations?: OperationSummaryList;
    /**
     * If the response contains NextToken, submit another ListOperations request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults operations and then filters them based on the specified criteria. It's possible that no operations in the first MaxResults operations matched the specified criteria but that subsequent groups of MaxResults operations do contain operations that match the criteria. 
     */
    NextToken?: NextToken;
  }
  export interface ListServicesRequest {
    /**
     * For the first ListServices request, omit this value. If the response contains NextToken, submit another ListServices request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults services and then filters them based on the specified criteria. It's possible that no services in the first MaxResults services matched the specified criteria but that subsequent groups of MaxResults services do contain services that match the criteria. 
     */
    NextToken?: NextToken;
    /**
     * The maximum number of services that you want Amazon Route 53 to return in the response to a ListServices request. If you don't specify a value for MaxResults, Route 53 returns up to 100 services.
     */
    MaxResults?: MaxResults;
    /**
     * A complex type that contains specifications for the namespaces that you want to list services for.  If you specify more than one filter, an operation must match all filters to be returned by ListServices.
     */
    Filters?: ServiceFilters;
  }
  export interface ListServicesResponse {
    /**
     * An array that contains one ServiceSummary object for each service that matches the specified filter criteria.
     */
    Services?: ServiceSummariesList;
    /**
     * If the response contains NextToken, submit another ListServices request to get the next group of results. Specify the value of NextToken from the previous response in the next request.  Route 53 gets MaxResults services and then filters them based on the specified criteria. It's possible that no services in the first MaxResults services matched the specified criteria but that subsequent groups of MaxResults services do contain services that match the criteria. 
     */
    NextToken?: NextToken;
  }
  export type MaxResults = number;
  export type Message = string;
  export interface Namespace {
    /**
     * The ID of a namespace.
     */
    Id?: ResourceId;
    /**
     * The Amazon Resource Name (ARN) that Route 53 assigns to the namespace when you create it.
     */
    Arn?: Arn;
    /**
     * The name of the namespace, such as example.com.
     */
    Name?: NamespaceName;
    /**
     * The type of the namespace. Valid values are DNS_PUBLIC and DNS_PRIVATE.
     */
    Type?: NamespaceType;
    /**
     * The description that you specify for the namespace when you create it.
     */
    Description?: ResourceDescription;
    /**
     * The number of services that are associated with the namespace.
     */
    ServiceCount?: ResourceCount;
    /**
     * A complex type that contains information that's specific to the type of the namespace.
     */
    Properties?: NamespaceProperties;
    /**
     * The date that the namespace was created, in Unix date/time format and Coordinated Universal Time (UTC). The value of CreateDate is accurate to milliseconds. For example, the value 1516925490.087 represents Friday, January 26, 2018 12:11:30.087 AM.
     */
    CreateDate?: Timestamp;
    /**
     * A unique string that identifies the request and that allows failed requests to be retried without the risk of executing an operation twice. 
     */
    CreatorRequestId?: ResourceId;
  }
  export interface NamespaceFilter {
    /**
     * Specify TYPE.
     */
    Name: NamespaceFilterName;
    /**
     * If you specify EQ for Condition, specify either DNS_PUBLIC or DNS_PRIVATE. If you specify IN for Condition, you can specify DNS_PUBLIC, DNS_PRIVATE, or both.
     */
    Values: FilterValues;
    /**
     * The operator that you want to use to determine whether ListNamespaces returns a namespace. Valid values for condition include:    EQ: When you specify EQ for the condition, you can choose to list only public namespaces or private namespaces, but not both. EQ is the default condition and can be omitted.    IN: When you specify IN for the condition, you can choose to list public namespaces, private namespaces, or both.     BETWEEN: Not applicable  
     */
    Condition?: FilterCondition;
  }
  export type NamespaceFilterName = "TYPE"|string;
  export type NamespaceFilters = NamespaceFilter[];
  export type NamespaceName = string;
  export interface NamespaceProperties {
    /**
     * A complex type that contains the ID for the hosted zone that Route 53 creates when you create a namespace.
     */
    DnsProperties?: DnsProperties;
  }
  export type NamespaceSummariesList = NamespaceSummary[];
  export interface NamespaceSummary {
    /**
     * The ID of the namespace.
     */
    Id?: ResourceId;
    /**
     * The Amazon Resource Name (ARN) that Route 53 assigns to the namespace when you create it.
     */
    Arn?: Arn;
    /**
     * The name of the namespace. When you create a namespace, Route 53 automatically creates a hosted zone that has the same name as the namespace.
     */
    Name?: NamespaceName;
    /**
     * The type of the namespace, either public or private.
     */
    Type?: NamespaceType;
  }
  export type NamespaceType = "DNS_PUBLIC"|"DNS_PRIVATE"|string;
  export type NextToken = string;
  export interface Operation {
    /**
     * The ID of the operation that you want to get information about.
     */
    Id?: OperationId;
    /**
     * The name of the operation that is associated with the specified ID.
     */
    Type?: OperationType;
    /**
     * The status of the operation. Values include the following:    SUBMITTED: This is the initial state immediately after you submit a request.    PENDING: Route 53 is performing the operation.    SUCCESS: The operation succeeded.    FAIL: The operation failed. For the failure reason, see ErrorMessage.  
     */
    Status?: OperationStatus;
    /**
     * If the value of Status is FAIL, the reason that the operation failed.
     */
    ErrorMessage?: Message;
    /**
     * The code associated with ErrorMessage. Values for ErrorCode include the following:    ACCESS_DENIED     CANNOT_CREATE_HOSTED_ZONE     EXPIRED_TOKEN     HOSTED_ZONE_NOT_FOUND     INTERNAL_FAILURE     INVALID_CHANGE_BATCH     THROTTLED_REQUEST   
     */
    ErrorCode?: Code;
    /**
     * The date and time that the request was submitted, in Unix date/time format and Coordinated Universal Time (UTC). The value of CreateDate is accurate to milliseconds. For example, the value 1516925490.087 represents Friday, January 26, 2018 12:11:30.087 AM.
     */
    CreateDate?: Timestamp;
    /**
     * The date and time that the value of Status changed to the current value, in Unix date/time format and Coordinated Universal Time (UTC). The value of UpdateDate is accurate to milliseconds. For example, the value 1516925490.087 represents Friday, January 26, 2018 12:11:30.087 AM.
     */
    UpdateDate?: Timestamp;
    /**
     * The name of the target entity that is associated with the operation:    NAMESPACE: The namespace ID is returned in the ResourceId property.    SERVICE: The service ID is returned in the ResourceId property.    INSTANCE: The instance ID is returned in the ResourceId property.  
     */
    Targets?: OperationTargetsMap;
  }
  export interface OperationFilter {
    /**
     * Specify the operations that you want to get:    NAMESPACE_ID: Gets operations related to specified namespaces.    SERVICE_ID: Gets operations related to specified services.    STATUS: Gets operations based on the status of the operations: SUBMITTED, PENDING, SUCCEED, or FAIL.    TYPE: Gets specified types of operation.    UPDATE_DATE: Gets operations that changed status during a specified date/time range.   
     */
    Name: OperationFilterName;
    /**
     * Specify values that are applicable to the value that you specify for Name:     NAMESPACE_ID: Specify one namespace ID.    SERVICE_ID: Specify one service ID.    STATUS: Specify one or more statuses: SUBMITTED, PENDING, SUCCEED, or FAIL.    TYPE: Specify one or more of the following types: CREATE_NAMESPACE, DELETE_NAMESPACE, UPDATE_SERVICE, REGISTER_INSTANCE, or DEREGISTER_INSTANCE.    UPDATE_DATE: Specify a start date and an end date in Unix date/time format and Coordinated Universal Time (UTC). The start date must be the first value.  
     */
    Values: FilterValues;
    /**
     * The operator that you want to use to determine whether an operation matches the specified value. Valid values for condition include:    EQ: When you specify EQ for the condition, you can specify only one value. EQ is supported for NAMESPACE_ID, SERVICE_ID, STATUS, and TYPE. EQ is the default condition and can be omitted.    IN: When you specify IN for the condition, you can specify a list of one or more values. IN is supported for STATUS and TYPE. An operation must match one of the specified values to be returned in the response.    BETWEEN: Specify a start date and an end date in Unix date/time format and Coordinated Universal Time (UTC). The start date must be the first value. BETWEEN is supported for UPDATE_DATE.   
     */
    Condition?: FilterCondition;
  }
  export type OperationFilterName = "NAMESPACE_ID"|"SERVICE_ID"|"STATUS"|"TYPE"|"UPDATE_DATE"|string;
  export type OperationFilters = OperationFilter[];
  export type OperationId = string;
  export type OperationStatus = "SUBMITTED"|"PENDING"|"SUCCESS"|"FAIL"|string;
  export interface OperationSummary {
    /**
     * The ID for an operation.
     */
    Id?: OperationId;
    /**
     * The status of the operation. Values include the following:    SUBMITTED: This is the initial state immediately after you submit a request.    PENDING: Route 53 is performing the operation.    SUCCESS: The operation succeeded.    FAIL: The operation failed. For the failure reason, see ErrorMessage.  
     */
    Status?: OperationStatus;
  }
  export type OperationSummaryList = OperationSummary[];
  export type OperationTargetType = "NAMESPACE"|"SERVICE"|"INSTANCE"|string;
  export type OperationTargetsMap = {[key: string]: ResourceId};
  export type OperationType = "CREATE_NAMESPACE"|"DELETE_NAMESPACE"|"UPDATE_SERVICE"|"REGISTER_INSTANCE"|"DEREGISTER_INSTANCE"|string;
  export type RecordTTL = number;
  export type RecordType = "SRV"|"A"|"AAAA"|"CNAME"|string;
  export interface RegisterInstanceRequest {
    /**
     * The ID of the service that you want to use for settings for the records and health check that Route 53 will create.
     */
    ServiceId: ResourceId;
    /**
     * An identifier that you want to associate with the instance. Note the following:   If the service that is specified by ServiceId includes settings for an SRV record, the value of InstanceId is automatically included as part of the value for the SRV record. For more information, see DnsRecord$Type.   You can use this value to update an existing instance.   To register a new instance, you must specify a value that is unique among instances that you register by using the same service.    If you specify an existing InstanceId and ServiceId, Route 53 updates the existing records. If there's also an existing health check, Route 53 deletes the old health check and creates a new one.   The health check isn't deleted immediately, so it will still appear for a while if you submit a ListHealthChecks request, for example.   
     */
    InstanceId: ResourceId;
    /**
     * A unique string that identifies the request and that allows failed RegisterInstance requests to be retried without the risk of executing the operation twice. You must use a unique CreatorRequestId string every time you submit a RegisterInstance request if you're registering additional instances for the same namespace and service. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
    /**
     * A string map that contains the following information for the service that you specify in ServiceId:   The attributes that apply to the records that are defined in the service.    For each attribute, the applicable value.   Supported attribute keys include the following:  AWS_ALIAS_DNS_NAME     If you want Route 53 to create an alias record that routes traffic to an Elastic Load Balancing load balancer, specify the DNS name that is associated with the load balancer. For information about how to get the DNS name, see "DNSName" in the topic AliasTarget. Note the following:   The configuration for the service that is specified by ServiceId must include settings for an A record, an AAAA record, or both.   In the service that is specified by ServiceId, the value of RoutingPolicy must be WEIGHTED.   If the service that is specified by ServiceId includes HealthCheckConfig settings, Route 53 will create the health check, but it won't associate the health check with the alias record.   Auto naming currently doesn't support creating alias records that route traffic to AWS resources other than ELB load balancers.   If you specify a value for AWS_ALIAS_DNS_NAME, don't specify values for any of the AWS_INSTANCE attributes.    AWS_INSTANCE_CNAME  If the service configuration includes a CNAME record, the domain name that you want Route 53 to return in response to DNS queries, for example, example.com. This value is required if the service specified by ServiceId includes settings for an CNAME record.  AWS_INSTANCE_IPV4  If the service configuration includes an A record, the IPv4 address that you want Route 53 to return in response to DNS queries, for example, 192.0.2.44. This value is required if the service specified by ServiceId includes settings for an A record. If the service includes settings for an SRV record, you must specify a value for AWS_INSTANCE_IPV4, AWS_INSTANCE_IPV6, or both.  AWS_INSTANCE_IPV6  If the service configuration includes an AAAA record, the IPv6 address that you want Route 53 to return in response to DNS queries, for example, 2001:0db8:85a3:0000:0000:abcd:0001:2345. This value is required if the service specified by ServiceId includes settings for an AAAA record. If the service includes settings for an SRV record, you must specify a value for AWS_INSTANCE_IPV4, AWS_INSTANCE_IPV6, or both.  AWS_INSTANCE_PORT  If the service includes an SRV record, the value that you want Route 53 to return for the port. If the service includes HealthCheckConfig, the port on the endpoint that you want Route 53 to send requests to.  This value is required if you specified settings for an SRV record when you created the service.
     */
    Attributes: Attributes;
  }
  export interface RegisterInstanceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. To get the status of the operation, see GetOperation.
     */
    OperationId?: OperationId;
  }
  export type ResourceCount = number;
  export type ResourceDescription = string;
  export type ResourceId = string;
  export type ResourcePath = string;
  export type RoutingPolicy = "MULTIVALUE"|"WEIGHTED"|string;
  export interface Service {
    /**
     * The ID that Route 53 assigned to the service when you created it.
     */
    Id?: ResourceId;
    /**
     * The Amazon Resource Name (ARN) that Route 53 assigns to the service when you create it.
     */
    Arn?: Arn;
    /**
     * The name of the service.
     */
    Name?: ServiceName;
    /**
     * The description of the service.
     */
    Description?: ResourceDescription;
    /**
     * The number of instances that are currently associated with the service. Instances that were previously associated with the service but that have been deleted are not included in the count.
     */
    InstanceCount?: ResourceCount;
    /**
     * A complex type that contains information about the records that you want Route 53 to create when you register an instance.
     */
    DnsConfig?: DnsConfig;
    /**
     *  Public DNS namespaces only. A complex type that contains settings for an optional health check. If you specify settings for a health check, Route 53 associates the health check with all the records that you specify in DnsConfig. For information about the charges for health checks, see Route 53 Pricing.
     */
    HealthCheckConfig?: HealthCheckConfig;
    HealthCheckCustomConfig?: HealthCheckCustomConfig;
    /**
     * The date and time that the service was created, in Unix format and Coordinated Universal Time (UTC). The value of CreateDate is accurate to milliseconds. For example, the value 1516925490.087 represents Friday, January 26, 2018 12:11:30.087 AM.
     */
    CreateDate?: Timestamp;
    /**
     * A unique string that identifies the request and that allows failed requests to be retried without the risk of executing the operation twice. CreatorRequestId can be any unique string, for example, a date/time stamp.
     */
    CreatorRequestId?: ResourceId;
  }
  export interface ServiceChange {
    /**
     * A description for the service.
     */
    Description?: ResourceDescription;
    /**
     * A complex type that contains information about the records that you want Route 53 to create when you register an instance.
     */
    DnsConfig: DnsConfigChange;
    HealthCheckConfig?: HealthCheckConfig;
  }
  export interface ServiceFilter {
    /**
     * Specify NAMESPACE_ID.
     */
    Name: ServiceFilterName;
    /**
     * The values that are applicable to the value that you specify for Condition to filter the list of services.
     */
    Values: FilterValues;
    /**
     * The operator that you want to use to determine whether a service is returned by ListServices. Valid values for Condition include the following:    EQ: When you specify EQ, specify one namespace ID for Values. EQ is the default condition and can be omitted.    IN: When you specify IN, specify a list of the IDs for the namespaces that you want ListServices to return a list of services for.    BETWEEN: Not applicable.  
     */
    Condition?: FilterCondition;
  }
  export type ServiceFilterName = "NAMESPACE_ID"|string;
  export type ServiceFilters = ServiceFilter[];
  export type ServiceName = string;
  export type ServiceSummariesList = ServiceSummary[];
  export interface ServiceSummary {
    /**
     * The ID that Route 53 assigned to the service when you created it.
     */
    Id?: ResourceId;
    /**
     * The Amazon Resource Name (ARN) that Route 53 assigns to the service when you create it.
     */
    Arn?: Arn;
    /**
     * The name of the service.
     */
    Name?: ServiceName;
    /**
     * The description that you specify when you create the service.
     */
    Description?: ResourceDescription;
    /**
     * The number of instances that are currently associated with the service. Instances that were previously associated with the service but that have been deleted are not included in the count.
     */
    InstanceCount?: ResourceCount;
  }
  export type Timestamp = Date;
  export interface UpdateInstanceCustomHealthStatusRequest {
    ServiceId: ResourceId;
    InstanceId: ResourceId;
    Status: CustomHealthStatus;
  }
  export interface UpdateServiceRequest {
    /**
     * The ID of the service that you want to update.
     */
    Id: ResourceId;
    /**
     * A complex type that contains the new settings for the service.
     */
    Service: ServiceChange;
  }
  export interface UpdateServiceResponse {
    /**
     * A value that you can use to determine whether the request completed successfully. To get the status of the operation, see GetOperation.
     */
    OperationId?: OperationId;
  }
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2017-03-14"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the ServiceDiscovery client.
   */
  export import Types = ServiceDiscovery;
}
export = ServiceDiscovery;

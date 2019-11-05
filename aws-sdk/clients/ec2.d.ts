import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {WaiterConfiguration} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class EC2 extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: EC2.Types.ClientConfiguration)
  config: Config & EC2.Types.ClientConfiguration;
  /**
   * Accepts the Convertible Reserved Instance exchange quote described in the GetReservedInstancesExchangeQuote call.
   */
  acceptReservedInstancesExchangeQuote(params: EC2.Types.AcceptReservedInstancesExchangeQuoteRequest, callback?: (err: AWSError, data: EC2.Types.AcceptReservedInstancesExchangeQuoteResult) => void): Request<EC2.Types.AcceptReservedInstancesExchangeQuoteResult, AWSError>;
  /**
   * Accepts the Convertible Reserved Instance exchange quote described in the GetReservedInstancesExchangeQuote call.
   */
  acceptReservedInstancesExchangeQuote(callback?: (err: AWSError, data: EC2.Types.AcceptReservedInstancesExchangeQuoteResult) => void): Request<EC2.Types.AcceptReservedInstancesExchangeQuoteResult, AWSError>;
  /**
   * Accepts one or more interface VPC endpoint connection requests to your VPC endpoint service.
   */
  acceptVpcEndpointConnections(params: EC2.Types.AcceptVpcEndpointConnectionsRequest, callback?: (err: AWSError, data: EC2.Types.AcceptVpcEndpointConnectionsResult) => void): Request<EC2.Types.AcceptVpcEndpointConnectionsResult, AWSError>;
  /**
   * Accepts one or more interface VPC endpoint connection requests to your VPC endpoint service.
   */
  acceptVpcEndpointConnections(callback?: (err: AWSError, data: EC2.Types.AcceptVpcEndpointConnectionsResult) => void): Request<EC2.Types.AcceptVpcEndpointConnectionsResult, AWSError>;
  /**
   * Accept a VPC peering connection request. To accept a request, the VPC peering connection must be in the pending-acceptance state, and you must be the owner of the peer VPC. Use DescribeVpcPeeringConnections to view your outstanding VPC peering connection requests. For an inter-region VPC peering connection request, you must accept the VPC peering connection in the region of the accepter VPC.
   */
  acceptVpcPeeringConnection(params: EC2.Types.AcceptVpcPeeringConnectionRequest, callback?: (err: AWSError, data: EC2.Types.AcceptVpcPeeringConnectionResult) => void): Request<EC2.Types.AcceptVpcPeeringConnectionResult, AWSError>;
  /**
   * Accept a VPC peering connection request. To accept a request, the VPC peering connection must be in the pending-acceptance state, and you must be the owner of the peer VPC. Use DescribeVpcPeeringConnections to view your outstanding VPC peering connection requests. For an inter-region VPC peering connection request, you must accept the VPC peering connection in the region of the accepter VPC.
   */
  acceptVpcPeeringConnection(callback?: (err: AWSError, data: EC2.Types.AcceptVpcPeeringConnectionResult) => void): Request<EC2.Types.AcceptVpcPeeringConnectionResult, AWSError>;
  /**
   * Allocates an Elastic IP address to your AWS account. After you allocate the Elastic IP address you can associate it with an instance or network interface. After you release an Elastic IP address, it is released to the IP address pool and can be allocated to a different AWS account. [EC2-VPC] If you release an Elastic IP address, you might be able to recover it. You cannot recover an Elastic IP address that you released after it is allocated to another AWS account. You cannot recover an Elastic IP address for EC2-Classic. To attempt to recover an Elastic IP address that you released, specify it in this operation. An Elastic IP address is for use either in the EC2-Classic platform or in a VPC. By default, you can allocate 5 Elastic IP addresses for EC2-Classic per region and 5 Elastic IP addresses for EC2-VPC per region. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide.
   */
  allocateAddress(params: EC2.Types.AllocateAddressRequest, callback?: (err: AWSError, data: EC2.Types.AllocateAddressResult) => void): Request<EC2.Types.AllocateAddressResult, AWSError>;
  /**
   * Allocates an Elastic IP address to your AWS account. After you allocate the Elastic IP address you can associate it with an instance or network interface. After you release an Elastic IP address, it is released to the IP address pool and can be allocated to a different AWS account. [EC2-VPC] If you release an Elastic IP address, you might be able to recover it. You cannot recover an Elastic IP address that you released after it is allocated to another AWS account. You cannot recover an Elastic IP address for EC2-Classic. To attempt to recover an Elastic IP address that you released, specify it in this operation. An Elastic IP address is for use either in the EC2-Classic platform or in a VPC. By default, you can allocate 5 Elastic IP addresses for EC2-Classic per region and 5 Elastic IP addresses for EC2-VPC per region. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide.
   */
  allocateAddress(callback?: (err: AWSError, data: EC2.Types.AllocateAddressResult) => void): Request<EC2.Types.AllocateAddressResult, AWSError>;
  /**
   * Allocates a Dedicated Host to your account. At a minimum, specify the instance size type, Availability Zone, and quantity of hosts to allocate.
   */
  allocateHosts(params: EC2.Types.AllocateHostsRequest, callback?: (err: AWSError, data: EC2.Types.AllocateHostsResult) => void): Request<EC2.Types.AllocateHostsResult, AWSError>;
  /**
   * Allocates a Dedicated Host to your account. At a minimum, specify the instance size type, Availability Zone, and quantity of hosts to allocate.
   */
  allocateHosts(callback?: (err: AWSError, data: EC2.Types.AllocateHostsResult) => void): Request<EC2.Types.AllocateHostsResult, AWSError>;
  /**
   * Assigns one or more IPv6 addresses to the specified network interface. You can specify one or more specific IPv6 addresses, or you can specify the number of IPv6 addresses to be automatically assigned from within the subnet's IPv6 CIDR block range. You can assign as many IPv6 addresses to a network interface as you can assign private IPv4 addresses, and the limit varies per instance type. For information, see IP Addresses Per Network Interface Per Instance Type in the Amazon Elastic Compute Cloud User Guide.
   */
  assignIpv6Addresses(params: EC2.Types.AssignIpv6AddressesRequest, callback?: (err: AWSError, data: EC2.Types.AssignIpv6AddressesResult) => void): Request<EC2.Types.AssignIpv6AddressesResult, AWSError>;
  /**
   * Assigns one or more IPv6 addresses to the specified network interface. You can specify one or more specific IPv6 addresses, or you can specify the number of IPv6 addresses to be automatically assigned from within the subnet's IPv6 CIDR block range. You can assign as many IPv6 addresses to a network interface as you can assign private IPv4 addresses, and the limit varies per instance type. For information, see IP Addresses Per Network Interface Per Instance Type in the Amazon Elastic Compute Cloud User Guide.
   */
  assignIpv6Addresses(callback?: (err: AWSError, data: EC2.Types.AssignIpv6AddressesResult) => void): Request<EC2.Types.AssignIpv6AddressesResult, AWSError>;
  /**
   * Assigns one or more secondary private IP addresses to the specified network interface. You can specify one or more specific secondary IP addresses, or you can specify the number of secondary IP addresses to be automatically assigned within the subnet's CIDR block range. The number of secondary IP addresses that you can assign to an instance varies by instance type. For information about instance types, see Instance Types in the Amazon Elastic Compute Cloud User Guide. For more information about Elastic IP addresses, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. AssignPrivateIpAddresses is available only in EC2-VPC.
   */
  assignPrivateIpAddresses(params: EC2.Types.AssignPrivateIpAddressesRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Assigns one or more secondary private IP addresses to the specified network interface. You can specify one or more specific secondary IP addresses, or you can specify the number of secondary IP addresses to be automatically assigned within the subnet's CIDR block range. The number of secondary IP addresses that you can assign to an instance varies by instance type. For information about instance types, see Instance Types in the Amazon Elastic Compute Cloud User Guide. For more information about Elastic IP addresses, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. AssignPrivateIpAddresses is available only in EC2-VPC.
   */
  assignPrivateIpAddresses(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Associates an Elastic IP address with an instance or a network interface. Before you can use an Elastic IP address, you must allocate it to your account. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. [EC2-Classic, VPC in an EC2-VPC-only account] If the Elastic IP address is already associated with a different instance, it is disassociated from that instance and associated with the specified instance. If you associate an Elastic IP address with an instance that has an existing Elastic IP address, the existing address is disassociated from the instance, but remains allocated to your account. [VPC in an EC2-Classic account] If you don't specify a private IP address, the Elastic IP address is associated with the primary IP address. If the Elastic IP address is already associated with a different instance or a network interface, you get an error unless you allow reassociation. You cannot associate an Elastic IP address with an instance or network interface that has an existing Elastic IP address.  This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error, and you may be charged for each time the Elastic IP address is remapped to the same instance. For more information, see the Elastic IP Addresses section of Amazon EC2 Pricing. 
   */
  associateAddress(params: EC2.Types.AssociateAddressRequest, callback?: (err: AWSError, data: EC2.Types.AssociateAddressResult) => void): Request<EC2.Types.AssociateAddressResult, AWSError>;
  /**
   * Associates an Elastic IP address with an instance or a network interface. Before you can use an Elastic IP address, you must allocate it to your account. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. [EC2-Classic, VPC in an EC2-VPC-only account] If the Elastic IP address is already associated with a different instance, it is disassociated from that instance and associated with the specified instance. If you associate an Elastic IP address with an instance that has an existing Elastic IP address, the existing address is disassociated from the instance, but remains allocated to your account. [VPC in an EC2-Classic account] If you don't specify a private IP address, the Elastic IP address is associated with the primary IP address. If the Elastic IP address is already associated with a different instance or a network interface, you get an error unless you allow reassociation. You cannot associate an Elastic IP address with an instance or network interface that has an existing Elastic IP address.  This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error, and you may be charged for each time the Elastic IP address is remapped to the same instance. For more information, see the Elastic IP Addresses section of Amazon EC2 Pricing. 
   */
  associateAddress(callback?: (err: AWSError, data: EC2.Types.AssociateAddressResult) => void): Request<EC2.Types.AssociateAddressResult, AWSError>;
  /**
   * Associates a set of DHCP options (that you've previously created) with the specified VPC, or associates no DHCP options with the VPC. After you associate the options with the VPC, any existing instances and all new instances that you launch in that VPC use the options. You don't need to restart or relaunch the instances. They automatically pick up the changes within a few hours, depending on how frequently the instance renews its DHCP lease. You can explicitly renew the lease using the operating system on the instance. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  associateDhcpOptions(params: EC2.Types.AssociateDhcpOptionsRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Associates a set of DHCP options (that you've previously created) with the specified VPC, or associates no DHCP options with the VPC. After you associate the options with the VPC, any existing instances and all new instances that you launch in that VPC use the options. You don't need to restart or relaunch the instances. They automatically pick up the changes within a few hours, depending on how frequently the instance renews its DHCP lease. You can explicitly renew the lease using the operating system on the instance. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  associateDhcpOptions(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Associates an IAM instance profile with a running or stopped instance. You cannot associate more than one IAM instance profile with an instance.
   */
  associateIamInstanceProfile(params: EC2.Types.AssociateIamInstanceProfileRequest, callback?: (err: AWSError, data: EC2.Types.AssociateIamInstanceProfileResult) => void): Request<EC2.Types.AssociateIamInstanceProfileResult, AWSError>;
  /**
   * Associates an IAM instance profile with a running or stopped instance. You cannot associate more than one IAM instance profile with an instance.
   */
  associateIamInstanceProfile(callback?: (err: AWSError, data: EC2.Types.AssociateIamInstanceProfileResult) => void): Request<EC2.Types.AssociateIamInstanceProfileResult, AWSError>;
  /**
   * Associates a subnet with a route table. The subnet and route table must be in the same VPC. This association causes traffic originating from the subnet to be routed according to the routes in the route table. The action returns an association ID, which you need in order to disassociate the route table from the subnet later. A route table can be associated with multiple subnets. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  associateRouteTable(params: EC2.Types.AssociateRouteTableRequest, callback?: (err: AWSError, data: EC2.Types.AssociateRouteTableResult) => void): Request<EC2.Types.AssociateRouteTableResult, AWSError>;
  /**
   * Associates a subnet with a route table. The subnet and route table must be in the same VPC. This association causes traffic originating from the subnet to be routed according to the routes in the route table. The action returns an association ID, which you need in order to disassociate the route table from the subnet later. A route table can be associated with multiple subnets. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  associateRouteTable(callback?: (err: AWSError, data: EC2.Types.AssociateRouteTableResult) => void): Request<EC2.Types.AssociateRouteTableResult, AWSError>;
  /**
   * Associates a CIDR block with your subnet. You can only associate a single IPv6 CIDR block with your subnet. An IPv6 CIDR block must have a prefix length of /64.
   */
  associateSubnetCidrBlock(params: EC2.Types.AssociateSubnetCidrBlockRequest, callback?: (err: AWSError, data: EC2.Types.AssociateSubnetCidrBlockResult) => void): Request<EC2.Types.AssociateSubnetCidrBlockResult, AWSError>;
  /**
   * Associates a CIDR block with your subnet. You can only associate a single IPv6 CIDR block with your subnet. An IPv6 CIDR block must have a prefix length of /64.
   */
  associateSubnetCidrBlock(callback?: (err: AWSError, data: EC2.Types.AssociateSubnetCidrBlockResult) => void): Request<EC2.Types.AssociateSubnetCidrBlockResult, AWSError>;
  /**
   * Associates a CIDR block with your VPC. You can associate a secondary IPv4 CIDR block, or you can associate an Amazon-provided IPv6 CIDR block. The IPv6 CIDR block size is fixed at /56. For more information about associating CIDR blocks with your VPC and applicable restrictions, see VPC and Subnet Sizing in the Amazon Virtual Private Cloud User Guide.
   */
  associateVpcCidrBlock(params: EC2.Types.AssociateVpcCidrBlockRequest, callback?: (err: AWSError, data: EC2.Types.AssociateVpcCidrBlockResult) => void): Request<EC2.Types.AssociateVpcCidrBlockResult, AWSError>;
  /**
   * Associates a CIDR block with your VPC. You can associate a secondary IPv4 CIDR block, or you can associate an Amazon-provided IPv6 CIDR block. The IPv6 CIDR block size is fixed at /56. For more information about associating CIDR blocks with your VPC and applicable restrictions, see VPC and Subnet Sizing in the Amazon Virtual Private Cloud User Guide.
   */
  associateVpcCidrBlock(callback?: (err: AWSError, data: EC2.Types.AssociateVpcCidrBlockResult) => void): Request<EC2.Types.AssociateVpcCidrBlockResult, AWSError>;
  /**
   * Links an EC2-Classic instance to a ClassicLink-enabled VPC through one or more of the VPC's security groups. You cannot link an EC2-Classic instance to more than one VPC at a time. You can only link an instance that's in the running state. An instance is automatically unlinked from a VPC when it's stopped - you can link it to the VPC again when you restart it. After you've linked an instance, you cannot change the VPC security groups that are associated with it. To change the security groups, you must first unlink the instance, and then link it again. Linking your instance to a VPC is sometimes referred to as attaching your instance.
   */
  attachClassicLinkVpc(params: EC2.Types.AttachClassicLinkVpcRequest, callback?: (err: AWSError, data: EC2.Types.AttachClassicLinkVpcResult) => void): Request<EC2.Types.AttachClassicLinkVpcResult, AWSError>;
  /**
   * Links an EC2-Classic instance to a ClassicLink-enabled VPC through one or more of the VPC's security groups. You cannot link an EC2-Classic instance to more than one VPC at a time. You can only link an instance that's in the running state. An instance is automatically unlinked from a VPC when it's stopped - you can link it to the VPC again when you restart it. After you've linked an instance, you cannot change the VPC security groups that are associated with it. To change the security groups, you must first unlink the instance, and then link it again. Linking your instance to a VPC is sometimes referred to as attaching your instance.
   */
  attachClassicLinkVpc(callback?: (err: AWSError, data: EC2.Types.AttachClassicLinkVpcResult) => void): Request<EC2.Types.AttachClassicLinkVpcResult, AWSError>;
  /**
   * Attaches an internet gateway to a VPC, enabling connectivity between the internet and the VPC. For more information about your VPC and internet gateway, see the Amazon Virtual Private Cloud User Guide.
   */
  attachInternetGateway(params: EC2.Types.AttachInternetGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Attaches an internet gateway to a VPC, enabling connectivity between the internet and the VPC. For more information about your VPC and internet gateway, see the Amazon Virtual Private Cloud User Guide.
   */
  attachInternetGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Attaches a network interface to an instance.
   */
  attachNetworkInterface(params: EC2.Types.AttachNetworkInterfaceRequest, callback?: (err: AWSError, data: EC2.Types.AttachNetworkInterfaceResult) => void): Request<EC2.Types.AttachNetworkInterfaceResult, AWSError>;
  /**
   * Attaches a network interface to an instance.
   */
  attachNetworkInterface(callback?: (err: AWSError, data: EC2.Types.AttachNetworkInterfaceResult) => void): Request<EC2.Types.AttachNetworkInterfaceResult, AWSError>;
  /**
   * Attaches an EBS volume to a running or stopped instance and exposes it to the instance with the specified device name. Encrypted EBS volumes may only be attached to instances that support Amazon EBS encryption. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide. For a list of supported device names, see Attaching an EBS Volume to an Instance. Any device names that aren't reserved for instance store volumes can be used for EBS volumes. For more information, see Amazon EC2 Instance Store in the Amazon Elastic Compute Cloud User Guide. If a volume has an AWS Marketplace product code:   The volume can be attached only to a stopped instance.   AWS Marketplace product codes are copied from the volume to the instance.   You must be subscribed to the product.   The instance type and operating system of the instance must support the product. For example, you can't detach a volume from a Windows instance and attach it to a Linux instance.   For more information about EBS volumes, see Attaching Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  attachVolume(params: EC2.Types.AttachVolumeRequest, callback?: (err: AWSError, data: EC2.Types.VolumeAttachment) => void): Request<EC2.Types.VolumeAttachment, AWSError>;
  /**
   * Attaches an EBS volume to a running or stopped instance and exposes it to the instance with the specified device name. Encrypted EBS volumes may only be attached to instances that support Amazon EBS encryption. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide. For a list of supported device names, see Attaching an EBS Volume to an Instance. Any device names that aren't reserved for instance store volumes can be used for EBS volumes. For more information, see Amazon EC2 Instance Store in the Amazon Elastic Compute Cloud User Guide. If a volume has an AWS Marketplace product code:   The volume can be attached only to a stopped instance.   AWS Marketplace product codes are copied from the volume to the instance.   You must be subscribed to the product.   The instance type and operating system of the instance must support the product. For example, you can't detach a volume from a Windows instance and attach it to a Linux instance.   For more information about EBS volumes, see Attaching Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  attachVolume(callback?: (err: AWSError, data: EC2.Types.VolumeAttachment) => void): Request<EC2.Types.VolumeAttachment, AWSError>;
  /**
   * Attaches a virtual private gateway to a VPC. You can attach one virtual private gateway to one VPC at a time. For more information, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  attachVpnGateway(params: EC2.Types.AttachVpnGatewayRequest, callback?: (err: AWSError, data: EC2.Types.AttachVpnGatewayResult) => void): Request<EC2.Types.AttachVpnGatewayResult, AWSError>;
  /**
   * Attaches a virtual private gateway to a VPC. You can attach one virtual private gateway to one VPC at a time. For more information, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  attachVpnGateway(callback?: (err: AWSError, data: EC2.Types.AttachVpnGatewayResult) => void): Request<EC2.Types.AttachVpnGatewayResult, AWSError>;
  /**
   * [EC2-VPC only] Adds one or more egress rules to a security group for use with a VPC. Specifically, this action permits instances to send traffic to one or more destination IPv4 or IPv6 CIDR address ranges, or to one or more destination security groups for the same VPC. This action doesn't apply to security groups for use in EC2-Classic. For more information, see Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide. For more information about security group limits, see Amazon VPC Limits. Each rule consists of the protocol (for example, TCP), plus either a CIDR range or a source group. For the TCP and UDP protocols, you must also specify the destination port or port range. For the ICMP protocol, you must also specify the ICMP type and code. You can use -1 for the type or code to mean all types or all codes. You can optionally specify a description for the rule. Rule changes are propagated to affected instances as quickly as possible. However, a small delay might occur.
   */
  authorizeSecurityGroupEgress(params: EC2.Types.AuthorizeSecurityGroupEgressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * [EC2-VPC only] Adds one or more egress rules to a security group for use with a VPC. Specifically, this action permits instances to send traffic to one or more destination IPv4 or IPv6 CIDR address ranges, or to one or more destination security groups for the same VPC. This action doesn't apply to security groups for use in EC2-Classic. For more information, see Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide. For more information about security group limits, see Amazon VPC Limits. Each rule consists of the protocol (for example, TCP), plus either a CIDR range or a source group. For the TCP and UDP protocols, you must also specify the destination port or port range. For the ICMP protocol, you must also specify the ICMP type and code. You can use -1 for the type or code to mean all types or all codes. You can optionally specify a description for the rule. Rule changes are propagated to affected instances as quickly as possible. However, a small delay might occur.
   */
  authorizeSecurityGroupEgress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds one or more ingress rules to a security group. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur. [EC2-Classic] This action gives one or more IPv4 CIDR address ranges permission to access a security group in your account, or gives one or more security groups (called the source groups) permission to access a security group for your account. A source group can be for your own AWS account, or another. You can have up to 100 rules per group. [EC2-VPC] This action gives one or more IPv4 or IPv6 CIDR address ranges permission to access a security group in your VPC, or gives one or more other security groups (called the source groups) permission to access a security group for your VPC. The security groups must all be for the same VPC or a peer VPC in a VPC peering connection. For more information about VPC security group limits, see Amazon VPC Limits. You can optionally specify a description for the security group rule.
   */
  authorizeSecurityGroupIngress(params: EC2.Types.AuthorizeSecurityGroupIngressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds one or more ingress rules to a security group. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur. [EC2-Classic] This action gives one or more IPv4 CIDR address ranges permission to access a security group in your account, or gives one or more security groups (called the source groups) permission to access a security group for your account. A source group can be for your own AWS account, or another. You can have up to 100 rules per group. [EC2-VPC] This action gives one or more IPv4 or IPv6 CIDR address ranges permission to access a security group in your VPC, or gives one or more other security groups (called the source groups) permission to access a security group for your VPC. The security groups must all be for the same VPC or a peer VPC in a VPC peering connection. For more information about VPC security group limits, see Amazon VPC Limits. You can optionally specify a description for the security group rule.
   */
  authorizeSecurityGroupIngress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Bundles an Amazon instance store-backed Windows instance. During bundling, only the root device volume (C:\) is bundled. Data on other instance store volumes is not preserved.  This action is not applicable for Linux/Unix instances or Windows instances that are backed by Amazon EBS. 
   */
  bundleInstance(params: EC2.Types.BundleInstanceRequest, callback?: (err: AWSError, data: EC2.Types.BundleInstanceResult) => void): Request<EC2.Types.BundleInstanceResult, AWSError>;
  /**
   * Bundles an Amazon instance store-backed Windows instance. During bundling, only the root device volume (C:\) is bundled. Data on other instance store volumes is not preserved.  This action is not applicable for Linux/Unix instances or Windows instances that are backed by Amazon EBS. 
   */
  bundleInstance(callback?: (err: AWSError, data: EC2.Types.BundleInstanceResult) => void): Request<EC2.Types.BundleInstanceResult, AWSError>;
  /**
   * Cancels a bundling operation for an instance store-backed Windows instance.
   */
  cancelBundleTask(params: EC2.Types.CancelBundleTaskRequest, callback?: (err: AWSError, data: EC2.Types.CancelBundleTaskResult) => void): Request<EC2.Types.CancelBundleTaskResult, AWSError>;
  /**
   * Cancels a bundling operation for an instance store-backed Windows instance.
   */
  cancelBundleTask(callback?: (err: AWSError, data: EC2.Types.CancelBundleTaskResult) => void): Request<EC2.Types.CancelBundleTaskResult, AWSError>;
  /**
   * Cancels an active conversion task. The task can be the import of an instance or volume. The action removes all artifacts of the conversion, including a partially uploaded volume or instance. If the conversion is complete or is in the process of transferring the final disk image, the command fails and returns an exception. For more information, see Importing a Virtual Machine Using the Amazon EC2 CLI.
   */
  cancelConversionTask(params: EC2.Types.CancelConversionRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Cancels an active conversion task. The task can be the import of an instance or volume. The action removes all artifacts of the conversion, including a partially uploaded volume or instance. If the conversion is complete or is in the process of transferring the final disk image, the command fails and returns an exception. For more information, see Importing a Virtual Machine Using the Amazon EC2 CLI.
   */
  cancelConversionTask(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Cancels an active export task. The request removes all artifacts of the export, including any partially-created Amazon S3 objects. If the export task is complete or is in the process of transferring the final disk image, the command fails and returns an error.
   */
  cancelExportTask(params: EC2.Types.CancelExportTaskRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Cancels an active export task. The request removes all artifacts of the export, including any partially-created Amazon S3 objects. If the export task is complete or is in the process of transferring the final disk image, the command fails and returns an error.
   */
  cancelExportTask(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Cancels an in-process import virtual machine or import snapshot task.
   */
  cancelImportTask(params: EC2.Types.CancelImportTaskRequest, callback?: (err: AWSError, data: EC2.Types.CancelImportTaskResult) => void): Request<EC2.Types.CancelImportTaskResult, AWSError>;
  /**
   * Cancels an in-process import virtual machine or import snapshot task.
   */
  cancelImportTask(callback?: (err: AWSError, data: EC2.Types.CancelImportTaskResult) => void): Request<EC2.Types.CancelImportTaskResult, AWSError>;
  /**
   * Cancels the specified Reserved Instance listing in the Reserved Instance Marketplace. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  cancelReservedInstancesListing(params: EC2.Types.CancelReservedInstancesListingRequest, callback?: (err: AWSError, data: EC2.Types.CancelReservedInstancesListingResult) => void): Request<EC2.Types.CancelReservedInstancesListingResult, AWSError>;
  /**
   * Cancels the specified Reserved Instance listing in the Reserved Instance Marketplace. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  cancelReservedInstancesListing(callback?: (err: AWSError, data: EC2.Types.CancelReservedInstancesListingResult) => void): Request<EC2.Types.CancelReservedInstancesListingResult, AWSError>;
  /**
   * Cancels the specified Spot Fleet requests. After you cancel a Spot Fleet request, the Spot Fleet launches no new Spot Instances. You must specify whether the Spot Fleet should also terminate its Spot Instances. If you terminate the instances, the Spot Fleet request enters the cancelled_terminating state. Otherwise, the Spot Fleet request enters the cancelled_running state and the instances continue to run until they are interrupted or you terminate them manually.
   */
  cancelSpotFleetRequests(params: EC2.Types.CancelSpotFleetRequestsRequest, callback?: (err: AWSError, data: EC2.Types.CancelSpotFleetRequestsResponse) => void): Request<EC2.Types.CancelSpotFleetRequestsResponse, AWSError>;
  /**
   * Cancels the specified Spot Fleet requests. After you cancel a Spot Fleet request, the Spot Fleet launches no new Spot Instances. You must specify whether the Spot Fleet should also terminate its Spot Instances. If you terminate the instances, the Spot Fleet request enters the cancelled_terminating state. Otherwise, the Spot Fleet request enters the cancelled_running state and the instances continue to run until they are interrupted or you terminate them manually.
   */
  cancelSpotFleetRequests(callback?: (err: AWSError, data: EC2.Types.CancelSpotFleetRequestsResponse) => void): Request<EC2.Types.CancelSpotFleetRequestsResponse, AWSError>;
  /**
   * Cancels one or more Spot Instance requests.  Canceling a Spot Instance request does not terminate running Spot Instances associated with the request. 
   */
  cancelSpotInstanceRequests(params: EC2.Types.CancelSpotInstanceRequestsRequest, callback?: (err: AWSError, data: EC2.Types.CancelSpotInstanceRequestsResult) => void): Request<EC2.Types.CancelSpotInstanceRequestsResult, AWSError>;
  /**
   * Cancels one or more Spot Instance requests.  Canceling a Spot Instance request does not terminate running Spot Instances associated with the request. 
   */
  cancelSpotInstanceRequests(callback?: (err: AWSError, data: EC2.Types.CancelSpotInstanceRequestsResult) => void): Request<EC2.Types.CancelSpotInstanceRequestsResult, AWSError>;
  /**
   * Determines whether a product code is associated with an instance. This action can only be used by the owner of the product code. It is useful when a product code owner must verify whether another user's instance is eligible for support.
   */
  confirmProductInstance(params: EC2.Types.ConfirmProductInstanceRequest, callback?: (err: AWSError, data: EC2.Types.ConfirmProductInstanceResult) => void): Request<EC2.Types.ConfirmProductInstanceResult, AWSError>;
  /**
   * Determines whether a product code is associated with an instance. This action can only be used by the owner of the product code. It is useful when a product code owner must verify whether another user's instance is eligible for support.
   */
  confirmProductInstance(callback?: (err: AWSError, data: EC2.Types.ConfirmProductInstanceResult) => void): Request<EC2.Types.ConfirmProductInstanceResult, AWSError>;
  /**
   * Copies the specified Amazon FPGA Image (AFI) to the current region.
   */
  copyFpgaImage(params: EC2.Types.CopyFpgaImageRequest, callback?: (err: AWSError, data: EC2.Types.CopyFpgaImageResult) => void): Request<EC2.Types.CopyFpgaImageResult, AWSError>;
  /**
   * Copies the specified Amazon FPGA Image (AFI) to the current region.
   */
  copyFpgaImage(callback?: (err: AWSError, data: EC2.Types.CopyFpgaImageResult) => void): Request<EC2.Types.CopyFpgaImageResult, AWSError>;
  /**
   * Initiates the copy of an AMI from the specified source region to the current region. You specify the destination region by using its endpoint when making the request. Copies of encrypted backing snapshots for the AMI are encrypted. Copies of unencrypted backing snapshots remain unencrypted, unless you set Encrypted during the copy operation. You cannot create an unencrypted copy of an encrypted backing snapshot. For more information about the prerequisites and limits when copying an AMI, see Copying an AMI in the Amazon Elastic Compute Cloud User Guide.
   */
  copyImage(params: EC2.Types.CopyImageRequest, callback?: (err: AWSError, data: EC2.Types.CopyImageResult) => void): Request<EC2.Types.CopyImageResult, AWSError>;
  /**
   * Initiates the copy of an AMI from the specified source region to the current region. You specify the destination region by using its endpoint when making the request. Copies of encrypted backing snapshots for the AMI are encrypted. Copies of unencrypted backing snapshots remain unencrypted, unless you set Encrypted during the copy operation. You cannot create an unencrypted copy of an encrypted backing snapshot. For more information about the prerequisites and limits when copying an AMI, see Copying an AMI in the Amazon Elastic Compute Cloud User Guide.
   */
  copyImage(callback?: (err: AWSError, data: EC2.Types.CopyImageResult) => void): Request<EC2.Types.CopyImageResult, AWSError>;
  /**
   * Copies a point-in-time snapshot of an EBS volume and stores it in Amazon S3. You can copy the snapshot within the same region or from one region to another. You can use the snapshot to create EBS volumes or Amazon Machine Images (AMIs). The snapshot is copied to the regional endpoint that you send the HTTP request to. Copies of encrypted EBS snapshots remain encrypted. Copies of unencrypted snapshots remain unencrypted, unless the Encrypted flag is specified during the snapshot copy operation. By default, encrypted snapshot copies use the default AWS Key Management Service (AWS KMS) customer master key (CMK); however, you can specify a non-default CMK with the KmsKeyId parameter. To copy an encrypted snapshot that has been shared from another account, you must have permissions for the CMK used to encrypt the snapshot. Snapshots created by copying another snapshot have an arbitrary volume ID that should not be used for any purpose. For more information, see Copying an Amazon EBS Snapshot in the Amazon Elastic Compute Cloud User Guide.
   */
  copySnapshot(params: EC2.Types.CopySnapshotRequest, callback?: (err: AWSError, data: EC2.Types.CopySnapshotResult) => void): Request<EC2.Types.CopySnapshotResult, AWSError>;
  /**
   * Copies a point-in-time snapshot of an EBS volume and stores it in Amazon S3. You can copy the snapshot within the same region or from one region to another. You can use the snapshot to create EBS volumes or Amazon Machine Images (AMIs). The snapshot is copied to the regional endpoint that you send the HTTP request to. Copies of encrypted EBS snapshots remain encrypted. Copies of unencrypted snapshots remain unencrypted, unless the Encrypted flag is specified during the snapshot copy operation. By default, encrypted snapshot copies use the default AWS Key Management Service (AWS KMS) customer master key (CMK); however, you can specify a non-default CMK with the KmsKeyId parameter. To copy an encrypted snapshot that has been shared from another account, you must have permissions for the CMK used to encrypt the snapshot. Snapshots created by copying another snapshot have an arbitrary volume ID that should not be used for any purpose. For more information, see Copying an Amazon EBS Snapshot in the Amazon Elastic Compute Cloud User Guide.
   */
  copySnapshot(callback?: (err: AWSError, data: EC2.Types.CopySnapshotResult) => void): Request<EC2.Types.CopySnapshotResult, AWSError>;
  /**
   * Provides information to AWS about your VPN customer gateway device. The customer gateway is the appliance at your end of the VPN connection. (The device on the AWS side of the VPN connection is the virtual private gateway.) You must provide the Internet-routable IP address of the customer gateway's external interface. The IP address must be static and may be behind a device performing network address translation (NAT). For devices that use Border Gateway Protocol (BGP), you can also provide the device's BGP Autonomous System Number (ASN). You can use an existing ASN assigned to your network. If you don't have an ASN already, you can use a private ASN (in the 64512 - 65534 range).  Amazon EC2 supports all 2-byte ASN numbers in the range of 1 - 65534, with the exception of 7224, which is reserved in the us-east-1 region, and 9059, which is reserved in the eu-west-1 region.  For more information about VPN customer gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.  You cannot create more than one customer gateway with the same VPN type, IP address, and BGP ASN parameter values. If you run an identical request more than one time, the first request creates the customer gateway, and subsequent requests return information about the existing customer gateway. The subsequent requests do not create new customer gateway resources. 
   */
  createCustomerGateway(params: EC2.Types.CreateCustomerGatewayRequest, callback?: (err: AWSError, data: EC2.Types.CreateCustomerGatewayResult) => void): Request<EC2.Types.CreateCustomerGatewayResult, AWSError>;
  /**
   * Provides information to AWS about your VPN customer gateway device. The customer gateway is the appliance at your end of the VPN connection. (The device on the AWS side of the VPN connection is the virtual private gateway.) You must provide the Internet-routable IP address of the customer gateway's external interface. The IP address must be static and may be behind a device performing network address translation (NAT). For devices that use Border Gateway Protocol (BGP), you can also provide the device's BGP Autonomous System Number (ASN). You can use an existing ASN assigned to your network. If you don't have an ASN already, you can use a private ASN (in the 64512 - 65534 range).  Amazon EC2 supports all 2-byte ASN numbers in the range of 1 - 65534, with the exception of 7224, which is reserved in the us-east-1 region, and 9059, which is reserved in the eu-west-1 region.  For more information about VPN customer gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.  You cannot create more than one customer gateway with the same VPN type, IP address, and BGP ASN parameter values. If you run an identical request more than one time, the first request creates the customer gateway, and subsequent requests return information about the existing customer gateway. The subsequent requests do not create new customer gateway resources. 
   */
  createCustomerGateway(callback?: (err: AWSError, data: EC2.Types.CreateCustomerGatewayResult) => void): Request<EC2.Types.CreateCustomerGatewayResult, AWSError>;
  /**
   * Creates a default subnet with a size /20 IPv4 CIDR block in the specified Availability Zone in your default VPC. You can have only one default subnet per Availability Zone. For more information, see Creating a Default Subnet in the Amazon Virtual Private Cloud User Guide.
   */
  createDefaultSubnet(params: EC2.Types.CreateDefaultSubnetRequest, callback?: (err: AWSError, data: EC2.Types.CreateDefaultSubnetResult) => void): Request<EC2.Types.CreateDefaultSubnetResult, AWSError>;
  /**
   * Creates a default subnet with a size /20 IPv4 CIDR block in the specified Availability Zone in your default VPC. You can have only one default subnet per Availability Zone. For more information, see Creating a Default Subnet in the Amazon Virtual Private Cloud User Guide.
   */
  createDefaultSubnet(callback?: (err: AWSError, data: EC2.Types.CreateDefaultSubnetResult) => void): Request<EC2.Types.CreateDefaultSubnetResult, AWSError>;
  /**
   * Creates a default VPC with a size /16 IPv4 CIDR block and a default subnet in each Availability Zone. For more information about the components of a default VPC, see Default VPC and Default Subnets in the Amazon Virtual Private Cloud User Guide. You cannot specify the components of the default VPC yourself. If you deleted your previous default VPC, you can create a default VPC. You cannot have more than one default VPC per Region. If your account supports EC2-Classic, you cannot use this action to create a default VPC in a Region that supports EC2-Classic. If you want a default VPC in a Region that supports EC2-Classic, see "I really want a default VPC for my existing EC2 account. Is that possible?" in the Default VPCs FAQ.
   */
  createDefaultVpc(params: EC2.Types.CreateDefaultVpcRequest, callback?: (err: AWSError, data: EC2.Types.CreateDefaultVpcResult) => void): Request<EC2.Types.CreateDefaultVpcResult, AWSError>;
  /**
   * Creates a default VPC with a size /16 IPv4 CIDR block and a default subnet in each Availability Zone. For more information about the components of a default VPC, see Default VPC and Default Subnets in the Amazon Virtual Private Cloud User Guide. You cannot specify the components of the default VPC yourself. If you deleted your previous default VPC, you can create a default VPC. You cannot have more than one default VPC per Region. If your account supports EC2-Classic, you cannot use this action to create a default VPC in a Region that supports EC2-Classic. If you want a default VPC in a Region that supports EC2-Classic, see "I really want a default VPC for my existing EC2 account. Is that possible?" in the Default VPCs FAQ.
   */
  createDefaultVpc(callback?: (err: AWSError, data: EC2.Types.CreateDefaultVpcResult) => void): Request<EC2.Types.CreateDefaultVpcResult, AWSError>;
  /**
   * Creates a set of DHCP options for your VPC. After creating the set, you must associate it with the VPC, causing all existing and new instances that you launch in the VPC to use this set of DHCP options. The following are the individual DHCP options you can specify. For more information about the options, see RFC 2132.    domain-name-servers - The IP addresses of up to four domain name servers, or AmazonProvidedDNS. The default DHCP option set specifies AmazonProvidedDNS. If specifying more than one domain name server, specify the IP addresses in a single parameter, separated by commas. ITo have your instance to receive a custom DNS hostname as specified in domain-name, you must set domain-name-servers to a custom DNS server.    domain-name - If you're using AmazonProvidedDNS in us-east-1, specify ec2.internal. If you're using AmazonProvidedDNS in another region, specify region.compute.internal (for example, ap-northeast-1.compute.internal). Otherwise, specify a domain name (for example, MyCompany.com). This value is used to complete unqualified DNS hostnames. Important: Some Linux operating systems accept multiple domain names separated by spaces. However, Windows and other Linux operating systems treat the value as a single domain, which results in unexpected behavior. If your DHCP options set is associated with a VPC that has instances with multiple operating systems, specify only one domain name.    ntp-servers - The IP addresses of up to four Network Time Protocol (NTP) servers.    netbios-name-servers - The IP addresses of up to four NetBIOS name servers.    netbios-node-type - The NetBIOS node type (1, 2, 4, or 8). We recommend that you specify 2 (broadcast and multicast are not currently supported). For more information about these node types, see RFC 2132.   Your VPC automatically starts out with a set of DHCP options that includes only a DNS server that we provide (AmazonProvidedDNS). If you create a set of options, and if your VPC has an internet gateway, make sure to set the domain-name-servers option either to AmazonProvidedDNS or to a domain name server of your choice. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  createDhcpOptions(params: EC2.Types.CreateDhcpOptionsRequest, callback?: (err: AWSError, data: EC2.Types.CreateDhcpOptionsResult) => void): Request<EC2.Types.CreateDhcpOptionsResult, AWSError>;
  /**
   * Creates a set of DHCP options for your VPC. After creating the set, you must associate it with the VPC, causing all existing and new instances that you launch in the VPC to use this set of DHCP options. The following are the individual DHCP options you can specify. For more information about the options, see RFC 2132.    domain-name-servers - The IP addresses of up to four domain name servers, or AmazonProvidedDNS. The default DHCP option set specifies AmazonProvidedDNS. If specifying more than one domain name server, specify the IP addresses in a single parameter, separated by commas. ITo have your instance to receive a custom DNS hostname as specified in domain-name, you must set domain-name-servers to a custom DNS server.    domain-name - If you're using AmazonProvidedDNS in us-east-1, specify ec2.internal. If you're using AmazonProvidedDNS in another region, specify region.compute.internal (for example, ap-northeast-1.compute.internal). Otherwise, specify a domain name (for example, MyCompany.com). This value is used to complete unqualified DNS hostnames. Important: Some Linux operating systems accept multiple domain names separated by spaces. However, Windows and other Linux operating systems treat the value as a single domain, which results in unexpected behavior. If your DHCP options set is associated with a VPC that has instances with multiple operating systems, specify only one domain name.    ntp-servers - The IP addresses of up to four Network Time Protocol (NTP) servers.    netbios-name-servers - The IP addresses of up to four NetBIOS name servers.    netbios-node-type - The NetBIOS node type (1, 2, 4, or 8). We recommend that you specify 2 (broadcast and multicast are not currently supported). For more information about these node types, see RFC 2132.   Your VPC automatically starts out with a set of DHCP options that includes only a DNS server that we provide (AmazonProvidedDNS). If you create a set of options, and if your VPC has an internet gateway, make sure to set the domain-name-servers option either to AmazonProvidedDNS or to a domain name server of your choice. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  createDhcpOptions(callback?: (err: AWSError, data: EC2.Types.CreateDhcpOptionsResult) => void): Request<EC2.Types.CreateDhcpOptionsResult, AWSError>;
  /**
   * [IPv6 only] Creates an egress-only internet gateway for your VPC. An egress-only internet gateway is used to enable outbound communication over IPv6 from instances in your VPC to the internet, and prevents hosts outside of your VPC from initiating an IPv6 connection with your instance.
   */
  createEgressOnlyInternetGateway(params: EC2.Types.CreateEgressOnlyInternetGatewayRequest, callback?: (err: AWSError, data: EC2.Types.CreateEgressOnlyInternetGatewayResult) => void): Request<EC2.Types.CreateEgressOnlyInternetGatewayResult, AWSError>;
  /**
   * [IPv6 only] Creates an egress-only internet gateway for your VPC. An egress-only internet gateway is used to enable outbound communication over IPv6 from instances in your VPC to the internet, and prevents hosts outside of your VPC from initiating an IPv6 connection with your instance.
   */
  createEgressOnlyInternetGateway(callback?: (err: AWSError, data: EC2.Types.CreateEgressOnlyInternetGatewayResult) => void): Request<EC2.Types.CreateEgressOnlyInternetGatewayResult, AWSError>;
  /**
   * Launches an EC2 Fleet. You can create a single EC2 Fleet that includes multiple launch specifications that vary by instance type, AMI, Availability Zone, or subnet. For more information, see Launching an EC2 Fleet in the Amazon Elastic Compute Cloud User Guide.
   */
  createFleet(params: EC2.Types.CreateFleetRequest, callback?: (err: AWSError, data: EC2.Types.CreateFleetResult) => void): Request<EC2.Types.CreateFleetResult, AWSError>;
  /**
   * Launches an EC2 Fleet. You can create a single EC2 Fleet that includes multiple launch specifications that vary by instance type, AMI, Availability Zone, or subnet. For more information, see Launching an EC2 Fleet in the Amazon Elastic Compute Cloud User Guide.
   */
  createFleet(callback?: (err: AWSError, data: EC2.Types.CreateFleetResult) => void): Request<EC2.Types.CreateFleetResult, AWSError>;
  /**
   * Creates one or more flow logs to capture information about IP traffic for a specific network interface, subnet, or VPC.  Flow log data for a monitored network interface is recorded as flow log records, which are log events consisting of fields that describe the traffic flow. For more information, see Flow Log Records in the Amazon Virtual Private Cloud User Guide. When publishing to CloudWatch Logs, flow log records are published to a log group, and each network interface has a unique log stream in the log group. When publishing to Amazon S3, flow log records for all of the monitored network interfaces are published to a single log file object that is stored in the specified bucket. For more information, see VPC Flow Logs in the Amazon Virtual Private Cloud User Guide.
   */
  createFlowLogs(params: EC2.Types.CreateFlowLogsRequest, callback?: (err: AWSError, data: EC2.Types.CreateFlowLogsResult) => void): Request<EC2.Types.CreateFlowLogsResult, AWSError>;
  /**
   * Creates one or more flow logs to capture information about IP traffic for a specific network interface, subnet, or VPC.  Flow log data for a monitored network interface is recorded as flow log records, which are log events consisting of fields that describe the traffic flow. For more information, see Flow Log Records in the Amazon Virtual Private Cloud User Guide. When publishing to CloudWatch Logs, flow log records are published to a log group, and each network interface has a unique log stream in the log group. When publishing to Amazon S3, flow log records for all of the monitored network interfaces are published to a single log file object that is stored in the specified bucket. For more information, see VPC Flow Logs in the Amazon Virtual Private Cloud User Guide.
   */
  createFlowLogs(callback?: (err: AWSError, data: EC2.Types.CreateFlowLogsResult) => void): Request<EC2.Types.CreateFlowLogsResult, AWSError>;
  /**
   * Creates an Amazon FPGA Image (AFI) from the specified design checkpoint (DCP). The create operation is asynchronous. To verify that the AFI is ready for use, check the output logs. An AFI contains the FPGA bitstream that is ready to download to an FPGA. You can securely deploy an AFI on one or more FPGA-accelerated instances. For more information, see the AWS FPGA Hardware Development Kit.
   */
  createFpgaImage(params: EC2.Types.CreateFpgaImageRequest, callback?: (err: AWSError, data: EC2.Types.CreateFpgaImageResult) => void): Request<EC2.Types.CreateFpgaImageResult, AWSError>;
  /**
   * Creates an Amazon FPGA Image (AFI) from the specified design checkpoint (DCP). The create operation is asynchronous. To verify that the AFI is ready for use, check the output logs. An AFI contains the FPGA bitstream that is ready to download to an FPGA. You can securely deploy an AFI on one or more FPGA-accelerated instances. For more information, see the AWS FPGA Hardware Development Kit.
   */
  createFpgaImage(callback?: (err: AWSError, data: EC2.Types.CreateFpgaImageResult) => void): Request<EC2.Types.CreateFpgaImageResult, AWSError>;
  /**
   * Creates an Amazon EBS-backed AMI from an Amazon EBS-backed instance that is either running or stopped. If you customized your instance with instance store volumes or EBS volumes in addition to the root device volume, the new AMI contains block device mapping information for those volumes. When you launch an instance from this new AMI, the instance automatically launches with those additional volumes. For more information, see Creating Amazon EBS-Backed Linux AMIs in the Amazon Elastic Compute Cloud User Guide.
   */
  createImage(params: EC2.Types.CreateImageRequest, callback?: (err: AWSError, data: EC2.Types.CreateImageResult) => void): Request<EC2.Types.CreateImageResult, AWSError>;
  /**
   * Creates an Amazon EBS-backed AMI from an Amazon EBS-backed instance that is either running or stopped. If you customized your instance with instance store volumes or EBS volumes in addition to the root device volume, the new AMI contains block device mapping information for those volumes. When you launch an instance from this new AMI, the instance automatically launches with those additional volumes. For more information, see Creating Amazon EBS-Backed Linux AMIs in the Amazon Elastic Compute Cloud User Guide.
   */
  createImage(callback?: (err: AWSError, data: EC2.Types.CreateImageResult) => void): Request<EC2.Types.CreateImageResult, AWSError>;
  /**
   * Exports a running or stopped instance to an S3 bucket. For information about the supported operating systems, image formats, and known limitations for the types of instances you can export, see Exporting an Instance as a VM Using VM Import/Export in the VM Import/Export User Guide.
   */
  createInstanceExportTask(params: EC2.Types.CreateInstanceExportTaskRequest, callback?: (err: AWSError, data: EC2.Types.CreateInstanceExportTaskResult) => void): Request<EC2.Types.CreateInstanceExportTaskResult, AWSError>;
  /**
   * Exports a running or stopped instance to an S3 bucket. For information about the supported operating systems, image formats, and known limitations for the types of instances you can export, see Exporting an Instance as a VM Using VM Import/Export in the VM Import/Export User Guide.
   */
  createInstanceExportTask(callback?: (err: AWSError, data: EC2.Types.CreateInstanceExportTaskResult) => void): Request<EC2.Types.CreateInstanceExportTaskResult, AWSError>;
  /**
   * Creates an internet gateway for use with a VPC. After creating the internet gateway, you attach it to a VPC using AttachInternetGateway. For more information about your VPC and internet gateway, see the Amazon Virtual Private Cloud User Guide.
   */
  createInternetGateway(params: EC2.Types.CreateInternetGatewayRequest, callback?: (err: AWSError, data: EC2.Types.CreateInternetGatewayResult) => void): Request<EC2.Types.CreateInternetGatewayResult, AWSError>;
  /**
   * Creates an internet gateway for use with a VPC. After creating the internet gateway, you attach it to a VPC using AttachInternetGateway. For more information about your VPC and internet gateway, see the Amazon Virtual Private Cloud User Guide.
   */
  createInternetGateway(callback?: (err: AWSError, data: EC2.Types.CreateInternetGatewayResult) => void): Request<EC2.Types.CreateInternetGatewayResult, AWSError>;
  /**
   * Creates a 2048-bit RSA key pair with the specified name. Amazon EC2 stores the public key and displays the private key for you to save to a file. The private key is returned as an unencrypted PEM encoded PKCS#1 private key. If a key with the specified name already exists, Amazon EC2 returns an error. You can have up to five thousand key pairs per region. The key pair returned to you is available only in the region in which you create it. If you prefer, you can create your own key pair using a third-party tool and upload it to any region using ImportKeyPair. For more information, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  createKeyPair(params: EC2.Types.CreateKeyPairRequest, callback?: (err: AWSError, data: EC2.Types.KeyPair) => void): Request<EC2.Types.KeyPair, AWSError>;
  /**
   * Creates a 2048-bit RSA key pair with the specified name. Amazon EC2 stores the public key and displays the private key for you to save to a file. The private key is returned as an unencrypted PEM encoded PKCS#1 private key. If a key with the specified name already exists, Amazon EC2 returns an error. You can have up to five thousand key pairs per region. The key pair returned to you is available only in the region in which you create it. If you prefer, you can create your own key pair using a third-party tool and upload it to any region using ImportKeyPair. For more information, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  createKeyPair(callback?: (err: AWSError, data: EC2.Types.KeyPair) => void): Request<EC2.Types.KeyPair, AWSError>;
  /**
   * Creates a launch template. A launch template contains the parameters to launch an instance. When you launch an instance using RunInstances, you can specify a launch template instead of providing the launch parameters in the request.
   */
  createLaunchTemplate(params: EC2.Types.CreateLaunchTemplateRequest, callback?: (err: AWSError, data: EC2.Types.CreateLaunchTemplateResult) => void): Request<EC2.Types.CreateLaunchTemplateResult, AWSError>;
  /**
   * Creates a launch template. A launch template contains the parameters to launch an instance. When you launch an instance using RunInstances, you can specify a launch template instead of providing the launch parameters in the request.
   */
  createLaunchTemplate(callback?: (err: AWSError, data: EC2.Types.CreateLaunchTemplateResult) => void): Request<EC2.Types.CreateLaunchTemplateResult, AWSError>;
  /**
   * Creates a new version for a launch template. You can specify an existing version of launch template from which to base the new version. Launch template versions are numbered in the order in which they are created. You cannot specify, change, or replace the numbering of launch template versions.
   */
  createLaunchTemplateVersion(params: EC2.Types.CreateLaunchTemplateVersionRequest, callback?: (err: AWSError, data: EC2.Types.CreateLaunchTemplateVersionResult) => void): Request<EC2.Types.CreateLaunchTemplateVersionResult, AWSError>;
  /**
   * Creates a new version for a launch template. You can specify an existing version of launch template from which to base the new version. Launch template versions are numbered in the order in which they are created. You cannot specify, change, or replace the numbering of launch template versions.
   */
  createLaunchTemplateVersion(callback?: (err: AWSError, data: EC2.Types.CreateLaunchTemplateVersionResult) => void): Request<EC2.Types.CreateLaunchTemplateVersionResult, AWSError>;
  /**
   * Creates a NAT gateway in the specified public subnet. This action creates a network interface in the specified subnet with a private IP address from the IP address range of the subnet. Internet-bound traffic from a private subnet can be routed to the NAT gateway, therefore enabling instances in the private subnet to connect to the internet. For more information, see NAT Gateways in the Amazon Virtual Private Cloud User Guide.
   */
  createNatGateway(params: EC2.Types.CreateNatGatewayRequest, callback?: (err: AWSError, data: EC2.Types.CreateNatGatewayResult) => void): Request<EC2.Types.CreateNatGatewayResult, AWSError>;
  /**
   * Creates a NAT gateway in the specified public subnet. This action creates a network interface in the specified subnet with a private IP address from the IP address range of the subnet. Internet-bound traffic from a private subnet can be routed to the NAT gateway, therefore enabling instances in the private subnet to connect to the internet. For more information, see NAT Gateways in the Amazon Virtual Private Cloud User Guide.
   */
  createNatGateway(callback?: (err: AWSError, data: EC2.Types.CreateNatGatewayResult) => void): Request<EC2.Types.CreateNatGatewayResult, AWSError>;
  /**
   * Creates a network ACL in a VPC. Network ACLs provide an optional layer of security (in addition to security groups) for the instances in your VPC. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkAcl(params: EC2.Types.CreateNetworkAclRequest, callback?: (err: AWSError, data: EC2.Types.CreateNetworkAclResult) => void): Request<EC2.Types.CreateNetworkAclResult, AWSError>;
  /**
   * Creates a network ACL in a VPC. Network ACLs provide an optional layer of security (in addition to security groups) for the instances in your VPC. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkAcl(callback?: (err: AWSError, data: EC2.Types.CreateNetworkAclResult) => void): Request<EC2.Types.CreateNetworkAclResult, AWSError>;
  /**
   * Creates an entry (a rule) in a network ACL with the specified rule number. Each network ACL has a set of numbered ingress rules and a separate set of numbered egress rules. When determining whether a packet should be allowed in or out of a subnet associated with the ACL, we process the entries in the ACL according to the rule numbers, in ascending order. Each network ACL has a set of ingress rules and a separate set of egress rules. We recommend that you leave room between the rule numbers (for example, 100, 110, 120, ...), and not number them one right after the other (for example, 101, 102, 103, ...). This makes it easier to add a rule between existing ones without having to renumber the rules. After you add an entry, you can't modify it; you must either replace it, or create an entry and delete the old one. For more information about network ACLs, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkAclEntry(params: EC2.Types.CreateNetworkAclEntryRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates an entry (a rule) in a network ACL with the specified rule number. Each network ACL has a set of numbered ingress rules and a separate set of numbered egress rules. When determining whether a packet should be allowed in or out of a subnet associated with the ACL, we process the entries in the ACL according to the rule numbers, in ascending order. Each network ACL has a set of ingress rules and a separate set of egress rules. We recommend that you leave room between the rule numbers (for example, 100, 110, 120, ...), and not number them one right after the other (for example, 101, 102, 103, ...). This makes it easier to add a rule between existing ones without having to renumber the rules. After you add an entry, you can't modify it; you must either replace it, or create an entry and delete the old one. For more information about network ACLs, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkAclEntry(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a network interface in the specified subnet. For more information about network interfaces, see Elastic Network Interfaces in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkInterface(params: EC2.Types.CreateNetworkInterfaceRequest, callback?: (err: AWSError, data: EC2.Types.CreateNetworkInterfaceResult) => void): Request<EC2.Types.CreateNetworkInterfaceResult, AWSError>;
  /**
   * Creates a network interface in the specified subnet. For more information about network interfaces, see Elastic Network Interfaces in the Amazon Virtual Private Cloud User Guide.
   */
  createNetworkInterface(callback?: (err: AWSError, data: EC2.Types.CreateNetworkInterfaceResult) => void): Request<EC2.Types.CreateNetworkInterfaceResult, AWSError>;
  /**
   * Grants an AWS-authorized account permission to attach the specified network interface to an instance in their account. You can grant permission to a single AWS account only, and only one account at a time.
   */
  createNetworkInterfacePermission(params: EC2.Types.CreateNetworkInterfacePermissionRequest, callback?: (err: AWSError, data: EC2.Types.CreateNetworkInterfacePermissionResult) => void): Request<EC2.Types.CreateNetworkInterfacePermissionResult, AWSError>;
  /**
   * Grants an AWS-authorized account permission to attach the specified network interface to an instance in their account. You can grant permission to a single AWS account only, and only one account at a time.
   */
  createNetworkInterfacePermission(callback?: (err: AWSError, data: EC2.Types.CreateNetworkInterfacePermissionResult) => void): Request<EC2.Types.CreateNetworkInterfacePermissionResult, AWSError>;
  /**
   * Creates a placement group in which to launch instances. The strategy of the placement group determines how the instances are organized within the group.  A cluster placement group is a logical grouping of instances within a single Availability Zone that benefit from low network latency, high network throughput. A spread placement group places instances on distinct hardware. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  createPlacementGroup(params: EC2.Types.CreatePlacementGroupRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a placement group in which to launch instances. The strategy of the placement group determines how the instances are organized within the group.  A cluster placement group is a logical grouping of instances within a single Availability Zone that benefit from low network latency, high network throughput. A spread placement group places instances on distinct hardware. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  createPlacementGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a listing for Amazon EC2 Standard Reserved Instances to be sold in the Reserved Instance Marketplace. You can submit one Standard Reserved Instance listing at a time. To get a list of your Standard Reserved Instances, you can use the DescribeReservedInstances operation.  Only Standard Reserved Instances with a capacity reservation can be sold in the Reserved Instance Marketplace. Convertible Reserved Instances and Standard Reserved Instances with a regional benefit cannot be sold.  The Reserved Instance Marketplace matches sellers who want to resell Standard Reserved Instance capacity that they no longer need with buyers who want to purchase additional capacity. Reserved Instances bought and sold through the Reserved Instance Marketplace work like any other Reserved Instances. To sell your Standard Reserved Instances, you must first register as a seller in the Reserved Instance Marketplace. After completing the registration process, you can create a Reserved Instance Marketplace listing of some or all of your Standard Reserved Instances, and specify the upfront price to receive for them. Your Standard Reserved Instance listings then become available for purchase. To view the details of your Standard Reserved Instance listing, you can use the DescribeReservedInstancesListings operation. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  createReservedInstancesListing(params: EC2.Types.CreateReservedInstancesListingRequest, callback?: (err: AWSError, data: EC2.Types.CreateReservedInstancesListingResult) => void): Request<EC2.Types.CreateReservedInstancesListingResult, AWSError>;
  /**
   * Creates a listing for Amazon EC2 Standard Reserved Instances to be sold in the Reserved Instance Marketplace. You can submit one Standard Reserved Instance listing at a time. To get a list of your Standard Reserved Instances, you can use the DescribeReservedInstances operation.  Only Standard Reserved Instances with a capacity reservation can be sold in the Reserved Instance Marketplace. Convertible Reserved Instances and Standard Reserved Instances with a regional benefit cannot be sold.  The Reserved Instance Marketplace matches sellers who want to resell Standard Reserved Instance capacity that they no longer need with buyers who want to purchase additional capacity. Reserved Instances bought and sold through the Reserved Instance Marketplace work like any other Reserved Instances. To sell your Standard Reserved Instances, you must first register as a seller in the Reserved Instance Marketplace. After completing the registration process, you can create a Reserved Instance Marketplace listing of some or all of your Standard Reserved Instances, and specify the upfront price to receive for them. Your Standard Reserved Instance listings then become available for purchase. To view the details of your Standard Reserved Instance listing, you can use the DescribeReservedInstancesListings operation. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  createReservedInstancesListing(callback?: (err: AWSError, data: EC2.Types.CreateReservedInstancesListingResult) => void): Request<EC2.Types.CreateReservedInstancesListingResult, AWSError>;
  /**
   * Creates a route in a route table within a VPC. You must specify one of the following targets: internet gateway or virtual private gateway, NAT instance, NAT gateway, VPC peering connection, network interface, or egress-only internet gateway. When determining how to route traffic, we use the route with the most specific match. For example, traffic is destined for the IPv4 address 192.0.2.3, and the route table includes the following two IPv4 routes:    192.0.2.0/24 (goes to some target A)    192.0.2.0/28 (goes to some target B)   Both routes apply to the traffic destined for 192.0.2.3. However, the second route in the list covers a smaller number of IP addresses and is therefore more specific, so we use that route to determine where to target the traffic. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  createRoute(params: EC2.Types.CreateRouteRequest, callback?: (err: AWSError, data: EC2.Types.CreateRouteResult) => void): Request<EC2.Types.CreateRouteResult, AWSError>;
  /**
   * Creates a route in a route table within a VPC. You must specify one of the following targets: internet gateway or virtual private gateway, NAT instance, NAT gateway, VPC peering connection, network interface, or egress-only internet gateway. When determining how to route traffic, we use the route with the most specific match. For example, traffic is destined for the IPv4 address 192.0.2.3, and the route table includes the following two IPv4 routes:    192.0.2.0/24 (goes to some target A)    192.0.2.0/28 (goes to some target B)   Both routes apply to the traffic destined for 192.0.2.3. However, the second route in the list covers a smaller number of IP addresses and is therefore more specific, so we use that route to determine where to target the traffic. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  createRoute(callback?: (err: AWSError, data: EC2.Types.CreateRouteResult) => void): Request<EC2.Types.CreateRouteResult, AWSError>;
  /**
   * Creates a route table for the specified VPC. After you create a route table, you can add routes and associate the table with a subnet. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  createRouteTable(params: EC2.Types.CreateRouteTableRequest, callback?: (err: AWSError, data: EC2.Types.CreateRouteTableResult) => void): Request<EC2.Types.CreateRouteTableResult, AWSError>;
  /**
   * Creates a route table for the specified VPC. After you create a route table, you can add routes and associate the table with a subnet. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  createRouteTable(callback?: (err: AWSError, data: EC2.Types.CreateRouteTableResult) => void): Request<EC2.Types.CreateRouteTableResult, AWSError>;
  /**
   * Creates a security group. A security group is for use with instances either in the EC2-Classic platform or in a specific VPC. For more information, see Amazon EC2 Security Groups in the Amazon Elastic Compute Cloud User Guide and Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide.  EC2-Classic: You can have up to 500 security groups. EC2-VPC: You can create up to 500 security groups per VPC.  When you create a security group, you specify a friendly name of your choice. You can have a security group for use in EC2-Classic with the same name as a security group for use in a VPC. However, you can't have two security groups for use in EC2-Classic with the same name or two security groups for use in a VPC with the same name. You have a default security group for use in EC2-Classic and a default security group for use in your VPC. If you don't specify a security group when you launch an instance, the instance is launched into the appropriate default security group. A default security group includes a default rule that grants instances unrestricted network access to each other. You can add or remove rules from your security groups using AuthorizeSecurityGroupIngress, AuthorizeSecurityGroupEgress, RevokeSecurityGroupIngress, and RevokeSecurityGroupEgress.
   */
  createSecurityGroup(params: EC2.Types.CreateSecurityGroupRequest, callback?: (err: AWSError, data: EC2.Types.CreateSecurityGroupResult) => void): Request<EC2.Types.CreateSecurityGroupResult, AWSError>;
  /**
   * Creates a security group. A security group is for use with instances either in the EC2-Classic platform or in a specific VPC. For more information, see Amazon EC2 Security Groups in the Amazon Elastic Compute Cloud User Guide and Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide.  EC2-Classic: You can have up to 500 security groups. EC2-VPC: You can create up to 500 security groups per VPC.  When you create a security group, you specify a friendly name of your choice. You can have a security group for use in EC2-Classic with the same name as a security group for use in a VPC. However, you can't have two security groups for use in EC2-Classic with the same name or two security groups for use in a VPC with the same name. You have a default security group for use in EC2-Classic and a default security group for use in your VPC. If you don't specify a security group when you launch an instance, the instance is launched into the appropriate default security group. A default security group includes a default rule that grants instances unrestricted network access to each other. You can add or remove rules from your security groups using AuthorizeSecurityGroupIngress, AuthorizeSecurityGroupEgress, RevokeSecurityGroupIngress, and RevokeSecurityGroupEgress.
   */
  createSecurityGroup(callback?: (err: AWSError, data: EC2.Types.CreateSecurityGroupResult) => void): Request<EC2.Types.CreateSecurityGroupResult, AWSError>;
  /**
   * Creates a snapshot of an EBS volume and stores it in Amazon S3. You can use snapshots for backups, to make copies of EBS volumes, and to save data before shutting down an instance. When a snapshot is created, any AWS Marketplace product codes that are associated with the source volume are propagated to the snapshot. You can take a snapshot of an attached volume that is in use. However, snapshots only capture data that has been written to your EBS volume at the time the snapshot command is issued; this may exclude any data that has been cached by any applications or the operating system. If you can pause any file systems on the volume long enough to take a snapshot, your snapshot should be complete. However, if you cannot pause all file writes to the volume, you should unmount the volume from within the instance, issue the snapshot command, and then remount the volume to ensure a consistent and complete snapshot. You may remount and use your volume while the snapshot status is pending. To create a snapshot for EBS volumes that serve as root devices, you should stop the instance before taking the snapshot. Snapshots that are taken from encrypted volumes are automatically encrypted. Volumes that are created from encrypted snapshots are also automatically encrypted. Your encrypted volumes and any associated snapshots always remain protected. You can tag your snapshots during creation. For more information, see Tagging Your Amazon EC2 Resources in the Amazon Elastic Compute Cloud User Guide. For more information, see Amazon Elastic Block Store and Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide.
   */
  createSnapshot(params: EC2.Types.CreateSnapshotRequest, callback?: (err: AWSError, data: EC2.Types.Snapshot) => void): Request<EC2.Types.Snapshot, AWSError>;
  /**
   * Creates a snapshot of an EBS volume and stores it in Amazon S3. You can use snapshots for backups, to make copies of EBS volumes, and to save data before shutting down an instance. When a snapshot is created, any AWS Marketplace product codes that are associated with the source volume are propagated to the snapshot. You can take a snapshot of an attached volume that is in use. However, snapshots only capture data that has been written to your EBS volume at the time the snapshot command is issued; this may exclude any data that has been cached by any applications or the operating system. If you can pause any file systems on the volume long enough to take a snapshot, your snapshot should be complete. However, if you cannot pause all file writes to the volume, you should unmount the volume from within the instance, issue the snapshot command, and then remount the volume to ensure a consistent and complete snapshot. You may remount and use your volume while the snapshot status is pending. To create a snapshot for EBS volumes that serve as root devices, you should stop the instance before taking the snapshot. Snapshots that are taken from encrypted volumes are automatically encrypted. Volumes that are created from encrypted snapshots are also automatically encrypted. Your encrypted volumes and any associated snapshots always remain protected. You can tag your snapshots during creation. For more information, see Tagging Your Amazon EC2 Resources in the Amazon Elastic Compute Cloud User Guide. For more information, see Amazon Elastic Block Store and Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide.
   */
  createSnapshot(callback?: (err: AWSError, data: EC2.Types.Snapshot) => void): Request<EC2.Types.Snapshot, AWSError>;
  /**
   * Creates a data feed for Spot Instances, enabling you to view Spot Instance usage logs. You can create one data feed per AWS account. For more information, see Spot Instance Data Feed in the Amazon EC2 User Guide for Linux Instances.
   */
  createSpotDatafeedSubscription(params: EC2.Types.CreateSpotDatafeedSubscriptionRequest, callback?: (err: AWSError, data: EC2.Types.CreateSpotDatafeedSubscriptionResult) => void): Request<EC2.Types.CreateSpotDatafeedSubscriptionResult, AWSError>;
  /**
   * Creates a data feed for Spot Instances, enabling you to view Spot Instance usage logs. You can create one data feed per AWS account. For more information, see Spot Instance Data Feed in the Amazon EC2 User Guide for Linux Instances.
   */
  createSpotDatafeedSubscription(callback?: (err: AWSError, data: EC2.Types.CreateSpotDatafeedSubscriptionResult) => void): Request<EC2.Types.CreateSpotDatafeedSubscriptionResult, AWSError>;
  /**
   * Creates a subnet in an existing VPC. When you create each subnet, you provide the VPC ID and IPv4 CIDR block for the subnet. After you create a subnet, you can't change its CIDR block. The size of the subnet's IPv4 CIDR block can be the same as a VPC's IPv4 CIDR block, or a subset of a VPC's IPv4 CIDR block. If you create more than one subnet in a VPC, the subnets' CIDR blocks must not overlap. The smallest IPv4 subnet (and VPC) you can create uses a /28 netmask (16 IPv4 addresses), and the largest uses a /16 netmask (65,536 IPv4 addresses). If you've associated an IPv6 CIDR block with your VPC, you can create a subnet with an IPv6 CIDR block that uses a /64 prefix length.   AWS reserves both the first four and the last IPv4 address in each subnet's CIDR block. They're not available for use.  If you add more than one subnet to a VPC, they're set up in a star topology with a logical router in the middle. If you launch an instance in a VPC using an Amazon EBS-backed AMI, the IP address doesn't change if you stop and restart the instance (unlike a similar instance launched outside a VPC, which gets a new IP address when restarted). It's therefore possible to have a subnet with no running instances (they're all stopped), but no remaining IP addresses available. For more information about subnets, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide.
   */
  createSubnet(params: EC2.Types.CreateSubnetRequest, callback?: (err: AWSError, data: EC2.Types.CreateSubnetResult) => void): Request<EC2.Types.CreateSubnetResult, AWSError>;
  /**
   * Creates a subnet in an existing VPC. When you create each subnet, you provide the VPC ID and IPv4 CIDR block for the subnet. After you create a subnet, you can't change its CIDR block. The size of the subnet's IPv4 CIDR block can be the same as a VPC's IPv4 CIDR block, or a subset of a VPC's IPv4 CIDR block. If you create more than one subnet in a VPC, the subnets' CIDR blocks must not overlap. The smallest IPv4 subnet (and VPC) you can create uses a /28 netmask (16 IPv4 addresses), and the largest uses a /16 netmask (65,536 IPv4 addresses). If you've associated an IPv6 CIDR block with your VPC, you can create a subnet with an IPv6 CIDR block that uses a /64 prefix length.   AWS reserves both the first four and the last IPv4 address in each subnet's CIDR block. They're not available for use.  If you add more than one subnet to a VPC, they're set up in a star topology with a logical router in the middle. If you launch an instance in a VPC using an Amazon EBS-backed AMI, the IP address doesn't change if you stop and restart the instance (unlike a similar instance launched outside a VPC, which gets a new IP address when restarted). It's therefore possible to have a subnet with no running instances (they're all stopped), but no remaining IP addresses available. For more information about subnets, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide.
   */
  createSubnet(callback?: (err: AWSError, data: EC2.Types.CreateSubnetResult) => void): Request<EC2.Types.CreateSubnetResult, AWSError>;
  /**
   * Adds or overwrites one or more tags for the specified Amazon EC2 resource or resources. Each resource can have a maximum of 50 tags. Each tag consists of a key and optional value. Tag keys must be unique per resource. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide. For more information about creating IAM policies that control users' access to resources based on tags, see Supported Resource-Level Permissions for Amazon EC2 API Actions in the Amazon Elastic Compute Cloud User Guide.
   */
  createTags(params: EC2.Types.CreateTagsRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds or overwrites one or more tags for the specified Amazon EC2 resource or resources. Each resource can have a maximum of 50 tags. Each tag consists of a key and optional value. Tag keys must be unique per resource. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide. For more information about creating IAM policies that control users' access to resources based on tags, see Supported Resource-Level Permissions for Amazon EC2 API Actions in the Amazon Elastic Compute Cloud User Guide.
   */
  createTags(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates an EBS volume that can be attached to an instance in the same Availability Zone. The volume is created in the regional endpoint that you send the HTTP request to. For more information see Regions and Endpoints. You can create a new empty volume or restore a volume from an EBS snapshot. Any AWS Marketplace product codes from the snapshot are propagated to the volume. You can create encrypted volumes with the Encrypted parameter. Encrypted volumes may only be attached to instances that support Amazon EBS encryption. Volumes that are created from encrypted snapshots are also automatically encrypted. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide. You can tag your volumes during creation. For more information, see Tagging Your Amazon EC2 Resources in the Amazon Elastic Compute Cloud User Guide. For more information, see Creating an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  createVolume(params: EC2.Types.CreateVolumeRequest, callback?: (err: AWSError, data: EC2.Types.Volume) => void): Request<EC2.Types.Volume, AWSError>;
  /**
   * Creates an EBS volume that can be attached to an instance in the same Availability Zone. The volume is created in the regional endpoint that you send the HTTP request to. For more information see Regions and Endpoints. You can create a new empty volume or restore a volume from an EBS snapshot. Any AWS Marketplace product codes from the snapshot are propagated to the volume. You can create encrypted volumes with the Encrypted parameter. Encrypted volumes may only be attached to instances that support Amazon EBS encryption. Volumes that are created from encrypted snapshots are also automatically encrypted. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide. You can tag your volumes during creation. For more information, see Tagging Your Amazon EC2 Resources in the Amazon Elastic Compute Cloud User Guide. For more information, see Creating an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  createVolume(callback?: (err: AWSError, data: EC2.Types.Volume) => void): Request<EC2.Types.Volume, AWSError>;
  /**
   * Creates a VPC with the specified IPv4 CIDR block. The smallest VPC you can create uses a /28 netmask (16 IPv4 addresses), and the largest uses a /16 netmask (65,536 IPv4 addresses). For more information about how large to make your VPC, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide. You can optionally request an Amazon-provided IPv6 CIDR block for the VPC. The IPv6 CIDR block uses a /56 prefix length, and is allocated from Amazon's pool of IPv6 addresses. You cannot choose the IPv6 range for your VPC. By default, each instance you launch in the VPC has the default DHCP options, which include only a default DNS server that we provide (AmazonProvidedDNS). For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide. You can specify the instance tenancy value for the VPC when you create it. You can't change this value for the VPC after you create it. For more information, see Dedicated Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  createVpc(params: EC2.Types.CreateVpcRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpcResult) => void): Request<EC2.Types.CreateVpcResult, AWSError>;
  /**
   * Creates a VPC with the specified IPv4 CIDR block. The smallest VPC you can create uses a /28 netmask (16 IPv4 addresses), and the largest uses a /16 netmask (65,536 IPv4 addresses). For more information about how large to make your VPC, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide. You can optionally request an Amazon-provided IPv6 CIDR block for the VPC. The IPv6 CIDR block uses a /56 prefix length, and is allocated from Amazon's pool of IPv6 addresses. You cannot choose the IPv6 range for your VPC. By default, each instance you launch in the VPC has the default DHCP options, which include only a default DNS server that we provide (AmazonProvidedDNS). For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide. You can specify the instance tenancy value for the VPC when you create it. You can't change this value for the VPC after you create it. For more information, see Dedicated Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  createVpc(callback?: (err: AWSError, data: EC2.Types.CreateVpcResult) => void): Request<EC2.Types.CreateVpcResult, AWSError>;
  /**
   * Creates a VPC endpoint for a specified service. An endpoint enables you to create a private connection between your VPC and the service. The service may be provided by AWS, an AWS Marketplace partner, or another AWS account. For more information, see VPC Endpoints in the Amazon Virtual Private Cloud User Guide. A gateway endpoint serves as a target for a route in your route table for traffic destined for the AWS service. You can specify an endpoint policy to attach to the endpoint that will control access to the service from your VPC. You can also specify the VPC route tables that use the endpoint. An interface endpoint is a network interface in your subnet that serves as an endpoint for communicating with the specified service. You can specify the subnets in which to create an endpoint, and the security groups to associate with the endpoint network interface. Use DescribeVpcEndpointServices to get a list of supported services.
   */
  createVpcEndpoint(params: EC2.Types.CreateVpcEndpointRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointResult) => void): Request<EC2.Types.CreateVpcEndpointResult, AWSError>;
  /**
   * Creates a VPC endpoint for a specified service. An endpoint enables you to create a private connection between your VPC and the service. The service may be provided by AWS, an AWS Marketplace partner, or another AWS account. For more information, see VPC Endpoints in the Amazon Virtual Private Cloud User Guide. A gateway endpoint serves as a target for a route in your route table for traffic destined for the AWS service. You can specify an endpoint policy to attach to the endpoint that will control access to the service from your VPC. You can also specify the VPC route tables that use the endpoint. An interface endpoint is a network interface in your subnet that serves as an endpoint for communicating with the specified service. You can specify the subnets in which to create an endpoint, and the security groups to associate with the endpoint network interface. Use DescribeVpcEndpointServices to get a list of supported services.
   */
  createVpcEndpoint(callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointResult) => void): Request<EC2.Types.CreateVpcEndpointResult, AWSError>;
  /**
   * Creates a connection notification for a specified VPC endpoint or VPC endpoint service. A connection notification notifies you of specific endpoint events. You must create an SNS topic to receive notifications. For more information, see Create a Topic in the Amazon Simple Notification Service Developer Guide. You can create a connection notification for interface endpoints only.
   */
  createVpcEndpointConnectionNotification(params: EC2.Types.CreateVpcEndpointConnectionNotificationRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointConnectionNotificationResult) => void): Request<EC2.Types.CreateVpcEndpointConnectionNotificationResult, AWSError>;
  /**
   * Creates a connection notification for a specified VPC endpoint or VPC endpoint service. A connection notification notifies you of specific endpoint events. You must create an SNS topic to receive notifications. For more information, see Create a Topic in the Amazon Simple Notification Service Developer Guide. You can create a connection notification for interface endpoints only.
   */
  createVpcEndpointConnectionNotification(callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointConnectionNotificationResult) => void): Request<EC2.Types.CreateVpcEndpointConnectionNotificationResult, AWSError>;
  /**
   * Creates a VPC endpoint service configuration to which service consumers (AWS accounts, IAM users, and IAM roles) can connect. Service consumers can create an interface VPC endpoint to connect to your service. To create an endpoint service configuration, you must first create a Network Load Balancer for your service. For more information, see VPC Endpoint Services in the Amazon Virtual Private Cloud User Guide. 
   */
  createVpcEndpointServiceConfiguration(params: EC2.Types.CreateVpcEndpointServiceConfigurationRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointServiceConfigurationResult) => void): Request<EC2.Types.CreateVpcEndpointServiceConfigurationResult, AWSError>;
  /**
   * Creates a VPC endpoint service configuration to which service consumers (AWS accounts, IAM users, and IAM roles) can connect. Service consumers can create an interface VPC endpoint to connect to your service. To create an endpoint service configuration, you must first create a Network Load Balancer for your service. For more information, see VPC Endpoint Services in the Amazon Virtual Private Cloud User Guide. 
   */
  createVpcEndpointServiceConfiguration(callback?: (err: AWSError, data: EC2.Types.CreateVpcEndpointServiceConfigurationResult) => void): Request<EC2.Types.CreateVpcEndpointServiceConfigurationResult, AWSError>;
  /**
   * Requests a VPC peering connection between two VPCs: a requester VPC that you own and an accepter VPC with which to create the connection. The accepter VPC can belong to another AWS account and can be in a different Region to the requester VPC. The requester VPC and accepter VPC cannot have overlapping CIDR blocks.  Limitations and rules apply to a VPC peering connection. For more information, see the limitations section in the VPC Peering Guide.  The owner of the accepter VPC must accept the peering request to activate the peering connection. The VPC peering connection request expires after 7 days, after which it cannot be accepted or rejected. If you create a VPC peering connection request between VPCs with overlapping CIDR blocks, the VPC peering connection has a status of failed.
   */
  createVpcPeeringConnection(params: EC2.Types.CreateVpcPeeringConnectionRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpcPeeringConnectionResult) => void): Request<EC2.Types.CreateVpcPeeringConnectionResult, AWSError>;
  /**
   * Requests a VPC peering connection between two VPCs: a requester VPC that you own and an accepter VPC with which to create the connection. The accepter VPC can belong to another AWS account and can be in a different Region to the requester VPC. The requester VPC and accepter VPC cannot have overlapping CIDR blocks.  Limitations and rules apply to a VPC peering connection. For more information, see the limitations section in the VPC Peering Guide.  The owner of the accepter VPC must accept the peering request to activate the peering connection. The VPC peering connection request expires after 7 days, after which it cannot be accepted or rejected. If you create a VPC peering connection request between VPCs with overlapping CIDR blocks, the VPC peering connection has a status of failed.
   */
  createVpcPeeringConnection(callback?: (err: AWSError, data: EC2.Types.CreateVpcPeeringConnectionResult) => void): Request<EC2.Types.CreateVpcPeeringConnectionResult, AWSError>;
  /**
   * Creates a VPN connection between an existing virtual private gateway and a VPN customer gateway. The only supported connection type is ipsec.1. The response includes information that you need to give to your network administrator to configure your customer gateway.  We strongly recommend that you use HTTPS when calling this operation because the response contains sensitive cryptographic information for configuring your customer gateway.  If you decide to shut down your VPN connection for any reason and later create a new VPN connection, you must reconfigure your customer gateway with the new information returned from this call. This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error. For more information, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnConnection(params: EC2.Types.CreateVpnConnectionRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpnConnectionResult) => void): Request<EC2.Types.CreateVpnConnectionResult, AWSError>;
  /**
   * Creates a VPN connection between an existing virtual private gateway and a VPN customer gateway. The only supported connection type is ipsec.1. The response includes information that you need to give to your network administrator to configure your customer gateway.  We strongly recommend that you use HTTPS when calling this operation because the response contains sensitive cryptographic information for configuring your customer gateway.  If you decide to shut down your VPN connection for any reason and later create a new VPN connection, you must reconfigure your customer gateway with the new information returned from this call. This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error. For more information, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnConnection(callback?: (err: AWSError, data: EC2.Types.CreateVpnConnectionResult) => void): Request<EC2.Types.CreateVpnConnectionResult, AWSError>;
  /**
   * Creates a static route associated with a VPN connection between an existing virtual private gateway and a VPN customer gateway. The static route allows traffic to be routed from the virtual private gateway to the VPN customer gateway. For more information about VPN connections, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnConnectionRoute(params: EC2.Types.CreateVpnConnectionRouteRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a static route associated with a VPN connection between an existing virtual private gateway and a VPN customer gateway. The static route allows traffic to be routed from the virtual private gateway to the VPN customer gateway. For more information about VPN connections, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnConnectionRoute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a virtual private gateway. A virtual private gateway is the endpoint on the VPC side of your VPN connection. You can create a virtual private gateway before creating the VPC itself. For more information about virtual private gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnGateway(params: EC2.Types.CreateVpnGatewayRequest, callback?: (err: AWSError, data: EC2.Types.CreateVpnGatewayResult) => void): Request<EC2.Types.CreateVpnGatewayResult, AWSError>;
  /**
   * Creates a virtual private gateway. A virtual private gateway is the endpoint on the VPC side of your VPN connection. You can create a virtual private gateway before creating the VPC itself. For more information about virtual private gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  createVpnGateway(callback?: (err: AWSError, data: EC2.Types.CreateVpnGatewayResult) => void): Request<EC2.Types.CreateVpnGatewayResult, AWSError>;
  /**
   * Deletes the specified customer gateway. You must delete the VPN connection before you can delete the customer gateway.
   */
  deleteCustomerGateway(params: EC2.Types.DeleteCustomerGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified customer gateway. You must delete the VPN connection before you can delete the customer gateway.
   */
  deleteCustomerGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified set of DHCP options. You must disassociate the set of DHCP options before you can delete it. You can disassociate the set of DHCP options by associating either a new set of options or the default set of options with the VPC.
   */
  deleteDhcpOptions(params: EC2.Types.DeleteDhcpOptionsRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified set of DHCP options. You must disassociate the set of DHCP options before you can delete it. You can disassociate the set of DHCP options by associating either a new set of options or the default set of options with the VPC.
   */
  deleteDhcpOptions(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes an egress-only internet gateway.
   */
  deleteEgressOnlyInternetGateway(params: EC2.Types.DeleteEgressOnlyInternetGatewayRequest, callback?: (err: AWSError, data: EC2.Types.DeleteEgressOnlyInternetGatewayResult) => void): Request<EC2.Types.DeleteEgressOnlyInternetGatewayResult, AWSError>;
  /**
   * Deletes an egress-only internet gateway.
   */
  deleteEgressOnlyInternetGateway(callback?: (err: AWSError, data: EC2.Types.DeleteEgressOnlyInternetGatewayResult) => void): Request<EC2.Types.DeleteEgressOnlyInternetGatewayResult, AWSError>;
  /**
   * Deletes the specified EC2 Fleet. After you delete an EC2 Fleet, it launches no new instances. You must specify whether an EC2 Fleet should also terminate its instances. If you terminate the instances, the EC2 Fleet enters the deleted_terminating state. Otherwise, the EC2 Fleet enters the deleted_running state, and the instances continue to run until they are interrupted or you terminate them manually. 
   */
  deleteFleets(params: EC2.Types.DeleteFleetsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteFleetsResult) => void): Request<EC2.Types.DeleteFleetsResult, AWSError>;
  /**
   * Deletes the specified EC2 Fleet. After you delete an EC2 Fleet, it launches no new instances. You must specify whether an EC2 Fleet should also terminate its instances. If you terminate the instances, the EC2 Fleet enters the deleted_terminating state. Otherwise, the EC2 Fleet enters the deleted_running state, and the instances continue to run until they are interrupted or you terminate them manually. 
   */
  deleteFleets(callback?: (err: AWSError, data: EC2.Types.DeleteFleetsResult) => void): Request<EC2.Types.DeleteFleetsResult, AWSError>;
  /**
   * Deletes one or more flow logs.
   */
  deleteFlowLogs(params: EC2.Types.DeleteFlowLogsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteFlowLogsResult) => void): Request<EC2.Types.DeleteFlowLogsResult, AWSError>;
  /**
   * Deletes one or more flow logs.
   */
  deleteFlowLogs(callback?: (err: AWSError, data: EC2.Types.DeleteFlowLogsResult) => void): Request<EC2.Types.DeleteFlowLogsResult, AWSError>;
  /**
   * Deletes the specified Amazon FPGA Image (AFI).
   */
  deleteFpgaImage(params: EC2.Types.DeleteFpgaImageRequest, callback?: (err: AWSError, data: EC2.Types.DeleteFpgaImageResult) => void): Request<EC2.Types.DeleteFpgaImageResult, AWSError>;
  /**
   * Deletes the specified Amazon FPGA Image (AFI).
   */
  deleteFpgaImage(callback?: (err: AWSError, data: EC2.Types.DeleteFpgaImageResult) => void): Request<EC2.Types.DeleteFpgaImageResult, AWSError>;
  /**
   * Deletes the specified internet gateway. You must detach the internet gateway from the VPC before you can delete it.
   */
  deleteInternetGateway(params: EC2.Types.DeleteInternetGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified internet gateway. You must detach the internet gateway from the VPC before you can delete it.
   */
  deleteInternetGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified key pair, by removing the public key from Amazon EC2.
   */
  deleteKeyPair(params: EC2.Types.DeleteKeyPairRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified key pair, by removing the public key from Amazon EC2.
   */
  deleteKeyPair(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a launch template. Deleting a launch template deletes all of its versions.
   */
  deleteLaunchTemplate(params: EC2.Types.DeleteLaunchTemplateRequest, callback?: (err: AWSError, data: EC2.Types.DeleteLaunchTemplateResult) => void): Request<EC2.Types.DeleteLaunchTemplateResult, AWSError>;
  /**
   * Deletes a launch template. Deleting a launch template deletes all of its versions.
   */
  deleteLaunchTemplate(callback?: (err: AWSError, data: EC2.Types.DeleteLaunchTemplateResult) => void): Request<EC2.Types.DeleteLaunchTemplateResult, AWSError>;
  /**
   * Deletes one or more versions of a launch template. You cannot delete the default version of a launch template; you must first assign a different version as the default. If the default version is the only version for the launch template, you must delete the entire launch template using DeleteLaunchTemplate.
   */
  deleteLaunchTemplateVersions(params: EC2.Types.DeleteLaunchTemplateVersionsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteLaunchTemplateVersionsResult) => void): Request<EC2.Types.DeleteLaunchTemplateVersionsResult, AWSError>;
  /**
   * Deletes one or more versions of a launch template. You cannot delete the default version of a launch template; you must first assign a different version as the default. If the default version is the only version for the launch template, you must delete the entire launch template using DeleteLaunchTemplate.
   */
  deleteLaunchTemplateVersions(callback?: (err: AWSError, data: EC2.Types.DeleteLaunchTemplateVersionsResult) => void): Request<EC2.Types.DeleteLaunchTemplateVersionsResult, AWSError>;
  /**
   * Deletes the specified NAT gateway. Deleting a NAT gateway disassociates its Elastic IP address, but does not release the address from your account. Deleting a NAT gateway does not delete any NAT gateway routes in your route tables.
   */
  deleteNatGateway(params: EC2.Types.DeleteNatGatewayRequest, callback?: (err: AWSError, data: EC2.Types.DeleteNatGatewayResult) => void): Request<EC2.Types.DeleteNatGatewayResult, AWSError>;
  /**
   * Deletes the specified NAT gateway. Deleting a NAT gateway disassociates its Elastic IP address, but does not release the address from your account. Deleting a NAT gateway does not delete any NAT gateway routes in your route tables.
   */
  deleteNatGateway(callback?: (err: AWSError, data: EC2.Types.DeleteNatGatewayResult) => void): Request<EC2.Types.DeleteNatGatewayResult, AWSError>;
  /**
   * Deletes the specified network ACL. You can't delete the ACL if it's associated with any subnets. You can't delete the default network ACL.
   */
  deleteNetworkAcl(params: EC2.Types.DeleteNetworkAclRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified network ACL. You can't delete the ACL if it's associated with any subnets. You can't delete the default network ACL.
   */
  deleteNetworkAcl(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified ingress or egress entry (rule) from the specified network ACL.
   */
  deleteNetworkAclEntry(params: EC2.Types.DeleteNetworkAclEntryRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified ingress or egress entry (rule) from the specified network ACL.
   */
  deleteNetworkAclEntry(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified network interface. You must detach the network interface before you can delete it.
   */
  deleteNetworkInterface(params: EC2.Types.DeleteNetworkInterfaceRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified network interface. You must detach the network interface before you can delete it.
   */
  deleteNetworkInterface(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a permission for a network interface. By default, you cannot delete the permission if the account for which you're removing the permission has attached the network interface to an instance. However, you can force delete the permission, regardless of any attachment.
   */
  deleteNetworkInterfacePermission(params: EC2.Types.DeleteNetworkInterfacePermissionRequest, callback?: (err: AWSError, data: EC2.Types.DeleteNetworkInterfacePermissionResult) => void): Request<EC2.Types.DeleteNetworkInterfacePermissionResult, AWSError>;
  /**
   * Deletes a permission for a network interface. By default, you cannot delete the permission if the account for which you're removing the permission has attached the network interface to an instance. However, you can force delete the permission, regardless of any attachment.
   */
  deleteNetworkInterfacePermission(callback?: (err: AWSError, data: EC2.Types.DeleteNetworkInterfacePermissionResult) => void): Request<EC2.Types.DeleteNetworkInterfacePermissionResult, AWSError>;
  /**
   * Deletes the specified placement group. You must terminate all instances in the placement group before you can delete the placement group. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  deletePlacementGroup(params: EC2.Types.DeletePlacementGroupRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified placement group. You must terminate all instances in the placement group before you can delete the placement group. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  deletePlacementGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified route from the specified route table.
   */
  deleteRoute(params: EC2.Types.DeleteRouteRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified route from the specified route table.
   */
  deleteRoute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified route table. You must disassociate the route table from any subnets before you can delete it. You can't delete the main route table.
   */
  deleteRouteTable(params: EC2.Types.DeleteRouteTableRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified route table. You must disassociate the route table from any subnets before you can delete it. You can't delete the main route table.
   */
  deleteRouteTable(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a security group. If you attempt to delete a security group that is associated with an instance, or is referenced by another security group, the operation fails with InvalidGroup.InUse in EC2-Classic or DependencyViolation in EC2-VPC.
   */
  deleteSecurityGroup(params: EC2.Types.DeleteSecurityGroupRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a security group. If you attempt to delete a security group that is associated with an instance, or is referenced by another security group, the operation fails with InvalidGroup.InUse in EC2-Classic or DependencyViolation in EC2-VPC.
   */
  deleteSecurityGroup(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified snapshot. When you make periodic snapshots of a volume, the snapshots are incremental, and only the blocks on the device that have changed since your last snapshot are saved in the new snapshot. When you delete a snapshot, only the data not needed for any other snapshot is removed. So regardless of which prior snapshots have been deleted, all active snapshots will have access to all the information needed to restore the volume. You cannot delete a snapshot of the root device of an EBS volume used by a registered AMI. You must first de-register the AMI before you can delete the snapshot. For more information, see Deleting an Amazon EBS Snapshot in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteSnapshot(params: EC2.Types.DeleteSnapshotRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified snapshot. When you make periodic snapshots of a volume, the snapshots are incremental, and only the blocks on the device that have changed since your last snapshot are saved in the new snapshot. When you delete a snapshot, only the data not needed for any other snapshot is removed. So regardless of which prior snapshots have been deleted, all active snapshots will have access to all the information needed to restore the volume. You cannot delete a snapshot of the root device of an EBS volume used by a registered AMI. You must first de-register the AMI before you can delete the snapshot. For more information, see Deleting an Amazon EBS Snapshot in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteSnapshot(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the data feed for Spot Instances.
   */
  deleteSpotDatafeedSubscription(params: EC2.Types.DeleteSpotDatafeedSubscriptionRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the data feed for Spot Instances.
   */
  deleteSpotDatafeedSubscription(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified subnet. You must terminate all running instances in the subnet before you can delete the subnet.
   */
  deleteSubnet(params: EC2.Types.DeleteSubnetRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified subnet. You must terminate all running instances in the subnet before you can delete the subnet.
   */
  deleteSubnet(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified set of tags from the specified set of resources. To list the current tags, use DescribeTags. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteTags(params: EC2.Types.DeleteTagsRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified set of tags from the specified set of resources. To list the current tags, use DescribeTags. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteTags(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified EBS volume. The volume must be in the available state (not attached to an instance). The volume can remain in the deleting state for several minutes. For more information, see Deleting an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteVolume(params: EC2.Types.DeleteVolumeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified EBS volume. The volume must be in the available state (not attached to an instance). The volume can remain in the deleting state for several minutes. For more information, see Deleting an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  deleteVolume(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified VPC. You must detach or delete all gateways and resources that are associated with the VPC before you can delete it. For example, you must terminate all instances running in the VPC, delete all security groups associated with the VPC (except the default one), delete all route tables associated with the VPC (except the default one), and so on.
   */
  deleteVpc(params: EC2.Types.DeleteVpcRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified VPC. You must detach or delete all gateways and resources that are associated with the VPC before you can delete it. For example, you must terminate all instances running in the VPC, delete all security groups associated with the VPC (except the default one), delete all route tables associated with the VPC (except the default one), and so on.
   */
  deleteVpc(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes one or more VPC endpoint connection notifications.
   */
  deleteVpcEndpointConnectionNotifications(params: EC2.Types.DeleteVpcEndpointConnectionNotificationsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointConnectionNotificationsResult) => void): Request<EC2.Types.DeleteVpcEndpointConnectionNotificationsResult, AWSError>;
  /**
   * Deletes one or more VPC endpoint connection notifications.
   */
  deleteVpcEndpointConnectionNotifications(callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointConnectionNotificationsResult) => void): Request<EC2.Types.DeleteVpcEndpointConnectionNotificationsResult, AWSError>;
  /**
   * Deletes one or more VPC endpoint service configurations in your account. Before you delete the endpoint service configuration, you must reject any Available or PendingAcceptance interface endpoint connections that are attached to the service.
   */
  deleteVpcEndpointServiceConfigurations(params: EC2.Types.DeleteVpcEndpointServiceConfigurationsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointServiceConfigurationsResult) => void): Request<EC2.Types.DeleteVpcEndpointServiceConfigurationsResult, AWSError>;
  /**
   * Deletes one or more VPC endpoint service configurations in your account. Before you delete the endpoint service configuration, you must reject any Available or PendingAcceptance interface endpoint connections that are attached to the service.
   */
  deleteVpcEndpointServiceConfigurations(callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointServiceConfigurationsResult) => void): Request<EC2.Types.DeleteVpcEndpointServiceConfigurationsResult, AWSError>;
  /**
   * Deletes one or more specified VPC endpoints. Deleting a gateway endpoint also deletes the endpoint routes in the route tables that were associated with the endpoint. Deleting an interface endpoint deletes the endpoint network interfaces.
   */
  deleteVpcEndpoints(params: EC2.Types.DeleteVpcEndpointsRequest, callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointsResult) => void): Request<EC2.Types.DeleteVpcEndpointsResult, AWSError>;
  /**
   * Deletes one or more specified VPC endpoints. Deleting a gateway endpoint also deletes the endpoint routes in the route tables that were associated with the endpoint. Deleting an interface endpoint deletes the endpoint network interfaces.
   */
  deleteVpcEndpoints(callback?: (err: AWSError, data: EC2.Types.DeleteVpcEndpointsResult) => void): Request<EC2.Types.DeleteVpcEndpointsResult, AWSError>;
  /**
   * Deletes a VPC peering connection. Either the owner of the requester VPC or the owner of the accepter VPC can delete the VPC peering connection if it's in the active state. The owner of the requester VPC can delete a VPC peering connection in the pending-acceptance state. You cannot delete a VPC peering connection that's in the failed state.
   */
  deleteVpcPeeringConnection(params: EC2.Types.DeleteVpcPeeringConnectionRequest, callback?: (err: AWSError, data: EC2.Types.DeleteVpcPeeringConnectionResult) => void): Request<EC2.Types.DeleteVpcPeeringConnectionResult, AWSError>;
  /**
   * Deletes a VPC peering connection. Either the owner of the requester VPC or the owner of the accepter VPC can delete the VPC peering connection if it's in the active state. The owner of the requester VPC can delete a VPC peering connection in the pending-acceptance state. You cannot delete a VPC peering connection that's in the failed state.
   */
  deleteVpcPeeringConnection(callback?: (err: AWSError, data: EC2.Types.DeleteVpcPeeringConnectionResult) => void): Request<EC2.Types.DeleteVpcPeeringConnectionResult, AWSError>;
  /**
   * Deletes the specified VPN connection. If you're deleting the VPC and its associated components, we recommend that you detach the virtual private gateway from the VPC and delete the VPC before deleting the VPN connection. If you believe that the tunnel credentials for your VPN connection have been compromised, you can delete the VPN connection and create a new one that has new keys, without needing to delete the VPC or virtual private gateway. If you create a new VPN connection, you must reconfigure the customer gateway using the new configuration information returned with the new VPN connection ID.
   */
  deleteVpnConnection(params: EC2.Types.DeleteVpnConnectionRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified VPN connection. If you're deleting the VPC and its associated components, we recommend that you detach the virtual private gateway from the VPC and delete the VPC before deleting the VPN connection. If you believe that the tunnel credentials for your VPN connection have been compromised, you can delete the VPN connection and create a new one that has new keys, without needing to delete the VPC or virtual private gateway. If you create a new VPN connection, you must reconfigure the customer gateway using the new configuration information returned with the new VPN connection ID.
   */
  deleteVpnConnection(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified static route associated with a VPN connection between an existing virtual private gateway and a VPN customer gateway. The static route allows traffic to be routed from the virtual private gateway to the VPN customer gateway.
   */
  deleteVpnConnectionRoute(params: EC2.Types.DeleteVpnConnectionRouteRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified static route associated with a VPN connection between an existing virtual private gateway and a VPN customer gateway. The static route allows traffic to be routed from the virtual private gateway to the VPN customer gateway.
   */
  deleteVpnConnectionRoute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified virtual private gateway. We recommend that before you delete a virtual private gateway, you detach it from the VPC and delete the VPN connection. Note that you don't need to delete the virtual private gateway if you plan to delete and recreate the VPN connection between your VPC and your network.
   */
  deleteVpnGateway(params: EC2.Types.DeleteVpnGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes the specified virtual private gateway. We recommend that before you delete a virtual private gateway, you detach it from the VPC and delete the VPN connection. Note that you don't need to delete the virtual private gateway if you plan to delete and recreate the VPN connection between your VPC and your network.
   */
  deleteVpnGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deregisters the specified AMI. After you deregister an AMI, it can't be used to launch new instances; however, it doesn't affect any instances that you've already launched from the AMI. You'll continue to incur usage costs for those instances until you terminate them. When you deregister an Amazon EBS-backed AMI, it doesn't affect the snapshot that was created for the root volume of the instance during the AMI creation process. When you deregister an instance store-backed AMI, it doesn't affect the files that you uploaded to Amazon S3 when you created the AMI.
   */
  deregisterImage(params: EC2.Types.DeregisterImageRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deregisters the specified AMI. After you deregister an AMI, it can't be used to launch new instances; however, it doesn't affect any instances that you've already launched from the AMI. You'll continue to incur usage costs for those instances until you terminate them. When you deregister an Amazon EBS-backed AMI, it doesn't affect the snapshot that was created for the root volume of the instance during the AMI creation process. When you deregister an instance store-backed AMI, it doesn't affect the files that you uploaded to Amazon S3 when you created the AMI.
   */
  deregisterImage(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Describes attributes of your AWS account. The following are the supported account attributes:    supported-platforms: Indicates whether your account can launch instances into EC2-Classic and EC2-VPC, or only into EC2-VPC.    default-vpc: The ID of the default VPC for your account, or none.    max-instances: The maximum number of On-Demand Instances that you can run.    vpc-max-security-groups-per-interface: The maximum number of security groups that you can assign to a network interface.    max-elastic-ips: The maximum number of Elastic IP addresses that you can allocate for use with EC2-Classic.     vpc-max-elastic-ips: The maximum number of Elastic IP addresses that you can allocate for use with EC2-VPC.  
   */
  describeAccountAttributes(params: EC2.Types.DescribeAccountAttributesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeAccountAttributesResult) => void): Request<EC2.Types.DescribeAccountAttributesResult, AWSError>;
  /**
   * Describes attributes of your AWS account. The following are the supported account attributes:    supported-platforms: Indicates whether your account can launch instances into EC2-Classic and EC2-VPC, or only into EC2-VPC.    default-vpc: The ID of the default VPC for your account, or none.    max-instances: The maximum number of On-Demand Instances that you can run.    vpc-max-security-groups-per-interface: The maximum number of security groups that you can assign to a network interface.    max-elastic-ips: The maximum number of Elastic IP addresses that you can allocate for use with EC2-Classic.     vpc-max-elastic-ips: The maximum number of Elastic IP addresses that you can allocate for use with EC2-VPC.  
   */
  describeAccountAttributes(callback?: (err: AWSError, data: EC2.Types.DescribeAccountAttributesResult) => void): Request<EC2.Types.DescribeAccountAttributesResult, AWSError>;
  /**
   * Describes one or more of your Elastic IP addresses. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide.
   */
  describeAddresses(params: EC2.Types.DescribeAddressesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeAddressesResult) => void): Request<EC2.Types.DescribeAddressesResult, AWSError>;
  /**
   * Describes one or more of your Elastic IP addresses. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide.
   */
  describeAddresses(callback?: (err: AWSError, data: EC2.Types.DescribeAddressesResult) => void): Request<EC2.Types.DescribeAddressesResult, AWSError>;
  /**
   * Describes the longer ID format settings for all resource types in a specific region. This request is useful for performing a quick audit to determine whether a specific region is fully opted in for longer IDs (17-character IDs). This request only returns information about resource types that support longer IDs. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.
   */
  describeAggregateIdFormat(params: EC2.Types.DescribeAggregateIdFormatRequest, callback?: (err: AWSError, data: EC2.Types.DescribeAggregateIdFormatResult) => void): Request<EC2.Types.DescribeAggregateIdFormatResult, AWSError>;
  /**
   * Describes the longer ID format settings for all resource types in a specific region. This request is useful for performing a quick audit to determine whether a specific region is fully opted in for longer IDs (17-character IDs). This request only returns information about resource types that support longer IDs. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.
   */
  describeAggregateIdFormat(callback?: (err: AWSError, data: EC2.Types.DescribeAggregateIdFormatResult) => void): Request<EC2.Types.DescribeAggregateIdFormatResult, AWSError>;
  /**
   * Describes one or more of the Availability Zones that are available to you. The results include zones only for the region you're currently using. If there is an event impacting an Availability Zone, you can use this request to view the state and any provided message for that Availability Zone. For more information, see Regions and Availability Zones in the Amazon Elastic Compute Cloud User Guide.
   */
  describeAvailabilityZones(params: EC2.Types.DescribeAvailabilityZonesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeAvailabilityZonesResult) => void): Request<EC2.Types.DescribeAvailabilityZonesResult, AWSError>;
  /**
   * Describes one or more of the Availability Zones that are available to you. The results include zones only for the region you're currently using. If there is an event impacting an Availability Zone, you can use this request to view the state and any provided message for that Availability Zone. For more information, see Regions and Availability Zones in the Amazon Elastic Compute Cloud User Guide.
   */
  describeAvailabilityZones(callback?: (err: AWSError, data: EC2.Types.DescribeAvailabilityZonesResult) => void): Request<EC2.Types.DescribeAvailabilityZonesResult, AWSError>;
  /**
   * Describes one or more of your bundling tasks.  Completed bundle tasks are listed for only a limited time. If your bundle task is no longer in the list, you can still register an AMI from it. Just use RegisterImage with the Amazon S3 bucket name and image manifest name you provided to the bundle task. 
   */
  describeBundleTasks(params: EC2.Types.DescribeBundleTasksRequest, callback?: (err: AWSError, data: EC2.Types.DescribeBundleTasksResult) => void): Request<EC2.Types.DescribeBundleTasksResult, AWSError>;
  /**
   * Describes one or more of your bundling tasks.  Completed bundle tasks are listed for only a limited time. If your bundle task is no longer in the list, you can still register an AMI from it. Just use RegisterImage with the Amazon S3 bucket name and image manifest name you provided to the bundle task. 
   */
  describeBundleTasks(callback?: (err: AWSError, data: EC2.Types.DescribeBundleTasksResult) => void): Request<EC2.Types.DescribeBundleTasksResult, AWSError>;
  /**
   * Describes one or more of your linked EC2-Classic instances. This request only returns information about EC2-Classic instances linked to a VPC through ClassicLink. You cannot use this request to return information about other instances.
   */
  describeClassicLinkInstances(params: EC2.Types.DescribeClassicLinkInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeClassicLinkInstancesResult) => void): Request<EC2.Types.DescribeClassicLinkInstancesResult, AWSError>;
  /**
   * Describes one or more of your linked EC2-Classic instances. This request only returns information about EC2-Classic instances linked to a VPC through ClassicLink. You cannot use this request to return information about other instances.
   */
  describeClassicLinkInstances(callback?: (err: AWSError, data: EC2.Types.DescribeClassicLinkInstancesResult) => void): Request<EC2.Types.DescribeClassicLinkInstancesResult, AWSError>;
  /**
   * Describes one or more of your conversion tasks. For more information, see the VM Import/Export User Guide. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  describeConversionTasks(params: EC2.Types.DescribeConversionTasksRequest, callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Describes one or more of your conversion tasks. For more information, see the VM Import/Export User Guide. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  describeConversionTasks(callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Describes one or more of your VPN customer gateways. For more information about VPN customer gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeCustomerGateways(params: EC2.Types.DescribeCustomerGatewaysRequest, callback?: (err: AWSError, data: EC2.Types.DescribeCustomerGatewaysResult) => void): Request<EC2.Types.DescribeCustomerGatewaysResult, AWSError>;
  /**
   * Describes one or more of your VPN customer gateways. For more information about VPN customer gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeCustomerGateways(callback?: (err: AWSError, data: EC2.Types.DescribeCustomerGatewaysResult) => void): Request<EC2.Types.DescribeCustomerGatewaysResult, AWSError>;
  /**
   * Describes one or more of your DHCP options sets. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  describeDhcpOptions(params: EC2.Types.DescribeDhcpOptionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeDhcpOptionsResult) => void): Request<EC2.Types.DescribeDhcpOptionsResult, AWSError>;
  /**
   * Describes one or more of your DHCP options sets. For more information, see DHCP Options Sets in the Amazon Virtual Private Cloud User Guide.
   */
  describeDhcpOptions(callback?: (err: AWSError, data: EC2.Types.DescribeDhcpOptionsResult) => void): Request<EC2.Types.DescribeDhcpOptionsResult, AWSError>;
  /**
   * Describes one or more of your egress-only internet gateways.
   */
  describeEgressOnlyInternetGateways(params: EC2.Types.DescribeEgressOnlyInternetGatewaysRequest, callback?: (err: AWSError, data: EC2.Types.DescribeEgressOnlyInternetGatewaysResult) => void): Request<EC2.Types.DescribeEgressOnlyInternetGatewaysResult, AWSError>;
  /**
   * Describes one or more of your egress-only internet gateways.
   */
  describeEgressOnlyInternetGateways(callback?: (err: AWSError, data: EC2.Types.DescribeEgressOnlyInternetGatewaysResult) => void): Request<EC2.Types.DescribeEgressOnlyInternetGatewaysResult, AWSError>;
  /**
   * Describes the Elastic GPUs associated with your instances. For more information about Elastic GPUs, see Amazon EC2 Elastic GPUs.
   */
  describeElasticGpus(params: EC2.Types.DescribeElasticGpusRequest, callback?: (err: AWSError, data: EC2.Types.DescribeElasticGpusResult) => void): Request<EC2.Types.DescribeElasticGpusResult, AWSError>;
  /**
   * Describes the Elastic GPUs associated with your instances. For more information about Elastic GPUs, see Amazon EC2 Elastic GPUs.
   */
  describeElasticGpus(callback?: (err: AWSError, data: EC2.Types.DescribeElasticGpusResult) => void): Request<EC2.Types.DescribeElasticGpusResult, AWSError>;
  /**
   * Describes one or more of your export tasks.
   */
  describeExportTasks(params: EC2.Types.DescribeExportTasksRequest, callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Describes one or more of your export tasks.
   */
  describeExportTasks(callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Describes the events for the specified EC2 Fleet during the specified time.
   */
  describeFleetHistory(params: EC2.Types.DescribeFleetHistoryRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFleetHistoryResult) => void): Request<EC2.Types.DescribeFleetHistoryResult, AWSError>;
  /**
   * Describes the events for the specified EC2 Fleet during the specified time.
   */
  describeFleetHistory(callback?: (err: AWSError, data: EC2.Types.DescribeFleetHistoryResult) => void): Request<EC2.Types.DescribeFleetHistoryResult, AWSError>;
  /**
   * Describes the running instances for the specified EC2 Fleet.
   */
  describeFleetInstances(params: EC2.Types.DescribeFleetInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFleetInstancesResult) => void): Request<EC2.Types.DescribeFleetInstancesResult, AWSError>;
  /**
   * Describes the running instances for the specified EC2 Fleet.
   */
  describeFleetInstances(callback?: (err: AWSError, data: EC2.Types.DescribeFleetInstancesResult) => void): Request<EC2.Types.DescribeFleetInstancesResult, AWSError>;
  /**
   * Describes one or more of your EC2 Fleet.
   */
  describeFleets(params: EC2.Types.DescribeFleetsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFleetsResult) => void): Request<EC2.Types.DescribeFleetsResult, AWSError>;
  /**
   * Describes one or more of your EC2 Fleet.
   */
  describeFleets(callback?: (err: AWSError, data: EC2.Types.DescribeFleetsResult) => void): Request<EC2.Types.DescribeFleetsResult, AWSError>;
  /**
   * Describes one or more flow logs. To view the information in your flow logs (the log streams for the network interfaces), you must use the CloudWatch Logs console or the CloudWatch Logs API.
   */
  describeFlowLogs(params: EC2.Types.DescribeFlowLogsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFlowLogsResult) => void): Request<EC2.Types.DescribeFlowLogsResult, AWSError>;
  /**
   * Describes one or more flow logs. To view the information in your flow logs (the log streams for the network interfaces), you must use the CloudWatch Logs console or the CloudWatch Logs API.
   */
  describeFlowLogs(callback?: (err: AWSError, data: EC2.Types.DescribeFlowLogsResult) => void): Request<EC2.Types.DescribeFlowLogsResult, AWSError>;
  /**
   * Describes the specified attribute of the specified Amazon FPGA Image (AFI).
   */
  describeFpgaImageAttribute(params: EC2.Types.DescribeFpgaImageAttributeRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFpgaImageAttributeResult) => void): Request<EC2.Types.DescribeFpgaImageAttributeResult, AWSError>;
  /**
   * Describes the specified attribute of the specified Amazon FPGA Image (AFI).
   */
  describeFpgaImageAttribute(callback?: (err: AWSError, data: EC2.Types.DescribeFpgaImageAttributeResult) => void): Request<EC2.Types.DescribeFpgaImageAttributeResult, AWSError>;
  /**
   * Describes one or more available Amazon FPGA Images (AFIs). These include public AFIs, private AFIs that you own, and AFIs owned by other AWS accounts for which you have load permissions.
   */
  describeFpgaImages(params: EC2.Types.DescribeFpgaImagesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeFpgaImagesResult) => void): Request<EC2.Types.DescribeFpgaImagesResult, AWSError>;
  /**
   * Describes one or more available Amazon FPGA Images (AFIs). These include public AFIs, private AFIs that you own, and AFIs owned by other AWS accounts for which you have load permissions.
   */
  describeFpgaImages(callback?: (err: AWSError, data: EC2.Types.DescribeFpgaImagesResult) => void): Request<EC2.Types.DescribeFpgaImagesResult, AWSError>;
  /**
   * Describes the Dedicated Host reservations that are available to purchase. The results describe all the Dedicated Host reservation offerings, including offerings that may not match the instance family and region of your Dedicated Hosts. When purchasing an offering, ensure that the instance family and Region of the offering matches that of the Dedicated Hosts with which it is to be associated. For more information about supported instance types, see Dedicated Hosts Overview in the Amazon Elastic Compute Cloud User Guide. 
   */
  describeHostReservationOfferings(params: EC2.Types.DescribeHostReservationOfferingsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeHostReservationOfferingsResult) => void): Request<EC2.Types.DescribeHostReservationOfferingsResult, AWSError>;
  /**
   * Describes the Dedicated Host reservations that are available to purchase. The results describe all the Dedicated Host reservation offerings, including offerings that may not match the instance family and region of your Dedicated Hosts. When purchasing an offering, ensure that the instance family and Region of the offering matches that of the Dedicated Hosts with which it is to be associated. For more information about supported instance types, see Dedicated Hosts Overview in the Amazon Elastic Compute Cloud User Guide. 
   */
  describeHostReservationOfferings(callback?: (err: AWSError, data: EC2.Types.DescribeHostReservationOfferingsResult) => void): Request<EC2.Types.DescribeHostReservationOfferingsResult, AWSError>;
  /**
   * Describes reservations that are associated with Dedicated Hosts in your account.
   */
  describeHostReservations(params: EC2.Types.DescribeHostReservationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeHostReservationsResult) => void): Request<EC2.Types.DescribeHostReservationsResult, AWSError>;
  /**
   * Describes reservations that are associated with Dedicated Hosts in your account.
   */
  describeHostReservations(callback?: (err: AWSError, data: EC2.Types.DescribeHostReservationsResult) => void): Request<EC2.Types.DescribeHostReservationsResult, AWSError>;
  /**
   * Describes one or more of your Dedicated Hosts. The results describe only the Dedicated Hosts in the region you're currently using. All listed instances consume capacity on your Dedicated Host. Dedicated Hosts that have recently been released are listed with the state released.
   */
  describeHosts(params: EC2.Types.DescribeHostsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeHostsResult) => void): Request<EC2.Types.DescribeHostsResult, AWSError>;
  /**
   * Describes one or more of your Dedicated Hosts. The results describe only the Dedicated Hosts in the region you're currently using. All listed instances consume capacity on your Dedicated Host. Dedicated Hosts that have recently been released are listed with the state released.
   */
  describeHosts(callback?: (err: AWSError, data: EC2.Types.DescribeHostsResult) => void): Request<EC2.Types.DescribeHostsResult, AWSError>;
  /**
   * Describes your IAM instance profile associations.
   */
  describeIamInstanceProfileAssociations(params: EC2.Types.DescribeIamInstanceProfileAssociationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeIamInstanceProfileAssociationsResult) => void): Request<EC2.Types.DescribeIamInstanceProfileAssociationsResult, AWSError>;
  /**
   * Describes your IAM instance profile associations.
   */
  describeIamInstanceProfileAssociations(callback?: (err: AWSError, data: EC2.Types.DescribeIamInstanceProfileAssociationsResult) => void): Request<EC2.Types.DescribeIamInstanceProfileAssociationsResult, AWSError>;
  /**
   * Describes the ID format settings for your resources on a per-region basis, for example, to view which resource types are enabled for longer IDs. This request only returns information about resource types whose ID formats can be modified; it does not return information about other resource types. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  These settings apply to the IAM user who makes the request; they do not apply to the entire AWS account. By default, an IAM user defaults to the same settings as the root user, unless they explicitly override the settings by running the ModifyIdFormat command. Resources created with longer IDs are visible to all IAM users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  describeIdFormat(params: EC2.Types.DescribeIdFormatRequest, callback?: (err: AWSError, data: EC2.Types.DescribeIdFormatResult) => void): Request<EC2.Types.DescribeIdFormatResult, AWSError>;
  /**
   * Describes the ID format settings for your resources on a per-region basis, for example, to view which resource types are enabled for longer IDs. This request only returns information about resource types whose ID formats can be modified; it does not return information about other resource types. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  These settings apply to the IAM user who makes the request; they do not apply to the entire AWS account. By default, an IAM user defaults to the same settings as the root user, unless they explicitly override the settings by running the ModifyIdFormat command. Resources created with longer IDs are visible to all IAM users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  describeIdFormat(callback?: (err: AWSError, data: EC2.Types.DescribeIdFormatResult) => void): Request<EC2.Types.DescribeIdFormatResult, AWSError>;
  /**
   * Describes the ID format settings for resources for the specified IAM user, IAM role, or root user. For example, you can view the resource types that are enabled for longer IDs. This request only returns information about resource types whose ID formats can be modified; it does not return information about other resource types. For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  These settings apply to the principal specified in the request. They do not apply to the principal that makes the request.
   */
  describeIdentityIdFormat(params: EC2.Types.DescribeIdentityIdFormatRequest, callback?: (err: AWSError, data: EC2.Types.DescribeIdentityIdFormatResult) => void): Request<EC2.Types.DescribeIdentityIdFormatResult, AWSError>;
  /**
   * Describes the ID format settings for resources for the specified IAM user, IAM role, or root user. For example, you can view the resource types that are enabled for longer IDs. This request only returns information about resource types whose ID formats can be modified; it does not return information about other resource types. For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  These settings apply to the principal specified in the request. They do not apply to the principal that makes the request.
   */
  describeIdentityIdFormat(callback?: (err: AWSError, data: EC2.Types.DescribeIdentityIdFormatResult) => void): Request<EC2.Types.DescribeIdentityIdFormatResult, AWSError>;
  /**
   * Describes the specified attribute of the specified AMI. You can specify only one attribute at a time.
   */
  describeImageAttribute(params: EC2.Types.DescribeImageAttributeRequest, callback?: (err: AWSError, data: EC2.Types.ImageAttribute) => void): Request<EC2.Types.ImageAttribute, AWSError>;
  /**
   * Describes the specified attribute of the specified AMI. You can specify only one attribute at a time.
   */
  describeImageAttribute(callback?: (err: AWSError, data: EC2.Types.ImageAttribute) => void): Request<EC2.Types.ImageAttribute, AWSError>;
  /**
   * Describes one or more of the images (AMIs, AKIs, and ARIs) available to you. Images available to you include public images, private images that you own, and private images owned by other AWS accounts but for which you have explicit launch permissions.  Deregistered images are included in the returned results for an unspecified interval after deregistration. 
   */
  describeImages(params: EC2.Types.DescribeImagesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Describes one or more of the images (AMIs, AKIs, and ARIs) available to you. Images available to you include public images, private images that you own, and private images owned by other AWS accounts but for which you have explicit launch permissions.  Deregistered images are included in the returned results for an unspecified interval after deregistration. 
   */
  describeImages(callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Displays details about an import virtual machine or import snapshot tasks that are already created.
   */
  describeImportImageTasks(params: EC2.Types.DescribeImportImageTasksRequest, callback?: (err: AWSError, data: EC2.Types.DescribeImportImageTasksResult) => void): Request<EC2.Types.DescribeImportImageTasksResult, AWSError>;
  /**
   * Displays details about an import virtual machine or import snapshot tasks that are already created.
   */
  describeImportImageTasks(callback?: (err: AWSError, data: EC2.Types.DescribeImportImageTasksResult) => void): Request<EC2.Types.DescribeImportImageTasksResult, AWSError>;
  /**
   * Describes your import snapshot tasks.
   */
  describeImportSnapshotTasks(params: EC2.Types.DescribeImportSnapshotTasksRequest, callback?: (err: AWSError, data: EC2.Types.DescribeImportSnapshotTasksResult) => void): Request<EC2.Types.DescribeImportSnapshotTasksResult, AWSError>;
  /**
   * Describes your import snapshot tasks.
   */
  describeImportSnapshotTasks(callback?: (err: AWSError, data: EC2.Types.DescribeImportSnapshotTasksResult) => void): Request<EC2.Types.DescribeImportSnapshotTasksResult, AWSError>;
  /**
   * Describes the specified attribute of the specified instance. You can specify only one attribute at a time. Valid attribute values are: instanceType | kernel | ramdisk | userData | disableApiTermination | instanceInitiatedShutdownBehavior | rootDeviceName | blockDeviceMapping | productCodes | sourceDestCheck | groupSet | ebsOptimized | sriovNetSupport 
   */
  describeInstanceAttribute(params: EC2.Types.DescribeInstanceAttributeRequest, callback?: (err: AWSError, data: EC2.Types.InstanceAttribute) => void): Request<EC2.Types.InstanceAttribute, AWSError>;
  /**
   * Describes the specified attribute of the specified instance. You can specify only one attribute at a time. Valid attribute values are: instanceType | kernel | ramdisk | userData | disableApiTermination | instanceInitiatedShutdownBehavior | rootDeviceName | blockDeviceMapping | productCodes | sourceDestCheck | groupSet | ebsOptimized | sriovNetSupport 
   */
  describeInstanceAttribute(callback?: (err: AWSError, data: EC2.Types.InstanceAttribute) => void): Request<EC2.Types.InstanceAttribute, AWSError>;
  /**
   * Describes the credit option for CPU usage of one or more of your T2 or T3 instances. The credit options are standard and unlimited. If you do not specify an instance ID, Amazon EC2 returns T2 and T3 instances with the unlimited credit option, as well as instances that were previously configured as T2 or T3 with the unlimited credit option. For example, if you resize a T2 instance, while it is configured as unlimited, to an M4 instance, Amazon EC2 returns the M4 instance. If you specify one or more instance IDs, Amazon EC2 returns the credit option (standard or unlimited) of those instances. If you specify an instance ID that is not valid, such as an instance that is not a T2 or T3 instance, an error is returned. Recently terminated instances might appear in the returned results. This interval is usually less than one hour. If an Availability Zone is experiencing a service disruption and you specify instance IDs in the affected zone, or do not specify any instance IDs at all, the call fails. If you specify only instance IDs in an unaffected zone, the call works normally. For more information, see Burstable Performance Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeInstanceCreditSpecifications(params: EC2.Types.DescribeInstanceCreditSpecificationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeInstanceCreditSpecificationsResult) => void): Request<EC2.Types.DescribeInstanceCreditSpecificationsResult, AWSError>;
  /**
   * Describes the credit option for CPU usage of one or more of your T2 or T3 instances. The credit options are standard and unlimited. If you do not specify an instance ID, Amazon EC2 returns T2 and T3 instances with the unlimited credit option, as well as instances that were previously configured as T2 or T3 with the unlimited credit option. For example, if you resize a T2 instance, while it is configured as unlimited, to an M4 instance, Amazon EC2 returns the M4 instance. If you specify one or more instance IDs, Amazon EC2 returns the credit option (standard or unlimited) of those instances. If you specify an instance ID that is not valid, such as an instance that is not a T2 or T3 instance, an error is returned. Recently terminated instances might appear in the returned results. This interval is usually less than one hour. If an Availability Zone is experiencing a service disruption and you specify instance IDs in the affected zone, or do not specify any instance IDs at all, the call fails. If you specify only instance IDs in an unaffected zone, the call works normally. For more information, see Burstable Performance Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeInstanceCreditSpecifications(callback?: (err: AWSError, data: EC2.Types.DescribeInstanceCreditSpecificationsResult) => void): Request<EC2.Types.DescribeInstanceCreditSpecificationsResult, AWSError>;
  /**
   * Describes the status of one or more instances. By default, only running instances are described, unless you specifically indicate to return the status of all instances. Instance status includes the following components:    Status checks - Amazon EC2 performs status checks on running EC2 instances to identify hardware and software issues. For more information, see Status Checks for Your Instances and Troubleshooting Instances with Failed Status Checks in the Amazon Elastic Compute Cloud User Guide.    Scheduled events - Amazon EC2 can schedule events (such as reboot, stop, or terminate) for your instances related to hardware issues, software updates, or system maintenance. For more information, see Scheduled Events for Your Instances in the Amazon Elastic Compute Cloud User Guide.    Instance state - You can manage your instances from the moment you launch them through their termination. For more information, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide.  
   */
  describeInstanceStatus(params: EC2.Types.DescribeInstanceStatusRequest, callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Describes the status of one or more instances. By default, only running instances are described, unless you specifically indicate to return the status of all instances. Instance status includes the following components:    Status checks - Amazon EC2 performs status checks on running EC2 instances to identify hardware and software issues. For more information, see Status Checks for Your Instances and Troubleshooting Instances with Failed Status Checks in the Amazon Elastic Compute Cloud User Guide.    Scheduled events - Amazon EC2 can schedule events (such as reboot, stop, or terminate) for your instances related to hardware issues, software updates, or system maintenance. For more information, see Scheduled Events for Your Instances in the Amazon Elastic Compute Cloud User Guide.    Instance state - You can manage your instances from the moment you launch them through their termination. For more information, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide.  
   */
  describeInstanceStatus(callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Describes one or more of your instances. If you specify one or more instance IDs, Amazon EC2 returns information for those instances. If you do not specify instance IDs, Amazon EC2 returns information for all relevant instances. If you specify an instance ID that is not valid, an error is returned. If you specify an instance that you do not own, it is not included in the returned results. Recently terminated instances might appear in the returned results. This interval is usually less than one hour. If you describe instances in the rare case where an Availability Zone is experiencing a service disruption and you specify instance IDs that are in the affected zone, or do not specify any instance IDs at all, the call fails. If you describe instances and specify only instance IDs that are in an unaffected zone, the call works normally.
   */
  describeInstances(params: EC2.Types.DescribeInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Describes one or more of your instances. If you specify one or more instance IDs, Amazon EC2 returns information for those instances. If you do not specify instance IDs, Amazon EC2 returns information for all relevant instances. If you specify an instance ID that is not valid, an error is returned. If you specify an instance that you do not own, it is not included in the returned results. Recently terminated instances might appear in the returned results. This interval is usually less than one hour. If you describe instances in the rare case where an Availability Zone is experiencing a service disruption and you specify instance IDs that are in the affected zone, or do not specify any instance IDs at all, the call fails. If you describe instances and specify only instance IDs that are in an unaffected zone, the call works normally.
   */
  describeInstances(callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Describes one or more of your internet gateways.
   */
  describeInternetGateways(params: EC2.Types.DescribeInternetGatewaysRequest, callback?: (err: AWSError, data: EC2.Types.DescribeInternetGatewaysResult) => void): Request<EC2.Types.DescribeInternetGatewaysResult, AWSError>;
  /**
   * Describes one or more of your internet gateways.
   */
  describeInternetGateways(callback?: (err: AWSError, data: EC2.Types.DescribeInternetGatewaysResult) => void): Request<EC2.Types.DescribeInternetGatewaysResult, AWSError>;
  /**
   * Describes one or more of your key pairs. For more information about key pairs, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  describeKeyPairs(params: EC2.Types.DescribeKeyPairsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeKeyPairsResult) => void): Request<EC2.Types.DescribeKeyPairsResult, AWSError>;
  /**
   * Describes one or more of your key pairs. For more information about key pairs, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  describeKeyPairs(callback?: (err: AWSError, data: EC2.Types.DescribeKeyPairsResult) => void): Request<EC2.Types.DescribeKeyPairsResult, AWSError>;
  /**
   * Describes one or more versions of a specified launch template. You can describe all versions, individual versions, or a range of versions.
   */
  describeLaunchTemplateVersions(params: EC2.Types.DescribeLaunchTemplateVersionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeLaunchTemplateVersionsResult) => void): Request<EC2.Types.DescribeLaunchTemplateVersionsResult, AWSError>;
  /**
   * Describes one or more versions of a specified launch template. You can describe all versions, individual versions, or a range of versions.
   */
  describeLaunchTemplateVersions(callback?: (err: AWSError, data: EC2.Types.DescribeLaunchTemplateVersionsResult) => void): Request<EC2.Types.DescribeLaunchTemplateVersionsResult, AWSError>;
  /**
   * Describes one or more launch templates.
   */
  describeLaunchTemplates(params: EC2.Types.DescribeLaunchTemplatesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeLaunchTemplatesResult) => void): Request<EC2.Types.DescribeLaunchTemplatesResult, AWSError>;
  /**
   * Describes one or more launch templates.
   */
  describeLaunchTemplates(callback?: (err: AWSError, data: EC2.Types.DescribeLaunchTemplatesResult) => void): Request<EC2.Types.DescribeLaunchTemplatesResult, AWSError>;
  /**
   * Describes your Elastic IP addresses that are being moved to the EC2-VPC platform, or that are being restored to the EC2-Classic platform. This request does not return information about any other Elastic IP addresses in your account.
   */
  describeMovingAddresses(params: EC2.Types.DescribeMovingAddressesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeMovingAddressesResult) => void): Request<EC2.Types.DescribeMovingAddressesResult, AWSError>;
  /**
   * Describes your Elastic IP addresses that are being moved to the EC2-VPC platform, or that are being restored to the EC2-Classic platform. This request does not return information about any other Elastic IP addresses in your account.
   */
  describeMovingAddresses(callback?: (err: AWSError, data: EC2.Types.DescribeMovingAddressesResult) => void): Request<EC2.Types.DescribeMovingAddressesResult, AWSError>;
  /**
   * Describes one or more of your NAT gateways.
   */
  describeNatGateways(params: EC2.Types.DescribeNatGatewaysRequest, callback?: (err: AWSError, data: EC2.Types.DescribeNatGatewaysResult) => void): Request<EC2.Types.DescribeNatGatewaysResult, AWSError>;
  /**
   * Describes one or more of your NAT gateways.
   */
  describeNatGateways(callback?: (err: AWSError, data: EC2.Types.DescribeNatGatewaysResult) => void): Request<EC2.Types.DescribeNatGatewaysResult, AWSError>;
  /**
   * Describes one or more of your network ACLs. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  describeNetworkAcls(params: EC2.Types.DescribeNetworkAclsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeNetworkAclsResult) => void): Request<EC2.Types.DescribeNetworkAclsResult, AWSError>;
  /**
   * Describes one or more of your network ACLs. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  describeNetworkAcls(callback?: (err: AWSError, data: EC2.Types.DescribeNetworkAclsResult) => void): Request<EC2.Types.DescribeNetworkAclsResult, AWSError>;
  /**
   * Describes a network interface attribute. You can specify only one attribute at a time.
   */
  describeNetworkInterfaceAttribute(params: EC2.Types.DescribeNetworkInterfaceAttributeRequest, callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfaceAttributeResult) => void): Request<EC2.Types.DescribeNetworkInterfaceAttributeResult, AWSError>;
  /**
   * Describes a network interface attribute. You can specify only one attribute at a time.
   */
  describeNetworkInterfaceAttribute(callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfaceAttributeResult) => void): Request<EC2.Types.DescribeNetworkInterfaceAttributeResult, AWSError>;
  /**
   * Describes the permissions for your network interfaces. 
   */
  describeNetworkInterfacePermissions(params: EC2.Types.DescribeNetworkInterfacePermissionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacePermissionsResult) => void): Request<EC2.Types.DescribeNetworkInterfacePermissionsResult, AWSError>;
  /**
   * Describes the permissions for your network interfaces. 
   */
  describeNetworkInterfacePermissions(callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacePermissionsResult) => void): Request<EC2.Types.DescribeNetworkInterfacePermissionsResult, AWSError>;
  /**
   * Describes one or more of your network interfaces.
   */
  describeNetworkInterfaces(params: EC2.Types.DescribeNetworkInterfacesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacesResult) => void): Request<EC2.Types.DescribeNetworkInterfacesResult, AWSError>;
  /**
   * Describes one or more of your network interfaces.
   */
  describeNetworkInterfaces(callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacesResult) => void): Request<EC2.Types.DescribeNetworkInterfacesResult, AWSError>;
  /**
   * Describes one or more of your placement groups. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  describePlacementGroups(params: EC2.Types.DescribePlacementGroupsRequest, callback?: (err: AWSError, data: EC2.Types.DescribePlacementGroupsResult) => void): Request<EC2.Types.DescribePlacementGroupsResult, AWSError>;
  /**
   * Describes one or more of your placement groups. For more information, see Placement Groups in the Amazon Elastic Compute Cloud User Guide.
   */
  describePlacementGroups(callback?: (err: AWSError, data: EC2.Types.DescribePlacementGroupsResult) => void): Request<EC2.Types.DescribePlacementGroupsResult, AWSError>;
  /**
   * Describes available AWS services in a prefix list format, which includes the prefix list name and prefix list ID of the service and the IP address range for the service. A prefix list ID is required for creating an outbound security group rule that allows traffic from a VPC to access an AWS service through a gateway VPC endpoint. Currently, the services that support this action are Amazon S3 and Amazon DynamoDB.
   */
  describePrefixLists(params: EC2.Types.DescribePrefixListsRequest, callback?: (err: AWSError, data: EC2.Types.DescribePrefixListsResult) => void): Request<EC2.Types.DescribePrefixListsResult, AWSError>;
  /**
   * Describes available AWS services in a prefix list format, which includes the prefix list name and prefix list ID of the service and the IP address range for the service. A prefix list ID is required for creating an outbound security group rule that allows traffic from a VPC to access an AWS service through a gateway VPC endpoint. Currently, the services that support this action are Amazon S3 and Amazon DynamoDB.
   */
  describePrefixLists(callback?: (err: AWSError, data: EC2.Types.DescribePrefixListsResult) => void): Request<EC2.Types.DescribePrefixListsResult, AWSError>;
  /**
   * Describes the ID format settings for the root user and all IAM roles and IAM users that have explicitly specified a longer ID (17-character ID) preference.  By default, all IAM roles and IAM users default to the same ID settings as the root user, unless they explicitly override the settings. This request is useful for identifying those IAM users and IAM roles that have overridden the default ID settings. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. 
   */
  describePrincipalIdFormat(params: EC2.Types.DescribePrincipalIdFormatRequest, callback?: (err: AWSError, data: EC2.Types.DescribePrincipalIdFormatResult) => void): Request<EC2.Types.DescribePrincipalIdFormatResult, AWSError>;
  /**
   * Describes the ID format settings for the root user and all IAM roles and IAM users that have explicitly specified a longer ID (17-character ID) preference.  By default, all IAM roles and IAM users default to the same ID settings as the root user, unless they explicitly override the settings. This request is useful for identifying those IAM users and IAM roles that have overridden the default ID settings. The following resource types support longer IDs: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. 
   */
  describePrincipalIdFormat(callback?: (err: AWSError, data: EC2.Types.DescribePrincipalIdFormatResult) => void): Request<EC2.Types.DescribePrincipalIdFormatResult, AWSError>;
  /**
   * Describes one or more regions that are currently available to you. For a list of the regions supported by Amazon EC2, see Regions and Endpoints.
   */
  describeRegions(params: EC2.Types.DescribeRegionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeRegionsResult) => void): Request<EC2.Types.DescribeRegionsResult, AWSError>;
  /**
   * Describes one or more regions that are currently available to you. For a list of the regions supported by Amazon EC2, see Regions and Endpoints.
   */
  describeRegions(callback?: (err: AWSError, data: EC2.Types.DescribeRegionsResult) => void): Request<EC2.Types.DescribeRegionsResult, AWSError>;
  /**
   * Describes one or more of the Reserved Instances that you purchased. For more information about Reserved Instances, see Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstances(params: EC2.Types.DescribeReservedInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesResult) => void): Request<EC2.Types.DescribeReservedInstancesResult, AWSError>;
  /**
   * Describes one or more of the Reserved Instances that you purchased. For more information about Reserved Instances, see Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstances(callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesResult) => void): Request<EC2.Types.DescribeReservedInstancesResult, AWSError>;
  /**
   * Describes your account's Reserved Instance listings in the Reserved Instance Marketplace. The Reserved Instance Marketplace matches sellers who want to resell Reserved Instance capacity that they no longer need with buyers who want to purchase additional capacity. Reserved Instances bought and sold through the Reserved Instance Marketplace work like any other Reserved Instances. As a seller, you choose to list some or all of your Reserved Instances, and you specify the upfront price to receive for them. Your Reserved Instances are then listed in the Reserved Instance Marketplace and are available for purchase. As a buyer, you specify the configuration of the Reserved Instance to purchase, and the Marketplace matches what you're searching for with what's available. The Marketplace first sells the lowest priced Reserved Instances to you, and continues to sell available Reserved Instance listings to you until your demand is met. You are charged based on the total price of all of the listings that you purchase. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesListings(params: EC2.Types.DescribeReservedInstancesListingsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesListingsResult) => void): Request<EC2.Types.DescribeReservedInstancesListingsResult, AWSError>;
  /**
   * Describes your account's Reserved Instance listings in the Reserved Instance Marketplace. The Reserved Instance Marketplace matches sellers who want to resell Reserved Instance capacity that they no longer need with buyers who want to purchase additional capacity. Reserved Instances bought and sold through the Reserved Instance Marketplace work like any other Reserved Instances. As a seller, you choose to list some or all of your Reserved Instances, and you specify the upfront price to receive for them. Your Reserved Instances are then listed in the Reserved Instance Marketplace and are available for purchase. As a buyer, you specify the configuration of the Reserved Instance to purchase, and the Marketplace matches what you're searching for with what's available. The Marketplace first sells the lowest priced Reserved Instances to you, and continues to sell available Reserved Instance listings to you until your demand is met. You are charged based on the total price of all of the listings that you purchase. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesListings(callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesListingsResult) => void): Request<EC2.Types.DescribeReservedInstancesListingsResult, AWSError>;
  /**
   * Describes the modifications made to your Reserved Instances. If no parameter is specified, information about all your Reserved Instances modification requests is returned. If a modification ID is specified, only information about the specific modification is returned. For more information, see Modifying Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesModifications(params: EC2.Types.DescribeReservedInstancesModificationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesModificationsResult) => void): Request<EC2.Types.DescribeReservedInstancesModificationsResult, AWSError>;
  /**
   * Describes the modifications made to your Reserved Instances. If no parameter is specified, information about all your Reserved Instances modification requests is returned. If a modification ID is specified, only information about the specific modification is returned. For more information, see Modifying Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesModifications(callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesModificationsResult) => void): Request<EC2.Types.DescribeReservedInstancesModificationsResult, AWSError>;
  /**
   * Describes Reserved Instance offerings that are available for purchase. With Reserved Instances, you purchase the right to launch instances for a period of time. During that time period, you do not receive insufficient capacity errors, and you pay a lower usage rate than the rate charged for On-Demand instances for the actual time used. If you have listed your own Reserved Instances for sale in the Reserved Instance Marketplace, they will be excluded from these results. This is to ensure that you do not purchase your own Reserved Instances. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesOfferings(params: EC2.Types.DescribeReservedInstancesOfferingsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesOfferingsResult) => void): Request<EC2.Types.DescribeReservedInstancesOfferingsResult, AWSError>;
  /**
   * Describes Reserved Instance offerings that are available for purchase. With Reserved Instances, you purchase the right to launch instances for a period of time. During that time period, you do not receive insufficient capacity errors, and you pay a lower usage rate than the rate charged for On-Demand instances for the actual time used. If you have listed your own Reserved Instances for sale in the Reserved Instance Marketplace, they will be excluded from these results. This is to ensure that you do not purchase your own Reserved Instances. For more information, see Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  describeReservedInstancesOfferings(callback?: (err: AWSError, data: EC2.Types.DescribeReservedInstancesOfferingsResult) => void): Request<EC2.Types.DescribeReservedInstancesOfferingsResult, AWSError>;
  /**
   * Describes one or more of your route tables. Each subnet in your VPC must be associated with a route table. If a subnet is not explicitly associated with any route table, it is implicitly associated with the main route table. This command does not return the subnet ID for implicit associations. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  describeRouteTables(params: EC2.Types.DescribeRouteTablesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeRouteTablesResult) => void): Request<EC2.Types.DescribeRouteTablesResult, AWSError>;
  /**
   * Describes one or more of your route tables. Each subnet in your VPC must be associated with a route table. If a subnet is not explicitly associated with any route table, it is implicitly associated with the main route table. This command does not return the subnet ID for implicit associations. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  describeRouteTables(callback?: (err: AWSError, data: EC2.Types.DescribeRouteTablesResult) => void): Request<EC2.Types.DescribeRouteTablesResult, AWSError>;
  /**
   * Finds available schedules that meet the specified criteria. You can search for an available schedule no more than 3 months in advance. You must meet the minimum required duration of 1,200 hours per year. For example, the minimum daily schedule is 4 hours, the minimum weekly schedule is 24 hours, and the minimum monthly schedule is 100 hours. After you find a schedule that meets your needs, call PurchaseScheduledInstances to purchase Scheduled Instances with that schedule.
   */
  describeScheduledInstanceAvailability(params: EC2.Types.DescribeScheduledInstanceAvailabilityRequest, callback?: (err: AWSError, data: EC2.Types.DescribeScheduledInstanceAvailabilityResult) => void): Request<EC2.Types.DescribeScheduledInstanceAvailabilityResult, AWSError>;
  /**
   * Finds available schedules that meet the specified criteria. You can search for an available schedule no more than 3 months in advance. You must meet the minimum required duration of 1,200 hours per year. For example, the minimum daily schedule is 4 hours, the minimum weekly schedule is 24 hours, and the minimum monthly schedule is 100 hours. After you find a schedule that meets your needs, call PurchaseScheduledInstances to purchase Scheduled Instances with that schedule.
   */
  describeScheduledInstanceAvailability(callback?: (err: AWSError, data: EC2.Types.DescribeScheduledInstanceAvailabilityResult) => void): Request<EC2.Types.DescribeScheduledInstanceAvailabilityResult, AWSError>;
  /**
   * Describes one or more of your Scheduled Instances.
   */
  describeScheduledInstances(params: EC2.Types.DescribeScheduledInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeScheduledInstancesResult) => void): Request<EC2.Types.DescribeScheduledInstancesResult, AWSError>;
  /**
   * Describes one or more of your Scheduled Instances.
   */
  describeScheduledInstances(callback?: (err: AWSError, data: EC2.Types.DescribeScheduledInstancesResult) => void): Request<EC2.Types.DescribeScheduledInstancesResult, AWSError>;
  /**
   * [EC2-VPC only] Describes the VPCs on the other side of a VPC peering connection that are referencing the security groups you've specified in this request.
   */
  describeSecurityGroupReferences(params: EC2.Types.DescribeSecurityGroupReferencesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSecurityGroupReferencesResult) => void): Request<EC2.Types.DescribeSecurityGroupReferencesResult, AWSError>;
  /**
   * [EC2-VPC only] Describes the VPCs on the other side of a VPC peering connection that are referencing the security groups you've specified in this request.
   */
  describeSecurityGroupReferences(callback?: (err: AWSError, data: EC2.Types.DescribeSecurityGroupReferencesResult) => void): Request<EC2.Types.DescribeSecurityGroupReferencesResult, AWSError>;
  /**
   * Describes one or more of your security groups. A security group is for use with instances either in the EC2-Classic platform or in a specific VPC. For more information, see Amazon EC2 Security Groups in the Amazon Elastic Compute Cloud User Guide and Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide.
   */
  describeSecurityGroups(params: EC2.Types.DescribeSecurityGroupsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSecurityGroupsResult) => void): Request<EC2.Types.DescribeSecurityGroupsResult, AWSError>;
  /**
   * Describes one or more of your security groups. A security group is for use with instances either in the EC2-Classic platform or in a specific VPC. For more information, see Amazon EC2 Security Groups in the Amazon Elastic Compute Cloud User Guide and Security Groups for Your VPC in the Amazon Virtual Private Cloud User Guide.
   */
  describeSecurityGroups(callback?: (err: AWSError, data: EC2.Types.DescribeSecurityGroupsResult) => void): Request<EC2.Types.DescribeSecurityGroupsResult, AWSError>;
  /**
   * Describes the specified attribute of the specified snapshot. You can specify only one attribute at a time. For more information about EBS snapshots, see Amazon EBS Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  describeSnapshotAttribute(params: EC2.Types.DescribeSnapshotAttributeRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotAttributeResult) => void): Request<EC2.Types.DescribeSnapshotAttributeResult, AWSError>;
  /**
   * Describes the specified attribute of the specified snapshot. You can specify only one attribute at a time. For more information about EBS snapshots, see Amazon EBS Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  describeSnapshotAttribute(callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotAttributeResult) => void): Request<EC2.Types.DescribeSnapshotAttributeResult, AWSError>;
  /**
   * Describes one or more of the EBS snapshots available to you. Available snapshots include public snapshots available for any AWS account to launch, private snapshots that you own, and private snapshots owned by another AWS account but for which you've been given explicit create volume permissions. The create volume permissions fall into the following categories:    public: The owner of the snapshot granted create volume permissions for the snapshot to the all group. All AWS accounts have create volume permissions for these snapshots.    explicit: The owner of the snapshot granted create volume permissions to a specific AWS account.    implicit: An AWS account has implicit create volume permissions for all snapshots it owns.   The list of snapshots returned can be modified by specifying snapshot IDs, snapshot owners, or AWS accounts with create volume permissions. If no options are specified, Amazon EC2 returns all snapshots for which you have create volume permissions. If you specify one or more snapshot IDs, only snapshots that have the specified IDs are returned. If you specify an invalid snapshot ID, an error is returned. If you specify a snapshot ID for which you do not have access, it is not included in the returned results. If you specify one or more snapshot owners using the OwnerIds option, only snapshots from the specified owners and for which you have access are returned. The results can include the AWS account IDs of the specified owners, amazon for snapshots owned by Amazon, or self for snapshots that you own. If you specify a list of restorable users, only snapshots with create snapshot permissions for those users are returned. You can specify AWS account IDs (if you own the snapshots), self for snapshots for which you own or have explicit permissions, or all for public snapshots. If you are describing a long list of snapshots, you can paginate the output to make the list more manageable. The MaxResults parameter sets the maximum number of results returned in a single page. If the list of results exceeds your MaxResults value, then that number of results is returned along with a NextToken value that can be passed to a subsequent DescribeSnapshots request to retrieve the remaining results. For more information about EBS snapshots, see Amazon EBS Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  describeSnapshots(params: EC2.Types.DescribeSnapshotsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotsResult) => void): Request<EC2.Types.DescribeSnapshotsResult, AWSError>;
  /**
   * Describes one or more of the EBS snapshots available to you. Available snapshots include public snapshots available for any AWS account to launch, private snapshots that you own, and private snapshots owned by another AWS account but for which you've been given explicit create volume permissions. The create volume permissions fall into the following categories:    public: The owner of the snapshot granted create volume permissions for the snapshot to the all group. All AWS accounts have create volume permissions for these snapshots.    explicit: The owner of the snapshot granted create volume permissions to a specific AWS account.    implicit: An AWS account has implicit create volume permissions for all snapshots it owns.   The list of snapshots returned can be modified by specifying snapshot IDs, snapshot owners, or AWS accounts with create volume permissions. If no options are specified, Amazon EC2 returns all snapshots for which you have create volume permissions. If you specify one or more snapshot IDs, only snapshots that have the specified IDs are returned. If you specify an invalid snapshot ID, an error is returned. If you specify a snapshot ID for which you do not have access, it is not included in the returned results. If you specify one or more snapshot owners using the OwnerIds option, only snapshots from the specified owners and for which you have access are returned. The results can include the AWS account IDs of the specified owners, amazon for snapshots owned by Amazon, or self for snapshots that you own. If you specify a list of restorable users, only snapshots with create snapshot permissions for those users are returned. You can specify AWS account IDs (if you own the snapshots), self for snapshots for which you own or have explicit permissions, or all for public snapshots. If you are describing a long list of snapshots, you can paginate the output to make the list more manageable. The MaxResults parameter sets the maximum number of results returned in a single page. If the list of results exceeds your MaxResults value, then that number of results is returned along with a NextToken value that can be passed to a subsequent DescribeSnapshots request to retrieve the remaining results. For more information about EBS snapshots, see Amazon EBS Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  describeSnapshots(callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotsResult) => void): Request<EC2.Types.DescribeSnapshotsResult, AWSError>;
  /**
   * Describes the data feed for Spot Instances. For more information, see Spot Instance Data Feed in the Amazon EC2 User Guide for Linux Instances.
   */
  describeSpotDatafeedSubscription(params: EC2.Types.DescribeSpotDatafeedSubscriptionRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotDatafeedSubscriptionResult) => void): Request<EC2.Types.DescribeSpotDatafeedSubscriptionResult, AWSError>;
  /**
   * Describes the data feed for Spot Instances. For more information, see Spot Instance Data Feed in the Amazon EC2 User Guide for Linux Instances.
   */
  describeSpotDatafeedSubscription(callback?: (err: AWSError, data: EC2.Types.DescribeSpotDatafeedSubscriptionResult) => void): Request<EC2.Types.DescribeSpotDatafeedSubscriptionResult, AWSError>;
  /**
   * Describes the running instances for the specified Spot Fleet.
   */
  describeSpotFleetInstances(params: EC2.Types.DescribeSpotFleetInstancesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetInstancesResponse) => void): Request<EC2.Types.DescribeSpotFleetInstancesResponse, AWSError>;
  /**
   * Describes the running instances for the specified Spot Fleet.
   */
  describeSpotFleetInstances(callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetInstancesResponse) => void): Request<EC2.Types.DescribeSpotFleetInstancesResponse, AWSError>;
  /**
   * Describes the events for the specified Spot Fleet request during the specified time. Spot Fleet events are delayed by up to 30 seconds before they can be described. This ensures that you can query by the last evaluated time and not miss a recorded event.
   */
  describeSpotFleetRequestHistory(params: EC2.Types.DescribeSpotFleetRequestHistoryRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetRequestHistoryResponse) => void): Request<EC2.Types.DescribeSpotFleetRequestHistoryResponse, AWSError>;
  /**
   * Describes the events for the specified Spot Fleet request during the specified time. Spot Fleet events are delayed by up to 30 seconds before they can be described. This ensures that you can query by the last evaluated time and not miss a recorded event.
   */
  describeSpotFleetRequestHistory(callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetRequestHistoryResponse) => void): Request<EC2.Types.DescribeSpotFleetRequestHistoryResponse, AWSError>;
  /**
   * Describes your Spot Fleet requests. Spot Fleet requests are deleted 48 hours after they are canceled and their instances are terminated.
   */
  describeSpotFleetRequests(params: EC2.Types.DescribeSpotFleetRequestsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetRequestsResponse) => void): Request<EC2.Types.DescribeSpotFleetRequestsResponse, AWSError>;
  /**
   * Describes your Spot Fleet requests. Spot Fleet requests are deleted 48 hours after they are canceled and their instances are terminated.
   */
  describeSpotFleetRequests(callback?: (err: AWSError, data: EC2.Types.DescribeSpotFleetRequestsResponse) => void): Request<EC2.Types.DescribeSpotFleetRequestsResponse, AWSError>;
  /**
   * Describes the specified Spot Instance requests. You can use DescribeSpotInstanceRequests to find a running Spot Instance by examining the response. If the status of the Spot Instance is fulfilled, the instance ID appears in the response and contains the identifier of the instance. Alternatively, you can use DescribeInstances with a filter to look for instances where the instance lifecycle is spot. Spot Instance requests are deleted four hours after they are canceled and their instances are terminated.
   */
  describeSpotInstanceRequests(params: EC2.Types.DescribeSpotInstanceRequestsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotInstanceRequestsResult) => void): Request<EC2.Types.DescribeSpotInstanceRequestsResult, AWSError>;
  /**
   * Describes the specified Spot Instance requests. You can use DescribeSpotInstanceRequests to find a running Spot Instance by examining the response. If the status of the Spot Instance is fulfilled, the instance ID appears in the response and contains the identifier of the instance. Alternatively, you can use DescribeInstances with a filter to look for instances where the instance lifecycle is spot. Spot Instance requests are deleted four hours after they are canceled and their instances are terminated.
   */
  describeSpotInstanceRequests(callback?: (err: AWSError, data: EC2.Types.DescribeSpotInstanceRequestsResult) => void): Request<EC2.Types.DescribeSpotInstanceRequestsResult, AWSError>;
  /**
   * Describes the Spot price history. For more information, see Spot Instance Pricing History in the Amazon EC2 User Guide for Linux Instances. When you specify a start and end time, this operation returns the prices of the instance types within the time range that you specified and the time when the price changed. The price is valid within the time period that you specified; the response merely indicates the last time that the price changed.
   */
  describeSpotPriceHistory(params: EC2.Types.DescribeSpotPriceHistoryRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSpotPriceHistoryResult) => void): Request<EC2.Types.DescribeSpotPriceHistoryResult, AWSError>;
  /**
   * Describes the Spot price history. For more information, see Spot Instance Pricing History in the Amazon EC2 User Guide for Linux Instances. When you specify a start and end time, this operation returns the prices of the instance types within the time range that you specified and the time when the price changed. The price is valid within the time period that you specified; the response merely indicates the last time that the price changed.
   */
  describeSpotPriceHistory(callback?: (err: AWSError, data: EC2.Types.DescribeSpotPriceHistoryResult) => void): Request<EC2.Types.DescribeSpotPriceHistoryResult, AWSError>;
  /**
   * [EC2-VPC only] Describes the stale security group rules for security groups in a specified VPC. Rules are stale when they reference a deleted security group in a peer VPC, or a security group in a peer VPC for which the VPC peering connection has been deleted.
   */
  describeStaleSecurityGroups(params: EC2.Types.DescribeStaleSecurityGroupsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeStaleSecurityGroupsResult) => void): Request<EC2.Types.DescribeStaleSecurityGroupsResult, AWSError>;
  /**
   * [EC2-VPC only] Describes the stale security group rules for security groups in a specified VPC. Rules are stale when they reference a deleted security group in a peer VPC, or a security group in a peer VPC for which the VPC peering connection has been deleted.
   */
  describeStaleSecurityGroups(callback?: (err: AWSError, data: EC2.Types.DescribeStaleSecurityGroupsResult) => void): Request<EC2.Types.DescribeStaleSecurityGroupsResult, AWSError>;
  /**
   * Describes one or more of your subnets. For more information, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide.
   */
  describeSubnets(params: EC2.Types.DescribeSubnetsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeSubnetsResult) => void): Request<EC2.Types.DescribeSubnetsResult, AWSError>;
  /**
   * Describes one or more of your subnets. For more information, see Your VPC and Subnets in the Amazon Virtual Private Cloud User Guide.
   */
  describeSubnets(callback?: (err: AWSError, data: EC2.Types.DescribeSubnetsResult) => void): Request<EC2.Types.DescribeSubnetsResult, AWSError>;
  /**
   * Describes one or more of the tags for your EC2 resources. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide.
   */
  describeTags(params: EC2.Types.DescribeTagsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeTagsResult) => void): Request<EC2.Types.DescribeTagsResult, AWSError>;
  /**
   * Describes one or more of the tags for your EC2 resources. For more information about tags, see Tagging Your Resources in the Amazon Elastic Compute Cloud User Guide.
   */
  describeTags(callback?: (err: AWSError, data: EC2.Types.DescribeTagsResult) => void): Request<EC2.Types.DescribeTagsResult, AWSError>;
  /**
   * Describes the specified attribute of the specified volume. You can specify only one attribute at a time. For more information about EBS volumes, see Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumeAttribute(params: EC2.Types.DescribeVolumeAttributeRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVolumeAttributeResult) => void): Request<EC2.Types.DescribeVolumeAttributeResult, AWSError>;
  /**
   * Describes the specified attribute of the specified volume. You can specify only one attribute at a time. For more information about EBS volumes, see Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumeAttribute(callback?: (err: AWSError, data: EC2.Types.DescribeVolumeAttributeResult) => void): Request<EC2.Types.DescribeVolumeAttributeResult, AWSError>;
  /**
   * Describes the status of the specified volumes. Volume status provides the result of the checks performed on your volumes to determine events that can impair the performance of your volumes. The performance of a volume can be affected if an issue occurs on the volume's underlying host. If the volume's underlying host experiences a power outage or system issue, after the system is restored, there could be data inconsistencies on the volume. Volume events notify you if this occurs. Volume actions notify you if any action needs to be taken in response to the event. The DescribeVolumeStatus operation provides the following information about the specified volumes:  Status: Reflects the current status of the volume. The possible values are ok, impaired , warning, or insufficient-data. If all checks pass, the overall status of the volume is ok. If the check fails, the overall status is impaired. If the status is insufficient-data, then the checks may still be taking place on your volume at the time. We recommend that you retry the request. For more information about volume status, see Monitoring the Status of Your Volumes in the Amazon Elastic Compute Cloud User Guide.  Events: Reflect the cause of a volume status and may require you to take action. For example, if your volume returns an impaired status, then the volume event might be potential-data-inconsistency. This means that your volume has been affected by an issue with the underlying host, has all I/O operations disabled, and may have inconsistent data.  Actions: Reflect the actions you may have to take in response to an event. For example, if the status of the volume is impaired and the volume event shows potential-data-inconsistency, then the action shows enable-volume-io. This means that you may want to enable the I/O operations for the volume by calling the EnableVolumeIO action and then check the volume for data consistency. Volume status is based on the volume status checks, and does not reflect the volume state. Therefore, volume status does not indicate volumes in the error state (for example, when a volume is incapable of accepting I/O.)
   */
  describeVolumeStatus(params: EC2.Types.DescribeVolumeStatusRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVolumeStatusResult) => void): Request<EC2.Types.DescribeVolumeStatusResult, AWSError>;
  /**
   * Describes the status of the specified volumes. Volume status provides the result of the checks performed on your volumes to determine events that can impair the performance of your volumes. The performance of a volume can be affected if an issue occurs on the volume's underlying host. If the volume's underlying host experiences a power outage or system issue, after the system is restored, there could be data inconsistencies on the volume. Volume events notify you if this occurs. Volume actions notify you if any action needs to be taken in response to the event. The DescribeVolumeStatus operation provides the following information about the specified volumes:  Status: Reflects the current status of the volume. The possible values are ok, impaired , warning, or insufficient-data. If all checks pass, the overall status of the volume is ok. If the check fails, the overall status is impaired. If the status is insufficient-data, then the checks may still be taking place on your volume at the time. We recommend that you retry the request. For more information about volume status, see Monitoring the Status of Your Volumes in the Amazon Elastic Compute Cloud User Guide.  Events: Reflect the cause of a volume status and may require you to take action. For example, if your volume returns an impaired status, then the volume event might be potential-data-inconsistency. This means that your volume has been affected by an issue with the underlying host, has all I/O operations disabled, and may have inconsistent data.  Actions: Reflect the actions you may have to take in response to an event. For example, if the status of the volume is impaired and the volume event shows potential-data-inconsistency, then the action shows enable-volume-io. This means that you may want to enable the I/O operations for the volume by calling the EnableVolumeIO action and then check the volume for data consistency. Volume status is based on the volume status checks, and does not reflect the volume state. Therefore, volume status does not indicate volumes in the error state (for example, when a volume is incapable of accepting I/O.)
   */
  describeVolumeStatus(callback?: (err: AWSError, data: EC2.Types.DescribeVolumeStatusResult) => void): Request<EC2.Types.DescribeVolumeStatusResult, AWSError>;
  /**
   * Describes the specified EBS volumes. If you are describing a long list of volumes, you can paginate the output to make the list more manageable. The MaxResults parameter sets the maximum number of results returned in a single page. If the list of results exceeds your MaxResults value, then that number of results is returned along with a NextToken value that can be passed to a subsequent DescribeVolumes request to retrieve the remaining results. For more information about EBS volumes, see Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumes(params: EC2.Types.DescribeVolumesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Describes the specified EBS volumes. If you are describing a long list of volumes, you can paginate the output to make the list more manageable. The MaxResults parameter sets the maximum number of results returned in a single page. If the list of results exceeds your MaxResults value, then that number of results is returned along with a NextToken value that can be passed to a subsequent DescribeVolumes request to retrieve the remaining results. For more information about EBS volumes, see Amazon EBS Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumes(callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Reports the current modification status of EBS volumes. Current-generation EBS volumes support modification of attributes including type, size, and (for io1 volumes) IOPS provisioning while either attached to or detached from an instance. Following an action from the API or the console to modify a volume, the status of the modification may be modifying, optimizing, completed, or failed. If a volume has never been modified, then certain elements of the returned VolumeModification objects are null.   You can also use CloudWatch Events to check the status of a modification to an EBS volume. For information about CloudWatch Events, see the Amazon CloudWatch Events User Guide. For more information, see Monitoring Volume Modifications" in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumesModifications(params: EC2.Types.DescribeVolumesModificationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVolumesModificationsResult) => void): Request<EC2.Types.DescribeVolumesModificationsResult, AWSError>;
  /**
   * Reports the current modification status of EBS volumes. Current-generation EBS volumes support modification of attributes including type, size, and (for io1 volumes) IOPS provisioning while either attached to or detached from an instance. Following an action from the API or the console to modify a volume, the status of the modification may be modifying, optimizing, completed, or failed. If a volume has never been modified, then certain elements of the returned VolumeModification objects are null.   You can also use CloudWatch Events to check the status of a modification to an EBS volume. For information about CloudWatch Events, see the Amazon CloudWatch Events User Guide. For more information, see Monitoring Volume Modifications" in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVolumesModifications(callback?: (err: AWSError, data: EC2.Types.DescribeVolumesModificationsResult) => void): Request<EC2.Types.DescribeVolumesModificationsResult, AWSError>;
  /**
   * Describes the specified attribute of the specified VPC. You can specify only one attribute at a time.
   */
  describeVpcAttribute(params: EC2.Types.DescribeVpcAttributeRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcAttributeResult) => void): Request<EC2.Types.DescribeVpcAttributeResult, AWSError>;
  /**
   * Describes the specified attribute of the specified VPC. You can specify only one attribute at a time.
   */
  describeVpcAttribute(callback?: (err: AWSError, data: EC2.Types.DescribeVpcAttributeResult) => void): Request<EC2.Types.DescribeVpcAttributeResult, AWSError>;
  /**
   * Describes the ClassicLink status of one or more VPCs.
   */
  describeVpcClassicLink(params: EC2.Types.DescribeVpcClassicLinkRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcClassicLinkResult) => void): Request<EC2.Types.DescribeVpcClassicLinkResult, AWSError>;
  /**
   * Describes the ClassicLink status of one or more VPCs.
   */
  describeVpcClassicLink(callback?: (err: AWSError, data: EC2.Types.DescribeVpcClassicLinkResult) => void): Request<EC2.Types.DescribeVpcClassicLinkResult, AWSError>;
  /**
   * Describes the ClassicLink DNS support status of one or more VPCs. If enabled, the DNS hostname of a linked EC2-Classic instance resolves to its private IP address when addressed from an instance in the VPC to which it's linked. Similarly, the DNS hostname of an instance in a VPC resolves to its private IP address when addressed from a linked EC2-Classic instance. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVpcClassicLinkDnsSupport(params: EC2.Types.DescribeVpcClassicLinkDnsSupportRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.DescribeVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Describes the ClassicLink DNS support status of one or more VPCs. If enabled, the DNS hostname of a linked EC2-Classic instance resolves to its private IP address when addressed from an instance in the VPC to which it's linked. Similarly, the DNS hostname of an instance in a VPC resolves to its private IP address when addressed from a linked EC2-Classic instance. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  describeVpcClassicLinkDnsSupport(callback?: (err: AWSError, data: EC2.Types.DescribeVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.DescribeVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Describes the connection notifications for VPC endpoints and VPC endpoint services.
   */
  describeVpcEndpointConnectionNotifications(params: EC2.Types.DescribeVpcEndpointConnectionNotificationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointConnectionNotificationsResult) => void): Request<EC2.Types.DescribeVpcEndpointConnectionNotificationsResult, AWSError>;
  /**
   * Describes the connection notifications for VPC endpoints and VPC endpoint services.
   */
  describeVpcEndpointConnectionNotifications(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointConnectionNotificationsResult) => void): Request<EC2.Types.DescribeVpcEndpointConnectionNotificationsResult, AWSError>;
  /**
   * Describes the VPC endpoint connections to your VPC endpoint services, including any endpoints that are pending your acceptance.
   */
  describeVpcEndpointConnections(params: EC2.Types.DescribeVpcEndpointConnectionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointConnectionsResult) => void): Request<EC2.Types.DescribeVpcEndpointConnectionsResult, AWSError>;
  /**
   * Describes the VPC endpoint connections to your VPC endpoint services, including any endpoints that are pending your acceptance.
   */
  describeVpcEndpointConnections(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointConnectionsResult) => void): Request<EC2.Types.DescribeVpcEndpointConnectionsResult, AWSError>;
  /**
   * Describes the VPC endpoint service configurations in your account (your services).
   */
  describeVpcEndpointServiceConfigurations(params: EC2.Types.DescribeVpcEndpointServiceConfigurationsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServiceConfigurationsResult) => void): Request<EC2.Types.DescribeVpcEndpointServiceConfigurationsResult, AWSError>;
  /**
   * Describes the VPC endpoint service configurations in your account (your services).
   */
  describeVpcEndpointServiceConfigurations(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServiceConfigurationsResult) => void): Request<EC2.Types.DescribeVpcEndpointServiceConfigurationsResult, AWSError>;
  /**
   * Describes the principals (service consumers) that are permitted to discover your VPC endpoint service.
   */
  describeVpcEndpointServicePermissions(params: EC2.Types.DescribeVpcEndpointServicePermissionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServicePermissionsResult) => void): Request<EC2.Types.DescribeVpcEndpointServicePermissionsResult, AWSError>;
  /**
   * Describes the principals (service consumers) that are permitted to discover your VPC endpoint service.
   */
  describeVpcEndpointServicePermissions(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServicePermissionsResult) => void): Request<EC2.Types.DescribeVpcEndpointServicePermissionsResult, AWSError>;
  /**
   * Describes available services to which you can create a VPC endpoint.
   */
  describeVpcEndpointServices(params: EC2.Types.DescribeVpcEndpointServicesRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServicesResult) => void): Request<EC2.Types.DescribeVpcEndpointServicesResult, AWSError>;
  /**
   * Describes available services to which you can create a VPC endpoint.
   */
  describeVpcEndpointServices(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointServicesResult) => void): Request<EC2.Types.DescribeVpcEndpointServicesResult, AWSError>;
  /**
   * Describes one or more of your VPC endpoints.
   */
  describeVpcEndpoints(params: EC2.Types.DescribeVpcEndpointsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointsResult) => void): Request<EC2.Types.DescribeVpcEndpointsResult, AWSError>;
  /**
   * Describes one or more of your VPC endpoints.
   */
  describeVpcEndpoints(callback?: (err: AWSError, data: EC2.Types.DescribeVpcEndpointsResult) => void): Request<EC2.Types.DescribeVpcEndpointsResult, AWSError>;
  /**
   * Describes one or more of your VPC peering connections.
   */
  describeVpcPeeringConnections(params: EC2.Types.DescribeVpcPeeringConnectionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
  /**
   * Describes one or more of your VPC peering connections.
   */
  describeVpcPeeringConnections(callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
  /**
   * Describes one or more of your VPCs.
   */
  describeVpcs(params: EC2.Types.DescribeVpcsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Describes one or more of your VPCs.
   */
  describeVpcs(callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Describes one or more of your VPN connections. For more information about VPN connections, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeVpnConnections(params: EC2.Types.DescribeVpnConnectionsRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Describes one or more of your VPN connections. For more information about VPN connections, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeVpnConnections(callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Describes one or more of your virtual private gateways. For more information about virtual private gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeVpnGateways(params: EC2.Types.DescribeVpnGatewaysRequest, callback?: (err: AWSError, data: EC2.Types.DescribeVpnGatewaysResult) => void): Request<EC2.Types.DescribeVpnGatewaysResult, AWSError>;
  /**
   * Describes one or more of your virtual private gateways. For more information about virtual private gateways, see AWS Managed VPN Connections in the Amazon Virtual Private Cloud User Guide.
   */
  describeVpnGateways(callback?: (err: AWSError, data: EC2.Types.DescribeVpnGatewaysResult) => void): Request<EC2.Types.DescribeVpnGatewaysResult, AWSError>;
  /**
   * Unlinks (detaches) a linked EC2-Classic instance from a VPC. After the instance has been unlinked, the VPC security groups are no longer associated with it. An instance is automatically unlinked from a VPC when it's stopped.
   */
  detachClassicLinkVpc(params: EC2.Types.DetachClassicLinkVpcRequest, callback?: (err: AWSError, data: EC2.Types.DetachClassicLinkVpcResult) => void): Request<EC2.Types.DetachClassicLinkVpcResult, AWSError>;
  /**
   * Unlinks (detaches) a linked EC2-Classic instance from a VPC. After the instance has been unlinked, the VPC security groups are no longer associated with it. An instance is automatically unlinked from a VPC when it's stopped.
   */
  detachClassicLinkVpc(callback?: (err: AWSError, data: EC2.Types.DetachClassicLinkVpcResult) => void): Request<EC2.Types.DetachClassicLinkVpcResult, AWSError>;
  /**
   * Detaches an internet gateway from a VPC, disabling connectivity between the internet and the VPC. The VPC must not contain any running instances with Elastic IP addresses or public IPv4 addresses.
   */
  detachInternetGateway(params: EC2.Types.DetachInternetGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Detaches an internet gateway from a VPC, disabling connectivity between the internet and the VPC. The VPC must not contain any running instances with Elastic IP addresses or public IPv4 addresses.
   */
  detachInternetGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Detaches a network interface from an instance.
   */
  detachNetworkInterface(params: EC2.Types.DetachNetworkInterfaceRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Detaches a network interface from an instance.
   */
  detachNetworkInterface(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Detaches an EBS volume from an instance. Make sure to unmount any file systems on the device within your operating system before detaching the volume. Failure to do so can result in the volume becoming stuck in the busy state while detaching. If this happens, detachment can be delayed indefinitely until you unmount the volume, force detachment, reboot the instance, or all three. If an EBS volume is the root device of an instance, it can't be detached while the instance is running. To detach the root volume, stop the instance first. When a volume with an AWS Marketplace product code is detached from an instance, the product code is no longer associated with the instance. For more information, see Detaching an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  detachVolume(params: EC2.Types.DetachVolumeRequest, callback?: (err: AWSError, data: EC2.Types.VolumeAttachment) => void): Request<EC2.Types.VolumeAttachment, AWSError>;
  /**
   * Detaches an EBS volume from an instance. Make sure to unmount any file systems on the device within your operating system before detaching the volume. Failure to do so can result in the volume becoming stuck in the busy state while detaching. If this happens, detachment can be delayed indefinitely until you unmount the volume, force detachment, reboot the instance, or all three. If an EBS volume is the root device of an instance, it can't be detached while the instance is running. To detach the root volume, stop the instance first. When a volume with an AWS Marketplace product code is detached from an instance, the product code is no longer associated with the instance. For more information, see Detaching an Amazon EBS Volume in the Amazon Elastic Compute Cloud User Guide.
   */
  detachVolume(callback?: (err: AWSError, data: EC2.Types.VolumeAttachment) => void): Request<EC2.Types.VolumeAttachment, AWSError>;
  /**
   * Detaches a virtual private gateway from a VPC. You do this if you're planning to turn off the VPC and not use it anymore. You can confirm a virtual private gateway has been completely detached from a VPC by describing the virtual private gateway (any attachments to the virtual private gateway are also described). You must wait for the attachment's state to switch to detached before you can delete the VPC or attach a different VPC to the virtual private gateway.
   */
  detachVpnGateway(params: EC2.Types.DetachVpnGatewayRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Detaches a virtual private gateway from a VPC. You do this if you're planning to turn off the VPC and not use it anymore. You can confirm a virtual private gateway has been completely detached from a VPC by describing the virtual private gateway (any attachments to the virtual private gateway are also described). You must wait for the attachment's state to switch to detached before you can delete the VPC or attach a different VPC to the virtual private gateway.
   */
  detachVpnGateway(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disables a virtual private gateway (VGW) from propagating routes to a specified route table of a VPC.
   */
  disableVgwRoutePropagation(params: EC2.Types.DisableVgwRoutePropagationRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disables a virtual private gateway (VGW) from propagating routes to a specified route table of a VPC.
   */
  disableVgwRoutePropagation(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disables ClassicLink for a VPC. You cannot disable ClassicLink for a VPC that has EC2-Classic instances linked to it.
   */
  disableVpcClassicLink(params: EC2.Types.DisableVpcClassicLinkRequest, callback?: (err: AWSError, data: EC2.Types.DisableVpcClassicLinkResult) => void): Request<EC2.Types.DisableVpcClassicLinkResult, AWSError>;
  /**
   * Disables ClassicLink for a VPC. You cannot disable ClassicLink for a VPC that has EC2-Classic instances linked to it.
   */
  disableVpcClassicLink(callback?: (err: AWSError, data: EC2.Types.DisableVpcClassicLinkResult) => void): Request<EC2.Types.DisableVpcClassicLinkResult, AWSError>;
  /**
   * Disables ClassicLink DNS support for a VPC. If disabled, DNS hostnames resolve to public IP addresses when addressed between a linked EC2-Classic instance and instances in the VPC to which it's linked. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  disableVpcClassicLinkDnsSupport(params: EC2.Types.DisableVpcClassicLinkDnsSupportRequest, callback?: (err: AWSError, data: EC2.Types.DisableVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.DisableVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Disables ClassicLink DNS support for a VPC. If disabled, DNS hostnames resolve to public IP addresses when addressed between a linked EC2-Classic instance and instances in the VPC to which it's linked. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  disableVpcClassicLinkDnsSupport(callback?: (err: AWSError, data: EC2.Types.DisableVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.DisableVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Disassociates an Elastic IP address from the instance or network interface it's associated with. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error.
   */
  disassociateAddress(params: EC2.Types.DisassociateAddressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disassociates an Elastic IP address from the instance or network interface it's associated with. An Elastic IP address is for use in either the EC2-Classic platform or in a VPC. For more information, see Elastic IP Addresses in the Amazon Elastic Compute Cloud User Guide. This is an idempotent operation. If you perform the operation more than once, Amazon EC2 doesn't return an error.
   */
  disassociateAddress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disassociates an IAM instance profile from a running or stopped instance. Use DescribeIamInstanceProfileAssociations to get the association ID.
   */
  disassociateIamInstanceProfile(params: EC2.Types.DisassociateIamInstanceProfileRequest, callback?: (err: AWSError, data: EC2.Types.DisassociateIamInstanceProfileResult) => void): Request<EC2.Types.DisassociateIamInstanceProfileResult, AWSError>;
  /**
   * Disassociates an IAM instance profile from a running or stopped instance. Use DescribeIamInstanceProfileAssociations to get the association ID.
   */
  disassociateIamInstanceProfile(callback?: (err: AWSError, data: EC2.Types.DisassociateIamInstanceProfileResult) => void): Request<EC2.Types.DisassociateIamInstanceProfileResult, AWSError>;
  /**
   * Disassociates a subnet from a route table. After you perform this action, the subnet no longer uses the routes in the route table. Instead, it uses the routes in the VPC's main route table. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  disassociateRouteTable(params: EC2.Types.DisassociateRouteTableRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disassociates a subnet from a route table. After you perform this action, the subnet no longer uses the routes in the route table. Instead, it uses the routes in the VPC's main route table. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  disassociateRouteTable(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disassociates a CIDR block from a subnet. Currently, you can disassociate an IPv6 CIDR block only. You must detach or delete all gateways and resources that are associated with the CIDR block before you can disassociate it. 
   */
  disassociateSubnetCidrBlock(params: EC2.Types.DisassociateSubnetCidrBlockRequest, callback?: (err: AWSError, data: EC2.Types.DisassociateSubnetCidrBlockResult) => void): Request<EC2.Types.DisassociateSubnetCidrBlockResult, AWSError>;
  /**
   * Disassociates a CIDR block from a subnet. Currently, you can disassociate an IPv6 CIDR block only. You must detach or delete all gateways and resources that are associated with the CIDR block before you can disassociate it. 
   */
  disassociateSubnetCidrBlock(callback?: (err: AWSError, data: EC2.Types.DisassociateSubnetCidrBlockResult) => void): Request<EC2.Types.DisassociateSubnetCidrBlockResult, AWSError>;
  /**
   * Disassociates a CIDR block from a VPC. To disassociate the CIDR block, you must specify its association ID. You can get the association ID by using DescribeVpcs. You must detach or delete all gateways and resources that are associated with the CIDR block before you can disassociate it.  You cannot disassociate the CIDR block with which you originally created the VPC (the primary CIDR block).
   */
  disassociateVpcCidrBlock(params: EC2.Types.DisassociateVpcCidrBlockRequest, callback?: (err: AWSError, data: EC2.Types.DisassociateVpcCidrBlockResult) => void): Request<EC2.Types.DisassociateVpcCidrBlockResult, AWSError>;
  /**
   * Disassociates a CIDR block from a VPC. To disassociate the CIDR block, you must specify its association ID. You can get the association ID by using DescribeVpcs. You must detach or delete all gateways and resources that are associated with the CIDR block before you can disassociate it.  You cannot disassociate the CIDR block with which you originally created the VPC (the primary CIDR block).
   */
  disassociateVpcCidrBlock(callback?: (err: AWSError, data: EC2.Types.DisassociateVpcCidrBlockResult) => void): Request<EC2.Types.DisassociateVpcCidrBlockResult, AWSError>;
  /**
   * Enables a virtual private gateway (VGW) to propagate routes to the specified route table of a VPC.
   */
  enableVgwRoutePropagation(params: EC2.Types.EnableVgwRoutePropagationRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Enables a virtual private gateway (VGW) to propagate routes to the specified route table of a VPC.
   */
  enableVgwRoutePropagation(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Enables I/O operations for a volume that had I/O operations disabled because the data on the volume was potentially inconsistent.
   */
  enableVolumeIO(params: EC2.Types.EnableVolumeIORequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Enables I/O operations for a volume that had I/O operations disabled because the data on the volume was potentially inconsistent.
   */
  enableVolumeIO(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Enables a VPC for ClassicLink. You can then link EC2-Classic instances to your ClassicLink-enabled VPC to allow communication over private IP addresses. You cannot enable your VPC for ClassicLink if any of your VPC route tables have existing routes for address ranges within the 10.0.0.0/8 IP address range, excluding local routes for VPCs in the 10.0.0.0/16 and 10.1.0.0/16 IP address ranges. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  enableVpcClassicLink(params: EC2.Types.EnableVpcClassicLinkRequest, callback?: (err: AWSError, data: EC2.Types.EnableVpcClassicLinkResult) => void): Request<EC2.Types.EnableVpcClassicLinkResult, AWSError>;
  /**
   * Enables a VPC for ClassicLink. You can then link EC2-Classic instances to your ClassicLink-enabled VPC to allow communication over private IP addresses. You cannot enable your VPC for ClassicLink if any of your VPC route tables have existing routes for address ranges within the 10.0.0.0/8 IP address range, excluding local routes for VPCs in the 10.0.0.0/16 and 10.1.0.0/16 IP address ranges. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  enableVpcClassicLink(callback?: (err: AWSError, data: EC2.Types.EnableVpcClassicLinkResult) => void): Request<EC2.Types.EnableVpcClassicLinkResult, AWSError>;
  /**
   * Enables a VPC to support DNS hostname resolution for ClassicLink. If enabled, the DNS hostname of a linked EC2-Classic instance resolves to its private IP address when addressed from an instance in the VPC to which it's linked. Similarly, the DNS hostname of an instance in a VPC resolves to its private IP address when addressed from a linked EC2-Classic instance. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  enableVpcClassicLinkDnsSupport(params: EC2.Types.EnableVpcClassicLinkDnsSupportRequest, callback?: (err: AWSError, data: EC2.Types.EnableVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.EnableVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Enables a VPC to support DNS hostname resolution for ClassicLink. If enabled, the DNS hostname of a linked EC2-Classic instance resolves to its private IP address when addressed from an instance in the VPC to which it's linked. Similarly, the DNS hostname of an instance in a VPC resolves to its private IP address when addressed from a linked EC2-Classic instance. For more information, see ClassicLink in the Amazon Elastic Compute Cloud User Guide.
   */
  enableVpcClassicLinkDnsSupport(callback?: (err: AWSError, data: EC2.Types.EnableVpcClassicLinkDnsSupportResult) => void): Request<EC2.Types.EnableVpcClassicLinkDnsSupportResult, AWSError>;
  /**
   * Gets the console output for the specified instance. For Linux instances, the instance console output displays the exact console output that would normally be displayed on a physical monitor attached to a computer. For Windows instances, the instance console output includes the last three system event log errors. By default, the console output returns buffered information that was posted shortly after an instance transition state (start, stop, reboot, or terminate). This information is available for at least one hour after the most recent post. Only the most recent 64 KB of console output is available. You can optionally retrieve the latest serial console output at any time during the instance lifecycle. This option is supported on instance types that use the Nitro hypervisor. For more information, see Instance Console Output in the Amazon Elastic Compute Cloud User Guide.
   */
  getConsoleOutput(params: EC2.Types.GetConsoleOutputRequest, callback?: (err: AWSError, data: EC2.Types.GetConsoleOutputResult) => void): Request<EC2.Types.GetConsoleOutputResult, AWSError>;
  /**
   * Gets the console output for the specified instance. For Linux instances, the instance console output displays the exact console output that would normally be displayed on a physical monitor attached to a computer. For Windows instances, the instance console output includes the last three system event log errors. By default, the console output returns buffered information that was posted shortly after an instance transition state (start, stop, reboot, or terminate). This information is available for at least one hour after the most recent post. Only the most recent 64 KB of console output is available. You can optionally retrieve the latest serial console output at any time during the instance lifecycle. This option is supported on instance types that use the Nitro hypervisor. For more information, see Instance Console Output in the Amazon Elastic Compute Cloud User Guide.
   */
  getConsoleOutput(callback?: (err: AWSError, data: EC2.Types.GetConsoleOutputResult) => void): Request<EC2.Types.GetConsoleOutputResult, AWSError>;
  /**
   * Retrieve a JPG-format screenshot of a running instance to help with troubleshooting. The returned content is Base64-encoded.
   */
  getConsoleScreenshot(params: EC2.Types.GetConsoleScreenshotRequest, callback?: (err: AWSError, data: EC2.Types.GetConsoleScreenshotResult) => void): Request<EC2.Types.GetConsoleScreenshotResult, AWSError>;
  /**
   * Retrieve a JPG-format screenshot of a running instance to help with troubleshooting. The returned content is Base64-encoded.
   */
  getConsoleScreenshot(callback?: (err: AWSError, data: EC2.Types.GetConsoleScreenshotResult) => void): Request<EC2.Types.GetConsoleScreenshotResult, AWSError>;
  /**
   * Preview a reservation purchase with configurations that match those of your Dedicated Host. You must have active Dedicated Hosts in your account before you purchase a reservation. This is a preview of the PurchaseHostReservation action and does not result in the offering being purchased.
   */
  getHostReservationPurchasePreview(params: EC2.Types.GetHostReservationPurchasePreviewRequest, callback?: (err: AWSError, data: EC2.Types.GetHostReservationPurchasePreviewResult) => void): Request<EC2.Types.GetHostReservationPurchasePreviewResult, AWSError>;
  /**
   * Preview a reservation purchase with configurations that match those of your Dedicated Host. You must have active Dedicated Hosts in your account before you purchase a reservation. This is a preview of the PurchaseHostReservation action and does not result in the offering being purchased.
   */
  getHostReservationPurchasePreview(callback?: (err: AWSError, data: EC2.Types.GetHostReservationPurchasePreviewResult) => void): Request<EC2.Types.GetHostReservationPurchasePreviewResult, AWSError>;
  /**
   * Retrieves the configuration data of the specified instance. You can use this data to create a launch template.
   */
  getLaunchTemplateData(params: EC2.Types.GetLaunchTemplateDataRequest, callback?: (err: AWSError, data: EC2.Types.GetLaunchTemplateDataResult) => void): Request<EC2.Types.GetLaunchTemplateDataResult, AWSError>;
  /**
   * Retrieves the configuration data of the specified instance. You can use this data to create a launch template.
   */
  getLaunchTemplateData(callback?: (err: AWSError, data: EC2.Types.GetLaunchTemplateDataResult) => void): Request<EC2.Types.GetLaunchTemplateDataResult, AWSError>;
  /**
   * Retrieves the encrypted administrator password for a running Windows instance. The Windows password is generated at boot by the EC2Config service or EC2Launch scripts (Windows Server 2016 and later). This usually only happens the first time an instance is launched. For more information, see EC2Config and EC2Launch in the Amazon Elastic Compute Cloud User Guide. For the EC2Config service, the password is not generated for rebundled AMIs unless Ec2SetPassword is enabled before bundling. The password is encrypted using the key pair that you specified when you launched the instance. You must provide the corresponding key pair file. When you launch an instance, password generation and encryption may take a few minutes. If you try to retrieve the password before it's available, the output returns an empty string. We recommend that you wait up to 15 minutes after launching an instance before trying to retrieve the generated password.
   */
  getPasswordData(params: EC2.Types.GetPasswordDataRequest, callback?: (err: AWSError, data: EC2.Types.GetPasswordDataResult) => void): Request<EC2.Types.GetPasswordDataResult, AWSError>;
  /**
   * Retrieves the encrypted administrator password for a running Windows instance. The Windows password is generated at boot by the EC2Config service or EC2Launch scripts (Windows Server 2016 and later). This usually only happens the first time an instance is launched. For more information, see EC2Config and EC2Launch in the Amazon Elastic Compute Cloud User Guide. For the EC2Config service, the password is not generated for rebundled AMIs unless Ec2SetPassword is enabled before bundling. The password is encrypted using the key pair that you specified when you launched the instance. You must provide the corresponding key pair file. When you launch an instance, password generation and encryption may take a few minutes. If you try to retrieve the password before it's available, the output returns an empty string. We recommend that you wait up to 15 minutes after launching an instance before trying to retrieve the generated password.
   */
  getPasswordData(callback?: (err: AWSError, data: EC2.Types.GetPasswordDataResult) => void): Request<EC2.Types.GetPasswordDataResult, AWSError>;
  /**
   * Returns a quote and exchange information for exchanging one or more specified Convertible Reserved Instances for a new Convertible Reserved Instance. If the exchange cannot be performed, the reason is returned in the response. Use AcceptReservedInstancesExchangeQuote to perform the exchange.
   */
  getReservedInstancesExchangeQuote(params: EC2.Types.GetReservedInstancesExchangeQuoteRequest, callback?: (err: AWSError, data: EC2.Types.GetReservedInstancesExchangeQuoteResult) => void): Request<EC2.Types.GetReservedInstancesExchangeQuoteResult, AWSError>;
  /**
   * Returns a quote and exchange information for exchanging one or more specified Convertible Reserved Instances for a new Convertible Reserved Instance. If the exchange cannot be performed, the reason is returned in the response. Use AcceptReservedInstancesExchangeQuote to perform the exchange.
   */
  getReservedInstancesExchangeQuote(callback?: (err: AWSError, data: EC2.Types.GetReservedInstancesExchangeQuoteResult) => void): Request<EC2.Types.GetReservedInstancesExchangeQuoteResult, AWSError>;
  /**
   * Import single or multi-volume disk images or EBS snapshots into an Amazon Machine Image (AMI). For more information, see Importing a VM as an Image Using VM Import/Export in the VM Import/Export User Guide.
   */
  importImage(params: EC2.Types.ImportImageRequest, callback?: (err: AWSError, data: EC2.Types.ImportImageResult) => void): Request<EC2.Types.ImportImageResult, AWSError>;
  /**
   * Import single or multi-volume disk images or EBS snapshots into an Amazon Machine Image (AMI). For more information, see Importing a VM as an Image Using VM Import/Export in the VM Import/Export User Guide.
   */
  importImage(callback?: (err: AWSError, data: EC2.Types.ImportImageResult) => void): Request<EC2.Types.ImportImageResult, AWSError>;
  /**
   * Creates an import instance task using metadata from the specified disk image. ImportInstance only supports single-volume VMs. To import multi-volume VMs, use ImportImage. For more information, see Importing a Virtual Machine Using the Amazon EC2 CLI. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  importInstance(params: EC2.Types.ImportInstanceRequest, callback?: (err: AWSError, data: EC2.Types.ImportInstanceResult) => void): Request<EC2.Types.ImportInstanceResult, AWSError>;
  /**
   * Creates an import instance task using metadata from the specified disk image. ImportInstance only supports single-volume VMs. To import multi-volume VMs, use ImportImage. For more information, see Importing a Virtual Machine Using the Amazon EC2 CLI. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  importInstance(callback?: (err: AWSError, data: EC2.Types.ImportInstanceResult) => void): Request<EC2.Types.ImportInstanceResult, AWSError>;
  /**
   * Imports the public key from an RSA key pair that you created with a third-party tool. Compare this with CreateKeyPair, in which AWS creates the key pair and gives the keys to you (AWS keeps a copy of the public key). With ImportKeyPair, you create the key pair and give AWS just the public key. The private key is never transferred between you and AWS. For more information about key pairs, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  importKeyPair(params: EC2.Types.ImportKeyPairRequest, callback?: (err: AWSError, data: EC2.Types.ImportKeyPairResult) => void): Request<EC2.Types.ImportKeyPairResult, AWSError>;
  /**
   * Imports the public key from an RSA key pair that you created with a third-party tool. Compare this with CreateKeyPair, in which AWS creates the key pair and gives the keys to you (AWS keeps a copy of the public key). With ImportKeyPair, you create the key pair and give AWS just the public key. The private key is never transferred between you and AWS. For more information about key pairs, see Key Pairs in the Amazon Elastic Compute Cloud User Guide.
   */
  importKeyPair(callback?: (err: AWSError, data: EC2.Types.ImportKeyPairResult) => void): Request<EC2.Types.ImportKeyPairResult, AWSError>;
  /**
   * Imports a disk into an EBS snapshot.
   */
  importSnapshot(params: EC2.Types.ImportSnapshotRequest, callback?: (err: AWSError, data: EC2.Types.ImportSnapshotResult) => void): Request<EC2.Types.ImportSnapshotResult, AWSError>;
  /**
   * Imports a disk into an EBS snapshot.
   */
  importSnapshot(callback?: (err: AWSError, data: EC2.Types.ImportSnapshotResult) => void): Request<EC2.Types.ImportSnapshotResult, AWSError>;
  /**
   * Creates an import volume task using metadata from the specified disk image.For more information, see Importing Disks to Amazon EBS. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  importVolume(params: EC2.Types.ImportVolumeRequest, callback?: (err: AWSError, data: EC2.Types.ImportVolumeResult) => void): Request<EC2.Types.ImportVolumeResult, AWSError>;
  /**
   * Creates an import volume task using metadata from the specified disk image.For more information, see Importing Disks to Amazon EBS. For information about the import manifest referenced by this API action, see VM Import Manifest.
   */
  importVolume(callback?: (err: AWSError, data: EC2.Types.ImportVolumeResult) => void): Request<EC2.Types.ImportVolumeResult, AWSError>;
  /**
   * Modifies the specified EC2 Fleet. While the EC2 Fleet is being modified, it is in the modifying state.
   */
  modifyFleet(params: EC2.Types.ModifyFleetRequest, callback?: (err: AWSError, data: EC2.Types.ModifyFleetResult) => void): Request<EC2.Types.ModifyFleetResult, AWSError>;
  /**
   * Modifies the specified EC2 Fleet. While the EC2 Fleet is being modified, it is in the modifying state.
   */
  modifyFleet(callback?: (err: AWSError, data: EC2.Types.ModifyFleetResult) => void): Request<EC2.Types.ModifyFleetResult, AWSError>;
  /**
   * Modifies the specified attribute of the specified Amazon FPGA Image (AFI).
   */
  modifyFpgaImageAttribute(params: EC2.Types.ModifyFpgaImageAttributeRequest, callback?: (err: AWSError, data: EC2.Types.ModifyFpgaImageAttributeResult) => void): Request<EC2.Types.ModifyFpgaImageAttributeResult, AWSError>;
  /**
   * Modifies the specified attribute of the specified Amazon FPGA Image (AFI).
   */
  modifyFpgaImageAttribute(callback?: (err: AWSError, data: EC2.Types.ModifyFpgaImageAttributeResult) => void): Request<EC2.Types.ModifyFpgaImageAttributeResult, AWSError>;
  /**
   * Modify the auto-placement setting of a Dedicated Host. When auto-placement is enabled, any instances that you launch with a tenancy of host but without a specific host ID are placed onto any available Dedicated Host in your account that has auto-placement enabled. When auto-placement is disabled, you need to provide a host ID to have the instance launch onto a specific host. If no host ID is provided, the instance is launched onto a suitable host with auto-placement enabled.
   */
  modifyHosts(params: EC2.Types.ModifyHostsRequest, callback?: (err: AWSError, data: EC2.Types.ModifyHostsResult) => void): Request<EC2.Types.ModifyHostsResult, AWSError>;
  /**
   * Modify the auto-placement setting of a Dedicated Host. When auto-placement is enabled, any instances that you launch with a tenancy of host but without a specific host ID are placed onto any available Dedicated Host in your account that has auto-placement enabled. When auto-placement is disabled, you need to provide a host ID to have the instance launch onto a specific host. If no host ID is provided, the instance is launched onto a suitable host with auto-placement enabled.
   */
  modifyHosts(callback?: (err: AWSError, data: EC2.Types.ModifyHostsResult) => void): Request<EC2.Types.ModifyHostsResult, AWSError>;
  /**
   * Modifies the ID format for the specified resource on a per-region basis. You can specify that resources should receive longer IDs (17-character IDs) when they are created. This request can only be used to modify longer ID settings for resource types that are within the opt-in period. Resources currently in their opt-in period include: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. This setting applies to the IAM user who makes the request; it does not apply to the entire AWS account. By default, an IAM user defaults to the same settings as the root user. If you're using this action as the root user, then these settings apply to the entire account, unless an IAM user explicitly overrides these settings for themselves. For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  Resources created with longer IDs are visible to all IAM roles and users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  modifyIdFormat(params: EC2.Types.ModifyIdFormatRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the ID format for the specified resource on a per-region basis. You can specify that resources should receive longer IDs (17-character IDs) when they are created. This request can only be used to modify longer ID settings for resource types that are within the opt-in period. Resources currently in their opt-in period include: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. This setting applies to the IAM user who makes the request; it does not apply to the entire AWS account. By default, an IAM user defaults to the same settings as the root user. If you're using this action as the root user, then these settings apply to the entire account, unless an IAM user explicitly overrides these settings for themselves. For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  Resources created with longer IDs are visible to all IAM roles and users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  modifyIdFormat(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the ID format of a resource for a specified IAM user, IAM role, or the root user for an account; or all IAM users, IAM roles, and the root user for an account. You can specify that resources should receive longer IDs (17-character IDs) when they are created.  This request can only be used to modify longer ID settings for resource types that are within the opt-in period. Resources currently in their opt-in period include: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  This setting applies to the principal specified in the request; it does not apply to the principal that makes the request.  Resources created with longer IDs are visible to all IAM roles and users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  modifyIdentityIdFormat(params: EC2.Types.ModifyIdentityIdFormatRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the ID format of a resource for a specified IAM user, IAM role, or the root user for an account; or all IAM users, IAM roles, and the root user for an account. You can specify that resources should receive longer IDs (17-character IDs) when they are created.  This request can only be used to modify longer ID settings for resource types that are within the opt-in period. Resources currently in their opt-in period include: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway.  For more information, see Resource IDs in the Amazon Elastic Compute Cloud User Guide.  This setting applies to the principal specified in the request; it does not apply to the principal that makes the request.  Resources created with longer IDs are visible to all IAM roles and users, regardless of these settings and provided that they have permission to use the relevant Describe command for the resource type.
   */
  modifyIdentityIdFormat(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified AMI. You can specify only one attribute at a time. You can use the Attribute parameter to specify the attribute or one of the following parameters: Description, LaunchPermission, or ProductCode. AWS Marketplace product codes cannot be modified. Images with an AWS Marketplace product code cannot be made public. To enable the SriovNetSupport enhanced networking attribute of an image, enable SriovNetSupport on an instance and create an AMI from the instance.
   */
  modifyImageAttribute(params: EC2.Types.ModifyImageAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified AMI. You can specify only one attribute at a time. You can use the Attribute parameter to specify the attribute or one of the following parameters: Description, LaunchPermission, or ProductCode. AWS Marketplace product codes cannot be modified. Images with an AWS Marketplace product code cannot be made public. To enable the SriovNetSupport enhanced networking attribute of an image, enable SriovNetSupport on an instance and create an AMI from the instance.
   */
  modifyImageAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified instance. You can specify only one attribute at a time.  Note: Using this action to change the security groups associated with an elastic network interface (ENI) attached to an instance in a VPC can result in an error if the instance has more than one ENI. To change the security groups associated with an ENI attached to an instance that has multiple ENIs, we recommend that you use the ModifyNetworkInterfaceAttribute action. To modify some attributes, the instance must be stopped. For more information, see Modifying Attributes of a Stopped Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyInstanceAttribute(params: EC2.Types.ModifyInstanceAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified instance. You can specify only one attribute at a time.  Note: Using this action to change the security groups associated with an elastic network interface (ENI) attached to an instance in a VPC can result in an error if the instance has more than one ENI. To change the security groups associated with an ENI attached to an instance that has multiple ENIs, we recommend that you use the ModifyNetworkInterfaceAttribute action. To modify some attributes, the instance must be stopped. For more information, see Modifying Attributes of a Stopped Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyInstanceAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the credit option for CPU usage on a running or stopped T2 or T3 instance. The credit options are standard and unlimited. For more information, see Burstable Performance Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyInstanceCreditSpecification(params: EC2.Types.ModifyInstanceCreditSpecificationRequest, callback?: (err: AWSError, data: EC2.Types.ModifyInstanceCreditSpecificationResult) => void): Request<EC2.Types.ModifyInstanceCreditSpecificationResult, AWSError>;
  /**
   * Modifies the credit option for CPU usage on a running or stopped T2 or T3 instance. The credit options are standard and unlimited. For more information, see Burstable Performance Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyInstanceCreditSpecification(callback?: (err: AWSError, data: EC2.Types.ModifyInstanceCreditSpecificationResult) => void): Request<EC2.Types.ModifyInstanceCreditSpecificationResult, AWSError>;
  /**
   * Modifies the placement attributes for a specified instance. You can do the following:   Modify the affinity between an instance and a Dedicated Host. When affinity is set to host and the instance is not associated with a specific Dedicated Host, the next time the instance is launched, it is automatically associated with the host on which it lands. If the instance is restarted or rebooted, this relationship persists.   Change the Dedicated Host with which an instance is associated.   Change the instance tenancy of an instance from host to dedicated, or from dedicated to host.   Move an instance to or from a placement group.   At least one attribute for affinity, host ID, tenancy, or placement group name must be specified in the request. Affinity and tenancy can be modified in the same request. To modify the host ID, tenancy, or placement group for an instance, the instance must be in the stopped state.
   */
  modifyInstancePlacement(params: EC2.Types.ModifyInstancePlacementRequest, callback?: (err: AWSError, data: EC2.Types.ModifyInstancePlacementResult) => void): Request<EC2.Types.ModifyInstancePlacementResult, AWSError>;
  /**
   * Modifies the placement attributes for a specified instance. You can do the following:   Modify the affinity between an instance and a Dedicated Host. When affinity is set to host and the instance is not associated with a specific Dedicated Host, the next time the instance is launched, it is automatically associated with the host on which it lands. If the instance is restarted or rebooted, this relationship persists.   Change the Dedicated Host with which an instance is associated.   Change the instance tenancy of an instance from host to dedicated, or from dedicated to host.   Move an instance to or from a placement group.   At least one attribute for affinity, host ID, tenancy, or placement group name must be specified in the request. Affinity and tenancy can be modified in the same request. To modify the host ID, tenancy, or placement group for an instance, the instance must be in the stopped state.
   */
  modifyInstancePlacement(callback?: (err: AWSError, data: EC2.Types.ModifyInstancePlacementResult) => void): Request<EC2.Types.ModifyInstancePlacementResult, AWSError>;
  /**
   * Modifies a launch template. You can specify which version of the launch template to set as the default version. When launching an instance, the default version applies when a launch template version is not specified.
   */
  modifyLaunchTemplate(params: EC2.Types.ModifyLaunchTemplateRequest, callback?: (err: AWSError, data: EC2.Types.ModifyLaunchTemplateResult) => void): Request<EC2.Types.ModifyLaunchTemplateResult, AWSError>;
  /**
   * Modifies a launch template. You can specify which version of the launch template to set as the default version. When launching an instance, the default version applies when a launch template version is not specified.
   */
  modifyLaunchTemplate(callback?: (err: AWSError, data: EC2.Types.ModifyLaunchTemplateResult) => void): Request<EC2.Types.ModifyLaunchTemplateResult, AWSError>;
  /**
   * Modifies the specified network interface attribute. You can specify only one attribute at a time.
   */
  modifyNetworkInterfaceAttribute(params: EC2.Types.ModifyNetworkInterfaceAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified network interface attribute. You can specify only one attribute at a time.
   */
  modifyNetworkInterfaceAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the Availability Zone, instance count, instance type, or network platform (EC2-Classic or EC2-VPC) of your Reserved Instances. The Reserved Instances to be modified must be identical, except for Availability Zone, network platform, and instance type. For more information, see Modifying Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyReservedInstances(params: EC2.Types.ModifyReservedInstancesRequest, callback?: (err: AWSError, data: EC2.Types.ModifyReservedInstancesResult) => void): Request<EC2.Types.ModifyReservedInstancesResult, AWSError>;
  /**
   * Modifies the Availability Zone, instance count, instance type, or network platform (EC2-Classic or EC2-VPC) of your Reserved Instances. The Reserved Instances to be modified must be identical, except for Availability Zone, network platform, and instance type. For more information, see Modifying Reserved Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyReservedInstances(callback?: (err: AWSError, data: EC2.Types.ModifyReservedInstancesResult) => void): Request<EC2.Types.ModifyReservedInstancesResult, AWSError>;
  /**
   * Adds or removes permission settings for the specified snapshot. You may add or remove specified AWS account IDs from a snapshot's list of create volume permissions, but you cannot do both in a single API call. If you need to both add and remove account IDs for a snapshot, you must use multiple API calls. Encrypted snapshots and snapshots with AWS Marketplace product codes cannot be made public. Snapshots encrypted with your default CMK cannot be shared with other accounts. For more information about modifying snapshot permissions, see Sharing Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  modifySnapshotAttribute(params: EC2.Types.ModifySnapshotAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Adds or removes permission settings for the specified snapshot. You may add or remove specified AWS account IDs from a snapshot's list of create volume permissions, but you cannot do both in a single API call. If you need to both add and remove account IDs for a snapshot, you must use multiple API calls. Encrypted snapshots and snapshots with AWS Marketplace product codes cannot be made public. Snapshots encrypted with your default CMK cannot be shared with other accounts. For more information about modifying snapshot permissions, see Sharing Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  modifySnapshotAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified Spot Fleet request. While the Spot Fleet request is being modified, it is in the modifying state. To scale up your Spot Fleet, increase its target capacity. The Spot Fleet launches the additional Spot Instances according to the allocation strategy for the Spot Fleet request. If the allocation strategy is lowestPrice, the Spot Fleet launches instances using the Spot pool with the lowest price. If the allocation strategy is diversified, the Spot Fleet distributes the instances across the Spot pools. To scale down your Spot Fleet, decrease its target capacity. First, the Spot Fleet cancels any open requests that exceed the new target capacity. You can request that the Spot Fleet terminate Spot Instances until the size of the fleet no longer exceeds the new target capacity. If the allocation strategy is lowestPrice, the Spot Fleet terminates the instances with the highest price per unit. If the allocation strategy is diversified, the Spot Fleet terminates instances across the Spot pools. Alternatively, you can request that the Spot Fleet keep the fleet at its current size, but not replace any Spot Instances that are interrupted or that you terminate manually. If you are finished with your Spot Fleet for now, but will use it again later, you can set the target capacity to 0.
   */
  modifySpotFleetRequest(params: EC2.Types.ModifySpotFleetRequestRequest, callback?: (err: AWSError, data: EC2.Types.ModifySpotFleetRequestResponse) => void): Request<EC2.Types.ModifySpotFleetRequestResponse, AWSError>;
  /**
   * Modifies the specified Spot Fleet request. While the Spot Fleet request is being modified, it is in the modifying state. To scale up your Spot Fleet, increase its target capacity. The Spot Fleet launches the additional Spot Instances according to the allocation strategy for the Spot Fleet request. If the allocation strategy is lowestPrice, the Spot Fleet launches instances using the Spot pool with the lowest price. If the allocation strategy is diversified, the Spot Fleet distributes the instances across the Spot pools. To scale down your Spot Fleet, decrease its target capacity. First, the Spot Fleet cancels any open requests that exceed the new target capacity. You can request that the Spot Fleet terminate Spot Instances until the size of the fleet no longer exceeds the new target capacity. If the allocation strategy is lowestPrice, the Spot Fleet terminates the instances with the highest price per unit. If the allocation strategy is diversified, the Spot Fleet terminates instances across the Spot pools. Alternatively, you can request that the Spot Fleet keep the fleet at its current size, but not replace any Spot Instances that are interrupted or that you terminate manually. If you are finished with your Spot Fleet for now, but will use it again later, you can set the target capacity to 0.
   */
  modifySpotFleetRequest(callback?: (err: AWSError, data: EC2.Types.ModifySpotFleetRequestResponse) => void): Request<EC2.Types.ModifySpotFleetRequestResponse, AWSError>;
  /**
   * Modifies a subnet attribute. You can only modify one attribute at a time.
   */
  modifySubnetAttribute(params: EC2.Types.ModifySubnetAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies a subnet attribute. You can only modify one attribute at a time.
   */
  modifySubnetAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * You can modify several parameters of an existing EBS volume, including volume size, volume type, and IOPS capacity. If your EBS volume is attached to a current-generation EC2 instance type, you may be able to apply these changes without stopping the instance or detaching the volume from it. For more information about modifying an EBS volume running Linux, see Modifying the Size, IOPS, or Type of an EBS Volume on Linux. For more information about modifying an EBS volume running Windows, see Modifying the Size, IOPS, or Type of an EBS Volume on Windows.   When you complete a resize operation on your volume, you need to extend the volume's file-system size to take advantage of the new storage capacity. For information about extending a Linux file system, see Extending a Linux File System. For information about extending a Windows file system, see Extending a Windows File System.   You can use CloudWatch Events to check the status of a modification to an EBS volume. For information about CloudWatch Events, see the Amazon CloudWatch Events User Guide. You can also track the status of a modification using the DescribeVolumesModifications API. For information about tracking status changes using either method, see Monitoring Volume Modifications.  With previous-generation instance types, resizing an EBS volume may require detaching and reattaching the volume or stopping and restarting the instance. For more information, see Modifying the Size, IOPS, or Type of an EBS Volume on Linux and Modifying the Size, IOPS, or Type of an EBS Volume on Windows. If you reach the maximum volume modification rate per volume limit, you will need to wait at least six hours before applying further modifications to the affected EBS volume.
   */
  modifyVolume(params: EC2.Types.ModifyVolumeRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVolumeResult) => void): Request<EC2.Types.ModifyVolumeResult, AWSError>;
  /**
   * You can modify several parameters of an existing EBS volume, including volume size, volume type, and IOPS capacity. If your EBS volume is attached to a current-generation EC2 instance type, you may be able to apply these changes without stopping the instance or detaching the volume from it. For more information about modifying an EBS volume running Linux, see Modifying the Size, IOPS, or Type of an EBS Volume on Linux. For more information about modifying an EBS volume running Windows, see Modifying the Size, IOPS, or Type of an EBS Volume on Windows.   When you complete a resize operation on your volume, you need to extend the volume's file-system size to take advantage of the new storage capacity. For information about extending a Linux file system, see Extending a Linux File System. For information about extending a Windows file system, see Extending a Windows File System.   You can use CloudWatch Events to check the status of a modification to an EBS volume. For information about CloudWatch Events, see the Amazon CloudWatch Events User Guide. You can also track the status of a modification using the DescribeVolumesModifications API. For information about tracking status changes using either method, see Monitoring Volume Modifications.  With previous-generation instance types, resizing an EBS volume may require detaching and reattaching the volume or stopping and restarting the instance. For more information, see Modifying the Size, IOPS, or Type of an EBS Volume on Linux and Modifying the Size, IOPS, or Type of an EBS Volume on Windows. If you reach the maximum volume modification rate per volume limit, you will need to wait at least six hours before applying further modifications to the affected EBS volume.
   */
  modifyVolume(callback?: (err: AWSError, data: EC2.Types.ModifyVolumeResult) => void): Request<EC2.Types.ModifyVolumeResult, AWSError>;
  /**
   * Modifies a volume attribute. By default, all I/O operations for the volume are suspended when the data on the volume is determined to be potentially inconsistent, to prevent undetectable, latent data corruption. The I/O access to the volume can be resumed by first enabling I/O access and then checking the data consistency on your volume. You can change the default behavior to resume I/O operations. We recommend that you change this only for boot volumes or for volumes that are stateless or disposable.
   */
  modifyVolumeAttribute(params: EC2.Types.ModifyVolumeAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies a volume attribute. By default, all I/O operations for the volume are suspended when the data on the volume is determined to be potentially inconsistent, to prevent undetectable, latent data corruption. The I/O access to the volume can be resumed by first enabling I/O access and then checking the data consistency on your volume. You can change the default behavior to resume I/O operations. We recommend that you change this only for boot volumes or for volumes that are stateless or disposable.
   */
  modifyVolumeAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified VPC.
   */
  modifyVpcAttribute(params: EC2.Types.ModifyVpcAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies the specified attribute of the specified VPC.
   */
  modifyVpcAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Modifies attributes of a specified VPC endpoint. The attributes that you can modify depend on the type of VPC endpoint (interface or gateway). For more information, see VPC Endpoints in the Amazon Virtual Private Cloud User Guide.
   */
  modifyVpcEndpoint(params: EC2.Types.ModifyVpcEndpointRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointResult) => void): Request<EC2.Types.ModifyVpcEndpointResult, AWSError>;
  /**
   * Modifies attributes of a specified VPC endpoint. The attributes that you can modify depend on the type of VPC endpoint (interface or gateway). For more information, see VPC Endpoints in the Amazon Virtual Private Cloud User Guide.
   */
  modifyVpcEndpoint(callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointResult) => void): Request<EC2.Types.ModifyVpcEndpointResult, AWSError>;
  /**
   * Modifies a connection notification for VPC endpoint or VPC endpoint service. You can change the SNS topic for the notification, or the events for which to be notified. 
   */
  modifyVpcEndpointConnectionNotification(params: EC2.Types.ModifyVpcEndpointConnectionNotificationRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointConnectionNotificationResult) => void): Request<EC2.Types.ModifyVpcEndpointConnectionNotificationResult, AWSError>;
  /**
   * Modifies a connection notification for VPC endpoint or VPC endpoint service. You can change the SNS topic for the notification, or the events for which to be notified. 
   */
  modifyVpcEndpointConnectionNotification(callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointConnectionNotificationResult) => void): Request<EC2.Types.ModifyVpcEndpointConnectionNotificationResult, AWSError>;
  /**
   * Modifies the attributes of your VPC endpoint service configuration. You can change the Network Load Balancers for your service, and you can specify whether acceptance is required for requests to connect to your endpoint service through an interface VPC endpoint.
   */
  modifyVpcEndpointServiceConfiguration(params: EC2.Types.ModifyVpcEndpointServiceConfigurationRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointServiceConfigurationResult) => void): Request<EC2.Types.ModifyVpcEndpointServiceConfigurationResult, AWSError>;
  /**
   * Modifies the attributes of your VPC endpoint service configuration. You can change the Network Load Balancers for your service, and you can specify whether acceptance is required for requests to connect to your endpoint service through an interface VPC endpoint.
   */
  modifyVpcEndpointServiceConfiguration(callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointServiceConfigurationResult) => void): Request<EC2.Types.ModifyVpcEndpointServiceConfigurationResult, AWSError>;
  /**
   * Modifies the permissions for your VPC endpoint service. You can add or remove permissions for service consumers (IAM users, IAM roles, and AWS accounts) to connect to your endpoint service. If you grant permissions to all principals, the service is public. Any users who know the name of a public service can send a request to attach an endpoint. If the service does not require manual approval, attachments are automatically approved.
   */
  modifyVpcEndpointServicePermissions(params: EC2.Types.ModifyVpcEndpointServicePermissionsRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointServicePermissionsResult) => void): Request<EC2.Types.ModifyVpcEndpointServicePermissionsResult, AWSError>;
  /**
   * Modifies the permissions for your VPC endpoint service. You can add or remove permissions for service consumers (IAM users, IAM roles, and AWS accounts) to connect to your endpoint service. If you grant permissions to all principals, the service is public. Any users who know the name of a public service can send a request to attach an endpoint. If the service does not require manual approval, attachments are automatically approved.
   */
  modifyVpcEndpointServicePermissions(callback?: (err: AWSError, data: EC2.Types.ModifyVpcEndpointServicePermissionsResult) => void): Request<EC2.Types.ModifyVpcEndpointServicePermissionsResult, AWSError>;
  /**
   * Modifies the VPC peering connection options on one side of a VPC peering connection. You can do the following:   Enable/disable communication over the peering connection between an EC2-Classic instance that's linked to your VPC (using ClassicLink) and instances in the peer VPC.   Enable/disable communication over the peering connection between instances in your VPC and an EC2-Classic instance that's linked to the peer VPC.   Enable/disable the ability to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC.   If the peered VPCs are in different accounts, each owner must initiate a separate request to modify the peering connection options, depending on whether their VPC was the requester or accepter for the VPC peering connection. If the peered VPCs are in the same account, you can modify the requester and accepter options in the same request. To confirm which VPC is the accepter and requester for a VPC peering connection, use the DescribeVpcPeeringConnections command.
   */
  modifyVpcPeeringConnectionOptions(params: EC2.Types.ModifyVpcPeeringConnectionOptionsRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcPeeringConnectionOptionsResult) => void): Request<EC2.Types.ModifyVpcPeeringConnectionOptionsResult, AWSError>;
  /**
   * Modifies the VPC peering connection options on one side of a VPC peering connection. You can do the following:   Enable/disable communication over the peering connection between an EC2-Classic instance that's linked to your VPC (using ClassicLink) and instances in the peer VPC.   Enable/disable communication over the peering connection between instances in your VPC and an EC2-Classic instance that's linked to the peer VPC.   Enable/disable the ability to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC.   If the peered VPCs are in different accounts, each owner must initiate a separate request to modify the peering connection options, depending on whether their VPC was the requester or accepter for the VPC peering connection. If the peered VPCs are in the same account, you can modify the requester and accepter options in the same request. To confirm which VPC is the accepter and requester for a VPC peering connection, use the DescribeVpcPeeringConnections command.
   */
  modifyVpcPeeringConnectionOptions(callback?: (err: AWSError, data: EC2.Types.ModifyVpcPeeringConnectionOptionsResult) => void): Request<EC2.Types.ModifyVpcPeeringConnectionOptionsResult, AWSError>;
  /**
   * Modifies the instance tenancy attribute of the specified VPC. You can change the instance tenancy attribute of a VPC to default only. You cannot change the instance tenancy attribute to dedicated. After you modify the tenancy of the VPC, any new instances that you launch into the VPC have a tenancy of default, unless you specify otherwise during launch. The tenancy of any existing instances in the VPC is not affected. For more information, see Dedicated Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyVpcTenancy(params: EC2.Types.ModifyVpcTenancyRequest, callback?: (err: AWSError, data: EC2.Types.ModifyVpcTenancyResult) => void): Request<EC2.Types.ModifyVpcTenancyResult, AWSError>;
  /**
   * Modifies the instance tenancy attribute of the specified VPC. You can change the instance tenancy attribute of a VPC to default only. You cannot change the instance tenancy attribute to dedicated. After you modify the tenancy of the VPC, any new instances that you launch into the VPC have a tenancy of default, unless you specify otherwise during launch. The tenancy of any existing instances in the VPC is not affected. For more information, see Dedicated Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  modifyVpcTenancy(callback?: (err: AWSError, data: EC2.Types.ModifyVpcTenancyResult) => void): Request<EC2.Types.ModifyVpcTenancyResult, AWSError>;
  /**
   * Enables detailed monitoring for a running instance. Otherwise, basic monitoring is enabled. For more information, see Monitoring Your Instances and Volumes in the Amazon Elastic Compute Cloud User Guide. To disable detailed monitoring, see .
   */
  monitorInstances(params: EC2.Types.MonitorInstancesRequest, callback?: (err: AWSError, data: EC2.Types.MonitorInstancesResult) => void): Request<EC2.Types.MonitorInstancesResult, AWSError>;
  /**
   * Enables detailed monitoring for a running instance. Otherwise, basic monitoring is enabled. For more information, see Monitoring Your Instances and Volumes in the Amazon Elastic Compute Cloud User Guide. To disable detailed monitoring, see .
   */
  monitorInstances(callback?: (err: AWSError, data: EC2.Types.MonitorInstancesResult) => void): Request<EC2.Types.MonitorInstancesResult, AWSError>;
  /**
   * Moves an Elastic IP address from the EC2-Classic platform to the EC2-VPC platform. The Elastic IP address must be allocated to your account for more than 24 hours, and it must not be associated with an instance. After the Elastic IP address is moved, it is no longer available for use in the EC2-Classic platform, unless you move it back using the RestoreAddressToClassic request. You cannot move an Elastic IP address that was originally allocated for use in the EC2-VPC platform to the EC2-Classic platform. 
   */
  moveAddressToVpc(params: EC2.Types.MoveAddressToVpcRequest, callback?: (err: AWSError, data: EC2.Types.MoveAddressToVpcResult) => void): Request<EC2.Types.MoveAddressToVpcResult, AWSError>;
  /**
   * Moves an Elastic IP address from the EC2-Classic platform to the EC2-VPC platform. The Elastic IP address must be allocated to your account for more than 24 hours, and it must not be associated with an instance. After the Elastic IP address is moved, it is no longer available for use in the EC2-Classic platform, unless you move it back using the RestoreAddressToClassic request. You cannot move an Elastic IP address that was originally allocated for use in the EC2-VPC platform to the EC2-Classic platform. 
   */
  moveAddressToVpc(callback?: (err: AWSError, data: EC2.Types.MoveAddressToVpcResult) => void): Request<EC2.Types.MoveAddressToVpcResult, AWSError>;
  /**
   * Purchase a reservation with configurations that match those of your Dedicated Host. You must have active Dedicated Hosts in your account before you purchase a reservation. This action results in the specified reservation being purchased and charged to your account.
   */
  purchaseHostReservation(params: EC2.Types.PurchaseHostReservationRequest, callback?: (err: AWSError, data: EC2.Types.PurchaseHostReservationResult) => void): Request<EC2.Types.PurchaseHostReservationResult, AWSError>;
  /**
   * Purchase a reservation with configurations that match those of your Dedicated Host. You must have active Dedicated Hosts in your account before you purchase a reservation. This action results in the specified reservation being purchased and charged to your account.
   */
  purchaseHostReservation(callback?: (err: AWSError, data: EC2.Types.PurchaseHostReservationResult) => void): Request<EC2.Types.PurchaseHostReservationResult, AWSError>;
  /**
   * Purchases a Reserved Instance for use with your account. With Reserved Instances, you pay a lower hourly rate compared to On-Demand instance pricing. Use DescribeReservedInstancesOfferings to get a list of Reserved Instance offerings that match your specifications. After you've purchased a Reserved Instance, you can check for your new Reserved Instance with DescribeReservedInstances. For more information, see Reserved Instances and Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  purchaseReservedInstancesOffering(params: EC2.Types.PurchaseReservedInstancesOfferingRequest, callback?: (err: AWSError, data: EC2.Types.PurchaseReservedInstancesOfferingResult) => void): Request<EC2.Types.PurchaseReservedInstancesOfferingResult, AWSError>;
  /**
   * Purchases a Reserved Instance for use with your account. With Reserved Instances, you pay a lower hourly rate compared to On-Demand instance pricing. Use DescribeReservedInstancesOfferings to get a list of Reserved Instance offerings that match your specifications. After you've purchased a Reserved Instance, you can check for your new Reserved Instance with DescribeReservedInstances. For more information, see Reserved Instances and Reserved Instance Marketplace in the Amazon Elastic Compute Cloud User Guide.
   */
  purchaseReservedInstancesOffering(callback?: (err: AWSError, data: EC2.Types.PurchaseReservedInstancesOfferingResult) => void): Request<EC2.Types.PurchaseReservedInstancesOfferingResult, AWSError>;
  /**
   * Purchases one or more Scheduled Instances with the specified schedule. Scheduled Instances enable you to purchase Amazon EC2 compute capacity by the hour for a one-year term. Before you can purchase a Scheduled Instance, you must call DescribeScheduledInstanceAvailability to check for available schedules and obtain a purchase token. After you purchase a Scheduled Instance, you must call RunScheduledInstances during each scheduled time period. After you purchase a Scheduled Instance, you can't cancel, modify, or resell your purchase.
   */
  purchaseScheduledInstances(params: EC2.Types.PurchaseScheduledInstancesRequest, callback?: (err: AWSError, data: EC2.Types.PurchaseScheduledInstancesResult) => void): Request<EC2.Types.PurchaseScheduledInstancesResult, AWSError>;
  /**
   * Purchases one or more Scheduled Instances with the specified schedule. Scheduled Instances enable you to purchase Amazon EC2 compute capacity by the hour for a one-year term. Before you can purchase a Scheduled Instance, you must call DescribeScheduledInstanceAvailability to check for available schedules and obtain a purchase token. After you purchase a Scheduled Instance, you must call RunScheduledInstances during each scheduled time period. After you purchase a Scheduled Instance, you can't cancel, modify, or resell your purchase.
   */
  purchaseScheduledInstances(callback?: (err: AWSError, data: EC2.Types.PurchaseScheduledInstancesResult) => void): Request<EC2.Types.PurchaseScheduledInstancesResult, AWSError>;
  /**
   * Requests a reboot of one or more instances. This operation is asynchronous; it only queues a request to reboot the specified instances. The operation succeeds if the instances are valid and belong to you. Requests to reboot terminated instances are ignored. If an instance does not cleanly shut down within four minutes, Amazon EC2 performs a hard reboot. For more information about troubleshooting, see Getting Console Output and Rebooting Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  rebootInstances(params: EC2.Types.RebootInstancesRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Requests a reboot of one or more instances. This operation is asynchronous; it only queues a request to reboot the specified instances. The operation succeeds if the instances are valid and belong to you. Requests to reboot terminated instances are ignored. If an instance does not cleanly shut down within four minutes, Amazon EC2 performs a hard reboot. For more information about troubleshooting, see Getting Console Output and Rebooting Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  rebootInstances(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Registers an AMI. When you're creating an AMI, this is the final step you must complete before you can launch an instance from the AMI. For more information about creating AMIs, see Creating Your Own AMIs in the Amazon Elastic Compute Cloud User Guide.  For Amazon EBS-backed instances, CreateImage creates and registers the AMI in a single request, so you don't have to register the AMI yourself.  You can also use RegisterImage to create an Amazon EBS-backed Linux AMI from a snapshot of a root device volume. You specify the snapshot using the block device mapping. For more information, see Launching a Linux Instance from a Backup in the Amazon Elastic Compute Cloud User Guide. You can't register an image where a secondary (non-root) snapshot has AWS Marketplace product codes. Some Linux distributions, such as Red Hat Enterprise Linux (RHEL) and SUSE Linux Enterprise Server (SLES), use the EC2 billing product code associated with an AMI to verify the subscription status for package updates. Creating an AMI from an EBS snapshot does not maintain this billing code, and instances launched from such an AMI are not able to connect to package update infrastructure. If you purchase a Reserved Instance offering for one of these Linux distributions and launch instances using an AMI that does not contain the required billing code, your Reserved Instance is not applied to these instances. To create an AMI for operating systems that require a billing code, see CreateImage. If needed, you can deregister an AMI at any time. Any modifications you make to an AMI backed by an instance store volume invalidates its registration. If you make changes to an image, deregister the previous image and register the new image.
   */
  registerImage(params: EC2.Types.RegisterImageRequest, callback?: (err: AWSError, data: EC2.Types.RegisterImageResult) => void): Request<EC2.Types.RegisterImageResult, AWSError>;
  /**
   * Registers an AMI. When you're creating an AMI, this is the final step you must complete before you can launch an instance from the AMI. For more information about creating AMIs, see Creating Your Own AMIs in the Amazon Elastic Compute Cloud User Guide.  For Amazon EBS-backed instances, CreateImage creates and registers the AMI in a single request, so you don't have to register the AMI yourself.  You can also use RegisterImage to create an Amazon EBS-backed Linux AMI from a snapshot of a root device volume. You specify the snapshot using the block device mapping. For more information, see Launching a Linux Instance from a Backup in the Amazon Elastic Compute Cloud User Guide. You can't register an image where a secondary (non-root) snapshot has AWS Marketplace product codes. Some Linux distributions, such as Red Hat Enterprise Linux (RHEL) and SUSE Linux Enterprise Server (SLES), use the EC2 billing product code associated with an AMI to verify the subscription status for package updates. Creating an AMI from an EBS snapshot does not maintain this billing code, and instances launched from such an AMI are not able to connect to package update infrastructure. If you purchase a Reserved Instance offering for one of these Linux distributions and launch instances using an AMI that does not contain the required billing code, your Reserved Instance is not applied to these instances. To create an AMI for operating systems that require a billing code, see CreateImage. If needed, you can deregister an AMI at any time. Any modifications you make to an AMI backed by an instance store volume invalidates its registration. If you make changes to an image, deregister the previous image and register the new image.
   */
  registerImage(callback?: (err: AWSError, data: EC2.Types.RegisterImageResult) => void): Request<EC2.Types.RegisterImageResult, AWSError>;
  /**
   * Rejects one or more VPC endpoint connection requests to your VPC endpoint service.
   */
  rejectVpcEndpointConnections(params: EC2.Types.RejectVpcEndpointConnectionsRequest, callback?: (err: AWSError, data: EC2.Types.RejectVpcEndpointConnectionsResult) => void): Request<EC2.Types.RejectVpcEndpointConnectionsResult, AWSError>;
  /**
   * Rejects one or more VPC endpoint connection requests to your VPC endpoint service.
   */
  rejectVpcEndpointConnections(callback?: (err: AWSError, data: EC2.Types.RejectVpcEndpointConnectionsResult) => void): Request<EC2.Types.RejectVpcEndpointConnectionsResult, AWSError>;
  /**
   * Rejects a VPC peering connection request. The VPC peering connection must be in the pending-acceptance state. Use the DescribeVpcPeeringConnections request to view your outstanding VPC peering connection requests. To delete an active VPC peering connection, or to delete a VPC peering connection request that you initiated, use DeleteVpcPeeringConnection.
   */
  rejectVpcPeeringConnection(params: EC2.Types.RejectVpcPeeringConnectionRequest, callback?: (err: AWSError, data: EC2.Types.RejectVpcPeeringConnectionResult) => void): Request<EC2.Types.RejectVpcPeeringConnectionResult, AWSError>;
  /**
   * Rejects a VPC peering connection request. The VPC peering connection must be in the pending-acceptance state. Use the DescribeVpcPeeringConnections request to view your outstanding VPC peering connection requests. To delete an active VPC peering connection, or to delete a VPC peering connection request that you initiated, use DeleteVpcPeeringConnection.
   */
  rejectVpcPeeringConnection(callback?: (err: AWSError, data: EC2.Types.RejectVpcPeeringConnectionResult) => void): Request<EC2.Types.RejectVpcPeeringConnectionResult, AWSError>;
  /**
   * Releases the specified Elastic IP address. [EC2-Classic, default VPC] Releasing an Elastic IP address automatically disassociates it from any instance that it's associated with. To disassociate an Elastic IP address without releasing it, use DisassociateAddress. [Nondefault VPC] You must use DisassociateAddress to disassociate the Elastic IP address before you can release it. Otherwise, Amazon EC2 returns an error (InvalidIPAddress.InUse). After releasing an Elastic IP address, it is released to the IP address pool. Be sure to update your DNS records and any servers or devices that communicate with the address. If you attempt to release an Elastic IP address that you already released, you'll get an AuthFailure error if the address is already allocated to another AWS account. [EC2-VPC] After you release an Elastic IP address for use in a VPC, you might be able to recover it. For more information, see AllocateAddress.
   */
  releaseAddress(params: EC2.Types.ReleaseAddressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Releases the specified Elastic IP address. [EC2-Classic, default VPC] Releasing an Elastic IP address automatically disassociates it from any instance that it's associated with. To disassociate an Elastic IP address without releasing it, use DisassociateAddress. [Nondefault VPC] You must use DisassociateAddress to disassociate the Elastic IP address before you can release it. Otherwise, Amazon EC2 returns an error (InvalidIPAddress.InUse). After releasing an Elastic IP address, it is released to the IP address pool. Be sure to update your DNS records and any servers or devices that communicate with the address. If you attempt to release an Elastic IP address that you already released, you'll get an AuthFailure error if the address is already allocated to another AWS account. [EC2-VPC] After you release an Elastic IP address for use in a VPC, you might be able to recover it. For more information, see AllocateAddress.
   */
  releaseAddress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * When you no longer want to use an On-Demand Dedicated Host it can be released. On-Demand billing is stopped and the host goes into released state. The host ID of Dedicated Hosts that have been released can no longer be specified in another request, for example, to modify the host. You must stop or terminate all instances on a host before it can be released. When Dedicated Hosts are released, it may take some time for them to stop counting toward your limit and you may receive capacity errors when trying to allocate new Dedicated Hosts. Wait a few minutes and then try again. Released hosts still appear in a DescribeHosts response.
   */
  releaseHosts(params: EC2.Types.ReleaseHostsRequest, callback?: (err: AWSError, data: EC2.Types.ReleaseHostsResult) => void): Request<EC2.Types.ReleaseHostsResult, AWSError>;
  /**
   * When you no longer want to use an On-Demand Dedicated Host it can be released. On-Demand billing is stopped and the host goes into released state. The host ID of Dedicated Hosts that have been released can no longer be specified in another request, for example, to modify the host. You must stop or terminate all instances on a host before it can be released. When Dedicated Hosts are released, it may take some time for them to stop counting toward your limit and you may receive capacity errors when trying to allocate new Dedicated Hosts. Wait a few minutes and then try again. Released hosts still appear in a DescribeHosts response.
   */
  releaseHosts(callback?: (err: AWSError, data: EC2.Types.ReleaseHostsResult) => void): Request<EC2.Types.ReleaseHostsResult, AWSError>;
  /**
   * Replaces an IAM instance profile for the specified running instance. You can use this action to change the IAM instance profile that's associated with an instance without having to disassociate the existing IAM instance profile first. Use DescribeIamInstanceProfileAssociations to get the association ID.
   */
  replaceIamInstanceProfileAssociation(params: EC2.Types.ReplaceIamInstanceProfileAssociationRequest, callback?: (err: AWSError, data: EC2.Types.ReplaceIamInstanceProfileAssociationResult) => void): Request<EC2.Types.ReplaceIamInstanceProfileAssociationResult, AWSError>;
  /**
   * Replaces an IAM instance profile for the specified running instance. You can use this action to change the IAM instance profile that's associated with an instance without having to disassociate the existing IAM instance profile first. Use DescribeIamInstanceProfileAssociations to get the association ID.
   */
  replaceIamInstanceProfileAssociation(callback?: (err: AWSError, data: EC2.Types.ReplaceIamInstanceProfileAssociationResult) => void): Request<EC2.Types.ReplaceIamInstanceProfileAssociationResult, AWSError>;
  /**
   * Changes which network ACL a subnet is associated with. By default when you create a subnet, it's automatically associated with the default network ACL. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide. This is an idempotent operation.
   */
  replaceNetworkAclAssociation(params: EC2.Types.ReplaceNetworkAclAssociationRequest, callback?: (err: AWSError, data: EC2.Types.ReplaceNetworkAclAssociationResult) => void): Request<EC2.Types.ReplaceNetworkAclAssociationResult, AWSError>;
  /**
   * Changes which network ACL a subnet is associated with. By default when you create a subnet, it's automatically associated with the default network ACL. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide. This is an idempotent operation.
   */
  replaceNetworkAclAssociation(callback?: (err: AWSError, data: EC2.Types.ReplaceNetworkAclAssociationResult) => void): Request<EC2.Types.ReplaceNetworkAclAssociationResult, AWSError>;
  /**
   * Replaces an entry (rule) in a network ACL. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  replaceNetworkAclEntry(params: EC2.Types.ReplaceNetworkAclEntryRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Replaces an entry (rule) in a network ACL. For more information, see Network ACLs in the Amazon Virtual Private Cloud User Guide.
   */
  replaceNetworkAclEntry(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Replaces an existing route within a route table in a VPC. You must provide only one of the following: internet gateway or virtual private gateway, NAT instance, NAT gateway, VPC peering connection, network interface, or egress-only internet gateway. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  replaceRoute(params: EC2.Types.ReplaceRouteRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Replaces an existing route within a route table in a VPC. You must provide only one of the following: internet gateway or virtual private gateway, NAT instance, NAT gateway, VPC peering connection, network interface, or egress-only internet gateway. For more information, see Route Tables in the Amazon Virtual Private Cloud User Guide.
   */
  replaceRoute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Changes the route table associated with a given subnet in a VPC. After the operation completes, the subnet uses the routes in the new route table it's associated with. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide. You can also use ReplaceRouteTableAssociation to change which table is the main route table in the VPC. You just specify the main route table's association ID and the route table to be the new main route table.
   */
  replaceRouteTableAssociation(params: EC2.Types.ReplaceRouteTableAssociationRequest, callback?: (err: AWSError, data: EC2.Types.ReplaceRouteTableAssociationResult) => void): Request<EC2.Types.ReplaceRouteTableAssociationResult, AWSError>;
  /**
   * Changes the route table associated with a given subnet in a VPC. After the operation completes, the subnet uses the routes in the new route table it's associated with. For more information about route tables, see Route Tables in the Amazon Virtual Private Cloud User Guide. You can also use ReplaceRouteTableAssociation to change which table is the main route table in the VPC. You just specify the main route table's association ID and the route table to be the new main route table.
   */
  replaceRouteTableAssociation(callback?: (err: AWSError, data: EC2.Types.ReplaceRouteTableAssociationResult) => void): Request<EC2.Types.ReplaceRouteTableAssociationResult, AWSError>;
  /**
   * Submits feedback about the status of an instance. The instance must be in the running state. If your experience with the instance differs from the instance status returned by DescribeInstanceStatus, use ReportInstanceStatus to report your experience with the instance. Amazon EC2 collects this information to improve the accuracy of status checks. Use of this action does not change the value returned by DescribeInstanceStatus.
   */
  reportInstanceStatus(params: EC2.Types.ReportInstanceStatusRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Submits feedback about the status of an instance. The instance must be in the running state. If your experience with the instance differs from the instance status returned by DescribeInstanceStatus, use ReportInstanceStatus to report your experience with the instance. Amazon EC2 collects this information to improve the accuracy of status checks. Use of this action does not change the value returned by DescribeInstanceStatus.
   */
  reportInstanceStatus(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Creates a Spot Fleet request. The Spot Fleet request specifies the total target capacity and the On-Demand target capacity. Amazon EC2 calculates the difference between the total capacity and On-Demand capacity, and launches the difference as Spot capacity. You can submit a single request that includes multiple launch specifications that vary by instance type, AMI, Availability Zone, or subnet. By default, the Spot Fleet requests Spot Instances in the Spot pool where the price per unit is the lowest. Each launch specification can include its own instance weighting that reflects the value of the instance type to your application workload. Alternatively, you can specify that the Spot Fleet distribute the target capacity across the Spot pools included in its launch specifications. By ensuring that the Spot Instances in your Spot Fleet are in different Spot pools, you can improve the availability of your fleet. You can specify tags for the Spot Instances. You cannot tag other resource types in a Spot Fleet request because only the instance resource type is supported. For more information, see Spot Fleet Requests in the Amazon EC2 User Guide for Linux Instances.
   */
  requestSpotFleet(params: EC2.Types.RequestSpotFleetRequest, callback?: (err: AWSError, data: EC2.Types.RequestSpotFleetResponse) => void): Request<EC2.Types.RequestSpotFleetResponse, AWSError>;
  /**
   * Creates a Spot Fleet request. The Spot Fleet request specifies the total target capacity and the On-Demand target capacity. Amazon EC2 calculates the difference between the total capacity and On-Demand capacity, and launches the difference as Spot capacity. You can submit a single request that includes multiple launch specifications that vary by instance type, AMI, Availability Zone, or subnet. By default, the Spot Fleet requests Spot Instances in the Spot pool where the price per unit is the lowest. Each launch specification can include its own instance weighting that reflects the value of the instance type to your application workload. Alternatively, you can specify that the Spot Fleet distribute the target capacity across the Spot pools included in its launch specifications. By ensuring that the Spot Instances in your Spot Fleet are in different Spot pools, you can improve the availability of your fleet. You can specify tags for the Spot Instances. You cannot tag other resource types in a Spot Fleet request because only the instance resource type is supported. For more information, see Spot Fleet Requests in the Amazon EC2 User Guide for Linux Instances.
   */
  requestSpotFleet(callback?: (err: AWSError, data: EC2.Types.RequestSpotFleetResponse) => void): Request<EC2.Types.RequestSpotFleetResponse, AWSError>;
  /**
   * Creates a Spot Instance request. For more information, see Spot Instance Requests in the Amazon EC2 User Guide for Linux Instances.
   */
  requestSpotInstances(params: EC2.Types.RequestSpotInstancesRequest, callback?: (err: AWSError, data: EC2.Types.RequestSpotInstancesResult) => void): Request<EC2.Types.RequestSpotInstancesResult, AWSError>;
  /**
   * Creates a Spot Instance request. For more information, see Spot Instance Requests in the Amazon EC2 User Guide for Linux Instances.
   */
  requestSpotInstances(callback?: (err: AWSError, data: EC2.Types.RequestSpotInstancesResult) => void): Request<EC2.Types.RequestSpotInstancesResult, AWSError>;
  /**
   * Resets the specified attribute of the specified Amazon FPGA Image (AFI) to its default value. You can only reset the load permission attribute.
   */
  resetFpgaImageAttribute(params: EC2.Types.ResetFpgaImageAttributeRequest, callback?: (err: AWSError, data: EC2.Types.ResetFpgaImageAttributeResult) => void): Request<EC2.Types.ResetFpgaImageAttributeResult, AWSError>;
  /**
   * Resets the specified attribute of the specified Amazon FPGA Image (AFI) to its default value. You can only reset the load permission attribute.
   */
  resetFpgaImageAttribute(callback?: (err: AWSError, data: EC2.Types.ResetFpgaImageAttributeResult) => void): Request<EC2.Types.ResetFpgaImageAttributeResult, AWSError>;
  /**
   * Resets an attribute of an AMI to its default value.  The productCodes attribute can't be reset. 
   */
  resetImageAttribute(params: EC2.Types.ResetImageAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets an attribute of an AMI to its default value.  The productCodes attribute can't be reset. 
   */
  resetImageAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets an attribute of an instance to its default value. To reset the kernel or ramdisk, the instance must be in a stopped state. To reset the sourceDestCheck, the instance can be either running or stopped. The sourceDestCheck attribute controls whether source/destination checking is enabled. The default value is true, which means checking is enabled. This value must be false for a NAT instance to perform NAT. For more information, see NAT Instances in the Amazon Virtual Private Cloud User Guide.
   */
  resetInstanceAttribute(params: EC2.Types.ResetInstanceAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets an attribute of an instance to its default value. To reset the kernel or ramdisk, the instance must be in a stopped state. To reset the sourceDestCheck, the instance can be either running or stopped. The sourceDestCheck attribute controls whether source/destination checking is enabled. The default value is true, which means checking is enabled. This value must be false for a NAT instance to perform NAT. For more information, see NAT Instances in the Amazon Virtual Private Cloud User Guide.
   */
  resetInstanceAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets a network interface attribute. You can specify only one attribute at a time.
   */
  resetNetworkInterfaceAttribute(params: EC2.Types.ResetNetworkInterfaceAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets a network interface attribute. You can specify only one attribute at a time.
   */
  resetNetworkInterfaceAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets permission settings for the specified snapshot. For more information about modifying snapshot permissions, see Sharing Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  resetSnapshotAttribute(params: EC2.Types.ResetSnapshotAttributeRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Resets permission settings for the specified snapshot. For more information about modifying snapshot permissions, see Sharing Snapshots in the Amazon Elastic Compute Cloud User Guide.
   */
  resetSnapshotAttribute(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Restores an Elastic IP address that was previously moved to the EC2-VPC platform back to the EC2-Classic platform. You cannot move an Elastic IP address that was originally allocated for use in EC2-VPC. The Elastic IP address must not be associated with an instance or network interface.
   */
  restoreAddressToClassic(params: EC2.Types.RestoreAddressToClassicRequest, callback?: (err: AWSError, data: EC2.Types.RestoreAddressToClassicResult) => void): Request<EC2.Types.RestoreAddressToClassicResult, AWSError>;
  /**
   * Restores an Elastic IP address that was previously moved to the EC2-VPC platform back to the EC2-Classic platform. You cannot move an Elastic IP address that was originally allocated for use in EC2-VPC. The Elastic IP address must not be associated with an instance or network interface.
   */
  restoreAddressToClassic(callback?: (err: AWSError, data: EC2.Types.RestoreAddressToClassicResult) => void): Request<EC2.Types.RestoreAddressToClassicResult, AWSError>;
  /**
   * [EC2-VPC only] Removes one or more egress rules from a security group for EC2-VPC. This action doesn't apply to security groups for use in EC2-Classic. To remove a rule, the values that you specify (for example, ports) must match the existing rule's values exactly. Each rule consists of the protocol and the IPv4 or IPv6 CIDR range or source security group. For the TCP and UDP protocols, you must also specify the destination port or range of ports. For the ICMP protocol, you must also specify the ICMP type and code. If the security group rule has a description, you do not have to specify the description to revoke the rule. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur.
   */
  revokeSecurityGroupEgress(params: EC2.Types.RevokeSecurityGroupEgressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * [EC2-VPC only] Removes one or more egress rules from a security group for EC2-VPC. This action doesn't apply to security groups for use in EC2-Classic. To remove a rule, the values that you specify (for example, ports) must match the existing rule's values exactly. Each rule consists of the protocol and the IPv4 or IPv6 CIDR range or source security group. For the TCP and UDP protocols, you must also specify the destination port or range of ports. For the ICMP protocol, you must also specify the ICMP type and code. If the security group rule has a description, you do not have to specify the description to revoke the rule. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur.
   */
  revokeSecurityGroupEgress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Removes one or more ingress rules from a security group. To remove a rule, the values that you specify (for example, ports) must match the existing rule's values exactly.  [EC2-Classic security groups only] If the values you specify do not match the existing rule's values, no error is returned. Use DescribeSecurityGroups to verify that the rule has been removed.  Each rule consists of the protocol and the CIDR range or source security group. For the TCP and UDP protocols, you must also specify the destination port or range of ports. For the ICMP protocol, you must also specify the ICMP type and code. If the security group rule has a description, you do not have to specify the description to revoke the rule. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur.
   */
  revokeSecurityGroupIngress(params: EC2.Types.RevokeSecurityGroupIngressRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Removes one or more ingress rules from a security group. To remove a rule, the values that you specify (for example, ports) must match the existing rule's values exactly.  [EC2-Classic security groups only] If the values you specify do not match the existing rule's values, no error is returned. Use DescribeSecurityGroups to verify that the rule has been removed.  Each rule consists of the protocol and the CIDR range or source security group. For the TCP and UDP protocols, you must also specify the destination port or range of ports. For the ICMP protocol, you must also specify the ICMP type and code. If the security group rule has a description, you do not have to specify the description to revoke the rule. Rule changes are propagated to instances within the security group as quickly as possible. However, a small delay might occur.
   */
  revokeSecurityGroupIngress(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Launches the specified number of instances using an AMI for which you have permissions.  You can specify a number of options, or leave the default options. The following rules apply:   [EC2-VPC] If you don't specify a subnet ID, we choose a default subnet from your default VPC for you. If you don't have a default VPC, you must specify a subnet ID in the request.   [EC2-Classic] If don't specify an Availability Zone, we choose one for you.   Some instance types must be launched into a VPC. If you do not have a default VPC, or if you do not specify a subnet ID, the request fails. For more information, see Instance Types Available Only in a VPC.   [EC2-VPC] All instances have a network interface with a primary private IPv4 address. If you don't specify this address, we choose one from the IPv4 range of your subnet.   Not all instance types support IPv6 addresses. For more information, see Instance Types.   If you don't specify a security group ID, we use the default security group. For more information, see Security Groups.   If any of the AMIs have a product code attached for which the user has not subscribed, the request fails.   You can create a launch template, which is a resource that contains the parameters to launch an instance. When you launch an instance using RunInstances, you can specify the launch template instead of specifying the launch parameters. To ensure faster instance launches, break up large requests into smaller batches. For example, create five separate launch requests for 100 instances each instead of one launch request for 500 instances. An instance is ready for you to use when it's in the running state. You can check the state of your instance using DescribeInstances. You can tag instances and EBS volumes during launch, after launch, or both. For more information, see CreateTags and Tagging Your Amazon EC2 Resources. Linux instances have access to the public key of the key pair at boot. You can use this key to provide secure access to the instance. Amazon EC2 public images use this feature to provide secure access without passwords. For more information, see Key Pairs in the Amazon Elastic Compute Cloud User Guide. For troubleshooting, see What To Do If An Instance Immediately Terminates, and Troubleshooting Connecting to Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  runInstances(params: EC2.Types.RunInstancesRequest, callback?: (err: AWSError, data: EC2.Types.Reservation) => void): Request<EC2.Types.Reservation, AWSError>;
  /**
   * Launches the specified number of instances using an AMI for which you have permissions.  You can specify a number of options, or leave the default options. The following rules apply:   [EC2-VPC] If you don't specify a subnet ID, we choose a default subnet from your default VPC for you. If you don't have a default VPC, you must specify a subnet ID in the request.   [EC2-Classic] If don't specify an Availability Zone, we choose one for you.   Some instance types must be launched into a VPC. If you do not have a default VPC, or if you do not specify a subnet ID, the request fails. For more information, see Instance Types Available Only in a VPC.   [EC2-VPC] All instances have a network interface with a primary private IPv4 address. If you don't specify this address, we choose one from the IPv4 range of your subnet.   Not all instance types support IPv6 addresses. For more information, see Instance Types.   If you don't specify a security group ID, we use the default security group. For more information, see Security Groups.   If any of the AMIs have a product code attached for which the user has not subscribed, the request fails.   You can create a launch template, which is a resource that contains the parameters to launch an instance. When you launch an instance using RunInstances, you can specify the launch template instead of specifying the launch parameters. To ensure faster instance launches, break up large requests into smaller batches. For example, create five separate launch requests for 100 instances each instead of one launch request for 500 instances. An instance is ready for you to use when it's in the running state. You can check the state of your instance using DescribeInstances. You can tag instances and EBS volumes during launch, after launch, or both. For more information, see CreateTags and Tagging Your Amazon EC2 Resources. Linux instances have access to the public key of the key pair at boot. You can use this key to provide secure access to the instance. Amazon EC2 public images use this feature to provide secure access without passwords. For more information, see Key Pairs in the Amazon Elastic Compute Cloud User Guide. For troubleshooting, see What To Do If An Instance Immediately Terminates, and Troubleshooting Connecting to Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  runInstances(callback?: (err: AWSError, data: EC2.Types.Reservation) => void): Request<EC2.Types.Reservation, AWSError>;
  /**
   * Launches the specified Scheduled Instances. Before you can launch a Scheduled Instance, you must purchase it and obtain an identifier using PurchaseScheduledInstances. You must launch a Scheduled Instance during its scheduled time period. You can't stop or reboot a Scheduled Instance, but you can terminate it as needed. If you terminate a Scheduled Instance before the current scheduled time period ends, you can launch it again after a few minutes. For more information, see Scheduled Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  runScheduledInstances(params: EC2.Types.RunScheduledInstancesRequest, callback?: (err: AWSError, data: EC2.Types.RunScheduledInstancesResult) => void): Request<EC2.Types.RunScheduledInstancesResult, AWSError>;
  /**
   * Launches the specified Scheduled Instances. Before you can launch a Scheduled Instance, you must purchase it and obtain an identifier using PurchaseScheduledInstances. You must launch a Scheduled Instance during its scheduled time period. You can't stop or reboot a Scheduled Instance, but you can terminate it as needed. If you terminate a Scheduled Instance before the current scheduled time period ends, you can launch it again after a few minutes. For more information, see Scheduled Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  runScheduledInstances(callback?: (err: AWSError, data: EC2.Types.RunScheduledInstancesResult) => void): Request<EC2.Types.RunScheduledInstancesResult, AWSError>;
  /**
   * Starts an Amazon EBS-backed instance that you've previously stopped. Instances that use Amazon EBS volumes as their root devices can be quickly stopped and started. When an instance is stopped, the compute resources are released and you are not billed for instance usage. However, your root partition Amazon EBS volume remains and continues to persist your data, and you are charged for Amazon EBS volume usage. You can restart your instance at any time. Every time you start your Windows instance, Amazon EC2 charges you for a full instance hour. If you stop and restart your Windows instance, a new instance hour begins and Amazon EC2 charges you for another full instance hour even if you are still within the same 60-minute period when it was stopped. Every time you start your Linux instance, Amazon EC2 charges a one-minute minimum for instance usage, and thereafter charges per second for instance usage. Before stopping an instance, make sure it is in a state from which it can be restarted. Stopping an instance does not preserve data stored in RAM. Performing this operation on an instance that uses an instance store as its root device returns an error. For more information, see Stopping Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  startInstances(params: EC2.Types.StartInstancesRequest, callback?: (err: AWSError, data: EC2.Types.StartInstancesResult) => void): Request<EC2.Types.StartInstancesResult, AWSError>;
  /**
   * Starts an Amazon EBS-backed instance that you've previously stopped. Instances that use Amazon EBS volumes as their root devices can be quickly stopped and started. When an instance is stopped, the compute resources are released and you are not billed for instance usage. However, your root partition Amazon EBS volume remains and continues to persist your data, and you are charged for Amazon EBS volume usage. You can restart your instance at any time. Every time you start your Windows instance, Amazon EC2 charges you for a full instance hour. If you stop and restart your Windows instance, a new instance hour begins and Amazon EC2 charges you for another full instance hour even if you are still within the same 60-minute period when it was stopped. Every time you start your Linux instance, Amazon EC2 charges a one-minute minimum for instance usage, and thereafter charges per second for instance usage. Before stopping an instance, make sure it is in a state from which it can be restarted. Stopping an instance does not preserve data stored in RAM. Performing this operation on an instance that uses an instance store as its root device returns an error. For more information, see Stopping Instances in the Amazon Elastic Compute Cloud User Guide.
   */
  startInstances(callback?: (err: AWSError, data: EC2.Types.StartInstancesResult) => void): Request<EC2.Types.StartInstancesResult, AWSError>;
  /**
   * Stops an Amazon EBS-backed instance. We don't charge usage for a stopped instance, or data transfer fees; however, your root partition Amazon EBS volume remains and continues to persist your data, and you are charged for Amazon EBS volume usage. Every time you start your Windows instance, Amazon EC2 charges you for a full instance hour. If you stop and restart your Windows instance, a new instance hour begins and Amazon EC2 charges you for another full instance hour even if you are still within the same 60-minute period when it was stopped. Every time you start your Linux instance, Amazon EC2 charges a one-minute minimum for instance usage, and thereafter charges per second for instance usage. You can't start or stop Spot Instances, and you can't stop instance store-backed instances. When you stop an instance, we shut it down. You can restart your instance at any time. Before stopping an instance, make sure it is in a state from which it can be restarted. Stopping an instance does not preserve data stored in RAM. Stopping an instance is different to rebooting or terminating it. For example, when you stop an instance, the root device and any other devices attached to the instance persist. When you terminate an instance, the root device and any other devices attached during the instance launch are automatically deleted. For more information about the differences between rebooting, stopping, and terminating instances, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide. When you stop an instance, we attempt to shut it down forcibly after a short while. If your instance appears stuck in the stopping state after a period of time, there may be an issue with the underlying host computer. For more information, see Troubleshooting Stopping Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  stopInstances(params: EC2.Types.StopInstancesRequest, callback?: (err: AWSError, data: EC2.Types.StopInstancesResult) => void): Request<EC2.Types.StopInstancesResult, AWSError>;
  /**
   * Stops an Amazon EBS-backed instance. We don't charge usage for a stopped instance, or data transfer fees; however, your root partition Amazon EBS volume remains and continues to persist your data, and you are charged for Amazon EBS volume usage. Every time you start your Windows instance, Amazon EC2 charges you for a full instance hour. If you stop and restart your Windows instance, a new instance hour begins and Amazon EC2 charges you for another full instance hour even if you are still within the same 60-minute period when it was stopped. Every time you start your Linux instance, Amazon EC2 charges a one-minute minimum for instance usage, and thereafter charges per second for instance usage. You can't start or stop Spot Instances, and you can't stop instance store-backed instances. When you stop an instance, we shut it down. You can restart your instance at any time. Before stopping an instance, make sure it is in a state from which it can be restarted. Stopping an instance does not preserve data stored in RAM. Stopping an instance is different to rebooting or terminating it. For example, when you stop an instance, the root device and any other devices attached to the instance persist. When you terminate an instance, the root device and any other devices attached during the instance launch are automatically deleted. For more information about the differences between rebooting, stopping, and terminating instances, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide. When you stop an instance, we attempt to shut it down forcibly after a short while. If your instance appears stuck in the stopping state after a period of time, there may be an issue with the underlying host computer. For more information, see Troubleshooting Stopping Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  stopInstances(callback?: (err: AWSError, data: EC2.Types.StopInstancesResult) => void): Request<EC2.Types.StopInstancesResult, AWSError>;
  /**
   * Shuts down one or more instances. This operation is idempotent; if you terminate an instance more than once, each call succeeds.  If you specify multiple instances and the request fails (for example, because of a single incorrect instance ID), none of the instances are terminated. Terminated instances remain visible after termination (for approximately one hour). By default, Amazon EC2 deletes all EBS volumes that were attached when the instance launched. Volumes attached after instance launch continue running. You can stop, start, and terminate EBS-backed instances. You can only terminate instance store-backed instances. What happens to an instance differs if you stop it or terminate it. For example, when you stop an instance, the root device and any other devices attached to the instance persist. When you terminate an instance, any attached EBS volumes with the DeleteOnTermination block device mapping parameter set to true are automatically deleted. For more information about the differences between stopping and terminating instances, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide. For more information about troubleshooting, see Troubleshooting Terminating Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  terminateInstances(params: EC2.Types.TerminateInstancesRequest, callback?: (err: AWSError, data: EC2.Types.TerminateInstancesResult) => void): Request<EC2.Types.TerminateInstancesResult, AWSError>;
  /**
   * Shuts down one or more instances. This operation is idempotent; if you terminate an instance more than once, each call succeeds.  If you specify multiple instances and the request fails (for example, because of a single incorrect instance ID), none of the instances are terminated. Terminated instances remain visible after termination (for approximately one hour). By default, Amazon EC2 deletes all EBS volumes that were attached when the instance launched. Volumes attached after instance launch continue running. You can stop, start, and terminate EBS-backed instances. You can only terminate instance store-backed instances. What happens to an instance differs if you stop it or terminate it. For example, when you stop an instance, the root device and any other devices attached to the instance persist. When you terminate an instance, any attached EBS volumes with the DeleteOnTermination block device mapping parameter set to true are automatically deleted. For more information about the differences between stopping and terminating instances, see Instance Lifecycle in the Amazon Elastic Compute Cloud User Guide. For more information about troubleshooting, see Troubleshooting Terminating Your Instance in the Amazon Elastic Compute Cloud User Guide.
   */
  terminateInstances(callback?: (err: AWSError, data: EC2.Types.TerminateInstancesResult) => void): Request<EC2.Types.TerminateInstancesResult, AWSError>;
  /**
   * Unassigns one or more IPv6 addresses from a network interface.
   */
  unassignIpv6Addresses(params: EC2.Types.UnassignIpv6AddressesRequest, callback?: (err: AWSError, data: EC2.Types.UnassignIpv6AddressesResult) => void): Request<EC2.Types.UnassignIpv6AddressesResult, AWSError>;
  /**
   * Unassigns one or more IPv6 addresses from a network interface.
   */
  unassignIpv6Addresses(callback?: (err: AWSError, data: EC2.Types.UnassignIpv6AddressesResult) => void): Request<EC2.Types.UnassignIpv6AddressesResult, AWSError>;
  /**
   * Unassigns one or more secondary private IP addresses from a network interface.
   */
  unassignPrivateIpAddresses(params: EC2.Types.UnassignPrivateIpAddressesRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Unassigns one or more secondary private IP addresses from a network interface.
   */
  unassignPrivateIpAddresses(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Disables detailed monitoring for a running instance. For more information, see Monitoring Your Instances and Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  unmonitorInstances(params: EC2.Types.UnmonitorInstancesRequest, callback?: (err: AWSError, data: EC2.Types.UnmonitorInstancesResult) => void): Request<EC2.Types.UnmonitorInstancesResult, AWSError>;
  /**
   * Disables detailed monitoring for a running instance. For more information, see Monitoring Your Instances and Volumes in the Amazon Elastic Compute Cloud User Guide.
   */
  unmonitorInstances(callback?: (err: AWSError, data: EC2.Types.UnmonitorInstancesResult) => void): Request<EC2.Types.UnmonitorInstancesResult, AWSError>;
  /**
   * [EC2-VPC only] Updates the description of an egress (outbound) security group rule. You can replace an existing description, or add a description to a rule that did not have one previously. You specify the description as part of the IP permissions structure. You can remove a description for a security group rule by omitting the description parameter in the request.
   */
  updateSecurityGroupRuleDescriptionsEgress(params: EC2.Types.UpdateSecurityGroupRuleDescriptionsEgressRequest, callback?: (err: AWSError, data: EC2.Types.UpdateSecurityGroupRuleDescriptionsEgressResult) => void): Request<EC2.Types.UpdateSecurityGroupRuleDescriptionsEgressResult, AWSError>;
  /**
   * [EC2-VPC only] Updates the description of an egress (outbound) security group rule. You can replace an existing description, or add a description to a rule that did not have one previously. You specify the description as part of the IP permissions structure. You can remove a description for a security group rule by omitting the description parameter in the request.
   */
  updateSecurityGroupRuleDescriptionsEgress(callback?: (err: AWSError, data: EC2.Types.UpdateSecurityGroupRuleDescriptionsEgressResult) => void): Request<EC2.Types.UpdateSecurityGroupRuleDescriptionsEgressResult, AWSError>;
  /**
   * Updates the description of an ingress (inbound) security group rule. You can replace an existing description, or add a description to a rule that did not have one previously. You specify the description as part of the IP permissions structure. You can remove a description for a security group rule by omitting the description parameter in the request.
   */
  updateSecurityGroupRuleDescriptionsIngress(params: EC2.Types.UpdateSecurityGroupRuleDescriptionsIngressRequest, callback?: (err: AWSError, data: EC2.Types.UpdateSecurityGroupRuleDescriptionsIngressResult) => void): Request<EC2.Types.UpdateSecurityGroupRuleDescriptionsIngressResult, AWSError>;
  /**
   * Updates the description of an ingress (inbound) security group rule. You can replace an existing description, or add a description to a rule that did not have one previously. You specify the description as part of the IP permissions structure. You can remove a description for a security group rule by omitting the description parameter in the request.
   */
  updateSecurityGroupRuleDescriptionsIngress(callback?: (err: AWSError, data: EC2.Types.UpdateSecurityGroupRuleDescriptionsIngressResult) => void): Request<EC2.Types.UpdateSecurityGroupRuleDescriptionsIngressResult, AWSError>;
  /**
   * Waits for the instanceExists state by periodically calling the underlying EC2.describeInstancesoperation every 5 seconds (at most 40 times).
   */
  waitFor(state: "instanceExists", params: EC2.Types.DescribeInstancesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceExists state by periodically calling the underlying EC2.describeInstancesoperation every 5 seconds (at most 40 times).
   */
  waitFor(state: "instanceExists", callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the bundleTaskComplete state by periodically calling the underlying EC2.describeBundleTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "bundleTaskComplete", params: EC2.Types.DescribeBundleTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeBundleTasksResult) => void): Request<EC2.Types.DescribeBundleTasksResult, AWSError>;
  /**
   * Waits for the bundleTaskComplete state by periodically calling the underlying EC2.describeBundleTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "bundleTaskComplete", callback?: (err: AWSError, data: EC2.Types.DescribeBundleTasksResult) => void): Request<EC2.Types.DescribeBundleTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskCancelled state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskCancelled", params: EC2.Types.DescribeConversionTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskCancelled state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskCancelled", callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskCompleted state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskCompleted", params: EC2.Types.DescribeConversionTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskCompleted state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskCompleted", callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskDeleted state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskDeleted", params: EC2.Types.DescribeConversionTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the conversionTaskDeleted state by periodically calling the underlying EC2.describeConversionTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "conversionTaskDeleted", callback?: (err: AWSError, data: EC2.Types.DescribeConversionTasksResult) => void): Request<EC2.Types.DescribeConversionTasksResult, AWSError>;
  /**
   * Waits for the customerGatewayAvailable state by periodically calling the underlying EC2.describeCustomerGatewaysoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "customerGatewayAvailable", params: EC2.Types.DescribeCustomerGatewaysRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeCustomerGatewaysResult) => void): Request<EC2.Types.DescribeCustomerGatewaysResult, AWSError>;
  /**
   * Waits for the customerGatewayAvailable state by periodically calling the underlying EC2.describeCustomerGatewaysoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "customerGatewayAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeCustomerGatewaysResult) => void): Request<EC2.Types.DescribeCustomerGatewaysResult, AWSError>;
  /**
   * Waits for the exportTaskCancelled state by periodically calling the underlying EC2.describeExportTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "exportTaskCancelled", params: EC2.Types.DescribeExportTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Waits for the exportTaskCancelled state by periodically calling the underlying EC2.describeExportTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "exportTaskCancelled", callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Waits for the exportTaskCompleted state by periodically calling the underlying EC2.describeExportTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "exportTaskCompleted", params: EC2.Types.DescribeExportTasksRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Waits for the exportTaskCompleted state by periodically calling the underlying EC2.describeExportTasksoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "exportTaskCompleted", callback?: (err: AWSError, data: EC2.Types.DescribeExportTasksResult) => void): Request<EC2.Types.DescribeExportTasksResult, AWSError>;
  /**
   * Waits for the imageExists state by periodically calling the underlying EC2.describeImagesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "imageExists", params: EC2.Types.DescribeImagesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Waits for the imageExists state by periodically calling the underlying EC2.describeImagesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "imageExists", callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Waits for the imageAvailable state by periodically calling the underlying EC2.describeImagesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "imageAvailable", params: EC2.Types.DescribeImagesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Waits for the imageAvailable state by periodically calling the underlying EC2.describeImagesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "imageAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeImagesResult) => void): Request<EC2.Types.DescribeImagesResult, AWSError>;
  /**
   * Waits for the instanceRunning state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceRunning", params: EC2.Types.DescribeInstancesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceRunning state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceRunning", callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceStatusOk state by periodically calling the underlying EC2.describeInstanceStatusoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceStatusOk", params: EC2.Types.DescribeInstanceStatusRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Waits for the instanceStatusOk state by periodically calling the underlying EC2.describeInstanceStatusoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceStatusOk", callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Waits for the instanceStopped state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceStopped", params: EC2.Types.DescribeInstancesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceStopped state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceStopped", callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceTerminated state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceTerminated", params: EC2.Types.DescribeInstancesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the instanceTerminated state by periodically calling the underlying EC2.describeInstancesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "instanceTerminated", callback?: (err: AWSError, data: EC2.Types.DescribeInstancesResult) => void): Request<EC2.Types.DescribeInstancesResult, AWSError>;
  /**
   * Waits for the keyPairExists state by periodically calling the underlying EC2.describeKeyPairsoperation every 5 seconds (at most 6 times).
   */
  waitFor(state: "keyPairExists", params: EC2.Types.DescribeKeyPairsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeKeyPairsResult) => void): Request<EC2.Types.DescribeKeyPairsResult, AWSError>;
  /**
   * Waits for the keyPairExists state by periodically calling the underlying EC2.describeKeyPairsoperation every 5 seconds (at most 6 times).
   */
  waitFor(state: "keyPairExists", callback?: (err: AWSError, data: EC2.Types.DescribeKeyPairsResult) => void): Request<EC2.Types.DescribeKeyPairsResult, AWSError>;
  /**
   * Waits for the natGatewayAvailable state by periodically calling the underlying EC2.describeNatGatewaysoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "natGatewayAvailable", params: EC2.Types.DescribeNatGatewaysRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeNatGatewaysResult) => void): Request<EC2.Types.DescribeNatGatewaysResult, AWSError>;
  /**
   * Waits for the natGatewayAvailable state by periodically calling the underlying EC2.describeNatGatewaysoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "natGatewayAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeNatGatewaysResult) => void): Request<EC2.Types.DescribeNatGatewaysResult, AWSError>;
  /**
   * Waits for the networkInterfaceAvailable state by periodically calling the underlying EC2.describeNetworkInterfacesoperation every 20 seconds (at most 10 times).
   */
  waitFor(state: "networkInterfaceAvailable", params: EC2.Types.DescribeNetworkInterfacesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacesResult) => void): Request<EC2.Types.DescribeNetworkInterfacesResult, AWSError>;
  /**
   * Waits for the networkInterfaceAvailable state by periodically calling the underlying EC2.describeNetworkInterfacesoperation every 20 seconds (at most 10 times).
   */
  waitFor(state: "networkInterfaceAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeNetworkInterfacesResult) => void): Request<EC2.Types.DescribeNetworkInterfacesResult, AWSError>;
  /**
   * Waits for the passwordDataAvailable state by periodically calling the underlying EC2.getPasswordDataoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "passwordDataAvailable", params: EC2.Types.GetPasswordDataRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.GetPasswordDataResult) => void): Request<EC2.Types.GetPasswordDataResult, AWSError>;
  /**
   * Waits for the passwordDataAvailable state by periodically calling the underlying EC2.getPasswordDataoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "passwordDataAvailable", callback?: (err: AWSError, data: EC2.Types.GetPasswordDataResult) => void): Request<EC2.Types.GetPasswordDataResult, AWSError>;
  /**
   * Waits for the snapshotCompleted state by periodically calling the underlying EC2.describeSnapshotsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "snapshotCompleted", params: EC2.Types.DescribeSnapshotsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotsResult) => void): Request<EC2.Types.DescribeSnapshotsResult, AWSError>;
  /**
   * Waits for the snapshotCompleted state by periodically calling the underlying EC2.describeSnapshotsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "snapshotCompleted", callback?: (err: AWSError, data: EC2.Types.DescribeSnapshotsResult) => void): Request<EC2.Types.DescribeSnapshotsResult, AWSError>;
  /**
   * Waits for the spotInstanceRequestFulfilled state by periodically calling the underlying EC2.describeSpotInstanceRequestsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "spotInstanceRequestFulfilled", params: EC2.Types.DescribeSpotInstanceRequestsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeSpotInstanceRequestsResult) => void): Request<EC2.Types.DescribeSpotInstanceRequestsResult, AWSError>;
  /**
   * Waits for the spotInstanceRequestFulfilled state by periodically calling the underlying EC2.describeSpotInstanceRequestsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "spotInstanceRequestFulfilled", callback?: (err: AWSError, data: EC2.Types.DescribeSpotInstanceRequestsResult) => void): Request<EC2.Types.DescribeSpotInstanceRequestsResult, AWSError>;
  /**
   * Waits for the subnetAvailable state by periodically calling the underlying EC2.describeSubnetsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "subnetAvailable", params: EC2.Types.DescribeSubnetsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeSubnetsResult) => void): Request<EC2.Types.DescribeSubnetsResult, AWSError>;
  /**
   * Waits for the subnetAvailable state by periodically calling the underlying EC2.describeSubnetsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "subnetAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeSubnetsResult) => void): Request<EC2.Types.DescribeSubnetsResult, AWSError>;
  /**
   * Waits for the systemStatusOk state by periodically calling the underlying EC2.describeInstanceStatusoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "systemStatusOk", params: EC2.Types.DescribeInstanceStatusRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Waits for the systemStatusOk state by periodically calling the underlying EC2.describeInstanceStatusoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "systemStatusOk", callback?: (err: AWSError, data: EC2.Types.DescribeInstanceStatusResult) => void): Request<EC2.Types.DescribeInstanceStatusResult, AWSError>;
  /**
   * Waits for the volumeAvailable state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeAvailable", params: EC2.Types.DescribeVolumesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the volumeAvailable state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the volumeDeleted state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeDeleted", params: EC2.Types.DescribeVolumesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the volumeDeleted state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeDeleted", callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the volumeInUse state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeInUse", params: EC2.Types.DescribeVolumesRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the volumeInUse state by periodically calling the underlying EC2.describeVolumesoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "volumeInUse", callback?: (err: AWSError, data: EC2.Types.DescribeVolumesResult) => void): Request<EC2.Types.DescribeVolumesResult, AWSError>;
  /**
   * Waits for the vpcAvailable state by periodically calling the underlying EC2.describeVpcsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcAvailable", params: EC2.Types.DescribeVpcsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Waits for the vpcAvailable state by periodically calling the underlying EC2.describeVpcsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Waits for the vpcExists state by periodically calling the underlying EC2.describeVpcsoperation every 1 seconds (at most 5 times).
   */
  waitFor(state: "vpcExists", params: EC2.Types.DescribeVpcsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Waits for the vpcExists state by periodically calling the underlying EC2.describeVpcsoperation every 1 seconds (at most 5 times).
   */
  waitFor(state: "vpcExists", callback?: (err: AWSError, data: EC2.Types.DescribeVpcsResult) => void): Request<EC2.Types.DescribeVpcsResult, AWSError>;
  /**
   * Waits for the vpnConnectionAvailable state by periodically calling the underlying EC2.describeVpnConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpnConnectionAvailable", params: EC2.Types.DescribeVpnConnectionsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Waits for the vpnConnectionAvailable state by periodically calling the underlying EC2.describeVpnConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpnConnectionAvailable", callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Waits for the vpnConnectionDeleted state by periodically calling the underlying EC2.describeVpnConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpnConnectionDeleted", params: EC2.Types.DescribeVpnConnectionsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Waits for the vpnConnectionDeleted state by periodically calling the underlying EC2.describeVpnConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpnConnectionDeleted", callback?: (err: AWSError, data: EC2.Types.DescribeVpnConnectionsResult) => void): Request<EC2.Types.DescribeVpnConnectionsResult, AWSError>;
  /**
   * Waits for the vpcPeeringConnectionExists state by periodically calling the underlying EC2.describeVpcPeeringConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcPeeringConnectionExists", params: EC2.Types.DescribeVpcPeeringConnectionsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
  /**
   * Waits for the vpcPeeringConnectionExists state by periodically calling the underlying EC2.describeVpcPeeringConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcPeeringConnectionExists", callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
  /**
   * Waits for the vpcPeeringConnectionDeleted state by periodically calling the underlying EC2.describeVpcPeeringConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcPeeringConnectionDeleted", params: EC2.Types.DescribeVpcPeeringConnectionsRequest & {$waiter?: WaiterConfiguration}, callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
  /**
   * Waits for the vpcPeeringConnectionDeleted state by periodically calling the underlying EC2.describeVpcPeeringConnectionsoperation every 15 seconds (at most 40 times).
   */
  waitFor(state: "vpcPeeringConnectionDeleted", callback?: (err: AWSError, data: EC2.Types.DescribeVpcPeeringConnectionsResult) => void): Request<EC2.Types.DescribeVpcPeeringConnectionsResult, AWSError>;
}
declare namespace EC2 {
  export interface AcceptReservedInstancesExchangeQuoteRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of the Convertible Reserved Instances to exchange for another Convertible Reserved Instance of the same or higher value.
     */
    ReservedInstanceIds: ReservedInstanceIdSet;
    /**
     * The configuration of the target Convertible Reserved Instance to exchange for your current Convertible Reserved Instances.
     */
    TargetConfigurations?: TargetConfigurationRequestSet;
  }
  export interface AcceptReservedInstancesExchangeQuoteResult {
    /**
     * The ID of the successful exchange.
     */
    ExchangeId?: String;
  }
  export interface AcceptVpcEndpointConnectionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the endpoint service.
     */
    ServiceId: String;
    /**
     * The IDs of one or more interface VPC endpoints.
     */
    VpcEndpointIds: ValueStringList;
  }
  export interface AcceptVpcEndpointConnectionsResult {
    /**
     * Information about the interface endpoints that were not accepted, if applicable.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface AcceptVpcPeeringConnectionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC peering connection. You must specify this parameter in the request.
     */
    VpcPeeringConnectionId?: String;
  }
  export interface AcceptVpcPeeringConnectionResult {
    /**
     * Information about the VPC peering connection.
     */
    VpcPeeringConnection?: VpcPeeringConnection;
  }
  export interface AccountAttribute {
    /**
     * The name of the account attribute.
     */
    AttributeName?: String;
    /**
     * One or more values for the account attribute.
     */
    AttributeValues?: AccountAttributeValueList;
  }
  export type AccountAttributeList = AccountAttribute[];
  export type AccountAttributeName = "supported-platforms"|"default-vpc"|string;
  export type AccountAttributeNameStringList = AccountAttributeName[];
  export interface AccountAttributeValue {
    /**
     * The value of the attribute.
     */
    AttributeValue?: String;
  }
  export type AccountAttributeValueList = AccountAttributeValue[];
  export interface ActiveInstance {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The instance type.
     */
    InstanceType?: String;
    /**
     * The ID of the Spot Instance request.
     */
    SpotInstanceRequestId?: String;
    /**
     * The health status of the instance. If the status of either the instance status check or the system status check is impaired, the health status of the instance is unhealthy. Otherwise, the health status is healthy.
     */
    InstanceHealth?: InstanceHealthStatus;
  }
  export type ActiveInstanceSet = ActiveInstance[];
  export type ActivityStatus = "error"|"pending_fulfillment"|"pending_termination"|"fulfilled"|string;
  export interface Address {
    /**
     * The ID of the instance that the address is associated with (if any).
     */
    InstanceId?: String;
    /**
     * The Elastic IP address.
     */
    PublicIp?: String;
    /**
     * The ID representing the allocation of the address for use with EC2-VPC.
     */
    AllocationId?: String;
    /**
     * The ID representing the association of the address with an instance in a VPC.
     */
    AssociationId?: String;
    /**
     * Indicates whether this Elastic IP address is for use with instances in EC2-Classic (standard) or instances in a VPC (vpc).
     */
    Domain?: DomainType;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The ID of the AWS account that owns the network interface.
     */
    NetworkInterfaceOwnerId?: String;
    /**
     * The private IP address associated with the Elastic IP address.
     */
    PrivateIpAddress?: String;
    /**
     * Any tags assigned to the Elastic IP address.
     */
    Tags?: TagList;
  }
  export type AddressList = Address[];
  export type Affinity = "default"|"host"|string;
  export interface AllocateAddressRequest {
    /**
     * Set to vpc to allocate the address for use with instances in a VPC. Default: The address is for use with instances in EC2-Classic.
     */
    Domain?: DomainType;
    /**
     * [EC2-VPC] The Elastic IP address to recover.
     */
    Address?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface AllocateAddressResult {
    /**
     * The Elastic IP address.
     */
    PublicIp?: String;
    /**
     * [EC2-VPC] The ID that AWS assigns to represent the allocation of the Elastic IP address for use with instances in a VPC.
     */
    AllocationId?: String;
    /**
     * Indicates whether this Elastic IP address is for use with instances in EC2-Classic (standard) or instances in a VPC (vpc).
     */
    Domain?: DomainType;
  }
  export interface AllocateHostsRequest {
    /**
     * This is enabled by default. This property allows instances to be automatically placed onto available Dedicated Hosts, when you are launching instances without specifying a host ID. Default: Enabled
     */
    AutoPlacement?: AutoPlacement;
    /**
     * The Availability Zone for the Dedicated Hosts.
     */
    AvailabilityZone: String;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon Elastic Compute Cloud User Guide. 
     */
    ClientToken?: String;
    /**
     * Specify the instance type for which to configure your Dedicated Hosts. When you specify the instance type, that is the only instance type that you can launch onto that host.
     */
    InstanceType: String;
    /**
     * The number of Dedicated Hosts to allocate to your account with these parameters.
     */
    Quantity: Integer;
    /**
     * The tags to apply to the Dedicated Host during creation.
     */
    TagSpecifications?: TagSpecificationList;
  }
  export interface AllocateHostsResult {
    /**
     * The ID of the allocated Dedicated Host. This is used to launch an instance onto a specific host.
     */
    HostIds?: ResponseHostIdList;
  }
  export type AllocationIdList = String[];
  export type AllocationState = "available"|"under-assessment"|"permanent-failure"|"released"|"released-permanent-failure"|string;
  export type AllocationStrategy = "lowestPrice"|"diversified"|string;
  export interface AllowedPrincipal {
    /**
     * The type of principal.
     */
    PrincipalType?: PrincipalType;
    /**
     * The Amazon Resource Name (ARN) of the principal.
     */
    Principal?: String;
  }
  export type AllowedPrincipalSet = AllowedPrincipal[];
  export type ArchitectureValues = "i386"|"x86_64"|string;
  export interface AssignIpv6AddressesRequest {
    /**
     * The number of IPv6 addresses to assign to the network interface. Amazon EC2 automatically selects the IPv6 addresses from the subnet range. You can't use this option if specifying specific IPv6 addresses.
     */
    Ipv6AddressCount?: Integer;
    /**
     * One or more specific IPv6 addresses to be assigned to the network interface. You can't use this option if you're specifying a number of IPv6 addresses.
     */
    Ipv6Addresses?: Ipv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
  }
  export interface AssignIpv6AddressesResult {
    /**
     * The IPv6 addresses assigned to the network interface.
     */
    AssignedIpv6Addresses?: Ipv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
  }
  export interface AssignPrivateIpAddressesRequest {
    /**
     * Indicates whether to allow an IP address that is already assigned to another network interface or instance to be reassigned to the specified network interface.
     */
    AllowReassignment?: Boolean;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
    /**
     * One or more IP addresses to be assigned as a secondary private IP address to the network interface. You can't specify this parameter when also specifying a number of secondary IP addresses. If you don't specify an IP address, Amazon EC2 automatically selects an IP address within the subnet range.
     */
    PrivateIpAddresses?: PrivateIpAddressStringList;
    /**
     * The number of secondary IP addresses to assign to the network interface. You can't specify this parameter when also specifying private IP addresses.
     */
    SecondaryPrivateIpAddressCount?: Integer;
  }
  export interface AssociateAddressRequest {
    /**
     * [EC2-VPC] The allocation ID. This is required for EC2-VPC.
     */
    AllocationId?: String;
    /**
     * The ID of the instance. This is required for EC2-Classic. For EC2-VPC, you can specify either the instance ID or the network interface ID, but not both. The operation fails if you specify an instance ID unless exactly one network interface is attached.
     */
    InstanceId?: String;
    /**
     * The Elastic IP address. This is required for EC2-Classic.
     */
    PublicIp?: String;
    /**
     * [EC2-VPC] For a VPC in an EC2-Classic account, specify true to allow an Elastic IP address that is already associated with an instance or network interface to be reassociated with the specified instance or network interface. Otherwise, the operation fails. In a VPC in an EC2-VPC-only account, reassociation is automatic, therefore you can specify false to ensure the operation fails if the Elastic IP address is already associated with another resource.
     */
    AllowReassociation?: Boolean;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * [EC2-VPC] The ID of the network interface. If the instance has more than one network interface, you must specify a network interface ID.
     */
    NetworkInterfaceId?: String;
    /**
     * [EC2-VPC] The primary or secondary private IP address to associate with the Elastic IP address. If no private IP address is specified, the Elastic IP address is associated with the primary private IP address.
     */
    PrivateIpAddress?: String;
  }
  export interface AssociateAddressResult {
    /**
     * [EC2-VPC] The ID that represents the association of the Elastic IP address with an instance.
     */
    AssociationId?: String;
  }
  export interface AssociateDhcpOptionsRequest {
    /**
     * The ID of the DHCP options set, or default to associate no DHCP options with the VPC.
     */
    DhcpOptionsId: String;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface AssociateIamInstanceProfileRequest {
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile: IamInstanceProfileSpecification;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
  }
  export interface AssociateIamInstanceProfileResult {
    /**
     * Information about the IAM instance profile association.
     */
    IamInstanceProfileAssociation?: IamInstanceProfileAssociation;
  }
  export interface AssociateRouteTableRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
    /**
     * The ID of the subnet.
     */
    SubnetId: String;
  }
  export interface AssociateRouteTableResult {
    /**
     * The route table association ID. This ID is required for disassociating the route table.
     */
    AssociationId?: String;
  }
  export interface AssociateSubnetCidrBlockRequest {
    /**
     * The IPv6 CIDR block for your subnet. The subnet must have a /64 prefix length.
     */
    Ipv6CidrBlock: String;
    /**
     * The ID of your subnet.
     */
    SubnetId: String;
  }
  export interface AssociateSubnetCidrBlockResult {
    /**
     * Information about the IPv6 CIDR block association.
     */
    Ipv6CidrBlockAssociation?: SubnetIpv6CidrBlockAssociation;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
  }
  export interface AssociateVpcCidrBlockRequest {
    /**
     * Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IPv6 addresses, or the size of the CIDR block.
     */
    AmazonProvidedIpv6CidrBlock?: Boolean;
    /**
     * An IPv4 CIDR block to associate with the VPC.
     */
    CidrBlock?: String;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface AssociateVpcCidrBlockResult {
    /**
     * Information about the IPv6 CIDR block association.
     */
    Ipv6CidrBlockAssociation?: VpcIpv6CidrBlockAssociation;
    /**
     * Information about the IPv4 CIDR block association.
     */
    CidrBlockAssociation?: VpcCidrBlockAssociation;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type AssociationIdList = String[];
  export interface AttachClassicLinkVpcRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of one or more of the VPC's security groups. You cannot specify security groups from a different VPC.
     */
    Groups: GroupIdStringList;
    /**
     * The ID of an EC2-Classic instance to link to the ClassicLink-enabled VPC.
     */
    InstanceId: String;
    /**
     * The ID of a ClassicLink-enabled VPC.
     */
    VpcId: String;
  }
  export interface AttachClassicLinkVpcResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface AttachInternetGatewayRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the internet gateway.
     */
    InternetGatewayId: String;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface AttachNetworkInterfaceRequest {
    /**
     * The index of the device for the network interface attachment.
     */
    DeviceIndex: Integer;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
  }
  export interface AttachNetworkInterfaceResult {
    /**
     * The ID of the network interface attachment.
     */
    AttachmentId?: String;
  }
  export interface AttachVolumeRequest {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    Device: String;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * The ID of the EBS volume. The volume and instance must be within the same Availability Zone.
     */
    VolumeId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface AttachVpnGatewayRequest {
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * The ID of the virtual private gateway.
     */
    VpnGatewayId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface AttachVpnGatewayResult {
    /**
     * Information about the attachment.
     */
    VpcAttachment?: VpcAttachment;
  }
  export type AttachmentStatus = "attaching"|"attached"|"detaching"|"detached"|string;
  export interface AttributeBooleanValue {
    /**
     * The attribute value. The valid values are true or false.
     */
    Value?: Boolean;
  }
  export interface AttributeValue {
    /**
     * The attribute value. The value is case-sensitive.
     */
    Value?: String;
  }
  export interface AuthorizeSecurityGroupEgressRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the security group.
     */
    GroupId: String;
    /**
     * One or more sets of IP permissions. You can't specify a destination security group and a CIDR IP address range in the same set of permissions.
     */
    IpPermissions?: IpPermissionList;
    /**
     * Not supported. Use a set of IP permissions to specify the CIDR.
     */
    CidrIp?: String;
    /**
     * Not supported. Use a set of IP permissions to specify the port.
     */
    FromPort?: Integer;
    /**
     * Not supported. Use a set of IP permissions to specify the protocol name or number.
     */
    IpProtocol?: String;
    /**
     * Not supported. Use a set of IP permissions to specify the port.
     */
    ToPort?: Integer;
    /**
     * Not supported. Use a set of IP permissions to specify a destination security group.
     */
    SourceSecurityGroupName?: String;
    /**
     * Not supported. Use a set of IP permissions to specify a destination security group.
     */
    SourceSecurityGroupOwnerId?: String;
  }
  export interface AuthorizeSecurityGroupIngressRequest {
    /**
     * The CIDR IPv4 address range. You can't specify this parameter when specifying a source security group.
     */
    CidrIp?: String;
    /**
     * The start of port range for the TCP and UDP protocols, or an ICMP/ICMPv6 type number. For the ICMP/ICMPv6 type number, use -1 to specify all types. If you specify all ICMP/ICMPv6 types, you must specify all codes.
     */
    FromPort?: Integer;
    /**
     * The ID of the security group. You must specify either the security group ID or the security group name in the request. For security groups in a nondefault VPC, you must specify the security group ID.
     */
    GroupId?: String;
    /**
     * [EC2-Classic, default VPC] The name of the security group. You must specify either the security group ID or the security group name in the request.
     */
    GroupName?: String;
    /**
     * One or more sets of IP permissions. Can be used to specify multiple rules in a single command.
     */
    IpPermissions?: IpPermissionList;
    /**
     * The IP protocol name (tcp, udp, icmp) or number (see Protocol Numbers). (VPC only) Use -1 to specify all protocols. If you specify -1, or a protocol number other than tcp, udp, icmp, or 58 (ICMPv6), traffic on all ports is allowed, regardless of any ports you specify. For tcp, udp, and icmp, you must specify a port range. For protocol 58 (ICMPv6), you can optionally specify a port range; if you don't, traffic for all types and codes is allowed.
     */
    IpProtocol?: String;
    /**
     * [EC2-Classic, default VPC] The name of the source security group. You can't specify this parameter in combination with the following parameters: the CIDR IP address range, the start of the port range, the IP protocol, and the end of the port range. Creates rules that grant full ICMP, UDP, and TCP access. To create a rule with a specific IP protocol and port range, use a set of IP permissions instead. For EC2-VPC, the source security group must be in the same VPC.
     */
    SourceSecurityGroupName?: String;
    /**
     * [EC2-Classic] The AWS account ID for the source security group, if the source security group is in a different account. You can't specify this parameter in combination with the following parameters: the CIDR IP address range, the IP protocol, the start of the port range, and the end of the port range. Creates rules that grant full ICMP, UDP, and TCP access. To create a rule with a specific IP protocol and port range, use a set of IP permissions instead.
     */
    SourceSecurityGroupOwnerId?: String;
    /**
     * The end of port range for the TCP and UDP protocols, or an ICMP/ICMPv6 code number. For the ICMP/ICMPv6 code number, use -1 to specify all codes. If you specify all ICMP/ICMPv6 types, you must specify all codes.
     */
    ToPort?: Integer;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export type AutoPlacement = "on"|"off"|string;
  export interface AvailabilityZone {
    /**
     * The state of the Availability Zone.
     */
    State?: AvailabilityZoneState;
    /**
     * Any messages about the Availability Zone.
     */
    Messages?: AvailabilityZoneMessageList;
    /**
     * The name of the region.
     */
    RegionName?: String;
    /**
     * The name of the Availability Zone.
     */
    ZoneName?: String;
  }
  export type AvailabilityZoneList = AvailabilityZone[];
  export interface AvailabilityZoneMessage {
    /**
     * The message about the Availability Zone.
     */
    Message?: String;
  }
  export type AvailabilityZoneMessageList = AvailabilityZoneMessage[];
  export type AvailabilityZoneState = "available"|"information"|"impaired"|"unavailable"|string;
  export interface AvailableCapacity {
    /**
     * The total number of instances supported by the Dedicated Host.
     */
    AvailableInstanceCapacity?: AvailableInstanceCapacityList;
    /**
     * The number of vCPUs available on the Dedicated Host.
     */
    AvailableVCpus?: Integer;
  }
  export type AvailableInstanceCapacityList = InstanceCapacity[];
  export type BatchState = "submitted"|"active"|"cancelled"|"failed"|"cancelled_running"|"cancelled_terminating"|"modifying"|string;
  export type BillingProductList = String[];
  export type _Blob = Buffer|Uint8Array|Blob|string;
  export interface BlobAttributeValue {
    Value?: _Blob;
  }
  export interface BlockDeviceMapping {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    DeviceName?: String;
    /**
     * The virtual device name (ephemeralN). Instance store volumes are numbered starting from 0. An instance type with 2 available instance store volumes can specify mappings for ephemeral0 and ephemeral1. The number of available instance store volumes depends on the instance type. After you connect to the instance, you must mount the volume. NVMe instance store volumes are automatically enumerated and assigned a device name. Including them in your block device mapping has no effect. Constraints: For M3 instances, you must specify instance store volumes in the block device mapping for the instance. When you launch an M3 instance, we ignore any instance store volumes specified in the block device mapping for the AMI.
     */
    VirtualName?: String;
    /**
     * Parameters used to automatically set up EBS volumes when the instance is launched.
     */
    Ebs?: EbsBlockDevice;
    /**
     * Suppresses the specified device included in the block device mapping of the AMI.
     */
    NoDevice?: String;
  }
  export type BlockDeviceMappingList = BlockDeviceMapping[];
  export type BlockDeviceMappingRequestList = BlockDeviceMapping[];
  export type Boolean = boolean;
  export type BundleIdStringList = String[];
  export interface BundleInstanceRequest {
    /**
     * The ID of the instance to bundle. Type: String Default: None Required: Yes
     */
    InstanceId: String;
    /**
     * The bucket in which to store the AMI. You can specify a bucket that you already own or a new bucket that Amazon EC2 creates on your behalf. If you specify a bucket that belongs to someone else, Amazon EC2 returns an error.
     */
    Storage: Storage;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface BundleInstanceResult {
    /**
     * Information about the bundle task.
     */
    BundleTask?: BundleTask;
  }
  export interface BundleTask {
    /**
     * The ID of the bundle task.
     */
    BundleId?: String;
    /**
     * If the task fails, a description of the error.
     */
    BundleTaskError?: BundleTaskError;
    /**
     * The ID of the instance associated with this bundle task.
     */
    InstanceId?: String;
    /**
     * The level of task completion, as a percent (for example, 20%).
     */
    Progress?: String;
    /**
     * The time this task started.
     */
    StartTime?: DateTime;
    /**
     * The state of the task.
     */
    State?: BundleTaskState;
    /**
     * The Amazon S3 storage locations.
     */
    Storage?: Storage;
    /**
     * The time of the most recent update for the task.
     */
    UpdateTime?: DateTime;
  }
  export interface BundleTaskError {
    /**
     * The error code.
     */
    Code?: String;
    /**
     * The error message.
     */
    Message?: String;
  }
  export type BundleTaskList = BundleTask[];
  export type BundleTaskState = "pending"|"waiting-for-shutdown"|"bundling"|"storing"|"cancelling"|"complete"|"failed"|string;
  export type CancelBatchErrorCode = "fleetRequestIdDoesNotExist"|"fleetRequestIdMalformed"|"fleetRequestNotInCancellableState"|"unexpectedError"|string;
  export interface CancelBundleTaskRequest {
    /**
     * The ID of the bundle task.
     */
    BundleId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CancelBundleTaskResult {
    /**
     * Information about the bundle task.
     */
    BundleTask?: BundleTask;
  }
  export interface CancelConversionRequest {
    /**
     * The ID of the conversion task.
     */
    ConversionTaskId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The reason for canceling the conversion task.
     */
    ReasonMessage?: String;
  }
  export interface CancelExportTaskRequest {
    /**
     * The ID of the export task. This is the ID returned by CreateInstanceExportTask.
     */
    ExportTaskId: String;
  }
  export interface CancelImportTaskRequest {
    /**
     * The reason for canceling the task.
     */
    CancelReason?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the import image or import snapshot task to be canceled.
     */
    ImportTaskId?: String;
  }
  export interface CancelImportTaskResult {
    /**
     * The ID of the task being canceled.
     */
    ImportTaskId?: String;
    /**
     * The current state of the task being canceled.
     */
    PreviousState?: String;
    /**
     * The current state of the task being canceled.
     */
    State?: String;
  }
  export interface CancelReservedInstancesListingRequest {
    /**
     * The ID of the Reserved Instance listing.
     */
    ReservedInstancesListingId: String;
  }
  export interface CancelReservedInstancesListingResult {
    /**
     * The Reserved Instance listing.
     */
    ReservedInstancesListings?: ReservedInstancesListingList;
  }
  export interface CancelSpotFleetRequestsError {
    /**
     * The error code.
     */
    Code: CancelBatchErrorCode;
    /**
     * The description for the error code.
     */
    Message: String;
  }
  export interface CancelSpotFleetRequestsErrorItem {
    /**
     * The error.
     */
    Error: CancelSpotFleetRequestsError;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
  }
  export type CancelSpotFleetRequestsErrorSet = CancelSpotFleetRequestsErrorItem[];
  export interface CancelSpotFleetRequestsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of the Spot Fleet requests.
     */
    SpotFleetRequestIds: ValueStringList;
    /**
     * Indicates whether to terminate instances for a Spot Fleet request if it is canceled successfully.
     */
    TerminateInstances: Boolean;
  }
  export interface CancelSpotFleetRequestsResponse {
    /**
     * Information about the Spot Fleet requests that are successfully canceled.
     */
    SuccessfulFleetRequests?: CancelSpotFleetRequestsSuccessSet;
    /**
     * Information about the Spot Fleet requests that are not successfully canceled.
     */
    UnsuccessfulFleetRequests?: CancelSpotFleetRequestsErrorSet;
  }
  export interface CancelSpotFleetRequestsSuccessItem {
    /**
     * The current state of the Spot Fleet request.
     */
    CurrentSpotFleetRequestState: BatchState;
    /**
     * The previous state of the Spot Fleet request.
     */
    PreviousSpotFleetRequestState: BatchState;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
  }
  export type CancelSpotFleetRequestsSuccessSet = CancelSpotFleetRequestsSuccessItem[];
  export type CancelSpotInstanceRequestState = "active"|"open"|"closed"|"cancelled"|"completed"|string;
  export interface CancelSpotInstanceRequestsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more Spot Instance request IDs.
     */
    SpotInstanceRequestIds: SpotInstanceRequestIdList;
  }
  export interface CancelSpotInstanceRequestsResult {
    /**
     * One or more Spot Instance requests.
     */
    CancelledSpotInstanceRequests?: CancelledSpotInstanceRequestList;
  }
  export interface CancelledSpotInstanceRequest {
    /**
     * The ID of the Spot Instance request.
     */
    SpotInstanceRequestId?: String;
    /**
     * The state of the Spot Instance request.
     */
    State?: CancelSpotInstanceRequestState;
  }
  export type CancelledSpotInstanceRequestList = CancelledSpotInstanceRequest[];
  export interface CidrBlock {
    /**
     * The IPv4 CIDR block.
     */
    CidrBlock?: String;
  }
  export type CidrBlockSet = CidrBlock[];
  export interface ClassicLinkDnsSupport {
    /**
     * Indicates whether ClassicLink DNS support is enabled for the VPC.
     */
    ClassicLinkDnsSupported?: Boolean;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type ClassicLinkDnsSupportList = ClassicLinkDnsSupport[];
  export interface ClassicLinkInstance {
    /**
     * A list of security groups.
     */
    Groups?: GroupIdentifierList;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * Any tags assigned to the instance.
     */
    Tags?: TagList;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type ClassicLinkInstanceList = ClassicLinkInstance[];
  export interface ClassicLoadBalancer {
    /**
     * The name of the load balancer.
     */
    Name: String;
  }
  export type ClassicLoadBalancers = ClassicLoadBalancer[];
  export interface ClassicLoadBalancersConfig {
    /**
     * One or more Classic Load Balancers.
     */
    ClassicLoadBalancers: ClassicLoadBalancers;
  }
  export interface ClientData {
    /**
     * A user-defined comment about the disk upload.
     */
    Comment?: String;
    /**
     * The time that the disk upload ends.
     */
    UploadEnd?: DateTime;
    /**
     * The size of the uploaded disk image, in GiB.
     */
    UploadSize?: Double;
    /**
     * The time that the disk upload starts.
     */
    UploadStart?: DateTime;
  }
  export interface ConfirmProductInstanceRequest {
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * The product code. This must be a product code that you own.
     */
    ProductCode: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ConfirmProductInstanceResult {
    /**
     * The AWS account ID of the instance owner. This is only present if the product code is attached to the instance.
     */
    OwnerId?: String;
    /**
     * The return value of the request. Returns true if the specified product code is owned by the requester and associated with the specified instance.
     */
    Return?: Boolean;
  }
  export interface ConnectionNotification {
    /**
     * The ID of the notification.
     */
    ConnectionNotificationId?: String;
    /**
     * The ID of the endpoint service.
     */
    ServiceId?: String;
    /**
     * The ID of the VPC endpoint.
     */
    VpcEndpointId?: String;
    /**
     * The type of notification.
     */
    ConnectionNotificationType?: ConnectionNotificationType;
    /**
     * The ARN of the SNS topic for the notification.
     */
    ConnectionNotificationArn?: String;
    /**
     * The events for the notification. Valid values are Accept, Connect, Delete, and Reject.
     */
    ConnectionEvents?: ValueStringList;
    /**
     * The state of the notification.
     */
    ConnectionNotificationState?: ConnectionNotificationState;
  }
  export type ConnectionNotificationSet = ConnectionNotification[];
  export type ConnectionNotificationState = "Enabled"|"Disabled"|string;
  export type ConnectionNotificationType = "Topic"|string;
  export type ContainerFormat = "ova"|string;
  export type ConversionIdStringList = String[];
  export interface ConversionTask {
    /**
     * The ID of the conversion task.
     */
    ConversionTaskId?: String;
    /**
     * The time when the task expires. If the upload isn't complete before the expiration time, we automatically cancel the task.
     */
    ExpirationTime?: String;
    /**
     * If the task is for importing an instance, this contains information about the import instance task.
     */
    ImportInstance?: ImportInstanceTaskDetails;
    /**
     * If the task is for importing a volume, this contains information about the import volume task.
     */
    ImportVolume?: ImportVolumeTaskDetails;
    /**
     * The state of the conversion task.
     */
    State?: ConversionTaskState;
    /**
     * The status message related to the conversion task.
     */
    StatusMessage?: String;
    /**
     * Any tags assigned to the task.
     */
    Tags?: TagList;
  }
  export type ConversionTaskState = "active"|"cancelling"|"cancelled"|"completed"|string;
  export interface CopyFpgaImageRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the source AFI.
     */
    SourceFpgaImageId: String;
    /**
     * The description for the new AFI.
     */
    Description?: String;
    /**
     * The name for the new AFI. The default is the name of the source AFI.
     */
    Name?: String;
    /**
     * The region that contains the source AFI.
     */
    SourceRegion: String;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
  }
  export interface CopyFpgaImageResult {
    /**
     * The ID of the new AFI.
     */
    FpgaImageId?: String;
  }
  export interface CopyImageRequest {
    /**
     * Unique, case-sensitive identifier you provide to ensure idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon Elastic Compute Cloud User Guide.
     */
    ClientToken?: String;
    /**
     * A description for the new AMI in the destination region.
     */
    Description?: String;
    /**
     * Specifies whether the destination snapshots of the copied image should be encrypted. You can encrypt a copy of an unencrypted snapshot, but you cannot create an unencrypted copy of an encrypted snapshot. The default CMK for EBS is used unless you specify a non-default AWS Key Management Service (AWS KMS) CMK using KmsKeyId. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide.
     */
    Encrypted?: Boolean;
    /**
     * An identifier for the AWS Key Management Service (AWS KMS) customer master key (CMK) to use when creating the encrypted volume. This parameter is only required if you want to use a non-default CMK; if this parameter is not specified, the default CMK for EBS is used. If a KmsKeyId is specified, the Encrypted flag must also be set.  The CMK identifier may be provided in any of the following formats:    Key ID   Key alias, in the form alias/ExampleAlias     ARN using key ID. The ID ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the key namespace, and then the CMK ID. For example, arn:aws:kms:us-east-1:012345678910:key/abcd1234-a123-456a-a12b-a123b4cd56ef.    ARN using key alias. The alias ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the alias namespace, and then the CMK alias. For example, arn:aws:kms:us-east-1:012345678910:alias/ExampleAlias.    AWS parses KmsKeyId asynchronously, meaning that the action you call may appear to complete even though you provided an invalid identifier. This action will eventually report failure.  The specified CMK must exist in the region that the snapshot is being copied to. 
     */
    KmsKeyId?: String;
    /**
     * The name of the new AMI in the destination region.
     */
    Name: String;
    /**
     * The ID of the AMI to copy.
     */
    SourceImageId: String;
    /**
     * The name of the region that contains the AMI to copy.
     */
    SourceRegion: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CopyImageResult {
    /**
     * The ID of the new AMI.
     */
    ImageId?: String;
  }
  export interface CopySnapshotRequest {
    /**
     * A description for the EBS snapshot.
     */
    Description?: String;
    /**
     * The destination region to use in the PresignedUrl parameter of a snapshot copy operation. This parameter is only valid for specifying the destination region in a PresignedUrl parameter, where it is required. The snapshot copy is sent to the regional endpoint that you sent the HTTP request to (for example, ec2.us-east-1.amazonaws.com). With the AWS CLI, this is specified using the --region parameter or the default region in your AWS configuration file.
     */
    DestinationRegion?: String;
    /**
     * Specifies whether the destination snapshot should be encrypted. You can encrypt a copy of an unencrypted snapshot, but you cannot use it to create an unencrypted copy of an encrypted snapshot. Your default CMK for EBS is used unless you specify a non-default AWS Key Management Service (AWS KMS) CMK using KmsKeyId. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide.
     */
    Encrypted?: Boolean;
    /**
     * An identifier for the AWS Key Management Service (AWS KMS) customer master key (CMK) to use when creating the encrypted volume. This parameter is only required if you want to use a non-default CMK; if this parameter is not specified, the default CMK for EBS is used. If a KmsKeyId is specified, the Encrypted flag must also be set.  The CMK identifier may be provided in any of the following formats:    Key ID   Key alias   ARN using key ID. The ID ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the key namespace, and then the CMK ID. For example, arn:aws:kms:us-east-1:012345678910:key/abcd1234-a123-456a-a12b-a123b4cd56ef.    ARN using key alias. The alias ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the alias namespace, and then the CMK alias. For example, arn:aws:kms:us-east-1:012345678910:alias/ExampleAlias.    AWS parses KmsKeyId asynchronously, meaning that the action you call may appear to complete even though you provided an invalid identifier. The action will eventually fail. 
     */
    KmsKeyId?: String;
    /**
     * When you copy an encrypted source snapshot using the Amazon EC2 Query API, you must supply a pre-signed URL. This parameter is optional for unencrypted snapshots. For more information, see Query Requests. The PresignedUrl should use the snapshot source endpoint, the CopySnapshot action, and include the SourceRegion, SourceSnapshotId, and DestinationRegion parameters. The PresignedUrl must be signed using AWS Signature Version 4. Because EBS snapshots are stored in Amazon S3, the signing algorithm for this parameter uses the same logic that is described in Authenticating Requests by Using Query Parameters (AWS Signature Version 4) in the Amazon Simple Storage Service API Reference. An invalid or improperly signed PresignedUrl will cause the copy operation to fail asynchronously, and the snapshot will move to an error state.
     */
    PresignedUrl?: String;
    /**
     * The ID of the region that contains the snapshot to be copied.
     */
    SourceRegion: String;
    /**
     * The ID of the EBS snapshot to copy.
     */
    SourceSnapshotId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CopySnapshotResult {
    /**
     * The ID of the new snapshot.
     */
    SnapshotId?: String;
  }
  export interface CpuOptions {
    /**
     * The number of CPU cores for the instance.
     */
    CoreCount?: Integer;
    /**
     * The number of threads per CPU core.
     */
    ThreadsPerCore?: Integer;
  }
  export interface CpuOptionsRequest {
    /**
     * The number of CPU cores for the instance.
     */
    CoreCount?: Integer;
    /**
     * The number of threads per CPU core. To disable Intel Hyper-Threading Technology for the instance, specify a value of 1. Otherwise, specify the default value of 2.
     */
    ThreadsPerCore?: Integer;
  }
  export interface CreateCustomerGatewayRequest {
    /**
     * For devices that support BGP, the customer gateway's BGP ASN. Default: 65000
     */
    BgpAsn: Integer;
    /**
     * The Internet-routable IP address for the customer gateway's outside interface. The address must be static.
     */
    PublicIp: String;
    /**
     * The type of VPN connection that this customer gateway supports (ipsec.1).
     */
    Type: GatewayType;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateCustomerGatewayResult {
    /**
     * Information about the customer gateway.
     */
    CustomerGateway?: CustomerGateway;
  }
  export interface CreateDefaultSubnetRequest {
    /**
     * The Availability Zone in which to create the default subnet.
     */
    AvailabilityZone: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateDefaultSubnetResult {
    /**
     * Information about the subnet.
     */
    Subnet?: Subnet;
  }
  export interface CreateDefaultVpcRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateDefaultVpcResult {
    /**
     * Information about the VPC.
     */
    Vpc?: Vpc;
  }
  export interface CreateDhcpOptionsRequest {
    /**
     * A DHCP configuration option.
     */
    DhcpConfigurations: NewDhcpConfigurationList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateDhcpOptionsResult {
    /**
     * A set of DHCP options.
     */
    DhcpOptions?: DhcpOptions;
  }
  export interface CreateEgressOnlyInternetGatewayRequest {
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency.
     */
    ClientToken?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC for which to create the egress-only internet gateway.
     */
    VpcId: String;
  }
  export interface CreateEgressOnlyInternetGatewayResult {
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.
     */
    ClientToken?: String;
    /**
     * Information about the egress-only internet gateway.
     */
    EgressOnlyInternetGateway?: EgressOnlyInternetGateway;
  }
  export interface CreateFleetRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * Describes the configuration of Spot Instances in an EC2 Fleet.
     */
    SpotOptions?: SpotOptionsRequest;
    /**
     * The allocation strategy of On-Demand Instances in an EC2 Fleet.
     */
    OnDemandOptions?: OnDemandOptionsRequest;
    /**
     * Indicates whether running instances should be terminated if the total target capacity of the EC2 Fleet is decreased below the current size of the EC2 Fleet.
     */
    ExcessCapacityTerminationPolicy?: FleetExcessCapacityTerminationPolicy;
    /**
     * The configuration for the EC2 Fleet.
     */
    LaunchTemplateConfigs: FleetLaunchTemplateConfigListRequest;
    /**
     * The TotalTargetCapacity, OnDemandTargetCapacity, SpotTargetCapacity, and DefaultCapacityType structure.
     */
    TargetCapacitySpecification: TargetCapacitySpecificationRequest;
    /**
     * Indicates whether running instances should be terminated when the EC2 Fleet expires.
     */
    TerminateInstancesWithExpiration?: Boolean;
    /**
     * The type of request. Indicates whether the EC2 Fleet only requests the target capacity, or also attempts to maintain it. If you request a certain target capacity, EC2 Fleet only places the required requests. It does not attempt to replenish instances if capacity is diminished, and does not submit requests in alternative capacity pools if capacity is unavailable. To maintain a certain target capacity, EC2 Fleet places the required requests to meet this target capacity. It also automatically replenishes any interrupted Spot Instances. Default: maintain.
     */
    Type?: FleetType;
    /**
     * The start date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). The default is to start fulfilling the request immediately.
     */
    ValidFrom?: DateTime;
    /**
     * The end date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). At this point, no new EC2 Fleet requests are placed or able to fulfill the request. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * Indicates whether EC2 Fleet should replace unhealthy instances.
     */
    ReplaceUnhealthyInstances?: Boolean;
    /**
     * The key-value pair for tagging the EC2 Fleet request on creation. The value for ResourceType must be fleet, otherwise the fleet request fails. To tag instances at launch, specify the tags in the launch template. For information about tagging after launch, see Tagging Your Resources. 
     */
    TagSpecifications?: TagSpecificationList;
  }
  export interface CreateFleetResult {
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId?: FleetIdentifier;
  }
  export interface CreateFlowLogsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency.
     */
    ClientToken?: String;
    /**
     * The ARN for the IAM role that's used to post flow logs to a log group.
     */
    DeliverLogsPermissionArn?: String;
    /**
     * The name of the log group.
     */
    LogGroupName?: String;
    /**
     * One or more subnet, network interface, or VPC IDs. Constraints: Maximum of 1000 resources
     */
    ResourceIds: ValueStringList;
    /**
     * The type of resource on which to create the flow log.
     */
    ResourceType: FlowLogsResourceType;
    /**
     * The type of traffic to log.
     */
    TrafficType: TrafficType;
    /**
     * Specifies the type of destination to which the flow log data is to be published. Flow log data can be published to CloudWatch Logs or Amazon S3. To publish flow log data to CloudWatch Logs, specify cloud-watch-logs. To publish flow log data to Amazon S3, specify s3. Default: cloud-watch-logs 
     */
    LogDestinationType?: LogDestinationType;
    /**
     * Specifies the destination to which the flow log data is to be published. Flow log data can be published to an CloudWatch Logs log group or an Amazon S3 bucket. The value specified for this parameter depends on the value specified for LogDestinationType. If LogDestinationType is not specified or cloud-watch-logs, specify the Amazon Resource Name (ARN) of the CloudWatch Logs log group. If LogDestinationType is s3, specify the ARN of the Amazon S3 bucket. You can also specify a subfolder in the bucket. To specify a subfolder in the bucket, use the following ARN format: bucket_ARN/subfolder_name/. For example, to specify a subfolder named my-logs in a bucket named my-bucket, use the following ARN: arn:aws:s3:::my-bucket/my-logs/. You cannot use AWSLogs as a subfolder name. This is a reserved term.
     */
    LogDestination?: String;
  }
  export interface CreateFlowLogsResult {
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request.
     */
    ClientToken?: String;
    /**
     * The IDs of the flow logs.
     */
    FlowLogIds?: ValueStringList;
    /**
     * Information about the flow logs that could not be created successfully.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface CreateFpgaImageRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The location of the encrypted design checkpoint in Amazon S3. The input must be a tarball.
     */
    InputStorageLocation: StorageLocation;
    /**
     * The location in Amazon S3 for the output logs.
     */
    LogsStorageLocation?: StorageLocation;
    /**
     * A description for the AFI.
     */
    Description?: String;
    /**
     * A name for the AFI.
     */
    Name?: String;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
  }
  export interface CreateFpgaImageResult {
    /**
     * The FPGA image identifier (AFI ID).
     */
    FpgaImageId?: String;
    /**
     * The global FPGA image identifier (AGFI ID).
     */
    FpgaImageGlobalId?: String;
  }
  export interface CreateImageRequest {
    /**
     * Information about one or more block device mappings. This parameter cannot be used to modify the encryption status of existing volumes or snapshots. To create an AMI with encrypted snapshots, use the CopyImage action.
     */
    BlockDeviceMappings?: BlockDeviceMappingRequestList;
    /**
     * A description for the new image.
     */
    Description?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * A name for the new image. Constraints: 3-128 alphanumeric characters, parentheses (()), square brackets ([]), spaces ( ), periods (.), slashes (/), dashes (-), single quotes ('), at-signs (@), or underscores(_)
     */
    Name: String;
    /**
     * By default, Amazon EC2 attempts to shut down and reboot the instance before creating the image. If the 'No Reboot' option is set, Amazon EC2 doesn't shut down the instance before creating the image. When this option is used, file system integrity on the created image can't be guaranteed.
     */
    NoReboot?: Boolean;
  }
  export interface CreateImageResult {
    /**
     * The ID of the new AMI.
     */
    ImageId?: String;
  }
  export interface CreateInstanceExportTaskRequest {
    /**
     * A description for the conversion task or the resource being exported. The maximum length is 255 bytes.
     */
    Description?: String;
    /**
     * The format and location for an instance export task.
     */
    ExportToS3Task?: ExportToS3TaskSpecification;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * The target virtualization environment.
     */
    TargetEnvironment?: ExportEnvironment;
  }
  export interface CreateInstanceExportTaskResult {
    /**
     * Information about the instance export task.
     */
    ExportTask?: ExportTask;
  }
  export interface CreateInternetGatewayRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateInternetGatewayResult {
    /**
     * Information about the internet gateway.
     */
    InternetGateway?: InternetGateway;
  }
  export interface CreateKeyPairRequest {
    /**
     * A unique name for the key pair. Constraints: Up to 255 ASCII characters
     */
    KeyName: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateLaunchTemplateRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * A name for the launch template.
     */
    LaunchTemplateName: LaunchTemplateName;
    /**
     * A description for the first version of the launch template.
     */
    VersionDescription?: VersionDescription;
    /**
     * The information for the launch template.
     */
    LaunchTemplateData: RequestLaunchTemplateData;
  }
  export interface CreateLaunchTemplateResult {
    /**
     * Information about the launch template.
     */
    LaunchTemplate?: LaunchTemplate;
  }
  export interface CreateLaunchTemplateVersionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * The ID of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version number of the launch template version on which to base the new version. The new version inherits the same launch parameters as the source version, except for parameters that you specify in LaunchTemplateData.
     */
    SourceVersion?: String;
    /**
     * A description for the version of the launch template.
     */
    VersionDescription?: VersionDescription;
    /**
     * The information for the launch template.
     */
    LaunchTemplateData: RequestLaunchTemplateData;
  }
  export interface CreateLaunchTemplateVersionResult {
    /**
     * Information about the launch template version.
     */
    LaunchTemplateVersion?: LaunchTemplateVersion;
  }
  export interface CreateNatGatewayRequest {
    /**
     * The allocation ID of an Elastic IP address to associate with the NAT gateway. If the Elastic IP address is associated with another resource, you must first disassociate it.
     */
    AllocationId: String;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency. Constraint: Maximum 64 ASCII characters.
     */
    ClientToken?: String;
    /**
     * The subnet in which to create the NAT gateway.
     */
    SubnetId: String;
  }
  export interface CreateNatGatewayResult {
    /**
     * Unique, case-sensitive identifier to ensure the idempotency of the request. Only returned if a client token was provided in the request.
     */
    ClientToken?: String;
    /**
     * Information about the NAT gateway.
     */
    NatGateway?: NatGateway;
  }
  export interface CreateNetworkAclEntryRequest {
    /**
     * The IPv4 network range to allow or deny, in CIDR notation (for example 172.16.0.0/24).
     */
    CidrBlock?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicates whether this is an egress rule (rule is applied to traffic leaving the subnet).
     */
    Egress: Boolean;
    /**
     * ICMP protocol: The ICMP or ICMPv6 type and code. Required if specifying the ICMP protocol, or protocol 58 (ICMPv6) with an IPv6 CIDR block.
     */
    IcmpTypeCode?: IcmpTypeCode;
    /**
     * The IPv6 network range to allow or deny, in CIDR notation (for example 2001:db8:1234:1a00::/64).
     */
    Ipv6CidrBlock?: String;
    /**
     * The ID of the network ACL.
     */
    NetworkAclId: String;
    /**
     * TCP or UDP protocols: The range of ports the rule applies to.
     */
    PortRange?: PortRange;
    /**
     * The protocol. A value of -1 or all means all protocols. If you specify all, -1, or a protocol number other than 6 (tcp), 17 (udp), or 1 (icmp), traffic on all ports is allowed, regardless of any ports or ICMP types or codes that you specify. If you specify protocol 58 (ICMPv6) and specify an IPv4 CIDR block, traffic for all ICMP types and codes allowed, regardless of any that you specify. If you specify protocol 58 (ICMPv6) and specify an IPv6 CIDR block, you must specify an ICMP type and code.
     */
    Protocol: String;
    /**
     * Indicates whether to allow or deny the traffic that matches the rule.
     */
    RuleAction: RuleAction;
    /**
     * The rule number for the entry (for example, 100). ACL entries are processed in ascending order by rule number. Constraints: Positive integer from 1 to 32766. The range 32767 to 65535 is reserved for internal use.
     */
    RuleNumber: Integer;
  }
  export interface CreateNetworkAclRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface CreateNetworkAclResult {
    /**
     * Information about the network ACL.
     */
    NetworkAcl?: NetworkAcl;
  }
  export interface CreateNetworkInterfacePermissionRequest {
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
    /**
     * The AWS account ID.
     */
    AwsAccountId?: String;
    /**
     * The AWS service. Currently not supported.
     */
    AwsService?: String;
    /**
     * The type of permission to grant.
     */
    Permission: InterfacePermissionType;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateNetworkInterfacePermissionResult {
    /**
     * Information about the permission for the network interface.
     */
    InterfacePermission?: NetworkInterfacePermission;
  }
  export interface CreateNetworkInterfaceRequest {
    /**
     * A description for the network interface.
     */
    Description?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of one or more security groups.
     */
    Groups?: SecurityGroupIdStringList;
    /**
     * The number of IPv6 addresses to assign to a network interface. Amazon EC2 automatically selects the IPv6 addresses from the subnet range. You can't use this option if specifying specific IPv6 addresses. If your subnet has the AssignIpv6AddressOnCreation attribute set to true, you can specify 0 to override this setting.
     */
    Ipv6AddressCount?: Integer;
    /**
     * One or more specific IPv6 addresses from the IPv6 CIDR block range of your subnet. You can't use this option if you're specifying a number of IPv6 addresses.
     */
    Ipv6Addresses?: InstanceIpv6AddressList;
    /**
     * The primary private IPv4 address of the network interface. If you don't specify an IPv4 address, Amazon EC2 selects one for you from the subnet's IPv4 CIDR range. If you specify an IP address, you cannot indicate any IP addresses specified in privateIpAddresses as primary (only one IP address can be designated as primary).
     */
    PrivateIpAddress?: String;
    /**
     * One or more private IPv4 addresses.
     */
    PrivateIpAddresses?: PrivateIpAddressSpecificationList;
    /**
     * The number of secondary private IPv4 addresses to assign to a network interface. When you specify a number of secondary IPv4 addresses, Amazon EC2 selects these IP addresses within the subnet's IPv4 CIDR range. You can't specify this option and specify more than one private IP address using privateIpAddresses. The number of IP addresses you can assign to a network interface varies by instance type. For more information, see IP Addresses Per ENI Per Instance Type in the Amazon Virtual Private Cloud User Guide.
     */
    SecondaryPrivateIpAddressCount?: Integer;
    /**
     * The ID of the subnet to associate with the network interface.
     */
    SubnetId: String;
  }
  export interface CreateNetworkInterfaceResult {
    /**
     * Information about the network interface.
     */
    NetworkInterface?: NetworkInterface;
  }
  export interface CreatePlacementGroupRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * A name for the placement group. Must be unique within the scope of your account for the region. Constraints: Up to 255 ASCII characters
     */
    GroupName: String;
    /**
     * The placement strategy.
     */
    Strategy: PlacementStrategy;
  }
  export interface CreateReservedInstancesListingRequest {
    /**
     * Unique, case-sensitive identifier you provide to ensure idempotency of your listings. This helps avoid duplicate listings. For more information, see Ensuring Idempotency.
     */
    ClientToken: String;
    /**
     * The number of instances that are a part of a Reserved Instance account to be listed in the Reserved Instance Marketplace. This number should be less than or equal to the instance count associated with the Reserved Instance ID specified in this call.
     */
    InstanceCount: Integer;
    /**
     * A list specifying the price of the Standard Reserved Instance for each month remaining in the Reserved Instance term.
     */
    PriceSchedules: PriceScheduleSpecificationList;
    /**
     * The ID of the active Standard Reserved Instance.
     */
    ReservedInstancesId: String;
  }
  export interface CreateReservedInstancesListingResult {
    /**
     * Information about the Standard Reserved Instance listing.
     */
    ReservedInstancesListings?: ReservedInstancesListingList;
  }
  export interface CreateRouteRequest {
    /**
     * The IPv4 CIDR address block used for the destination match. Routing decisions are based on the most specific match.
     */
    DestinationCidrBlock?: String;
    /**
     * The IPv6 CIDR block used for the destination match. Routing decisions are based on the most specific match.
     */
    DestinationIpv6CidrBlock?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * [IPv6 traffic only] The ID of an egress-only internet gateway.
     */
    EgressOnlyInternetGatewayId?: String;
    /**
     * The ID of an internet gateway or virtual private gateway attached to your VPC.
     */
    GatewayId?: String;
    /**
     * The ID of a NAT instance in your VPC. The operation fails if you specify an instance ID unless exactly one network interface is attached.
     */
    InstanceId?: String;
    /**
     * [IPv4 traffic only] The ID of a NAT gateway.
     */
    NatGatewayId?: String;
    /**
     * The ID of a network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The ID of the route table for the route.
     */
    RouteTableId: String;
    /**
     * The ID of a VPC peering connection.
     */
    VpcPeeringConnectionId?: String;
  }
  export interface CreateRouteResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface CreateRouteTableRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface CreateRouteTableResult {
    /**
     * Information about the route table.
     */
    RouteTable?: RouteTable;
  }
  export interface CreateSecurityGroupRequest {
    /**
     * A description for the security group. This is informational only. Constraints: Up to 255 characters in length Constraints for EC2-Classic: ASCII characters Constraints for EC2-VPC: a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=&amp;;{}!$*
     */
    Description: String;
    /**
     * The name of the security group. Constraints: Up to 255 characters in length. Cannot start with sg-. Constraints for EC2-Classic: ASCII characters Constraints for EC2-VPC: a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=&amp;;{}!$*
     */
    GroupName: String;
    /**
     * [EC2-VPC] The ID of the VPC. Required for EC2-VPC.
     */
    VpcId?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateSecurityGroupResult {
    /**
     * The ID of the security group.
     */
    GroupId?: String;
  }
  export interface CreateSnapshotRequest {
    /**
     * A description for the snapshot.
     */
    Description?: String;
    /**
     * The ID of the EBS volume.
     */
    VolumeId: String;
    /**
     * The tags to apply to the snapshot during creation.
     */
    TagSpecifications?: TagSpecificationList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateSpotDatafeedSubscriptionRequest {
    /**
     * The Amazon S3 bucket in which to store the Spot Instance data feed.
     */
    Bucket: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * A prefix for the data feed file names.
     */
    Prefix?: String;
  }
  export interface CreateSpotDatafeedSubscriptionResult {
    /**
     * The Spot Instance data feed subscription.
     */
    SpotDatafeedSubscription?: SpotDatafeedSubscription;
  }
  export interface CreateSubnetRequest {
    /**
     * The Availability Zone for the subnet. Default: AWS selects one for you. If you create more than one subnet in your VPC, we may not necessarily select a different zone for each subnet.
     */
    AvailabilityZone?: String;
    /**
     * The IPv4 network range for the subnet, in CIDR notation. For example, 10.0.0.0/24.
     */
    CidrBlock: String;
    /**
     * The IPv6 network range for the subnet, in CIDR notation. The subnet size must use a /64 prefix length.
     */
    Ipv6CidrBlock?: String;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateSubnetResult {
    /**
     * Information about the subnet.
     */
    Subnet?: Subnet;
  }
  export interface CreateTagsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of one or more resources to tag. For example, ami-1a2b3c4d.
     */
    Resources: ResourceIdList;
    /**
     * One or more tags. The value parameter is required, but if you don't want the tag to have a value, specify the parameter with no value, and we set the value to an empty string. 
     */
    Tags: TagList;
  }
  export interface CreateVolumePermission {
    /**
     * The specific group that is to be added or removed from a volume's list of create volume permissions.
     */
    Group?: PermissionGroup;
    /**
     * The specific AWS account ID that is to be added or removed from a volume's list of create volume permissions.
     */
    UserId?: String;
  }
  export type CreateVolumePermissionList = CreateVolumePermission[];
  export interface CreateVolumePermissionModifications {
    /**
     * Adds a specific AWS account ID or group to a volume's list of create volume permissions.
     */
    Add?: CreateVolumePermissionList;
    /**
     * Removes a specific AWS account ID or group from a volume's list of create volume permissions.
     */
    Remove?: CreateVolumePermissionList;
  }
  export interface CreateVolumeRequest {
    /**
     * The Availability Zone in which to create the volume. Use DescribeAvailabilityZones to list the Availability Zones that are currently available to you.
     */
    AvailabilityZone: String;
    /**
     * Specifies whether the volume should be encrypted. Encrypted Amazon EBS volumes may only be attached to instances that support Amazon EBS encryption. Volumes that are created from encrypted snapshots are automatically encrypted. There is no way to create an encrypted volume from an unencrypted snapshot or vice versa. If your AMI uses encrypted volumes, you can only launch it on supported instance types. For more information, see Amazon EBS Encryption in the Amazon Elastic Compute Cloud User Guide.
     */
    Encrypted?: Boolean;
    /**
     * The number of I/O operations per second (IOPS) to provision for the volume, with a maximum ratio of 50 IOPS/GiB. Range is 100 to 32000 IOPS for volumes in most regions. For exceptions, see Amazon EBS Volume Types in the Amazon Elastic Compute Cloud User Guide. This parameter is valid only for Provisioned IOPS SSD (io1) volumes.
     */
    Iops?: Integer;
    /**
     * An identifier for the AWS Key Management Service (AWS KMS) customer master key (CMK) to use when creating the encrypted volume. This parameter is only required if you want to use a non-default CMK; if this parameter is not specified, the default CMK for EBS is used. If a KmsKeyId is specified, the Encrypted flag must also be set.  The CMK identifier may be provided in any of the following formats:    Key ID   Key alias   ARN using key ID. The ID ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the key namespace, and then the CMK ID. For example, arn:aws:kms:us-east-1:012345678910:key/abcd1234-a123-456a-a12b-a123b4cd56ef.    ARN using key alias. The alias ARN contains the arn:aws:kms namespace, followed by the region of the CMK, the AWS account ID of the CMK owner, the alias namespace, and then the CMK alias. For example, arn:aws:kms:us-east-1:012345678910:alias/ExampleAlias.    AWS parses KmsKeyId asynchronously, meaning that the action you call may appear to complete even though you provided an invalid identifier. The action will eventually fail. 
     */
    KmsKeyId?: String;
    /**
     * The size of the volume, in GiBs. Constraints: 1-16384 for gp2, 4-16384 for io1, 500-16384 for st1, 500-16384 for sc1, and 1-1024 for standard. If you specify a snapshot, the volume size must be equal to or larger than the snapshot size. Default: If you're creating the volume from a snapshot and don't specify a volume size, the default is the snapshot size.
     */
    Size?: Integer;
    /**
     * The snapshot from which to create the volume.
     */
    SnapshotId?: String;
    /**
     * The volume type. This can be gp2 for General Purpose SSD, io1 for Provisioned IOPS SSD, st1 for Throughput Optimized HDD, sc1 for Cold HDD, or standard for Magnetic volumes. Defaults: If no volume type is specified, the default is standard in us-east-1, eu-west-1, eu-central-1, us-west-2, us-west-1, sa-east-1, ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2, ap-south-1, us-gov-west-1, and cn-north-1. In all other regions, EBS defaults to gp2.
     */
    VolumeType?: VolumeType;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The tags to apply to the volume during creation.
     */
    TagSpecifications?: TagSpecificationList;
  }
  export interface CreateVpcEndpointConnectionNotificationRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the endpoint service.
     */
    ServiceId?: String;
    /**
     * The ID of the endpoint. 
     */
    VpcEndpointId?: String;
    /**
     * The ARN of the SNS topic for the notifications.
     */
    ConnectionNotificationArn: String;
    /**
     * One or more endpoint events for which to receive notifications. Valid values are Accept, Connect, Delete, and Reject.
     */
    ConnectionEvents: ValueStringList;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency.
     */
    ClientToken?: String;
  }
  export interface CreateVpcEndpointConnectionNotificationResult {
    /**
     * Information about the notification.
     */
    ConnectionNotification?: ConnectionNotification;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request.
     */
    ClientToken?: String;
  }
  export interface CreateVpcEndpointRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The type of endpoint. Default: Gateway
     */
    VpcEndpointType?: VpcEndpointType;
    /**
     * The ID of the VPC in which the endpoint will be used.
     */
    VpcId: String;
    /**
     * The service name. To get a list of available services, use the DescribeVpcEndpointServices request, or get the name from the service provider.
     */
    ServiceName: String;
    /**
     * (Gateway endpoint) A policy to attach to the endpoint that controls access to the service. The policy must be in valid JSON format. If this parameter is not specified, we attach a default policy that allows full access to the service.
     */
    PolicyDocument?: String;
    /**
     * (Gateway endpoint) One or more route table IDs.
     */
    RouteTableIds?: ValueStringList;
    /**
     * (Interface endpoint) The ID of one or more subnets in which to create an endpoint network interface.
     */
    SubnetIds?: ValueStringList;
    /**
     * (Interface endpoint) The ID of one or more security groups to associate with the endpoint network interface.
     */
    SecurityGroupIds?: ValueStringList;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency.
     */
    ClientToken?: String;
    /**
     * (Interface endpoint) Indicate whether to associate a private hosted zone with the specified VPC. The private hosted zone contains a record set for the default public DNS name for the service for the region (for example, kinesis.us-east-1.amazonaws.com) which resolves to the private IP addresses of the endpoint network interfaces in the VPC. This enables you to make requests to the default public DNS name for the service instead of the public DNS names that are automatically generated by the VPC endpoint service. To use a private hosted zone, you must set the following VPC attributes to true: enableDnsHostnames and enableDnsSupport. Use ModifyVpcAttribute to set the VPC attributes. Default: false 
     */
    PrivateDnsEnabled?: Boolean;
  }
  export interface CreateVpcEndpointResult {
    /**
     * Information about the endpoint.
     */
    VpcEndpoint?: VpcEndpoint;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request.
     */
    ClientToken?: String;
  }
  export interface CreateVpcEndpointServiceConfigurationRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicate whether requests from service consumers to create an endpoint to your service must be accepted. To accept a request, use AcceptVpcEndpointConnections.
     */
    AcceptanceRequired?: Boolean;
    /**
     * The Amazon Resource Names (ARNs) of one or more Network Load Balancers for your service.
     */
    NetworkLoadBalancerArns: ValueStringList;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency.
     */
    ClientToken?: String;
  }
  export interface CreateVpcEndpointServiceConfigurationResult {
    /**
     * Information about the service configuration.
     */
    ServiceConfiguration?: ServiceConfiguration;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request.
     */
    ClientToken?: String;
  }
  export interface CreateVpcPeeringConnectionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The AWS account ID of the owner of the accepter VPC. Default: Your AWS account ID
     */
    PeerOwnerId?: String;
    /**
     * The ID of the VPC with which you are creating the VPC peering connection. You must specify this parameter in the request.
     */
    PeerVpcId?: String;
    /**
     * The ID of the requester VPC. You must specify this parameter in the request.
     */
    VpcId?: String;
    /**
     * The region code for the accepter VPC, if the accepter VPC is located in a region other than the region in which you make the request. Default: The region in which you make the request.
     */
    PeerRegion?: String;
  }
  export interface CreateVpcPeeringConnectionResult {
    /**
     * Information about the VPC peering connection.
     */
    VpcPeeringConnection?: VpcPeeringConnection;
  }
  export interface CreateVpcRequest {
    /**
     * The IPv4 network range for the VPC, in CIDR notation. For example, 10.0.0.0/16.
     */
    CidrBlock: String;
    /**
     * Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC. You cannot specify the range of IP addresses, or the size of the CIDR block.
     */
    AmazonProvidedIpv6CidrBlock?: Boolean;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The tenancy options for instances launched into the VPC. For default, instances are launched with shared tenancy by default. You can launch instances with any tenancy into a shared tenancy VPC. For dedicated, instances are launched as dedicated tenancy instances by default. You can only launch instances with a tenancy of dedicated or host into a dedicated tenancy VPC.   Important: The host value cannot be used with this parameter. Use the default or dedicated values only. Default: default 
     */
    InstanceTenancy?: Tenancy;
  }
  export interface CreateVpcResult {
    /**
     * Information about the VPC.
     */
    Vpc?: Vpc;
  }
  export interface CreateVpnConnectionRequest {
    /**
     * The ID of the customer gateway.
     */
    CustomerGatewayId: String;
    /**
     * The type of VPN connection (ipsec.1).
     */
    Type: String;
    /**
     * The ID of the virtual private gateway.
     */
    VpnGatewayId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The options for the VPN connection.
     */
    Options?: VpnConnectionOptionsSpecification;
  }
  export interface CreateVpnConnectionResult {
    /**
     * Information about the VPN connection.
     */
    VpnConnection?: VpnConnection;
  }
  export interface CreateVpnConnectionRouteRequest {
    /**
     * The CIDR block associated with the local subnet of the customer network.
     */
    DestinationCidrBlock: String;
    /**
     * The ID of the VPN connection.
     */
    VpnConnectionId: String;
  }
  export interface CreateVpnGatewayRequest {
    /**
     * The Availability Zone for the virtual private gateway.
     */
    AvailabilityZone?: String;
    /**
     * The type of VPN connection this virtual private gateway supports.
     */
    Type: GatewayType;
    /**
     * A private Autonomous System Number (ASN) for the Amazon side of a BGP session. If you're using a 16-bit ASN, it must be in the 64512 to 65534 range. If you're using a 32-bit ASN, it must be in the 4200000000 to 4294967294 range. Default: 64512
     */
    AmazonSideAsn?: Long;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface CreateVpnGatewayResult {
    /**
     * Information about the virtual private gateway.
     */
    VpnGateway?: VpnGateway;
  }
  export interface CreditSpecification {
    /**
     * The credit option for CPU usage of a T2 or T3 instance. Valid values are standard and unlimited.
     */
    CpuCredits?: String;
  }
  export interface CreditSpecificationRequest {
    /**
     * The credit option for CPU usage of a T2 or T3 instance. Valid values are standard and unlimited.
     */
    CpuCredits: String;
  }
  export type CurrencyCodeValues = "USD"|string;
  export interface CustomerGateway {
    /**
     * The customer gateway's Border Gateway Protocol (BGP) Autonomous System Number (ASN).
     */
    BgpAsn?: String;
    /**
     * The ID of the customer gateway.
     */
    CustomerGatewayId?: String;
    /**
     * The Internet-routable IP address of the customer gateway's outside interface.
     */
    IpAddress?: String;
    /**
     * The current state of the customer gateway (pending | available | deleting | deleted).
     */
    State?: String;
    /**
     * The type of VPN connection the customer gateway supports (ipsec.1).
     */
    Type?: String;
    /**
     * Any tags assigned to the customer gateway.
     */
    Tags?: TagList;
  }
  export type CustomerGatewayIdStringList = String[];
  export type CustomerGatewayList = CustomerGateway[];
  export type DatafeedSubscriptionState = "Active"|"Inactive"|string;
  export type DateTime = Date;
  export type DefaultTargetCapacityType = "spot"|"on-demand"|string;
  export interface DeleteCustomerGatewayRequest {
    /**
     * The ID of the customer gateway.
     */
    CustomerGatewayId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteDhcpOptionsRequest {
    /**
     * The ID of the DHCP options set.
     */
    DhcpOptionsId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteEgressOnlyInternetGatewayRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the egress-only internet gateway.
     */
    EgressOnlyInternetGatewayId: EgressOnlyInternetGatewayId;
  }
  export interface DeleteEgressOnlyInternetGatewayResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    ReturnCode?: Boolean;
  }
  export interface DeleteFleetError {
    /**
     * The error code.
     */
    Code?: DeleteFleetErrorCode;
    /**
     * The description for the error code.
     */
    Message?: String;
  }
  export type DeleteFleetErrorCode = "fleetIdDoesNotExist"|"fleetIdMalformed"|"fleetNotInDeletableState"|"unexpectedError"|string;
  export interface DeleteFleetErrorItem {
    /**
     * The error.
     */
    Error?: DeleteFleetError;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId?: FleetIdentifier;
  }
  export type DeleteFleetErrorSet = DeleteFleetErrorItem[];
  export interface DeleteFleetSuccessItem {
    /**
     * The current state of the EC2 Fleet.
     */
    CurrentFleetState?: FleetStateCode;
    /**
     * The previous state of the EC2 Fleet.
     */
    PreviousFleetState?: FleetStateCode;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId?: FleetIdentifier;
  }
  export type DeleteFleetSuccessSet = DeleteFleetSuccessItem[];
  export interface DeleteFleetsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of the EC2 Fleets.
     */
    FleetIds: FleetIdSet;
    /**
     * Indicates whether to terminate instances for an EC2 Fleet if it is deleted successfully.
     */
    TerminateInstances: Boolean;
  }
  export interface DeleteFleetsResult {
    /**
     * Information about the EC2 Fleets that are successfully deleted.
     */
    SuccessfulFleetDeletions?: DeleteFleetSuccessSet;
    /**
     * Information about the EC2 Fleets that are not successfully deleted.
     */
    UnsuccessfulFleetDeletions?: DeleteFleetErrorSet;
  }
  export interface DeleteFlowLogsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more flow log IDs.
     */
    FlowLogIds: ValueStringList;
  }
  export interface DeleteFlowLogsResult {
    /**
     * Information about the flow logs that could not be deleted successfully.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface DeleteFpgaImageRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the AFI.
     */
    FpgaImageId: String;
  }
  export interface DeleteFpgaImageResult {
    /**
     * Is true if the request succeeds, and an error otherwise.
     */
    Return?: Boolean;
  }
  export interface DeleteInternetGatewayRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the internet gateway.
     */
    InternetGatewayId: String;
  }
  export interface DeleteKeyPairRequest {
    /**
     * The name of the key pair.
     */
    KeyName: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteLaunchTemplateRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateName?: LaunchTemplateName;
  }
  export interface DeleteLaunchTemplateResult {
    /**
     * Information about the launch template.
     */
    LaunchTemplate?: LaunchTemplate;
  }
  export interface DeleteLaunchTemplateVersionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version numbers of one or more launch template versions to delete.
     */
    Versions: VersionStringList;
  }
  export interface DeleteLaunchTemplateVersionsResponseErrorItem {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: String;
    /**
     * The version number of the launch template.
     */
    VersionNumber?: Long;
    /**
     * Information about the error.
     */
    ResponseError?: ResponseError;
  }
  export type DeleteLaunchTemplateVersionsResponseErrorSet = DeleteLaunchTemplateVersionsResponseErrorItem[];
  export interface DeleteLaunchTemplateVersionsResponseSuccessItem {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: String;
    /**
     * The version number of the launch template.
     */
    VersionNumber?: Long;
  }
  export type DeleteLaunchTemplateVersionsResponseSuccessSet = DeleteLaunchTemplateVersionsResponseSuccessItem[];
  export interface DeleteLaunchTemplateVersionsResult {
    /**
     * Information about the launch template versions that were successfully deleted.
     */
    SuccessfullyDeletedLaunchTemplateVersions?: DeleteLaunchTemplateVersionsResponseSuccessSet;
    /**
     * Information about the launch template versions that could not be deleted.
     */
    UnsuccessfullyDeletedLaunchTemplateVersions?: DeleteLaunchTemplateVersionsResponseErrorSet;
  }
  export interface DeleteNatGatewayRequest {
    /**
     * The ID of the NAT gateway.
     */
    NatGatewayId: String;
  }
  export interface DeleteNatGatewayResult {
    /**
     * The ID of the NAT gateway.
     */
    NatGatewayId?: String;
  }
  export interface DeleteNetworkAclEntryRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicates whether the rule is an egress rule.
     */
    Egress: Boolean;
    /**
     * The ID of the network ACL.
     */
    NetworkAclId: String;
    /**
     * The rule number of the entry to delete.
     */
    RuleNumber: Integer;
  }
  export interface DeleteNetworkAclRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the network ACL.
     */
    NetworkAclId: String;
  }
  export interface DeleteNetworkInterfacePermissionRequest {
    /**
     * The ID of the network interface permission.
     */
    NetworkInterfacePermissionId: String;
    /**
     * Specify true to remove the permission even if the network interface is attached to an instance.
     */
    Force?: Boolean;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteNetworkInterfacePermissionResult {
    /**
     * Returns true if the request succeeds, otherwise returns an error.
     */
    Return?: Boolean;
  }
  export interface DeleteNetworkInterfaceRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
  }
  export interface DeletePlacementGroupRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The name of the placement group.
     */
    GroupName: String;
  }
  export interface DeleteRouteRequest {
    /**
     * The IPv4 CIDR range for the route. The value you specify must match the CIDR for the route exactly.
     */
    DestinationCidrBlock?: String;
    /**
     * The IPv6 CIDR range for the route. The value you specify must match the CIDR for the route exactly.
     */
    DestinationIpv6CidrBlock?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
  }
  export interface DeleteRouteTableRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
  }
  export interface DeleteSecurityGroupRequest {
    /**
     * The ID of the security group. Required for a nondefault VPC.
     */
    GroupId?: String;
    /**
     * [EC2-Classic, default VPC] The name of the security group. You can specify either the security group name or the security group ID.
     */
    GroupName?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteSnapshotRequest {
    /**
     * The ID of the EBS snapshot.
     */
    SnapshotId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteSpotDatafeedSubscriptionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteSubnetRequest {
    /**
     * The ID of the subnet.
     */
    SubnetId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteTagsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of one or more resources.
     */
    Resources: ResourceIdList;
    /**
     * One or more tags to delete. Specify a tag key and an optional tag value to delete specific tags. If you specify a tag key without a tag value, we delete any tag with this key regardless of its value. If you specify a tag key with an empty string as the tag value, we delete the tag only if its value is an empty string. If you omit this parameter, we delete all user-defined tags for the specified resources. We do not delete AWS-generated tags (tags that have the aws: prefix).
     */
    Tags?: TagList;
  }
  export interface DeleteVolumeRequest {
    /**
     * The ID of the volume.
     */
    VolumeId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteVpcEndpointConnectionNotificationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more notification IDs.
     */
    ConnectionNotificationIds: ValueStringList;
  }
  export interface DeleteVpcEndpointConnectionNotificationsResult {
    /**
     * Information about the notifications that could not be deleted successfully.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface DeleteVpcEndpointServiceConfigurationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of one or more services.
     */
    ServiceIds: ValueStringList;
  }
  export interface DeleteVpcEndpointServiceConfigurationsResult {
    /**
     * Information about the service configurations that were not deleted, if applicable.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface DeleteVpcEndpointsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more VPC endpoint IDs.
     */
    VpcEndpointIds: ValueStringList;
  }
  export interface DeleteVpcEndpointsResult {
    /**
     * Information about the VPC endpoints that were not successfully deleted.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface DeleteVpcPeeringConnectionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId: String;
  }
  export interface DeleteVpcPeeringConnectionResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface DeleteVpcRequest {
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteVpnConnectionRequest {
    /**
     * The ID of the VPN connection.
     */
    VpnConnectionId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeleteVpnConnectionRouteRequest {
    /**
     * The CIDR block associated with the local subnet of the customer network.
     */
    DestinationCidrBlock: String;
    /**
     * The ID of the VPN connection.
     */
    VpnConnectionId: String;
  }
  export interface DeleteVpnGatewayRequest {
    /**
     * The ID of the virtual private gateway.
     */
    VpnGatewayId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DeregisterImageRequest {
    /**
     * The ID of the AMI.
     */
    ImageId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeAccountAttributesRequest {
    /**
     * One or more account attribute names.
     */
    AttributeNames?: AccountAttributeNameStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeAccountAttributesResult {
    /**
     * Information about one or more account attributes.
     */
    AccountAttributes?: AccountAttributeList;
  }
  export interface DescribeAddressesRequest {
    /**
     * One or more filters. Filter names and values are case-sensitive.    allocation-id - [EC2-VPC] The allocation ID for the address.    association-id - [EC2-VPC] The association ID for the address.    domain - Indicates whether the address is for use in EC2-Classic (standard) or in a VPC (vpc).    instance-id - The ID of the instance the address is associated with, if any.    network-interface-id - [EC2-VPC] The ID of the network interface that the address is associated with, if any.    network-interface-owner-id - The AWS account ID of the owner.    private-ip-address - [EC2-VPC] The private IP address associated with the Elastic IP address.    public-ip - The Elastic IP address.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * [EC2-Classic] One or more Elastic IP addresses. Default: Describes all your Elastic IP addresses.
     */
    PublicIps?: PublicIpStringList;
    /**
     * [EC2-VPC] One or more allocation IDs. Default: Describes all your Elastic IP addresses.
     */
    AllocationIds?: AllocationIdList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeAddressesResult {
    /**
     * Information about one or more Elastic IP addresses.
     */
    Addresses?: AddressList;
  }
  export interface DescribeAggregateIdFormatRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeAggregateIdFormatResult {
    /**
     * Indicates whether all resource types in the region are configured to use longer IDs. This value is only true if all users are configured to use longer IDs for all resources types in the region.
     */
    UseLongIdsAggregated?: Boolean;
    /**
     * Information about each resource's ID format.
     */
    Statuses?: IdFormatList;
  }
  export interface DescribeAvailabilityZonesRequest {
    /**
     * One or more filters.    message - Information about the Availability Zone.    region-name - The name of the region for the Availability Zone (for example, us-east-1).    state - The state of the Availability Zone (available | information | impaired | unavailable).    zone-name - The name of the Availability Zone (for example, us-east-1a).  
     */
    Filters?: FilterList;
    /**
     * The names of one or more Availability Zones.
     */
    ZoneNames?: ZoneNameStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeAvailabilityZonesResult {
    /**
     * Information about one or more Availability Zones.
     */
    AvailabilityZones?: AvailabilityZoneList;
  }
  export interface DescribeBundleTasksRequest {
    /**
     * One or more bundle task IDs. Default: Describes all your bundle tasks.
     */
    BundleIds?: BundleIdStringList;
    /**
     * One or more filters.    bundle-id - The ID of the bundle task.    error-code - If the task failed, the error code returned.    error-message - If the task failed, the error message returned.    instance-id - The ID of the instance.    progress - The level of task completion, as a percentage (for example, 20%).    s3-bucket - The Amazon S3 bucket to store the AMI.    s3-prefix - The beginning of the AMI name.    start-time - The time the task started (for example, 2013-09-15T17:15:20.000Z).    state - The state of the task (pending | waiting-for-shutdown | bundling | storing | cancelling | complete | failed).    update-time - The time of the most recent update for the task.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeBundleTasksResult {
    /**
     * Information about one or more bundle tasks.
     */
    BundleTasks?: BundleTaskList;
  }
  export interface DescribeClassicLinkInstancesRequest {
    /**
     * One or more filters.    group-id - The ID of a VPC security group that's associated with the instance.    instance-id - The ID of the instance.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC to which the instance is linked.  vpc-id - The ID of the VPC that the instance is linked to.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more instance IDs. Must be instances linked to a VPC through ClassicLink.
     */
    InstanceIds?: InstanceIdStringList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000. If MaxResults is given a value larger than 1000, only 1000 results are returned. You cannot specify this parameter and the instance IDs parameter in the same request. Constraint: If the value is greater than 1000, we return only 1000 items.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeClassicLinkInstancesResult {
    /**
     * Information about one or more linked EC2-Classic instances.
     */
    Instances?: ClassicLinkInstanceList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export type DescribeConversionTaskList = ConversionTask[];
  export interface DescribeConversionTasksRequest {
    /**
     * One or more conversion task IDs.
     */
    ConversionTaskIds?: ConversionIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeConversionTasksResult {
    /**
     * Information about the conversion tasks.
     */
    ConversionTasks?: DescribeConversionTaskList;
  }
  export interface DescribeCustomerGatewaysRequest {
    /**
     * One or more customer gateway IDs. Default: Describes all your customer gateways.
     */
    CustomerGatewayIds?: CustomerGatewayIdStringList;
    /**
     * One or more filters.    bgp-asn - The customer gateway's Border Gateway Protocol (BGP) Autonomous System Number (ASN).    customer-gateway-id - The ID of the customer gateway.    ip-address - The IP address of the customer gateway's Internet-routable external interface.    state - The state of the customer gateway (pending | available | deleting | deleted).    type - The type of customer gateway. Currently, the only supported type is ipsec.1.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeCustomerGatewaysResult {
    /**
     * Information about one or more customer gateways.
     */
    CustomerGateways?: CustomerGatewayList;
  }
  export interface DescribeDhcpOptionsRequest {
    /**
     * The IDs of one or more DHCP options sets. Default: Describes all your DHCP options sets.
     */
    DhcpOptionsIds?: DhcpOptionsIdStringList;
    /**
     * One or more filters.    dhcp-options-id - The ID of a set of DHCP options.    key - The key for one of the options (for example, domain-name).    value - The value for one of the options.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeDhcpOptionsResult {
    /**
     * Information about one or more DHCP options sets.
     */
    DhcpOptions?: DhcpOptionsList;
  }
  export interface DescribeEgressOnlyInternetGatewaysRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more egress-only internet gateway IDs.
     */
    EgressOnlyInternetGatewayIds?: EgressOnlyInternetGatewayIdList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000. If MaxResults is given a value larger than 1000, only 1000 results are returned.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeEgressOnlyInternetGatewaysResult {
    /**
     * Information about the egress-only internet gateways.
     */
    EgressOnlyInternetGateways?: EgressOnlyInternetGatewayList;
    /**
     * The token to use to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeElasticGpusRequest {
    /**
     * One or more Elastic GPU IDs.
     */
    ElasticGpuIds?: ElasticGpuIdSet;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    availability-zone - The Availability Zone in which the Elastic GPU resides.    elastic-gpu-health - The status of the Elastic GPU (OK | IMPAIRED).    elastic-gpu-state - The state of the Elastic GPU (ATTACHED).    elastic-gpu-type - The type of Elastic GPU; for example, eg1.medium.    instance-id - The ID of the instance to which the Elastic GPU is associated.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 1000.
     */
    MaxResults?: Integer;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeElasticGpusResult {
    /**
     * Information about the Elastic GPUs.
     */
    ElasticGpuSet?: ElasticGpuSet;
    /**
     * The total number of items to return. If the total number of items available is more than the value specified in max-items then a Next-Token will be provided in the output that you can use to resume pagination.
     */
    MaxResults?: Integer;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeExportTasksRequest {
    /**
     * One or more export task IDs.
     */
    ExportTaskIds?: ExportTaskIdStringList;
  }
  export interface DescribeExportTasksResult {
    /**
     * Information about the export tasks.
     */
    ExportTasks?: ExportTaskList;
  }
  export interface DescribeFleetHistoryRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The type of events to describe. By default, all events are described.
     */
    EventType?: FleetEventType;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId: FleetIdentifier;
    /**
     * The start date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    StartTime: DateTime;
  }
  export interface DescribeFleetHistoryResult {
    /**
     * Information about the events in the history of the EC2 Fleet.
     */
    HistoryRecords?: HistoryRecordSet;
    /**
     * The last date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). All records up to this time were retrieved. If nextToken indicates that there are more results, this value is not present.
     */
    LastEvaluatedTime?: DateTime;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the EC Fleet.
     */
    FleetId?: FleetIdentifier;
    /**
     * The start date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    StartTime?: DateTime;
  }
  export interface DescribeFleetInstancesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId: FleetIdentifier;
    /**
     * One or more filters.    instance-type - The instance type.  
     */
    Filters?: FilterList;
  }
  export interface DescribeFleetInstancesResult {
    /**
     * The running instances. This list is refreshed periodically and might be out of date.
     */
    ActiveInstances?: ActiveInstanceSet;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId?: FleetIdentifier;
  }
  export interface DescribeFleetsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the EC2 Fleets.
     */
    FleetIds?: FleetIdSet;
    /**
     * One or more filters.    activity-status - The progress of the EC2 Fleet ( error | pending-fulfillment | pending-termination | fulfilled).    excess-capacity-termination-policy - Indicates whether to terminate running instances if the target capacity is decreased below the current EC2 Fleet size (true | false).    fleet-state - The state of the EC2 Fleet (submitted | active | deleted | failed | deleted-running | deleted-terminating | modifying).    replace-unhealthy-instances - Indicates whether EC2 Fleet should replace unhealthy instances (true | false).    type - The type of request (request | maintain).  
     */
    Filters?: FilterList;
  }
  export interface DescribeFleetsResult {
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * Information about the EC2 Fleets.
     */
    Fleets?: FleetSet;
  }
  export interface DescribeFlowLogsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    deliver-log-status - The status of the logs delivery (SUCCESS | FAILED).    log-destination-type - The type of destination to which the flow log publishes data. Possible destination types include cloud-watch-logs and S3.    flow-log-id - The ID of the flow log.    log-group-name - The name of the log group.    resource-id - The ID of the VPC, subnet, or network interface.    traffic-type - The type of traffic (ACCEPT | REJECT | ALL).  
     */
    Filter?: FilterList;
    /**
     * One or more flow log IDs.
     */
    FlowLogIds?: ValueStringList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000. If MaxResults is given a value larger than 1000, only 1000 results are returned. You cannot specify this parameter and the flow log IDs parameter in the same request.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeFlowLogsResult {
    /**
     * Information about the flow logs.
     */
    FlowLogs?: FlowLogSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeFpgaImageAttributeRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the AFI.
     */
    FpgaImageId: String;
    /**
     * The AFI attribute.
     */
    Attribute: FpgaImageAttributeName;
  }
  export interface DescribeFpgaImageAttributeResult {
    /**
     * Information about the attribute.
     */
    FpgaImageAttribute?: FpgaImageAttribute;
  }
  export interface DescribeFpgaImagesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more AFI IDs.
     */
    FpgaImageIds?: FpgaImageIdList;
    /**
     * Filters the AFI by owner. Specify an AWS account ID, self (owner is the sender of the request), or an AWS owner alias (valid values are amazon | aws-marketplace).
     */
    Owners?: OwnerStringList;
    /**
     * One or more filters.    create-time - The creation time of the AFI.    fpga-image-id - The FPGA image identifier (AFI ID).    fpga-image-global-id - The global FPGA image identifier (AGFI ID).    name - The name of the AFI.    owner-id - The AWS account ID of the AFI owner.    product-code - The product code.    shell-version - The version of the AWS Shell that was used to create the bitstream.    state - The state of the AFI (pending | failed | available | unavailable).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    update-time - The time of the most recent update.  
     */
    Filters?: FilterList;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of results to return in a single call.
     */
    MaxResults?: MaxResults;
  }
  export interface DescribeFpgaImagesResult {
    /**
     * Information about one or more FPGA images.
     */
    FpgaImages?: FpgaImageList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface DescribeHostReservationOfferingsRequest {
    /**
     * One or more filters.    instance-family - The instance family of the offering (for example, m4).    payment-option - The payment option (NoUpfront | PartialUpfront | AllUpfront).  
     */
    Filter?: FilterList;
    /**
     * This is the maximum duration of the reservation to purchase, specified in seconds. Reservations are available in one-year and three-year terms. The number of seconds specified must be the number of seconds in a year (365x24x60x60) times one of the supported durations (1 or 3). For example, specify 94608000 for three years.
     */
    MaxDuration?: Integer;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results can be seen by sending another request with the returned nextToken value. This value can be between 5 and 500. If maxResults is given a larger value than 500, you receive an error.
     */
    MaxResults?: Integer;
    /**
     * This is the minimum duration of the reservation you'd like to purchase, specified in seconds. Reservations are available in one-year and three-year terms. The number of seconds specified must be the number of seconds in a year (365x24x60x60) times one of the supported durations (1 or 3). For example, specify 31536000 for one year.
     */
    MinDuration?: Integer;
    /**
     * The token to use to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * The ID of the reservation offering.
     */
    OfferingId?: String;
  }
  export interface DescribeHostReservationOfferingsResult {
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * Information about the offerings.
     */
    OfferingSet?: HostOfferingSet;
  }
  export interface DescribeHostReservationsRequest {
    /**
     * One or more filters.    instance-family - The instance family (for example, m4).    payment-option - The payment option (NoUpfront | PartialUpfront | AllUpfront).    state - The state of the reservation (payment-pending | payment-failed | active | retired).  
     */
    Filter?: FilterList;
    /**
     * One or more host reservation IDs.
     */
    HostReservationIdSet?: HostReservationIdSet;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results can be seen by sending another request with the returned nextToken value. This value can be between 5 and 500. If maxResults is given a larger value than 500, you receive an error.
     */
    MaxResults?: Integer;
    /**
     * The token to use to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeHostReservationsResult {
    /**
     * Details about the reservation's configuration.
     */
    HostReservationSet?: HostReservationSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeHostsRequest {
    /**
     * One or more filters.    auto-placement - Whether auto-placement is enabled or disabled (on | off).    availability-zone - The Availability Zone of the host.    client-token - The idempotency token that you provided when you allocated the host.    host-reservation-id - The ID of the reservation assigned to this host.    instance-type - The instance type size that the Dedicated Host is configured to support.    state - The allocation state of the Dedicated Host (available | under-assessment | permanent-failure | released | released-permanent-failure).    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filter?: FilterList;
    /**
     * The IDs of the Dedicated Hosts. The IDs are used for targeted instance launches.
     */
    HostIds?: RequestHostIdList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results can be seen by sending another request with the returned nextToken value. This value can be between 5 and 500. If maxResults is given a larger value than 500, you receive an error. You cannot specify this parameter and the host IDs parameter in the same request.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeHostsResult {
    /**
     * Information about the Dedicated Hosts.
     */
    Hosts?: HostList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeIamInstanceProfileAssociationsRequest {
    /**
     * One or more IAM instance profile associations.
     */
    AssociationIds?: AssociationIdList;
    /**
     * One or more filters.    instance-id - The ID of the instance.    state - The state of the association (associating | associated | disassociating | disassociated).  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: MaxResults;
    /**
     * The token to request the next page of results.
     */
    NextToken?: NextToken;
  }
  export interface DescribeIamInstanceProfileAssociationsResult {
    /**
     * Information about one or more IAM instance profile associations.
     */
    IamInstanceProfileAssociations?: IamInstanceProfileAssociationSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: NextToken;
  }
  export interface DescribeIdFormatRequest {
    /**
     * The type of resource: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway 
     */
    Resource?: String;
  }
  export interface DescribeIdFormatResult {
    /**
     * Information about the ID format for the resource.
     */
    Statuses?: IdFormatList;
  }
  export interface DescribeIdentityIdFormatRequest {
    /**
     * The ARN of the principal, which can be an IAM role, IAM user, or the root user.
     */
    PrincipalArn: String;
    /**
     * The type of resource: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway 
     */
    Resource?: String;
  }
  export interface DescribeIdentityIdFormatResult {
    /**
     * Information about the ID format for the resources.
     */
    Statuses?: IdFormatList;
  }
  export interface DescribeImageAttributeRequest {
    /**
     * The AMI attribute.  Note: Depending on your account privileges, the blockDeviceMapping attribute may return a Client.AuthFailure error. If this happens, use DescribeImages to get information about the block device mapping for the AMI.
     */
    Attribute: ImageAttributeName;
    /**
     * The ID of the AMI.
     */
    ImageId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeImagesRequest {
    /**
     * Scopes the images by users with explicit launch permissions. Specify an AWS account ID, self (the sender of the request), or all (public AMIs).
     */
    ExecutableUsers?: ExecutableByStringList;
    /**
     * One or more filters.    architecture - The image architecture (i386 | x86_64).    block-device-mapping.delete-on-termination - A Boolean value that indicates whether the Amazon EBS volume is deleted on instance termination.    block-device-mapping.device-name - The device name specified in the block device mapping (for example, /dev/sdh or xvdh).    block-device-mapping.snapshot-id - The ID of the snapshot used for the EBS volume.    block-device-mapping.volume-size - The volume size of the EBS volume, in GiB.    block-device-mapping.volume-type - The volume type of the EBS volume (gp2 | io1 | st1 | sc1 | standard).    description - The description of the image (provided during image creation).    ena-support - A Boolean that indicates whether enhanced networking with ENA is enabled.    hypervisor - The hypervisor type (ovm | xen).    image-id - The ID of the image.    image-type - The image type (machine | kernel | ramdisk).    is-public - A Boolean that indicates whether the image is public.    kernel-id - The kernel ID.    manifest-location - The location of the image manifest.    name - The name of the AMI (provided during image creation).    owner-alias - String value from an Amazon-maintained list (amazon | aws-marketplace | microsoft) of snapshot owners. Not to be confused with the user-configured AWS account alias, which is set from the IAM console.    owner-id - The AWS account ID of the image owner.    platform - The platform. To only list Windows-based AMIs, use windows.    product-code - The product code.    product-code.type - The type of the product code (devpay | marketplace).    ramdisk-id - The RAM disk ID.    root-device-name - The device name of the root device volume (for example, /dev/sda1).    root-device-type - The type of the root device volume (ebs | instance-store).    state - The state of the image (available | pending | failed).    state-reason-code - The reason code for the state change.    state-reason-message - The message for the state change.    sriov-net-support - A value of simple indicates that enhanced networking with the Intel 82599 VF interface is enabled.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    virtualization-type - The virtualization type (paravirtual | hvm).  
     */
    Filters?: FilterList;
    /**
     * One or more image IDs. Default: Describes all images available to you.
     */
    ImageIds?: ImageIdStringList;
    /**
     * Filters the images by the owner. Specify an AWS account ID, self (owner is the sender of the request), or an AWS owner alias (valid values are amazon | aws-marketplace | microsoft). Omitting this option returns all images for which you have launch permissions, regardless of ownership.
     */
    Owners?: OwnerStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeImagesResult {
    /**
     * Information about one or more images.
     */
    Images?: ImageList;
  }
  export interface DescribeImportImageTasksRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Filter tasks using the task-state filter and one of the following values: active, completed, deleting, deleted.
     */
    Filters?: FilterList;
    /**
     * A list of import image task IDs.
     */
    ImportTaskIds?: ImportTaskIdList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * A token that indicates the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeImportImageTasksResult {
    /**
     * A list of zero or more import image tasks that are currently active or were completed or canceled in the previous 7 days.
     */
    ImportImageTasks?: ImportImageTaskList;
    /**
     * The token to use to get the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeImportSnapshotTasksRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.
     */
    Filters?: FilterList;
    /**
     * A list of import snapshot task IDs.
     */
    ImportTaskIds?: ImportTaskIdList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * A token that indicates the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeImportSnapshotTasksResult {
    /**
     * A list of zero or more import snapshot tasks that are currently active or were completed or canceled in the previous 7 days.
     */
    ImportSnapshotTasks?: ImportSnapshotTaskList;
    /**
     * The token to use to get the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeInstanceAttributeRequest {
    /**
     * The instance attribute. Note: The enaSupport attribute is not supported at this time.
     */
    Attribute: InstanceAttributeName;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
  }
  export interface DescribeInstanceCreditSpecificationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    instance-id - The ID of the instance.  
     */
    Filters?: FilterList;
    /**
     * One or more instance IDs. Default: Describes all your instances. Constraints: Maximum 1000 explicitly specified instance IDs.
     */
    InstanceIds?: InstanceIdStringList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 1000. You cannot specify this parameter and the instance IDs parameter in the same call.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeInstanceCreditSpecificationsResult {
    /**
     * Information about the credit option for CPU usage of an instance.
     */
    InstanceCreditSpecifications?: InstanceCreditSpecificationList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeInstanceStatusRequest {
    /**
     * One or more filters.    availability-zone - The Availability Zone of the instance.    event.code - The code for the scheduled event (instance-reboot | system-reboot | system-maintenance | instance-retirement | instance-stop).    event.description - A description of the event.    event.not-after - The latest end time for the scheduled event (for example, 2014-09-15T17:15:20.000Z).    event.not-before - The earliest start time for the scheduled event (for example, 2014-09-15T17:15:20.000Z).    instance-state-code - The code for the instance state, as a 16-bit unsigned integer. The high byte is used for internal purposes and should be ignored. The low byte is set based on the state represented. The valid values are 0 (pending), 16 (running), 32 (shutting-down), 48 (terminated), 64 (stopping), and 80 (stopped).    instance-state-name - The state of the instance (pending | running | shutting-down | terminated | stopping | stopped).    instance-status.reachability - Filters on instance status where the name is reachability (passed | failed | initializing | insufficient-data).    instance-status.status - The status of the instance (ok | impaired | initializing | insufficient-data | not-applicable).    system-status.reachability - Filters on system status where the name is reachability (passed | failed | initializing | insufficient-data).    system-status.status - The system status of the instance (ok | impaired | initializing | insufficient-data | not-applicable).  
     */
    Filters?: FilterList;
    /**
     * One or more instance IDs. Default: Describes all your instances. Constraints: Maximum 100 explicitly specified instance IDs.
     */
    InstanceIds?: InstanceIdStringList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 1000. You cannot specify this parameter and the instance IDs parameter in the same call.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * When true, includes the health status for all instances. When false, includes the health status for running instances only. Default: false 
     */
    IncludeAllInstances?: Boolean;
  }
  export interface DescribeInstanceStatusResult {
    /**
     * One or more instance status descriptions.
     */
    InstanceStatuses?: InstanceStatusList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeInstancesRequest {
    /**
     * One or more filters.    affinity - The affinity setting for an instance running on a Dedicated Host (default | host).    architecture - The instance architecture (i386 | x86_64).    availability-zone - The Availability Zone of the instance.    block-device-mapping.attach-time - The attach time for an EBS volume mapped to the instance, for example, 2010-09-15T17:15:20.000Z.    block-device-mapping.delete-on-termination - A Boolean that indicates whether the EBS volume is deleted on instance termination.    block-device-mapping.device-name - The device name specified in the block device mapping (for example, /dev/sdh or xvdh).    block-device-mapping.status - The status for the EBS volume (attaching | attached | detaching | detached).    block-device-mapping.volume-id - The volume ID of the EBS volume.    client-token - The idempotency token you provided when you launched the instance.    dns-name - The public DNS name of the instance.    group-id - The ID of the security group for the instance. EC2-Classic only.    group-name - The name of the security group for the instance. EC2-Classic only.    host-id - The ID of the Dedicated Host on which the instance is running, if applicable.    hypervisor - The hypervisor type of the instance (ovm | xen).    iam-instance-profile.arn - The instance profile associated with the instance. Specified as an ARN.    image-id - The ID of the image used to launch the instance.    instance-id - The ID of the instance.    instance-lifecycle - Indicates whether this is a Spot Instance or a Scheduled Instance (spot | scheduled).    instance-state-code - The state of the instance, as a 16-bit unsigned integer. The high byte is used for internal purposes and should be ignored. The low byte is set based on the state represented. The valid values are: 0 (pending), 16 (running), 32 (shutting-down), 48 (terminated), 64 (stopping), and 80 (stopped).    instance-state-name - The state of the instance (pending | running | shutting-down | terminated | stopping | stopped).    instance-type - The type of instance (for example, t2.micro).    instance.group-id - The ID of the security group for the instance.     instance.group-name - The name of the security group for the instance.     ip-address - The public IPv4 address of the instance.    kernel-id - The kernel ID.    key-name - The name of the key pair used when the instance was launched.    launch-index - When launching multiple instances, this is the index for the instance in the launch group (for example, 0, 1, 2, and so on).     launch-time - The time when the instance was launched.    monitoring-state - Indicates whether detailed monitoring is enabled (disabled | enabled).    network-interface.addresses.private-ip-address - The private IPv4 address associated with the network interface.    network-interface.addresses.primary - Specifies whether the IPv4 address of the network interface is the primary private IPv4 address.    network-interface.addresses.association.public-ip - The ID of the association of an Elastic IP address (IPv4) with a network interface.    network-interface.addresses.association.ip-owner-id - The owner ID of the private IPv4 address associated with the network interface.    network-interface.association.public-ip - The address of the Elastic IP address (IPv4) bound to the network interface.    network-interface.association.ip-owner-id - The owner of the Elastic IP address (IPv4) associated with the network interface.    network-interface.association.allocation-id - The allocation ID returned when you allocated the Elastic IP address (IPv4) for your network interface.    network-interface.association.association-id - The association ID returned when the network interface was associated with an IPv4 address.    network-interface.attachment.attachment-id - The ID of the interface attachment.    network-interface.attachment.instance-id - The ID of the instance to which the network interface is attached.    network-interface.attachment.instance-owner-id - The owner ID of the instance to which the network interface is attached.    network-interface.attachment.device-index - The device index to which the network interface is attached.    network-interface.attachment.status - The status of the attachment (attaching | attached | detaching | detached).    network-interface.attachment.attach-time - The time that the network interface was attached to an instance.    network-interface.attachment.delete-on-termination - Specifies whether the attachment is deleted when an instance is terminated.    network-interface.availability-zone - The Availability Zone for the network interface.    network-interface.description - The description of the network interface.    network-interface.group-id - The ID of a security group associated with the network interface.    network-interface.group-name - The name of a security group associated with the network interface.    network-interface.ipv6-addresses.ipv6-address - The IPv6 address associated with the network interface.    network-interface.mac-address - The MAC address of the network interface.    network-interface.network-interface-id - The ID of the network interface.    network-interface.owner-id - The ID of the owner of the network interface.    network-interface.private-dns-name - The private DNS name of the network interface.    network-interface.requester-id - The requester ID for the network interface.    network-interface.requester-managed - Indicates whether the network interface is being managed by AWS.    network-interface.status - The status of the network interface (available) | in-use).    network-interface.source-dest-check - Whether the network interface performs source/destination checking. A value of true means that checking is enabled, and false means that checking is disabled. The value must be false for the network interface to perform network address translation (NAT) in your VPC.    network-interface.subnet-id - The ID of the subnet for the network interface.    network-interface.vpc-id - The ID of the VPC for the network interface.    owner-id - The AWS account ID of the instance owner.    placement-group-name - The name of the placement group for the instance.    platform - The platform. Use windows if you have Windows instances; otherwise, leave blank.    private-dns-name - The private IPv4 DNS name of the instance.    private-ip-address - The private IPv4 address of the instance.    product-code - The product code associated with the AMI used to launch the instance.    product-code.type - The type of product code (devpay | marketplace).    ramdisk-id - The RAM disk ID.    reason - The reason for the current state of the instance (for example, shows "User Initiated [date]" when you stop or terminate the instance). Similar to the state-reason-code filter.    requester-id - The ID of the entity that launched the instance on your behalf (for example, AWS Management Console, Auto Scaling, and so on).    reservation-id - The ID of the instance's reservation. A reservation ID is created any time you launch an instance. A reservation ID has a one-to-one relationship with an instance launch request, but can be associated with more than one instance if you launch multiple instances using the same launch request. For example, if you launch one instance, you get one reservation ID. If you launch ten instances using the same launch request, you also get one reservation ID.    root-device-name - The device name of the root device volume (for example, /dev/sda1).    root-device-type - The type of the root device volume (ebs | instance-store).    source-dest-check - Indicates whether the instance performs source/destination checking. A value of true means that checking is enabled, and false means that checking is disabled. The value must be false for the instance to perform network address translation (NAT) in your VPC.     spot-instance-request-id - The ID of the Spot Instance request.    state-reason-code - The reason code for the state change.    state-reason-message - A message that describes the state change.    subnet-id - The ID of the subnet for the instance.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources that have a tag with a specific key, regardless of the tag value.    tenancy - The tenancy of an instance (dedicated | default | host).    virtualization-type - The virtualization type of the instance (paravirtual | hvm).    vpc-id - The ID of the VPC that the instance is running in.  
     */
    Filters?: FilterList;
    /**
     * One or more instance IDs. Default: Describes all your instances.
     */
    InstanceIds?: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 1000. You cannot specify this parameter and the instance IDs parameter in the same call.
     */
    MaxResults?: Integer;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeInstancesResult {
    /**
     * Zero or more reservations.
     */
    Reservations?: ReservationList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeInternetGatewaysRequest {
    /**
     * One or more filters.    attachment.state - The current state of the attachment between the gateway and the VPC (available). Present only if a VPC is attached.    attachment.vpc-id - The ID of an attached VPC.    internet-gateway-id - The ID of the Internet gateway.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more internet gateway IDs. Default: Describes all your internet gateways.
     */
    InternetGatewayIds?: ValueStringList;
  }
  export interface DescribeInternetGatewaysResult {
    /**
     * Information about one or more internet gateways.
     */
    InternetGateways?: InternetGatewayList;
  }
  export interface DescribeKeyPairsRequest {
    /**
     * One or more filters.    fingerprint - The fingerprint of the key pair.    key-name - The name of the key pair.  
     */
    Filters?: FilterList;
    /**
     * One or more key pair names. Default: Describes all your key pairs.
     */
    KeyNames?: KeyNameStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeKeyPairsResult {
    /**
     * Information about one or more key pairs.
     */
    KeyPairs?: KeyPairList;
  }
  export interface DescribeLaunchTemplateVersionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * One or more versions of the launch template.
     */
    Versions?: VersionStringList;
    /**
     * The version number after which to describe launch template versions.
     */
    MinVersion?: String;
    /**
     * The version number up to which to describe launch template versions.
     */
    MaxVersion?: String;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 1 and 200.
     */
    MaxResults?: Integer;
    /**
     * One or more filters.    create-time - The time the launch template version was created.    ebs-optimized - A boolean that indicates whether the instance is optimized for Amazon EBS I/O.    iam-instance-profile - The ARN of the IAM instance profile.    image-id - The ID of the AMI.    instance-type - The instance type.    is-default-version - A boolean that indicates whether the launch template version is the default version.    kernel-id - The kernel ID.    ram-disk-id - The RAM disk ID.  
     */
    Filters?: FilterList;
  }
  export interface DescribeLaunchTemplateVersionsResult {
    /**
     * Information about the launch template versions.
     */
    LaunchTemplateVersions?: LaunchTemplateVersionSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeLaunchTemplatesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more launch template IDs.
     */
    LaunchTemplateIds?: ValueStringList;
    /**
     * One or more launch template names.
     */
    LaunchTemplateNames?: LaunchTemplateNameStringList;
    /**
     * One or more filters.    create-time - The time the launch template was created.    launch-template-name - The name of the launch template.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 1000.
     */
    MaxResults?: Integer;
  }
  export interface DescribeLaunchTemplatesResult {
    /**
     * Information about the launch templates.
     */
    LaunchTemplates?: LaunchTemplateSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeMovingAddressesRequest {
    /**
     * One or more filters.    moving-status - The status of the Elastic IP address (MovingToVpc | RestoringToClassic).  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value outside of this range, an error is returned. Default: If no value is provided, the default is 1000.
     */
    MaxResults?: Integer;
    /**
     * The token to use to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * One or more Elastic IP addresses.
     */
    PublicIps?: ValueStringList;
  }
  export interface DescribeMovingAddressesResult {
    /**
     * The status for each Elastic IP address.
     */
    MovingAddressStatuses?: MovingAddressStatusSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeNatGatewaysRequest {
    /**
     * One or more filters.    nat-gateway-id - The ID of the NAT gateway.    state - The state of the NAT gateway (pending | failed | available | deleting | deleted).    subnet-id - The ID of the subnet in which the NAT gateway resides.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC in which the NAT gateway resides.  
     */
    Filter?: FilterList;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results. Constraint: If the value specified is greater than 1000, we return only 1000 items.
     */
    MaxResults?: Integer;
    /**
     * One or more NAT gateway IDs.
     */
    NatGatewayIds?: ValueStringList;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeNatGatewaysResult {
    /**
     * Information about the NAT gateways.
     */
    NatGateways?: NatGatewayList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeNetworkAclsRequest {
    /**
     * One or more filters.    association.association-id - The ID of an association ID for the ACL.    association.network-acl-id - The ID of the network ACL involved in the association.    association.subnet-id - The ID of the subnet involved in the association.    default - Indicates whether the ACL is the default network ACL for the VPC.    entry.cidr - The IPv4 CIDR range specified in the entry.    entry.icmp.code - The ICMP code specified in the entry, if any.    entry.icmp.type - The ICMP type specified in the entry, if any.    entry.ipv6-cidr - The IPv6 CIDR range specified in the entry.    entry.port-range.from - The start of the port range specified in the entry.     entry.port-range.to - The end of the port range specified in the entry.     entry.protocol - The protocol specified in the entry (tcp | udp | icmp or a protocol number).    entry.rule-action - Allows or denies the matching traffic (allow | deny).    entry.rule-number - The number of an entry (in other words, rule) in the set of ACL entries.    network-acl-id - The ID of the network ACL.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC for the network ACL.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more network ACL IDs. Default: Describes all your network ACLs.
     */
    NetworkAclIds?: ValueStringList;
  }
  export interface DescribeNetworkAclsResult {
    /**
     * Information about one or more network ACLs.
     */
    NetworkAcls?: NetworkAclList;
  }
  export interface DescribeNetworkInterfaceAttributeRequest {
    /**
     * The attribute of the network interface. This parameter is required.
     */
    Attribute?: NetworkInterfaceAttribute;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
  }
  export interface DescribeNetworkInterfaceAttributeResult {
    /**
     * The attachment (if any) of the network interface.
     */
    Attachment?: NetworkInterfaceAttachment;
    /**
     * The description of the network interface.
     */
    Description?: AttributeValue;
    /**
     * The security groups associated with the network interface.
     */
    Groups?: GroupIdentifierList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * Indicates whether source/destination checking is enabled.
     */
    SourceDestCheck?: AttributeBooleanValue;
  }
  export interface DescribeNetworkInterfacePermissionsRequest {
    /**
     * One or more network interface permission IDs.
     */
    NetworkInterfacePermissionIds?: NetworkInterfacePermissionIdList;
    /**
     * One or more filters.    network-interface-permission.network-interface-permission-id - The ID of the permission.    network-interface-permission.network-interface-id - The ID of the network interface.    network-interface-permission.aws-account-id - The AWS account ID.    network-interface-permission.aws-service - The AWS service.    network-interface-permission.permission - The type of permission (INSTANCE-ATTACH | EIP-ASSOCIATE).  
     */
    Filters?: FilterList;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. If this parameter is not specified, up to 50 results are returned by default.
     */
    MaxResults?: Integer;
  }
  export interface DescribeNetworkInterfacePermissionsResult {
    /**
     * The network interface permissions.
     */
    NetworkInterfacePermissions?: NetworkInterfacePermissionList;
    /**
     * The token to use to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeNetworkInterfacesRequest {
    /**
     * One or more filters.    addresses.private-ip-address - The private IPv4 addresses associated with the network interface.    addresses.primary - Whether the private IPv4 address is the primary IP address associated with the network interface.     addresses.association.public-ip - The association ID returned when the network interface was associated with the Elastic IP address (IPv4).    addresses.association.owner-id - The owner ID of the addresses associated with the network interface.    association.association-id - The association ID returned when the network interface was associated with an IPv4 address.    association.allocation-id - The allocation ID returned when you allocated the Elastic IP address (IPv4) for your network interface.    association.ip-owner-id - The owner of the Elastic IP address (IPv4) associated with the network interface.    association.public-ip - The address of the Elastic IP address (IPv4) bound to the network interface.    association.public-dns-name - The public DNS name for the network interface (IPv4).    attachment.attachment-id - The ID of the interface attachment.    attachment.attach.time - The time that the network interface was attached to an instance.    attachment.delete-on-termination - Indicates whether the attachment is deleted when an instance is terminated.    attachment.device-index - The device index to which the network interface is attached.    attachment.instance-id - The ID of the instance to which the network interface is attached.    attachment.instance-owner-id - The owner ID of the instance to which the network interface is attached.    attachment.nat-gateway-id - The ID of the NAT gateway to which the network interface is attached.    attachment.status - The status of the attachment (attaching | attached | detaching | detached).    availability-zone - The Availability Zone of the network interface.    description - The description of the network interface.    group-id - The ID of a security group associated with the network interface.    group-name - The name of a security group associated with the network interface.    ipv6-addresses.ipv6-address - An IPv6 address associated with the network interface.    mac-address - The MAC address of the network interface.    network-interface-id - The ID of the network interface.    owner-id - The AWS account ID of the network interface owner.    private-ip-address - The private IPv4 address or addresses of the network interface.    private-dns-name - The private DNS name of the network interface (IPv4).    requester-id - The ID of the entity that launched the instance on your behalf (for example, AWS Management Console, Auto Scaling, and so on).    requester-managed - Indicates whether the network interface is being managed by an AWS service (for example, AWS Management Console, Auto Scaling, and so on).    source-desk-check - Indicates whether the network interface performs source/destination checking. A value of true means checking is enabled, and false means checking is disabled. The value must be false for the network interface to perform network address translation (NAT) in your VPC.     status - The status of the network interface. If the network interface is not attached to an instance, the status is available; if a network interface is attached to an instance the status is in-use.    subnet-id - The ID of the subnet for the network interface.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC for the network interface.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more network interface IDs. Default: Describes all your network interfaces.
     */
    NetworkInterfaceIds?: NetworkInterfaceIdList;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results.
     */
    MaxResults?: Integer;
  }
  export interface DescribeNetworkInterfacesResult {
    /**
     * Information about one or more network interfaces.
     */
    NetworkInterfaces?: NetworkInterfaceList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribePlacementGroupsRequest {
    /**
     * One or more filters.    group-name - The name of the placement group.    state - The state of the placement group (pending | available | deleting | deleted).    strategy - The strategy of the placement group (cluster | spread).  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more placement group names. Default: Describes all your placement groups, or only those otherwise specified.
     */
    GroupNames?: PlacementGroupStringList;
  }
  export interface DescribePlacementGroupsResult {
    /**
     * One or more placement groups.
     */
    PlacementGroups?: PlacementGroupList;
  }
  export interface DescribePrefixListsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    prefix-list-id: The ID of a prefix list.    prefix-list-name: The name of a prefix list.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results. Constraint: If the value specified is greater than 1000, we return only 1000 items.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of items to return. (You received this token from a prior call.)
     */
    NextToken?: String;
    /**
     * One or more prefix list IDs.
     */
    PrefixListIds?: ValueStringList;
  }
  export interface DescribePrefixListsResult {
    /**
     * The token to use when requesting the next set of items. If there are no additional items to return, the string is empty.
     */
    NextToken?: String;
    /**
     * All available prefix lists.
     */
    PrefixLists?: PrefixListSet;
  }
  export interface DescribePrincipalIdFormatRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The type of resource: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | instance | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | reservation | route-table | route-table-association | security-group | snapshot | subnet | subnet-cidr-block-association | volume | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway 
     */
    Resources?: ResourceList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. 
     */
    MaxResults?: Integer;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribePrincipalIdFormatResult {
    /**
     * Information about the ID format settings for the ARN.
     */
    Principals?: PrincipalIdFormatList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeRegionsRequest {
    /**
     * One or more filters.    endpoint - The endpoint of the region (for example, ec2.us-east-1.amazonaws.com).    region-name - The name of the region (for example, us-east-1).  
     */
    Filters?: FilterList;
    /**
     * The names of one or more regions.
     */
    RegionNames?: RegionNameStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeRegionsResult {
    /**
     * Information about one or more regions.
     */
    Regions?: RegionList;
  }
  export interface DescribeReservedInstancesListingsRequest {
    /**
     * One or more filters.    reserved-instances-id - The ID of the Reserved Instances.    reserved-instances-listing-id - The ID of the Reserved Instances listing.    status - The status of the Reserved Instance listing (pending | active | cancelled | closed).    status-message - The reason for the status.  
     */
    Filters?: FilterList;
    /**
     * One or more Reserved Instance IDs.
     */
    ReservedInstancesId?: String;
    /**
     * One or more Reserved Instance listing IDs.
     */
    ReservedInstancesListingId?: String;
  }
  export interface DescribeReservedInstancesListingsResult {
    /**
     * Information about the Reserved Instance listing.
     */
    ReservedInstancesListings?: ReservedInstancesListingList;
  }
  export interface DescribeReservedInstancesModificationsRequest {
    /**
     * One or more filters.    client-token - The idempotency token for the modification request.    create-date - The time when the modification request was created.    effective-date - The time when the modification becomes effective.    modification-result.reserved-instances-id - The ID for the Reserved Instances created as part of the modification request. This ID is only available when the status of the modification is fulfilled.    modification-result.target-configuration.availability-zone - The Availability Zone for the new Reserved Instances.    modification-result.target-configuration.instance-count  - The number of new Reserved Instances.    modification-result.target-configuration.instance-type - The instance type of the new Reserved Instances.    modification-result.target-configuration.platform - The network platform of the new Reserved Instances (EC2-Classic | EC2-VPC).    reserved-instances-id - The ID of the Reserved Instances modified.    reserved-instances-modification-id - The ID of the modification request.    status - The status of the Reserved Instances modification request (processing | fulfilled | failed).    status-message - The reason for the status.    update-date - The time when the modification request was last updated.  
     */
    Filters?: FilterList;
    /**
     * IDs for the submitted modification request.
     */
    ReservedInstancesModificationIds?: ReservedInstancesModificationIdStringList;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeReservedInstancesModificationsResult {
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * The Reserved Instance modification information.
     */
    ReservedInstancesModifications?: ReservedInstancesModificationList;
  }
  export interface DescribeReservedInstancesOfferingsRequest {
    /**
     * The Availability Zone in which the Reserved Instance can be used.
     */
    AvailabilityZone?: String;
    /**
     * One or more filters.    availability-zone - The Availability Zone where the Reserved Instance can be used.    duration - The duration of the Reserved Instance (for example, one year or three years), in seconds (31536000 | 94608000).    fixed-price - The purchase price of the Reserved Instance (for example, 9800.0).    instance-type - The instance type that is covered by the reservation.    marketplace - Set to true to show only Reserved Instance Marketplace offerings. When this filter is not used, which is the default behavior, all offerings from both AWS and the Reserved Instance Marketplace are listed.    product-description - The Reserved Instance product platform description. Instances that include (Amazon VPC) in the product platform description will only be displayed to EC2-Classic account holders and are for use with Amazon VPC. (Linux/UNIX | Linux/UNIX (Amazon VPC) | SUSE Linux | SUSE Linux (Amazon VPC) | Red Hat Enterprise Linux | Red Hat Enterprise Linux (Amazon VPC) | Windows | Windows (Amazon VPC) | Windows with SQL Server Standard | Windows with SQL Server Standard (Amazon VPC) | Windows with SQL Server Web |  Windows with SQL Server Web (Amazon VPC) | Windows with SQL Server Enterprise | Windows with SQL Server Enterprise (Amazon VPC))     reserved-instances-offering-id - The Reserved Instances offering ID.    scope - The scope of the Reserved Instance (Availability Zone or Region).    usage-price - The usage price of the Reserved Instance, per hour (for example, 0.84).  
     */
    Filters?: FilterList;
    /**
     * Include Reserved Instance Marketplace offerings in the response.
     */
    IncludeMarketplace?: Boolean;
    /**
     * The instance type that the reservation will cover (for example, m1.small). For more information, see Instance Types in the Amazon Elastic Compute Cloud User Guide.
     */
    InstanceType?: InstanceType;
    /**
     * The maximum duration (in seconds) to filter when searching for offerings. Default: 94608000 (3 years)
     */
    MaxDuration?: Long;
    /**
     * The maximum number of instances to filter when searching for offerings. Default: 20
     */
    MaxInstanceCount?: Integer;
    /**
     * The minimum duration (in seconds) to filter when searching for offerings. Default: 2592000 (1 month)
     */
    MinDuration?: Long;
    /**
     * The offering class of the Reserved Instance. Can be standard or convertible.
     */
    OfferingClass?: OfferingClassType;
    /**
     * The Reserved Instance product platform description. Instances that include (Amazon VPC) in the description are for use with Amazon VPC.
     */
    ProductDescription?: RIProductDescription;
    /**
     * One or more Reserved Instances offering IDs.
     */
    ReservedInstancesOfferingIds?: ReservedInstancesOfferingIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The tenancy of the instances covered by the reservation. A Reserved Instance with a tenancy of dedicated is applied to instances that run in a VPC on single-tenant hardware (i.e., Dedicated Instances).  Important: The host value cannot be used with this parameter. Use the default or dedicated values only. Default: default 
     */
    InstanceTenancy?: Tenancy;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. The maximum is 100. Default: 100
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * The Reserved Instance offering type. If you are using tools that predate the 2011-11-01 API version, you only have access to the Medium Utilization Reserved Instance offering type. 
     */
    OfferingType?: OfferingTypeValues;
  }
  export interface DescribeReservedInstancesOfferingsResult {
    /**
     * A list of Reserved Instances offerings.
     */
    ReservedInstancesOfferings?: ReservedInstancesOfferingList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeReservedInstancesRequest {
    /**
     * One or more filters.    availability-zone - The Availability Zone where the Reserved Instance can be used.    duration - The duration of the Reserved Instance (one year or three years), in seconds (31536000 | 94608000).    end - The time when the Reserved Instance expires (for example, 2015-08-07T11:54:42.000Z).    fixed-price - The purchase price of the Reserved Instance (for example, 9800.0).    instance-type - The instance type that is covered by the reservation.    scope - The scope of the Reserved Instance (Region or Availability Zone).    product-description - The Reserved Instance product platform description. Instances that include (Amazon VPC) in the product platform description will only be displayed to EC2-Classic account holders and are for use with Amazon VPC (Linux/UNIX | Linux/UNIX (Amazon VPC) | SUSE Linux | SUSE Linux (Amazon VPC) | Red Hat Enterprise Linux | Red Hat Enterprise Linux (Amazon VPC) | Windows | Windows (Amazon VPC) | Windows with SQL Server Standard | Windows with SQL Server Standard (Amazon VPC) | Windows with SQL Server Web | Windows with SQL Server Web (Amazon VPC) | Windows with SQL Server Enterprise | Windows with SQL Server Enterprise (Amazon VPC)).    reserved-instances-id - The ID of the Reserved Instance.    start - The time at which the Reserved Instance purchase request was placed (for example, 2014-08-07T11:54:42.000Z).    state - The state of the Reserved Instance (payment-pending | active | payment-failed | retired).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    usage-price - The usage price of the Reserved Instance, per hour (for example, 0.84).  
     */
    Filters?: FilterList;
    /**
     * Describes whether the Reserved Instance is Standard or Convertible.
     */
    OfferingClass?: OfferingClassType;
    /**
     * One or more Reserved Instance IDs. Default: Describes all your Reserved Instances, or only those otherwise specified.
     */
    ReservedInstancesIds?: ReservedInstancesIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The Reserved Instance offering type. If you are using tools that predate the 2011-11-01 API version, you only have access to the Medium Utilization Reserved Instance offering type.
     */
    OfferingType?: OfferingTypeValues;
  }
  export interface DescribeReservedInstancesResult {
    /**
     * A list of Reserved Instances.
     */
    ReservedInstances?: ReservedInstancesList;
  }
  export interface DescribeRouteTablesRequest {
    /**
     * One or more filters.    association.route-table-association-id - The ID of an association ID for the route table.    association.route-table-id - The ID of the route table involved in the association.    association.subnet-id - The ID of the subnet involved in the association.    association.main - Indicates whether the route table is the main route table for the VPC (true | false). Route tables that do not have an association ID are not returned in the response.    route-table-id - The ID of the route table.    route.destination-cidr-block - The IPv4 CIDR range specified in a route in the table.    route.destination-ipv6-cidr-block - The IPv6 CIDR range specified in a route in the route table.    route.destination-prefix-list-id - The ID (prefix) of the AWS service specified in a route in the table.    route.egress-only-internet-gateway-id - The ID of an egress-only Internet gateway specified in a route in the route table.    route.gateway-id - The ID of a gateway specified in a route in the table.    route.instance-id - The ID of an instance specified in a route in the table.    route.nat-gateway-id - The ID of a NAT gateway.    route.origin - Describes how the route was created. CreateRouteTable indicates that the route was automatically created when the route table was created; CreateRoute indicates that the route was manually added to the route table; EnableVgwRoutePropagation indicates that the route was propagated by route propagation.    route.state - The state of a route in the route table (active | blackhole). The blackhole state indicates that the route's target isn't available (for example, the specified gateway isn't attached to the VPC, the specified NAT instance has been terminated, and so on).    route.vpc-peering-connection-id - The ID of a VPC peering connection specified in a route in the table.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC for the route table.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more route table IDs. Default: Describes all your route tables.
     */
    RouteTableIds?: ValueStringList;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another call with the returned NextToken value. This value can be between 5 and 100.
     */
    MaxResults?: Integer;
  }
  export interface DescribeRouteTablesResult {
    /**
     * Information about one or more route tables.
     */
    RouteTables?: RouteTableList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeScheduledInstanceAvailabilityRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    availability-zone - The Availability Zone (for example, us-west-2a).    instance-type - The instance type (for example, c4.large).    network-platform - The network platform (EC2-Classic or EC2-VPC).    platform - The platform (Linux/UNIX or Windows).  
     */
    Filters?: FilterList;
    /**
     * The time period for the first schedule to start.
     */
    FirstSlotStartTimeRange: SlotDateTimeRangeRequest;
    /**
     * The maximum number of results to return in a single call. This value can be between 5 and 300. The default value is 300. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The maximum available duration, in hours. This value must be greater than MinSlotDurationInHours and less than 1,720.
     */
    MaxSlotDurationInHours?: Integer;
    /**
     * The minimum available duration, in hours. The minimum required duration is 1,200 hours per year. For example, the minimum daily schedule is 4 hours, the minimum weekly schedule is 24 hours, and the minimum monthly schedule is 100 hours.
     */
    MinSlotDurationInHours?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The schedule recurrence.
     */
    Recurrence: ScheduledInstanceRecurrenceRequest;
  }
  export interface DescribeScheduledInstanceAvailabilityResult {
    /**
     * The token required to retrieve the next set of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * Information about the available Scheduled Instances.
     */
    ScheduledInstanceAvailabilitySet?: ScheduledInstanceAvailabilitySet;
  }
  export interface DescribeScheduledInstancesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    availability-zone - The Availability Zone (for example, us-west-2a).    instance-type - The instance type (for example, c4.large).    network-platform - The network platform (EC2-Classic or EC2-VPC).    platform - The platform (Linux/UNIX or Windows).  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return in a single call. This value can be between 5 and 300. The default value is 100. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * One or more Scheduled Instance IDs.
     */
    ScheduledInstanceIds?: ScheduledInstanceIdRequestSet;
    /**
     * The time period for the first schedule to start.
     */
    SlotStartTimeRange?: SlotStartTimeRangeRequest;
  }
  export interface DescribeScheduledInstancesResult {
    /**
     * The token required to retrieve the next set of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * Information about the Scheduled Instances.
     */
    ScheduledInstanceSet?: ScheduledInstanceSet;
  }
  export interface DescribeSecurityGroupReferencesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more security group IDs in your account.
     */
    GroupId: GroupIds;
  }
  export interface DescribeSecurityGroupReferencesResult {
    /**
     * Information about the VPCs with the referencing security groups.
     */
    SecurityGroupReferenceSet?: SecurityGroupReferences;
  }
  export interface DescribeSecurityGroupsRequest {
    /**
     * One or more filters. If using multiple filters for rules, the results include security groups for which any combination of rules - not necessarily a single rule - match all filters.    description - The description of the security group.    egress.ip-permission.cidr - An IPv4 CIDR block for an outbound security group rule.    egress.ip-permission.from-port - For an outbound rule, the start of port range for the TCP and UDP protocols, or an ICMP type number.    egress.ip-permission.group-id - The ID of a security group that has been referenced in an outbound security group rule.    egress.ip-permission.group-name - The name of a security group that has been referenced in an outbound security group rule.    egress.ip-permission.ipv6-cidr - An IPv6 CIDR block for an outbound security group rule.    egress.ip-permission.prefix-list-id - The ID (prefix) of the AWS service to which a security group rule allows outbound access.    egress.ip-permission.protocol - The IP protocol for an outbound security group rule (tcp | udp | icmp or a protocol number).    egress.ip-permission.to-port - For an outbound rule, the end of port range for the TCP and UDP protocols, or an ICMP code.    egress.ip-permission.user-id - The ID of an AWS account that has been referenced in an outbound security group rule.    group-id - The ID of the security group.     group-name - The name of the security group.    ip-permission.cidr - An IPv4 CIDR block for an inbound security group rule.    ip-permission.from-port - For an inbound rule, the start of port range for the TCP and UDP protocols, or an ICMP type number.    ip-permission.group-id - The ID of a security group that has been referenced in an inbound security group rule.    ip-permission.group-name - The name of a security group that has been referenced in an inbound security group rule.    ip-permission.ipv6-cidr - An IPv6 CIDR block for an inbound security group rule.    ip-permission.prefix-list-id - The ID (prefix) of the AWS service from which a security group rule allows inbound access.    ip-permission.protocol - The IP protocol for an inbound security group rule (tcp | udp | icmp or a protocol number).    ip-permission.to-port - For an inbound rule, the end of port range for the TCP and UDP protocols, or an ICMP code.    ip-permission.user-id - The ID of an AWS account that has been referenced in an inbound security group rule.    owner-id - The AWS account ID of the owner of the security group.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC specified when the security group was created.  
     */
    Filters?: FilterList;
    /**
     * One or more security group IDs. Required for security groups in a nondefault VPC. Default: Describes all your security groups.
     */
    GroupIds?: GroupIdStringList;
    /**
     * [EC2-Classic and default VPC only] One or more security group names. You can specify either the security group name or the security group ID. For security groups in a nondefault VPC, use the group-name filter to describe security groups by name. Default: Describes all your security groups.
     */
    GroupNames?: GroupNameStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another request with the returned NextToken value. This value can be between 5 and 1000. If this parameter is not specified, then all results are returned.
     */
    MaxResults?: Integer;
  }
  export interface DescribeSecurityGroupsResult {
    /**
     * Information about one or more security groups.
     */
    SecurityGroups?: SecurityGroupList;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeSnapshotAttributeRequest {
    /**
     * The snapshot attribute you would like to view.
     */
    Attribute: SnapshotAttributeName;
    /**
     * The ID of the EBS snapshot.
     */
    SnapshotId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeSnapshotAttributeResult {
    /**
     * A list of permissions for creating volumes from the snapshot.
     */
    CreateVolumePermissions?: CreateVolumePermissionList;
    /**
     * A list of product codes.
     */
    ProductCodes?: ProductCodeList;
    /**
     * The ID of the EBS snapshot.
     */
    SnapshotId?: String;
  }
  export interface DescribeSnapshotsRequest {
    /**
     * One or more filters.    description - A description of the snapshot.    owner-alias - Value from an Amazon-maintained list (amazon | aws-marketplace | microsoft) of snapshot owners. Not to be confused with the user-configured AWS account alias, which is set from the IAM console.    owner-id - The ID of the AWS account that owns the snapshot.    progress - The progress of the snapshot, as a percentage (for example, 80%).    snapshot-id - The snapshot ID.    start-time - The time stamp when the snapshot was initiated.    status - The status of the snapshot (pending | completed | error).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    volume-id - The ID of the volume the snapshot is for.    volume-size - The size of the volume, in GiB.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of snapshot results returned by DescribeSnapshots in paginated output. When this parameter is used, DescribeSnapshots only returns MaxResults results in a single page along with a NextToken response element. The remaining results of the initial request can be seen by sending another DescribeSnapshots request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value larger than 1000, only 1000 results are returned. If this parameter is not used, then DescribeSnapshots returns all results. You cannot specify this parameter and the snapshot IDs parameter in the same request.
     */
    MaxResults?: Integer;
    /**
     * The NextToken value returned from a previous paginated DescribeSnapshots request where MaxResults was used and the results exceeded the value of that parameter. Pagination continues from the end of the previous results that returned the NextToken value. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * Returns the snapshots owned by the specified owner. Multiple owners can be specified.
     */
    OwnerIds?: OwnerStringList;
    /**
     * One or more AWS accounts IDs that can create volumes from the snapshot.
     */
    RestorableByUserIds?: RestorableByStringList;
    /**
     * One or more snapshot IDs. Default: Describes snapshots for which you have launch permissions.
     */
    SnapshotIds?: SnapshotIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeSnapshotsResult {
    /**
     * Information about the snapshots.
     */
    Snapshots?: SnapshotList;
    /**
     * The NextToken value to include in a future DescribeSnapshots request. When the results of a DescribeSnapshots request exceed MaxResults, this value can be used to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeSpotDatafeedSubscriptionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeSpotDatafeedSubscriptionResult {
    /**
     * The Spot Instance data feed subscription.
     */
    SpotDatafeedSubscription?: SpotDatafeedSubscription;
  }
  export interface DescribeSpotFleetInstancesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
  }
  export interface DescribeSpotFleetInstancesResponse {
    /**
     * The running instances. This list is refreshed periodically and might be out of date.
     */
    ActiveInstances: ActiveInstanceSet;
    /**
     * The token required to retrieve the next set of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
  }
  export interface DescribeSpotFleetRequestHistoryRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The type of events to describe. By default, all events are described.
     */
    EventType?: EventType;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
    /**
     * The starting date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    StartTime: DateTime;
  }
  export interface DescribeSpotFleetRequestHistoryResponse {
    /**
     * Information about the events in the history of the Spot Fleet request.
     */
    HistoryRecords: HistoryRecords;
    /**
     * The last date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). All records up to this time were retrieved. If nextToken indicates that there are more results, this value is not present.
     */
    LastEvaluatedTime: DateTime;
    /**
     * The token required to retrieve the next set of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
    /**
     * The starting date and time for the events, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    StartTime: DateTime;
  }
  export interface DescribeSpotFleetRequestsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * The IDs of the Spot Fleet requests.
     */
    SpotFleetRequestIds?: ValueStringList;
  }
  export interface DescribeSpotFleetRequestsResponse {
    /**
     * The token required to retrieve the next set of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * Information about the configuration of your Spot Fleet.
     */
    SpotFleetRequestConfigs: SpotFleetRequestConfigSet;
  }
  export interface DescribeSpotInstanceRequestsRequest {
    /**
     * One or more filters.    availability-zone-group - The Availability Zone group.    create-time - The time stamp when the Spot Instance request was created.    fault-code - The fault code related to the request.    fault-message - The fault message related to the request.    instance-id - The ID of the instance that fulfilled the request.    launch-group - The Spot Instance launch group.    launch.block-device-mapping.delete-on-termination - Indicates whether the EBS volume is deleted on instance termination.    launch.block-device-mapping.device-name - The device name for the volume in the block device mapping (for example, /dev/sdh or xvdh).    launch.block-device-mapping.snapshot-id - The ID of the snapshot for the EBS volume.    launch.block-device-mapping.volume-size - The size of the EBS volume, in GiB.    launch.block-device-mapping.volume-type - The type of EBS volume: gp2 for General Purpose SSD, io1 for Provisioned IOPS SSD, st1 for Throughput Optimized HDD, sc1for Cold HDD, or standard for Magnetic.    launch.group-id - The ID of the security group for the instance.    launch.group-name - The name of the security group for the instance.    launch.image-id - The ID of the AMI.    launch.instance-type - The type of instance (for example, m3.medium).    launch.kernel-id - The kernel ID.    launch.key-name - The name of the key pair the instance launched with.    launch.monitoring-enabled - Whether detailed monitoring is enabled for the Spot Instance.    launch.ramdisk-id - The RAM disk ID.    launched-availability-zone - The Availability Zone in which the request is launched.    network-interface.addresses.primary - Indicates whether the IP address is the primary private IP address.    network-interface.delete-on-termination - Indicates whether the network interface is deleted when the instance is terminated.    network-interface.description - A description of the network interface.    network-interface.device-index - The index of the device for the network interface attachment on the instance.    network-interface.group-id - The ID of the security group associated with the network interface.    network-interface.network-interface-id - The ID of the network interface.    network-interface.private-ip-address - The primary private IP address of the network interface.    network-interface.subnet-id - The ID of the subnet for the instance.    product-description - The product description associated with the instance (Linux/UNIX | Windows).    spot-instance-request-id - The Spot Instance request ID.    spot-price - The maximum hourly price for any Spot Instance launched to fulfill the request.    state - The state of the Spot Instance request (open | active | closed | cancelled | failed). Spot request status information can help you track your Amazon EC2 Spot Instance requests. For more information, see Spot Request Status in the Amazon EC2 User Guide for Linux Instances.    status-code - The short code describing the most recent evaluation of your Spot Instance request.    status-message - The message explaining the status of the Spot Instance request.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    type - The type of Spot Instance request (one-time | persistent).    valid-from - The start date of the request.    valid-until - The end date of the request.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more Spot Instance request IDs.
     */
    SpotInstanceRequestIds?: SpotInstanceRequestIdList;
  }
  export interface DescribeSpotInstanceRequestsResult {
    /**
     * One or more Spot Instance requests.
     */
    SpotInstanceRequests?: SpotInstanceRequestList;
  }
  export interface DescribeSpotPriceHistoryRequest {
    /**
     * One or more filters.    availability-zone - The Availability Zone for which prices should be returned.    instance-type - The type of instance (for example, m3.medium).    product-description - The product description for the Spot price (Linux/UNIX | SUSE Linux | Windows | Linux/UNIX (Amazon VPC) | SUSE Linux (Amazon VPC) | Windows (Amazon VPC)).    spot-price - The Spot price. The value must match exactly (or use wildcards; greater than or less than comparison is not supported).    timestamp - The time stamp of the Spot price history, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). You can use wildcards (* and ?). Greater than or less than comparison is not supported.  
     */
    Filters?: FilterList;
    /**
     * Filters the results by the specified Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The date and time, up to the current date, from which to stop retrieving the price history data, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    EndTime?: DateTime;
    /**
     * Filters the results by the specified instance types.
     */
    InstanceTypes?: InstanceTypeList;
    /**
     * The maximum number of results to return in a single call. Specify a value between 1 and 1000. The default value is 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of results.
     */
    NextToken?: String;
    /**
     * Filters the results by the specified basic product descriptions.
     */
    ProductDescriptions?: ProductDescriptionList;
    /**
     * The date and time, up to the past 90 days, from which to start retrieving the price history data, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    StartTime?: DateTime;
  }
  export interface DescribeSpotPriceHistoryResult {
    /**
     * The token required to retrieve the next set of results. This value is null or an empty string when there are no more results to return.
     */
    NextToken?: String;
    /**
     * The historical Spot prices.
     */
    SpotPriceHistory?: SpotPriceHistoryList;
  }
  export interface DescribeStaleSecurityGroupsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results.
     */
    MaxResults?: MaxResults;
    /**
     * The token for the next set of items to return. (You received this token from a prior call.)
     */
    NextToken?: NextToken;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface DescribeStaleSecurityGroupsResult {
    /**
     * The token to use when requesting the next set of items. If there are no additional items to return, the string is empty.
     */
    NextToken?: String;
    /**
     * Information about the stale security groups.
     */
    StaleSecurityGroupSet?: StaleSecurityGroupSet;
  }
  export interface DescribeSubnetsRequest {
    /**
     * One or more filters.    availabilityZone - The Availability Zone for the subnet. You can also use availability-zone as the filter name.    available-ip-address-count - The number of IPv4 addresses in the subnet that are available.    cidrBlock - The IPv4 CIDR block of the subnet. The CIDR block you specify must exactly match the subnet's CIDR block for information to be returned for the subnet. You can also use cidr or cidr-block as the filter names.    defaultForAz - Indicates whether this is the default subnet for the Availability Zone. You can also use default-for-az as the filter name.    ipv6-cidr-block-association.ipv6-cidr-block - An IPv6 CIDR block associated with the subnet.    ipv6-cidr-block-association.association-id - An association ID for an IPv6 CIDR block associated with the subnet.    ipv6-cidr-block-association.state - The state of an IPv6 CIDR block associated with the subnet.    state - The state of the subnet (pending | available).    subnet-id - The ID of the subnet.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC for the subnet.  
     */
    Filters?: FilterList;
    /**
     * One or more subnet IDs. Default: Describes all your subnets.
     */
    SubnetIds?: SubnetIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeSubnetsResult {
    /**
     * Information about one or more subnets.
     */
    Subnets?: SubnetList;
  }
  export interface DescribeTagsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    key - The tag key.    resource-id - The ID of the resource.    resource-type - The resource type (customer-gateway | dedicated-host | dhcp-options | elastic-ip | fleet | fpga-image | image | instance | internet-gateway | launch-template | natgateway | network-acl | network-interface | reserved-instances | route-table | security-group | snapshot | spot-instances-request | subnet | volume | vpc | vpc-peering-connection | vpn-connection | vpn-gateway).    tag:&lt;key&gt; - The key/value combination of the tag. For example, specify "tag:Owner" for the filter name and "TeamA" for the filter value to find resources with the tag "Owner=TeamA".    value - The tag value.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return in a single call. This value can be between 5 and 1000. To retrieve the remaining results, make another call with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeTagsResult {
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * The tags.
     */
    Tags?: TagDescriptionList;
  }
  export interface DescribeVolumeAttributeRequest {
    /**
     * The attribute of the volume. This parameter is required.
     */
    Attribute: VolumeAttributeName;
    /**
     * The ID of the volume.
     */
    VolumeId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVolumeAttributeResult {
    /**
     * The state of autoEnableIO attribute.
     */
    AutoEnableIO?: AttributeBooleanValue;
    /**
     * A list of product codes.
     */
    ProductCodes?: ProductCodeList;
    /**
     * The ID of the volume.
     */
    VolumeId?: String;
  }
  export interface DescribeVolumeStatusRequest {
    /**
     * One or more filters.    action.code - The action code for the event (for example, enable-volume-io).    action.description - A description of the action.    action.event-id - The event ID associated with the action.    availability-zone - The Availability Zone of the instance.    event.description - A description of the event.    event.event-id - The event ID.    event.event-type - The event type (for io-enabled: passed | failed; for io-performance: io-performance:degraded | io-performance:severely-degraded | io-performance:stalled).    event.not-after - The latest end time for the event.    event.not-before - The earliest start time for the event.    volume-status.details-name - The cause for volume-status.status (io-enabled | io-performance).    volume-status.details-status - The status of volume-status.details-name (for io-enabled: passed | failed; for io-performance: normal | degraded | severely-degraded | stalled).    volume-status.status - The status of the volume (ok | impaired | warning | insufficient-data).  
     */
    Filters?: FilterList;
    /**
     * The maximum number of volume results returned by DescribeVolumeStatus in paginated output. When this parameter is used, the request only returns MaxResults results in a single page along with a NextToken response element. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value larger than 1000, only 1000 results are returned. If this parameter is not used, then DescribeVolumeStatus returns all results. You cannot specify this parameter and the volume IDs parameter in the same request.
     */
    MaxResults?: Integer;
    /**
     * The NextToken value to include in a future DescribeVolumeStatus request. When the results of the request exceed MaxResults, this value can be used to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * One or more volume IDs. Default: Describes all your volumes.
     */
    VolumeIds?: VolumeIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVolumeStatusResult {
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
    /**
     * A list of volumes.
     */
    VolumeStatuses?: VolumeStatusList;
  }
  export interface DescribeVolumesModificationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more volume IDs for which in-progress modifications will be described.
     */
    VolumeIds?: VolumeIdStringList;
    /**
     * One or more filters. Supported filters: volume-id, modification-state, target-size, target-iops, target-volume-type, original-size, original-iops, original-volume-type, start-time. 
     */
    Filters?: FilterList;
    /**
     * The nextToken value returned by a previous paginated request.
     */
    NextToken?: String;
    /**
     * The maximum number of results (up to a limit of 500) to be returned in a paginated request.
     */
    MaxResults?: Integer;
  }
  export interface DescribeVolumesModificationsResult {
    /**
     * A list of returned VolumeModification objects.
     */
    VolumesModifications?: VolumeModificationList;
    /**
     * Token for pagination, null if there are no more results 
     */
    NextToken?: String;
  }
  export interface DescribeVolumesRequest {
    /**
     * One or more filters.    attachment.attach-time - The time stamp when the attachment initiated.    attachment.delete-on-termination - Whether the volume is deleted on instance termination.    attachment.device - The device name specified in the block device mapping (for example, /dev/sda1).    attachment.instance-id - The ID of the instance the volume is attached to.    attachment.status - The attachment state (attaching | attached | detaching).    availability-zone - The Availability Zone in which the volume was created.    create-time - The time stamp when the volume was created.    encrypted - The encryption status of the volume.    size - The size of the volume, in GiB.    snapshot-id - The snapshot from which the volume was created.    status - The status of the volume (creating | available | in-use | deleting | deleted | error).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    volume-id - The volume ID.    volume-type - The Amazon EBS volume type. This can be gp2 for General Purpose SSD, io1 for Provisioned IOPS SSD, st1 for Throughput Optimized HDD, sc1 for Cold HDD, or standard for Magnetic volumes.  
     */
    Filters?: FilterList;
    /**
     * One or more volume IDs.
     */
    VolumeIds?: VolumeIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of volume results returned by DescribeVolumes in paginated output. When this parameter is used, DescribeVolumes only returns MaxResults results in a single page along with a NextToken response element. The remaining results of the initial request can be seen by sending another DescribeVolumes request with the returned NextToken value. This value can be between 5 and 500; if MaxResults is given a value larger than 500, only 500 results are returned. If this parameter is not used, then DescribeVolumes returns all results. You cannot specify this parameter and the volume IDs parameter in the same request.
     */
    MaxResults?: Integer;
    /**
     * The NextToken value returned from a previous paginated DescribeVolumes request where MaxResults was used and the results exceeded the value of that parameter. Pagination continues from the end of the previous results that returned the NextToken value. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVolumesResult {
    /**
     * Information about the volumes.
     */
    Volumes?: VolumeList;
    /**
     * The NextToken value to include in a future DescribeVolumes request. When the results of a DescribeVolumes request exceed MaxResults, this value can be used to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVpcAttributeRequest {
    /**
     * The VPC attribute.
     */
    Attribute: VpcAttributeName;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVpcAttributeResult {
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
    /**
     * Indicates whether the instances launched in the VPC get DNS hostnames. If this attribute is true, instances in the VPC get DNS hostnames; otherwise, they do not.
     */
    EnableDnsHostnames?: AttributeBooleanValue;
    /**
     * Indicates whether DNS resolution is enabled for the VPC. If this attribute is true, the Amazon DNS server resolves DNS hostnames for your instances to their corresponding IP addresses; otherwise, it does not.
     */
    EnableDnsSupport?: AttributeBooleanValue;
  }
  export interface DescribeVpcClassicLinkDnsSupportRequest {
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results.
     */
    MaxResults?: MaxResults;
    /**
     * The token for the next set of items to return. (You received this token from a prior call.)
     */
    NextToken?: NextToken;
    /**
     * One or more VPC IDs.
     */
    VpcIds?: VpcClassicLinkIdList;
  }
  export interface DescribeVpcClassicLinkDnsSupportResult {
    /**
     * The token to use when requesting the next set of items.
     */
    NextToken?: NextToken;
    /**
     * Information about the ClassicLink DNS support status of the VPCs.
     */
    Vpcs?: ClassicLinkDnsSupportList;
  }
  export interface DescribeVpcClassicLinkRequest {
    /**
     * One or more filters.    is-classic-link-enabled - Whether the VPC is enabled for ClassicLink (true | false).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more VPCs for which you want to describe the ClassicLink status.
     */
    VpcIds?: VpcClassicLinkIdList;
  }
  export interface DescribeVpcClassicLinkResult {
    /**
     * The ClassicLink status of one or more VPCs.
     */
    Vpcs?: VpcClassicLinkList;
  }
  export interface DescribeVpcEndpointConnectionNotificationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the notification.
     */
    ConnectionNotificationId?: String;
    /**
     * One or more filters.    connection-notification-arn - The ARN of SNS topic for the notification.    connection-notification-id - The ID of the notification.    connection-notification-state - The state of the notification (Enabled | Disabled).    connection-notification-type - The type of notification (Topic).    service-id - The ID of the endpoint service.    vpc-endpoint-id - The ID of the VPC endpoint.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return in a single call. To retrieve the remaining results, make another request with the returned NextToken value.
     */
    MaxResults?: Integer;
    /**
     * The token to request the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointConnectionNotificationsResult {
    /**
     * One or more notifications.
     */
    ConnectionNotificationSet?: ConnectionNotificationSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointConnectionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more filters.    service-id - The ID of the service.    vpc-endpoint-owner - The AWS account number of the owner of the endpoint.    vpc-endpoint-state - The state of the endpoint (pendingAcceptance | pending | available | deleting | deleted | rejected | failed).    vpc-endpoint-id - The ID of the endpoint.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value larger than 1000, only 1000 results are returned.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointConnectionsResult {
    /**
     * Information about one or more VPC endpoint connections.
     */
    VpcEndpointConnections?: VpcEndpointConnectionSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServiceConfigurationsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of one or more services.
     */
    ServiceIds?: ValueStringList;
    /**
     * One or more filters.    service-name - The name of the service.    service-id - The ID of the service.    service-state - The state of the service (Pending | Available | Deleting | Deleted | Failed).   
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value larger than 1000, only 1000 results are returned.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServiceConfigurationsResult {
    /**
     * Information about one or more services.
     */
    ServiceConfigurations?: ServiceConfigurationSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServicePermissionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the service.
     */
    ServiceId: String;
    /**
     * One or more filters.    principal - The ARN of the principal.    principal-type - The principal type (All | Service | OrganizationUnit | Account | User | Role).  
     */
    Filters?: FilterList;
    /**
     * The maximum number of results to return for the request in a single page. The remaining results of the initial request can be seen by sending another request with the returned NextToken value. This value can be between 5 and 1000; if MaxResults is given a value larger than 1000, only 1000 results are returned.
     */
    MaxResults?: Integer;
    /**
     * The token to retrieve the next page of results.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServicePermissionsResult {
    /**
     * Information about one or more allowed principals.
     */
    AllowedPrincipals?: AllowedPrincipalSet;
    /**
     * The token to use to retrieve the next page of results. This value is null when there are no more results to return.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServicesRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more service names.
     */
    ServiceNames?: ValueStringList;
    /**
     * One or more filters.    service-name: The name of the service.  
     */
    Filters?: FilterList;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results. Constraint: If the value is greater than 1000, we return only 1000 items.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of items to return. (You received this token from a prior call.)
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointServicesResult {
    /**
     * A list of supported services.
     */
    ServiceNames?: ValueStringList;
    /**
     * Information about the service.
     */
    ServiceDetails?: ServiceDetailSet;
    /**
     * The token to use when requesting the next set of items. If there are no additional items to return, the string is empty.
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more endpoint IDs.
     */
    VpcEndpointIds?: ValueStringList;
    /**
     * One or more filters.    service-name: The name of the service.    vpc-id: The ID of the VPC in which the endpoint resides.    vpc-endpoint-id: The ID of the endpoint.    vpc-endpoint-state: The state of the endpoint. (pending | available | deleting | deleted)  
     */
    Filters?: FilterList;
    /**
     * The maximum number of items to return for this request. The request returns a token that you can specify in a subsequent call to get the next set of results. Constraint: If the value is greater than 1000, we return only 1000 items.
     */
    MaxResults?: Integer;
    /**
     * The token for the next set of items to return. (You received this token from a prior call.)
     */
    NextToken?: String;
  }
  export interface DescribeVpcEndpointsResult {
    /**
     * Information about the endpoints.
     */
    VpcEndpoints?: VpcEndpointSet;
    /**
     * The token to use when requesting the next set of items. If there are no additional items to return, the string is empty.
     */
    NextToken?: String;
  }
  export interface DescribeVpcPeeringConnectionsRequest {
    /**
     * One or more filters.    accepter-vpc-info.cidr-block - The IPv4 CIDR block of the accepter VPC.    accepter-vpc-info.owner-id - The AWS account ID of the owner of the accepter VPC.    accepter-vpc-info.vpc-id - The ID of the accepter VPC.    expiration-time - The expiration date and time for the VPC peering connection.    requester-vpc-info.cidr-block - The IPv4 CIDR block of the requester's VPC.    requester-vpc-info.owner-id - The AWS account ID of the owner of the requester VPC.    requester-vpc-info.vpc-id - The ID of the requester VPC.    status-code - The status of the VPC peering connection (pending-acceptance | failed | expired | provisioning | active | deleting | deleted | rejected).    status-message - A message that provides more information about the status of the VPC peering connection, if applicable.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-peering-connection-id - The ID of the VPC peering connection.  
     */
    Filters?: FilterList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more VPC peering connection IDs. Default: Describes all your VPC peering connections.
     */
    VpcPeeringConnectionIds?: ValueStringList;
  }
  export interface DescribeVpcPeeringConnectionsResult {
    /**
     * Information about the VPC peering connections.
     */
    VpcPeeringConnections?: VpcPeeringConnectionList;
  }
  export interface DescribeVpcsRequest {
    /**
     * One or more filters.    cidr - The primary IPv4 CIDR block of the VPC. The CIDR block you specify must exactly match the VPC's CIDR block for information to be returned for the VPC. Must contain the slash followed by one or two digits (for example, /28).    cidr-block-association.cidr-block - An IPv4 CIDR block associated with the VPC.    cidr-block-association.association-id - The association ID for an IPv4 CIDR block associated with the VPC.    cidr-block-association.state - The state of an IPv4 CIDR block associated with the VPC.    dhcp-options-id - The ID of a set of DHCP options.    ipv6-cidr-block-association.ipv6-cidr-block - An IPv6 CIDR block associated with the VPC.    ipv6-cidr-block-association.association-id - The association ID for an IPv6 CIDR block associated with the VPC.    ipv6-cidr-block-association.state - The state of an IPv6 CIDR block associated with the VPC.    isDefault - Indicates whether the VPC is the default VPC.    state - The state of the VPC (pending | available).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    vpc-id - The ID of the VPC.  
     */
    Filters?: FilterList;
    /**
     * One or more VPC IDs. Default: Describes all your VPCs.
     */
    VpcIds?: VpcIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVpcsResult {
    /**
     * Information about one or more VPCs.
     */
    Vpcs?: VpcList;
  }
  export interface DescribeVpnConnectionsRequest {
    /**
     * One or more filters.    customer-gateway-configuration - The configuration information for the customer gateway.    customer-gateway-id - The ID of a customer gateway associated with the VPN connection.    state - The state of the VPN connection (pending | available | deleting | deleted).    option.static-routes-only - Indicates whether the connection has static routes only. Used for devices that do not support Border Gateway Protocol (BGP).    route.destination-cidr-block - The destination CIDR block. This corresponds to the subnet used in a customer data center.    bgp-asn - The BGP Autonomous System Number (ASN) associated with a BGP device.    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    type - The type of VPN connection. Currently the only supported type is ipsec.1.    vpn-connection-id - The ID of the VPN connection.    vpn-gateway-id - The ID of a virtual private gateway associated with the VPN connection.  
     */
    Filters?: FilterList;
    /**
     * One or more VPN connection IDs. Default: Describes your VPN connections.
     */
    VpnConnectionIds?: VpnConnectionIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVpnConnectionsResult {
    /**
     * Information about one or more VPN connections.
     */
    VpnConnections?: VpnConnectionList;
  }
  export interface DescribeVpnGatewaysRequest {
    /**
     * One or more filters.    amazon-side-asn - The Autonomous System Number (ASN) for the Amazon side of the gateway.    attachment.state - The current state of the attachment between the gateway and the VPC (attaching | attached | detaching | detached).    attachment.vpc-id - The ID of an attached VPC.    availability-zone - The Availability Zone for the virtual private gateway (if applicable).    state - The state of the virtual private gateway (pending | available | deleting | deleted).    tag:&lt;key&gt; - The key/value combination of a tag assigned to the resource. Use the tag key in the filter name and the tag value as the filter value. For example, to find all resources that have a tag with the key Owner and the value TeamA, specify tag:Owner for the filter name and TeamA for the filter value.    tag-key - The key of a tag assigned to the resource. Use this filter to find all resources assigned a tag with a specific key, regardless of the tag value.    type - The type of virtual private gateway. Currently the only supported type is ipsec.1.    vpn-gateway-id - The ID of the virtual private gateway.  
     */
    Filters?: FilterList;
    /**
     * One or more virtual private gateway IDs. Default: Describes all your virtual private gateways.
     */
    VpnGatewayIds?: VpnGatewayIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DescribeVpnGatewaysResult {
    /**
     * Information about one or more virtual private gateways.
     */
    VpnGateways?: VpnGatewayList;
  }
  export interface DetachClassicLinkVpcRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance to unlink from the VPC.
     */
    InstanceId: String;
    /**
     * The ID of the VPC to which the instance is linked.
     */
    VpcId: String;
  }
  export interface DetachClassicLinkVpcResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface DetachInternetGatewayRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the internet gateway.
     */
    InternetGatewayId: String;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface DetachNetworkInterfaceRequest {
    /**
     * The ID of the attachment.
     */
    AttachmentId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Specifies whether to force a detachment.
     */
    Force?: Boolean;
  }
  export interface DetachVolumeRequest {
    /**
     * The device name.
     */
    Device?: String;
    /**
     * Forces detachment if the previous detachment attempt did not occur cleanly (for example, logging into an instance, unmounting the volume, and detaching normally). This option can lead to data loss or a corrupted file system. Use this option only as a last resort to detach a volume from a failed instance. The instance won't have an opportunity to flush file system caches or file system metadata. If you use this option, you must perform file system check and repair procedures.
     */
    Force?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The ID of the volume.
     */
    VolumeId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DetachVpnGatewayRequest {
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * The ID of the virtual private gateway.
     */
    VpnGatewayId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export type DeviceType = "ebs"|"instance-store"|string;
  export interface DhcpConfiguration {
    /**
     * The name of a DHCP option.
     */
    Key?: String;
    /**
     * One or more values for the DHCP option.
     */
    Values?: DhcpConfigurationValueList;
  }
  export type DhcpConfigurationList = DhcpConfiguration[];
  export type DhcpConfigurationValueList = AttributeValue[];
  export interface DhcpOptions {
    /**
     * One or more DHCP options in the set.
     */
    DhcpConfigurations?: DhcpConfigurationList;
    /**
     * The ID of the set of DHCP options.
     */
    DhcpOptionsId?: String;
    /**
     * Any tags assigned to the DHCP options set.
     */
    Tags?: TagList;
  }
  export type DhcpOptionsIdStringList = String[];
  export type DhcpOptionsList = DhcpOptions[];
  export interface DisableVgwRoutePropagationRequest {
    /**
     * The ID of the virtual private gateway.
     */
    GatewayId: String;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
  }
  export interface DisableVpcClassicLinkDnsSupportRequest {
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface DisableVpcClassicLinkDnsSupportResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface DisableVpcClassicLinkRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface DisableVpcClassicLinkResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface DisassociateAddressRequest {
    /**
     * [EC2-VPC] The association ID. Required for EC2-VPC.
     */
    AssociationId?: String;
    /**
     * [EC2-Classic] The Elastic IP address. Required for EC2-Classic.
     */
    PublicIp?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DisassociateIamInstanceProfileRequest {
    /**
     * The ID of the IAM instance profile association.
     */
    AssociationId: String;
  }
  export interface DisassociateIamInstanceProfileResult {
    /**
     * Information about the IAM instance profile association.
     */
    IamInstanceProfileAssociation?: IamInstanceProfileAssociation;
  }
  export interface DisassociateRouteTableRequest {
    /**
     * The association ID representing the current association between the route table and subnet.
     */
    AssociationId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface DisassociateSubnetCidrBlockRequest {
    /**
     * The association ID for the CIDR block.
     */
    AssociationId: String;
  }
  export interface DisassociateSubnetCidrBlockResult {
    /**
     * Information about the IPv6 CIDR block association.
     */
    Ipv6CidrBlockAssociation?: SubnetIpv6CidrBlockAssociation;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
  }
  export interface DisassociateVpcCidrBlockRequest {
    /**
     * The association ID for the CIDR block.
     */
    AssociationId: String;
  }
  export interface DisassociateVpcCidrBlockResult {
    /**
     * Information about the IPv6 CIDR block association.
     */
    Ipv6CidrBlockAssociation?: VpcIpv6CidrBlockAssociation;
    /**
     * Information about the IPv4 CIDR block association.
     */
    CidrBlockAssociation?: VpcCidrBlockAssociation;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface DiskImage {
    /**
     * A description of the disk image.
     */
    Description?: String;
    /**
     * Information about the disk image.
     */
    Image?: DiskImageDetail;
    /**
     * Information about the volume.
     */
    Volume?: VolumeDetail;
  }
  export interface DiskImageDescription {
    /**
     * The checksum computed for the disk image.
     */
    Checksum?: String;
    /**
     * The disk image format.
     */
    Format?: DiskImageFormat;
    /**
     * A presigned URL for the import manifest stored in Amazon S3. For information about creating a presigned URL for an Amazon S3 object, read the "Query String Request Authentication Alternative" section of the Authenticating REST Requests topic in the Amazon Simple Storage Service Developer Guide. For information about the import manifest referenced by this API action, see VM Import Manifest.
     */
    ImportManifestUrl?: String;
    /**
     * The size of the disk image, in GiB.
     */
    Size?: Long;
  }
  export interface DiskImageDetail {
    /**
     * The size of the disk image, in GiB.
     */
    Bytes: Long;
    /**
     * The disk image format.
     */
    Format: DiskImageFormat;
    /**
     * A presigned URL for the import manifest stored in Amazon S3 and presented here as an Amazon S3 presigned URL. For information about creating a presigned URL for an Amazon S3 object, read the "Query String Request Authentication Alternative" section of the Authenticating REST Requests topic in the Amazon Simple Storage Service Developer Guide. For information about the import manifest referenced by this API action, see VM Import Manifest.
     */
    ImportManifestUrl: String;
  }
  export type DiskImageFormat = "VMDK"|"RAW"|"VHD"|string;
  export type DiskImageList = DiskImage[];
  export interface DiskImageVolumeDescription {
    /**
     * The volume identifier.
     */
    Id?: String;
    /**
     * The size of the volume, in GiB.
     */
    Size?: Long;
  }
  export interface DnsEntry {
    /**
     * The DNS name.
     */
    DnsName?: String;
    /**
     * The ID of the private hosted zone.
     */
    HostedZoneId?: String;
  }
  export type DnsEntrySet = DnsEntry[];
  export type DomainType = "vpc"|"standard"|string;
  export type Double = number;
  export interface EbsBlockDevice {
    /**
     * Indicates whether the EBS volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The number of I/O operations per second (IOPS) that the volume supports. For io1, this represents the number of IOPS that are provisioned for the volume. For gp2, this represents the baseline performance of the volume and the rate at which the volume accumulates I/O credits for bursting. For more information about General Purpose SSD baseline performance, I/O credits, and bursting, see Amazon EBS Volume Types in the Amazon Elastic Compute Cloud User Guide. Constraint: Range is 100-20000 IOPS for io1 volumes and 100-10000 IOPS for gp2 volumes. Condition: This parameter is required for requests to create io1 volumes; it is not used in requests to create gp2, st1, sc1, or standard volumes.
     */
    Iops?: Integer;
    /**
     * The ID of the snapshot.
     */
    SnapshotId?: String;
    /**
     * The size of the volume, in GiB. Constraints: 1-16384 for General Purpose SSD (gp2), 4-16384 for Provisioned IOPS SSD (io1), 500-16384 for Throughput Optimized HDD (st1), 500-16384 for Cold HDD (sc1), and 1-1024 for Magnetic (standard) volumes. If you specify a snapshot, the volume size must be equal to or larger than the snapshot size. Default: If you're creating the volume from a snapshot and don't specify a volume size, the default is the snapshot size.
     */
    VolumeSize?: Integer;
    /**
     * The volume type: gp2, io1, st1, sc1, or standard. Default: standard 
     */
    VolumeType?: VolumeType;
    /**
     * Indicates whether the EBS volume is encrypted. Encrypted volumes can only be attached to instances that support Amazon EBS encryption.  If you are creating a volume from a snapshot, you cannot specify an encryption value. This is because only blank volumes can be encrypted on creation. If you are creating a snapshot from an existing EBS volume, you cannot specify an encryption value that differs from that of the EBS volume. We recommend that you omit the encryption value from the block device mappings when creating an image from an instance.
     */
    Encrypted?: Boolean;
    /**
     * Identifier (key ID, key alias, ID ARN, or alias ARN) for a user-managed CMK under which the EBS volume is encrypted. This parameter is only supported on BlockDeviceMapping objects called by RunInstances, RequestSpotFleet, and RequestSpotInstances.
     */
    KmsKeyId?: String;
  }
  export interface EbsInstanceBlockDevice {
    /**
     * The time stamp when the attachment initiated.
     */
    AttachTime?: DateTime;
    /**
     * Indicates whether the volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The attachment state.
     */
    Status?: AttachmentStatus;
    /**
     * The ID of the EBS volume.
     */
    VolumeId?: String;
  }
  export interface EbsInstanceBlockDeviceSpecification {
    /**
     * Indicates whether the volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The ID of the EBS volume.
     */
    VolumeId?: String;
  }
  export interface EgressOnlyInternetGateway {
    /**
     * Information about the attachment of the egress-only internet gateway.
     */
    Attachments?: InternetGatewayAttachmentList;
    /**
     * The ID of the egress-only internet gateway.
     */
    EgressOnlyInternetGatewayId?: EgressOnlyInternetGatewayId;
  }
  export type EgressOnlyInternetGatewayId = string;
  export type EgressOnlyInternetGatewayIdList = EgressOnlyInternetGatewayId[];
  export type EgressOnlyInternetGatewayList = EgressOnlyInternetGateway[];
  export interface ElasticGpuAssociation {
    /**
     * The ID of the Elastic GPU.
     */
    ElasticGpuId?: String;
    /**
     * The ID of the association.
     */
    ElasticGpuAssociationId?: String;
    /**
     * The state of the association between the instance and the Elastic GPU.
     */
    ElasticGpuAssociationState?: String;
    /**
     * The time the Elastic GPU was associated with the instance.
     */
    ElasticGpuAssociationTime?: String;
  }
  export type ElasticGpuAssociationList = ElasticGpuAssociation[];
  export interface ElasticGpuHealth {
    /**
     * The health status.
     */
    Status?: ElasticGpuStatus;
  }
  export type ElasticGpuIdSet = String[];
  export type ElasticGpuSet = ElasticGpus[];
  export interface ElasticGpuSpecification {
    /**
     * The type of Elastic GPU.
     */
    Type: String;
  }
  export type ElasticGpuSpecificationList = ElasticGpuSpecification[];
  export interface ElasticGpuSpecificationResponse {
    /**
     * The elastic GPU type.
     */
    Type?: String;
  }
  export type ElasticGpuSpecificationResponseList = ElasticGpuSpecificationResponse[];
  export type ElasticGpuSpecifications = ElasticGpuSpecification[];
  export type ElasticGpuState = "ATTACHED"|string;
  export type ElasticGpuStatus = "OK"|"IMPAIRED"|string;
  export interface ElasticGpus {
    /**
     * The ID of the Elastic GPU.
     */
    ElasticGpuId?: String;
    /**
     * The Availability Zone in the which the Elastic GPU resides.
     */
    AvailabilityZone?: String;
    /**
     * The type of Elastic GPU.
     */
    ElasticGpuType?: String;
    /**
     * The status of the Elastic GPU.
     */
    ElasticGpuHealth?: ElasticGpuHealth;
    /**
     * The state of the Elastic GPU.
     */
    ElasticGpuState?: ElasticGpuState;
    /**
     * The ID of the instance to which the Elastic GPU is attached.
     */
    InstanceId?: String;
  }
  export interface EnableVgwRoutePropagationRequest {
    /**
     * The ID of the virtual private gateway.
     */
    GatewayId: String;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
  }
  export interface EnableVolumeIORequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the volume.
     */
    VolumeId: String;
  }
  export interface EnableVpcClassicLinkDnsSupportRequest {
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface EnableVpcClassicLinkDnsSupportResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface EnableVpcClassicLinkRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface EnableVpcClassicLinkResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export type EventCode = "instance-reboot"|"system-reboot"|"system-maintenance"|"instance-retirement"|"instance-stop"|string;
  export interface EventInformation {
    /**
     * The description of the event.
     */
    EventDescription?: String;
    /**
     * The event. The following are the error events:    iamFleetRoleInvalid - The Spot Fleet did not have the required permissions either to launch or terminate an instance.    launchSpecTemporarilyBlacklisted - The configuration is not valid and several attempts to launch instances have failed. For more information, see the description of the event.    spotFleetRequestConfigurationInvalid - The configuration is not valid. For more information, see the description of the event.    spotInstanceCountLimitExceeded - You've reached the limit on the number of Spot Instances that you can launch.   The following are the fleetRequestChange events:    active - The Spot Fleet has been validated and Amazon EC2 is attempting to maintain the target number of running Spot Instances.    cancelled - The Spot Fleet is canceled and has no running Spot Instances. The Spot Fleet will be deleted two days after its instances were terminated.    cancelled_running - The Spot Fleet is canceled and does not launch additional Spot Instances. Existing Spot Instances continue to run until they are interrupted or terminated.    cancelled_terminating - The Spot Fleet is canceled and its Spot Instances are terminating.    expired - The Spot Fleet request has expired. A subsequent event indicates that the instances were terminated, if the request was created with TerminateInstancesWithExpiration set.    modify_in_progress - A request to modify the Spot Fleet request was accepted and is in progress.    modify_successful - The Spot Fleet request was modified.    price_update - The price for a launch configuration was adjusted because it was too high. This change is permanent.    submitted - The Spot Fleet request is being evaluated and Amazon EC2 is preparing to launch the target number of Spot Instances.   The following are the instanceChange events:    launched - A request was fulfilled and a new instance was launched.    terminated - An instance was terminated by the user.   The following are the Information events:    launchSpecUnusable - The price in a launch specification is not valid because it is below the Spot price or the Spot price is above the On-Demand price.    fleetProgressHalted - The price in every launch specification is not valid. A launch specification might become valid if the Spot price changes.  
     */
    EventSubType?: String;
    /**
     * The ID of the instance. This information is available only for instanceChange events.
     */
    InstanceId?: String;
  }
  export type EventType = "instanceChange"|"fleetRequestChange"|"error"|string;
  export type ExcessCapacityTerminationPolicy = "noTermination"|"default"|string;
  export type ExecutableByStringList = String[];
  export type ExportEnvironment = "citrix"|"vmware"|"microsoft"|string;
  export interface ExportTask {
    /**
     * A description of the resource being exported.
     */
    Description?: String;
    /**
     * The ID of the export task.
     */
    ExportTaskId?: String;
    /**
     * Information about the export task.
     */
    ExportToS3Task?: ExportToS3Task;
    /**
     * Information about the instance to export.
     */
    InstanceExportDetails?: InstanceExportDetails;
    /**
     * The state of the export task.
     */
    State?: ExportTaskState;
    /**
     * The status message related to the export task.
     */
    StatusMessage?: String;
  }
  export type ExportTaskIdStringList = String[];
  export type ExportTaskList = ExportTask[];
  export type ExportTaskState = "active"|"cancelling"|"cancelled"|"completed"|string;
  export interface ExportToS3Task {
    /**
     * The container format used to combine disk images with metadata (such as OVF). If absent, only the disk image is exported.
     */
    ContainerFormat?: ContainerFormat;
    /**
     * The format for the exported image.
     */
    DiskImageFormat?: DiskImageFormat;
    /**
     * The S3 bucket for the destination image. The destination bucket must exist and grant WRITE and READ_ACP permissions to the AWS account vm-import-export@amazon.com.
     */
    S3Bucket?: String;
    /**
     * The encryption key for your S3 bucket.
     */
    S3Key?: String;
  }
  export interface ExportToS3TaskSpecification {
    /**
     * The container format used to combine disk images with metadata (such as OVF). If absent, only the disk image is exported.
     */
    ContainerFormat?: ContainerFormat;
    /**
     * The format for the exported image.
     */
    DiskImageFormat?: DiskImageFormat;
    /**
     * The S3 bucket for the destination image. The destination bucket must exist and grant WRITE and READ_ACP permissions to the AWS account vm-import-export@amazon.com.
     */
    S3Bucket?: String;
    /**
     * The image is written to a single object in the S3 bucket at the S3 key s3prefix + exportTaskId + '.' + diskImageFormat.
     */
    S3Prefix?: String;
  }
  export interface Filter {
    /**
     * The name of the filter. Filter names are case-sensitive.
     */
    Name?: String;
    /**
     * One or more filter values. Filter values are case-sensitive.
     */
    Values?: ValueStringList;
  }
  export type FilterList = Filter[];
  export type FleetActivityStatus = "error"|"pending-fulfillment"|"pending-termination"|"fulfilled"|string;
  export interface FleetData {
    /**
     * The progress of the EC2 Fleet. If there is an error, the status is error. After all requests are placed, the status is pending_fulfillment. If the size of the EC2 Fleet is equal to or greater than its target capacity, the status is fulfilled. If the size of the EC2 Fleet is decreased, the status is pending_termination while instances are terminating.
     */
    ActivityStatus?: FleetActivityStatus;
    /**
     * The creation date and time of the EC2 Fleet.
     */
    CreateTime?: DateTime;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId?: FleetIdentifier;
    /**
     * The state of the EC2 Fleet.
     */
    FleetState?: FleetStateCode;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency. Constraints: Maximum 64 ASCII characters
     */
    ClientToken?: String;
    /**
     * Indicates whether running instances should be terminated if the target capacity of the EC2 Fleet is decreased below the current size of the EC2 Fleet.
     */
    ExcessCapacityTerminationPolicy?: FleetExcessCapacityTerminationPolicy;
    /**
     * The number of units fulfilled by this request compared to the set target capacity.
     */
    FulfilledCapacity?: Double;
    /**
     * The number of units fulfilled by this request compared to the set target On-Demand capacity.
     */
    FulfilledOnDemandCapacity?: Double;
    /**
     * The launch template and overrides.
     */
    LaunchTemplateConfigs?: FleetLaunchTemplateConfigList;
    /**
     * The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O. If the request type is maintain, you can specify a target capacity of 0 and add capacity later.
     */
    TargetCapacitySpecification?: TargetCapacitySpecification;
    /**
     * Indicates whether running instances should be terminated when the EC2 Fleet expires. 
     */
    TerminateInstancesWithExpiration?: Boolean;
    /**
     * The type of request. Indicates whether the EC2 Fleet only requests the target capacity, or also attempts to maintain it. If you request a certain target capacity, EC2 Fleet only places the required requests; it does not attempt to replenish instances if capacity is diminished, and does not submit requests in alternative capacity pools if capacity is unavailable. To maintain a certain target capacity, EC2 Fleet places the required requests to meet this target capacity. It also automatically replenishes any interrupted Spot Instances. Default: maintain.
     */
    Type?: FleetType;
    /**
     * The start date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). The default is to start fulfilling the request immediately. 
     */
    ValidFrom?: DateTime;
    /**
     * The end date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). At this point, no new instance requests are placed or able to fulfill the request. The default end date is 7 days from the current date. 
     */
    ValidUntil?: DateTime;
    /**
     * Indicates whether EC2 Fleet should replace unhealthy instances.
     */
    ReplaceUnhealthyInstances?: Boolean;
    /**
     * The configuration of Spot Instances in an EC2 Fleet.
     */
    SpotOptions?: SpotOptions;
    /**
     * The allocation strategy of On-Demand Instances in an EC2 Fleet.
     */
    OnDemandOptions?: OnDemandOptions;
    /**
     * The tags for an EC2 Fleet resource.
     */
    Tags?: TagList;
  }
  export type FleetEventType = "instance-change"|"fleet-change"|"service-error"|string;
  export type FleetExcessCapacityTerminationPolicy = "no-termination"|"termination"|string;
  export type FleetIdSet = FleetIdentifier[];
  export type FleetIdentifier = string;
  export interface FleetLaunchTemplateConfig {
    /**
     * The launch template.
     */
    LaunchTemplateSpecification?: FleetLaunchTemplateSpecification;
    /**
     * Any parameters that you specify override the same parameters in the launch template.
     */
    Overrides?: FleetLaunchTemplateOverridesList;
  }
  export type FleetLaunchTemplateConfigList = FleetLaunchTemplateConfig[];
  export type FleetLaunchTemplateConfigListRequest = FleetLaunchTemplateConfigRequest[];
  export interface FleetLaunchTemplateConfigRequest {
    /**
     * The launch template to use. You must specify either the launch template ID or launch template name in the request. 
     */
    LaunchTemplateSpecification?: FleetLaunchTemplateSpecificationRequest;
    /**
     * Any parameters that you specify override the same parameters in the launch template.
     */
    Overrides?: FleetLaunchTemplateOverridesListRequest;
  }
  export interface FleetLaunchTemplateOverrides {
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The maximum price per unit hour that you are willing to pay for a Spot Instance.
     */
    MaxPrice?: String;
    /**
     * The ID of the subnet in which to launch the instances.
     */
    SubnetId?: String;
    /**
     * The Availability Zone in which to launch the instances.
     */
    AvailabilityZone?: String;
    /**
     * The number of units provided by the specified instance type.
     */
    WeightedCapacity?: Double;
    /**
     * The priority for the launch template override. If AllocationStrategy is set to prioritized, EC2 Fleet uses priority to determine which launch template override to use first in fulfilling On-Demand capacity. The highest priority is launched first. Valid values are whole numbers starting at 0. The lower the number, the higher the priority. If no number is set, the override has the lowest priority.
     */
    Priority?: Double;
  }
  export type FleetLaunchTemplateOverridesList = FleetLaunchTemplateOverrides[];
  export type FleetLaunchTemplateOverridesListRequest = FleetLaunchTemplateOverridesRequest[];
  export interface FleetLaunchTemplateOverridesRequest {
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The maximum price per unit hour that you are willing to pay for a Spot Instance.
     */
    MaxPrice?: String;
    /**
     * The ID of the subnet in which to launch the instances.
     */
    SubnetId?: String;
    /**
     * The Availability Zone in which to launch the instances.
     */
    AvailabilityZone?: String;
    /**
     * The number of units provided by the specified instance type.
     */
    WeightedCapacity?: Double;
    /**
     * The priority for the launch template override. If AllocationStrategy is set to prioritized, EC2 Fleet uses priority to determine which launch template override to use first in fulfilling On-Demand capacity. The highest priority is launched first. Valid values are whole numbers starting at 0. The lower the number, the higher the priority. If no number is set, the launch template override has the lowest priority.
     */
    Priority?: Double;
  }
  export interface FleetLaunchTemplateSpecification {
    /**
     * The ID of the launch template. You must specify either a template ID or a template name.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either a template name or a template ID.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version number of the launch template. You must specify a version number.
     */
    Version?: String;
  }
  export interface FleetLaunchTemplateSpecificationRequest {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version number of the launch template. 
     */
    Version?: String;
  }
  export type FleetOnDemandAllocationStrategy = "lowest-price"|"prioritized"|string;
  export type FleetSet = FleetData[];
  export type FleetStateCode = "submitted"|"active"|"deleted"|"failed"|"deleted-running"|"deleted-terminating"|"modifying"|string;
  export type FleetType = "request"|"maintain"|string;
  export type Float = number;
  export interface FlowLog {
    /**
     * The date and time the flow log was created.
     */
    CreationTime?: DateTime;
    /**
     * Information about the error that occurred. Rate limited indicates that CloudWatch Logs throttling has been applied for one or more network interfaces, or that you've reached the limit on the number of log groups that you can create. Access error indicates that the IAM role associated with the flow log does not have sufficient permissions to publish to CloudWatch Logs. Unknown error indicates an internal error.
     */
    DeliverLogsErrorMessage?: String;
    /**
     * The ARN of the IAM role that posts logs to CloudWatch Logs.
     */
    DeliverLogsPermissionArn?: String;
    /**
     * The status of the logs delivery (SUCCESS | FAILED).
     */
    DeliverLogsStatus?: String;
    /**
     * The flow log ID.
     */
    FlowLogId?: String;
    /**
     * The status of the flow log (ACTIVE).
     */
    FlowLogStatus?: String;
    /**
     * The name of the flow log group.
     */
    LogGroupName?: String;
    /**
     * The ID of the resource on which the flow log was created.
     */
    ResourceId?: String;
    /**
     * The type of traffic captured for the flow log.
     */
    TrafficType?: TrafficType;
    /**
     * Specifies the type of destination to which the flow log data is published. Flow log data can be published to CloudWatch Logs or Amazon S3.
     */
    LogDestinationType?: LogDestinationType;
    /**
     * Specifies the destination to which the flow log data is published. Flow log data can be published to an CloudWatch Logs log group or an Amazon S3 bucket. If the flow log publishes to CloudWatch Logs, this element indicates the Amazon Resource Name (ARN) of the CloudWatch Logs log group to which the data is published. If the flow log publishes to Amazon S3, this element indicates the ARN of the Amazon S3 bucket to which the data is published.
     */
    LogDestination?: String;
  }
  export type FlowLogSet = FlowLog[];
  export type FlowLogsResourceType = "VPC"|"Subnet"|"NetworkInterface"|string;
  export interface FpgaImage {
    /**
     * The FPGA image identifier (AFI ID).
     */
    FpgaImageId?: String;
    /**
     * The global FPGA image identifier (AGFI ID).
     */
    FpgaImageGlobalId?: String;
    /**
     * The name of the AFI.
     */
    Name?: String;
    /**
     * The description of the AFI.
     */
    Description?: String;
    /**
     * The version of the AWS Shell that was used to create the bitstream.
     */
    ShellVersion?: String;
    /**
     * Information about the PCI bus.
     */
    PciId?: PciId;
    /**
     * Information about the state of the AFI.
     */
    State?: FpgaImageState;
    /**
     * The date and time the AFI was created.
     */
    CreateTime?: DateTime;
    /**
     * The time of the most recent update to the AFI.
     */
    UpdateTime?: DateTime;
    /**
     * The AWS account ID of the AFI owner.
     */
    OwnerId?: String;
    /**
     * The alias of the AFI owner. Possible values include self, amazon, and aws-marketplace.
     */
    OwnerAlias?: String;
    /**
     * The product codes for the AFI.
     */
    ProductCodes?: ProductCodeList;
    /**
     * Any tags assigned to the AFI.
     */
    Tags?: TagList;
    /**
     * Indicates whether the AFI is public.
     */
    Public?: Boolean;
  }
  export interface FpgaImageAttribute {
    /**
     * The ID of the AFI.
     */
    FpgaImageId?: String;
    /**
     * The name of the AFI.
     */
    Name?: String;
    /**
     * The description of the AFI.
     */
    Description?: String;
    /**
     * One or more load permissions.
     */
    LoadPermissions?: LoadPermissionList;
    /**
     * One or more product codes.
     */
    ProductCodes?: ProductCodeList;
  }
  export type FpgaImageAttributeName = "description"|"name"|"loadPermission"|"productCodes"|string;
  export type FpgaImageIdList = String[];
  export type FpgaImageList = FpgaImage[];
  export interface FpgaImageState {
    /**
     * The state. The following are the possible values:    pending - AFI bitstream generation is in progress.    available - The AFI is available for use.    failed - AFI bitstream generation failed.    unavailable - The AFI is no longer available for use.  
     */
    Code?: FpgaImageStateCode;
    /**
     * If the state is failed, this is the error message.
     */
    Message?: String;
  }
  export type FpgaImageStateCode = "pending"|"failed"|"available"|"unavailable"|string;
  export type GatewayType = "ipsec.1"|string;
  export interface GetConsoleOutputRequest {
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * When enabled, retrieves the latest console output for the instance. Default: disabled (false)
     */
    Latest?: Boolean;
  }
  export interface GetConsoleOutputResult {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The console output, base64-encoded. If you are using a command line tool, the tool decodes the output for you.
     */
    Output?: String;
    /**
     * The time at which the output was last updated.
     */
    Timestamp?: DateTime;
  }
  export interface GetConsoleScreenshotRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * When set to true, acts as keystroke input and wakes up an instance that's in standby or "sleep" mode.
     */
    WakeUp?: Boolean;
  }
  export interface GetConsoleScreenshotResult {
    /**
     * The data that comprises the image.
     */
    ImageData?: String;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
  }
  export interface GetHostReservationPurchasePreviewRequest {
    /**
     * The IDs of the Dedicated Hosts with which the reservation is associated.
     */
    HostIdSet: RequestHostIdSet;
    /**
     * The offering ID of the reservation.
     */
    OfferingId: String;
  }
  export interface GetHostReservationPurchasePreviewResult {
    /**
     * The currency in which the totalUpfrontPrice and totalHourlyPrice amounts are specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The purchase information of the Dedicated Host reservation and the Dedicated Hosts associated with it.
     */
    Purchase?: PurchaseSet;
    /**
     * The potential total hourly price of the reservation per hour.
     */
    TotalHourlyPrice?: String;
    /**
     * The potential total upfront price. This is billed immediately.
     */
    TotalUpfrontPrice?: String;
  }
  export interface GetLaunchTemplateDataRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
  }
  export interface GetLaunchTemplateDataResult {
    /**
     * The instance data.
     */
    LaunchTemplateData?: ResponseLaunchTemplateData;
  }
  export interface GetPasswordDataRequest {
    /**
     * The ID of the Windows instance.
     */
    InstanceId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface GetPasswordDataResult {
    /**
     * The ID of the Windows instance.
     */
    InstanceId?: String;
    /**
     * The password of the instance. Returns an empty string if the password is not available.
     */
    PasswordData?: String;
    /**
     * The time the data was last updated.
     */
    Timestamp?: DateTime;
  }
  export interface GetReservedInstancesExchangeQuoteRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The IDs of the Convertible Reserved Instances to exchange.
     */
    ReservedInstanceIds: ReservedInstanceIdSet;
    /**
     * The configuration of the target Convertible Reserved Instance to exchange for your current Convertible Reserved Instances.
     */
    TargetConfigurations?: TargetConfigurationRequestSet;
  }
  export interface GetReservedInstancesExchangeQuoteResult {
    /**
     * The currency of the transaction.
     */
    CurrencyCode?: String;
    /**
     * If true, the exchange is valid. If false, the exchange cannot be completed.
     */
    IsValidExchange?: Boolean;
    /**
     * The new end date of the reservation term.
     */
    OutputReservedInstancesWillExpireAt?: DateTime;
    /**
     * The total true upfront charge for the exchange.
     */
    PaymentDue?: String;
    /**
     * The cost associated with the Reserved Instance.
     */
    ReservedInstanceValueRollup?: ReservationValue;
    /**
     * The configuration of your Convertible Reserved Instances.
     */
    ReservedInstanceValueSet?: ReservedInstanceReservationValueSet;
    /**
     * The cost associated with the Reserved Instance.
     */
    TargetConfigurationValueRollup?: ReservationValue;
    /**
     * The values of the target Convertible Reserved Instances.
     */
    TargetConfigurationValueSet?: TargetReservationValueSet;
    /**
     * Describes the reason why the exchange cannot be completed.
     */
    ValidationFailureReason?: String;
  }
  export type GroupIdStringList = String[];
  export interface GroupIdentifier {
    /**
     * The name of the security group.
     */
    GroupName?: String;
    /**
     * The ID of the security group.
     */
    GroupId?: String;
  }
  export type GroupIdentifierList = GroupIdentifier[];
  export type GroupIdentifierSet = SecurityGroupIdentifier[];
  export type GroupIds = String[];
  export type GroupNameStringList = String[];
  export interface HistoryRecord {
    /**
     * Information about the event.
     */
    EventInformation: EventInformation;
    /**
     * The event type.    error - An error with the Spot Fleet request.    fleetRequestChange - A change in the status or configuration of the Spot Fleet request.    instanceChange - An instance was launched or terminated.    Information - An informational event.  
     */
    EventType: EventType;
    /**
     * The date and time of the event, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    Timestamp: DateTime;
  }
  export interface HistoryRecordEntry {
    /**
     * Information about the event.
     */
    EventInformation?: EventInformation;
    /**
     * The event type.
     */
    EventType?: FleetEventType;
    /**
     * The date and time of the event, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    Timestamp?: DateTime;
  }
  export type HistoryRecordSet = HistoryRecordEntry[];
  export type HistoryRecords = HistoryRecord[];
  export interface Host {
    /**
     * Whether auto-placement is on or off.
     */
    AutoPlacement?: AutoPlacement;
    /**
     * The Availability Zone of the Dedicated Host.
     */
    AvailabilityZone?: String;
    /**
     * The number of new instances that can be launched onto the Dedicated Host.
     */
    AvailableCapacity?: AvailableCapacity;
    /**
     * Unique, case-sensitive identifier that you provide to ensure idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon Elastic Compute Cloud User Guide. 
     */
    ClientToken?: String;
    /**
     * The ID of the Dedicated Host.
     */
    HostId?: String;
    /**
     * The hardware specifications of the Dedicated Host.
     */
    HostProperties?: HostProperties;
    /**
     * The reservation ID of the Dedicated Host. This returns a null response if the Dedicated Host doesn't have an associated reservation.
     */
    HostReservationId?: String;
    /**
     * The IDs and instance type that are currently running on the Dedicated Host.
     */
    Instances?: HostInstanceList;
    /**
     * The Dedicated Host's state.
     */
    State?: AllocationState;
    /**
     * The time that the Dedicated Host was allocated.
     */
    AllocationTime?: DateTime;
    /**
     * The time that the Dedicated Host was released.
     */
    ReleaseTime?: DateTime;
    /**
     * Any tags assigned to the Dedicated Host.
     */
    Tags?: TagList;
  }
  export interface HostInstance {
    /**
     * the IDs of instances that are running on the Dedicated Host.
     */
    InstanceId?: String;
    /**
     * The instance type size (for example, m3.medium) of the running instance.
     */
    InstanceType?: String;
  }
  export type HostInstanceList = HostInstance[];
  export type HostList = Host[];
  export interface HostOffering {
    /**
     * The currency of the offering.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The duration of the offering (in seconds).
     */
    Duration?: Integer;
    /**
     * The hourly price of the offering.
     */
    HourlyPrice?: String;
    /**
     * The instance family of the offering.
     */
    InstanceFamily?: String;
    /**
     * The ID of the offering.
     */
    OfferingId?: String;
    /**
     * The available payment option.
     */
    PaymentOption?: PaymentOption;
    /**
     * The upfront price of the offering. Does not apply to No Upfront offerings.
     */
    UpfrontPrice?: String;
  }
  export type HostOfferingSet = HostOffering[];
  export interface HostProperties {
    /**
     * The number of cores on the Dedicated Host.
     */
    Cores?: Integer;
    /**
     * The instance type size that the Dedicated Host supports (for example, m3.medium).
     */
    InstanceType?: String;
    /**
     * The number of sockets on the Dedicated Host.
     */
    Sockets?: Integer;
    /**
     * The number of vCPUs on the Dedicated Host.
     */
    TotalVCpus?: Integer;
  }
  export interface HostReservation {
    /**
     * The number of Dedicated Hosts the reservation is associated with.
     */
    Count?: Integer;
    /**
     * The currency in which the upfrontPrice and hourlyPrice amounts are specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The length of the reservation's term, specified in seconds. Can be 31536000 (1 year) | 94608000 (3 years).
     */
    Duration?: Integer;
    /**
     * The date and time that the reservation ends.
     */
    End?: DateTime;
    /**
     * The IDs of the Dedicated Hosts associated with the reservation.
     */
    HostIdSet?: ResponseHostIdSet;
    /**
     * The ID of the reservation that specifies the associated Dedicated Hosts.
     */
    HostReservationId?: String;
    /**
     * The hourly price of the reservation.
     */
    HourlyPrice?: String;
    /**
     * The instance family of the Dedicated Host Reservation. The instance family on the Dedicated Host must be the same in order for it to benefit from the reservation.
     */
    InstanceFamily?: String;
    /**
     * The ID of the reservation. This remains the same regardless of which Dedicated Hosts are associated with it.
     */
    OfferingId?: String;
    /**
     * The payment option selected for this reservation.
     */
    PaymentOption?: PaymentOption;
    /**
     * The date and time that the reservation started.
     */
    Start?: DateTime;
    /**
     * The state of the reservation.
     */
    State?: ReservationState;
    /**
     * The upfront price of the reservation.
     */
    UpfrontPrice?: String;
  }
  export type HostReservationIdSet = String[];
  export type HostReservationSet = HostReservation[];
  export type HostTenancy = "dedicated"|"host"|string;
  export type HypervisorType = "ovm"|"xen"|string;
  export interface IamInstanceProfile {
    /**
     * The Amazon Resource Name (ARN) of the instance profile.
     */
    Arn?: String;
    /**
     * The ID of the instance profile.
     */
    Id?: String;
  }
  export interface IamInstanceProfileAssociation {
    /**
     * The ID of the association.
     */
    AssociationId?: String;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: IamInstanceProfile;
    /**
     * The state of the association.
     */
    State?: IamInstanceProfileAssociationState;
    /**
     * The time the IAM instance profile was associated with the instance.
     */
    Timestamp?: DateTime;
  }
  export type IamInstanceProfileAssociationSet = IamInstanceProfileAssociation[];
  export type IamInstanceProfileAssociationState = "associating"|"associated"|"disassociating"|"disassociated"|string;
  export interface IamInstanceProfileSpecification {
    /**
     * The Amazon Resource Name (ARN) of the instance profile.
     */
    Arn?: String;
    /**
     * The name of the instance profile.
     */
    Name?: String;
  }
  export interface IcmpTypeCode {
    /**
     * The ICMP code. A value of -1 means all codes for the specified ICMP type.
     */
    Code?: Integer;
    /**
     * The ICMP type. A value of -1 means all types.
     */
    Type?: Integer;
  }
  export interface IdFormat {
    /**
     * The date in UTC at which you are permanently switched over to using longer IDs. If a deadline is not yet available for this resource type, this field is not returned.
     */
    Deadline?: DateTime;
    /**
     * The type of resource.
     */
    Resource?: String;
    /**
     * Indicates whether longer IDs (17-character IDs) are enabled for the resource.
     */
    UseLongIds?: Boolean;
  }
  export type IdFormatList = IdFormat[];
  export interface Image {
    /**
     * The architecture of the image.
     */
    Architecture?: ArchitectureValues;
    /**
     * The date and time the image was created.
     */
    CreationDate?: String;
    /**
     * The ID of the AMI.
     */
    ImageId?: String;
    /**
     * The location of the AMI.
     */
    ImageLocation?: String;
    /**
     * The type of image.
     */
    ImageType?: ImageTypeValues;
    /**
     * Indicates whether the image has public launch permissions. The value is true if this image has public launch permissions or false if it has only implicit and explicit launch permissions.
     */
    Public?: Boolean;
    /**
     * The kernel associated with the image, if any. Only applicable for machine images.
     */
    KernelId?: String;
    /**
     * The AWS account ID of the image owner.
     */
    OwnerId?: String;
    /**
     * The value is Windows for Windows AMIs; otherwise blank.
     */
    Platform?: PlatformValues;
    /**
     * Any product codes associated with the AMI.
     */
    ProductCodes?: ProductCodeList;
    /**
     * The RAM disk associated with the image, if any. Only applicable for machine images.
     */
    RamdiskId?: String;
    /**
     * The current state of the AMI. If the state is available, the image is successfully registered and can be used to launch an instance.
     */
    State?: ImageState;
    /**
     * Any block device mapping entries.
     */
    BlockDeviceMappings?: BlockDeviceMappingList;
    /**
     * The description of the AMI that was provided during image creation.
     */
    Description?: String;
    /**
     * Specifies whether enhanced networking with ENA is enabled.
     */
    EnaSupport?: Boolean;
    /**
     * The hypervisor type of the image.
     */
    Hypervisor?: HypervisorType;
    /**
     * The AWS account alias (for example, amazon, self) or the AWS account ID of the AMI owner.
     */
    ImageOwnerAlias?: String;
    /**
     * The name of the AMI that was provided during image creation.
     */
    Name?: String;
    /**
     * The device name of the root device volume (for example, /dev/sda1).
     */
    RootDeviceName?: String;
    /**
     * The type of root device used by the AMI. The AMI can use an EBS volume or an instance store volume.
     */
    RootDeviceType?: DeviceType;
    /**
     * Specifies whether enhanced networking with the Intel 82599 Virtual Function interface is enabled.
     */
    SriovNetSupport?: String;
    /**
     * The reason for the state change.
     */
    StateReason?: StateReason;
    /**
     * Any tags assigned to the image.
     */
    Tags?: TagList;
    /**
     * The type of virtualization of the AMI.
     */
    VirtualizationType?: VirtualizationType;
  }
  export interface ImageAttribute {
    /**
     * One or more block device mapping entries.
     */
    BlockDeviceMappings?: BlockDeviceMappingList;
    /**
     * The ID of the AMI.
     */
    ImageId?: String;
    /**
     * One or more launch permissions.
     */
    LaunchPermissions?: LaunchPermissionList;
    /**
     * One or more product codes.
     */
    ProductCodes?: ProductCodeList;
    /**
     * A description for the AMI.
     */
    Description?: AttributeValue;
    /**
     * The kernel ID.
     */
    KernelId?: AttributeValue;
    /**
     * The RAM disk ID.
     */
    RamdiskId?: AttributeValue;
    /**
     * Indicates whether enhanced networking with the Intel 82599 Virtual Function interface is enabled.
     */
    SriovNetSupport?: AttributeValue;
  }
  export type ImageAttributeName = "description"|"kernel"|"ramdisk"|"launchPermission"|"productCodes"|"blockDeviceMapping"|"sriovNetSupport"|string;
  export interface ImageDiskContainer {
    /**
     * The description of the disk image.
     */
    Description?: String;
    /**
     * The block device mapping for the disk.
     */
    DeviceName?: String;
    /**
     * The format of the disk image being imported. Valid values: VHD | VMDK | OVA 
     */
    Format?: String;
    /**
     * The ID of the EBS snapshot to be used for importing the snapshot.
     */
    SnapshotId?: String;
    /**
     * The URL to the Amazon S3-based disk image being imported. The URL can either be a https URL (https://..) or an Amazon S3 URL (s3://..)
     */
    Url?: String;
    /**
     * The S3 bucket for the disk image.
     */
    UserBucket?: UserBucket;
  }
  export type ImageDiskContainerList = ImageDiskContainer[];
  export type ImageIdStringList = String[];
  export type ImageList = Image[];
  export type ImageState = "pending"|"available"|"invalid"|"deregistered"|"transient"|"failed"|"error"|string;
  export type ImageTypeValues = "machine"|"kernel"|"ramdisk"|string;
  export interface ImportImageRequest {
    /**
     * The architecture of the virtual machine. Valid values: i386 | x86_64 
     */
    Architecture?: String;
    /**
     * The client-specific data.
     */
    ClientData?: ClientData;
    /**
     * The token to enable idempotency for VM import requests.
     */
    ClientToken?: String;
    /**
     * A description string for the import image task.
     */
    Description?: String;
    /**
     * Information about the disk containers.
     */
    DiskContainers?: ImageDiskContainerList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The target hypervisor platform. Valid values: xen 
     */
    Hypervisor?: String;
    /**
     * The license type to be used for the Amazon Machine Image (AMI) after importing.  Note: You may only use BYOL if you have existing licenses with rights to use these licenses in a third party cloud like AWS. For more information, see Prerequisites in the VM Import/Export User Guide. Valid values: AWS | BYOL 
     */
    LicenseType?: String;
    /**
     * The operating system of the virtual machine. Valid values: Windows | Linux 
     */
    Platform?: String;
    /**
     * The name of the role to use when not using the default role, 'vmimport'.
     */
    RoleName?: String;
  }
  export interface ImportImageResult {
    /**
     * The architecture of the virtual machine.
     */
    Architecture?: String;
    /**
     * A description of the import task.
     */
    Description?: String;
    /**
     * The target hypervisor of the import task.
     */
    Hypervisor?: String;
    /**
     * The ID of the Amazon Machine Image (AMI) created by the import task.
     */
    ImageId?: String;
    /**
     * The task ID of the import image task.
     */
    ImportTaskId?: String;
    /**
     * The license type of the virtual machine.
     */
    LicenseType?: String;
    /**
     * The operating system of the virtual machine.
     */
    Platform?: String;
    /**
     * The progress of the task.
     */
    Progress?: String;
    /**
     * Information about the snapshots.
     */
    SnapshotDetails?: SnapshotDetailList;
    /**
     * A brief status of the task.
     */
    Status?: String;
    /**
     * A detailed status message of the import task.
     */
    StatusMessage?: String;
  }
  export interface ImportImageTask {
    /**
     * The architecture of the virtual machine. Valid values: i386 | x86_64 
     */
    Architecture?: String;
    /**
     * A description of the import task.
     */
    Description?: String;
    /**
     * The target hypervisor for the import task. Valid values: xen 
     */
    Hypervisor?: String;
    /**
     * The ID of the Amazon Machine Image (AMI) of the imported virtual machine.
     */
    ImageId?: String;
    /**
     * The ID of the import image task.
     */
    ImportTaskId?: String;
    /**
     * The license type of the virtual machine.
     */
    LicenseType?: String;
    /**
     * The description string for the import image task.
     */
    Platform?: String;
    /**
     * The percentage of progress of the import image task.
     */
    Progress?: String;
    /**
     * Information about the snapshots.
     */
    SnapshotDetails?: SnapshotDetailList;
    /**
     * A brief status for the import image task.
     */
    Status?: String;
    /**
     * A descriptive status message for the import image task.
     */
    StatusMessage?: String;
  }
  export type ImportImageTaskList = ImportImageTask[];
  export interface ImportInstanceLaunchSpecification {
    /**
     * Reserved.
     */
    AdditionalInfo?: String;
    /**
     * The architecture of the instance.
     */
    Architecture?: ArchitectureValues;
    /**
     * One or more security group IDs.
     */
    GroupIds?: SecurityGroupIdStringList;
    /**
     * One or more security group names.
     */
    GroupNames?: SecurityGroupStringList;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).
     */
    InstanceInitiatedShutdownBehavior?: ShutdownBehavior;
    /**
     * The instance type. For more information about the instance types that you can import, see Instance Types in the VM Import/Export User Guide.
     */
    InstanceType?: InstanceType;
    /**
     * Indicates whether monitoring is enabled.
     */
    Monitoring?: Boolean;
    /**
     * The placement information for the instance.
     */
    Placement?: Placement;
    /**
     * [EC2-VPC] An available IP address from the IP address range of the subnet.
     */
    PrivateIpAddress?: String;
    /**
     * [EC2-VPC] The ID of the subnet in which to launch the instance.
     */
    SubnetId?: String;
    /**
     * The Base64-encoded user data to make available to the instance.
     */
    UserData?: UserData;
  }
  export interface ImportInstanceRequest {
    /**
     * A description for the instance being imported.
     */
    Description?: String;
    /**
     * The disk image.
     */
    DiskImages?: DiskImageList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The launch specification.
     */
    LaunchSpecification?: ImportInstanceLaunchSpecification;
    /**
     * The instance operating system.
     */
    Platform: PlatformValues;
  }
  export interface ImportInstanceResult {
    /**
     * Information about the conversion task.
     */
    ConversionTask?: ConversionTask;
  }
  export interface ImportInstanceTaskDetails {
    /**
     * A description of the task.
     */
    Description?: String;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The instance operating system.
     */
    Platform?: PlatformValues;
    /**
     * One or more volumes.
     */
    Volumes?: ImportInstanceVolumeDetailSet;
  }
  export interface ImportInstanceVolumeDetailItem {
    /**
     * The Availability Zone where the resulting instance will reside.
     */
    AvailabilityZone: String;
    /**
     * The number of bytes converted so far.
     */
    BytesConverted: Long;
    /**
     * A description of the task.
     */
    Description?: String;
    /**
     * The image.
     */
    Image: DiskImageDescription;
    /**
     * The status of the import of this particular disk image.
     */
    Status: String;
    /**
     * The status information or errors related to the disk image.
     */
    StatusMessage?: String;
    /**
     * The volume.
     */
    Volume: DiskImageVolumeDescription;
  }
  export type ImportInstanceVolumeDetailSet = ImportInstanceVolumeDetailItem[];
  export interface ImportKeyPairRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * A unique name for the key pair.
     */
    KeyName: String;
    /**
     * The public key. For API calls, the text must be base64-encoded. For command line tools, base64 encoding is performed for you.
     */
    PublicKeyMaterial: _Blob;
  }
  export interface ImportKeyPairResult {
    /**
     * The MD5 public key fingerprint as specified in section 4 of RFC 4716.
     */
    KeyFingerprint?: String;
    /**
     * The key pair name you provided.
     */
    KeyName?: String;
  }
  export interface ImportSnapshotRequest {
    /**
     * The client-specific data.
     */
    ClientData?: ClientData;
    /**
     * Token to enable idempotency for VM import requests.
     */
    ClientToken?: String;
    /**
     * The description string for the import snapshot task.
     */
    Description?: String;
    /**
     * Information about the disk container.
     */
    DiskContainer?: SnapshotDiskContainer;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The name of the role to use when not using the default role, 'vmimport'.
     */
    RoleName?: String;
  }
  export interface ImportSnapshotResult {
    /**
     * A description of the import snapshot task.
     */
    Description?: String;
    /**
     * The ID of the import snapshot task.
     */
    ImportTaskId?: String;
    /**
     * Information about the import snapshot task.
     */
    SnapshotTaskDetail?: SnapshotTaskDetail;
  }
  export interface ImportSnapshotTask {
    /**
     * A description of the import snapshot task.
     */
    Description?: String;
    /**
     * The ID of the import snapshot task.
     */
    ImportTaskId?: String;
    /**
     * Describes an import snapshot task.
     */
    SnapshotTaskDetail?: SnapshotTaskDetail;
  }
  export type ImportSnapshotTaskList = ImportSnapshotTask[];
  export type ImportTaskIdList = String[];
  export interface ImportVolumeRequest {
    /**
     * The Availability Zone for the resulting EBS volume.
     */
    AvailabilityZone: String;
    /**
     * A description of the volume.
     */
    Description?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The disk image.
     */
    Image: DiskImageDetail;
    /**
     * The volume size.
     */
    Volume: VolumeDetail;
  }
  export interface ImportVolumeResult {
    /**
     * Information about the conversion task.
     */
    ConversionTask?: ConversionTask;
  }
  export interface ImportVolumeTaskDetails {
    /**
     * The Availability Zone where the resulting volume will reside.
     */
    AvailabilityZone?: String;
    /**
     * The number of bytes converted so far.
     */
    BytesConverted?: Long;
    /**
     * The description you provided when starting the import volume task.
     */
    Description?: String;
    /**
     * The image.
     */
    Image?: DiskImageDescription;
    /**
     * The volume.
     */
    Volume?: DiskImageVolumeDescription;
  }
  export interface Instance {
    /**
     * The AMI launch index, which can be used to find this instance in the launch group.
     */
    AmiLaunchIndex?: Integer;
    /**
     * The ID of the AMI used to launch the instance.
     */
    ImageId?: String;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The kernel associated with this instance, if applicable.
     */
    KernelId?: String;
    /**
     * The name of the key pair, if this instance was launched with an associated key pair.
     */
    KeyName?: String;
    /**
     * The time the instance was launched.
     */
    LaunchTime?: DateTime;
    /**
     * The monitoring for the instance.
     */
    Monitoring?: Monitoring;
    /**
     * The location where the instance launched, if applicable.
     */
    Placement?: Placement;
    /**
     * The value is Windows for Windows instances; otherwise blank.
     */
    Platform?: PlatformValues;
    /**
     * (IPv4 only) The private DNS hostname name assigned to the instance. This DNS hostname can only be used inside the Amazon EC2 network. This name is not available until the instance enters the running state.  [EC2-VPC] The Amazon-provided DNS server resolves Amazon-provided private DNS hostnames if you've enabled DNS resolution and DNS hostnames in your VPC. If you are not using the Amazon-provided DNS server in your VPC, your custom domain name servers must resolve the hostname as appropriate.
     */
    PrivateDnsName?: String;
    /**
     * The private IPv4 address assigned to the instance.
     */
    PrivateIpAddress?: String;
    /**
     * The product codes attached to this instance, if applicable.
     */
    ProductCodes?: ProductCodeList;
    /**
     * (IPv4 only) The public DNS name assigned to the instance. This name is not available until the instance enters the running state. For EC2-VPC, this name is only available if you've enabled DNS hostnames for your VPC.
     */
    PublicDnsName?: String;
    /**
     * The public IPv4 address assigned to the instance, if applicable.
     */
    PublicIpAddress?: String;
    /**
     * The RAM disk associated with this instance, if applicable.
     */
    RamdiskId?: String;
    /**
     * The current state of the instance.
     */
    State?: InstanceState;
    /**
     * The reason for the most recent state transition. This might be an empty string.
     */
    StateTransitionReason?: String;
    /**
     * [EC2-VPC] The ID of the subnet in which the instance is running.
     */
    SubnetId?: String;
    /**
     * [EC2-VPC] The ID of the VPC in which the instance is running.
     */
    VpcId?: String;
    /**
     * The architecture of the image.
     */
    Architecture?: ArchitectureValues;
    /**
     * Any block device mapping entries for the instance.
     */
    BlockDeviceMappings?: InstanceBlockDeviceMappingList;
    /**
     * The idempotency token you provided when you launched the instance, if applicable.
     */
    ClientToken?: String;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS Optimized instance.
     */
    EbsOptimized?: Boolean;
    /**
     * Specifies whether enhanced networking with ENA is enabled.
     */
    EnaSupport?: Boolean;
    /**
     * The hypervisor type of the instance.
     */
    Hypervisor?: HypervisorType;
    /**
     * The IAM instance profile associated with the instance, if applicable.
     */
    IamInstanceProfile?: IamInstanceProfile;
    /**
     * Indicates whether this is a Spot Instance or a Scheduled Instance.
     */
    InstanceLifecycle?: InstanceLifecycleType;
    /**
     * The Elastic GPU associated with the instance.
     */
    ElasticGpuAssociations?: ElasticGpuAssociationList;
    /**
     * [EC2-VPC] One or more network interfaces for the instance.
     */
    NetworkInterfaces?: InstanceNetworkInterfaceList;
    /**
     * The device name of the root device volume (for example, /dev/sda1).
     */
    RootDeviceName?: String;
    /**
     * The root device type used by the AMI. The AMI can use an EBS volume or an instance store volume.
     */
    RootDeviceType?: DeviceType;
    /**
     * One or more security groups for the instance.
     */
    SecurityGroups?: GroupIdentifierList;
    /**
     * Specifies whether to enable an instance launched in a VPC to perform NAT. This controls whether source/destination checking is enabled on the instance. A value of true means that checking is enabled, and false means that checking is disabled. The value must be false for the instance to perform NAT. For more information, see NAT Instances in the Amazon Virtual Private Cloud User Guide.
     */
    SourceDestCheck?: Boolean;
    /**
     * If the request is a Spot Instance request, the ID of the request.
     */
    SpotInstanceRequestId?: String;
    /**
     * Specifies whether enhanced networking with the Intel 82599 Virtual Function interface is enabled.
     */
    SriovNetSupport?: String;
    /**
     * The reason for the most recent state transition.
     */
    StateReason?: StateReason;
    /**
     * Any tags assigned to the instance.
     */
    Tags?: TagList;
    /**
     * The virtualization type of the instance.
     */
    VirtualizationType?: VirtualizationType;
    /**
     * The CPU options for the instance.
     */
    CpuOptions?: CpuOptions;
  }
  export interface InstanceAttribute {
    /**
     * The security groups associated with the instance.
     */
    Groups?: GroupIdentifierList;
    /**
     * The block device mapping of the instance.
     */
    BlockDeviceMappings?: InstanceBlockDeviceMappingList;
    /**
     * If the value is true, you can't terminate the instance through the Amazon EC2 console, CLI, or API; otherwise, you can.
     */
    DisableApiTermination?: AttributeBooleanValue;
    /**
     * Indicates whether enhanced networking with ENA is enabled.
     */
    EnaSupport?: AttributeBooleanValue;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O.
     */
    EbsOptimized?: AttributeBooleanValue;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).
     */
    InstanceInitiatedShutdownBehavior?: AttributeValue;
    /**
     * The instance type.
     */
    InstanceType?: AttributeValue;
    /**
     * The kernel ID.
     */
    KernelId?: AttributeValue;
    /**
     * A list of product codes.
     */
    ProductCodes?: ProductCodeList;
    /**
     * The RAM disk ID.
     */
    RamdiskId?: AttributeValue;
    /**
     * The device name of the root device volume (for example, /dev/sda1).
     */
    RootDeviceName?: AttributeValue;
    /**
     * Indicates whether source/destination checking is enabled. A value of true means that checking is enabled, and false means that checking is disabled. This value must be false for a NAT instance to perform NAT.
     */
    SourceDestCheck?: AttributeBooleanValue;
    /**
     * Indicates whether enhanced networking with the Intel 82599 Virtual Function interface is enabled.
     */
    SriovNetSupport?: AttributeValue;
    /**
     * The user data.
     */
    UserData?: AttributeValue;
  }
  export type InstanceAttributeName = "instanceType"|"kernel"|"ramdisk"|"userData"|"disableApiTermination"|"instanceInitiatedShutdownBehavior"|"rootDeviceName"|"blockDeviceMapping"|"productCodes"|"sourceDestCheck"|"groupSet"|"ebsOptimized"|"sriovNetSupport"|"enaSupport"|string;
  export interface InstanceBlockDeviceMapping {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    DeviceName?: String;
    /**
     * Parameters used to automatically set up EBS volumes when the instance is launched.
     */
    Ebs?: EbsInstanceBlockDevice;
  }
  export type InstanceBlockDeviceMappingList = InstanceBlockDeviceMapping[];
  export interface InstanceBlockDeviceMappingSpecification {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    DeviceName?: String;
    /**
     * Parameters used to automatically set up EBS volumes when the instance is launched.
     */
    Ebs?: EbsInstanceBlockDeviceSpecification;
    /**
     * suppress the specified device included in the block device mapping.
     */
    NoDevice?: String;
    /**
     * The virtual device name.
     */
    VirtualName?: String;
  }
  export type InstanceBlockDeviceMappingSpecificationList = InstanceBlockDeviceMappingSpecification[];
  export interface InstanceCapacity {
    /**
     * The number of instances that can still be launched onto the Dedicated Host.
     */
    AvailableCapacity?: Integer;
    /**
     * The instance type size supported by the Dedicated Host.
     */
    InstanceType?: String;
    /**
     * The total number of instances that can be launched onto the Dedicated Host.
     */
    TotalCapacity?: Integer;
  }
  export interface InstanceCount {
    /**
     * The number of listed Reserved Instances in the state specified by the state.
     */
    InstanceCount?: Integer;
    /**
     * The states of the listed Reserved Instances.
     */
    State?: ListingState;
  }
  export type InstanceCountList = InstanceCount[];
  export interface InstanceCreditSpecification {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The credit option for CPU usage of the instance. Valid values are standard and unlimited.
     */
    CpuCredits?: String;
  }
  export type InstanceCreditSpecificationList = InstanceCreditSpecification[];
  export type InstanceCreditSpecificationListRequest = InstanceCreditSpecificationRequest[];
  export interface InstanceCreditSpecificationRequest {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The credit option for CPU usage of the instance. Valid values are standard and unlimited.
     */
    CpuCredits?: String;
  }
  export interface InstanceExportDetails {
    /**
     * The ID of the resource being exported.
     */
    InstanceId?: String;
    /**
     * The target virtualization environment.
     */
    TargetEnvironment?: ExportEnvironment;
  }
  export type InstanceHealthStatus = "healthy"|"unhealthy"|string;
  export type InstanceIdSet = String[];
  export type InstanceIdStringList = String[];
  export type InstanceInterruptionBehavior = "hibernate"|"stop"|"terminate"|string;
  export interface InstanceIpv6Address {
    /**
     * The IPv6 address.
     */
    Ipv6Address?: String;
  }
  export type InstanceIpv6AddressList = InstanceIpv6Address[];
  export type InstanceIpv6AddressListRequest = InstanceIpv6AddressRequest[];
  export interface InstanceIpv6AddressRequest {
    /**
     * The IPv6 address.
     */
    Ipv6Address?: String;
  }
  export type InstanceLifecycleType = "spot"|"scheduled"|string;
  export type InstanceList = Instance[];
  export interface InstanceMarketOptionsRequest {
    /**
     * The market type.
     */
    MarketType?: MarketType;
    /**
     * The options for Spot Instances.
     */
    SpotOptions?: SpotMarketOptions;
  }
  export interface InstanceMonitoring {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The monitoring for the instance.
     */
    Monitoring?: Monitoring;
  }
  export type InstanceMonitoringList = InstanceMonitoring[];
  export interface InstanceNetworkInterface {
    /**
     * The association information for an Elastic IPv4 associated with the network interface.
     */
    Association?: InstanceNetworkInterfaceAssociation;
    /**
     * The network interface attachment.
     */
    Attachment?: InstanceNetworkInterfaceAttachment;
    /**
     * The description.
     */
    Description?: String;
    /**
     * One or more security groups.
     */
    Groups?: GroupIdentifierList;
    /**
     * One or more IPv6 addresses associated with the network interface.
     */
    Ipv6Addresses?: InstanceIpv6AddressList;
    /**
     * The MAC address.
     */
    MacAddress?: String;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The ID of the AWS account that created the network interface.
     */
    OwnerId?: String;
    /**
     * The private DNS name.
     */
    PrivateDnsName?: String;
    /**
     * The IPv4 address of the network interface within the subnet.
     */
    PrivateIpAddress?: String;
    /**
     * One or more private IPv4 addresses associated with the network interface.
     */
    PrivateIpAddresses?: InstancePrivateIpAddressList;
    /**
     * Indicates whether to validate network traffic to or from this network interface.
     */
    SourceDestCheck?: Boolean;
    /**
     * The status of the network interface.
     */
    Status?: NetworkInterfaceStatus;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface InstanceNetworkInterfaceAssociation {
    /**
     * The ID of the owner of the Elastic IP address.
     */
    IpOwnerId?: String;
    /**
     * The public DNS name.
     */
    PublicDnsName?: String;
    /**
     * The public IP address or Elastic IP address bound to the network interface.
     */
    PublicIp?: String;
  }
  export interface InstanceNetworkInterfaceAttachment {
    /**
     * The time stamp when the attachment initiated.
     */
    AttachTime?: DateTime;
    /**
     * The ID of the network interface attachment.
     */
    AttachmentId?: String;
    /**
     * Indicates whether the network interface is deleted when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The index of the device on the instance for the network interface attachment.
     */
    DeviceIndex?: Integer;
    /**
     * The attachment state.
     */
    Status?: AttachmentStatus;
  }
  export type InstanceNetworkInterfaceList = InstanceNetworkInterface[];
  export interface InstanceNetworkInterfaceSpecification {
    /**
     * Indicates whether to assign a public IPv4 address to an instance you launch in a VPC. The public IP address can only be assigned to a network interface for eth0, and can only be assigned to a new network interface, not an existing one. You cannot specify more than one network interface in the request. If launching into a default subnet, the default value is true.
     */
    AssociatePublicIpAddress?: Boolean;
    /**
     * If set to true, the interface is deleted when the instance is terminated. You can specify true only if creating a new network interface when launching an instance.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The description of the network interface. Applies only if creating a network interface when launching an instance.
     */
    Description?: String;
    /**
     * The index of the device on the instance for the network interface attachment. If you are specifying a network interface in a RunInstances request, you must provide the device index.
     */
    DeviceIndex?: Integer;
    /**
     * The IDs of the security groups for the network interface. Applies only if creating a network interface when launching an instance.
     */
    Groups?: SecurityGroupIdStringList;
    /**
     * A number of IPv6 addresses to assign to the network interface. Amazon EC2 chooses the IPv6 addresses from the range of the subnet. You cannot specify this option and the option to assign specific IPv6 addresses in the same request. You can specify this option if you've specified a minimum number of instances to launch.
     */
    Ipv6AddressCount?: Integer;
    /**
     * One or more IPv6 addresses to assign to the network interface. You cannot specify this option and the option to assign a number of IPv6 addresses in the same request. You cannot specify this option if you've specified a minimum number of instances to launch.
     */
    Ipv6Addresses?: InstanceIpv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The private IPv4 address of the network interface. Applies only if creating a network interface when launching an instance. You cannot specify this option if you're launching more than one instance in a RunInstances request.
     */
    PrivateIpAddress?: String;
    /**
     * One or more private IPv4 addresses to assign to the network interface. Only one private IPv4 address can be designated as primary. You cannot specify this option if you're launching more than one instance in a RunInstances request.
     */
    PrivateIpAddresses?: PrivateIpAddressSpecificationList;
    /**
     * The number of secondary private IPv4 addresses. You can't specify this option and specify more than one private IP address using the private IP addresses option. You cannot specify this option if you're launching more than one instance in a RunInstances request.
     */
    SecondaryPrivateIpAddressCount?: Integer;
    /**
     * The ID of the subnet associated with the network string. Applies only if creating a network interface when launching an instance.
     */
    SubnetId?: String;
  }
  export type InstanceNetworkInterfaceSpecificationList = InstanceNetworkInterfaceSpecification[];
  export interface InstancePrivateIpAddress {
    /**
     * The association information for an Elastic IP address for the network interface.
     */
    Association?: InstanceNetworkInterfaceAssociation;
    /**
     * Indicates whether this IPv4 address is the primary private IP address of the network interface.
     */
    Primary?: Boolean;
    /**
     * The private IPv4 DNS name.
     */
    PrivateDnsName?: String;
    /**
     * The private IPv4 address of the network interface.
     */
    PrivateIpAddress?: String;
  }
  export type InstancePrivateIpAddressList = InstancePrivateIpAddress[];
  export interface InstanceState {
    /**
     * The low byte represents the state. The high byte is used for internal purposes and should be ignored.    0 : pending     16 : running     32 : shutting-down     48 : terminated     64 : stopping     80 : stopped   
     */
    Code?: Integer;
    /**
     * The current state of the instance.
     */
    Name?: InstanceStateName;
  }
  export interface InstanceStateChange {
    /**
     * The current state of the instance.
     */
    CurrentState?: InstanceState;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The previous state of the instance.
     */
    PreviousState?: InstanceState;
  }
  export type InstanceStateChangeList = InstanceStateChange[];
  export type InstanceStateName = "pending"|"running"|"shutting-down"|"terminated"|"stopping"|"stopped"|string;
  export interface InstanceStatus {
    /**
     * The Availability Zone of the instance.
     */
    AvailabilityZone?: String;
    /**
     * Any scheduled events associated with the instance.
     */
    Events?: InstanceStatusEventList;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The intended state of the instance. DescribeInstanceStatus requires that an instance be in the running state.
     */
    InstanceState?: InstanceState;
    /**
     * Reports impaired functionality that stems from issues internal to the instance, such as impaired reachability.
     */
    InstanceStatus?: InstanceStatusSummary;
    /**
     * Reports impaired functionality that stems from issues related to the systems that support an instance, such as hardware failures and network connectivity problems.
     */
    SystemStatus?: InstanceStatusSummary;
  }
  export interface InstanceStatusDetails {
    /**
     * The time when a status check failed. For an instance that was launched and impaired, this is the time when the instance was launched.
     */
    ImpairedSince?: DateTime;
    /**
     * The type of instance status.
     */
    Name?: StatusName;
    /**
     * The status.
     */
    Status?: StatusType;
  }
  export type InstanceStatusDetailsList = InstanceStatusDetails[];
  export interface InstanceStatusEvent {
    /**
     * The event code.
     */
    Code?: EventCode;
    /**
     * A description of the event. After a scheduled event is completed, it can still be described for up to a week. If the event has been completed, this description starts with the following text: [Completed].
     */
    Description?: String;
    /**
     * The latest scheduled end time for the event.
     */
    NotAfter?: DateTime;
    /**
     * The earliest scheduled start time for the event.
     */
    NotBefore?: DateTime;
  }
  export type InstanceStatusEventList = InstanceStatusEvent[];
  export type InstanceStatusList = InstanceStatus[];
  export interface InstanceStatusSummary {
    /**
     * The system instance health or application instance health.
     */
    Details?: InstanceStatusDetailsList;
    /**
     * The status.
     */
    Status?: SummaryStatus;
  }
  export type InstanceType = "t1.micro"|"t2.nano"|"t2.micro"|"t2.small"|"t2.medium"|"t2.large"|"t2.xlarge"|"t2.2xlarge"|"t3.nano"|"t3.micro"|"t3.small"|"t3.medium"|"t3.large"|"t3.xlarge"|"t3.2xlarge"|"m1.small"|"m1.medium"|"m1.large"|"m1.xlarge"|"m3.medium"|"m3.large"|"m3.xlarge"|"m3.2xlarge"|"m4.large"|"m4.xlarge"|"m4.2xlarge"|"m4.4xlarge"|"m4.10xlarge"|"m4.16xlarge"|"m2.xlarge"|"m2.2xlarge"|"m2.4xlarge"|"cr1.8xlarge"|"r3.large"|"r3.xlarge"|"r3.2xlarge"|"r3.4xlarge"|"r3.8xlarge"|"r4.large"|"r4.xlarge"|"r4.2xlarge"|"r4.4xlarge"|"r4.8xlarge"|"r4.16xlarge"|"r5.large"|"r5.xlarge"|"r5.2xlarge"|"r5.4xlarge"|"r5.8xlarge"|"r5.12xlarge"|"r5.16xlarge"|"r5.24xlarge"|"r5.metal"|"r5d.large"|"r5d.xlarge"|"r5d.2xlarge"|"r5d.4xlarge"|"r5d.8xlarge"|"r5d.12xlarge"|"r5d.16xlarge"|"r5d.24xlarge"|"r5d.metal"|"x1.16xlarge"|"x1.32xlarge"|"x1e.xlarge"|"x1e.2xlarge"|"x1e.4xlarge"|"x1e.8xlarge"|"x1e.16xlarge"|"x1e.32xlarge"|"i2.xlarge"|"i2.2xlarge"|"i2.4xlarge"|"i2.8xlarge"|"i3.large"|"i3.xlarge"|"i3.2xlarge"|"i3.4xlarge"|"i3.8xlarge"|"i3.16xlarge"|"i3.metal"|"hi1.4xlarge"|"hs1.8xlarge"|"c1.medium"|"c1.xlarge"|"c3.large"|"c3.xlarge"|"c3.2xlarge"|"c3.4xlarge"|"c3.8xlarge"|"c4.large"|"c4.xlarge"|"c4.2xlarge"|"c4.4xlarge"|"c4.8xlarge"|"c5.large"|"c5.xlarge"|"c5.2xlarge"|"c5.4xlarge"|"c5.9xlarge"|"c5.18xlarge"|"c5d.large"|"c5d.xlarge"|"c5d.2xlarge"|"c5d.4xlarge"|"c5d.9xlarge"|"c5d.18xlarge"|"cc1.4xlarge"|"cc2.8xlarge"|"g2.2xlarge"|"g2.8xlarge"|"g3.4xlarge"|"g3.8xlarge"|"g3.16xlarge"|"cg1.4xlarge"|"p2.xlarge"|"p2.8xlarge"|"p2.16xlarge"|"p3.2xlarge"|"p3.8xlarge"|"p3.16xlarge"|"d2.xlarge"|"d2.2xlarge"|"d2.4xlarge"|"d2.8xlarge"|"f1.2xlarge"|"f1.4xlarge"|"f1.16xlarge"|"m5.large"|"m5.xlarge"|"m5.2xlarge"|"m5.4xlarge"|"m5.12xlarge"|"m5.24xlarge"|"m5d.large"|"m5d.xlarge"|"m5d.2xlarge"|"m5d.4xlarge"|"m5d.12xlarge"|"m5d.24xlarge"|"h1.2xlarge"|"h1.4xlarge"|"h1.8xlarge"|"h1.16xlarge"|"z1d.large"|"z1d.xlarge"|"z1d.2xlarge"|"z1d.3xlarge"|"z1d.6xlarge"|"z1d.12xlarge"|"u-6tb1.metal"|"u-9tb1.metal"|"u-12tb1.metal"|string;
  export type InstanceTypeList = InstanceType[];
  export type Integer = number;
  export type InterfacePermissionType = "INSTANCE-ATTACH"|"EIP-ASSOCIATE"|string;
  export interface InternetGateway {
    /**
     * Any VPCs attached to the internet gateway.
     */
    Attachments?: InternetGatewayAttachmentList;
    /**
     * The ID of the internet gateway.
     */
    InternetGatewayId?: String;
    /**
     * Any tags assigned to the internet gateway.
     */
    Tags?: TagList;
  }
  export interface InternetGatewayAttachment {
    /**
     * The current state of the attachment. For an internet gateway, the state is available when attached to a VPC; otherwise, this value is not returned.
     */
    State?: AttachmentStatus;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type InternetGatewayAttachmentList = InternetGatewayAttachment[];
  export type InternetGatewayList = InternetGateway[];
  export interface IpPermission {
    /**
     * The start of port range for the TCP and UDP protocols, or an ICMP/ICMPv6 type number. A value of -1 indicates all ICMP/ICMPv6 types. If you specify all ICMP/ICMPv6 types, you must specify all codes.
     */
    FromPort?: Integer;
    /**
     * The IP protocol name (tcp, udp, icmp) or number (see Protocol Numbers).  [EC2-VPC only] Use -1 to specify all protocols. When authorizing security group rules, specifying -1 or a protocol number other than tcp, udp, icmp, or 58 (ICMPv6) allows traffic on all ports, regardless of any port range you specify. For tcp, udp, and icmp, you must specify a port range. For 58 (ICMPv6), you can optionally specify a port range; if you don't, traffic for all types and codes is allowed when authorizing rules. 
     */
    IpProtocol?: String;
    /**
     * One or more IPv4 ranges.
     */
    IpRanges?: IpRangeList;
    /**
     * [EC2-VPC only] One or more IPv6 ranges.
     */
    Ipv6Ranges?: Ipv6RangeList;
    /**
     * [EC2-VPC only] One or more prefix list IDs for an AWS service. With AuthorizeSecurityGroupEgress, this is the AWS service that you want to access through a VPC endpoint from instances associated with the security group.
     */
    PrefixListIds?: PrefixListIdList;
    /**
     * The end of port range for the TCP and UDP protocols, or an ICMP/ICMPv6 code. A value of -1 indicates all ICMP/ICMPv6 codes for the specified ICMP type. If you specify all ICMP/ICMPv6 types, you must specify all codes.
     */
    ToPort?: Integer;
    /**
     * One or more security group and AWS account ID pairs.
     */
    UserIdGroupPairs?: UserIdGroupPairList;
  }
  export type IpPermissionList = IpPermission[];
  export interface IpRange {
    /**
     * The IPv4 CIDR range. You can either specify a CIDR range or a source security group, not both. To specify a single IPv4 address, use the /32 prefix length.
     */
    CidrIp?: String;
    /**
     * A description for the security group rule that references this IPv4 address range. Constraints: Up to 255 characters in length. Allowed characters are a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=;{}!$*
     */
    Description?: String;
  }
  export type IpRangeList = IpRange[];
  export type IpRanges = String[];
  export type Ipv6Address = string;
  export type Ipv6AddressList = String[];
  export interface Ipv6CidrBlock {
    /**
     * The IPv6 CIDR block.
     */
    Ipv6CidrBlock?: String;
  }
  export type Ipv6CidrBlockSet = Ipv6CidrBlock[];
  export interface Ipv6Range {
    /**
     * The IPv6 CIDR range. You can either specify a CIDR range or a source security group, not both. To specify a single IPv6 address, use the /128 prefix length.
     */
    CidrIpv6?: String;
    /**
     * A description for the security group rule that references this IPv6 address range. Constraints: Up to 255 characters in length. Allowed characters are a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=;{}!$*
     */
    Description?: String;
  }
  export type Ipv6RangeList = Ipv6Range[];
  export type KeyNameStringList = String[];
  export interface KeyPair {
    /**
     * The SHA-1 digest of the DER encoded private key.
     */
    KeyFingerprint?: String;
    /**
     * An unencrypted PEM encoded RSA private key.
     */
    KeyMaterial?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
  }
  export interface KeyPairInfo {
    /**
     * If you used CreateKeyPair to create the key pair, this is the SHA-1 digest of the DER encoded private key. If you used ImportKeyPair to provide AWS the public key, this is the MD5 public key fingerprint as specified in section 4 of RFC4716.
     */
    KeyFingerprint?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
  }
  export type KeyPairList = KeyPairInfo[];
  export interface LaunchPermission {
    /**
     * The name of the group.
     */
    Group?: PermissionGroup;
    /**
     * The AWS account ID.
     */
    UserId?: String;
  }
  export type LaunchPermissionList = LaunchPermission[];
  export interface LaunchPermissionModifications {
    /**
     * The AWS account ID to add to the list of launch permissions for the AMI.
     */
    Add?: LaunchPermissionList;
    /**
     * The AWS account ID to remove from the list of launch permissions for the AMI.
     */
    Remove?: LaunchPermissionList;
  }
  export interface LaunchSpecification {
    /**
     * The Base64-encoded user data for the instance.
     */
    UserData?: String;
    /**
     * One or more security groups. When requesting instances in a VPC, you must specify the IDs of the security groups. When requesting instances in EC2-Classic, you can specify the names or the IDs of the security groups.
     */
    SecurityGroups?: GroupIdentifierList;
    /**
     * Deprecated.
     */
    AddressingType?: String;
    /**
     * One or more block device mapping entries.
     */
    BlockDeviceMappings?: BlockDeviceMappingList;
    /**
     * Indicates whether the instance is optimized for EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS Optimized instance. Default: false 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: IamInstanceProfileSpecification;
    /**
     * The ID of the AMI.
     */
    ImageId?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The ID of the kernel.
     */
    KernelId?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
    /**
     * One or more network interfaces. If you specify a network interface, you must specify subnet IDs and security group IDs using the network interface.
     */
    NetworkInterfaces?: InstanceNetworkInterfaceSpecificationList;
    /**
     * The placement information for the instance.
     */
    Placement?: SpotPlacement;
    /**
     * The ID of the RAM disk.
     */
    RamdiskId?: String;
    /**
     * The ID of the subnet in which to launch the instance.
     */
    SubnetId?: String;
    Monitoring?: RunInstancesMonitoringEnabled;
  }
  export type LaunchSpecsList = SpotFleetLaunchSpecification[];
  export interface LaunchTemplate {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The time launch template was created.
     */
    CreateTime?: DateTime;
    /**
     * The principal that created the launch template. 
     */
    CreatedBy?: String;
    /**
     * The version number of the default version of the launch template.
     */
    DefaultVersionNumber?: Long;
    /**
     * The version number of the latest version of the launch template.
     */
    LatestVersionNumber?: Long;
    /**
     * The tags for the launch template.
     */
    Tags?: TagList;
  }
  export interface LaunchTemplateBlockDeviceMapping {
    /**
     * The device name.
     */
    DeviceName?: String;
    /**
     * The virtual device name (ephemeralN).
     */
    VirtualName?: String;
    /**
     * Information about the block device for an EBS volume.
     */
    Ebs?: LaunchTemplateEbsBlockDevice;
    /**
     * Suppresses the specified device included in the block device mapping of the AMI.
     */
    NoDevice?: String;
  }
  export type LaunchTemplateBlockDeviceMappingList = LaunchTemplateBlockDeviceMapping[];
  export interface LaunchTemplateBlockDeviceMappingRequest {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    DeviceName?: String;
    /**
     * The virtual device name (ephemeralN). Instance store volumes are numbered starting from 0. An instance type with 2 available instance store volumes can specify mappings for ephemeral0 and ephemeral1. The number of available instance store volumes depends on the instance type. After you connect to the instance, you must mount the volume.
     */
    VirtualName?: String;
    /**
     * Parameters used to automatically set up EBS volumes when the instance is launched.
     */
    Ebs?: LaunchTemplateEbsBlockDeviceRequest;
    /**
     * Suppresses the specified device included in the block device mapping of the AMI.
     */
    NoDevice?: String;
  }
  export type LaunchTemplateBlockDeviceMappingRequestList = LaunchTemplateBlockDeviceMappingRequest[];
  export interface LaunchTemplateConfig {
    /**
     * The launch template.
     */
    LaunchTemplateSpecification?: FleetLaunchTemplateSpecification;
    /**
     * Any parameters that you specify override the same parameters in the launch template.
     */
    Overrides?: LaunchTemplateOverridesList;
  }
  export type LaunchTemplateConfigList = LaunchTemplateConfig[];
  export interface LaunchTemplateCpuOptions {
    /**
     * The number of CPU cores for the instance.
     */
    CoreCount?: Integer;
    /**
     * The number of threads per CPU core.
     */
    ThreadsPerCore?: Integer;
  }
  export interface LaunchTemplateCpuOptionsRequest {
    /**
     * The number of CPU cores for the instance.
     */
    CoreCount?: Integer;
    /**
     * The number of threads per CPU core. To disable Intel Hyper-Threading Technology for the instance, specify a value of 1. Otherwise, specify the default value of 2.
     */
    ThreadsPerCore?: Integer;
  }
  export interface LaunchTemplateEbsBlockDevice {
    /**
     * Indicates whether the EBS volume is encrypted.
     */
    Encrypted?: Boolean;
    /**
     * Indicates whether the EBS volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The number of I/O operations per second (IOPS) that the volume supports. 
     */
    Iops?: Integer;
    /**
     * The ARN of the AWS Key Management Service (AWS KMS) CMK used for encryption.
     */
    KmsKeyId?: String;
    /**
     * The ID of the snapshot.
     */
    SnapshotId?: String;
    /**
     * The size of the volume, in GiB.
     */
    VolumeSize?: Integer;
    /**
     * The volume type.
     */
    VolumeType?: VolumeType;
  }
  export interface LaunchTemplateEbsBlockDeviceRequest {
    /**
     * Indicates whether the EBS volume is encrypted. Encrypted volumes can only be attached to instances that support Amazon EBS encryption. If you are creating a volume from a snapshot, you can't specify an encryption value.
     */
    Encrypted?: Boolean;
    /**
     * Indicates whether the EBS volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The number of I/O operations per second (IOPS) that the volume supports. For io1, this represents the number of IOPS that are provisioned for the volume. For gp2, this represents the baseline performance of the volume and the rate at which the volume accumulates I/O credits for bursting. For more information about General Purpose SSD baseline performance, I/O credits, and bursting, see Amazon EBS Volume Types in the Amazon Elastic Compute Cloud User Guide. Condition: This parameter is required for requests to create io1 volumes; it is not used in requests to create gp2, st1, sc1, or standard volumes.
     */
    Iops?: Integer;
    /**
     * The ARN of the AWS Key Management Service (AWS KMS) CMK used for encryption.
     */
    KmsKeyId?: String;
    /**
     * The ID of the snapshot.
     */
    SnapshotId?: String;
    /**
     * The size of the volume, in GiB. Default: If you're creating the volume from a snapshot and don't specify a volume size, the default is the snapshot size.
     */
    VolumeSize?: Integer;
    /**
     * The volume type.
     */
    VolumeType?: VolumeType;
  }
  export type LaunchTemplateErrorCode = "launchTemplateIdDoesNotExist"|"launchTemplateIdMalformed"|"launchTemplateNameDoesNotExist"|"launchTemplateNameMalformed"|"launchTemplateVersionDoesNotExist"|"unexpectedError"|string;
  export interface LaunchTemplateIamInstanceProfileSpecification {
    /**
     * The Amazon Resource Name (ARN) of the instance profile.
     */
    Arn?: String;
    /**
     * The name of the instance profile.
     */
    Name?: String;
  }
  export interface LaunchTemplateIamInstanceProfileSpecificationRequest {
    /**
     * The Amazon Resource Name (ARN) of the instance profile.
     */
    Arn?: String;
    /**
     * The name of the instance profile.
     */
    Name?: String;
  }
  export interface LaunchTemplateInstanceMarketOptions {
    /**
     * The market type.
     */
    MarketType?: MarketType;
    /**
     * The options for Spot Instances.
     */
    SpotOptions?: LaunchTemplateSpotMarketOptions;
  }
  export interface LaunchTemplateInstanceMarketOptionsRequest {
    /**
     * The market type.
     */
    MarketType?: MarketType;
    /**
     * The options for Spot Instances.
     */
    SpotOptions?: LaunchTemplateSpotMarketOptionsRequest;
  }
  export interface LaunchTemplateInstanceNetworkInterfaceSpecification {
    /**
     * Indicates whether to associate a public IPv4 address with eth0 for a new network interface.
     */
    AssociatePublicIpAddress?: Boolean;
    /**
     * Indicates whether the network interface is deleted when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
    /**
     * A description for the network interface.
     */
    Description?: String;
    /**
     * The device index for the network interface attachment.
     */
    DeviceIndex?: Integer;
    /**
     * The IDs of one or more security groups.
     */
    Groups?: GroupIdStringList;
    /**
     * The number of IPv6 addresses for the network interface.
     */
    Ipv6AddressCount?: Integer;
    /**
     * The IPv6 addresses for the network interface.
     */
    Ipv6Addresses?: InstanceIpv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The primary private IPv4 address of the network interface.
     */
    PrivateIpAddress?: String;
    /**
     * One or more private IPv4 addresses.
     */
    PrivateIpAddresses?: PrivateIpAddressSpecificationList;
    /**
     * The number of secondary private IPv4 addresses for the network interface.
     */
    SecondaryPrivateIpAddressCount?: Integer;
    /**
     * The ID of the subnet for the network interface.
     */
    SubnetId?: String;
  }
  export type LaunchTemplateInstanceNetworkInterfaceSpecificationList = LaunchTemplateInstanceNetworkInterfaceSpecification[];
  export interface LaunchTemplateInstanceNetworkInterfaceSpecificationRequest {
    /**
     * Associates a public IPv4 address with eth0 for a new network interface.
     */
    AssociatePublicIpAddress?: Boolean;
    /**
     * Indicates whether the network interface is deleted when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
    /**
     * A description for the network interface.
     */
    Description?: String;
    /**
     * The device index for the network interface attachment.
     */
    DeviceIndex?: Integer;
    /**
     * The IDs of one or more security groups.
     */
    Groups?: SecurityGroupIdStringList;
    /**
     * The number of IPv6 addresses to assign to a network interface. Amazon EC2 automatically selects the IPv6 addresses from the subnet range. You can't use this option if specifying specific IPv6 addresses.
     */
    Ipv6AddressCount?: Integer;
    /**
     * One or more specific IPv6 addresses from the IPv6 CIDR block range of your subnet. You can't use this option if you're specifying a number of IPv6 addresses.
     */
    Ipv6Addresses?: InstanceIpv6AddressListRequest;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The primary private IPv4 address of the network interface.
     */
    PrivateIpAddress?: String;
    /**
     * One or more private IPv4 addresses.
     */
    PrivateIpAddresses?: PrivateIpAddressSpecificationList;
    /**
     * The number of secondary private IPv4 addresses to assign to a network interface.
     */
    SecondaryPrivateIpAddressCount?: Integer;
    /**
     * The ID of the subnet for the network interface.
     */
    SubnetId?: String;
  }
  export type LaunchTemplateInstanceNetworkInterfaceSpecificationRequestList = LaunchTemplateInstanceNetworkInterfaceSpecificationRequest[];
  export type LaunchTemplateName = string;
  export type LaunchTemplateNameStringList = LaunchTemplateName[];
  export interface LaunchTemplateOverrides {
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The maximum price per unit hour that you are willing to pay for a Spot Instance.
     */
    SpotPrice?: String;
    /**
     * The ID of the subnet in which to launch the instances.
     */
    SubnetId?: String;
    /**
     * The Availability Zone in which to launch the instances.
     */
    AvailabilityZone?: String;
    /**
     * The number of units provided by the specified instance type.
     */
    WeightedCapacity?: Double;
    /**
     * The priority for the launch template override. If OnDemandAllocationStrategy is set to prioritized, Spot Fleet uses priority to determine which launch template override to use first in fulfilling On-Demand capacity. The highest priority is launched first. Valid values are whole numbers starting at 0. The lower the number, the higher the priority. If no number is set, the launch template override has the lowest priority.
     */
    Priority?: Double;
  }
  export type LaunchTemplateOverridesList = LaunchTemplateOverrides[];
  export interface LaunchTemplatePlacement {
    /**
     * The Availability Zone of the instance.
     */
    AvailabilityZone?: String;
    /**
     * The affinity setting for the instance on the Dedicated Host.
     */
    Affinity?: String;
    /**
     * The name of the placement group for the instance.
     */
    GroupName?: String;
    /**
     * The ID of the Dedicated Host for the instance.
     */
    HostId?: String;
    /**
     * The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware. 
     */
    Tenancy?: Tenancy;
    /**
     * Reserved for future use.
     */
    SpreadDomain?: String;
  }
  export interface LaunchTemplatePlacementRequest {
    /**
     * The Availability Zone for the instance.
     */
    AvailabilityZone?: String;
    /**
     * The affinity setting for an instance on a Dedicated Host.
     */
    Affinity?: String;
    /**
     * The name of the placement group for the instance.
     */
    GroupName?: String;
    /**
     * The ID of the Dedicated Host for the instance.
     */
    HostId?: String;
    /**
     * The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware.
     */
    Tenancy?: Tenancy;
    /**
     * Reserved for future use.
     */
    SpreadDomain?: String;
  }
  export type LaunchTemplateSet = LaunchTemplate[];
  export interface LaunchTemplateSpecification {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: String;
    /**
     * The version number of the launch template. Default: The default version for the launch template.
     */
    Version?: String;
  }
  export interface LaunchTemplateSpotMarketOptions {
    /**
     * The maximum hourly price you're willing to pay for the Spot Instances.
     */
    MaxPrice?: String;
    /**
     * The Spot Instance request type.
     */
    SpotInstanceType?: SpotInstanceType;
    /**
     * The required duration for the Spot Instances (also known as Spot blocks), in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360).
     */
    BlockDurationMinutes?: Integer;
    /**
     * The end date of the request. For a one-time request, the request remains active until all instances launch, the request is canceled, or this date is reached. If the request is persistent, it remains active until it is canceled or this date and time is reached.
     */
    ValidUntil?: DateTime;
    /**
     * The behavior when a Spot Instance is interrupted.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
  }
  export interface LaunchTemplateSpotMarketOptionsRequest {
    /**
     * The maximum hourly price you're willing to pay for the Spot Instances.
     */
    MaxPrice?: String;
    /**
     * The Spot Instance request type.
     */
    SpotInstanceType?: SpotInstanceType;
    /**
     * The required duration for the Spot Instances (also known as Spot blocks), in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360).
     */
    BlockDurationMinutes?: Integer;
    /**
     * The end date of the request. For a one-time request, the request remains active until all instances launch, the request is canceled, or this date is reached. If the request is persistent, it remains active until it is canceled or this date and time is reached. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
  }
  export interface LaunchTemplateTagSpecification {
    /**
     * The type of resource.
     */
    ResourceType?: ResourceType;
    /**
     * The tags for the resource.
     */
    Tags?: TagList;
  }
  export type LaunchTemplateTagSpecificationList = LaunchTemplateTagSpecification[];
  export interface LaunchTemplateTagSpecificationRequest {
    /**
     * The type of resource to tag. Currently, the resource types that support tagging on creation are instance and volume. To tag a resource after it has been created, see CreateTags.
     */
    ResourceType?: ResourceType;
    /**
     * The tags to apply to the resource.
     */
    Tags?: TagList;
  }
  export type LaunchTemplateTagSpecificationRequestList = LaunchTemplateTagSpecificationRequest[];
  export interface LaunchTemplateVersion {
    /**
     * The ID of the launch template.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version number.
     */
    VersionNumber?: Long;
    /**
     * The description for the version.
     */
    VersionDescription?: VersionDescription;
    /**
     * The time the version was created.
     */
    CreateTime?: DateTime;
    /**
     * The principal that created the version.
     */
    CreatedBy?: String;
    /**
     * Indicates whether the version is the default version.
     */
    DefaultVersion?: Boolean;
    /**
     * Information about the launch template.
     */
    LaunchTemplateData?: ResponseLaunchTemplateData;
  }
  export type LaunchTemplateVersionSet = LaunchTemplateVersion[];
  export interface LaunchTemplatesMonitoring {
    /**
     * Indicates whether detailed monitoring is enabled. Otherwise, basic monitoring is enabled.
     */
    Enabled?: Boolean;
  }
  export interface LaunchTemplatesMonitoringRequest {
    /**
     * Specify true to enable detailed monitoring. Otherwise, basic monitoring is enabled.
     */
    Enabled?: Boolean;
  }
  export type ListingState = "available"|"sold"|"cancelled"|"pending"|string;
  export type ListingStatus = "active"|"pending"|"cancelled"|"closed"|string;
  export interface LoadBalancersConfig {
    /**
     * The Classic Load Balancers.
     */
    ClassicLoadBalancersConfig?: ClassicLoadBalancersConfig;
    /**
     * The target groups.
     */
    TargetGroupsConfig?: TargetGroupsConfig;
  }
  export interface LoadPermission {
    /**
     * The AWS account ID.
     */
    UserId?: String;
    /**
     * The name of the group.
     */
    Group?: PermissionGroup;
  }
  export type LoadPermissionList = LoadPermission[];
  export type LoadPermissionListRequest = LoadPermissionRequest[];
  export interface LoadPermissionModifications {
    /**
     * The load permissions to add.
     */
    Add?: LoadPermissionListRequest;
    /**
     * The load permissions to remove.
     */
    Remove?: LoadPermissionListRequest;
  }
  export interface LoadPermissionRequest {
    /**
     * The name of the group.
     */
    Group?: PermissionGroup;
    /**
     * The AWS account ID.
     */
    UserId?: String;
  }
  export type LogDestinationType = "cloud-watch-logs"|"s3"|string;
  export type Long = number;
  export type MarketType = "spot"|string;
  export type MaxResults = number;
  export interface ModifyFleetRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicates whether running instances should be terminated if the total target capacity of the EC2 Fleet is decreased below the current size of the EC2 Fleet.
     */
    ExcessCapacityTerminationPolicy?: FleetExcessCapacityTerminationPolicy;
    /**
     * The ID of the EC2 Fleet.
     */
    FleetId: FleetIdentifier;
    /**
     * The size of the EC2 Fleet.
     */
    TargetCapacitySpecification: TargetCapacitySpecificationRequest;
  }
  export interface ModifyFleetResult {
    /**
     * Is true if the request succeeds, and an error otherwise.
     */
    Return?: Boolean;
  }
  export interface ModifyFpgaImageAttributeRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the AFI.
     */
    FpgaImageId: String;
    /**
     * The name of the attribute.
     */
    Attribute?: FpgaImageAttributeName;
    /**
     * The operation type.
     */
    OperationType?: OperationType;
    /**
     * One or more AWS account IDs. This parameter is valid only when modifying the loadPermission attribute.
     */
    UserIds?: UserIdStringList;
    /**
     * One or more user groups. This parameter is valid only when modifying the loadPermission attribute.
     */
    UserGroups?: UserGroupStringList;
    /**
     * One or more product codes. After you add a product code to an AFI, it can't be removed. This parameter is valid only when modifying the productCodes attribute.
     */
    ProductCodes?: ProductCodeStringList;
    /**
     * The load permission for the AFI.
     */
    LoadPermission?: LoadPermissionModifications;
    /**
     * A description for the AFI.
     */
    Description?: String;
    /**
     * A name for the AFI.
     */
    Name?: String;
  }
  export interface ModifyFpgaImageAttributeResult {
    /**
     * Information about the attribute.
     */
    FpgaImageAttribute?: FpgaImageAttribute;
  }
  export interface ModifyHostsRequest {
    /**
     * Specify whether to enable or disable auto-placement.
     */
    AutoPlacement: AutoPlacement;
    /**
     * The IDs of the Dedicated Hosts to modify.
     */
    HostIds: RequestHostIdList;
  }
  export interface ModifyHostsResult {
    /**
     * The IDs of the Dedicated Hosts that were successfully modified.
     */
    Successful?: ResponseHostIdList;
    /**
     * The IDs of the Dedicated Hosts that could not be modified. Check whether the setting you requested can be used.
     */
    Unsuccessful?: UnsuccessfulItemList;
  }
  export interface ModifyIdFormatRequest {
    /**
     * The type of resource: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. Alternatively, use the all-current option to include all resource types that are currently within their opt-in period for longer IDs.
     */
    Resource: String;
    /**
     * Indicate whether the resource should use longer IDs (17-character IDs).
     */
    UseLongIds: Boolean;
  }
  export interface ModifyIdentityIdFormatRequest {
    /**
     * The ARN of the principal, which can be an IAM user, IAM role, or the root user. Specify all to modify the ID format for all IAM users, IAM roles, and the root user of the account.
     */
    PrincipalArn: String;
    /**
     * The type of resource: bundle | conversion-task | customer-gateway | dhcp-options | elastic-ip-allocation | elastic-ip-association | export-task | flow-log | image | import-task | internet-gateway | network-acl | network-acl-association | network-interface | network-interface-attachment | prefix-list | route-table | route-table-association | security-group | subnet | subnet-cidr-block-association | vpc | vpc-cidr-block-association | vpc-endpoint | vpc-peering-connection | vpn-connection | vpn-gateway. Alternatively, use the all-current option to include all resource types that are currently within their opt-in period for longer IDs.
     */
    Resource: String;
    /**
     * Indicates whether the resource should use longer IDs (17-character IDs)
     */
    UseLongIds: Boolean;
  }
  export interface ModifyImageAttributeRequest {
    /**
     * The name of the attribute to modify. The valid values are description, launchPermission, and productCodes.
     */
    Attribute?: String;
    /**
     * A new description for the AMI.
     */
    Description?: AttributeValue;
    /**
     * The ID of the AMI.
     */
    ImageId: String;
    /**
     * A new launch permission for the AMI.
     */
    LaunchPermission?: LaunchPermissionModifications;
    /**
     * The operation type. This parameter can be used only when the Attribute parameter is launchPermission.
     */
    OperationType?: OperationType;
    /**
     * One or more DevPay product codes. After you add a product code to an AMI, it can't be removed.
     */
    ProductCodes?: ProductCodeStringList;
    /**
     * One or more user groups. This parameter can be used only when the Attribute parameter is launchPermission.
     */
    UserGroups?: UserGroupStringList;
    /**
     * One or more AWS account IDs. This parameter can be used only when the Attribute parameter is launchPermission.
     */
    UserIds?: UserIdStringList;
    /**
     * The value of the attribute being modified. This parameter can be used only when the Attribute parameter is description or productCodes.
     */
    Value?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ModifyInstanceAttributeRequest {
    /**
     * Specifies whether source/destination checking is enabled. A value of true means that checking is enabled, and false means that checking is disabled. This value must be false for a NAT instance to perform NAT.
     */
    SourceDestCheck?: AttributeBooleanValue;
    /**
     * The name of the attribute.
     */
    Attribute?: InstanceAttributeName;
    /**
     * Modifies the DeleteOnTermination attribute for volumes that are currently attached. The volume must be owned by the caller. If no value is specified for DeleteOnTermination, the default is true and the volume is deleted when the instance is terminated. To add instance store volumes to an Amazon EBS-backed instance, you must add them when you launch the instance. For more information, see Updating the Block Device Mapping when Launching an Instance in the Amazon Elastic Compute Cloud User Guide.
     */
    BlockDeviceMappings?: InstanceBlockDeviceMappingSpecificationList;
    /**
     * If the value is true, you can't terminate the instance using the Amazon EC2 console, CLI, or API; otherwise, you can. You cannot use this parameter for Spot Instances.
     */
    DisableApiTermination?: AttributeBooleanValue;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Specifies whether the instance is optimized for Amazon EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS Optimized instance.
     */
    EbsOptimized?: AttributeBooleanValue;
    /**
     * Set to true to enable enhanced networking with ENA for the instance. This option is supported only for HVM instances. Specifying this option with a PV instance can make it unreachable.
     */
    EnaSupport?: AttributeBooleanValue;
    /**
     * [EC2-VPC] Changes the security groups of the instance. You must specify at least one security group, even if it's just the default security group for the VPC. You must specify the security group ID, not the security group name.
     */
    Groups?: GroupIdStringList;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
    /**
     * Specifies whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).
     */
    InstanceInitiatedShutdownBehavior?: AttributeValue;
    /**
     * Changes the instance type to the specified value. For more information, see Instance Types. If the instance type is not valid, the error returned is InvalidInstanceAttributeValue.
     */
    InstanceType?: AttributeValue;
    /**
     * Changes the instance's kernel to the specified value. We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see PV-GRUB.
     */
    Kernel?: AttributeValue;
    /**
     * Changes the instance's RAM disk to the specified value. We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see PV-GRUB.
     */
    Ramdisk?: AttributeValue;
    /**
     * Set to simple to enable enhanced networking with the Intel 82599 Virtual Function interface for the instance. There is no way to disable enhanced networking with the Intel 82599 Virtual Function interface at this time. This option is supported only for HVM instances. Specifying this option with a PV instance can make it unreachable.
     */
    SriovNetSupport?: AttributeValue;
    /**
     * Changes the instance's user data to the specified value. If you are using an AWS SDK or command line tool, base64-encoding is performed for you, and you can load the text from a file. Otherwise, you must provide base64-encoded text.
     */
    UserData?: BlobAttributeValue;
    /**
     * A new value for the attribute. Use only with the kernel, ramdisk, userData, disableApiTermination, or instanceInitiatedShutdownBehavior attribute.
     */
    Value?: String;
  }
  export interface ModifyInstanceCreditSpecificationRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * A unique, case-sensitive token that you provide to ensure idempotency of your modification request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * Information about the credit option for CPU usage.
     */
    InstanceCreditSpecifications: InstanceCreditSpecificationListRequest;
  }
  export interface ModifyInstanceCreditSpecificationResult {
    /**
     * Information about the instances whose credit option for CPU usage was successfully modified.
     */
    SuccessfulInstanceCreditSpecifications?: SuccessfulInstanceCreditSpecificationSet;
    /**
     * Information about the instances whose credit option for CPU usage was not modified.
     */
    UnsuccessfulInstanceCreditSpecifications?: UnsuccessfulInstanceCreditSpecificationSet;
  }
  export interface ModifyInstancePlacementRequest {
    /**
     * The affinity setting for the instance.
     */
    Affinity?: Affinity;
    /**
     * The name of the placement group in which to place the instance. For spread placement groups, the instance must have a tenancy of default. For cluster placement groups, the instance must have a tenancy of default or dedicated. To remove an instance from a placement group, specify an empty string ("").
     */
    GroupName?: String;
    /**
     * The ID of the Dedicated Host with which to associate the instance.
     */
    HostId?: String;
    /**
     * The ID of the instance that you are modifying.
     */
    InstanceId: String;
    /**
     * The tenancy for the instance.
     */
    Tenancy?: HostTenancy;
  }
  export interface ModifyInstancePlacementResult {
    /**
     * Is true if the request succeeds, and an error otherwise.
     */
    Return?: Boolean;
  }
  export interface ModifyLaunchTemplateRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * The ID of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateId?: String;
    /**
     * The name of the launch template. You must specify either the launch template ID or launch template name in the request.
     */
    LaunchTemplateName?: LaunchTemplateName;
    /**
     * The version number of the launch template to set as the default version.
     */
    DefaultVersion?: String;
  }
  export interface ModifyLaunchTemplateResult {
    /**
     * Information about the launch template.
     */
    LaunchTemplate?: LaunchTemplate;
  }
  export interface ModifyNetworkInterfaceAttributeRequest {
    /**
     * Information about the interface attachment. If modifying the 'delete on termination' attribute, you must specify the ID of the interface attachment.
     */
    Attachment?: NetworkInterfaceAttachmentChanges;
    /**
     * A description for the network interface.
     */
    Description?: AttributeValue;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Changes the security groups for the network interface. The new set of groups you specify replaces the current set. You must specify at least one group, even if it's just the default security group in the VPC. You must specify the ID of the security group, not the name.
     */
    Groups?: SecurityGroupIdStringList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
    /**
     * Indicates whether source/destination checking is enabled. A value of true means checking is enabled, and false means checking is disabled. This value must be false for a NAT instance to perform NAT. For more information, see NAT Instances in the Amazon Virtual Private Cloud User Guide.
     */
    SourceDestCheck?: AttributeBooleanValue;
  }
  export interface ModifyReservedInstancesRequest {
    /**
     * The IDs of the Reserved Instances to modify.
     */
    ReservedInstancesIds: ReservedInstancesIdStringList;
    /**
     * A unique, case-sensitive token you provide to ensure idempotency of your modification request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * The configuration settings for the Reserved Instances to modify.
     */
    TargetConfigurations: ReservedInstancesConfigurationList;
  }
  export interface ModifyReservedInstancesResult {
    /**
     * The ID for the modification.
     */
    ReservedInstancesModificationId?: String;
  }
  export interface ModifySnapshotAttributeRequest {
    /**
     * The snapshot attribute to modify. Only volume creation permissions can be modified.
     */
    Attribute?: SnapshotAttributeName;
    /**
     * A JSON representation of the snapshot attribute modification.
     */
    CreateVolumePermission?: CreateVolumePermissionModifications;
    /**
     * The group to modify for the snapshot.
     */
    GroupNames?: GroupNameStringList;
    /**
     * The type of operation to perform to the attribute.
     */
    OperationType?: OperationType;
    /**
     * The ID of the snapshot.
     */
    SnapshotId: String;
    /**
     * The account ID to modify for the snapshot.
     */
    UserIds?: UserIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ModifySpotFleetRequestRequest {
    /**
     * Indicates whether running Spot Instances should be terminated if the target capacity of the Spot Fleet request is decreased below the current size of the Spot Fleet.
     */
    ExcessCapacityTerminationPolicy?: ExcessCapacityTerminationPolicy;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
    /**
     * The size of the fleet.
     */
    TargetCapacity?: Integer;
  }
  export interface ModifySpotFleetRequestResponse {
    /**
     * Is true if the request succeeds, and an error otherwise.
     */
    Return?: Boolean;
  }
  export interface ModifySubnetAttributeRequest {
    /**
     * Specify true to indicate that network interfaces created in the specified subnet should be assigned an IPv6 address. This includes a network interface that's created when launching an instance into the subnet (the instance therefore receives an IPv6 address).  If you enable the IPv6 addressing feature for your subnet, your network interface or instance only receives an IPv6 address if it's created using version 2016-11-15 or later of the Amazon EC2 API.
     */
    AssignIpv6AddressOnCreation?: AttributeBooleanValue;
    /**
     * Specify true to indicate that network interfaces created in the specified subnet should be assigned a public IPv4 address. This includes a network interface that's created when launching an instance into the subnet (the instance therefore receives a public IPv4 address).
     */
    MapPublicIpOnLaunch?: AttributeBooleanValue;
    /**
     * The ID of the subnet.
     */
    SubnetId: String;
  }
  export interface ModifyVolumeAttributeRequest {
    /**
     * Indicates whether the volume should be auto-enabled for I/O operations.
     */
    AutoEnableIO?: AttributeBooleanValue;
    /**
     * The ID of the volume.
     */
    VolumeId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ModifyVolumeRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the volume.
     */
    VolumeId: String;
    /**
     * The target size of the volume, in GiB. The target volume size must be greater than or equal to than the existing size of the volume. For information about available EBS volume sizes, see Amazon EBS Volume Types. Default: If no size is specified, the existing size is retained.
     */
    Size?: Integer;
    /**
     * The target EBS volume type of the volume. Default: If no type is specified, the existing type is retained.
     */
    VolumeType?: VolumeType;
    /**
     * The target IOPS rate of the volume. This is only valid for Provisioned IOPS SSD (io1) volumes. For more information, see Provisioned IOPS SSD (io1) Volumes. Default: If no IOPS value is specified, the existing value is retained.
     */
    Iops?: Integer;
  }
  export interface ModifyVolumeResult {
    /**
     * Information about the volume modification.
     */
    VolumeModification?: VolumeModification;
  }
  export interface ModifyVpcAttributeRequest {
    /**
     * Indicates whether the instances launched in the VPC get DNS hostnames. If enabled, instances in the VPC get DNS hostnames; otherwise, they do not. You cannot modify the DNS resolution and DNS hostnames attributes in the same request. Use separate requests for each attribute. You can only enable DNS hostnames if you've enabled DNS support.
     */
    EnableDnsHostnames?: AttributeBooleanValue;
    /**
     * Indicates whether the DNS resolution is supported for the VPC. If enabled, queries to the Amazon provided DNS server at the 169.254.169.253 IP address, or the reserved IP address at the base of the VPC network range "plus two" succeed. If disabled, the Amazon provided DNS service in the VPC that resolves public DNS hostnames to IP addresses is not enabled. You cannot modify the DNS resolution and DNS hostnames attributes in the same request. Use separate requests for each attribute.
     */
    EnableDnsSupport?: AttributeBooleanValue;
    /**
     * The ID of the VPC.
     */
    VpcId: String;
  }
  export interface ModifyVpcEndpointConnectionNotificationRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the notification.
     */
    ConnectionNotificationId: String;
    /**
     * The ARN for the SNS topic for the notification.
     */
    ConnectionNotificationArn?: String;
    /**
     * One or more events for the endpoint. Valid values are Accept, Connect, Delete, and Reject.
     */
    ConnectionEvents?: ValueStringList;
  }
  export interface ModifyVpcEndpointConnectionNotificationResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    ReturnValue?: Boolean;
  }
  export interface ModifyVpcEndpointRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the endpoint.
     */
    VpcEndpointId: String;
    /**
     * (Gateway endpoint) Specify true to reset the policy document to the default policy. The default policy allows full access to the service.
     */
    ResetPolicy?: Boolean;
    /**
     * (Gateway endpoint) A policy document to attach to the endpoint. The policy must be in valid JSON format.
     */
    PolicyDocument?: String;
    /**
     * (Gateway endpoint) One or more route tables IDs to associate with the endpoint.
     */
    AddRouteTableIds?: ValueStringList;
    /**
     * (Gateway endpoint) One or more route table IDs to disassociate from the endpoint.
     */
    RemoveRouteTableIds?: ValueStringList;
    /**
     * (Interface endpoint) One or more subnet IDs in which to serve the endpoint.
     */
    AddSubnetIds?: ValueStringList;
    /**
     * (Interface endpoint) One or more subnets IDs in which to remove the endpoint.
     */
    RemoveSubnetIds?: ValueStringList;
    /**
     * (Interface endpoint) One or more security group IDs to associate with the network interface.
     */
    AddSecurityGroupIds?: ValueStringList;
    /**
     * (Interface endpoint) One or more security group IDs to disassociate from the network interface.
     */
    RemoveSecurityGroupIds?: ValueStringList;
    /**
     * (Interface endpoint) Indicate whether a private hosted zone is associated with the VPC.
     */
    PrivateDnsEnabled?: Boolean;
  }
  export interface ModifyVpcEndpointResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface ModifyVpcEndpointServiceConfigurationRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the service.
     */
    ServiceId: String;
    /**
     * Indicate whether requests to create an endpoint to your service must be accepted.
     */
    AcceptanceRequired?: Boolean;
    /**
     * The Amazon Resource Names (ARNs) of Network Load Balancers to add to your service configuration.
     */
    AddNetworkLoadBalancerArns?: ValueStringList;
    /**
     * The Amazon Resource Names (ARNs) of Network Load Balancers to remove from your service configuration.
     */
    RemoveNetworkLoadBalancerArns?: ValueStringList;
  }
  export interface ModifyVpcEndpointServiceConfigurationResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface ModifyVpcEndpointServicePermissionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the service.
     */
    ServiceId: String;
    /**
     * The Amazon Resource Names (ARN) of one or more principals. Permissions are granted to the principals in this list. To grant permissions to all principals, specify an asterisk (*).
     */
    AddAllowedPrincipals?: ValueStringList;
    /**
     * The Amazon Resource Names (ARN) of one or more principals. Permissions are revoked for principals in this list.
     */
    RemoveAllowedPrincipals?: ValueStringList;
  }
  export interface ModifyVpcEndpointServicePermissionsResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    ReturnValue?: Boolean;
  }
  export interface ModifyVpcPeeringConnectionOptionsRequest {
    /**
     * The VPC peering connection options for the accepter VPC.
     */
    AccepterPeeringConnectionOptions?: PeeringConnectionOptionsRequest;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The VPC peering connection options for the requester VPC.
     */
    RequesterPeeringConnectionOptions?: PeeringConnectionOptionsRequest;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId: String;
  }
  export interface ModifyVpcPeeringConnectionOptionsResult {
    /**
     * Information about the VPC peering connection options for the accepter VPC.
     */
    AccepterPeeringConnectionOptions?: PeeringConnectionOptions;
    /**
     * Information about the VPC peering connection options for the requester VPC.
     */
    RequesterPeeringConnectionOptions?: PeeringConnectionOptions;
  }
  export interface ModifyVpcTenancyRequest {
    /**
     * The ID of the VPC.
     */
    VpcId: String;
    /**
     * The instance tenancy attribute for the VPC. 
     */
    InstanceTenancy: VpcTenancy;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ModifyVpcTenancyResult {
    /**
     * Returns true if the request succeeds; otherwise, returns an error.
     */
    ReturnValue?: Boolean;
  }
  export interface MonitorInstancesRequest {
    /**
     * One or more instance IDs.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface MonitorInstancesResult {
    /**
     * The monitoring information.
     */
    InstanceMonitorings?: InstanceMonitoringList;
  }
  export interface Monitoring {
    /**
     * Indicates whether detailed monitoring is enabled. Otherwise, basic monitoring is enabled.
     */
    State?: MonitoringState;
  }
  export type MonitoringState = "disabled"|"disabling"|"enabled"|"pending"|string;
  export interface MoveAddressToVpcRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The Elastic IP address.
     */
    PublicIp: String;
  }
  export interface MoveAddressToVpcResult {
    /**
     * The allocation ID for the Elastic IP address.
     */
    AllocationId?: String;
    /**
     * The status of the move of the IP address.
     */
    Status?: Status;
  }
  export type MoveStatus = "movingToVpc"|"restoringToClassic"|string;
  export interface MovingAddressStatus {
    /**
     * The status of the Elastic IP address that's being moved to the EC2-VPC platform, or restored to the EC2-Classic platform.
     */
    MoveStatus?: MoveStatus;
    /**
     * The Elastic IP address.
     */
    PublicIp?: String;
  }
  export type MovingAddressStatusSet = MovingAddressStatus[];
  export interface NatGateway {
    /**
     * The date and time the NAT gateway was created.
     */
    CreateTime?: DateTime;
    /**
     * The date and time the NAT gateway was deleted, if applicable.
     */
    DeleteTime?: DateTime;
    /**
     * If the NAT gateway could not be created, specifies the error code for the failure. (InsufficientFreeAddressesInSubnet | Gateway.NotAttached | InvalidAllocationID.NotFound | Resource.AlreadyAssociated | InternalError | InvalidSubnetID.NotFound)
     */
    FailureCode?: String;
    /**
     * If the NAT gateway could not be created, specifies the error message for the failure, that corresponds to the error code.   For InsufficientFreeAddressesInSubnet: "Subnet has insufficient free addresses to create this NAT gateway"   For Gateway.NotAttached: "Network vpc-xxxxxxxx has no Internet gateway attached"   For InvalidAllocationID.NotFound: "Elastic IP address eipalloc-xxxxxxxx could not be associated with this NAT gateway"   For Resource.AlreadyAssociated: "Elastic IP address eipalloc-xxxxxxxx is already associated"   For InternalError: "Network interface eni-xxxxxxxx, created and used internally by this NAT gateway is in an invalid state. Please try again."   For InvalidSubnetID.NotFound: "The specified subnet subnet-xxxxxxxx does not exist or could not be found."  
     */
    FailureMessage?: String;
    /**
     * Information about the IP addresses and network interface associated with the NAT gateway.
     */
    NatGatewayAddresses?: NatGatewayAddressList;
    /**
     * The ID of the NAT gateway.
     */
    NatGatewayId?: String;
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    ProvisionedBandwidth?: ProvisionedBandwidth;
    /**
     * The state of the NAT gateway.    pending: The NAT gateway is being created and is not ready to process traffic.    failed: The NAT gateway could not be created. Check the failureCode and failureMessage fields for the reason.    available: The NAT gateway is able to process traffic. This status remains until you delete the NAT gateway, and does not indicate the health of the NAT gateway.    deleting: The NAT gateway is in the process of being terminated and may still be processing traffic.    deleted: The NAT gateway has been terminated and is no longer processing traffic.  
     */
    State?: NatGatewayState;
    /**
     * The ID of the subnet in which the NAT gateway is located.
     */
    SubnetId?: String;
    /**
     * The ID of the VPC in which the NAT gateway is located.
     */
    VpcId?: String;
    /**
     * The tags for the NAT gateway.
     */
    Tags?: TagList;
  }
  export interface NatGatewayAddress {
    /**
     * The allocation ID of the Elastic IP address that's associated with the NAT gateway.
     */
    AllocationId?: String;
    /**
     * The ID of the network interface associated with the NAT gateway.
     */
    NetworkInterfaceId?: String;
    /**
     * The private IP address associated with the Elastic IP address.
     */
    PrivateIp?: String;
    /**
     * The Elastic IP address associated with the NAT gateway.
     */
    PublicIp?: String;
  }
  export type NatGatewayAddressList = NatGatewayAddress[];
  export type NatGatewayList = NatGateway[];
  export type NatGatewayState = "pending"|"failed"|"available"|"deleting"|"deleted"|string;
  export interface NetworkAcl {
    /**
     * Any associations between the network ACL and one or more subnets
     */
    Associations?: NetworkAclAssociationList;
    /**
     * One or more entries (rules) in the network ACL.
     */
    Entries?: NetworkAclEntryList;
    /**
     * Indicates whether this is the default network ACL for the VPC.
     */
    IsDefault?: Boolean;
    /**
     * The ID of the network ACL.
     */
    NetworkAclId?: String;
    /**
     * Any tags assigned to the network ACL.
     */
    Tags?: TagList;
    /**
     * The ID of the VPC for the network ACL.
     */
    VpcId?: String;
  }
  export interface NetworkAclAssociation {
    /**
     * The ID of the association between a network ACL and a subnet.
     */
    NetworkAclAssociationId?: String;
    /**
     * The ID of the network ACL.
     */
    NetworkAclId?: String;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
  }
  export type NetworkAclAssociationList = NetworkAclAssociation[];
  export interface NetworkAclEntry {
    /**
     * The IPv4 network range to allow or deny, in CIDR notation.
     */
    CidrBlock?: String;
    /**
     * Indicates whether the rule is an egress rule (applied to traffic leaving the subnet).
     */
    Egress?: Boolean;
    /**
     * ICMP protocol: The ICMP type and code.
     */
    IcmpTypeCode?: IcmpTypeCode;
    /**
     * The IPv6 network range to allow or deny, in CIDR notation.
     */
    Ipv6CidrBlock?: String;
    /**
     * TCP or UDP protocols: The range of ports the rule applies to.
     */
    PortRange?: PortRange;
    /**
     * The protocol. A value of -1 means all protocols.
     */
    Protocol?: String;
    /**
     * Indicates whether to allow or deny the traffic that matches the rule.
     */
    RuleAction?: RuleAction;
    /**
     * The rule number for the entry. ACL entries are processed in ascending order by rule number.
     */
    RuleNumber?: Integer;
  }
  export type NetworkAclEntryList = NetworkAclEntry[];
  export type NetworkAclList = NetworkAcl[];
  export interface NetworkInterface {
    /**
     * The association information for an Elastic IP address (IPv4) associated with the network interface.
     */
    Association?: NetworkInterfaceAssociation;
    /**
     * The network interface attachment.
     */
    Attachment?: NetworkInterfaceAttachment;
    /**
     * The Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * A description.
     */
    Description?: String;
    /**
     * Any security groups for the network interface.
     */
    Groups?: GroupIdentifierList;
    /**
     * The type of interface.
     */
    InterfaceType?: NetworkInterfaceType;
    /**
     * The IPv6 addresses associated with the network interface.
     */
    Ipv6Addresses?: NetworkInterfaceIpv6AddressesList;
    /**
     * The MAC address.
     */
    MacAddress?: String;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The AWS account ID of the owner of the network interface.
     */
    OwnerId?: String;
    /**
     * The private DNS name.
     */
    PrivateDnsName?: String;
    /**
     * The IPv4 address of the network interface within the subnet.
     */
    PrivateIpAddress?: String;
    /**
     * The private IPv4 addresses associated with the network interface.
     */
    PrivateIpAddresses?: NetworkInterfacePrivateIpAddressList;
    /**
     * The ID of the entity that launched the instance on your behalf (for example, AWS Management Console or Auto Scaling).
     */
    RequesterId?: String;
    /**
     * Indicates whether the network interface is being managed by AWS.
     */
    RequesterManaged?: Boolean;
    /**
     * Indicates whether traffic to or from the instance is validated.
     */
    SourceDestCheck?: Boolean;
    /**
     * The status of the network interface.
     */
    Status?: NetworkInterfaceStatus;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
    /**
     * Any tags assigned to the network interface.
     */
    TagSet?: TagList;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface NetworkInterfaceAssociation {
    /**
     * The allocation ID.
     */
    AllocationId?: String;
    /**
     * The association ID.
     */
    AssociationId?: String;
    /**
     * The ID of the Elastic IP address owner.
     */
    IpOwnerId?: String;
    /**
     * The public DNS name.
     */
    PublicDnsName?: String;
    /**
     * The address of the Elastic IP address bound to the network interface.
     */
    PublicIp?: String;
  }
  export interface NetworkInterfaceAttachment {
    /**
     * The timestamp indicating when the attachment initiated.
     */
    AttachTime?: DateTime;
    /**
     * The ID of the network interface attachment.
     */
    AttachmentId?: String;
    /**
     * Indicates whether the network interface is deleted when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The device index of the network interface attachment on the instance.
     */
    DeviceIndex?: Integer;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The AWS account ID of the owner of the instance.
     */
    InstanceOwnerId?: String;
    /**
     * The attachment state.
     */
    Status?: AttachmentStatus;
  }
  export interface NetworkInterfaceAttachmentChanges {
    /**
     * The ID of the network interface attachment.
     */
    AttachmentId?: String;
    /**
     * Indicates whether the network interface is deleted when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
  }
  export type NetworkInterfaceAttribute = "description"|"groupSet"|"sourceDestCheck"|"attachment"|string;
  export type NetworkInterfaceIdList = String[];
  export interface NetworkInterfaceIpv6Address {
    /**
     * The IPv6 address.
     */
    Ipv6Address?: String;
  }
  export type NetworkInterfaceIpv6AddressesList = NetworkInterfaceIpv6Address[];
  export type NetworkInterfaceList = NetworkInterface[];
  export interface NetworkInterfacePermission {
    /**
     * The ID of the network interface permission.
     */
    NetworkInterfacePermissionId?: String;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The AWS account ID.
     */
    AwsAccountId?: String;
    /**
     * The AWS service.
     */
    AwsService?: String;
    /**
     * The type of permission.
     */
    Permission?: InterfacePermissionType;
    /**
     * Information about the state of the permission.
     */
    PermissionState?: NetworkInterfacePermissionState;
  }
  export type NetworkInterfacePermissionIdList = String[];
  export type NetworkInterfacePermissionList = NetworkInterfacePermission[];
  export interface NetworkInterfacePermissionState {
    /**
     * The state of the permission.
     */
    State?: NetworkInterfacePermissionStateCode;
    /**
     * A status message, if applicable.
     */
    StatusMessage?: String;
  }
  export type NetworkInterfacePermissionStateCode = "pending"|"granted"|"revoking"|"revoked"|string;
  export interface NetworkInterfacePrivateIpAddress {
    /**
     * The association information for an Elastic IP address (IPv4) associated with the network interface.
     */
    Association?: NetworkInterfaceAssociation;
    /**
     * Indicates whether this IPv4 address is the primary private IPv4 address of the network interface.
     */
    Primary?: Boolean;
    /**
     * The private DNS name.
     */
    PrivateDnsName?: String;
    /**
     * The private IPv4 address.
     */
    PrivateIpAddress?: String;
  }
  export type NetworkInterfacePrivateIpAddressList = NetworkInterfacePrivateIpAddress[];
  export type NetworkInterfaceStatus = "available"|"associated"|"attaching"|"in-use"|"detaching"|string;
  export type NetworkInterfaceType = "interface"|"natGateway"|string;
  export interface NewDhcpConfiguration {
    Key?: String;
    Values?: ValueStringList;
  }
  export type NewDhcpConfigurationList = NewDhcpConfiguration[];
  export type NextToken = string;
  export type OccurrenceDayRequestSet = Integer[];
  export type OccurrenceDaySet = Integer[];
  export type OfferingClassType = "standard"|"convertible"|string;
  export type OfferingTypeValues = "Heavy Utilization"|"Medium Utilization"|"Light Utilization"|"No Upfront"|"Partial Upfront"|"All Upfront"|string;
  export type OnDemandAllocationStrategy = "lowestPrice"|"prioritized"|string;
  export interface OnDemandOptions {
    /**
     * The order of the launch template overrides to use in fulfilling On-Demand capacity. If you specify lowest-price, EC2 Fleet uses price to determine the order, launching the lowest price first. If you specify prioritized, EC2 Fleet uses the priority that you assigned to each launch template override, launching the highest priority first. If you do not specify a value, EC2 Fleet defaults to lowest-price.
     */
    AllocationStrategy?: FleetOnDemandAllocationStrategy;
  }
  export interface OnDemandOptionsRequest {
    /**
     * The order of the launch template overrides to use in fulfilling On-Demand capacity. If you specify lowest-price, EC2 Fleet uses price to determine the order, launching the lowest price first. If you specify prioritized, EC2 Fleet uses the priority that you assigned to each launch template override, launching the highest priority first. If you do not specify a value, EC2 Fleet defaults to lowest-price.
     */
    AllocationStrategy?: FleetOnDemandAllocationStrategy;
  }
  export type OperationType = "add"|"remove"|string;
  export type OwnerStringList = String[];
  export type PaymentOption = "AllUpfront"|"PartialUpfront"|"NoUpfront"|string;
  export interface PciId {
    /**
     * The ID of the device.
     */
    DeviceId?: String;
    /**
     * The ID of the vendor.
     */
    VendorId?: String;
    /**
     * The ID of the subsystem.
     */
    SubsystemId?: String;
    /**
     * The ID of the vendor for the subsystem.
     */
    SubsystemVendorId?: String;
  }
  export interface PeeringConnectionOptions {
    /**
     * If true, the public DNS hostnames of instances in the specified VPC resolve to private IP addresses when queried from instances in the peer VPC.
     */
    AllowDnsResolutionFromRemoteVpc?: Boolean;
    /**
     * If true, enables outbound communication from an EC2-Classic instance that's linked to a local VPC using ClassicLink to instances in a peer VPC.
     */
    AllowEgressFromLocalClassicLinkToRemoteVpc?: Boolean;
    /**
     * If true, enables outbound communication from instances in a local VPC to an EC2-Classic instance that's linked to a peer VPC using ClassicLink.
     */
    AllowEgressFromLocalVpcToRemoteClassicLink?: Boolean;
  }
  export interface PeeringConnectionOptionsRequest {
    /**
     * If true, enables a local VPC to resolve public DNS hostnames to private IP addresses when queried from instances in the peer VPC.
     */
    AllowDnsResolutionFromRemoteVpc?: Boolean;
    /**
     * If true, enables outbound communication from an EC2-Classic instance that's linked to a local VPC using ClassicLink to instances in a peer VPC.
     */
    AllowEgressFromLocalClassicLinkToRemoteVpc?: Boolean;
    /**
     * If true, enables outbound communication from instances in a local VPC to an EC2-Classic instance that's linked to a peer VPC using ClassicLink.
     */
    AllowEgressFromLocalVpcToRemoteClassicLink?: Boolean;
  }
  export type PermissionGroup = "all"|string;
  export interface Placement {
    /**
     * The Availability Zone of the instance.
     */
    AvailabilityZone?: String;
    /**
     * The affinity setting for the instance on the Dedicated Host. This parameter is not supported for the ImportInstance command.
     */
    Affinity?: String;
    /**
     * The name of the placement group the instance is in.
     */
    GroupName?: String;
    /**
     * The ID of the Dedicated Host on which the instance resides. This parameter is not supported for the ImportInstance command.
     */
    HostId?: String;
    /**
     * The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware. The host tenancy is not supported for the ImportInstance command.
     */
    Tenancy?: Tenancy;
    /**
     * Reserved for future use.
     */
    SpreadDomain?: String;
  }
  export interface PlacementGroup {
    /**
     * The name of the placement group.
     */
    GroupName?: String;
    /**
     * The state of the placement group.
     */
    State?: PlacementGroupState;
    /**
     * The placement strategy.
     */
    Strategy?: PlacementStrategy;
  }
  export type PlacementGroupList = PlacementGroup[];
  export type PlacementGroupState = "pending"|"available"|"deleting"|"deleted"|string;
  export type PlacementGroupStringList = String[];
  export type PlacementStrategy = "cluster"|"spread"|string;
  export type PlatformValues = "Windows"|string;
  export interface PortRange {
    /**
     * The first port in the range.
     */
    From?: Integer;
    /**
     * The last port in the range.
     */
    To?: Integer;
  }
  export interface PrefixList {
    /**
     * The IP address range of the AWS service.
     */
    Cidrs?: ValueStringList;
    /**
     * The ID of the prefix.
     */
    PrefixListId?: String;
    /**
     * The name of the prefix.
     */
    PrefixListName?: String;
  }
  export interface PrefixListId {
    /**
     * A description for the security group rule that references this prefix list ID. Constraints: Up to 255 characters in length. Allowed characters are a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=;{}!$*
     */
    Description?: String;
    /**
     * The ID of the prefix.
     */
    PrefixListId?: String;
  }
  export type PrefixListIdList = PrefixListId[];
  export type PrefixListIdSet = String[];
  export type PrefixListSet = PrefixList[];
  export interface PriceSchedule {
    /**
     * The current price schedule, as determined by the term remaining for the Reserved Instance in the listing. A specific price schedule is always in effect, but only one price schedule can be active at any time. Take, for example, a Reserved Instance listing that has five months remaining in its term. When you specify price schedules for five months and two months, this means that schedule 1, covering the first three months of the remaining term, will be active during months 5, 4, and 3. Then schedule 2, covering the last two months of the term, will be active for months 2 and 1.
     */
    Active?: Boolean;
    /**
     * The currency for transacting the Reserved Instance resale. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The fixed price for the term.
     */
    Price?: Double;
    /**
     * The number of months remaining in the reservation. For example, 2 is the second to the last month before the capacity reservation expires.
     */
    Term?: Long;
  }
  export type PriceScheduleList = PriceSchedule[];
  export interface PriceScheduleSpecification {
    /**
     * The currency for transacting the Reserved Instance resale. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The fixed price for the term.
     */
    Price?: Double;
    /**
     * The number of months remaining in the reservation. For example, 2 is the second to the last month before the capacity reservation expires.
     */
    Term?: Long;
  }
  export type PriceScheduleSpecificationList = PriceScheduleSpecification[];
  export interface PricingDetail {
    /**
     * The number of reservations available for the price.
     */
    Count?: Integer;
    /**
     * The price per instance.
     */
    Price?: Double;
  }
  export type PricingDetailsList = PricingDetail[];
  export interface PrincipalIdFormat {
    /**
     * PrincipalIdFormatARN description
     */
    Arn?: String;
    /**
     * PrincipalIdFormatStatuses description
     */
    Statuses?: IdFormatList;
  }
  export type PrincipalIdFormatList = PrincipalIdFormat[];
  export type PrincipalType = "All"|"Service"|"OrganizationUnit"|"Account"|"User"|"Role"|string;
  export type PrivateIpAddressConfigSet = ScheduledInstancesPrivateIpAddressConfig[];
  export interface PrivateIpAddressSpecification {
    /**
     * Indicates whether the private IPv4 address is the primary private IPv4 address. Only one IPv4 address can be designated as primary.
     */
    Primary?: Boolean;
    /**
     * The private IPv4 addresses.
     */
    PrivateIpAddress?: String;
  }
  export type PrivateIpAddressSpecificationList = PrivateIpAddressSpecification[];
  export type PrivateIpAddressStringList = String[];
  export interface ProductCode {
    /**
     * The product code.
     */
    ProductCodeId?: String;
    /**
     * The type of product code.
     */
    ProductCodeType?: ProductCodeValues;
  }
  export type ProductCodeList = ProductCode[];
  export type ProductCodeStringList = String[];
  export type ProductCodeValues = "devpay"|"marketplace"|string;
  export type ProductDescriptionList = String[];
  export interface PropagatingVgw {
    /**
     * The ID of the virtual private gateway.
     */
    GatewayId?: String;
  }
  export type PropagatingVgwList = PropagatingVgw[];
  export interface ProvisionedBandwidth {
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    ProvisionTime?: DateTime;
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    Provisioned?: String;
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    RequestTime?: DateTime;
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    Requested?: String;
    /**
     * Reserved. If you need to sustain traffic greater than the documented limits, contact us through the Support Center.
     */
    Status?: String;
  }
  export type PublicIpStringList = String[];
  export interface Purchase {
    /**
     * The currency in which the UpfrontPrice and HourlyPrice amounts are specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The duration of the reservation's term in seconds.
     */
    Duration?: Integer;
    /**
     * The IDs of the Dedicated Hosts associated with the reservation.
     */
    HostIdSet?: ResponseHostIdSet;
    /**
     * The ID of the reservation.
     */
    HostReservationId?: String;
    /**
     * The hourly price of the reservation per hour.
     */
    HourlyPrice?: String;
    /**
     * The instance family on the Dedicated Host that the reservation can be associated with.
     */
    InstanceFamily?: String;
    /**
     * The payment option for the reservation.
     */
    PaymentOption?: PaymentOption;
    /**
     * The upfront price of the reservation.
     */
    UpfrontPrice?: String;
  }
  export interface PurchaseHostReservationRequest {
    /**
     * Unique, case-sensitive identifier you provide to ensure idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon Elastic Compute Cloud User Guide.
     */
    ClientToken?: String;
    /**
     * The currency in which the totalUpfrontPrice, LimitPrice, and totalHourlyPrice amounts are specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The IDs of the Dedicated Hosts with which the reservation will be associated.
     */
    HostIdSet: RequestHostIdSet;
    /**
     * The specified limit is checked against the total upfront cost of the reservation (calculated as the offering's upfront cost multiplied by the host count). If the total upfront cost is greater than the specified price limit, the request fails. This is used to ensure that the purchase does not exceed the expected upfront cost of the purchase. At this time, the only supported currency is USD. For example, to indicate a limit price of USD 100, specify 100.00.
     */
    LimitPrice?: String;
    /**
     * The ID of the offering.
     */
    OfferingId: String;
  }
  export interface PurchaseHostReservationResult {
    /**
     * Unique, case-sensitive identifier you provide to ensure idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon Elastic Compute Cloud User Guide.
     */
    ClientToken?: String;
    /**
     * The currency in which the totalUpfrontPrice and totalHourlyPrice amounts are specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * Describes the details of the purchase.
     */
    Purchase?: PurchaseSet;
    /**
     * The total hourly price of the reservation calculated per hour.
     */
    TotalHourlyPrice?: String;
    /**
     * The total amount charged to your account when you purchase the reservation.
     */
    TotalUpfrontPrice?: String;
  }
  export interface PurchaseRequest {
    /**
     * The number of instances.
     */
    InstanceCount: Integer;
    /**
     * The purchase token.
     */
    PurchaseToken: String;
  }
  export type PurchaseRequestSet = PurchaseRequest[];
  export interface PurchaseReservedInstancesOfferingRequest {
    /**
     * The number of Reserved Instances to purchase.
     */
    InstanceCount: Integer;
    /**
     * The ID of the Reserved Instance offering to purchase.
     */
    ReservedInstancesOfferingId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Specified for Reserved Instance Marketplace offerings to limit the total order and ensure that the Reserved Instances are not purchased at unexpected prices.
     */
    LimitPrice?: ReservedInstanceLimitPrice;
  }
  export interface PurchaseReservedInstancesOfferingResult {
    /**
     * The IDs of the purchased Reserved Instances.
     */
    ReservedInstancesId?: String;
  }
  export interface PurchaseScheduledInstancesRequest {
    /**
     * Unique, case-sensitive identifier that ensures the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * One or more purchase requests.
     */
    PurchaseRequests: PurchaseRequestSet;
  }
  export interface PurchaseScheduledInstancesResult {
    /**
     * Information about the Scheduled Instances.
     */
    ScheduledInstanceSet?: PurchasedScheduledInstanceSet;
  }
  export type PurchaseSet = Purchase[];
  export type PurchasedScheduledInstanceSet = ScheduledInstance[];
  export type RIProductDescription = "Linux/UNIX"|"Linux/UNIX (Amazon VPC)"|"Windows"|"Windows (Amazon VPC)"|string;
  export type ReasonCodesList = ReportInstanceReasonCodes[];
  export interface RebootInstancesRequest {
    /**
     * One or more instance IDs.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface RecurringCharge {
    /**
     * The amount of the recurring charge.
     */
    Amount?: Double;
    /**
     * The frequency of the recurring charge.
     */
    Frequency?: RecurringChargeFrequency;
  }
  export type RecurringChargeFrequency = "Hourly"|string;
  export type RecurringChargesList = RecurringCharge[];
  export interface Region {
    /**
     * The region service endpoint.
     */
    Endpoint?: String;
    /**
     * The name of the region.
     */
    RegionName?: String;
  }
  export type RegionList = Region[];
  export type RegionNameStringList = String[];
  export interface RegisterImageRequest {
    /**
     * The full path to your AMI manifest in Amazon S3 storage.
     */
    ImageLocation?: String;
    /**
     * The architecture of the AMI. Default: For Amazon EBS-backed AMIs, i386. For instance store-backed AMIs, the architecture specified in the manifest file.
     */
    Architecture?: ArchitectureValues;
    /**
     * One or more block device mapping entries.
     */
    BlockDeviceMappings?: BlockDeviceMappingRequestList;
    /**
     * A description for your AMI.
     */
    Description?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Set to true to enable enhanced networking with ENA for the AMI and any instances that you launch from the AMI. This option is supported only for HVM AMIs. Specifying this option with a PV AMI can make instances launched from the AMI unreachable.
     */
    EnaSupport?: Boolean;
    /**
     * The ID of the kernel.
     */
    KernelId?: String;
    /**
     * A name for your AMI. Constraints: 3-128 alphanumeric characters, parentheses (()), square brackets ([]), spaces ( ), periods (.), slashes (/), dashes (-), single quotes ('), at-signs (@), or underscores(_)
     */
    Name: String;
    /**
     * The billing product codes. Your account must be authorized to specify billing product codes. Otherwise, you can use the AWS Marketplace to bill for the use of an AMI.
     */
    BillingProducts?: BillingProductList;
    /**
     * The ID of the RAM disk.
     */
    RamdiskId?: String;
    /**
     * The device name of the root device volume (for example, /dev/sda1).
     */
    RootDeviceName?: String;
    /**
     * Set to simple to enable enhanced networking with the Intel 82599 Virtual Function interface for the AMI and any instances that you launch from the AMI. There is no way to disable sriovNetSupport at this time. This option is supported only for HVM AMIs. Specifying this option with a PV AMI can make instances launched from the AMI unreachable.
     */
    SriovNetSupport?: String;
    /**
     * The type of virtualization (hvm | paravirtual). Default: paravirtual 
     */
    VirtualizationType?: String;
  }
  export interface RegisterImageResult {
    /**
     * The ID of the newly registered AMI.
     */
    ImageId?: String;
  }
  export interface RejectVpcEndpointConnectionsRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the service.
     */
    ServiceId: String;
    /**
     * The IDs of one or more VPC endpoints.
     */
    VpcEndpointIds: ValueStringList;
  }
  export interface RejectVpcEndpointConnectionsResult {
    /**
     * Information about the endpoints that were not rejected, if applicable.
     */
    Unsuccessful?: UnsuccessfulItemSet;
  }
  export interface RejectVpcPeeringConnectionRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId: String;
  }
  export interface RejectVpcPeeringConnectionResult {
    /**
     * Returns true if the request succeeds; otherwise, it returns an error.
     */
    Return?: Boolean;
  }
  export interface ReleaseAddressRequest {
    /**
     * [EC2-VPC] The allocation ID. Required for EC2-VPC.
     */
    AllocationId?: String;
    /**
     * [EC2-Classic] The Elastic IP address. Required for EC2-Classic.
     */
    PublicIp?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ReleaseHostsRequest {
    /**
     * The IDs of the Dedicated Hosts to release.
     */
    HostIds: RequestHostIdList;
  }
  export interface ReleaseHostsResult {
    /**
     * The IDs of the Dedicated Hosts that were successfully released.
     */
    Successful?: ResponseHostIdList;
    /**
     * The IDs of the Dedicated Hosts that could not be released, including an error message.
     */
    Unsuccessful?: UnsuccessfulItemList;
  }
  export interface ReplaceIamInstanceProfileAssociationRequest {
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile: IamInstanceProfileSpecification;
    /**
     * The ID of the existing IAM instance profile association.
     */
    AssociationId: String;
  }
  export interface ReplaceIamInstanceProfileAssociationResult {
    /**
     * Information about the IAM instance profile association.
     */
    IamInstanceProfileAssociation?: IamInstanceProfileAssociation;
  }
  export interface ReplaceNetworkAclAssociationRequest {
    /**
     * The ID of the current association between the original network ACL and the subnet.
     */
    AssociationId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the new network ACL to associate with the subnet.
     */
    NetworkAclId: String;
  }
  export interface ReplaceNetworkAclAssociationResult {
    /**
     * The ID of the new association.
     */
    NewAssociationId?: String;
  }
  export interface ReplaceNetworkAclEntryRequest {
    /**
     * The IPv4 network range to allow or deny, in CIDR notation (for example 172.16.0.0/24).
     */
    CidrBlock?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicates whether to replace the egress rule. Default: If no value is specified, we replace the ingress rule.
     */
    Egress: Boolean;
    /**
     * ICMP protocol: The ICMP or ICMPv6 type and code. Required if specifying the ICMP (1) protocol, or protocol 58 (ICMPv6) with an IPv6 CIDR block.
     */
    IcmpTypeCode?: IcmpTypeCode;
    /**
     * The IPv6 network range to allow or deny, in CIDR notation (for example 2001:bd8:1234:1a00::/64).
     */
    Ipv6CidrBlock?: String;
    /**
     * The ID of the ACL.
     */
    NetworkAclId: String;
    /**
     * TCP or UDP protocols: The range of ports the rule applies to. Required if specifying TCP (6) or UDP (17) for the protocol.
     */
    PortRange?: PortRange;
    /**
     * The IP protocol. You can specify all or -1 to mean all protocols. If you specify all, -1, or a protocol number other than tcp, udp, or icmp, traffic on all ports is allowed, regardless of any ports or ICMP types or codes you that specify. If you specify protocol 58 (ICMPv6) and specify an IPv4 CIDR block, traffic for all ICMP types and codes allowed, regardless of any that you specify. If you specify protocol 58 (ICMPv6) and specify an IPv6 CIDR block, you must specify an ICMP type and code.
     */
    Protocol: String;
    /**
     * Indicates whether to allow or deny the traffic that matches the rule.
     */
    RuleAction: RuleAction;
    /**
     * The rule number of the entry to replace.
     */
    RuleNumber: Integer;
  }
  export interface ReplaceRouteRequest {
    /**
     * The IPv4 CIDR address block used for the destination match. The value that you provide must match the CIDR of an existing route in the table.
     */
    DestinationCidrBlock?: String;
    /**
     * The IPv6 CIDR address block used for the destination match. The value that you provide must match the CIDR of an existing route in the table.
     */
    DestinationIpv6CidrBlock?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * [IPv6 traffic only] The ID of an egress-only internet gateway.
     */
    EgressOnlyInternetGatewayId?: String;
    /**
     * The ID of an internet gateway or virtual private gateway.
     */
    GatewayId?: String;
    /**
     * The ID of a NAT instance in your VPC.
     */
    InstanceId?: String;
    /**
     * [IPv4 traffic only] The ID of a NAT gateway.
     */
    NatGatewayId?: String;
    /**
     * The ID of a network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The ID of the route table.
     */
    RouteTableId: String;
    /**
     * The ID of a VPC peering connection.
     */
    VpcPeeringConnectionId?: String;
  }
  export interface ReplaceRouteTableAssociationRequest {
    /**
     * The association ID.
     */
    AssociationId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the new route table to associate with the subnet.
     */
    RouteTableId: String;
  }
  export interface ReplaceRouteTableAssociationResult {
    /**
     * The ID of the new association.
     */
    NewAssociationId?: String;
  }
  export type ReportInstanceReasonCodes = "instance-stuck-in-state"|"unresponsive"|"not-accepting-credentials"|"password-not-available"|"performance-network"|"performance-instance-store"|"performance-ebs-volume"|"performance-other"|"other"|string;
  export interface ReportInstanceStatusRequest {
    /**
     * Descriptive text about the health state of your instance.
     */
    Description?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The time at which the reported instance health state ended.
     */
    EndTime?: DateTime;
    /**
     * One or more instances.
     */
    Instances: InstanceIdStringList;
    /**
     * One or more reason codes that describe the health state of your instance.    instance-stuck-in-state: My instance is stuck in a state.    unresponsive: My instance is unresponsive.    not-accepting-credentials: My instance is not accepting my credentials.    password-not-available: A password is not available for my instance.    performance-network: My instance is experiencing performance problems that I believe are network related.    performance-instance-store: My instance is experiencing performance problems that I believe are related to the instance stores.    performance-ebs-volume: My instance is experiencing performance problems that I believe are related to an EBS volume.    performance-other: My instance is experiencing performance problems.    other: [explain using the description parameter]  
     */
    ReasonCodes: ReasonCodesList;
    /**
     * The time at which the reported instance health state began.
     */
    StartTime?: DateTime;
    /**
     * The status of all instances listed.
     */
    Status: ReportStatusType;
  }
  export type ReportStatusType = "ok"|"impaired"|string;
  export type RequestHostIdList = String[];
  export type RequestHostIdSet = String[];
  export interface RequestLaunchTemplateData {
    /**
     * The ID of the kernel.  We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see User Provided Kernels in the Amazon Elastic Compute Cloud User Guide. 
     */
    KernelId?: String;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal Amazon EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS-optimized instance.
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: LaunchTemplateIamInstanceProfileSpecificationRequest;
    /**
     * The block device mapping.  Supplying both a snapshot ID and an encryption value as arguments for block-device mapping results in an error. This is because only blank volumes can be encrypted on start, and these are not created from a snapshot. If a snapshot is the basis for the volume, it contains data by definition and its encryption status cannot be changed using this action. 
     */
    BlockDeviceMappings?: LaunchTemplateBlockDeviceMappingRequestList;
    /**
     * One or more network interfaces.
     */
    NetworkInterfaces?: LaunchTemplateInstanceNetworkInterfaceSpecificationRequestList;
    /**
     * The ID of the AMI, which you can get by using DescribeImages.
     */
    ImageId?: String;
    /**
     * The instance type. For more information, see Instance Types in the Amazon Elastic Compute Cloud User Guide.
     */
    InstanceType?: InstanceType;
    /**
     * The name of the key pair. You can create a key pair using CreateKeyPair or ImportKeyPair.  If you do not specify a key pair, you can't connect to the instance unless you choose an AMI that is configured to allow users another way to log in. 
     */
    KeyName?: String;
    /**
     * The monitoring for the instance.
     */
    Monitoring?: LaunchTemplatesMonitoringRequest;
    /**
     * The placement for the instance.
     */
    Placement?: LaunchTemplatePlacementRequest;
    /**
     * The ID of the RAM disk.  We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see User Provided Kernels in the Amazon Elastic Compute Cloud User Guide. 
     */
    RamDiskId?: String;
    /**
     * If set to true, you can't terminate the instance using the Amazon EC2 console, CLI, or API. To change this attribute to false after launch, use ModifyInstanceAttribute.
     */
    DisableApiTermination?: Boolean;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown). Default: stop 
     */
    InstanceInitiatedShutdownBehavior?: ShutdownBehavior;
    /**
     * The Base64-encoded user data to make available to the instance. For more information, see Running Commands on Your Linux Instance at Launch (Linux) and Adding User Data (Windows).
     */
    UserData?: String;
    /**
     * The tags to apply to the resources during launch. You can only tag instances and volumes on launch. The specified tags are applied to all instances or volumes that are created during launch. To tag a resource after it has been created, see CreateTags.
     */
    TagSpecifications?: LaunchTemplateTagSpecificationRequestList;
    /**
     * An elastic GPU to associate with the instance.
     */
    ElasticGpuSpecifications?: ElasticGpuSpecificationList;
    /**
     * One or more security group IDs. You can create a security group using CreateSecurityGroup. You cannot specify both a security group ID and security name in the same request.
     */
    SecurityGroupIds?: SecurityGroupIdStringList;
    /**
     * [EC2-Classic, default VPC] One or more security group names. For a nondefault VPC, you must use security group IDs instead. You cannot specify both a security group ID and security name in the same request.
     */
    SecurityGroups?: SecurityGroupStringList;
    /**
     * The market (purchasing) option for the instances.
     */
    InstanceMarketOptions?: LaunchTemplateInstanceMarketOptionsRequest;
    /**
     * The credit option for CPU usage of the instance. Valid for T2 or T3 instances only.
     */
    CreditSpecification?: CreditSpecificationRequest;
    /**
     * The CPU options for the instance. For more information, see Optimizing CPU Options in the Amazon Elastic Compute Cloud User Guide.
     */
    CpuOptions?: LaunchTemplateCpuOptionsRequest;
  }
  export interface RequestSpotFleetRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The configuration for the Spot Fleet request.
     */
    SpotFleetRequestConfig: SpotFleetRequestConfigData;
  }
  export interface RequestSpotFleetResponse {
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
  }
  export interface RequestSpotInstancesRequest {
    /**
     * The user-specified name for a logical grouping of requests. When you specify an Availability Zone group in a Spot Instance request, all Spot Instances in the request are launched in the same Availability Zone. Instance proximity is maintained with this parameter, but the choice of Availability Zone is not. The group applies only to requests for Spot Instances of the same instance type. Any additional Spot Instance requests that are specified with the same Availability Zone group name are launched in that same Availability Zone, as long as at least one instance from the group is still active. If there is no active instance running in the Availability Zone group that you specify for a new Spot Instance request (all instances are terminated, the request is expired, or the maximum price you specified falls below current Spot price), then Amazon EC2 launches the instance in any Availability Zone where the constraint can be met. Consequently, the subsequent set of Spot Instances could be placed in a different zone from the original request, even if you specified the same Availability Zone group. Default: Instances are launched in any available Availability Zone.
     */
    AvailabilityZoneGroup?: String;
    /**
     * The required duration for the Spot Instances (also known as Spot blocks), in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360). The duration period starts as soon as your Spot Instance receives its instance ID. At the end of the duration period, Amazon EC2 marks the Spot Instance for termination and provides a Spot Instance termination notice, which gives the instance a two-minute warning before it terminates. You can't specify an Availability Zone group or a launch group if you specify a duration.
     */
    BlockDurationMinutes?: Integer;
    /**
     * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request. For more information, see How to Ensure Idempotency in the Amazon EC2 User Guide for Linux Instances.
     */
    ClientToken?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The maximum number of Spot Instances to launch. Default: 1
     */
    InstanceCount?: Integer;
    /**
     * The instance launch group. Launch groups are Spot Instances that launch together and terminate together. Default: Instances are launched and terminated individually
     */
    LaunchGroup?: String;
    /**
     * The launch specification.
     */
    LaunchSpecification?: RequestSpotLaunchSpecification;
    /**
     * The maximum price per hour that you are willing to pay for a Spot Instance. The default is the On-Demand price.
     */
    SpotPrice?: String;
    /**
     * The Spot Instance request type. Default: one-time 
     */
    Type?: SpotInstanceType;
    /**
     * The start date of the request. If this is a one-time request, the request becomes active at this date and time and remains active until all instances launch, the request expires, or the request is canceled. If the request is persistent, the request becomes active at this date and time and remains active until it expires or is canceled.
     */
    ValidFrom?: DateTime;
    /**
     * The end date of the request. If this is a one-time request, the request remains active until all instances launch, the request is canceled, or this date is reached. If the request is persistent, it remains active until it is canceled or this date is reached. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
  }
  export interface RequestSpotInstancesResult {
    /**
     * One or more Spot Instance requests.
     */
    SpotInstanceRequests?: SpotInstanceRequestList;
  }
  export interface RequestSpotLaunchSpecification {
    /**
     * One or more security group IDs.
     */
    SecurityGroupIds?: ValueStringList;
    /**
     * One or more security groups. When requesting instances in a VPC, you must specify the IDs of the security groups. When requesting instances in EC2-Classic, you can specify the names or the IDs of the security groups.
     */
    SecurityGroups?: ValueStringList;
    /**
     * Deprecated.
     */
    AddressingType?: String;
    /**
     * One or more block device mapping entries. You can't specify both a snapshot ID and an encryption value. This is because only blank volumes can be encrypted on creation. If a snapshot is the basis for a volume, it is not blank and its encryption status is used for the volume encryption status.
     */
    BlockDeviceMappings?: BlockDeviceMappingList;
    /**
     * Indicates whether the instance is optimized for EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS Optimized instance. Default: false 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: IamInstanceProfileSpecification;
    /**
     * The ID of the AMI.
     */
    ImageId?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The ID of the kernel.
     */
    KernelId?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
    /**
     * Indicates whether basic or detailed monitoring is enabled for the instance. Default: Disabled
     */
    Monitoring?: RunInstancesMonitoringEnabled;
    /**
     * One or more network interfaces. If you specify a network interface, you must specify subnet IDs and security group IDs using the network interface.
     */
    NetworkInterfaces?: InstanceNetworkInterfaceSpecificationList;
    /**
     * The placement information for the instance.
     */
    Placement?: SpotPlacement;
    /**
     * The ID of the RAM disk.
     */
    RamdiskId?: String;
    /**
     * The ID of the subnet in which to launch the instance.
     */
    SubnetId?: String;
    /**
     * The Base64-encoded user data for the instance.
     */
    UserData?: String;
  }
  export interface Reservation {
    /**
     * [EC2-Classic only] One or more security groups.
     */
    Groups?: GroupIdentifierList;
    /**
     * One or more instances.
     */
    Instances?: InstanceList;
    /**
     * The ID of the AWS account that owns the reservation.
     */
    OwnerId?: String;
    /**
     * The ID of the requester that launched the instances on your behalf (for example, AWS Management Console or Auto Scaling).
     */
    RequesterId?: String;
    /**
     * The ID of the reservation.
     */
    ReservationId?: String;
  }
  export type ReservationList = Reservation[];
  export type ReservationState = "payment-pending"|"payment-failed"|"active"|"retired"|string;
  export interface ReservationValue {
    /**
     * The hourly rate of the reservation.
     */
    HourlyPrice?: String;
    /**
     * The balance of the total value (the sum of remainingUpfrontValue + hourlyPrice * number of hours remaining).
     */
    RemainingTotalValue?: String;
    /**
     * The remaining upfront cost of the reservation.
     */
    RemainingUpfrontValue?: String;
  }
  export type ReservedInstanceIdSet = String[];
  export interface ReservedInstanceLimitPrice {
    /**
     * Used for Reserved Instance Marketplace offerings. Specifies the limit price on the total order (instanceCount * price).
     */
    Amount?: Double;
    /**
     * The currency in which the limitPrice amount is specified. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
  }
  export interface ReservedInstanceReservationValue {
    /**
     * The total value of the Convertible Reserved Instance that you are exchanging.
     */
    ReservationValue?: ReservationValue;
    /**
     * The ID of the Convertible Reserved Instance that you are exchanging.
     */
    ReservedInstanceId?: String;
  }
  export type ReservedInstanceReservationValueSet = ReservedInstanceReservationValue[];
  export type ReservedInstanceState = "payment-pending"|"active"|"payment-failed"|"retired"|string;
  export interface ReservedInstances {
    /**
     * The Availability Zone in which the Reserved Instance can be used.
     */
    AvailabilityZone?: String;
    /**
     * The duration of the Reserved Instance, in seconds.
     */
    Duration?: Long;
    /**
     * The time when the Reserved Instance expires.
     */
    End?: DateTime;
    /**
     * The purchase price of the Reserved Instance.
     */
    FixedPrice?: Float;
    /**
     * The number of reservations purchased.
     */
    InstanceCount?: Integer;
    /**
     * The instance type on which the Reserved Instance can be used.
     */
    InstanceType?: InstanceType;
    /**
     * The Reserved Instance product platform description.
     */
    ProductDescription?: RIProductDescription;
    /**
     * The ID of the Reserved Instance.
     */
    ReservedInstancesId?: String;
    /**
     * The date and time the Reserved Instance started.
     */
    Start?: DateTime;
    /**
     * The state of the Reserved Instance purchase.
     */
    State?: ReservedInstanceState;
    /**
     * The usage price of the Reserved Instance, per hour.
     */
    UsagePrice?: Float;
    /**
     * The currency of the Reserved Instance. It's specified using ISO 4217 standard currency codes. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The tenancy of the instance.
     */
    InstanceTenancy?: Tenancy;
    /**
     * The offering class of the Reserved Instance.
     */
    OfferingClass?: OfferingClassType;
    /**
     * The Reserved Instance offering type.
     */
    OfferingType?: OfferingTypeValues;
    /**
     * The recurring charge tag assigned to the resource.
     */
    RecurringCharges?: RecurringChargesList;
    /**
     * The scope of the Reserved Instance.
     */
    Scope?: scope;
    /**
     * Any tags assigned to the resource.
     */
    Tags?: TagList;
  }
  export interface ReservedInstancesConfiguration {
    /**
     * The Availability Zone for the modified Reserved Instances.
     */
    AvailabilityZone?: String;
    /**
     * The number of modified Reserved Instances.
     */
    InstanceCount?: Integer;
    /**
     * The instance type for the modified Reserved Instances.
     */
    InstanceType?: InstanceType;
    /**
     * The network platform of the modified Reserved Instances, which is either EC2-Classic or EC2-VPC.
     */
    Platform?: String;
    /**
     * Whether the Reserved Instance is applied to instances in a region or instances in a specific Availability Zone.
     */
    Scope?: scope;
  }
  export type ReservedInstancesConfigurationList = ReservedInstancesConfiguration[];
  export interface ReservedInstancesId {
    /**
     * The ID of the Reserved Instance.
     */
    ReservedInstancesId?: String;
  }
  export type ReservedInstancesIdStringList = String[];
  export type ReservedInstancesList = ReservedInstances[];
  export interface ReservedInstancesListing {
    /**
     * A unique, case-sensitive key supplied by the client to ensure that the request is idempotent. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * The time the listing was created.
     */
    CreateDate?: DateTime;
    /**
     * The number of instances in this state.
     */
    InstanceCounts?: InstanceCountList;
    /**
     * The price of the Reserved Instance listing.
     */
    PriceSchedules?: PriceScheduleList;
    /**
     * The ID of the Reserved Instance.
     */
    ReservedInstancesId?: String;
    /**
     * The ID of the Reserved Instance listing.
     */
    ReservedInstancesListingId?: String;
    /**
     * The status of the Reserved Instance listing.
     */
    Status?: ListingStatus;
    /**
     * The reason for the current status of the Reserved Instance listing. The response can be blank.
     */
    StatusMessage?: String;
    /**
     * Any tags assigned to the resource.
     */
    Tags?: TagList;
    /**
     * The last modified timestamp of the listing.
     */
    UpdateDate?: DateTime;
  }
  export type ReservedInstancesListingList = ReservedInstancesListing[];
  export interface ReservedInstancesModification {
    /**
     * A unique, case-sensitive key supplied by the client to ensure that the request is idempotent. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * The time when the modification request was created.
     */
    CreateDate?: DateTime;
    /**
     * The time for the modification to become effective.
     */
    EffectiveDate?: DateTime;
    /**
     * Contains target configurations along with their corresponding new Reserved Instance IDs.
     */
    ModificationResults?: ReservedInstancesModificationResultList;
    /**
     * The IDs of one or more Reserved Instances.
     */
    ReservedInstancesIds?: ReservedIntancesIds;
    /**
     * A unique ID for the Reserved Instance modification.
     */
    ReservedInstancesModificationId?: String;
    /**
     * The status of the Reserved Instances modification request.
     */
    Status?: String;
    /**
     * The reason for the status.
     */
    StatusMessage?: String;
    /**
     * The time when the modification request was last updated.
     */
    UpdateDate?: DateTime;
  }
  export type ReservedInstancesModificationIdStringList = String[];
  export type ReservedInstancesModificationList = ReservedInstancesModification[];
  export interface ReservedInstancesModificationResult {
    /**
     * The ID for the Reserved Instances that were created as part of the modification request. This field is only available when the modification is fulfilled.
     */
    ReservedInstancesId?: String;
    /**
     * The target Reserved Instances configurations supplied as part of the modification request.
     */
    TargetConfiguration?: ReservedInstancesConfiguration;
  }
  export type ReservedInstancesModificationResultList = ReservedInstancesModificationResult[];
  export interface ReservedInstancesOffering {
    /**
     * The Availability Zone in which the Reserved Instance can be used.
     */
    AvailabilityZone?: String;
    /**
     * The duration of the Reserved Instance, in seconds.
     */
    Duration?: Long;
    /**
     * The purchase price of the Reserved Instance.
     */
    FixedPrice?: Float;
    /**
     * The instance type on which the Reserved Instance can be used.
     */
    InstanceType?: InstanceType;
    /**
     * The Reserved Instance product platform description.
     */
    ProductDescription?: RIProductDescription;
    /**
     * The ID of the Reserved Instance offering. This is the offering ID used in GetReservedInstancesExchangeQuote to confirm that an exchange can be made.
     */
    ReservedInstancesOfferingId?: String;
    /**
     * The usage price of the Reserved Instance, per hour.
     */
    UsagePrice?: Float;
    /**
     * The currency of the Reserved Instance offering you are purchasing. It's specified using ISO 4217 standard currency codes. At this time, the only supported currency is USD.
     */
    CurrencyCode?: CurrencyCodeValues;
    /**
     * The tenancy of the instance.
     */
    InstanceTenancy?: Tenancy;
    /**
     * Indicates whether the offering is available through the Reserved Instance Marketplace (resale) or AWS. If it's a Reserved Instance Marketplace offering, this is true.
     */
    Marketplace?: Boolean;
    /**
     * If convertible it can be exchanged for Reserved Instances of the same or higher monetary value, with different configurations. If standard, it is not possible to perform an exchange.
     */
    OfferingClass?: OfferingClassType;
    /**
     * The Reserved Instance offering type.
     */
    OfferingType?: OfferingTypeValues;
    /**
     * The pricing details of the Reserved Instance offering.
     */
    PricingDetails?: PricingDetailsList;
    /**
     * The recurring charge tag assigned to the resource.
     */
    RecurringCharges?: RecurringChargesList;
    /**
     * Whether the Reserved Instance is applied to instances in a region or an Availability Zone.
     */
    Scope?: scope;
  }
  export type ReservedInstancesOfferingIdStringList = String[];
  export type ReservedInstancesOfferingList = ReservedInstancesOffering[];
  export type ReservedIntancesIds = ReservedInstancesId[];
  export type ResetFpgaImageAttributeName = "loadPermission"|string;
  export interface ResetFpgaImageAttributeRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the AFI.
     */
    FpgaImageId: String;
    /**
     * The attribute.
     */
    Attribute?: ResetFpgaImageAttributeName;
  }
  export interface ResetFpgaImageAttributeResult {
    /**
     * Is true if the request succeeds, and an error otherwise.
     */
    Return?: Boolean;
  }
  export type ResetImageAttributeName = "launchPermission"|string;
  export interface ResetImageAttributeRequest {
    /**
     * The attribute to reset (currently you can only reset the launch permission attribute).
     */
    Attribute: ResetImageAttributeName;
    /**
     * The ID of the AMI.
     */
    ImageId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface ResetInstanceAttributeRequest {
    /**
     * The attribute to reset.  You can only reset the following attributes: kernel | ramdisk | sourceDestCheck. To change an instance attribute, use ModifyInstanceAttribute. 
     */
    Attribute: InstanceAttributeName;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the instance.
     */
    InstanceId: String;
  }
  export interface ResetNetworkInterfaceAttributeRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
    /**
     * The source/destination checking attribute. Resets the value to true.
     */
    SourceDestCheck?: String;
  }
  export interface ResetSnapshotAttributeRequest {
    /**
     * The attribute to reset. Currently, only the attribute for permission to create volumes can be reset.
     */
    Attribute: SnapshotAttributeName;
    /**
     * The ID of the snapshot.
     */
    SnapshotId: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export type ResourceIdList = String[];
  export type ResourceList = String[];
  export type ResourceType = "customer-gateway"|"dedicated-host"|"dhcp-options"|"image"|"instance"|"internet-gateway"|"network-acl"|"network-interface"|"reserved-instances"|"route-table"|"snapshot"|"spot-instances-request"|"subnet"|"security-group"|"volume"|"vpc"|"vpn-connection"|"vpn-gateway"|string;
  export interface ResponseError {
    /**
     * The error code.
     */
    Code?: LaunchTemplateErrorCode;
    /**
     * The error message, if applicable.
     */
    Message?: String;
  }
  export type ResponseHostIdList = String[];
  export type ResponseHostIdSet = String[];
  export interface ResponseLaunchTemplateData {
    /**
     * The ID of the kernel, if applicable.
     */
    KernelId?: String;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O. 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: LaunchTemplateIamInstanceProfileSpecification;
    /**
     * The block device mappings.
     */
    BlockDeviceMappings?: LaunchTemplateBlockDeviceMappingList;
    /**
     * The network interfaces.
     */
    NetworkInterfaces?: LaunchTemplateInstanceNetworkInterfaceSpecificationList;
    /**
     * The ID of the AMI that was used to launch the instance.
     */
    ImageId?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
    /**
     * The monitoring for the instance.
     */
    Monitoring?: LaunchTemplatesMonitoring;
    /**
     * The placement of the instance.
     */
    Placement?: LaunchTemplatePlacement;
    /**
     * The ID of the RAM disk, if applicable.
     */
    RamDiskId?: String;
    /**
     * If set to true, indicates that the instance cannot be terminated using the Amazon EC2 console, command line tool, or API.
     */
    DisableApiTermination?: Boolean;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown).
     */
    InstanceInitiatedShutdownBehavior?: ShutdownBehavior;
    /**
     * The user data for the instance. 
     */
    UserData?: String;
    /**
     * The tags.
     */
    TagSpecifications?: LaunchTemplateTagSpecificationList;
    /**
     * The elastic GPU specification.
     */
    ElasticGpuSpecifications?: ElasticGpuSpecificationResponseList;
    /**
     * The security group IDs.
     */
    SecurityGroupIds?: ValueStringList;
    /**
     * The security group names.
     */
    SecurityGroups?: ValueStringList;
    /**
     * The market (purchasing) option for the instances.
     */
    InstanceMarketOptions?: LaunchTemplateInstanceMarketOptions;
    /**
     * The credit option for CPU usage of the instance.
     */
    CreditSpecification?: CreditSpecification;
    /**
     * The CPU options for the instance. For more information, see Optimizing CPU Options in the Amazon Elastic Compute Cloud User Guide.
     */
    CpuOptions?: LaunchTemplateCpuOptions;
  }
  export type RestorableByStringList = String[];
  export interface RestoreAddressToClassicRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The Elastic IP address.
     */
    PublicIp: String;
  }
  export interface RestoreAddressToClassicResult {
    /**
     * The Elastic IP address.
     */
    PublicIp?: String;
    /**
     * The move status for the IP address.
     */
    Status?: Status;
  }
  export interface RevokeSecurityGroupEgressRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the security group.
     */
    GroupId: String;
    /**
     * One or more sets of IP permissions. You can't specify a destination security group and a CIDR IP address range in the same set of permissions.
     */
    IpPermissions?: IpPermissionList;
    /**
     * Not supported. Use a set of IP permissions to specify the CIDR.
     */
    CidrIp?: String;
    /**
     * Not supported. Use a set of IP permissions to specify the port.
     */
    FromPort?: Integer;
    /**
     * Not supported. Use a set of IP permissions to specify the protocol name or number.
     */
    IpProtocol?: String;
    /**
     * Not supported. Use a set of IP permissions to specify the port.
     */
    ToPort?: Integer;
    /**
     * Not supported. Use a set of IP permissions to specify a destination security group.
     */
    SourceSecurityGroupName?: String;
    /**
     * Not supported. Use a set of IP permissions to specify a destination security group.
     */
    SourceSecurityGroupOwnerId?: String;
  }
  export interface RevokeSecurityGroupIngressRequest {
    /**
     * The CIDR IP address range. You can't specify this parameter when specifying a source security group.
     */
    CidrIp?: String;
    /**
     * The start of port range for the TCP and UDP protocols, or an ICMP type number. For the ICMP type number, use -1 to specify all ICMP types.
     */
    FromPort?: Integer;
    /**
     * The ID of the security group. You must specify either the security group ID or the security group name in the request. For security groups in a nondefault VPC, you must specify the security group ID.
     */
    GroupId?: String;
    /**
     * [EC2-Classic, default VPC] The name of the security group. You must specify either the security group ID or the security group name in the request.
     */
    GroupName?: String;
    /**
     * One or more sets of IP permissions. You can't specify a source security group and a CIDR IP address range in the same set of permissions.
     */
    IpPermissions?: IpPermissionList;
    /**
     * The IP protocol name (tcp, udp, icmp) or number (see Protocol Numbers). Use -1 to specify all.
     */
    IpProtocol?: String;
    /**
     * [EC2-Classic, default VPC] The name of the source security group. You can't specify this parameter in combination with the following parameters: the CIDR IP address range, the start of the port range, the IP protocol, and the end of the port range. For EC2-VPC, the source security group must be in the same VPC. To revoke a specific rule for an IP protocol and port range, use a set of IP permissions instead.
     */
    SourceSecurityGroupName?: String;
    /**
     * [EC2-Classic] The AWS account ID of the source security group, if the source security group is in a different account. You can't specify this parameter in combination with the following parameters: the CIDR IP address range, the IP protocol, the start of the port range, and the end of the port range. To revoke a specific rule for an IP protocol and port range, use a set of IP permissions instead.
     */
    SourceSecurityGroupOwnerId?: String;
    /**
     * The end of port range for the TCP and UDP protocols, or an ICMP code number. For the ICMP code number, use -1 to specify all ICMP codes for the ICMP type.
     */
    ToPort?: Integer;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface Route {
    /**
     * The IPv4 CIDR block used for the destination match.
     */
    DestinationCidrBlock?: String;
    /**
     * The IPv6 CIDR block used for the destination match.
     */
    DestinationIpv6CidrBlock?: String;
    /**
     * The prefix of the AWS service.
     */
    DestinationPrefixListId?: String;
    /**
     * The ID of the egress-only internet gateway.
     */
    EgressOnlyInternetGatewayId?: String;
    /**
     * The ID of a gateway attached to your VPC.
     */
    GatewayId?: String;
    /**
     * The ID of a NAT instance in your VPC.
     */
    InstanceId?: String;
    /**
     * The AWS account ID of the owner of the instance.
     */
    InstanceOwnerId?: String;
    /**
     * The ID of a NAT gateway.
     */
    NatGatewayId?: String;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * Describes how the route was created.    CreateRouteTable - The route was automatically created when the route table was created.    CreateRoute - The route was manually added to the route table.    EnableVgwRoutePropagation - The route was propagated by route propagation.  
     */
    Origin?: RouteOrigin;
    /**
     * The state of the route. The blackhole state indicates that the route's target isn't available (for example, the specified gateway isn't attached to the VPC, or the specified NAT instance has been terminated).
     */
    State?: RouteState;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId?: String;
  }
  export type RouteList = Route[];
  export type RouteOrigin = "CreateRouteTable"|"CreateRoute"|"EnableVgwRoutePropagation"|string;
  export type RouteState = "active"|"blackhole"|string;
  export interface RouteTable {
    /**
     * The associations between the route table and one or more subnets.
     */
    Associations?: RouteTableAssociationList;
    /**
     * Any virtual private gateway (VGW) propagating routes.
     */
    PropagatingVgws?: PropagatingVgwList;
    /**
     * The ID of the route table.
     */
    RouteTableId?: String;
    /**
     * The routes in the route table.
     */
    Routes?: RouteList;
    /**
     * Any tags assigned to the route table.
     */
    Tags?: TagList;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export interface RouteTableAssociation {
    /**
     * Indicates whether this is the main route table.
     */
    Main?: Boolean;
    /**
     * The ID of the association between a route table and a subnet.
     */
    RouteTableAssociationId?: String;
    /**
     * The ID of the route table.
     */
    RouteTableId?: String;
    /**
     * The ID of the subnet. A subnet ID is not returned for an implicit association.
     */
    SubnetId?: String;
  }
  export type RouteTableAssociationList = RouteTableAssociation[];
  export type RouteTableList = RouteTable[];
  export type RuleAction = "allow"|"deny"|string;
  export interface RunInstancesMonitoringEnabled {
    /**
     * Indicates whether detailed monitoring is enabled. Otherwise, basic monitoring is enabled.
     */
    Enabled: Boolean;
  }
  export interface RunInstancesRequest {
    /**
     * One or more block device mapping entries. You can't specify both a snapshot ID and an encryption value. This is because only blank volumes can be encrypted on creation. If a snapshot is the basis for a volume, it is not blank and its encryption status is used for the volume encryption status.
     */
    BlockDeviceMappings?: BlockDeviceMappingRequestList;
    /**
     * The ID of the AMI, which you can get by calling DescribeImages. An AMI is required to launch an instance and must be specified here or in a launch template.
     */
    ImageId?: String;
    /**
     * The instance type. For more information, see Instance Types in the Amazon Elastic Compute Cloud User Guide. Default: m1.small 
     */
    InstanceType?: InstanceType;
    /**
     * [EC2-VPC] A number of IPv6 addresses to associate with the primary network interface. Amazon EC2 chooses the IPv6 addresses from the range of your subnet. You cannot specify this option and the option to assign specific IPv6 addresses in the same request. You can specify this option if you've specified a minimum number of instances to launch.
     */
    Ipv6AddressCount?: Integer;
    /**
     * [EC2-VPC] Specify one or more IPv6 addresses from the range of the subnet to associate with the primary network interface. You cannot specify this option and the option to assign a number of IPv6 addresses in the same request. You cannot specify this option if you've specified a minimum number of instances to launch.
     */
    Ipv6Addresses?: InstanceIpv6AddressList;
    /**
     * The ID of the kernel.  We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see  PV-GRUB in the Amazon Elastic Compute Cloud User Guide. 
     */
    KernelId?: String;
    /**
     * The name of the key pair. You can create a key pair using CreateKeyPair or ImportKeyPair.  If you do not specify a key pair, you can't connect to the instance unless you choose an AMI that is configured to allow users another way to log in. 
     */
    KeyName?: String;
    /**
     * The maximum number of instances to launch. If you specify more instances than Amazon EC2 can launch in the target Availability Zone, Amazon EC2 launches the largest possible number of instances above MinCount. Constraints: Between 1 and the maximum number you're allowed for the specified instance type. For more information about the default limits, and how to request an increase, see How many instances can I run in Amazon EC2 in the Amazon EC2 FAQ.
     */
    MaxCount: Integer;
    /**
     * The minimum number of instances to launch. If you specify a minimum that is more instances than Amazon EC2 can launch in the target Availability Zone, Amazon EC2 launches no instances. Constraints: Between 1 and the maximum number you're allowed for the specified instance type. For more information about the default limits, and how to request an increase, see How many instances can I run in Amazon EC2 in the Amazon EC2 General FAQ.
     */
    MinCount: Integer;
    /**
     * The monitoring for the instance.
     */
    Monitoring?: RunInstancesMonitoringEnabled;
    /**
     * The placement for the instance.
     */
    Placement?: Placement;
    /**
     * The ID of the RAM disk.  We recommend that you use PV-GRUB instead of kernels and RAM disks. For more information, see  PV-GRUB in the Amazon Elastic Compute Cloud User Guide. 
     */
    RamdiskId?: String;
    /**
     * One or more security group IDs. You can create a security group using CreateSecurityGroup. Default: Amazon EC2 uses the default security group.
     */
    SecurityGroupIds?: SecurityGroupIdStringList;
    /**
     * [EC2-Classic, default VPC] One or more security group names. For a nondefault VPC, you must use security group IDs instead. Default: Amazon EC2 uses the default security group.
     */
    SecurityGroups?: SecurityGroupStringList;
    /**
     * [EC2-VPC] The ID of the subnet to launch the instance into.
     */
    SubnetId?: String;
    /**
     * The user data to make available to the instance. For more information, see Running Commands on Your Linux Instance at Launch (Linux) and Adding User Data (Windows). If you are using a command line tool, base64-encoding is performed for you, and you can load the text from a file. Otherwise, you must provide base64-encoded text.
     */
    UserData?: String;
    /**
     * Reserved.
     */
    AdditionalInfo?: String;
    /**
     * Unique, case-sensitive identifier you provide to ensure the idempotency of the request. For more information, see Ensuring Idempotency. Constraints: Maximum 64 ASCII characters
     */
    ClientToken?: String;
    /**
     * If you set this parameter to true, you can't terminate the instance using the Amazon EC2 console, CLI, or API; otherwise, you can. To change this attribute to false after launch, use ModifyInstanceAttribute. Alternatively, if you set InstanceInitiatedShutdownBehavior to terminate, you can terminate the instance by running the shutdown command from the instance. Default: false 
     */
    DisableApiTermination?: Boolean;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal Amazon EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS-optimized instance. Default: false 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: IamInstanceProfileSpecification;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance (using the operating system command for system shutdown). Default: stop 
     */
    InstanceInitiatedShutdownBehavior?: ShutdownBehavior;
    /**
     * One or more network interfaces.
     */
    NetworkInterfaces?: InstanceNetworkInterfaceSpecificationList;
    /**
     * [EC2-VPC] The primary IPv4 address. You must specify a value from the IPv4 address range of the subnet. Only one private IP address can be designated as primary. You can't specify this option if you've specified the option to designate a private IP address as the primary IP address in a network interface specification. You cannot specify this option if you're launching more than one instance in the request.
     */
    PrivateIpAddress?: String;
    /**
     * An elastic GPU to associate with the instance.
     */
    ElasticGpuSpecification?: ElasticGpuSpecifications;
    /**
     * The tags to apply to the resources during launch. You can only tag instances and volumes on launch. The specified tags are applied to all instances or volumes that are created during launch. To tag a resource after it has been created, see CreateTags.
     */
    TagSpecifications?: TagSpecificationList;
    /**
     * The launch template to use to launch the instances. Any parameters that you specify in RunInstances override the same parameters in the launch template. You can specify either the name or ID of a launch template, but not both.
     */
    LaunchTemplate?: LaunchTemplateSpecification;
    /**
     * The market (purchasing) option for the instances. For RunInstances, persistent Spot Instance requests are only supported when InstanceInterruptionBehavior is set to either hibernate or stop.
     */
    InstanceMarketOptions?: InstanceMarketOptionsRequest;
    /**
     * The credit option for CPU usage of the instance. Valid values are standard and unlimited. To change this attribute after launch, use ModifyInstanceCreditSpecification. For more information, see Burstable Performance Instances in the Amazon Elastic Compute Cloud User Guide. Default: standard (T2 instances) or unlimited (T3 instances)
     */
    CreditSpecification?: CreditSpecificationRequest;
    /**
     * The CPU options for the instance. For more information, see Optimizing CPU Options in the Amazon Elastic Compute Cloud User Guide.
     */
    CpuOptions?: CpuOptionsRequest;
  }
  export interface RunScheduledInstancesRequest {
    /**
     * Unique, case-sensitive identifier that ensures the idempotency of the request. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The number of instances. Default: 1
     */
    InstanceCount?: Integer;
    /**
     * The launch specification. You must match the instance type, Availability Zone, network, and platform of the schedule that you purchased.
     */
    LaunchSpecification: ScheduledInstancesLaunchSpecification;
    /**
     * The Scheduled Instance ID.
     */
    ScheduledInstanceId: String;
  }
  export interface RunScheduledInstancesResult {
    /**
     * The IDs of the newly launched instances.
     */
    InstanceIdSet?: InstanceIdSet;
  }
  export interface S3Storage {
    /**
     * The access key ID of the owner of the bucket. Before you specify a value for your access key ID, review and follow the guidance in Best Practices for Managing AWS Access Keys.
     */
    AWSAccessKeyId?: String;
    /**
     * The bucket in which to store the AMI. You can specify a bucket that you already own or a new bucket that Amazon EC2 creates on your behalf. If you specify a bucket that belongs to someone else, Amazon EC2 returns an error.
     */
    Bucket?: String;
    /**
     * The beginning of the file name of the AMI.
     */
    Prefix?: String;
    /**
     * An Amazon S3 upload policy that gives Amazon EC2 permission to upload items into Amazon S3 on your behalf.
     */
    UploadPolicy?: _Blob;
    /**
     * The signature of the JSON document.
     */
    UploadPolicySignature?: String;
  }
  export interface ScheduledInstance {
    /**
     * The Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * The date when the Scheduled Instance was purchased.
     */
    CreateDate?: DateTime;
    /**
     * The hourly price for a single instance.
     */
    HourlyPrice?: String;
    /**
     * The number of instances.
     */
    InstanceCount?: Integer;
    /**
     * The instance type.
     */
    InstanceType?: String;
    /**
     * The network platform (EC2-Classic or EC2-VPC).
     */
    NetworkPlatform?: String;
    /**
     * The time for the next schedule to start.
     */
    NextSlotStartTime?: DateTime;
    /**
     * The platform (Linux/UNIX or Windows).
     */
    Platform?: String;
    /**
     * The time that the previous schedule ended or will end.
     */
    PreviousSlotEndTime?: DateTime;
    /**
     * The schedule recurrence.
     */
    Recurrence?: ScheduledInstanceRecurrence;
    /**
     * The Scheduled Instance ID.
     */
    ScheduledInstanceId?: String;
    /**
     * The number of hours in the schedule.
     */
    SlotDurationInHours?: Integer;
    /**
     * The end date for the Scheduled Instance.
     */
    TermEndDate?: DateTime;
    /**
     * The start date for the Scheduled Instance.
     */
    TermStartDate?: DateTime;
    /**
     * The total number of hours for a single instance for the entire term.
     */
    TotalScheduledInstanceHours?: Integer;
  }
  export interface ScheduledInstanceAvailability {
    /**
     * The Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * The number of available instances.
     */
    AvailableInstanceCount?: Integer;
    /**
     * The time period for the first schedule to start.
     */
    FirstSlotStartTime?: DateTime;
    /**
     * The hourly price for a single instance.
     */
    HourlyPrice?: String;
    /**
     * The instance type. You can specify one of the C3, C4, M4, or R3 instance types.
     */
    InstanceType?: String;
    /**
     * The maximum term. The only possible value is 365 days.
     */
    MaxTermDurationInDays?: Integer;
    /**
     * The minimum term. The only possible value is 365 days.
     */
    MinTermDurationInDays?: Integer;
    /**
     * The network platform (EC2-Classic or EC2-VPC).
     */
    NetworkPlatform?: String;
    /**
     * The platform (Linux/UNIX or Windows).
     */
    Platform?: String;
    /**
     * The purchase token. This token expires in two hours.
     */
    PurchaseToken?: String;
    /**
     * The schedule recurrence.
     */
    Recurrence?: ScheduledInstanceRecurrence;
    /**
     * The number of hours in the schedule.
     */
    SlotDurationInHours?: Integer;
    /**
     * The total number of hours for a single instance for the entire term.
     */
    TotalScheduledInstanceHours?: Integer;
  }
  export type ScheduledInstanceAvailabilitySet = ScheduledInstanceAvailability[];
  export type ScheduledInstanceIdRequestSet = String[];
  export interface ScheduledInstanceRecurrence {
    /**
     * The frequency (Daily, Weekly, or Monthly).
     */
    Frequency?: String;
    /**
     * The interval quantity. The interval unit depends on the value of frequency. For example, every 2 weeks or every 2 months.
     */
    Interval?: Integer;
    /**
     * The days. For a monthly schedule, this is one or more days of the month (1-31). For a weekly schedule, this is one or more days of the week (1-7, where 1 is Sunday).
     */
    OccurrenceDaySet?: OccurrenceDaySet;
    /**
     * Indicates whether the occurrence is relative to the end of the specified week or month.
     */
    OccurrenceRelativeToEnd?: Boolean;
    /**
     * The unit for occurrenceDaySet (DayOfWeek or DayOfMonth).
     */
    OccurrenceUnit?: String;
  }
  export interface ScheduledInstanceRecurrenceRequest {
    /**
     * The frequency (Daily, Weekly, or Monthly).
     */
    Frequency?: String;
    /**
     * The interval quantity. The interval unit depends on the value of Frequency. For example, every 2 weeks or every 2 months.
     */
    Interval?: Integer;
    /**
     * The days. For a monthly schedule, this is one or more days of the month (1-31). For a weekly schedule, this is one or more days of the week (1-7, where 1 is Sunday). You can't specify this value with a daily schedule. If the occurrence is relative to the end of the month, you can specify only a single day.
     */
    OccurrenceDays?: OccurrenceDayRequestSet;
    /**
     * Indicates whether the occurrence is relative to the end of the specified week or month. You can't specify this value with a daily schedule.
     */
    OccurrenceRelativeToEnd?: Boolean;
    /**
     * The unit for OccurrenceDays (DayOfWeek or DayOfMonth). This value is required for a monthly schedule. You can't specify DayOfWeek with a weekly schedule. You can't specify this value with a daily schedule.
     */
    OccurrenceUnit?: String;
  }
  export type ScheduledInstanceSet = ScheduledInstance[];
  export interface ScheduledInstancesBlockDeviceMapping {
    /**
     * The device name (for example, /dev/sdh or xvdh).
     */
    DeviceName?: String;
    /**
     * Parameters used to set up EBS volumes automatically when the instance is launched.
     */
    Ebs?: ScheduledInstancesEbs;
    /**
     * Suppresses the specified device included in the block device mapping of the AMI.
     */
    NoDevice?: String;
    /**
     * The virtual device name (ephemeralN). Instance store volumes are numbered starting from 0. An instance type with two available instance store volumes can specify mappings for ephemeral0 and ephemeral1. The number of available instance store volumes depends on the instance type. After you connect to the instance, you must mount the volume. Constraints: For M3 instances, you must specify instance store volumes in the block device mapping for the instance. When you launch an M3 instance, we ignore any instance store volumes specified in the block device mapping for the AMI.
     */
    VirtualName?: String;
  }
  export type ScheduledInstancesBlockDeviceMappingSet = ScheduledInstancesBlockDeviceMapping[];
  export interface ScheduledInstancesEbs {
    /**
     * Indicates whether the volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
    /**
     * Indicates whether the volume is encrypted. You can attached encrypted volumes only to instances that support them.
     */
    Encrypted?: Boolean;
    /**
     * The number of I/O operations per second (IOPS) that the volume supports. For io1 volumes, this represents the number of IOPS that are provisioned for the volume. For gp2 volumes, this represents the baseline performance of the volume and the rate at which the volume accumulates I/O credits for bursting. For more information about gp2 baseline performance, I/O credits, and bursting, see Amazon EBS Volume Types in the Amazon Elastic Compute Cloud User Guide. Constraint: Range is 100-20000 IOPS for io1 volumes and 100-10000 IOPS for gp2 volumes. Condition: This parameter is required for requests to create io1volumes; it is not used in requests to create gp2, st1, sc1, or standard volumes.
     */
    Iops?: Integer;
    /**
     * The ID of the snapshot.
     */
    SnapshotId?: String;
    /**
     * The size of the volume, in GiB. Default: If you're creating the volume from a snapshot and don't specify a volume size, the default is the snapshot size.
     */
    VolumeSize?: Integer;
    /**
     * The volume type. gp2 for General Purpose SSD, io1 for Provisioned IOPS SSD, Throughput Optimized HDD for st1, Cold HDD for sc1, or standard for Magnetic. Default: standard 
     */
    VolumeType?: String;
  }
  export interface ScheduledInstancesIamInstanceProfile {
    /**
     * The Amazon Resource Name (ARN).
     */
    Arn?: String;
    /**
     * The name.
     */
    Name?: String;
  }
  export interface ScheduledInstancesIpv6Address {
    /**
     * The IPv6 address.
     */
    Ipv6Address?: Ipv6Address;
  }
  export type ScheduledInstancesIpv6AddressList = ScheduledInstancesIpv6Address[];
  export interface ScheduledInstancesLaunchSpecification {
    /**
     * One or more block device mapping entries.
     */
    BlockDeviceMappings?: ScheduledInstancesBlockDeviceMappingSet;
    /**
     * Indicates whether the instances are optimized for EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS-optimized instance. Default: false 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: ScheduledInstancesIamInstanceProfile;
    /**
     * The ID of the Amazon Machine Image (AMI).
     */
    ImageId: String;
    /**
     * The instance type.
     */
    InstanceType?: String;
    /**
     * The ID of the kernel.
     */
    KernelId?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
    /**
     * Enable or disable monitoring for the instances.
     */
    Monitoring?: ScheduledInstancesMonitoring;
    /**
     * One or more network interfaces.
     */
    NetworkInterfaces?: ScheduledInstancesNetworkInterfaceSet;
    /**
     * The placement information.
     */
    Placement?: ScheduledInstancesPlacement;
    /**
     * The ID of the RAM disk.
     */
    RamdiskId?: String;
    /**
     * The IDs of one or more security groups.
     */
    SecurityGroupIds?: ScheduledInstancesSecurityGroupIdSet;
    /**
     * The ID of the subnet in which to launch the instances.
     */
    SubnetId?: String;
    /**
     * The base64-encoded MIME user data.
     */
    UserData?: String;
  }
  export interface ScheduledInstancesMonitoring {
    /**
     * Indicates whether monitoring is enabled.
     */
    Enabled?: Boolean;
  }
  export interface ScheduledInstancesNetworkInterface {
    /**
     * Indicates whether to assign a public IPv4 address to instances launched in a VPC. The public IPv4 address can only be assigned to a network interface for eth0, and can only be assigned to a new network interface, not an existing one. You cannot specify more than one network interface in the request. If launching into a default subnet, the default value is true.
     */
    AssociatePublicIpAddress?: Boolean;
    /**
     * Indicates whether to delete the interface when the instance is terminated.
     */
    DeleteOnTermination?: Boolean;
    /**
     * The description.
     */
    Description?: String;
    /**
     * The index of the device for the network interface attachment.
     */
    DeviceIndex?: Integer;
    /**
     * The IDs of one or more security groups.
     */
    Groups?: ScheduledInstancesSecurityGroupIdSet;
    /**
     * The number of IPv6 addresses to assign to the network interface. The IPv6 addresses are automatically selected from the subnet range.
     */
    Ipv6AddressCount?: Integer;
    /**
     * One or more specific IPv6 addresses from the subnet range.
     */
    Ipv6Addresses?: ScheduledInstancesIpv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The IPv4 address of the network interface within the subnet.
     */
    PrivateIpAddress?: String;
    /**
     * The private IPv4 addresses.
     */
    PrivateIpAddressConfigs?: PrivateIpAddressConfigSet;
    /**
     * The number of secondary private IPv4 addresses.
     */
    SecondaryPrivateIpAddressCount?: Integer;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
  }
  export type ScheduledInstancesNetworkInterfaceSet = ScheduledInstancesNetworkInterface[];
  export interface ScheduledInstancesPlacement {
    /**
     * The Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * The name of the placement group.
     */
    GroupName?: String;
  }
  export interface ScheduledInstancesPrivateIpAddressConfig {
    /**
     * Indicates whether this is a primary IPv4 address. Otherwise, this is a secondary IPv4 address.
     */
    Primary?: Boolean;
    /**
     * The IPv4 address.
     */
    PrivateIpAddress?: String;
  }
  export type ScheduledInstancesSecurityGroupIdSet = String[];
  export interface SecurityGroup {
    /**
     * A description of the security group.
     */
    Description?: String;
    /**
     * The name of the security group.
     */
    GroupName?: String;
    /**
     * One or more inbound rules associated with the security group.
     */
    IpPermissions?: IpPermissionList;
    /**
     * The AWS account ID of the owner of the security group.
     */
    OwnerId?: String;
    /**
     * The ID of the security group.
     */
    GroupId?: String;
    /**
     * [EC2-VPC] One or more outbound rules associated with the security group.
     */
    IpPermissionsEgress?: IpPermissionList;
    /**
     * Any tags assigned to the security group.
     */
    Tags?: TagList;
    /**
     * [EC2-VPC] The ID of the VPC for the security group.
     */
    VpcId?: String;
  }
  export type SecurityGroupIdStringList = String[];
  export interface SecurityGroupIdentifier {
    /**
     * The ID of the security group.
     */
    GroupId?: String;
    /**
     * The name of the security group.
     */
    GroupName?: String;
  }
  export type SecurityGroupList = SecurityGroup[];
  export interface SecurityGroupReference {
    /**
     * The ID of your security group.
     */
    GroupId: String;
    /**
     * The ID of the VPC with the referencing security group.
     */
    ReferencingVpcId: String;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId?: String;
  }
  export type SecurityGroupReferences = SecurityGroupReference[];
  export type SecurityGroupStringList = String[];
  export interface ServiceConfiguration {
    /**
     * The type of service.
     */
    ServiceType?: ServiceTypeDetailSet;
    /**
     * The ID of the service.
     */
    ServiceId?: String;
    /**
     * The name of the service.
     */
    ServiceName?: String;
    /**
     * The service state.
     */
    ServiceState?: ServiceState;
    /**
     * In the Availability Zones in which the service is available.
     */
    AvailabilityZones?: ValueStringList;
    /**
     * Indicates whether requests from other AWS accounts to create an endpoint to the service must first be accepted.
     */
    AcceptanceRequired?: Boolean;
    /**
     * The Amazon Resource Names (ARNs) of the Network Load Balancers for the service.
     */
    NetworkLoadBalancerArns?: ValueStringList;
    /**
     * The DNS names for the service.
     */
    BaseEndpointDnsNames?: ValueStringList;
    /**
     * The private DNS name for the service.
     */
    PrivateDnsName?: String;
  }
  export type ServiceConfigurationSet = ServiceConfiguration[];
  export interface ServiceDetail {
    /**
     * The Amazon Resource Name (ARN) of the service.
     */
    ServiceName?: String;
    /**
     * The type of service.
     */
    ServiceType?: ServiceTypeDetailSet;
    /**
     * The Availability Zones in which the service is available.
     */
    AvailabilityZones?: ValueStringList;
    /**
     * The AWS account ID of the service owner.
     */
    Owner?: String;
    /**
     * The DNS names for the service.
     */
    BaseEndpointDnsNames?: ValueStringList;
    /**
     * The private DNS name for the service.
     */
    PrivateDnsName?: String;
    /**
     * Indicates whether the service supports endpoint policies.
     */
    VpcEndpointPolicySupported?: Boolean;
    /**
     * Indicates whether VPC endpoint connection requests to the service must be accepted by the service owner.
     */
    AcceptanceRequired?: Boolean;
  }
  export type ServiceDetailSet = ServiceDetail[];
  export type ServiceState = "Pending"|"Available"|"Deleting"|"Deleted"|"Failed"|string;
  export type ServiceType = "Interface"|"Gateway"|string;
  export interface ServiceTypeDetail {
    /**
     * The type of service.
     */
    ServiceType?: ServiceType;
  }
  export type ServiceTypeDetailSet = ServiceTypeDetail[];
  export type ShutdownBehavior = "stop"|"terminate"|string;
  export interface SlotDateTimeRangeRequest {
    /**
     * The earliest date and time, in UTC, for the Scheduled Instance to start.
     */
    EarliestTime: DateTime;
    /**
     * The latest date and time, in UTC, for the Scheduled Instance to start. This value must be later than or equal to the earliest date and at most three months in the future.
     */
    LatestTime: DateTime;
  }
  export interface SlotStartTimeRangeRequest {
    /**
     * The earliest date and time, in UTC, for the Scheduled Instance to start.
     */
    EarliestTime?: DateTime;
    /**
     * The latest date and time, in UTC, for the Scheduled Instance to start.
     */
    LatestTime?: DateTime;
  }
  export interface Snapshot {
    /**
     * The data encryption key identifier for the snapshot. This value is a unique identifier that corresponds to the data encryption key that was used to encrypt the original volume or snapshot copy. Because data encryption keys are inherited by volumes created from snapshots, and vice versa, if snapshots share the same data encryption key identifier, then they belong to the same volume/snapshot lineage. This parameter is only returned by the DescribeSnapshots API operation.
     */
    DataEncryptionKeyId?: String;
    /**
     * The description for the snapshot.
     */
    Description?: String;
    /**
     * Indicates whether the snapshot is encrypted.
     */
    Encrypted?: Boolean;
    /**
     * The full ARN of the AWS Key Management Service (AWS KMS) customer master key (CMK) that was used to protect the volume encryption key for the parent volume.
     */
    KmsKeyId?: String;
    /**
     * The AWS account ID of the EBS snapshot owner.
     */
    OwnerId?: String;
    /**
     * The progress of the snapshot, as a percentage.
     */
    Progress?: String;
    /**
     * The ID of the snapshot. Each snapshot receives a unique identifier when it is created.
     */
    SnapshotId?: String;
    /**
     * The time stamp when the snapshot was initiated.
     */
    StartTime?: DateTime;
    /**
     * The snapshot state.
     */
    State?: SnapshotState;
    /**
     * Encrypted Amazon EBS snapshots are copied asynchronously. If a snapshot copy operation fails (for example, if the proper AWS Key Management Service (AWS KMS) permissions are not obtained) this field displays error state details to help you diagnose why the error occurred. This parameter is only returned by the DescribeSnapshots API operation.
     */
    StateMessage?: String;
    /**
     * The ID of the volume that was used to create the snapshot. Snapshots created by the CopySnapshot action have an arbitrary volume ID that should not be used for any purpose.
     */
    VolumeId?: String;
    /**
     * The size of the volume, in GiB.
     */
    VolumeSize?: Integer;
    /**
     *  Value from an Amazon-maintained list (amazon | aws-marketplace | microsoft) of snapshot owners. Not to be confused with the user-configured AWS account alias, which is set from the IAM console. 
     */
    OwnerAlias?: String;
    /**
     * Any tags assigned to the snapshot.
     */
    Tags?: TagList;
  }
  export type SnapshotAttributeName = "productCodes"|"createVolumePermission"|string;
  export interface SnapshotDetail {
    /**
     * A description for the snapshot.
     */
    Description?: String;
    /**
     * The block device mapping for the snapshot.
     */
    DeviceName?: String;
    /**
     * The size of the disk in the snapshot, in GiB.
     */
    DiskImageSize?: Double;
    /**
     * The format of the disk image from which the snapshot is created.
     */
    Format?: String;
    /**
     * The percentage of progress for the task.
     */
    Progress?: String;
    /**
     * The snapshot ID of the disk being imported.
     */
    SnapshotId?: String;
    /**
     * A brief status of the snapshot creation.
     */
    Status?: String;
    /**
     * A detailed status message for the snapshot creation.
     */
    StatusMessage?: String;
    /**
     * The URL used to access the disk image.
     */
    Url?: String;
    /**
     * The S3 bucket for the disk image.
     */
    UserBucket?: UserBucketDetails;
  }
  export type SnapshotDetailList = SnapshotDetail[];
  export interface SnapshotDiskContainer {
    /**
     * The description of the disk image being imported.
     */
    Description?: String;
    /**
     * The format of the disk image being imported. Valid values: VHD | VMDK | OVA 
     */
    Format?: String;
    /**
     * The URL to the Amazon S3-based disk image being imported. It can either be a https URL (https://..) or an Amazon S3 URL (s3://..).
     */
    Url?: String;
    /**
     * The S3 bucket for the disk image.
     */
    UserBucket?: UserBucket;
  }
  export type SnapshotIdStringList = String[];
  export type SnapshotList = Snapshot[];
  export type SnapshotState = "pending"|"completed"|"error"|string;
  export interface SnapshotTaskDetail {
    /**
     * The description of the snapshot.
     */
    Description?: String;
    /**
     * The size of the disk in the snapshot, in GiB.
     */
    DiskImageSize?: Double;
    /**
     * The format of the disk image from which the snapshot is created.
     */
    Format?: String;
    /**
     * The percentage of completion for the import snapshot task.
     */
    Progress?: String;
    /**
     * The snapshot ID of the disk being imported.
     */
    SnapshotId?: String;
    /**
     * A brief status for the import snapshot task.
     */
    Status?: String;
    /**
     * A detailed status message for the import snapshot task.
     */
    StatusMessage?: String;
    /**
     * The URL of the disk image from which the snapshot is created.
     */
    Url?: String;
    /**
     * The S3 bucket for the disk image.
     */
    UserBucket?: UserBucketDetails;
  }
  export type SpotAllocationStrategy = "lowest-price"|"diversified"|string;
  export interface SpotDatafeedSubscription {
    /**
     * The Amazon S3 bucket where the Spot Instance data feed is located.
     */
    Bucket?: String;
    /**
     * The fault codes for the Spot Instance request, if any.
     */
    Fault?: SpotInstanceStateFault;
    /**
     * The AWS account ID of the account.
     */
    OwnerId?: String;
    /**
     * The prefix that is prepended to data feed files.
     */
    Prefix?: String;
    /**
     * The state of the Spot Instance data feed subscription.
     */
    State?: DatafeedSubscriptionState;
  }
  export interface SpotFleetLaunchSpecification {
    /**
     * One or more security groups. When requesting instances in a VPC, you must specify the IDs of the security groups. When requesting instances in EC2-Classic, you can specify the names or the IDs of the security groups.
     */
    SecurityGroups?: GroupIdentifierList;
    /**
     * Deprecated.
     */
    AddressingType?: String;
    /**
     * One or more block device mapping entries. You can't specify both a snapshot ID and an encryption value. This is because only blank volumes can be encrypted on creation. If a snapshot is the basis for a volume, it is not blank and its encryption status is used for the volume encryption status.
     */
    BlockDeviceMappings?: BlockDeviceMappingList;
    /**
     * Indicates whether the instances are optimized for EBS I/O. This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance. This optimization isn't available with all instance types. Additional usage charges apply when using an EBS Optimized instance. Default: false 
     */
    EbsOptimized?: Boolean;
    /**
     * The IAM instance profile.
     */
    IamInstanceProfile?: IamInstanceProfileSpecification;
    /**
     * The ID of the AMI.
     */
    ImageId?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * The ID of the kernel.
     */
    KernelId?: String;
    /**
     * The name of the key pair.
     */
    KeyName?: String;
    /**
     * Enable or disable monitoring for the instances.
     */
    Monitoring?: SpotFleetMonitoring;
    /**
     * One or more network interfaces. If you specify a network interface, you must specify subnet IDs and security group IDs using the network interface.
     */
    NetworkInterfaces?: InstanceNetworkInterfaceSpecificationList;
    /**
     * The placement information.
     */
    Placement?: SpotPlacement;
    /**
     * The ID of the RAM disk.
     */
    RamdiskId?: String;
    /**
     * The maximum price per unit hour that you are willing to pay for a Spot Instance. If this value is not specified, the default is the Spot price specified for the fleet. To determine the Spot price per unit hour, divide the Spot price by the value of WeightedCapacity.
     */
    SpotPrice?: String;
    /**
     * The ID of the subnet in which to launch the instances. To specify multiple subnets, separate them using commas; for example, "subnet-a61dafcf, subnet-65ea5f08".
     */
    SubnetId?: String;
    /**
     * The Base64-encoded user data to make available to the instances.
     */
    UserData?: String;
    /**
     * The number of units provided by the specified instance type. These are the same units that you chose to set the target capacity in terms (instances or a performance characteristic such as vCPUs, memory, or I/O). If the target capacity divided by this value is not a whole number, we round the number of instances to the next whole number. If this value is not specified, the default is 1.
     */
    WeightedCapacity?: Double;
    /**
     * The tags to apply during creation.
     */
    TagSpecifications?: SpotFleetTagSpecificationList;
  }
  export interface SpotFleetMonitoring {
    /**
     * Enables monitoring for the instance. Default: false 
     */
    Enabled?: Boolean;
  }
  export interface SpotFleetRequestConfig {
    /**
     * The progress of the Spot Fleet request. If there is an error, the status is error. After all requests are placed, the status is pending_fulfillment. If the size of the fleet is equal to or greater than its target capacity, the status is fulfilled. If the size of the fleet is decreased, the status is pending_termination while Spot Instances are terminating.
     */
    ActivityStatus?: ActivityStatus;
    /**
     * The creation date and time of the request.
     */
    CreateTime: DateTime;
    /**
     * The configuration of the Spot Fleet request.
     */
    SpotFleetRequestConfig: SpotFleetRequestConfigData;
    /**
     * The ID of the Spot Fleet request.
     */
    SpotFleetRequestId: String;
    /**
     * The state of the Spot Fleet request.
     */
    SpotFleetRequestState: BatchState;
  }
  export interface SpotFleetRequestConfigData {
    /**
     * Indicates how to allocate the target capacity across the Spot pools specified by the Spot Fleet request. The default is lowestPrice.
     */
    AllocationStrategy?: AllocationStrategy;
    /**
     * The order of the launch template overrides to use in fulfilling On-Demand capacity. If you specify lowestPrice, Spot Fleet uses price to determine the order, launching the lowest price first. If you specify prioritized, Spot Fleet uses the priority that you assign to each Spot Fleet launch template override, launching the highest priority first. If you do not specify a value, Spot Fleet defaults to lowestPrice.
     */
    OnDemandAllocationStrategy?: OnDemandAllocationStrategy;
    /**
     * A unique, case-sensitive identifier that you provide to ensure the idempotency of your listings. This helps to avoid duplicate listings. For more information, see Ensuring Idempotency.
     */
    ClientToken?: String;
    /**
     * Indicates whether running Spot Instances should be terminated if the target capacity of the Spot Fleet request is decreased below the current size of the Spot Fleet.
     */
    ExcessCapacityTerminationPolicy?: ExcessCapacityTerminationPolicy;
    /**
     * The number of units fulfilled by this request compared to the set target capacity.
     */
    FulfilledCapacity?: Double;
    /**
     * The number of On-Demand units fulfilled by this request compared to the set target On-Demand capacity.
     */
    OnDemandFulfilledCapacity?: Double;
    /**
     * Grants the Spot Fleet permission to terminate Spot Instances on your behalf when you cancel its Spot Fleet request using CancelSpotFleetRequests or when the Spot Fleet request expires, if you set terminateInstancesWithExpiration.
     */
    IamFleetRole: String;
    /**
     * The launch specifications for the Spot Fleet request.
     */
    LaunchSpecifications?: LaunchSpecsList;
    /**
     * The launch template and overrides.
     */
    LaunchTemplateConfigs?: LaunchTemplateConfigList;
    /**
     * The maximum price per unit hour that you are willing to pay for a Spot Instance. The default is the On-Demand price.
     */
    SpotPrice?: String;
    /**
     * The number of units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O. If the request type is maintain, you can specify a target capacity of 0 and add capacity later.
     */
    TargetCapacity: Integer;
    /**
     * The number of On-Demand units to request. You can choose to set the target capacity in terms of instances or a performance characteristic that is important to your application workload, such as vCPUs, memory, or I/O. If the request type is maintain, you can specify a target capacity of 0 and add capacity later.
     */
    OnDemandTargetCapacity?: Integer;
    /**
     * Indicates whether running Spot Instances should be terminated when the Spot Fleet request expires.
     */
    TerminateInstancesWithExpiration?: Boolean;
    /**
     * The type of request. Indicates whether the Spot Fleet only requests the target capacity or also attempts to maintain it. When this value is request, the Spot Fleet only places the required requests. It does not attempt to replenish Spot Instances if capacity is diminished, nor does it submit requests in alternative Spot pools if capacity is not available. To maintain a certain target capacity, the Spot Fleet places the required requests to meet capacity and automatically replenishes any interrupted instances. Default: maintain.
     */
    Type?: FleetType;
    /**
     * The start date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). The default is to start fulfilling the request immediately.
     */
    ValidFrom?: DateTime;
    /**
     * The end date and time of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). At this point, no new Spot Instance requests are placed or able to fulfill the request. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * Indicates whether Spot Fleet should replace unhealthy instances.
     */
    ReplaceUnhealthyInstances?: Boolean;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
    /**
     * One or more Classic Load Balancers and target groups to attach to the Spot Fleet request. Spot Fleet registers the running Spot Instances with the specified Classic Load Balancers and target groups. With Network Load Balancers, Spot Fleet cannot register instances that have the following instance types: C1, CC1, CC2, CG1, CG2, CR1, CS1, G1, G2, HI1, HS1, M1, M2, M3, and T1.
     */
    LoadBalancersConfig?: LoadBalancersConfig;
    /**
     * The number of Spot pools across which to allocate your target Spot capacity. Valid only when Spot AllocationStrategy is set to lowest-price. Spot Fleet selects the cheapest Spot pools and evenly allocates your target Spot capacity across the number of Spot pools that you specify.
     */
    InstancePoolsToUseCount?: Integer;
  }
  export type SpotFleetRequestConfigSet = SpotFleetRequestConfig[];
  export interface SpotFleetTagSpecification {
    /**
     * The type of resource. Currently, the only resource type that is supported is instance.
     */
    ResourceType?: ResourceType;
    /**
     * The tags.
     */
    Tags?: TagList;
  }
  export type SpotFleetTagSpecificationList = SpotFleetTagSpecification[];
  export type SpotInstanceInterruptionBehavior = "hibernate"|"stop"|"terminate"|string;
  export interface SpotInstanceRequest {
    /**
     * If you specified a duration and your Spot Instance request was fulfilled, this is the fixed hourly price in effect for the Spot Instance while it runs.
     */
    ActualBlockHourlyPrice?: String;
    /**
     * The Availability Zone group. If you specify the same Availability Zone group for all Spot Instance requests, all Spot Instances are launched in the same Availability Zone.
     */
    AvailabilityZoneGroup?: String;
    /**
     * The duration for the Spot Instance, in minutes.
     */
    BlockDurationMinutes?: Integer;
    /**
     * The date and time when the Spot Instance request was created, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    CreateTime?: DateTime;
    /**
     * The fault codes for the Spot Instance request, if any.
     */
    Fault?: SpotInstanceStateFault;
    /**
     * The instance ID, if an instance has been launched to fulfill the Spot Instance request.
     */
    InstanceId?: String;
    /**
     * The instance launch group. Launch groups are Spot Instances that launch together and terminate together.
     */
    LaunchGroup?: String;
    /**
     * Additional information for launching instances.
     */
    LaunchSpecification?: LaunchSpecification;
    /**
     * The Availability Zone in which the request is launched.
     */
    LaunchedAvailabilityZone?: String;
    /**
     * The product description associated with the Spot Instance.
     */
    ProductDescription?: RIProductDescription;
    /**
     * The ID of the Spot Instance request.
     */
    SpotInstanceRequestId?: String;
    /**
     * The maximum price per hour that you are willing to pay for a Spot Instance.
     */
    SpotPrice?: String;
    /**
     * The state of the Spot Instance request. Spot status information helps track your Spot Instance requests. For more information, see Spot Status in the Amazon EC2 User Guide for Linux Instances.
     */
    State?: SpotInstanceState;
    /**
     * The status code and status message describing the Spot Instance request.
     */
    Status?: SpotInstanceStatus;
    /**
     * Any tags assigned to the resource.
     */
    Tags?: TagList;
    /**
     * The Spot Instance request type.
     */
    Type?: SpotInstanceType;
    /**
     * The start date of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). The request becomes active at this date and time.
     */
    ValidFrom?: DateTime;
    /**
     * The end date of the request, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ). If this is a one-time request, it remains active until all instances launch, the request is canceled, or this date is reached. If the request is persistent, it remains active until it is canceled or this date is reached. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * The behavior when a Spot Instance is interrupted.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
  }
  export type SpotInstanceRequestIdList = String[];
  export type SpotInstanceRequestList = SpotInstanceRequest[];
  export type SpotInstanceState = "open"|"active"|"closed"|"cancelled"|"failed"|string;
  export interface SpotInstanceStateFault {
    /**
     * The reason code for the Spot Instance state change.
     */
    Code?: String;
    /**
     * The message for the Spot Instance state change.
     */
    Message?: String;
  }
  export interface SpotInstanceStatus {
    /**
     * The status code. For a list of status codes, see Spot Status Codes in the Amazon EC2 User Guide for Linux Instances.
     */
    Code?: String;
    /**
     * The description for the status code.
     */
    Message?: String;
    /**
     * The date and time of the most recent status update, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    UpdateTime?: DateTime;
  }
  export type SpotInstanceType = "one-time"|"persistent"|string;
  export interface SpotMarketOptions {
    /**
     * The maximum hourly price you're willing to pay for the Spot Instances. The default is the On-Demand price.
     */
    MaxPrice?: String;
    /**
     * The Spot Instance request type. For RunInstances, persistent Spot Instance requests are only supported when InstanceInterruptionBehavior is set to either hibernate or stop.
     */
    SpotInstanceType?: SpotInstanceType;
    /**
     * The required duration for the Spot Instances (also known as Spot blocks), in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360).
     */
    BlockDurationMinutes?: Integer;
    /**
     * The end date of the request. For a one-time request, the request remains active until all instances launch, the request is canceled, or this date is reached. If the request is persistent, it remains active until it is canceled or this date and time is reached. The default end date is 7 days from the current date.
     */
    ValidUntil?: DateTime;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: InstanceInterruptionBehavior;
  }
  export interface SpotOptions {
    /**
     * Indicates how to allocate the target capacity across the Spot pools specified by the Spot Fleet request. The default is lowest-price.
     */
    AllocationStrategy?: SpotAllocationStrategy;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: SpotInstanceInterruptionBehavior;
    /**
     * The number of Spot pools across which to allocate your target Spot capacity. Valid only when AllocationStrategy is set to lowestPrice. EC2 Fleet selects the cheapest Spot pools and evenly allocates your target Spot capacity across the number of Spot pools that you specify.
     */
    InstancePoolsToUseCount?: Integer;
  }
  export interface SpotOptionsRequest {
    /**
     * Indicates how to allocate the target capacity across the Spot pools specified by the Spot Fleet request. The default is lowestPrice.
     */
    AllocationStrategy?: SpotAllocationStrategy;
    /**
     * The behavior when a Spot Instance is interrupted. The default is terminate.
     */
    InstanceInterruptionBehavior?: SpotInstanceInterruptionBehavior;
    /**
     * The number of Spot pools across which to allocate your target Spot capacity. Valid only when Spot AllocationStrategy is set to lowest-price. EC2 Fleet selects the cheapest Spot pools and evenly allocates your target Spot capacity across the number of Spot pools that you specify.
     */
    InstancePoolsToUseCount?: Integer;
  }
  export interface SpotPlacement {
    /**
     * The Availability Zone. [Spot Fleet only] To specify multiple Availability Zones, separate them using commas; for example, "us-west-2a, us-west-2b".
     */
    AvailabilityZone?: String;
    /**
     * The name of the placement group.
     */
    GroupName?: String;
    /**
     * The tenancy of the instance (if the instance is running in a VPC). An instance with a tenancy of dedicated runs on single-tenant hardware. The host tenancy is not supported for Spot Instances.
     */
    Tenancy?: Tenancy;
  }
  export interface SpotPrice {
    /**
     * The Availability Zone.
     */
    AvailabilityZone?: String;
    /**
     * The instance type.
     */
    InstanceType?: InstanceType;
    /**
     * A general description of the AMI.
     */
    ProductDescription?: RIProductDescription;
    /**
     * The maximum price per hour that you are willing to pay for a Spot Instance.
     */
    SpotPrice?: String;
    /**
     * The date and time the request was created, in UTC format (for example, YYYY-MM-DDTHH:MM:SSZ).
     */
    Timestamp?: DateTime;
  }
  export type SpotPriceHistoryList = SpotPrice[];
  export interface StaleIpPermission {
    /**
     * The start of the port range for the TCP and UDP protocols, or an ICMP type number. A value of -1 indicates all ICMP types. 
     */
    FromPort?: Integer;
    /**
     * The IP protocol name (for tcp, udp, and icmp) or number (see Protocol Numbers).
     */
    IpProtocol?: String;
    /**
     * One or more IP ranges. Not applicable for stale security group rules.
     */
    IpRanges?: IpRanges;
    /**
     * One or more prefix list IDs for an AWS service. Not applicable for stale security group rules.
     */
    PrefixListIds?: PrefixListIdSet;
    /**
     * The end of the port range for the TCP and UDP protocols, or an ICMP type number. A value of -1 indicates all ICMP types. 
     */
    ToPort?: Integer;
    /**
     * One or more security group pairs. Returns the ID of the referenced security group and VPC, and the ID and status of the VPC peering connection.
     */
    UserIdGroupPairs?: UserIdGroupPairSet;
  }
  export type StaleIpPermissionSet = StaleIpPermission[];
  export interface StaleSecurityGroup {
    /**
     * The description of the security group.
     */
    Description?: String;
    /**
     * The ID of the security group.
     */
    GroupId: String;
    /**
     * The name of the security group.
     */
    GroupName?: String;
    /**
     * Information about the stale inbound rules in the security group.
     */
    StaleIpPermissions?: StaleIpPermissionSet;
    /**
     * Information about the stale outbound rules in the security group.
     */
    StaleIpPermissionsEgress?: StaleIpPermissionSet;
    /**
     * The ID of the VPC for the security group.
     */
    VpcId?: String;
  }
  export type StaleSecurityGroupSet = StaleSecurityGroup[];
  export interface StartInstancesRequest {
    /**
     * One or more instance IDs.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Reserved.
     */
    AdditionalInfo?: String;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface StartInstancesResult {
    /**
     * Information about one or more started instances.
     */
    StartingInstances?: InstanceStateChangeList;
  }
  export type State = "PendingAcceptance"|"Pending"|"Available"|"Deleting"|"Deleted"|"Rejected"|"Failed"|"Expired"|string;
  export interface StateReason {
    /**
     * The reason code for the state change.
     */
    Code?: String;
    /**
     * The message for the state change.    Server.InsufficientInstanceCapacity: There was insufficient capacity available to satisfy the launch request.    Server.InternalError: An internal error caused the instance to terminate during launch.    Server.ScheduledStop: The instance was stopped due to a scheduled retirement.    Server.SpotInstanceShutdown: The instance was stopped because the number of Spot requests with a maximum price equal to or higher than the Spot price exceeded available capacity or because of an increase in the Spot price.    Server.SpotInstanceTermination: The instance was terminated because the number of Spot requests with a maximum price equal to or higher than the Spot price exceeded available capacity or because of an increase in the Spot price.    Client.InstanceInitiatedShutdown: The instance was shut down using the shutdown -h command from the instance.    Client.InstanceTerminated: The instance was terminated or rebooted during AMI creation.    Client.InternalError: A client error caused the instance to terminate during launch.    Client.InvalidSnapshot.NotFound: The specified snapshot was not found.    Client.UserInitiatedShutdown: The instance was shut down using the Amazon EC2 API.    Client.VolumeLimitExceeded: The limit on the number of EBS volumes or total storage was exceeded. Decrease usage or request an increase in your account limits.  
     */
    Message?: String;
  }
  export type Status = "MoveInProgress"|"InVpc"|"InClassic"|string;
  export type StatusName = "reachability"|string;
  export type StatusType = "passed"|"failed"|"insufficient-data"|"initializing"|string;
  export interface StopInstancesRequest {
    /**
     * One or more instance IDs.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * Forces the instances to stop. The instances do not have an opportunity to flush file system caches or file system metadata. If you use this option, you must perform file system check and repair procedures. This option is not recommended for Windows instances. Default: false 
     */
    Force?: Boolean;
  }
  export interface StopInstancesResult {
    /**
     * Information about one or more stopped instances.
     */
    StoppingInstances?: InstanceStateChangeList;
  }
  export interface Storage {
    /**
     * An Amazon S3 storage location.
     */
    S3?: S3Storage;
  }
  export interface StorageLocation {
    /**
     * The name of the S3 bucket.
     */
    Bucket?: String;
    /**
     * The key.
     */
    Key?: String;
  }
  export type String = string;
  export interface Subnet {
    /**
     * The Availability Zone of the subnet.
     */
    AvailabilityZone?: String;
    /**
     * The number of unused private IPv4 addresses in the subnet. The IPv4 addresses for any stopped instances are considered unavailable.
     */
    AvailableIpAddressCount?: Integer;
    /**
     * The IPv4 CIDR block assigned to the subnet.
     */
    CidrBlock?: String;
    /**
     * Indicates whether this is the default subnet for the Availability Zone.
     */
    DefaultForAz?: Boolean;
    /**
     * Indicates whether instances launched in this subnet receive a public IPv4 address.
     */
    MapPublicIpOnLaunch?: Boolean;
    /**
     * The current state of the subnet.
     */
    State?: SubnetState;
    /**
     * The ID of the subnet.
     */
    SubnetId?: String;
    /**
     * The ID of the VPC the subnet is in.
     */
    VpcId?: String;
    /**
     * Indicates whether a network interface created in this subnet (including a network interface created by RunInstances) receives an IPv6 address.
     */
    AssignIpv6AddressOnCreation?: Boolean;
    /**
     * Information about the IPv6 CIDR blocks associated with the subnet.
     */
    Ipv6CidrBlockAssociationSet?: SubnetIpv6CidrBlockAssociationSet;
    /**
     * Any tags assigned to the subnet.
     */
    Tags?: TagList;
  }
  export interface SubnetCidrBlockState {
    /**
     * The state of a CIDR block.
     */
    State?: SubnetCidrBlockStateCode;
    /**
     * A message about the status of the CIDR block, if applicable.
     */
    StatusMessage?: String;
  }
  export type SubnetCidrBlockStateCode = "associating"|"associated"|"disassociating"|"disassociated"|"failing"|"failed"|string;
  export type SubnetIdStringList = String[];
  export interface SubnetIpv6CidrBlockAssociation {
    /**
     * The association ID for the CIDR block.
     */
    AssociationId?: String;
    /**
     * The IPv6 CIDR block.
     */
    Ipv6CidrBlock?: String;
    /**
     * Information about the state of the CIDR block.
     */
    Ipv6CidrBlockState?: SubnetCidrBlockState;
  }
  export type SubnetIpv6CidrBlockAssociationSet = SubnetIpv6CidrBlockAssociation[];
  export type SubnetList = Subnet[];
  export type SubnetState = "pending"|"available"|string;
  export interface SuccessfulInstanceCreditSpecificationItem {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
  }
  export type SuccessfulInstanceCreditSpecificationSet = SuccessfulInstanceCreditSpecificationItem[];
  export type SummaryStatus = "ok"|"impaired"|"insufficient-data"|"not-applicable"|"initializing"|string;
  export interface Tag {
    /**
     * The key of the tag. Constraints: Tag keys are case-sensitive and accept a maximum of 127 Unicode characters. May not begin with aws:.
     */
    Key?: String;
    /**
     * The value of the tag. Constraints: Tag values are case-sensitive and accept a maximum of 255 Unicode characters.
     */
    Value?: String;
  }
  export interface TagDescription {
    /**
     * The tag key.
     */
    Key?: String;
    /**
     * The ID of the resource. For example, ami-1a2b3c4d.
     */
    ResourceId?: String;
    /**
     * The resource type.
     */
    ResourceType?: ResourceType;
    /**
     * The tag value.
     */
    Value?: String;
  }
  export type TagDescriptionList = TagDescription[];
  export type TagList = Tag[];
  export interface TagSpecification {
    /**
     * The type of resource to tag. Currently, the resource types that support tagging on creation are fleet, dedicated-host, instance, snapshot, and volume. To tag a resource after it has been created, see CreateTags.
     */
    ResourceType?: ResourceType;
    /**
     * The tags to apply to the resource.
     */
    Tags?: TagList;
  }
  export type TagSpecificationList = TagSpecification[];
  export interface TargetCapacitySpecification {
    /**
     * The number of units to request, filled using DefaultTargetCapacityType.
     */
    TotalTargetCapacity?: Integer;
    /**
     * The number of On-Demand units to request.
     */
    OnDemandTargetCapacity?: Integer;
    /**
     * The maximum number of Spot units to launch.
     */
    SpotTargetCapacity?: Integer;
    /**
     * The default TotalTargetCapacity, which is either Spot or On-Demand.
     */
    DefaultTargetCapacityType?: DefaultTargetCapacityType;
  }
  export interface TargetCapacitySpecificationRequest {
    /**
     * The number of units to request, filled using DefaultTargetCapacityType.
     */
    TotalTargetCapacity: Integer;
    /**
     * The number of On-Demand units to request.
     */
    OnDemandTargetCapacity?: Integer;
    /**
     * The number of Spot units to request.
     */
    SpotTargetCapacity?: Integer;
    /**
     * The default TotalTargetCapacity, which is either Spot or On-Demand.
     */
    DefaultTargetCapacityType?: DefaultTargetCapacityType;
  }
  export interface TargetConfiguration {
    /**
     * The number of instances the Convertible Reserved Instance offering can be applied to. This parameter is reserved and cannot be specified in a request
     */
    InstanceCount?: Integer;
    /**
     * The ID of the Convertible Reserved Instance offering.
     */
    OfferingId?: String;
  }
  export interface TargetConfigurationRequest {
    /**
     * The number of instances the Covertible Reserved Instance offering can be applied to. This parameter is reserved and cannot be specified in a request
     */
    InstanceCount?: Integer;
    /**
     * The Convertible Reserved Instance offering ID.
     */
    OfferingId: String;
  }
  export type TargetConfigurationRequestSet = TargetConfigurationRequest[];
  export interface TargetGroup {
    /**
     * The Amazon Resource Name (ARN) of the target group.
     */
    Arn: String;
  }
  export type TargetGroups = TargetGroup[];
  export interface TargetGroupsConfig {
    /**
     * One or more target groups.
     */
    TargetGroups: TargetGroups;
  }
  export interface TargetReservationValue {
    /**
     * The total value of the Convertible Reserved Instances that make up the exchange. This is the sum of the list value, remaining upfront price, and additional upfront cost of the exchange.
     */
    ReservationValue?: ReservationValue;
    /**
     * The configuration of the Convertible Reserved Instances that make up the exchange.
     */
    TargetConfiguration?: TargetConfiguration;
  }
  export type TargetReservationValueSet = TargetReservationValue[];
  export type TelemetryStatus = "UP"|"DOWN"|string;
  export type Tenancy = "default"|"dedicated"|"host"|string;
  export interface TerminateInstancesRequest {
    /**
     * One or more instance IDs. Constraints: Up to 1000 instance IDs. We recommend breaking up this request into smaller batches.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface TerminateInstancesResult {
    /**
     * Information about one or more terminated instances.
     */
    TerminatingInstances?: InstanceStateChangeList;
  }
  export type TrafficType = "ACCEPT"|"REJECT"|"ALL"|string;
  export type TunnelOptionsList = VpnTunnelOptionsSpecification[];
  export interface UnassignIpv6AddressesRequest {
    /**
     * The IPv6 addresses to unassign from the network interface.
     */
    Ipv6Addresses: Ipv6AddressList;
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
  }
  export interface UnassignIpv6AddressesResult {
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId?: String;
    /**
     * The IPv6 addresses that have been unassigned from the network interface.
     */
    UnassignedIpv6Addresses?: Ipv6AddressList;
  }
  export interface UnassignPrivateIpAddressesRequest {
    /**
     * The ID of the network interface.
     */
    NetworkInterfaceId: String;
    /**
     * The secondary private IP addresses to unassign from the network interface. You can specify this option multiple times to unassign more than one IP address.
     */
    PrivateIpAddresses: PrivateIpAddressStringList;
  }
  export interface UnmonitorInstancesRequest {
    /**
     * One or more instance IDs.
     */
    InstanceIds: InstanceIdStringList;
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
  }
  export interface UnmonitorInstancesResult {
    /**
     * The monitoring information.
     */
    InstanceMonitorings?: InstanceMonitoringList;
  }
  export type UnsuccessfulInstanceCreditSpecificationErrorCode = "InvalidInstanceID.Malformed"|"InvalidInstanceID.NotFound"|"IncorrectInstanceState"|"InstanceCreditSpecification.NotSupported"|string;
  export interface UnsuccessfulInstanceCreditSpecificationItem {
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The applicable error for the T2 or T3 instance whose credit option for CPU usage was not modified.
     */
    Error?: UnsuccessfulInstanceCreditSpecificationItemError;
  }
  export interface UnsuccessfulInstanceCreditSpecificationItemError {
    /**
     * The error code.
     */
    Code?: UnsuccessfulInstanceCreditSpecificationErrorCode;
    /**
     * The applicable error message.
     */
    Message?: String;
  }
  export type UnsuccessfulInstanceCreditSpecificationSet = UnsuccessfulInstanceCreditSpecificationItem[];
  export interface UnsuccessfulItem {
    /**
     * Information about the error.
     */
    Error: UnsuccessfulItemError;
    /**
     * The ID of the resource.
     */
    ResourceId?: String;
  }
  export interface UnsuccessfulItemError {
    /**
     * The error code.
     */
    Code: String;
    /**
     * The error message accompanying the error code.
     */
    Message: String;
  }
  export type UnsuccessfulItemList = UnsuccessfulItem[];
  export type UnsuccessfulItemSet = UnsuccessfulItem[];
  export interface UpdateSecurityGroupRuleDescriptionsEgressRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the security group. You must specify either the security group ID or the security group name in the request. For security groups in a nondefault VPC, you must specify the security group ID.
     */
    GroupId?: String;
    /**
     * [Default VPC] The name of the security group. You must specify either the security group ID or the security group name in the request.
     */
    GroupName?: String;
    /**
     * The IP permissions for the security group rule.
     */
    IpPermissions: IpPermissionList;
  }
  export interface UpdateSecurityGroupRuleDescriptionsEgressResult {
    /**
     * Returns true if the request succeeds; otherwise, returns an error.
     */
    Return?: Boolean;
  }
  export interface UpdateSecurityGroupRuleDescriptionsIngressRequest {
    /**
     * Checks whether you have the required permissions for the action, without actually making the request, and provides an error response. If you have the required permissions, the error response is DryRunOperation. Otherwise, it is UnauthorizedOperation.
     */
    DryRun?: Boolean;
    /**
     * The ID of the security group. You must specify either the security group ID or the security group name in the request. For security groups in a nondefault VPC, you must specify the security group ID.
     */
    GroupId?: String;
    /**
     * [EC2-Classic, default VPC] The name of the security group. You must specify either the security group ID or the security group name in the request.
     */
    GroupName?: String;
    /**
     * The IP permissions for the security group rule. 
     */
    IpPermissions: IpPermissionList;
  }
  export interface UpdateSecurityGroupRuleDescriptionsIngressResult {
    /**
     * Returns true if the request succeeds; otherwise, returns an error.
     */
    Return?: Boolean;
  }
  export interface UserBucket {
    /**
     * The name of the S3 bucket where the disk image is located.
     */
    S3Bucket?: String;
    /**
     * The file name of the disk image.
     */
    S3Key?: String;
  }
  export interface UserBucketDetails {
    /**
     * The S3 bucket from which the disk image was created.
     */
    S3Bucket?: String;
    /**
     * The file name of the disk image.
     */
    S3Key?: String;
  }
  export interface UserData {
    /**
     * The user data. If you are using an AWS SDK or command line tool, Base64-encoding is performed for you, and you can load the text from a file. Otherwise, you must provide Base64-encoded text.
     */
    Data?: String;
  }
  export type UserGroupStringList = String[];
  export interface UserIdGroupPair {
    /**
     * A description for the security group rule that references this user ID group pair. Constraints: Up to 255 characters in length. Allowed characters are a-z, A-Z, 0-9, spaces, and ._-:/()#,@[]+=;{}!$*
     */
    Description?: String;
    /**
     * The ID of the security group.
     */
    GroupId?: String;
    /**
     * The name of the security group. In a request, use this parameter for a security group in EC2-Classic or a default VPC only. For a security group in a nondefault VPC, use the security group ID.  For a referenced security group in another VPC, this value is not returned if the referenced security group is deleted.
     */
    GroupName?: String;
    /**
     * The status of a VPC peering connection, if applicable.
     */
    PeeringStatus?: String;
    /**
     * The ID of an AWS account. For a referenced security group in another VPC, the account ID of the referenced security group is returned in the response. If the referenced security group is deleted, this value is not returned. [EC2-Classic] Required when adding or removing rules that reference a security group in another AWS account.
     */
    UserId?: String;
    /**
     * The ID of the VPC for the referenced security group, if applicable.
     */
    VpcId?: String;
    /**
     * The ID of the VPC peering connection, if applicable.
     */
    VpcPeeringConnectionId?: String;
  }
  export type UserIdGroupPairList = UserIdGroupPair[];
  export type UserIdGroupPairSet = UserIdGroupPair[];
  export type UserIdStringList = String[];
  export type ValueStringList = String[];
  export type VersionDescription = string;
  export type VersionStringList = String[];
  export interface VgwTelemetry {
    /**
     * The number of accepted routes.
     */
    AcceptedRouteCount?: Integer;
    /**
     * The date and time of the last change in status.
     */
    LastStatusChange?: DateTime;
    /**
     * The Internet-routable IP address of the virtual private gateway's outside interface.
     */
    OutsideIpAddress?: String;
    /**
     * The status of the VPN tunnel.
     */
    Status?: TelemetryStatus;
    /**
     * If an error occurs, a description of the error.
     */
    StatusMessage?: String;
  }
  export type VgwTelemetryList = VgwTelemetry[];
  export type VirtualizationType = "hvm"|"paravirtual"|string;
  export interface Volume {
    /**
     * Information about the volume attachments.
     */
    Attachments?: VolumeAttachmentList;
    /**
     * The Availability Zone for the volume.
     */
    AvailabilityZone?: String;
    /**
     * The time stamp when volume creation was initiated.
     */
    CreateTime?: DateTime;
    /**
     * Indicates whether the volume will be encrypted.
     */
    Encrypted?: Boolean;
    /**
     * The full ARN of the AWS Key Management Service (AWS KMS) customer master key (CMK) that was used to protect the volume encryption key for the volume.
     */
    KmsKeyId?: String;
    /**
     * The size of the volume, in GiBs.
     */
    Size?: Integer;
    /**
     * The snapshot from which the volume was created, if applicable.
     */
    SnapshotId?: String;
    /**
     * The volume state.
     */
    State?: VolumeState;
    /**
     * The ID of the volume.
     */
    VolumeId?: String;
    /**
     * The number of I/O operations per second (IOPS) that the volume supports. For Provisioned IOPS SSD volumes, this represents the number of IOPS that are provisioned for the volume. For General Purpose SSD volumes, this represents the baseline performance of the volume and the rate at which the volume accumulates I/O credits for bursting. For more information about General Purpose SSD baseline performance, I/O credits, and bursting, see Amazon EBS Volume Types in the Amazon Elastic Compute Cloud User Guide. Constraint: Range is 100-32000 IOPS for io1 volumes and 100-10000 IOPS for gp2 volumes. Condition: This parameter is required for requests to create io1 volumes; it is not used in requests to create gp2, st1, sc1, or standard volumes.
     */
    Iops?: Integer;
    /**
     * Any tags assigned to the volume.
     */
    Tags?: TagList;
    /**
     * The volume type. This can be gp2 for General Purpose SSD, io1 for Provisioned IOPS SSD, st1 for Throughput Optimized HDD, sc1 for Cold HDD, or standard for Magnetic volumes.
     */
    VolumeType?: VolumeType;
  }
  export interface VolumeAttachment {
    /**
     * The time stamp when the attachment initiated.
     */
    AttachTime?: DateTime;
    /**
     * The device name.
     */
    Device?: String;
    /**
     * The ID of the instance.
     */
    InstanceId?: String;
    /**
     * The attachment state of the volume.
     */
    State?: VolumeAttachmentState;
    /**
     * The ID of the volume.
     */
    VolumeId?: String;
    /**
     * Indicates whether the EBS volume is deleted on instance termination.
     */
    DeleteOnTermination?: Boolean;
  }
  export type VolumeAttachmentList = VolumeAttachment[];
  export type VolumeAttachmentState = "attaching"|"attached"|"detaching"|"detached"|"busy"|string;
  export type VolumeAttributeName = "autoEnableIO"|"productCodes"|string;
  export interface VolumeDetail {
    /**
     * The size of the volume, in GiB.
     */
    Size: Long;
  }
  export type VolumeIdStringList = String[];
  export type VolumeList = Volume[];
  export interface VolumeModification {
    /**
     * The ID of the volume.
     */
    VolumeId?: String;
    /**
     * The current modification state. The modification state is null for unmodified volumes.
     */
    ModificationState?: VolumeModificationState;
    /**
     * A status message about the modification progress or failure.
     */
    StatusMessage?: String;
    /**
     * The target size of the volume, in GiB.
     */
    TargetSize?: Integer;
    /**
     * The target IOPS rate of the volume.
     */
    TargetIops?: Integer;
    /**
     * The target EBS volume type of the volume.
     */
    TargetVolumeType?: VolumeType;
    /**
     * The original size of the volume.
     */
    OriginalSize?: Integer;
    /**
     * The original IOPS rate of the volume.
     */
    OriginalIops?: Integer;
    /**
     * The original EBS volume type of the volume.
     */
    OriginalVolumeType?: VolumeType;
    /**
     * The modification progress, from 0 to 100 percent complete.
     */
    Progress?: Long;
    /**
     * The modification start time.
     */
    StartTime?: DateTime;
    /**
     * The modification completion or failure time.
     */
    EndTime?: DateTime;
  }
  export type VolumeModificationList = VolumeModification[];
  export type VolumeModificationState = "modifying"|"optimizing"|"completed"|"failed"|string;
  export type VolumeState = "creating"|"available"|"in-use"|"deleting"|"deleted"|"error"|string;
  export interface VolumeStatusAction {
    /**
     * The code identifying the operation, for example, enable-volume-io.
     */
    Code?: String;
    /**
     * A description of the operation.
     */
    Description?: String;
    /**
     * The ID of the event associated with this operation.
     */
    EventId?: String;
    /**
     * The event type associated with this operation.
     */
    EventType?: String;
  }
  export type VolumeStatusActionsList = VolumeStatusAction[];
  export interface VolumeStatusDetails {
    /**
     * The name of the volume status.
     */
    Name?: VolumeStatusName;
    /**
     * The intended status of the volume status.
     */
    Status?: String;
  }
  export type VolumeStatusDetailsList = VolumeStatusDetails[];
  export interface VolumeStatusEvent {
    /**
     * A description of the event.
     */
    Description?: String;
    /**
     * The ID of this event.
     */
    EventId?: String;
    /**
     * The type of this event.
     */
    EventType?: String;
    /**
     * The latest end time of the event.
     */
    NotAfter?: DateTime;
    /**
     * The earliest start time of the event.
     */
    NotBefore?: DateTime;
  }
  export type VolumeStatusEventsList = VolumeStatusEvent[];
  export interface VolumeStatusInfo {
    /**
     * The details of the volume status.
     */
    Details?: VolumeStatusDetailsList;
    /**
     * The status of the volume.
     */
    Status?: VolumeStatusInfoStatus;
  }
  export type VolumeStatusInfoStatus = "ok"|"impaired"|"insufficient-data"|string;
  export interface VolumeStatusItem {
    /**
     * The details of the operation.
     */
    Actions?: VolumeStatusActionsList;
    /**
     * The Availability Zone of the volume.
     */
    AvailabilityZone?: String;
    /**
     * A list of events associated with the volume.
     */
    Events?: VolumeStatusEventsList;
    /**
     * The volume ID.
     */
    VolumeId?: String;
    /**
     * The volume status.
     */
    VolumeStatus?: VolumeStatusInfo;
  }
  export type VolumeStatusList = VolumeStatusItem[];
  export type VolumeStatusName = "io-enabled"|"io-performance"|string;
  export type VolumeType = "standard"|"io1"|"gp2"|"sc1"|"st1"|string;
  export interface Vpc {
    /**
     * The primary IPv4 CIDR block for the VPC.
     */
    CidrBlock?: String;
    /**
     * The ID of the set of DHCP options you've associated with the VPC (or default if the default options are associated with the VPC).
     */
    DhcpOptionsId?: String;
    /**
     * The current state of the VPC.
     */
    State?: VpcState;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
    /**
     * The allowed tenancy of instances launched into the VPC.
     */
    InstanceTenancy?: Tenancy;
    /**
     * Information about the IPv6 CIDR blocks associated with the VPC.
     */
    Ipv6CidrBlockAssociationSet?: VpcIpv6CidrBlockAssociationSet;
    /**
     * Information about the IPv4 CIDR blocks associated with the VPC.
     */
    CidrBlockAssociationSet?: VpcCidrBlockAssociationSet;
    /**
     * Indicates whether the VPC is the default VPC.
     */
    IsDefault?: Boolean;
    /**
     * Any tags assigned to the VPC.
     */
    Tags?: TagList;
  }
  export interface VpcAttachment {
    /**
     * The current state of the attachment.
     */
    State?: AttachmentStatus;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type VpcAttachmentList = VpcAttachment[];
  export type VpcAttributeName = "enableDnsSupport"|"enableDnsHostnames"|string;
  export interface VpcCidrBlockAssociation {
    /**
     * The association ID for the IPv4 CIDR block.
     */
    AssociationId?: String;
    /**
     * The IPv4 CIDR block.
     */
    CidrBlock?: String;
    /**
     * Information about the state of the CIDR block.
     */
    CidrBlockState?: VpcCidrBlockState;
  }
  export type VpcCidrBlockAssociationSet = VpcCidrBlockAssociation[];
  export interface VpcCidrBlockState {
    /**
     * The state of the CIDR block.
     */
    State?: VpcCidrBlockStateCode;
    /**
     * A message about the status of the CIDR block, if applicable.
     */
    StatusMessage?: String;
  }
  export type VpcCidrBlockStateCode = "associating"|"associated"|"disassociating"|"disassociated"|"failing"|"failed"|string;
  export interface VpcClassicLink {
    /**
     * Indicates whether the VPC is enabled for ClassicLink.
     */
    ClassicLinkEnabled?: Boolean;
    /**
     * Any tags assigned to the VPC.
     */
    Tags?: TagList;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
  }
  export type VpcClassicLinkIdList = String[];
  export type VpcClassicLinkList = VpcClassicLink[];
  export interface VpcEndpoint {
    /**
     * The ID of the VPC endpoint.
     */
    VpcEndpointId?: String;
    /**
     * The type of endpoint.
     */
    VpcEndpointType?: VpcEndpointType;
    /**
     * The ID of the VPC to which the endpoint is associated.
     */
    VpcId?: String;
    /**
     * The name of the service to which the endpoint is associated.
     */
    ServiceName?: String;
    /**
     * The state of the VPC endpoint.
     */
    State?: State;
    /**
     * The policy document associated with the endpoint, if applicable.
     */
    PolicyDocument?: String;
    /**
     * (Gateway endpoint) One or more route tables associated with the endpoint.
     */
    RouteTableIds?: ValueStringList;
    /**
     * (Interface endpoint) One or more subnets in which the endpoint is located.
     */
    SubnetIds?: ValueStringList;
    /**
     * (Interface endpoint) Information about the security groups associated with the network interface.
     */
    Groups?: GroupIdentifierSet;
    /**
     * (Interface endpoint) Indicates whether the VPC is associated with a private hosted zone.
     */
    PrivateDnsEnabled?: Boolean;
    /**
     * (Interface endpoint) One or more network interfaces for the endpoint.
     */
    NetworkInterfaceIds?: ValueStringList;
    /**
     * (Interface endpoint) The DNS entries for the endpoint.
     */
    DnsEntries?: DnsEntrySet;
    /**
     * The date and time the VPC endpoint was created.
     */
    CreationTimestamp?: DateTime;
  }
  export interface VpcEndpointConnection {
    /**
     * The ID of the service to which the endpoint is connected.
     */
    ServiceId?: String;
    /**
     * The ID of the VPC endpoint.
     */
    VpcEndpointId?: String;
    /**
     * The AWS account ID of the owner of the VPC endpoint.
     */
    VpcEndpointOwner?: String;
    /**
     * The state of the VPC endpoint.
     */
    VpcEndpointState?: State;
    /**
     * The date and time the VPC endpoint was created.
     */
    CreationTimestamp?: DateTime;
  }
  export type VpcEndpointConnectionSet = VpcEndpointConnection[];
  export type VpcEndpointSet = VpcEndpoint[];
  export type VpcEndpointType = "Interface"|"Gateway"|string;
  export type VpcIdStringList = String[];
  export interface VpcIpv6CidrBlockAssociation {
    /**
     * The association ID for the IPv6 CIDR block.
     */
    AssociationId?: String;
    /**
     * The IPv6 CIDR block.
     */
    Ipv6CidrBlock?: String;
    /**
     * Information about the state of the CIDR block.
     */
    Ipv6CidrBlockState?: VpcCidrBlockState;
  }
  export type VpcIpv6CidrBlockAssociationSet = VpcIpv6CidrBlockAssociation[];
  export type VpcList = Vpc[];
  export interface VpcPeeringConnection {
    /**
     * Information about the accepter VPC. CIDR block information is only returned when describing an active VPC peering connection.
     */
    AccepterVpcInfo?: VpcPeeringConnectionVpcInfo;
    /**
     * The time that an unaccepted VPC peering connection will expire.
     */
    ExpirationTime?: DateTime;
    /**
     * Information about the requester VPC. CIDR block information is only returned when describing an active VPC peering connection.
     */
    RequesterVpcInfo?: VpcPeeringConnectionVpcInfo;
    /**
     * The status of the VPC peering connection.
     */
    Status?: VpcPeeringConnectionStateReason;
    /**
     * Any tags assigned to the resource.
     */
    Tags?: TagList;
    /**
     * The ID of the VPC peering connection.
     */
    VpcPeeringConnectionId?: String;
  }
  export type VpcPeeringConnectionList = VpcPeeringConnection[];
  export interface VpcPeeringConnectionOptionsDescription {
    /**
     * Indicates whether a local VPC can resolve public DNS hostnames to private IP addresses when queried from instances in a peer VPC.
     */
    AllowDnsResolutionFromRemoteVpc?: Boolean;
    /**
     * Indicates whether a local ClassicLink connection can communicate with the peer VPC over the VPC peering connection.
     */
    AllowEgressFromLocalClassicLinkToRemoteVpc?: Boolean;
    /**
     * Indicates whether a local VPC can communicate with a ClassicLink connection in the peer VPC over the VPC peering connection.
     */
    AllowEgressFromLocalVpcToRemoteClassicLink?: Boolean;
  }
  export interface VpcPeeringConnectionStateReason {
    /**
     * The status of the VPC peering connection.
     */
    Code?: VpcPeeringConnectionStateReasonCode;
    /**
     * A message that provides more information about the status, if applicable.
     */
    Message?: String;
  }
  export type VpcPeeringConnectionStateReasonCode = "initiating-request"|"pending-acceptance"|"active"|"deleted"|"rejected"|"failed"|"expired"|"provisioning"|"deleting"|string;
  export interface VpcPeeringConnectionVpcInfo {
    /**
     * The IPv4 CIDR block for the VPC.
     */
    CidrBlock?: String;
    /**
     * The IPv6 CIDR block for the VPC.
     */
    Ipv6CidrBlockSet?: Ipv6CidrBlockSet;
    /**
     * Information about the IPv4 CIDR blocks for the VPC.
     */
    CidrBlockSet?: CidrBlockSet;
    /**
     * The AWS account ID of the VPC owner.
     */
    OwnerId?: String;
    /**
     * Information about the VPC peering connection options for the accepter or requester VPC.
     */
    PeeringOptions?: VpcPeeringConnectionOptionsDescription;
    /**
     * The ID of the VPC.
     */
    VpcId?: String;
    /**
     * The region in which the VPC is located.
     */
    Region?: String;
  }
  export type VpcState = "pending"|"available"|string;
  export type VpcTenancy = "default"|string;
  export interface VpnConnection {
    /**
     * The configuration information for the VPN connection's customer gateway (in the native XML format). This element is always present in the CreateVpnConnection response; however, it's present in the DescribeVpnConnections response only if the VPN connection is in the pending or available state.
     */
    CustomerGatewayConfiguration?: String;
    /**
     * The ID of the customer gateway at your end of the VPN connection.
     */
    CustomerGatewayId?: String;
    /**
     * The category of the VPN connection. A value of VPN indicates an AWS VPN connection. A value of VPN-Classic indicates an AWS Classic VPN connection. For more information, see AWS Managed VPN Categories in the Amazon Virtual Private Cloud User Guide.
     */
    Category?: String;
    /**
     * The current state of the VPN connection.
     */
    State?: VpnState;
    /**
     * The type of VPN connection.
     */
    Type?: GatewayType;
    /**
     * The ID of the VPN connection.
     */
    VpnConnectionId?: String;
    /**
     * The ID of the virtual private gateway at the AWS side of the VPN connection.
     */
    VpnGatewayId?: String;
    /**
     * The VPN connection options.
     */
    Options?: VpnConnectionOptions;
    /**
     * The static routes associated with the VPN connection.
     */
    Routes?: VpnStaticRouteList;
    /**
     * Any tags assigned to the VPN connection.
     */
    Tags?: TagList;
    /**
     * Information about the VPN tunnel.
     */
    VgwTelemetry?: VgwTelemetryList;
  }
  export type VpnConnectionIdStringList = String[];
  export type VpnConnectionList = VpnConnection[];
  export interface VpnConnectionOptions {
    /**
     * Indicates whether the VPN connection uses static routes only. Static routes must be used for devices that don't support BGP.
     */
    StaticRoutesOnly?: Boolean;
  }
  export interface VpnConnectionOptionsSpecification {
    /**
     * Indicate whether the VPN connection uses static routes only. If you are creating a VPN connection for a device that does not support BGP, you must specify true. Use CreateVpnConnectionRoute to create a static route. Default: false 
     */
    StaticRoutesOnly?: Boolean;
    /**
     * The tunnel options for the VPN connection.
     */
    TunnelOptions?: TunnelOptionsList;
  }
  export interface VpnGateway {
    /**
     * The Availability Zone where the virtual private gateway was created, if applicable. This field may be empty or not returned.
     */
    AvailabilityZone?: String;
    /**
     * The current state of the virtual private gateway.
     */
    State?: VpnState;
    /**
     * The type of VPN connection the virtual private gateway supports.
     */
    Type?: GatewayType;
    /**
     * Any VPCs attached to the virtual private gateway.
     */
    VpcAttachments?: VpcAttachmentList;
    /**
     * The ID of the virtual private gateway.
     */
    VpnGatewayId?: String;
    /**
     * The private Autonomous System Number (ASN) for the Amazon side of a BGP session.
     */
    AmazonSideAsn?: Long;
    /**
     * Any tags assigned to the virtual private gateway.
     */
    Tags?: TagList;
  }
  export type VpnGatewayIdStringList = String[];
  export type VpnGatewayList = VpnGateway[];
  export type VpnState = "pending"|"available"|"deleting"|"deleted"|string;
  export interface VpnStaticRoute {
    /**
     * The CIDR block associated with the local subnet of the customer data center.
     */
    DestinationCidrBlock?: String;
    /**
     * Indicates how the routes were provided.
     */
    Source?: VpnStaticRouteSource;
    /**
     * The current state of the static route.
     */
    State?: VpnState;
  }
  export type VpnStaticRouteList = VpnStaticRoute[];
  export type VpnStaticRouteSource = "Static"|string;
  export interface VpnTunnelOptionsSpecification {
    /**
     * The range of inside IP addresses for the tunnel. Any specified CIDR blocks must be unique across all VPN connections that use the same virtual private gateway.  Constraints: A size /30 CIDR block from the 169.254.0.0/16 range. The following CIDR blocks are reserved and cannot be used:    169.254.0.0/30     169.254.1.0/30     169.254.2.0/30     169.254.3.0/30     169.254.4.0/30     169.254.5.0/30     169.254.169.252/30   
     */
    TunnelInsideCidr?: String;
    /**
     * The pre-shared key (PSK) to establish initial authentication between the virtual private gateway and customer gateway. Constraints: Allowed characters are alphanumeric characters and ._. Must be between 8 and 64 characters in length and cannot start with zero (0).
     */
    PreSharedKey?: String;
  }
  export type ZoneNameStringList = String[];
  export type scope = "Availability Zone"|"Region"|string;
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2013-06-15"|"2013-10-15"|"2014-02-01"|"2014-05-01"|"2014-06-15"|"2014-09-01"|"2014-10-01"|"2015-03-01"|"2015-04-15"|"2015-10-01"|"2016-04-01"|"2016-09-15"|"2016-11-15"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the EC2 client.
   */
  export import Types = EC2;
}
export = EC2;

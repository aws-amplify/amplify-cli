type GetEnvironmentNetworkInfoParams = {
    stackName: string;
    vpcName: string;
    vpcCidr: string;
    subnetMask: number;
    subnetsCount: number;
};
export declare function getEnvironmentNetworkInfo(context: any, params: GetEnvironmentNetworkInfoParams): Promise<{
    vpcId: string;
    internetGatewayId: string;
    subnetCidrs: Map<string, string>;
}>;
export {};
//# sourceMappingURL=environment-info.d.ts.map
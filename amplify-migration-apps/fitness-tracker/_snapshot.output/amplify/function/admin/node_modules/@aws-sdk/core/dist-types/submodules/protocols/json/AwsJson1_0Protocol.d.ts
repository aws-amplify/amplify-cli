import { AwsJsonRpcProtocol } from "./AwsJsonRpcProtocol";
import type { JsonCodec } from "./JsonCodec";
/**
 * @public
 * @see https://smithy.io/2.0/aws/protocols/aws-json-1_1-protocol.html#differences-between-awsjson1-0-and-awsjson1-1
 */
export declare class AwsJson1_0Protocol extends AwsJsonRpcProtocol {
    constructor({ defaultNamespace, serviceTarget, awsQueryCompatible, jsonCodec, }: {
        defaultNamespace: string;
        serviceTarget: string;
        awsQueryCompatible?: boolean;
        jsonCodec?: JsonCodec;
    });
    getShapeId(): string;
    protected getJsonRpcVersion(): "1.0";
    /**
     * @override
     */
    protected getDefaultContentType(): string;
}

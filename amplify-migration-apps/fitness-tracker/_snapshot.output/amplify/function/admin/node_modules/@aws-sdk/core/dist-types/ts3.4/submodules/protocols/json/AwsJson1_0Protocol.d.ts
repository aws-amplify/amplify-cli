import { AwsJsonRpcProtocol } from "./AwsJsonRpcProtocol";
import { JsonCodec } from "./JsonCodec";
export declare class AwsJson1_0Protocol extends AwsJsonRpcProtocol {
  constructor({
    defaultNamespace,
    serviceTarget,
    awsQueryCompatible,
    jsonCodec,
  }: {
    defaultNamespace: string;
    serviceTarget: string;
    awsQueryCompatible?: boolean;
    jsonCodec?: JsonCodec;
  });
  getShapeId(): string;
  protected getJsonRpcVersion(): "1.0";
  protected getDefaultContentType(): string;
}

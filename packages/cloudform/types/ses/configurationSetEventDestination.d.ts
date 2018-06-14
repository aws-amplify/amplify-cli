import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class EventDestination {
    CloudWatchDestination?: CloudWatchDestination;
    Enabled?: Value<boolean>;
    MatchingEventTypes: List<Value<string>>;
    Name?: Value<string>;
    KinesisFirehoseDestination?: KinesisFirehoseDestination;
    constructor(properties: EventDestination);
}
export declare class CloudWatchDestination {
    DimensionConfigurations?: List<DimensionConfiguration>;
    constructor(properties: CloudWatchDestination);
}
export declare class KinesisFirehoseDestination {
    IAMRoleARN: Value<string>;
    DeliveryStreamARN: Value<string>;
    constructor(properties: KinesisFirehoseDestination);
}
export declare class DimensionConfiguration {
    DimensionValueSource: Value<string>;
    DefaultDimensionValue: Value<string>;
    DimensionName: Value<string>;
    constructor(properties: DimensionConfiguration);
}
export interface ConfigurationSetEventDestinationProperties {
    ConfigurationSetName: Value<string>;
    EventDestination: EventDestination;
}
export default class ConfigurationSetEventDestination extends ResourceBase {
    static EventDestination: typeof EventDestination;
    static CloudWatchDestination: typeof CloudWatchDestination;
    static KinesisFirehoseDestination: typeof KinesisFirehoseDestination;
    static DimensionConfiguration: typeof DimensionConfiguration;
    constructor(properties?: ConfigurationSetEventDestinationProperties);
}

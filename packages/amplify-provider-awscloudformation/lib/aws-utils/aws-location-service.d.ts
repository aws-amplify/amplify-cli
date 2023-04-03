import { $TSContext } from 'amplify-cli-core';
import * as AWS from 'aws-sdk';
export declare class LocationService {
    private static instance;
    readonly client: AWS.Location;
    static getInstance(context: $TSContext, options?: {}): Promise<LocationService>;
    private constructor();
}
//# sourceMappingURL=aws-location-service.d.ts.map
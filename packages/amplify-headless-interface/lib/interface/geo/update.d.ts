import { AccessType } from './add';
export interface UpdateGeoRequest {
    version: 1;
    serviceModification: GeoServiceModification;
}
export type GeoServiceModification = BaseGeoServiceModification & MapModification;
export interface BaseGeoServiceModification {
    serviceName: string;
    name: string;
    setAsDefault: boolean;
    accessType: AccessType;
}
export interface MapModification {
    serviceName: 'Map';
}
//# sourceMappingURL=update.d.ts.map
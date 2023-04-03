import { ResourceParameters } from './resourceParams';
export type PlaceIndexParameters = ResourceParameters & {
    dataSourceIntendedUse: DataSourceIntendedUse;
    groupPermissions: string[];
};
export declare enum DataSourceIntendedUse {
    SingleUse = "SingleUse",
    Storage = "Storage"
}
export declare const isCompletePlaceIndexParams: (partial: Partial<PlaceIndexParameters>) => partial is PlaceIndexParameters;
export declare const convertToCompletePlaceIndexParams: (partial: Partial<PlaceIndexParameters>) => PlaceIndexParameters;
//# sourceMappingURL=placeIndexParams.d.ts.map
import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface DashboardProperties {
    DashboardName?: Value<string>;
    DashboardBody: Value<string>;
}
export default class Dashboard extends ResourceBase {
    constructor(properties?: DashboardProperties);
}

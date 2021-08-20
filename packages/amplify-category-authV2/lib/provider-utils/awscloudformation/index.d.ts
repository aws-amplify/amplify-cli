export function addResource(context: any, service: any): Promise<string>;
export function updateResource(
  context: any,
  {
    service,
  }: {
    service: any;
  },
): Promise<string>;
export function updateConfigOnEnvInit(context: any, category: any, service: any): Promise<{} | undefined>;
export function migrate(context: any): Promise<void>;
export function console(context: any, amplifyMeta: any): Promise<void>;
export function getPermissionPolicies(context: any, service: any, resourceName: any, crudOptions: any): any;
import { importResource } from './import';
export { importResource };
//# sourceMappingURL=index.d.ts.map

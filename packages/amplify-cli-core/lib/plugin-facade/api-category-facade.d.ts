import { DeploymentResources } from '@aws-amplify/graphql-transformer-interfaces';
import { $TSAny, $TSContext } from '..';
export declare class ApiCategoryFacade {
    static getTransformerVersion(context: $TSContext): Promise<number>;
    static getDirectiveDefinitions(context: $TSContext, resourceDir: string): Promise<string>;
    static transformGraphQLSchema(context: $TSContext, options: $TSAny): Promise<DeploymentResources | undefined>;
}
//# sourceMappingURL=api-category-facade.d.ts.map
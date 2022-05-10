import { DeploymentResources as DeploymentResourcesV2 } from "@aws-amplify/graphql-transformer-core";
import { DeploymentResources as DeploymentResourcesV1 } from "graphql-transformer-core";
import { $TSAny, $TSContext } from "amplify-cli-core";
import { getTransformerVersion } from "../graphql-transformer-factory/transformer-version";
import { transformGraphQLSchemaV1 } from "./transform-graphql-schema-v1";
import { transformGraphQLSchemaV2 } from "./transform-graphql-schema-v2";

/**
 * Determine which transformer version is in effect, and execute the appropriate transformation.
 */
export async function transformGraphQLSchema(
  context: $TSContext,
  options: $TSAny
): Promise<DeploymentResourcesV2 | DeploymentResourcesV1 | undefined> {
  const transformerVersion = await getTransformerVersion(context);
  return transformerVersion === 2
    ? transformGraphQLSchemaV2(context, options)
    : transformGraphQLSchemaV1(context, options);
}

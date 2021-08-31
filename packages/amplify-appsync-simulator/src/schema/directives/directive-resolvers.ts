import { getDirectives, MapperKind, mapSchema } from '@graphql-tools/utils';
import { GraphQLSchema } from 'graphql/type';
import { AwsSubscribe } from './aws-subscribe';
import { AppSyncSimulatorDirectiveBase } from './directive-base';

export function attachDirectiveResolvers(
  schema: GraphQLSchema,
  directiveResolvers: Record<string, AppSyncSimulatorDirectiveBase>,
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig, fieldName) {
      const newFieldConfig = { ...fieldConfig };
      const directives = getDirectives(schema, fieldConfig);
      for (const directive of directives) {
        const directiveName = directive.name;
        if (directiveResolvers[directiveName]) {
          const mutationField = schema.getMutationType().getFields();
          directive.args.mutations.forEach(mutation => {
            const m = mutationField[mutation];
            if (m && m.resolve) {
              const resolve = m.resolve;
              m.resolve = async (...rest) => {
                const result = await resolve(...rest);
                AwsSubscribe.simulatorContext.pubsub.publish(fieldName, result);
                return result;
              };
            }
          });
        }
      }

      return newFieldConfig;
    },
  });
}

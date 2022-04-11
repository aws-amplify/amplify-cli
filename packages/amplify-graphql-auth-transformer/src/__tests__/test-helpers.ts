import { FeatureFlagProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  ObjectTypeDefinitionNode, FieldDefinitionNode, DocumentNode, Kind,
} from 'graphql';

/**
 * Gets a type from Doc Node
 */
export const getObjectType = (
  doc: DocumentNode,
  type: string,
):
  ObjectTypeDefinitionNode
  | undefined => doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;

/**
 * Gets a field from a Def Node
 */
export const getField = (
  obj: ObjectTypeDefinitionNode,
  fieldName: string,
): FieldDefinitionNode | void => obj.fields?.find(f => f.name.value === fieldName);

/**
 * Merges passed in feature flags with default feature flags for tests
 */
export const featureFlags: FeatureFlagProvider = {
  getBoolean: (value: string): boolean => {
    if (value === 'useSubUsernameForDefaultIdentityClaim') {
      return true;
    }
    return false;
  },
  getString: () => '',
  getNumber: () => 0,
  getObject: () => ({} as any), // eslint-disable-line @typescript-eslint/no-explicit-any
};

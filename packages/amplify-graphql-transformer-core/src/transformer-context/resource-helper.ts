import { GraphQLAPIProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter, Token } from '@aws-cdk/core';
import { StackManager } from './stack-manager';
import md5 from 'md5';
import { ModelResourceIDs } from 'graphql-transformer-common';
import {
  CurrentFieldName,
  OriginalFieldName,
  ResolverKey,
  ResolverMapEntry,
} from '@aws-amplify/graphql-transformer-interfaces/src/transformer-context/resource-resource-provider';

export class TransformerResourceHelper implements TransformerResourceHelperProvider {
  api?: GraphQLAPIProvider;
  readonly #modelNameMap = new Map<string, string>();
  readonly #fieldNameMap = new Map<string, string>();
  readonly #resolverMapRegistry = new Map<ResolverKey, ResolverMapEntry>();

  constructor(private stackManager: StackManager) {
    ModelResourceIDs.setModelNameMap(this.#modelNameMap);
  }
  generateTableName = (modelName: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    const baseName = this.#modelNameMap.get(modelName) ?? modelName;
    return `${baseName}-${apiId}-${env}`;
  };

  public generateIAMRoleName = (name: string): string => {
    if (!this.api) {
      throw new Error('API not initialized');
    }
    this.ensureEnv();
    const env = (this.stackManager.getParameter('env') as CfnParameter).valueAsString;
    const apiId = this.api!.apiId;
    // 38 = 26(apiId) + 10(env) + 2(-)
    const shortName = `${Token.isUnresolved(name) ? name : name.slice(0, 64 - 38 - 6)}${md5(name).slice(0, 6)}`;
    return `${shortName}-${apiId}-${env}`; // max of 64.
  };

  bind(api: GraphQLAPIProvider) {
    this.api = api;
  }

  setModelNameMapping = (modelName: string, mappedName: string) => {
    this.#modelNameMap.set(modelName, mappedName);
  };

  getModelNameMapping = (modelName: string) => this.#modelNameMap.get(modelName) ?? modelName;

  isModelRenamed = (modelName: string) => this.#modelNameMap.get(modelName) !== modelName;

  /**
   * The only way to set a field name mapping is through addResolverFieldMapEntry
   */
  private setFieldNameMapping = (modelName: string, fieldName: string, mappedFieldName: string) => {
    this.#fieldNameMap.set(this.fieldNameKey(modelName, fieldName), mappedFieldName);
  };

  getFieldNameMapping = (modelName: string, fieldName: string) =>
    this.#fieldNameMap.get(this.fieldNameKey(modelName, fieldName)) ?? fieldName;

  /**
   * @param typeName The GraphQL type name of the resolver (Query, Mutation, ModelName, etc). Note that this is not the same as the modelName
   * @param fieldName The GraphQL field name of the resolver. Note this is not the renamed field
   * @param modelName The GraphQL model with the renamed field
   * @param newEntry The mapping of "current field name" => "original field name"
   * @param isResultList Whether the result resolver should expect a list or not
   */
  addResolverFieldMapEntry = (
    typeName: string,
    fieldName: string,
    modelName: string,
    newEntry: [CurrentFieldName, OriginalFieldName],
    isResultList = false,
  ) => {
    const key = makeResolverKey(typeName, fieldName);
    if (this.#resolverMapRegistry.has(key)) {
      const entry = this.#resolverMapRegistry.get(key)!;
      if (entry.isResultList !== isResultList) {
        throw new Error(`isResultList for ${key} already set to ${entry.isResultList}`);
      }
      entry.fieldMap.set(newEntry[0], newEntry[1]);
    } else {
      this.#resolverMapRegistry.set(key, {
        resolverTypeName: typeName,
        resolverFieldName: fieldName,
        fieldMap: new Map([newEntry]),
        isResultList,
      });
    }
    this.setFieldNameMapping(modelName, newEntry[0], newEntry[1]);
  };

  getResolverMapRegistry = (): Map<ResolverKey, ResolverMapEntry> => this.#resolverMapRegistry;

  private fieldNameKey = (modelName: string, fieldName: string) => `${modelName}.${fieldName}`;

  private ensureEnv = (): void => {
    if (!this.stackManager.getParameter('env')) {
      this.stackManager.addParameter('env', {
        type: 'String',
        default: 'NONE',
      });
    }
  };
}

const makeResolverKey = (typeName: string, fieldName: string): ResolverKey => `${typeName}.${fieldName}`;
